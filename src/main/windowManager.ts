import { BrowserWindow } from "electron";
import type { DisplayInfo } from "../shared/display";

let setupWindow: BrowserWindow | null = null;
// Map de role -> BrowserWindow (soporta "main" y "stage")
const outputWindows = new Map<string, BrowserWindow>();

let _outputUrl = "";
let _preloadPath = "";

export function initWindowManager(outputUrl: string, preloadPath: string) {
  _outputUrl = outputUrl;
  _preloadPath = preloadPath;
}

export function createSetupWindow(loadUrl: string, preloadPath: string): BrowserWindow {
  if (setupWindow) {
    setupWindow.show();
    return setupWindow;
  }

  setupWindow = new BrowserWindow({
    width: 1200,
    height: 720,
    resizable: true,
    backgroundColor: "#101010",
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true
    }
  });

  setupWindow.loadURL(loadUrl);
  setupWindow.once("ready-to-show", () => setupWindow?.show());
  setupWindow.on("closed", () => { setupWindow = null; });

  return setupWindow;
}

export function openOutputWindowForRole(display: DisplayInfo, role: string): BrowserWindow {
  // Cerrar ventana previa del mismo role si existe
  const existing = outputWindows.get(role);
  if (existing && !existing.isDestroyed()) {
    existing.close();
  }

  const { bounds } = display;

  const win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false,
    fullscreen: true,
    kiosk: true,
    autoHideMenuBar: true,
    backgroundColor: "#000000",
    show: false,
    webPreferences: {
      preload: _preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      autoplayPolicy: "no-user-gesture-required"
    }
  });

  win.loadURL(_outputUrl);
  win.once("ready-to-show", () => win.show());
  win.on("closed", () => { outputWindows.delete(role); });

  outputWindows.set(role, win);
  console.log(`[WM] Opened kiosk window for role "${role}" on display ${display.id}`);
  return win;
}

// Mantener compatibilidad con ipc.ts existente
export function createOutputWindow(loadUrl: string, preloadPath: string, display: DisplayInfo): BrowserWindow {
  _outputUrl = loadUrl;
  _preloadPath = preloadPath;
  return openOutputWindowForRole(display, "main");
}

export function closeOutputWindow() {
  outputWindows.forEach((win) => { if (!win.isDestroyed()) win.close(); });
  outputWindows.clear();
}

export function getRoleForWebContents(webContentsId: number): string | null {
  for (const [role, win] of outputWindows) {
    if (!win.isDestroyed() && win.webContents.id === webContentsId) return role;
  }
  return null;
}

export function sendToOutputWindow(role: string, channel: string, ...args: unknown[]) {
  const win = outputWindows.get(role);
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, ...args);
  } else {
    console.warn(`[WM] No window for role "${role}" — slide not delivered`);
  }
}

import { BrowserWindow } from "electron";
import type { DisplayInfo } from "../shared/display";

let setupWindow: BrowserWindow | null = null;
let outputWindow: BrowserWindow | null = null;

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
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true
    }
  });

  setupWindow.loadURL(loadUrl);

  setupWindow.on("closed", () => {
    setupWindow = null;
  });

  return setupWindow;
}

export function createOutputWindow(loadUrl: string, preloadPath: string, display: DisplayInfo): BrowserWindow {
  closeOutputWindow();

  const { bounds } = display;

  outputWindow = new BrowserWindow({
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
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  outputWindow.loadURL(loadUrl);

  outputWindow.once("ready-to-show", () => {
    if (outputWindow) {
      outputWindow.show();
    }
  });

  outputWindow.on("closed", () => {
    outputWindow = null;
  });

  return outputWindow;
}

export function closeOutputWindow() {
  if (outputWindow && !outputWindow.isDestroyed()) {
    outputWindow.close();
  }
}

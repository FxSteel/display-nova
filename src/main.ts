import path from "path";
import { app, BrowserWindow, Tray, Menu, nativeImage, screen as electronScreen } from "electron";
import { createSetupWindow, initWindowManager, openOutputWindowForRole, sendToOutputWindow } from "./main/windowManager";
import { registerIpcHandlers } from "./main/ipc";
import { startWsServer } from "./main/wsServer";
import type { SlideData, DisplayMode } from "./shared/display";
import type { ScreenAssignment } from "./main/wsServer";

const isDev = process.env.NODE_ENV !== "production";
const rendererDevServer = "http://localhost:5173";

let tray: Tray | null = null;

function rendererUrl(screen?: "setup" | "output") {
  const base = isDev ? rendererDevServer : `file://${path.join(__dirname, "../renderer/index.html")}`;
  return screen === "output" ? `${base}?screen=output` : base;
}

function preloadUrl() {
  return path.join(__dirname, "./preload/preload.js");
}

function createTray(preloadPath: string) {
  const icon = nativeImage.createFromNamedImage("NSImageNameComputer", [16, 16]);
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip("NOVA Display");

  const menu = Menu.buildFromTemplate([
    { label: "NOVA Display", enabled: false },
    { type: "separator" },
    { label: "Abrir Setup", click: () => createSetupWindow(rendererUrl("setup"), preloadUrl()) },
    { type: "separator" },
    { label: "Salir", click: () => app.quit() }
  ]);

  tray.setContextMenu(menu);
  tray.on("click", () => createSetupWindow(rendererUrl("setup"), preloadUrl()));
}

function onSlide(slide: SlideData, role: string) {
  console.log(`[Main] Forwarding slide to role="${role}"`);
  sendToOutputWindow(role, "nova:slide", slide);
}

function onAssignScreen(assignment: ScreenAssignment, respond: () => void) {
  const { screenId, role } = assignment;
  const display = electronScreen.getAllDisplays().find((d) => String(d.id) === screenId);

  if (!display) {
    console.warn(`[Main] Display "${screenId}" not found`);
    return;
  }

  const displayInfo = {
    id: display.id,
    bounds: display.bounds,
    size: display.size,
    scaleFactor: display.scaleFactor,
    isPrimary: display.id === electronScreen.getPrimaryDisplay().id
  };

  openOutputWindowForRole(displayInfo, role);
  respond();
}

function onDisplayMode(displayMode: DisplayMode) {
  console.log(`[Main] display-mode → ${displayMode.mode}`);
  // Broadcast a todas las ventanas de output
  sendToOutputWindow("main", "nova:displayMode", displayMode);
  sendToOutputWindow("stage", "nova:displayMode", displayMode);
}

async function bootstrap() {
  app.setActivationPolicy("accessory");

  const preloadPath = preloadUrl();
  initWindowManager(rendererUrl("output"), preloadPath);
  createSetupWindow(rendererUrl("setup"), preloadPath);
  registerIpcHandlers(rendererUrl("output"), preloadPath);
  startWsServer(onSlide, onAssignScreen, onDisplayMode);
  createTray(preloadPath);
}

app.whenReady().then(bootstrap);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createSetupWindow(rendererUrl("setup"), preloadUrl());
  }
});

app.on("window-all-closed", () => {
  // no-op: el Tray mantiene la app viva
});

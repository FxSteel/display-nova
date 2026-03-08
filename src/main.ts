import path from "path";
import { app, BrowserWindow, Tray, Menu, nativeImage, screen as electronScreen, ipcMain } from "electron";
import { createSetupWindow, initWindowManager, openOutputWindowForRole, sendToOutputWindow, getRoleForWebContents } from "./main/windowManager";
import { registerIpcHandlers } from "./main/ipc";
import { startWsServer } from "./main/wsServer";
import type { SlideData, DisplayMode, SongBackground } from "./shared/display";
import type { ScreenAssignment } from "./main/wsServer";

const isDev = !app.isPackaged;
const rendererDevServer = "http://localhost:5173";

let tray: Tray | null = null;

// Cache del último estado por rol
const lastSlide = new Map<string, SlideData>();
let lastBackground: SongBackground | null = null;
let lastMode: DisplayMode = { mode: "slide" };

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
  lastSlide.set(role, slide);
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

function onSongBackground(bg: SongBackground) {
  console.log(`[Main] song-background → ${bg.backgroundType}`);
  lastBackground = bg;
  sendToOutputWindow("main", "nova:songBackground", bg);
  sendToOutputWindow("stage", "nova:songBackground", bg);
}

function onDisplayMode(displayMode: DisplayMode) {
  console.log(`[Main] display-mode → ${displayMode.mode}`);
  lastMode = displayMode;
  sendToOutputWindow("main", "nova:displayMode", displayMode);
  sendToOutputWindow("stage", "nova:displayMode", displayMode);
}

// El renderer avisa cuando ya registró sus listeners — reenviar el último estado
ipcMain.on("nova:outputReady", (event) => {
  const role = getRoleForWebContents(event.sender.id);
  if (!role) return;
  console.log(`[Main] Output window ready for role="${role}" — replaying cached state`);

  if (lastBackground) event.sender.send("nova:songBackground", lastBackground);
  event.sender.send("nova:displayMode", lastMode);
  const slide = lastSlide.get(role);
  if (slide) event.sender.send("nova:slide", slide);
});

async function bootstrap() {
  app.setActivationPolicy("accessory");

  const preloadPath = preloadUrl();
  initWindowManager(rendererUrl("output"), preloadPath);
  createSetupWindow(rendererUrl("setup"), preloadPath);
  registerIpcHandlers(rendererUrl("output"), preloadPath);
  startWsServer(onSlide, onAssignScreen, onDisplayMode, onSongBackground);
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

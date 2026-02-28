import path from "path";
import { app, BrowserWindow } from "electron";
import { createSetupWindow } from "./windowManager";
import { registerIpcHandlers } from "./ipc";

const isDev = process.env.NODE_ENV !== "production";
const rendererDevServer = "http://localhost:5173";

function rendererUrl(screen?: "setup" | "output") {
  const base = isDev ? rendererDevServer : `file://${path.join(__dirname, "../renderer/index.html")}`;
  if (screen === "output") {
    return `${base}?screen=output`;
  }
  return base;
}

async function bootstrap() {
  const preloadPath = path.join(__dirname, "./preload/preload.js");
  createSetupWindow(rendererUrl("setup"), preloadPath);
  registerIpcHandlers(rendererUrl("output"), preloadPath);
}

app.whenReady().then(bootstrap);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const preloadPath = path.join(__dirname, "../preload/preload.js");
    createSetupWindow(rendererUrl("setup"), preloadPath);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

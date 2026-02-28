import { ipcMain } from "electron";
import { getDisplays } from "./displayManager";
import { createOutputWindow } from "./windowManager";
import type { DisplayInfo } from "../shared/display";

export function registerIpcHandlers(outputUrl: string, preloadPath: string) {
  ipcMain.handle("nova:getDisplays", () => {
    return getDisplays();
  });

  ipcMain.handle("nova:openOutput", (_event, displayId: number) => {
    const displays = getDisplays();
    const target = displays.find((display) => display.id === displayId);

    if (!target) {
      throw new Error(`Display with ID ${displayId} not found`);
    }

    createOutputWindow(outputUrl, preloadPath, target as DisplayInfo);
    return true;
  });
}

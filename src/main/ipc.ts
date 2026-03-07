import { ipcMain, screen } from "electron";
import { createOutputWindow } from "./windowManager";
import type { DisplayInfo } from "../shared/display";

function serializeDisplay(display: Electron.Display, primaryId: number): DisplayInfo {
  return {
    id: display.id,
    bounds: display.bounds,
    size: {
      width: display.size.width,
      height: display.size.height
    },
    scaleFactor: display.scaleFactor,
    isPrimary: display.id === primaryId
  };
}

function getDisplayList(): DisplayInfo[] {
  const primaryId = screen.getPrimaryDisplay().id;
  return screen.getAllDisplays().map((display) => serializeDisplay(display, primaryId));
}

export function registerIpcHandlers(outputUrl: string, preloadPath: string) {
  ipcMain.handle("nova:getDisplays", () => {
    return getDisplayList();
  });

  ipcMain.handle("nova:openOutput", (_event, displayId: number) => {
    const displays = getDisplayList();
    const target = displays.find((display) => display.id === displayId);

    if (!target) {
      throw new Error(`Display with ID ${displayId} not found`);
    }

    createOutputWindow(outputUrl, preloadPath, target as DisplayInfo);
    return true;
  });
}

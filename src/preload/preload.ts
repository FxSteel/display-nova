import { contextBridge, ipcRenderer } from "electron";
import type { DisplayInfo } from "../shared/display";

contextBridge.exposeInMainWorld("nova", {
  getDisplays: async (): Promise<DisplayInfo[]> => {
    return ipcRenderer.invoke("nova:getDisplays");
  },
  openOutput: async (displayId: number): Promise<boolean> => {
    return ipcRenderer.invoke("nova:openOutput", displayId);
  }
});

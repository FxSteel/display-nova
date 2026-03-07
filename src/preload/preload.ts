import { contextBridge, ipcRenderer } from "electron";
import type { DisplayInfo, SlideData, DisplayMode } from "../shared/display";

contextBridge.exposeInMainWorld("nova", {
  getDisplays: async (): Promise<DisplayInfo[]> => {
    return ipcRenderer.invoke("nova:getDisplays");
  },
  openOutput: async (displayId: number): Promise<boolean> => {
    return ipcRenderer.invoke("nova:openOutput", displayId);
  },
  onSlide: (callback: (slide: SlideData) => void) => {
    ipcRenderer.on("nova:slide", (_event, slide: SlideData) => callback(slide));
  },
  onDisplayMode: (callback: (mode: DisplayMode) => void) => {
    ipcRenderer.on("nova:displayMode", (_event, mode: DisplayMode) => callback(mode));
  }
});

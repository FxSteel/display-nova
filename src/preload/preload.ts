import { contextBridge, ipcRenderer } from "electron";
import type { DisplayInfo, SlideData, DisplayMode, SongBackground, DisplayMedia, StageTime, StageMessage, StageConfig } from "../shared/display";

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
  },
  onSongBackground: (callback: (bg: SongBackground) => void) => {
    ipcRenderer.on("nova:songBackground", (_event, bg: SongBackground) => callback(bg));
  },
  onDisplayMedia: (callback: (media: DisplayMedia) => void) => {
    ipcRenderer.on("nova:displayMedia", (_event, media: DisplayMedia) => callback(media));
  },
  onPreloadMedia: (callback: (media: DisplayMedia) => void) => {
    ipcRenderer.on("nova:preloadMedia", (_event, media: DisplayMedia) => callback(media));
  },
  signalReady: () => {
    ipcRenderer.send("nova:outputReady");
  },
  onStageTime: (callback: (data: StageTime) => void) => {
    ipcRenderer.on("nova:stageTime", (_event, data: StageTime) => callback(data));
  },
  onStageMessage: (callback: (data: StageMessage) => void) => {
    ipcRenderer.on("nova:stageMessage", (_event, data: StageMessage) => callback(data));
  },
  onStageConfig: (callback: (data: StageConfig) => void) => {
    ipcRenderer.on("nova:stageConfig", (_event, data: StageConfig) => callback(data));
  },
});

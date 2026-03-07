import type { DisplayInfo, SlideData, DisplayMode } from "@shared/display";

declare global {
  interface Window {
    nova: {
      getDisplays: () => Promise<DisplayInfo[]>;
      openOutput: (displayId: number) => Promise<boolean>;
      onSlide: (callback: (slide: SlideData) => void) => void;
      onDisplayMode: (callback: (mode: DisplayMode) => void) => void;
    };
  }
}

export {};

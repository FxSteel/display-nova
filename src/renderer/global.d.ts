import type { DisplayInfo, SlideData, DisplayMode, SongBackground } from "@shared/display";

declare global {
  interface Window {
    nova: {
      getDisplays: () => Promise<DisplayInfo[]>;
      openOutput: (displayId: number) => Promise<boolean>;
      onSlide: (callback: (slide: SlideData) => void) => void;
      onDisplayMode: (callback: (mode: DisplayMode) => void) => void;
      onSongBackground: (callback: (bg: SongBackground) => void) => void;
      signalReady: () => void;
    };
  }
}

export {};

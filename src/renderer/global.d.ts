import type { DisplayInfo } from "@shared/display";

declare global {
  interface Window {
    nova: {
      getDisplays: () => Promise<DisplayInfo[]>;
      openOutput: (displayId: number) => Promise<boolean>;
    };
  }
}

export {};

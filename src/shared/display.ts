export interface SlideTypography {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontWeight: number;
}

export interface SlideData {
  content?: string;
  reference?: string;
  type?: "song_slide" | "bible_verse" | string;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  fontWeight?: number;
  songTypography?: Partial<SlideTypography> | null;
}

export type DisplayMode =
  | { mode: "slide" }
  | { mode: "clear" }
  | { mode: "logo"; logoUrl: string }
  | { mode: "announcement"; announcementUrl: string };

export interface DisplayBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DisplaySize {
  width: number;
  height: number;
}

export interface DisplayInfo {
  id: number;
  bounds: DisplayBounds;
  size: DisplaySize;
  scaleFactor: number;
  isPrimary: boolean;
}

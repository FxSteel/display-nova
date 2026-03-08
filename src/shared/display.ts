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
  textAlign?: "left" | "center" | "right";
  songTypography?: Partial<SlideTypography> | null;
}

export interface SongBackground {
  backgroundType: "image" | "video" | "none";
  backgroundUrl: string | null;
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

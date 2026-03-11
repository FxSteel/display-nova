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
  contentPadding?: number;
  songTypography?: Partial<SlideTypography> | null;
  // bible_verse fields
  verseText?: string;
  displayReference?: string;
  bibleVersionName?: string;
}

export interface StageTime {
  time: string;
}

export interface StageMessage {
  message: string;
}

export interface StageConfig {
  showTime: boolean;
  showMessage: boolean;
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

/**
 * NDI output manager for NOVA Display.
 *
 * Uses koffi (FFI) to call the NDI SDK C library directly — no native
 * compilation required. NDI is silently disabled if the SDK is not installed.
 *
 * macOS SDK path (install NDI Tools from ndi.video):
 *   /usr/local/lib/libndi.dylib
 *   or /Library/NDI SDK for Apple/lib/macOS/libndi.dylib
 *
 * Windows SDK path (DLL shipped with NDI Tools):
 *   C:\Program Files\NDI\NDI 5 Tools\Processing.NDI.Lib.x64.dll
 */

import type { SlideData, SongBackground, DisplayMode } from "../shared/display";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface NdiOutput {
  id: string;
  name: string;
  sendLyrics: boolean;
  sendBackground: boolean;
  sendLogo: boolean;
}

interface NdiSenderEntry {
  /** Opaque NDI sender pointer (held as BigInt) */
  ptr: bigint;
  config: NdiOutput;
  canvas: any;
  ctx: any;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NDI_WIDTH  = 1920;
const NDI_HEIGHT = 1080;
const FOURCC_BGRA = 0x41524742; // 'B','G','R','A' little-endian

/** Locations to probe for the NDI shared library */
const NDI_LIB_PATHS = [
  // macOS (NDI Tools installer)
  "/usr/local/lib/libndi.dylib",
  "/Library/NDI SDK for Apple/lib/macOS/libndi.dylib",
  // Windows
  "C:\\Program Files\\NDI\\NDI 5 Tools\\Processing.NDI.Lib.x64.dll",
  "Processing.NDI.Lib.x64.dll",
];

// ─── Lazy-loaded state ───────────────────────────────────────────────────────

let ndi: {
  send_create: (desc: object) => bigint;
  send_destroy: (ptr: bigint) => void;
  send_video_v2: (ptr: bigint, frame: object) => void;
} | null = null;

let createCanvas: ((w: number, h: number) => any) | null = null;

const senders = new Map<string, NdiSenderEntry>();

// ─── Initialisation ──────────────────────────────────────────────────────────

function tryLoadNdi(): boolean {
  if (ndi) return true;

  let koffi: any;
  try {
    koffi = require("koffi");
  } catch {
    console.warn("[NDI] koffi not available");
    return false;
  }

  let lib: any = null;
  for (const libPath of NDI_LIB_PATHS) {
    try {
      lib = koffi.load(libPath);
      console.log(`[NDI] Loaded NDI library from: ${libPath}`);
      break;
    } catch {
      // try next path
    }
  }

  if (!lib) {
    console.warn("[NDI] NDI SDK library not found — NDI disabled");
    console.warn("[NDI] Install NDI Tools from https://ndi.video/tools/ndi-tools/");
    return false;
  }

  try {
    // NDIlib_send_create_t struct
    const SendCreateT = koffi.struct("NDIlib_send_create_t", {
      p_ndi_name:  "const char *",
      p_groups:    "const char *",
      clock_video: "bool",
      clock_audio: "bool",
    });

    // NDIlib_video_frame_v2_t struct
    const VideoFrameT = koffi.struct("NDIlib_video_frame_v2_t", {
      xres:                  "int",
      yres:                  "int",
      FourCC:                "int",
      frame_rate_N:          "int",
      frame_rate_D:          "int",
      picture_aspect_ratio:  "float",
      frame_format_type:     "int",  // 1 = progressive
      timecode:              "int64",
      p_data:                "uint8_t *",
      line_stride_in_bytes:  "int",
      p_metadata:            "const char *",
      timestamp:             "int64",
    });

    const initFn         = lib.func("NDIlib_initialize", "bool", []);
    const sendCreateFn   = lib.func("NDIlib_send_create", "void *", [koffi.pointer(SendCreateT)]);
    const sendDestroyFn  = lib.func("NDIlib_send_destroy", "void", ["void *"]);
    const sendVideoFn    = lib.func("NDIlib_send_send_video_v2", "void", ["void *", koffi.pointer(VideoFrameT)]);

    if (!initFn()) {
      console.error("[NDI] NDIlib_initialize() returned false");
      return false;
    }

    ndi = {
      send_create:  (desc) => sendCreateFn(desc),
      send_destroy: (ptr)  => sendDestroyFn(ptr),
      send_video_v2: (ptr, frame) => sendVideoFn(ptr, frame),
    };

    console.log("[NDI] NDI SDK initialized");
    return true;
  } catch (err) {
    console.error("[NDI] Failed to bind NDI functions:", err);
    return false;
  }
}

function tryLoadCanvas(): boolean {
  if (createCanvas) return true;
  try {
    createCanvas = require("canvas").createCanvas;
    return true;
  } catch {
    console.warn("[NDI] canvas module not available — NDI disabled");
    return false;
  }
}

function ensureReady(): boolean {
  return tryLoadCanvas() && tryLoadNdi();
}

// ─── Frame sending ───────────────────────────────────────────────────────────

function sendFrameFromCanvas(ptr: bigint, canvas: any) {
  if (!ndi) return;
  // node-canvas toBuffer('raw') returns BGRA via Cairo (little-endian)
  const buf: Buffer = canvas.toBuffer("raw");
  ndi.send_video_v2(ptr, {
    xres:                 NDI_WIDTH,
    yres:                 NDI_HEIGHT,
    FourCC:               FOURCC_BGRA,
    frame_rate_N:         30000,
    frame_rate_D:         1001,
    picture_aspect_ratio: NDI_WIDTH / NDI_HEIGHT,
    frame_format_type:    1,      // progressive
    timecode:             BigInt(0),
    p_data:               buf,
    line_stride_in_bytes: NDI_WIDTH * 4,
    p_metadata:           null,
    timestamp:            BigInt(0),
  });
}

function paintBlack(ctx: any) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, NDI_WIDTH, NDI_HEIGHT);
}

/** Clear to fully transparent while keeping a 1920×1080 anchor so OBS
 *  doesn't auto-crop the NDI source to the text bounding box. */
function paintTransparent(ctx: any) {
  ctx.clearRect(0, 0, NDI_WIDTH, NDI_HEIGHT);
  // Alpha = 1/255 ≈ 0.004 — invisible to the eye, but tells OBS the
  // frame is 1920×1080 and prevents auto-cropping to text bounds.
  ctx.fillStyle = "rgba(0,0,0,0.004)";
  ctx.fillRect(0, 0, NDI_WIDTH, NDI_HEIGHT);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function handleNdiConfig(outputs: NdiOutput[]) {
  if (!ensureReady()) return;

  // Destroy senders that were removed
  for (const [id, entry] of senders) {
    if (!outputs.find((o) => o.id === id)) {
      try { ndi!.send_destroy(entry.ptr); } catch {}
      senders.delete(id);
      console.log(`[NDI] Destroyed sender: ${entry.config.name}`);
    }
  }

  // Create or update
  for (const output of outputs) {
    if (senders.has(output.id)) {
      senders.get(output.id)!.config = output;
    } else {
      try {
        const ptr = ndi!.send_create({
          p_ndi_name:  output.name,
          p_groups:    null,
          clock_video: true,
          clock_audio: false,
        });
        if (!ptr) throw new Error("send_create returned null");
        const canvas = createCanvas!(NDI_WIDTH, NDI_HEIGHT);
        const ctx    = canvas.getContext("2d");
        senders.set(output.id, { ptr, config: output, canvas, ctx });
        console.log(`[NDI] Created sender: ${output.name}`);
      } catch (err) {
        console.error(`[NDI] Failed to create sender "${output.name}":`, err);
      }
    }
  }
}

export function ndiHandleSlide(slide: SlideData) {
  if (!ndi || senders.size === 0) return;

  for (const entry of senders.values()) {
    if (!entry.config.sendLyrics) continue;

    const { ctx, canvas, ptr } = entry;
    paintTransparent(ctx);

    const isBible  = slide.type === "bible_verse";
    const text     = isBible ? (slide.verseText ?? "") : (slide.content ?? "");
    if (!text) continue;

    const typo      = slide.songTypography;
    const fsScale   = typo?.fontSize ?? slide.fontSize ?? 100;
    const lh        = typo?.lineHeight ?? slide.lineHeight ?? 1.3;
    const fw        = typo?.fontWeight ?? slide.fontWeight ?? 400;
    const align     = (slide.textAlign ?? "center") as CanvasTextAlign;
    const fontSizePx = Math.round((fsScale / 100) * 5 * NDI_WIDTH / 100);

    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur  = 8;
    ctx.fillStyle   = "#FFFFFF";
    ctx.font        = `${fw} ${fontSizePx}px sans-serif`;
    ctx.textAlign   = align;
    ctx.textBaseline = "middle";

    const lines  = text.split("\n");
    const lineH  = fontSizePx * lh;
    const startY = NDI_HEIGHT / 2 - ((lines.length - 1) * lineH) / 2;
    const x      = align === "left" ? 80 : align === "right" ? NDI_WIDTH - 80 : NDI_WIDTH / 2;

    lines.forEach((line, i) => {
      ctx.fillText(line, x, startY + i * lineH);
    });

    // Bible reference
    if (isBible && slide.displayReference) {
      const refSize = Math.round(fontSizePx * 0.4);
      ctx.shadowBlur = 4;
      ctx.font       = `400 ${refSize}px sans-serif`;
      ctx.fillStyle  = "#CCCCCC";
      ctx.textAlign  = "center";
      ctx.fillText(slide.displayReference, NDI_WIDTH / 2, NDI_HEIGHT - refSize * 2);
    }

    // Reset shadow so it doesn't bleed into subsequent draws
    ctx.shadowColor = "transparent";
    ctx.shadowBlur  = 0;

    try { sendFrameFromCanvas(ptr, canvas); } catch (err) {
      console.error("[NDI] video send error:", err);
    }
  }
}

export function ndiHandleDisplayMode(mode: DisplayMode) {
  if (!ndi || senders.size === 0) return;

  if (mode.mode === "clear") {
    for (const entry of senders.values()) {
      paintTransparent(entry.ctx);
      try { sendFrameFromCanvas(entry.ptr, entry.canvas); } catch {}
    }
    return;
  }

  if (mode.mode === "logo") {
    for (const entry of senders.values()) {
      if (!entry.config.sendLogo) continue;
      paintBlack(entry.ctx);
      // TODO: load logoUrl via canvas loadImage when NDI logo is needed
      try { sendFrameFromCanvas(entry.ptr, entry.canvas); } catch {}
    }
  }
}

export function ndiHandleBackground(_bg: SongBackground) {
  if (!ndi || senders.size === 0) return;
  // Background frames are sent independently from slide frames.
  // For senders with sendBackground=true, we'd render the bg image here.
  // Currently a no-op; background is composited in the renderer instead.
}

export function destroyAllNdiSenders() {
  if (!ndi) return;
  for (const entry of senders.values()) {
    try { ndi.send_destroy(entry.ptr); } catch {}
  }
  senders.clear();
  console.log("[NDI] All senders destroyed");
}

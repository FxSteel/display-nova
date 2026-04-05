import { WebSocketServer, WebSocket } from "ws";
import { screen as electronScreen } from "electron";
import type { SlideData, DisplayMode, SongBackground, DisplayMedia, StageTime, StageMessage, StageConfig } from "../shared/display";

export interface ScreenAssignment {
  screenId: string;
  role: string;
}

let wss: WebSocketServer | null = null;
let onSlideCallback: ((slide: SlideData, role: string) => void) | null = null;
let onAssignScreenCallback: ((assignment: ScreenAssignment, respond: () => void) => void) | null = null;
let onDisplayModeCallback: ((mode: DisplayMode) => void) | null = null;
let onSongBackgroundCallback: ((bg: SongBackground) => void) | null = null;
let onNdiConfigCallback: ((outputs: unknown[]) => void) | null = null;
let onStageTimeCallback: ((data: StageTime) => void) | null = null;
let onStageMessageCallback: ((data: StageMessage) => void) | null = null;
let onDisplayMediaCallback: ((media: DisplayMedia) => void) | null = null;
let onPreloadMediaCallback: ((media: DisplayMedia) => void) | null = null;
let onStageConfigCallback: ((data: StageConfig) => void) | null = null;

function buildScreensMessage() {
  const primaryId = electronScreen.getPrimaryDisplay().id;
  const screens = electronScreen.getAllDisplays().map((d, i) => ({
    id: String(d.id),
    name: `Display ${i + 1}${d.id === primaryId ? " (Primary)" : ""}`,
    width: d.size.width,
    height: d.size.height,
    isPrimary: d.id === primaryId
  }));
  return JSON.stringify({ type: "screens-detected", payload: { screens } });
}

function broadcast(msg: string) {
  if (!wss) return;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

export function startWsServer(
  onSlide: (slide: SlideData, role: string) => void,
  onAssignScreen: (assignment: ScreenAssignment, respond: () => void) => void,
  onDisplayMode: (mode: DisplayMode) => void,
  onSongBackground: (bg: SongBackground) => void,
  onNdiConfig: (outputs: unknown[]) => void,
  onStageTime: (data: StageTime) => void,
  onStageMessage: (data: StageMessage) => void,
  onStageConfig: (data: StageConfig) => void,
  onDisplayMedia: (media: DisplayMedia) => void,
  onPreloadMedia: (media: DisplayMedia) => void
) {
  onSlideCallback = onSlide;
  onAssignScreenCallback = onAssignScreen;
  onDisplayModeCallback = onDisplayMode;
  onSongBackgroundCallback = onSongBackground;
  onNdiConfigCallback = onNdiConfig;
  onStageTimeCallback = onStageTime;
  onStageMessageCallback = onStageMessage;
  onStageConfigCallback = onStageConfig;
  onDisplayMediaCallback = onDisplayMedia;
  onPreloadMediaCallback = onPreloadMedia;

  wss = new WebSocketServer({ host: "127.0.0.1", port: 9877 });

  wss.on("connection", (ws) => {
    console.log("[WS] Client connected");
    ws.send(buildScreensMessage());

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString()) as Record<string, unknown>;
        console.log("[WS] Received:", msg.type, JSON.stringify(msg));

        if (msg.type === "get-screens") {
          ws.send(buildScreensMessage());

        } else if (msg.type === "display-slide") {
          const slide = msg.slide as SlideData;
          const role = (msg.screen as string) ?? "main";
          console.log(`[WS] display-slide → role="${role}" content="${slide?.content?.slice(0, 50)}"`);
          onSlideCallback?.(slide, role);

        } else if (msg.type === "display-mode") {
          console.log(`[WS] display-mode → mode="${msg.mode as string}"`);
          onDisplayModeCallback?.(msg as unknown as DisplayMode);

        } else if (msg.type === "song-background") {
          console.log(`[WS] song-background → type="${msg.backgroundType as string}"`);
          onSongBackgroundCallback?.(msg as unknown as SongBackground);

        } else if (msg.type === "ndi-config") {
          const outputs = (msg.outputs as unknown[]) ?? [];
          console.log(`[WS] ndi-config → ${outputs.length} output(s)`);
          onNdiConfigCallback?.(outputs);

        } else if (msg.type === "stage-time") {
          onStageTimeCallback?.({ time: msg.time as string });

        } else if (msg.type === "stage-message") {
          onStageMessageCallback?.({ message: msg.message as string });

        } else if (msg.type === "stage-config") {
          onStageConfigCallback?.({
            showTime:    msg.showTime    as boolean,
            showMessage: msg.showMessage as boolean,
          });

        } else if (msg.type === "preload-media") {
          const mediaType = msg.mediaType as "image" | "video";
          const url = msg.url as string;
          console.log(`[WS] preload-media → mediaType="${mediaType}" url="${url}"`);
          onPreloadMediaCallback?.({ mediaType, url });

        } else if (msg.type === "display-media") {
          const mediaType = msg.mediaType as "image" | "video";
          const url = msg.url as string;
          console.log(`[WS] display-media → mediaType="${mediaType}" url="${url}"`);
          onDisplayMediaCallback?.({ mediaType, url });

        } else if (msg.type === "assign-screen") {
          const screenId = msg.screenId as string;
          const role = msg.role as string;
          console.log(`[WS] assign-screen → screenId="${screenId}" role="${role}"`);
          onAssignScreenCallback?.({ screenId, role }, () => {
            ws.send(JSON.stringify({ type: "screen-assignment-confirmed", screenId, role }));
          });
        }
      } catch (err) {
        console.error("[WS] Error parsing message:", err);
      }
    });

    ws.on("close", () => {
      console.log("[WS] Client disconnected — kiosk state preserved");
      // No resetear estado: el renderer mantiene el último slide visible
    });

    ws.on("error", (err) => {
      console.error("[WS] Client error:", err.message);
      // No crashear — la conexión se cerrará sola
    });
  });

  wss.on("error", (err) => {
    console.error("[WS] Server error:", err.message);
  });

  electronScreen.on("display-added", () => broadcast(buildScreensMessage()));
  electronScreen.on("display-removed", () => broadcast(buildScreensMessage()));
  electronScreen.on("display-metrics-changed", () => broadcast(buildScreensMessage()));

  console.log("[WS] Server started on ws://127.0.0.1:9877");
}

export function stopWsServer() {
  wss?.close();
  wss = null;
}

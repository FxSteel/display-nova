import { WebSocketServer, WebSocket } from "ws";
import { screen as electronScreen } from "electron";
import type { SlideData, DisplayMode, SongBackground } from "../shared/display";

export interface ScreenAssignment {
  screenId: string;
  role: string;
}

let wss: WebSocketServer | null = null;
let onSlideCallback: ((slide: SlideData, role: string) => void) | null = null;
let onAssignScreenCallback: ((assignment: ScreenAssignment, respond: () => void) => void) | null = null;
let onDisplayModeCallback: ((mode: DisplayMode) => void) | null = null;
let onSongBackgroundCallback: ((bg: SongBackground) => void) | null = null;

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
  onSongBackground: (bg: SongBackground) => void
) {
  onSlideCallback = onSlide;
  onAssignScreenCallback = onAssignScreen;
  onDisplayModeCallback = onDisplayMode;
  onSongBackgroundCallback = onSongBackground;

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

    ws.on("close", () => console.log("[WS] Client disconnected"));
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

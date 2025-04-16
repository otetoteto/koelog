import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";

const base = new Hono();

const { upgradeWebSocket } = createNodeWebSocket({
  app: base,
});

export const app = base.get(
  "/ws",
  upgradeWebSocket((c) => {
    return {
      onOpen(evt, ws) {
        console.log("WebSocket connected");
      },
      onMessage(event, ws) {
        // event.data は ArrayBuffer 型で送信される
        const buffer = event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : null;
        if (buffer) {
          console.log("Received audio buffer:", buffer);
          // ここでバッファを保存・処理・外部サービスへ転送などが可能
        } else {
          console.log("Received non-binary message:", event.data);
        }
        // 必要に応じて応答
        // ws.send("Hello from server!");
      },
      onClose: () => {
        console.log("Connection closed");
      },
    };
  }),
);

export type App = typeof app;

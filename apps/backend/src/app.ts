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
      onMessage(event, ws) {
        console.log(`Message from client: ${event.data}`);
        ws.send("Hello from server!");
      },
      onClose: () => {
        console.log("Connection closed");
      },
    };
  }),
);

export type App = typeof app;

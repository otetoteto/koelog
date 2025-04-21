import { defineWebSocket, eventHandler } from "@tanstack/react-start/server";
import { TranscribeClient } from "./server/websocket";

const client = TranscribeClient();

const handler = eventHandler({
  handler: () => {},
  websocket: defineWebSocket({
    async open(peer) {
      console.log("WebSocket opened");
      client.start((text) => {
        peer.send(JSON.stringify({ type: "transcription", data: text }));
      });
    },
    async message(_, event) {
      if (event.data instanceof Buffer) {
        const audioData = Int16Array.from(event.data);
        client.message(audioData);
      }
    },
    async close(event) {
      client.close();
      console.log("WebSocket closed");
    },
  }),
});

export default handler;

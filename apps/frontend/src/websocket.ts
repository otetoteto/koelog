import { defineWebSocket, eventHandler } from "@tanstack/react-start/server";
import { getClient, transcribeAudio } from "./lib/transcribe";

const audioChunks: Int16Array[] = [];

const r = new ReadableStream<Int16Array>({
  async start(controller) {
    while (true) {
      if (audioChunks.length > 0) {
        const chunk = audioChunks.shift();
        if (chunk) {
          controller.enqueue(chunk);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
  },
});

const client = getClient();

async function* audioStream() {
  // @ts-ignore
  for await (const chunk of r) {
    yield chunk;
  }
}

const handler = eventHandler({
  handler: () => {},
  websocket: defineWebSocket({
    async open(peer) {
      console.log("WebSocket opened");
      transcribeAudio(client, audioStream(), (text) => {
        peer.send(JSON.stringify({ type: "transcription", data: text }));
      });
    },
    async message(peer, event) {
      if (event.data instanceof Buffer) {
        const audioData = Int16Array.from(event.data);
        audioChunks.push(audioData);
        console.log("Received audio data:", audioChunks.length);
      }
    },
    async close(event) {
      console.log(audioChunks);
      console.log("WebSocket closed");
    },
  }),
});

export default handler;

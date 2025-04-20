import { defineWebSocket, eventHandler } from "@tanstack/react-start/server";
import { getClient, transcribeAudio } from "./lib/transcribe";
import { BadRequestException } from "@aws-sdk/client-transcribe-streaming";

function set() {
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
          await new Promise((resolve) => setTimeout(resolve, 10));
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

  const controller = new AbortController();

  return {
    audioStream,
    client,
    controller,
    audioChunks,
  };
}

let state: ReturnType<typeof set> | null = null;

const handler = eventHandler({
  handler: () => {},
  websocket: defineWebSocket({
    async open(peer) {
      console.log("WebSocket opened");
      state = set();
      try {
        transcribeAudio(
          state.client,
          state.audioStream(),
          (text) => {
            peer.send(JSON.stringify({ type: "transcription", data: text }));
          },
          state.controller.signal,
        );
      } catch (error) {
        if (error instanceof BadRequestException) {
          console.log("BadRequestException", error);
        }
        console.error("Unknown Error", error);
      }
    },
    async message(peer, event) {
      if (state === null) {
        return;
      }
      if (event.data instanceof Buffer) {
        const audioData = Int16Array.from(event.data);
        state.audioChunks.push(audioData);
      }
    },
    async close(event) {
      if (state === null) {
        return;
      }
      state.controller.abort();
      console.log("WebSocket closed");
    },
  }),
});

export default handler;

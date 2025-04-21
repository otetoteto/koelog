import { BadRequestException } from "@aws-sdk/client-transcribe-streaming";
import { getClient, transcribeAudio } from "./transcribe";
import assert from "node:assert";

async function* audioStream(readable: ReadableStream<Int16Array>) {
  // @ts-ignore
  for await (const chunk of readable) {
    yield chunk;
  }
}

export function TranscribeClient() {
  const client = getClient();
  const audioChunks: Int16Array[] = [];
  let readable: ReadableStream<Int16Array> | null = null;
  let controller: AbortController | null = null;

  const start = async (onTranscription: (msg: string) => void) => {
    readable = new ReadableStream<Int16Array>({
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
    controller = new AbortController();

    try {
      await transcribeAudio(client, audioStream(readable), onTranscription, controller.signal);
    } catch (error) {
      if (error instanceof BadRequestException) {
        console.log("BadRequestException", error);
      }
      console.error("Unknown Error", error);
    }
  };

  const close = () => {
    readable?.cancel();
    controller?.abort();
    readable = null;
    controller = null;
  };

  const message = (buffer: Int16Array) => {
    assert(readable !== null, "readable is null");
    audioChunks.push(buffer);
  };

  return {
    start,
    message,
    close,
  };
}

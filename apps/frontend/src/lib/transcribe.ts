import { StartStreamTranscriptionCommand, TranscribeStreamingClient } from "@aws-sdk/client-transcribe-streaming";

export function getClient() {
  return new TranscribeStreamingClient();
}

export async function transcribeAudio(
  client: TranscribeStreamingClient,
  audioStream: AsyncIterable<Int16Array>,
  onTranscription: (text: string) => void,
) {
  const command = new StartStreamTranscriptionCommand({
    LanguageCode: "ja-JP",
    MediaEncoding: "pcm",
    MediaSampleRateHertz: 16000,
    AudioStream: transformAudioStream(audioStream),
  });

  const response = await client.send(command);
  if (response.TranscriptResultStream === undefined) {
    throw new Error("No transcript result stream");
  }

  for await (const event of response.TranscriptResultStream) {
    if (event.TranscriptEvent?.Transcript?.Results?.[0]) {
      const result = event.TranscriptEvent.Transcript.Results[0];
      console.log("[result]", result.Alternatives);
      if (!result.IsPartial) {
        const transcription = result.Alternatives?.[0]?.Transcript || "";
        if (transcription) {
          onTranscription(transcription);
        }
      }
    }
  }
}

async function* transformAudioStream(audioStream: AsyncIterable<Int16Array>) {
  for await (const chunk of audioStream) {
    yield { AudioEvent: { AudioChunk: new Uint8Array(chunk) } };
  }
}

import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { AudioInputDeviceSelect } from "~/components/AudioInputDeviceSelect";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [stopFn, setStopFn] = useState<(() => void) | null>(null);
  const [text, setText] = useState("");

  const [deviceId, setDeviceId] = useState<string | null>(null);

  const handleAudioStart = async () => {
    const stop = await startAudioStreaming(deviceId, (message) => {
      setText((prev) => prev + message);
    });
    setStopFn(() => stop);
  };
  const handleAudioStop = () => {
    if (stopFn) {
      stopFn();
      setStopFn(null);
    }
  };
  const handleAudioClear = () => {
    setText("");
  };

  const handleChangeDevice = (id: string) => {
    setDeviceId(id);
  };

  return (
    <div className="px-8 py-16 grid place-items-center grid-rows-[max-content,max-content,1fr] gap-8 h-full max-w-[960px]">
      <h1 className="text-6xl font-bold">声ログ</h1>
      <div className="grid grid-cols-[repeat(3,100px)1fr] gap-1">
        <Button disabled={stopFn !== null} onClick={handleAudioStart}>
          録音
        </Button>
        <Button disabled={stopFn === null} onClick={handleAudioStop}>
          停止
        </Button>
        <Button onClick={handleAudioClear}>クリア</Button>
        <Suspense fallback={<p>loading...</p>}>
          <AudioInputDeviceSelect value={deviceId} onChange={handleChangeDevice} />
        </Suspense>
      </div>
      <p className="border border-gray-300 rounded-lg p-4 h-full w-full">{text || "音声がここに表示されます"}</p>
    </div>
  );
}

function Button({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded cursor-pointer disabled:cursor-not-allowed text-white uppercase font-extrabold disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export async function startAudioStreaming(deviceId: string | null, onMessage: (msg: string) => void) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: deviceId ? { deviceId: { exact: deviceId } } : true,
  });
  const audioContext = new AudioContext({ sampleRate: 16000 });
  const source = audioContext.createMediaStreamSource(stream);

  // AudioWorkletProcessorの定義
  const workletCode = `
    class PCMWorkletProcessor extends AudioWorkletProcessor {
      process(inputs) {
        const input = inputs[0][0];
        if (input) {
          // Float32 -> Int16 PCM
          const pcm = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            pcm[i] = Math.max(-1, Math.min(1, input[i])) * 32767;
          }
          this.port.postMessage(pcm.buffer, [pcm.buffer]);
        }
        return true;
      }
    }
    registerProcessor('pcm-worklet-processor', PCMWorkletProcessor);
  `;
  const blob = new Blob([workletCode], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  await audioContext.audioWorklet.addModule(url);

  const workletNode = new AudioWorkletNode(audioContext, "pcm-worklet-processor");

  const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${wsProtocol}://${window.location.hostname}:${window.location.port}/ws`);

  ws.addEventListener("open", () => {
    console.log("WebSocket connected");
  });

  ws.addEventListener("message", (event) => {
    if (event.type !== "message") return;
    const parsedMessage = parseMessage(event.data);
    if (parsedMessage === null) return;
    onMessage(parsedMessage);
  });

  ws.addEventListener("close", () => {
    console.log("WebSocket closed");
  });

  // WorkletからPCMデータを受け取りWebSocketで送信
  workletNode.port.onmessage = (e) => {
    ws.send(e.data);
  };

  source.connect(workletNode);
  workletNode.connect(audioContext.destination);

  // 停止用関数を返す
  return () => {
    source.disconnect();
    workletNode.disconnect();
    audioContext.close();
    for (const track of stream.getTracks()) {
      track.stop();
    }
    ws.close();
  };
}

function parseMessage(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  try {
    const { type, data } = JSON.parse(value);
    if (type === "transcription" && typeof data === "string") {
      return data;
    }
  } catch {
    return null;
  }

  return null;
}

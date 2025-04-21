import { atom, useAtomValue } from "jotai";

const audioInputDevicesAtom = atom(async () => {
  if (typeof navigator === "undefined" || typeof navigator.mediaDevices === "undefined") {
    return {
      audioInputDevices: [],
      defaultId: "",
    };
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audioInputDevices = devices.filter((device) => device.kind === "audioinput");
  const defaultGroupId = audioInputDevices.find((device) => device.deviceId === "default")?.groupId;
  const defaultId = audioInputDevices.find(
    (device) => device.groupId === defaultGroupId && device.deviceId !== "default",
  )?.deviceId;
  if (defaultId === undefined) {
    return {
      audioInputDevices: [],
      defaultId: "",
    };
  }
  return {
    audioInputDevices: audioInputDevices.filter((device) => device.deviceId !== "default"),
    defaultId,
  };
});

export function AudioInputDeviceSelect({ value, onChange }: { value: string | null; onChange: (id: string) => void }) {
  const { audioInputDevices, defaultId } = useAtomValue(audioInputDevicesAtom);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <select
      onChange={handleChange}
      value={value ?? defaultId}
      className="px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded text-white uppercase font-extrabold"
    >
      {audioInputDevices.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label}
        </option>
      ))}
    </select>
  );
}

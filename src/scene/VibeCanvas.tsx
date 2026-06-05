import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useVibeStore } from "../store/useVibeStore";
import { audioEngine } from "../audio/AudioEngine";
import { ReactiveFramePrimer } from "../visual/reactiveFrame";
import TunnelScene from "./TunnelScene";

function AudioEngineUpdater() {
  // Sync frame loops: compute Web Audio analysers before R3F meshes update.
  useFrame(() => {
    audioEngine.update();
  });
  return null;
}

/**
 * Wires MediaRecorder to the WebGL canvas so users can capture short
 * clips of the visualization. Listens for vibetunnel:start-record /
 * vibetunnel:stop-record custom events dispatched by the HUD.
 */
function CanvasRecorder() {
  const { gl } = useThree();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const start = () => {
      try {
        const canvas = gl.domElement;
        const stream = (canvas as HTMLCanvasElement).captureStream(60);
        const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
            ? "video/webm;codecs=vp8"
            : "video/webm";
        const recorder = new MediaRecorder(stream, {
          mimeType: mime,
          videoBitsPerSecond: 6_000_000,
        });
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `vibetunnel-${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        };
        recorder.start(250);
        recorderRef.current = recorder;
      } catch (err) {
        console.error("MediaRecorder start failed", err);
        useVibeStore.getState().setIsRecording(false);
      }
    };
    const stop = () => {
      const r = recorderRef.current;
      if (r && r.state !== "inactive") {
        r.stop();
      }
      recorderRef.current = null;
    };
    window.addEventListener("vibetunnel:start-record", start);
    window.addEventListener("vibetunnel:stop-record", stop);
    return () => {
      window.removeEventListener("vibetunnel:start-record", start);
      window.removeEventListener("vibetunnel:stop-record", stop);
      stop();
    };
  }, [gl]);

  return null;
}

export default function VibeCanvas() {
  const { visualConfig } = useVibeStore();

  if (!visualConfig) return null;

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 70, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <AudioEngineUpdater />
      <ReactiveFramePrimer />
      <CanvasRecorder />
      <TunnelScene />
    </Canvas>
  );
}

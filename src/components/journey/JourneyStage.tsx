"use client";
import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { JourneyRef } from "./state";
const JourneyScene = dynamic(() => import("./JourneyScene"), { ssr: false });
const subscribeVisibility = (callback: () => void) => {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
};
class Boundary extends Component<
  { children: ReactNode; fail: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.fail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export default function JourneyStage({
  state,
  reduced,
  paused,
}: {
  state: JourneyRef;
  reduced: boolean;
  paused: boolean;
}) {
  const hidden = useSyncExternalStore(
    subscribeVisibility,
    () => document.hidden,
    () => false,
  );
  const [supported, setSupported] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const fail = useCallback(() => setFailed(true), []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const probe = document.createElement("canvas");
        const gl = probe.getContext("webgl2");
        setSupported(Boolean(gl));
        gl?.getExtension("WEBGL_lose_context")?.loseContext();
      } catch {
        setFailed(true);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div
      className="journey-stage"
      data-ready={ready && !failed}
      aria-hidden="true"
    >
      <div className="scene-fallback">
        <div className="fallback-orbit" />
        <span>THE MULTIVERSE / LOW-POWER VIEW</span>
      </div>
      {supported && !failed && (
        <Boundary fail={fail}>
          <JourneyScene
            state={state}
            reduced={reduced}
            paused={paused || hidden}
            onReady={onReady}
            onFailure={fail}
          />
        </Boundary>
      )}
      <div className="scene-shade" />
      {!ready && !failed && supported && (
        <span className="scene-loading">ASSEMBLING REALITY…</span>
      )}
    </div>
  );
}

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { JourneyRef } from "./state";

// Local elapsed time prevents jumps when pausing, hiding, or resuming the tab.
export function useJourneyTime(state: JourneyRef) {
  const time = useRef(0);
  useFrame((_, delta) => {
    if (!state.current.paused && !state.current.reduced)
      time.current += Math.min(delta, 0.05);
  });
  return time;
}

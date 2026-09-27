import gsap from "gsap";

export const initialMotion = () => ({ blast: 0, web: 0, tension: 0, smash: 0, portal: 0, portalOpen: 0, strangeGesture: 0, converge: 0, reactorCharge: 0, gammaPressure: 0 });
export type CinematicMotion = ReturnType<typeof initialMotion>;

// One reversible master score for every actor and effect. Native DOM anchors remain immediately accessible.
export function createMasterTimeline(motion: CinematicMotion) {
  return gsap.timeline({ paused: true })
    .addLabel("intro", 0).addLabel("hero", 0.2)
    .addLabel("iron", 1).addLabel("repulsor-to-web", 1.55)
    .to(motion, { reactorCharge: 1, duration: .19, ease: "power3.in" }, 1.38)
    .to(motion, { blast: 1, duration: 0.13, ease: "power2.in" }, 1.58)
    .to(motion, { blast: 0, duration: 0.23, ease: "power2.out" }, 1.71)
    .to(motion, { reactorCharge: 0, duration: .18, ease: "power2.out" }, 1.75)
    .to(motion, { web: 1, duration: 0.29, ease: "power2.inOut" }, 1.66)
    .addLabel("spider", 2)
    .to(motion, { tension: 1, duration: 0.15, ease: "power2.in" }, 2.52)
    .to(motion, { gammaPressure: 1, duration: .16, ease: "power3.in" }, 2.56)
    .addLabel("web-smash", 2.67)
    .to(motion, { smash: 1, duration: 0.11, ease: "power3.in" }, 2.67)
    .to(motion, { tension: 0, web: 0, duration: 0.19, ease: "power3.out" }, 2.78)
    .addLabel("hulk", 3)
    .to(motion, { gammaPressure: 0, duration: .24, ease: "power2.out" }, 2.91)
    .addLabel("strange-gesture", 3.52)
    .to(motion, { strangeGesture: 1, duration: .12, ease: "power2.inOut" }, 3.52)
    .to(motion, { portal: 1, duration: 0.2, ease: "none" }, 3.6)
    .addLabel("strange-portal", 3.67)
    .to(motion, { portalOpen: 1, duration: 0.18, ease: "power2.inOut" }, 3.82)
    .addLabel("mission", 4)
    .to(motion, { portal: 0, duration: 0.14, ease: "power2.out" }, 4)
    .to(motion, { converge: 1, duration: 0.4, ease: "power2.inOut" }, 4.6)
    .addLabel("registration", 5)
    .to({}, { duration: 1 }, 5);
}

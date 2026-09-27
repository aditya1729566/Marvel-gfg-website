import type { MutableRefObject } from "react";
import type { CinematicMotion } from "./timeline";
import type gsap from "gsap";
export interface ArmorInspection { open: boolean; selected: string; isolate: boolean; rotation: number; rotationX?: number; dragging?: boolean }
export function armorChanged() {
  window.dispatchEvent(new Event("armor-change"));
  window.dispatchEvent(new Event("journey-update"));
}
export function inspectArmor(state: JourneyState, part: string) {
  const armor = state.armor;
  if (!armor) return;
  if (!armor.open) { armor.open = true; armor.selected = ""; armor.isolate = false; }
  else if (armor.selected === part) { armor.selected = ""; armor.isolate = false; }
  else { armor.selected = part; armor.isolate = true; }
  armor.rotation = 0; armor.rotationX = 0;
  armorChanged();
}
export function backFromArmor(state: JourneyState) {
  if (!state.armor?.open) return;
  if (state.armor.selected) { state.armor.selected = ""; state.armor.isolate = false; }
  else state.armor.open = false;
  state.armor.rotation = 0; state.armor.rotationX = 0;
  armorChanged();
}
export interface JourneyState {
  progress: number;
  targetProgress?: number;
  score?: gsap.core.Timeline;
  cameraPosition?: [number, number, number];
  cameraQuaternion?: [number, number, number, number];
  armor?: ArmorInspection;
  armorAnchors?: Record<string, [number, number, number]>;
  pointer: [number, number];
  paused: boolean;
  reduced: boolean;
  action: number;
  actionTime: number;
  node: number;
  hovering: boolean;
  motion?: CinematicMotion;
}
export type JourneyRef = MutableRefObject<JourneyState>;
export const chapterNames = [
  "Assembly",
  "Iron Man",
  "Spider-Man",
  "Hulk",
  "Mission",
  "Register",
];
export const chapterIds = [
  "top",
  "iron-man",
  "spider-man",
  "hulk",
  "mission",
  "registration",
];
export const chapterColors = [
  "#f3b778",
  "#84e5ec",
  "#ec6262",
  "#b4f37b",
  "#b9dbe5",
  "#f3b778",
];
export const clamp = (n: number, lo = 0, hi = 1) =>
  Math.max(lo, Math.min(hi, n));
export const smooth = (lo: number, hi: number, n: number) => {
  const p = clamp((n - lo) / (hi - lo));
  return p * p * (3 - 2 * p);
};

export function journeyCamera(
  progress: number,
  reduced: boolean,
  mobile: boolean,
) {
  const chapter = Math.min(5, Math.floor(progress));
  const phase = progress - chapter;
  const passage = reduced || chapter === 5 ? 0 : smooth(0.62, 1, phase);
  const distance = mobile ? 14.5 : 11.5;
  const startY = [mobile ? 0.4 : 0.1,0.25,0,0.5,mobile ? 0.4 : 0.1,mobile ? 0.4 : 0.1];
  let x = 0,
    y = startY[chapter],
    roll = 0;
  if (!reduced) {
    if (chapter === 0 && !mobile) {
      x = Math.sin(passage * Math.PI) * 1.7;
    }
    if (chapter === 1) {
      x = Math.sin(phase * 2) * 0.6;
      y = 0.25 + phase * 0.4;
    }
    if (chapter === 2) {
      x = Math.sin(phase * Math.PI * 1.8) * 1.25;
      y = Math.sin(phase * 3) * 0.6;
      roll = Math.sin(phase * 5) * 0.055;
    }
    if (chapter === 3) {
      y = 0.5 - smooth(0, 0.2, phase) * 0.45;
      x = Math.sin(phase * 2) * 0.15;
    }
    if (chapter > 0) {
      const settle = 1 - smooth(0.83, 1, phase);
      x *= settle;
      roll *= settle;
    }
    if (chapter < 5) {
      const nextY = [
        mobile ? 0.4 : 0.1,
        0.25,
        0,
        0.5,
        mobile ? 0.4 : 0.1,
        mobile ? 0.4 : 0.1,
      ][chapter + 1];
      y += (nextY - y) * smooth(0.83, 1, phase);
    }
  }
  let z = distance - chapter * 32 - passage * 32;
  if (!reduced && chapter < 5 && phase > 0.52001) {
    // Centripetal-style Catmull-Rom dolly controls: orbit, accelerate, bank, then settle.
    const nextY=startY[chapter+1],t=clamp((phase-.52)/.48);
    const side=mobile?.35:chapter===2?2.1:chapter===3?-.45:chapter===1?-.9:.85;
    const dwell=journeyCamera(chapter+.52,false,mobile);
    // The city dives between facades; the gamma chamber lifts through its broken containment frame.
    const controls=[[dwell.x,dwell.y,0],[side,chapter===2?-1.6:chapter===3?1:.35,-4],[-side*.3,chapter===2?-.8:.3,-22],[0,nextY,-32]];
    const scaled=t*3,index=Math.min(2,Math.floor(scaled)),u=scaled-index;
    const a=controls[Math.max(0,index-1)],b=controls[index],c=controls[index+1],d=controls[Math.min(3,index+2)];
    const point=[0,1,2].map(k=>.5*((2*b[k])+(-a[k]+c[k])*u+(2*a[k]-5*b[k]+4*c[k]-d[k])*u*u+(-a[k]+3*b[k]-3*c[k]+d[k])*u*u*u));
    x=point[0];y=point[1];z=distance-chapter*32+point[2];
    roll=Math.sin(t*Math.PI)*(chapter===2?-.085:chapter===1?.027:.018);
  }
  return {
    chapter,
    phase,
    passage,
    x,
    y,
    roll,
    z,
  };
}

"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, events as createPointerEvents } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  PerformanceMonitor,
  Preload,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import { Gateway, IronWorld, SpiderWorld, GammaWorld, Passage } from "./CinematicWorlds";
import { journeyCamera, smooth, backFromArmor, type JourneyRef } from "./state";
import { CinematicFX } from "./CinematicFX";
import { art } from "./ArtLayers";
import { productionArmorUrl } from "./armor";

function Atmosphere({ state }: { state: JourneyRef }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(420 * 3);
    for (let i = 0; i < 420; i++) {
      values[i * 3] = Math.sin(i * 127.1) * 14;
      values[i * 3 + 1] = Math.cos(i * 311.7) * 8;
      values[i * 3 + 2] = -((i * 7.13) % 180);
    }
    return values;
  }, []);
  useFrame(({ clock }) => {
    if (points.current && !state.current.paused && !state.current.reduced)
      points.current.rotation.z = Math.sin(clock.elapsedTime * 0.04) * 0.015;
  });
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#aac8d2"
        size={0.025}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
function AssetLifetime() {
  const mobile = useThree(s => s.size.width < 768);
  const urls = useMemo(() => [...(productionArmorUrl?[]:[art.iron]),art.spider,art.hulk,art.strange].map(url => mobile ? url.replace(".webp", "-mobile.webp") : url), [mobile]);
  const textures = useTexture(urls);
  useEffect(() => () => {
    textures.forEach(texture => texture.dispose());
    urls.forEach(url => useTexture.clear(url));
  }, [textures, urls]);
  return null;
}

function Conductor({
  state,
  onReady,
  onFailure,
}: {
  state: JourneyRef;
  onReady: () => void;
  onFailure: () => void;
}) {
  const { invalidate, size, gl, scene: loadedScene, camera: loadedCamera } = useThree();
  const light = useRef<THREE.PointLight>(null);
  const fill = useRef<THREE.PointLight>(null);
  const current = useRef(state.current.progress);
  const intro = useRef(0);
  const colors = useMemo(
    () =>
      ["#12100f", "#120e10", "#080f20", "#101810", "#0b141b", "#14110f"].map(
        (c) => new THREE.Color(c),
      ),
    [],
  );
  const accents = useMemo(
    () =>
      ["#f5b978", "#91eaff", "#91baff", "#b9ef86", "#b3e2ed", "#f5c58f"].map(
        (c) => new THREE.Color(c),
      ),
    [],
  );
  const background = useMemo(() => new THREE.Color(), []);
  const sanctum = useMemo(() => new THREE.Color("#150e11"), []);
  const targetPoint = useMemo(() => new THREE.Vector3(), []);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);
  const cameraRig = useMemo(() => new THREE.PerspectiveCamera(), []);
  useEffect(() => {
    const update = () => invalidate();
    window.addEventListener("journey-update", update);
    let cancelled = false;
    gl.compileAsync(loadedScene, loadedCamera).then(() => { if (!cancelled) onReady(); }).catch(() => { if (!cancelled) onFailure(); });
    return () => { cancelled = true; window.removeEventListener("journey-update", update); };
  }, [invalidate, onReady, onFailure, gl, loadedScene, loadedCamera]);
  // R3F's frame loop owns this imperative scene/ref snapshot; it is not React render state.
  /* eslint-disable react-hooks/immutability */
  useFrame(({ camera, scene }, delta) => {
    const s = state.current;
    const requested = s.targetProgress ?? s.progress;
    const cut = Math.abs(requested - current.current) > .95;
    current.current = s.reduced || cut ? requested : THREE.MathUtils.damp(current.current, requested, 18, Math.min(delta, .06));
    s.progress = current.current;
    s.score?.time(s.progress, false);
    if (Math.abs(requested-current.current) > .001) invalidate();
    const p = current.current;
    const index = Math.min(5, Math.floor(p));
    const phase = p - index;
    const passage = s.reduced ? 0 : smooth(0.6, 0.95, phase);
    background
      .copy(colors[index])
      .lerp(colors[Math.min(index + 1, 5)], passage);
    if (index === 3) background.copy(colors[3]).lerp(sanctum, smooth(3.43,3.55,p)).lerp(colors[4],smooth(3.9,4,p));
    scene.background = background;
    if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(background);
    const target = journeyCamera(p, s.reduced, size.width < 1024 || size.width / size.height < 1.2);
    intro.current = Math.min(1, intro.current + delta / 1.5);
    const entrance =
      s.reduced || s.paused ? 0 : (1 - smooth(0, 1, intro.current)) * 2;
    const sinceImpact = (performance.now() - s.actionTime) / 1000;
    const shake =
      !s.reduced &&
      !s.paused &&
      index === 3 &&
      s.action === 3 &&
      sinceImpact < 0.6
        ? Math.sin(sinceImpact * 70) * (1 - sinceImpact / 0.6) * 0.045
        : 0;
    const kick = !s.reduced && !s.paused && index === 3 && s.action === 3 && sinceImpact < .7 ? Math.exp(-sinceImpact * 9) : 0;
    cameraTarget.set(
      target.x + shake + (s.reduced ? 0 : s.pointer[0] * 0.15),
      target.y + shake * 0.7 - kick * .07 + (s.reduced ? 0 : s.pointer[1] * 0.1),
      target.z + entrance + kick * .65,
    );
    const portrait=size.width<1024||size.width/size.height<1.2;
    if(s.armor?.open&&p>=1&&p<1.49)cameraTarget.z+=1.8;
    const inspected=s.armor?.open&&s.armor.isolate&&s.armor.selected&&p>=1&&p<1.49?s.armorAnchors?.[s.armor.selected]:undefined;
    if(inspected)cameraTarget.set(inspected[0]-(portrait?.1:1.35),inspected[1]+(portrait?1.15:.05),inspected[2]+4.8);
    if (s.reduced || cut) camera.position.copy(cameraTarget);
    else camera.position.lerp(cameraTarget, 1-Math.exp(-20*Math.min(delta,.06)));
    targetPoint.set(inspected?cameraTarget.x:target.x * .45,inspected?cameraTarget.y:target.y * .3,cameraTarget.z - 18);
    cameraRig.position.copy(camera.position);
    cameraRig.lookAt(targetPoint);
    cameraRig.rotation.z += inspected?0:target.roll;
    camera.quaternion.slerp(cameraRig.quaternion, s.reduced || cut ? 1 : 1-Math.exp(-14*Math.min(delta,.06)));
    s.cameraPosition = camera.position.toArray();
    s.cameraQuaternion = camera.quaternion.toArray();
    if (light.current) {
      light.current.position.set(
        camera.position.x + 4,
        5,
        camera.position.z - 2,
      );
      light.current.color
        .copy(accents[index])
        .lerp(accents[Math.min(index + 1, 5)], passage);
    }
    if (fill.current)
      fill.current.position.set(
        camera.position.x - 5,
        1,
        camera.position.z - 4,
      );
  });
  /* eslint-enable react-hooks/immutability */
  return (
    <>
      <fog attach="fog" args={["#12100f", 22, 53]} />
      <AssetLifetime />
      <ambientLight intensity={0.34} />
      <pointLight ref={light} intensity={85} distance={24} />
      <pointLight ref={fill} color="#d87552" intensity={35} distance={20} />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={3} position={[0, 7, 5]} scale={[10, 5, 1]} />
        <Lightformer
          intensity={2}
          color="#8baac0"
          position={[-6, 0, 4]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[5, 10, 1]}
        />
        <Lightformer
          intensity={1.5}
          color="#e9ba91"
          position={[6, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[5, 10, 1]}
        />
      </Environment>
      <Atmosphere state={state} />
      <Gateway state={state} />
      <IronWorld state={state} />
      <SpiderWorld state={state} />
      <GammaWorld state={state} />
      <Passage state={state} />
      <Gateway state={state} finale />
      <Preload all />
      <CinematicFX state={state} />
    </>
  );
}

export default function JourneyScene({
  state,
  reduced,
  paused,
  onReady,
  onFailure,
}: {
  state: JourneyRef;
  reduced: boolean;
  paused: boolean;
  onReady: () => void;
  onFailure: () => void;
}) {
  const [dpr, setDpr] = useState(() => (window.innerWidth < 768 ? 1.25 : 1.5));
  return (
    <Canvas
      aria-hidden="true"
      eventSource={document.getElementById("journey-experience")!}
      eventPrefix="client"
      events={store=>({...createPointerEvents(store),filter:hits=>hits.filter(hit=>{
        let object:THREE.Object3D|null=hit.object;
        while(object){if(!object.visible)return false;object=object.parent;}
        return true;
      })})}
      onPointerMissed={event=>{
        const target=event.target as HTMLElement;
        if(target.closest?.("a,button,select,input,.armor-gesture-guide,.mobile-nav"))return;
        if(state.current.progress>=1&&state.current.progress<1.49)backFromArmor(state.current);
      }}
      camera={{ position: [0, 0, 13.5], fov: 45, near: 0.1, far: 65 }}
      dpr={[1, dpr]}
      frameloop={reduced || paused ? "demand" : "always"}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", onFailure, {
          once: true,
        });
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.3;
      }}
    >
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(window.innerWidth < 768 ? 1.25 : 1.5)}
      />
      <Suspense fallback={null}><Conductor state={state} onReady={onReady} onFailure={onFailure} /></Suspense>
    </Canvas>
  );
}

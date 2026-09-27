import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { smooth, type JourneyRef } from "./state";
import { useJourneyTime } from "./useJourneyTime";
import { productionArmorUrl } from "./armor";

type Props = { state: JourneyRef };
type Vector = [number, number, number];

// These rooms are local to the owning chapter, not world-space backdrops. Near
// architecture crosses the camera path; midground structures surround the actor.
const surfaceVertex = `varying vec3 vSurface; varying vec2 vSurfaceUv;\n`;
const surfaceNoise = `
  varying vec3 vSurface; varying vec2 vSurfaceUv;
  float surfaceHash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float surfaceNoise(vec2 p) {
    vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(surfaceHash(i),surfaceHash(i+vec2(1.,0.)),f.x),
      mix(surfaceHash(i+vec2(0.,1.)),surfaceHash(i+vec2(1.,1.)),f.x),f.y);
  }
`;
function surfaceCoordinates(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.vertexShader = surfaceVertex + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>",
    "#include <begin_vertex>\nvSurface=position; vSurfaceUv=uv;");
  shader.fragmentShader = surfaceNoise + shader.fragmentShader;
}
function machineFloor(shader: THREE.WebGLProgramParametersWithUniforms) {
  surfaceCoordinates(shader);
  shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `
    #include <color_fragment>
    vec2 panel=fract(vSurface.xy/2.);
    float seam=max(1.-smoothstep(.0,.014,min(panel.x,1.-panel.x)),1.-smoothstep(.0,.014,min(panel.y,1.-panel.y)));
    float brushed=surfaceNoise(vSurface.xy*vec2(85.,3.));
    diffuseColor.rgb*=mix(.75,1.12,brushed)*(1.-seam*.6);
  `).replace("#include <roughnessmap_fragment>", `
    #include <roughnessmap_fragment>
    roughnessFactor=clamp(roughnessFactor+surfaceNoise(vSurface.xy*vec2(55.,2.))*.13,.18,.65);
  `);
}
function concreteFloor(shader: THREE.WebGLProgramParametersWithUniforms) {
  surfaceCoordinates(shader);
  shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `
    #include <color_fragment>
    float grain=surfaceNoise(vSurface.xy*70.);
    float stain=surfaceNoise(vSurface.xy*.8);
    float crack=1.-smoothstep(.009,.03,abs(sin(vSurface.x*1.7+sin(vSurface.y*2.2)*.8)));
    diffuseColor.rgb*=mix(.57,1.18,stain)*mix(.8,1.1,grain)*(1.-crack*.72);
  `);
}
function wetStreet(shader: THREE.WebGLProgramParametersWithUniforms) {
  surfaceCoordinates(shader);
  shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `
    #include <color_fragment>
    float puddle=smoothstep(.37,.64,surfaceNoise(vSurface.xy*.6));
    float grain=surfaceNoise(vSurface.xy*70.);
    diffuseColor.rgb*=mix(.62,1.1,grain)*mix(1.,.5,puddle);
  `).replace("#include <roughnessmap_fragment>", `
    #include <roughnessmap_fragment>
    roughnessFactor=mix(.85,.14,smoothstep(.37,.64,surfaceNoise(vSurface.xy*.6)));
  `);
}
function usePortrait() {
  return useThree(s => s.size.width < 1024 || s.size.width / s.size.height < 1.2);
}
function Beam({ position, length, color = "#abd4e1", vertical = false }: {
  position: Vector; length: number; color?: string; vertical?: boolean;
}) {
  return <group position={position} rotation={[0, 0, vertical ? Math.PI / 2 : 0]}>
    <mesh><boxGeometry args={[length, .095, .11]} /><meshStandardMaterial color="#13232b" metalness={.85} roughness={.27} /></mesh>
    <mesh position={[0, -.002, .057]}><planeGeometry args={[length * .96, .033]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.1} toneMapped={false} /></mesh>
  </group>;
}
function ContactPool({ position, radius = 2.8 }: { position: Vector; radius?: number }) {
  return <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[radius * 2, radius * 2]} />
    <shaderMaterial transparent depthWrite={false}
      vertexShader="varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"
      fragmentShader="varying vec2 v;void main(){float r=length((v-.5)*vec2(2.,2.7));gl_FragColor=vec4(.015,.02,.025,exp(-r*r*4.)*.72);}" />
  </mesh>;
}
function Panel({ position, scale = [1, 1, 1], rotation = [0, 0, 0], color = "#25313a" }: {
  position: Vector; scale?: Vector; rotation?: Vector; color?: string;
}) {
  const shape = useMemo(() => {
    const outline = new THREE.Shape();
    outline.moveTo(-.5, -.5); outline.lineTo(.35, -.5); outline.lineTo(.5, -.35);
    outline.lineTo(.5, .5); outline.lineTo(-.35, .5); outline.lineTo(-.5, .35); outline.closePath();
    return outline;
  }, []);
  return <mesh position={position} scale={scale} rotation={rotation} castShadow receiveShadow>
    <extrudeGeometry args={[shape, { depth: .16, bevelEnabled: true, bevelSegments: 2, bevelSize: .025, bevelThickness: .025, steps: 1 }]} />
    <meshStandardMaterial color={color} metalness={.78} roughness={.34} />
  </mesh>;
}
function Pipe({ a, b, radius = .06, color = "#34434a" }: { a: Vector; b: Vector; radius?: number; color?: string }) {
  const { position, quaternion, length } = useMemo(() => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), direction = end.clone().sub(start);
    return { position: start.add(end).multiplyScalar(.5), length: direction.length(), quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()) };
  }, [a, b]);
  return <mesh position={position} quaternion={quaternion} castShadow><cylinderGeometry args={[radius, radius, length, 8]} /><meshStandardMaterial color={color} metalness={.82} roughness={.34} /></mesh>;
}
function ServiceArm({ state, position, mirror = 1 }: Props & { position: Vector; mirror?: number }) {
  const arm = useRef<THREE.Group>(null), time = useJourneyTime(state);
  useFrame(() => {
    if (!arm.current) return;
    if (state.current.paused || state.current.reduced) return;
    const active = state.current.action === 1;
    arm.current.rotation.z = mirror * (-.12 + (active ? Math.sin(time.current * .7) * .06 : 0));
  });
  return <group position={position} scale={[mirror, 1, 1]}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.42, .48, .35, 24]} /><meshStandardMaterial color="#353a3d" metalness={.9} roughness={.25} /></mesh>
    <group ref={arm} rotation={[0, 0, mirror * -.12]}>
      <Panel position={[.75, .25, 0]} scale={[1.7, .42, 1]} rotation={[0, 0, .35]} />
      <Pipe a={[.2, .05, -.1]} b={[1.25, .43, -.1]} radius={.055} color="#7c9098" />
      <mesh position={[1.5, .55, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.22, .22, .27, 20]} /><meshStandardMaterial color="#727f84" metalness={.93} roughness={.21} /></mesh>
      <Panel position={[2, .05, .04]} scale={[1.15, .3, 1]} rotation={[0, 0, -.65]} />
      <mesh position={[2.45, -.3, .1]} rotation={[0, 0, -.55]}><cylinderGeometry args={[.12, .18, .55, 12]} /><meshStandardMaterial color="#202b32" metalness={.9} roughness={.2} /></mesh>
      <Beam position={[2.55, -.52, .15]} length={.22} color="#82e4ef" />
    </group>
  </group>;
}

export function StarkLab({ state }: Props) {
  const portrait = usePortrait(), center = portrait ? .6 : 3;
  return <group name="stark-spatial-assembly-bay" position={[0,portrait&&productionArmorUrl?-1:0,0]}>
    <mesh position={[0, -4.45, -7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[38, 34, 1, 1]} /><meshStandardMaterial color="#252e34" metalness={.83} roughness={.31} onBeforeCompile={machineFloor} customProgramCacheKey={() => "machined-floor-v1"} /></mesh>
    <ContactPool position={[center, -4.43, .3]} radius={3} />
    <group position={[center, -4.25, .15]}>
      <mesh><cylinderGeometry args={[3.2, 3.35, .3, portrait ? 48 : 80]} /><meshStandardMaterial color="#242c32" metalness={.9} roughness={.28} /></mesh>
      <mesh position={[0, .16, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[2.84, 3.03, 80]} /><meshStandardMaterial color="#546973" metalness={.88} roughness={.28} /></mesh>
      <mesh position={[0, .166, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[2.89, .018, 4, 80]} /><meshStandardMaterial color="#9bddea" emissive="#8dd7e2" emissiveIntensity={1.8} /></mesh>
      {Array.from({ length: 12 }, (_, i) => <mesh key={i} rotation={[0, i * Math.PI / 6, 0]} position={[0, .162, 0]}><boxGeometry args={[.035, .015, 5.5]} /><meshStandardMaterial color="#43525b" metalness={.85} roughness={.35} /></mesh>)}
    </group>
    {[-3.6, -8.4, -13.2].map((z, i) => <group key={z} position={[center, -4.3, z]}>
      <mesh><torusGeometry args={[8.1, .18, 10, 72, Math.PI]} /><meshStandardMaterial color={i ? "#27303a" : "#44515b"} metalness={.86} roughness={.32} /></mesh>
      <mesh position={[0, 0, .05]}><torusGeometry args={[7.82, .021, 4, 72, Math.PI]} /><meshStandardMaterial color="#73a9bd" emissive="#67a5bb" emissiveIntensity={i ? .7 : 1.5} /></mesh>
      {[0, 1, 2, 3, 4, 5, 6].map(j => {
        const a = j * Math.PI / 6;
        return <Panel key={j} position={[Math.cos(a) * 8.06, Math.sin(a) * 8.06, -.23]} rotation={[0, 0, a - Math.PI / 2]} scale={[.52, 1.1, 2]} />;
      })}
    </group>)}
    {/* The passage is actual open architecture, not an opaque wallpaper that
        the dolly would hit. Keep the x=0 camera corridor clear. */}
    {[-1, 1].map(side => <mesh key={`rear-wall-${side}`} position={[side * 10.75, .5, -15.5]} receiveShadow><boxGeometry args={[11.5, 12, .35]} /><meshStandardMaterial color="#0d151b" metalness={.56} roughness={.5} /></mesh>)}
    <mesh position={[0, 6.2, -15.5]}><boxGeometry args={[10, 1.6, .5]} /><meshStandardMaterial color="#1c2a33" metalness={.8} roughness={.37} /></mesh>
    <Beam position={[0, 5.35, -15.2]} length={9.6} color="#729bad" />
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[center + side * 7.7, -.4, -7]}><boxGeometry args={[.45, 7.8, 18]} /><meshStandardMaterial color="#1e2931" metalness={.86} roughness={.36} /></mesh>
      <Beam position={[center + side * 6.7, 2.8, -6]} length={3.5} color="#96cfe0" />
      <ServiceArm state={state} position={[center + side * 4.2, -.25, -2.7]} mirror={-side} />
      <Panel position={[center + side * 5.6, -2.7, -.6]} rotation={[.28, -side * .22, 0]} scale={[1.8, 1.1, 1]} />
      <Beam position={[center + side * 5.6, -2.3, -.39]} length={1.1} color={side > 0 ? "#e6a26a" : "#8ec4d7"} />
    </group>)}
    {!portrait && <group position={[8.2, -2.8, 3]} rotation={[0, -.22, 0]}>
      <Panel position={[0, 0, 0]} scale={[2.4, 2.6, 2]} />
      <Beam position={[0, .8, .35]} length={1.6} color="#d98955" />
      {[0, 1, 2, 3].map(i => <mesh key={i} position={[0, .3 - i * .21, .38]}><boxGeometry args={[1.6, .055, .03]} /><meshStandardMaterial color="#10191f" metalness={.7} roughness={.45} /></mesh>)}
    </group>}
    <pointLight position={[center + 3, 3.2, -2]} color="#9bd1e5" intensity={32} distance={17} decay={2} />
    <pointLight position={[center - 3, -.5, 0]} color="#d98a50" intensity={14} distance={12} decay={2} />
    <pointLight position={[center, 1, -11]} color="#5a8ca0" intensity={22} distance={14} decay={2} />
  </group>;
}

function facadeShader(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.vertexShader = `attribute vec3 facadeSize; attribute float facadeSeed; varying vec3 vFacadePosition; varying vec3 vFacadeNormal; varying float vFacadeSeed;\n` + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvFacadePosition=position*facadeSize;vFacadeNormal=normal;vFacadeSeed=facadeSeed;");
  shader.fragmentShader = `varying vec3 vFacadePosition;varying vec3 vFacadeNormal;varying float vFacadeSeed;
    float facadeHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+vFacadeSeed)*43758.5453);}\n` + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `
    #include <color_fragment>
    vec2 facade=vec2(abs(vFacadeNormal.z)>.5?vFacadePosition.x:vFacadePosition.z,vFacadePosition.y);
    vec2 cell=fract(facade/vec2(.92,1.28));
    float windowMask=step(.17,cell.x)*step(cell.x,.83)*step(.17,cell.y)*step(cell.y,.79)*(1.-step(.5,abs(vFacadeNormal.y)));
    float verticalRib=1.-smoothstep(.035,.065,abs(cell.x-.5));
    float mortar=step(.94,fract(facade.y*4.7))+step(.96,fract(facade.x*3.2+floor(facade.y*4.7)*.5));
    float windowLit=step(.71,facadeHash(floor(facade/vec2(.92,1.28))));
    float weather=facadeHash(floor(facade*25.));
    diffuseColor.rgb*=mix(.72,1.15,weather)*(1.-min(mortar,1.)*.3);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.026,.043,.063),windowMask);
    diffuseColor.rgb*=1.-verticalRib*.18*windowMask;
  `).replace("#include <emissivemap_fragment>", `
    #include <emissivemap_fragment>
    vec3 warm=mix(vec3(.15,.23,.32),vec3(.82,.46,.19),facadeHash(floor(facade/vec2(.92,1.28))+18.));
    totalEmissiveRadiance+=warm*windowMask*windowLit*.78;
  `).replace("#include <roughnessmap_fragment>", `
    #include <roughnessmap_fragment>
    roughnessFactor=mix(.84,.24,windowMask);
  `);
}
function BuildingMasses({ portrait }: { portrait: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const count = portrait ? 16 : 24;
  const data = useMemo(() => {
    const sizes = new Float32Array(count * 3), seeds = new Float32Array(count), matrices: THREE.Matrix4[] = [];
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1, row = Math.floor(i / 2), far = row > 5;
      const w = 3.5 + (i % 3) * .9, h = 13 + Math.sin(i * 2.27) * 4 + row * .3, d = 4 + (i % 2) * 1.8;
      sizes.set([w, h, d], i * 3); seeds[i] = i * 17.13;
      const dummy = new THREE.Object3D();
      dummy.position.set(side * (portrait ? 5.5 + row * .16 : far ? 7.5 + row * .15 : 8.3), h * .5 - 9, 2 - row * 5.1);
      dummy.scale.set(w, h, d); dummy.updateMatrix(); matrices.push(dummy.matrix.clone());
    }
    return { sizes, seeds, matrices };
  }, [count, portrait]);
  return <instancedMesh ref={mesh} args={[undefined, undefined, count]} castShadow receiveShadow onUpdate={object => {
    data.matrices.forEach((matrix, i) => object.setMatrixAt(i, matrix)); object.instanceMatrix.needsUpdate = true;
  }}>
    <boxGeometry args={[1, 1, 1]}><instancedBufferAttribute attach="attributes-facadeSize" args={[data.sizes, 3]} /><instancedBufferAttribute attach="attributes-facadeSeed" args={[data.seeds, 1]} /></boxGeometry>
    <meshStandardMaterial color="#333943" metalness={.18} roughness={.8} onBeforeCompile={facadeShader} customProgramCacheKey={() => "physical-facade-v1"} />
  </instancedMesh>;
}
function FireEscape({ position, side }: { position: Vector; side: number }) {
  return <group position={position}>
    {[0, 1, 2].map(floor => <group key={floor} position={[0, floor * 2.1, 0]}>
      <mesh><boxGeometry args={[1.5, .06, 1.05]} /><meshStandardMaterial color="#181f28" metalness={.88} roughness={.57} /></mesh>
      <Pipe a={[-.72, 0, .5]} b={[-.72, .9, .5]} radius={.022} />
      <Pipe a={[.72, 0, .5]} b={[.72, .9, .5]} radius={.022} />
      <Pipe a={[-.72, .9, .5]} b={[.72, .9, .5]} radius={.022} />
      {[-.4, 0, .4].map(x => <Pipe key={x} a={[x, 0, .5]} b={[x, .9, .5]} radius={.015} />)}
      <Pipe a={[-side * .7, 0, .45]} b={[side * .7, 2.1, .45]} radius={.022} />
      <Pipe a={[-side * .7, 0, -.25]} b={[side * .7, 2.1, -.25]} radius={.022} />
      {[0, 1, 2, 3, 4, 5].map(step => <Pipe key={step} a={[-side * .7 + side * 1.4 * step / 6, step * .35, .45]} b={[-side * .7 + side * 1.4 * step / 6, step * .35, -.25]} radius={.015} />)}
    </group>)}
  </group>;
}

export function CityCanyon({ state }: Props) {
  const portrait = usePortrait(), time = useJourneyTime(state), light = useRef<THREE.PointLight>(null);
  useFrame(() => { if (light.current) light.current.intensity = 20 + Math.sin(time.current * .45) * .5; });
  return <group name="new-york-spatial-canyon">
    <BuildingMasses portrait={portrait} />
    <mesh position={[0, -9.03, -18]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[16, 70]} /><meshStandardMaterial color="#242d38" metalness={.34} roughness={.75} onBeforeCompile={wetStreet} customProgramCacheKey={() => "wet-street-v1"} /></mesh>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * 6.7, -8.8, -17]}><boxGeometry args={[1.5, .4, 65]} /><meshStandardMaterial color="#273240" roughness={.86} /></mesh>
      {Array.from({ length: portrait ? 3 : 5 }, (_, i) => <group key={i} position={[side * 6.8, 0, -i * 5.1]}>
        <mesh position={[0, 3.1 + i % 2, 0]}><boxGeometry args={[1.8, .16, 4.7]} /><meshStandardMaterial color="#2d3540" metalness={.5} roughness={.6} /></mesh>
        <mesh position={[0, -2.5, 0]}><boxGeometry args={[1.8, .1, 4.7]} /><meshStandardMaterial color="#242b36" metalness={.45} roughness={.63} /></mesh>
      </group>)}
    </group>)}
    <FireEscape position={[portrait ? 4.4 : 7.1, -4.2, -4]} side={-1} />
    {!portrait && <FireEscape position={[-7, -5.4, -9]} side={1} />}
    <group position={[portrait ? 5.8 : 7.4, 3.4, -9]}>
      <mesh><cylinderGeometry args={[1.1, 1.1, 2.1, 24]} /><meshStandardMaterial color="#343438" roughness={.9} metalness={.12} /></mesh>
      <mesh position={[0, 1.22, 0]}><coneGeometry args={[1.22, .48, 24]} /><meshStandardMaterial color="#343e47" metalness={.8} roughness={.55} /></mesh>
      {[-.8, .8].flatMap(x => [-.8, .8].map(z => <Pipe key={`${x}-${z}`} a={[x, -1.1, z]} b={[x, -2.1, z]} radius={.055} />))}
      {[-.8, 0, .8].map(y => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.12, .026, 4, 32]} /><meshStandardMaterial color="#222a31" metalness={.88} roughness={.5} /></mesh>)}
    </group>
    <group position={[portrait ? 5.7 : 8.4, -4.8, 3]} rotation={[0, -.17, 0]}>
      <mesh receiveShadow><boxGeometry args={[4.4, 1.2, 1.5]} /><meshStandardMaterial color="#333947" roughness={.8} /></mesh>
      <mesh position={[0, .65, 0]}><boxGeometry args={[4.55, .12, 1.65]} /><meshStandardMaterial color="#454b56" metalness={.58} roughness={.34} /></mesh>
      <Pipe a={[-2, .7, -.6]} b={[-2, 1.55, -.6]} radius={.027} />
      <Pipe a={[2, .7, -.6]} b={[2, 1.55, -.6]} radius={.027} />
      <Pipe a={[-2, 1.55, -.6]} b={[2, 1.55, -.6]} radius={.027} />
    </group>
    <pointLight ref={light} position={[4, 4, 2]} color="#718ed2" intensity={20} distance={23} decay={2} />
    <pointLight position={[-5, -.5, -7]} color="#db8052" intensity={16} distance={18} decay={2} />
    <pointLight position={[1, -7.5, -14]} color="#d8965b" intensity={9} distance={15} decay={2} />
  </group>;
}

function BrokenFloor({ state, portrait }: Props & { portrait: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null), count = portrait ? 18 : 36;
  const dummy = useMemo(() => new THREE.Object3D(), []), time = useJourneyTime(state), lastAction = useRef(0), hitTime = useRef(-10);
  useFrame(() => {
    const s = state.current;
    if (s.action === 3 && s.actionTime !== lastAction.current) { lastAction.current = s.actionTime; hitTime.current = time.current; }
    const age = time.current - hitTime.current;
    const hit = s.reduced ? 0 : Math.max(0, 1 - age / .9);
    if (!mesh.current) return;
    for (let i = 0; i < count; i++) {
      const angle = i * 2.399, radius = 1.6 + (i % 7) * .62;
      const outward = hit * (1 - Math.exp(-age * 12)) * .48;
      dummy.position.set((portrait ? .5 : 3) + Math.cos(angle) * (radius + outward), -4.36 + Math.abs(Math.sin(i * 7)) * .09 + hit * Math.sin(Math.max(0, age) * Math.PI / .9) * (i % 4) * .15, .3 + Math.sin(angle) * radius * .72);
      dummy.rotation.set(Math.sin(i * 9) * .08 + hit * .1, i * 1.23, Math.cos(i * 8) * .065);
      dummy.scale.set(.55 + i % 3 * .2, .1 + i % 2 * .06, .35 + i % 4 * .13); dummy.updateMatrix(); mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={mesh} args={[undefined, undefined, count]} castShadow receiveShadow><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#555b50" roughness={.96} /></instancedMesh>;
}
function ReactorMist({ state, portrait }: Props & { portrait: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null), time = useJourneyTime(state);
  const uniforms = useMemo(() => ({ time: { value: 0 }, alpha: { value: .13 } }), []);
  useFrame(() => { if (material.current) material.current.uniforms.time.value = time.current; });
  return <mesh position={[portrait ? .6 : 3, -3.3, -1.5]} rotation={[-.16, 0, 0]}><planeGeometry args={[14, 3.5]} />
    <shaderMaterial ref={material} uniforms={uniforms} transparent depthWrite={false}
      vertexShader="varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"
      fragmentShader={`varying vec2 v;uniform float time;uniform float alpha;void main(){
        float wisps=sin(v.x*17.+sin(v.y*9.-time*.22)*2.+time*.09)*.5+.5;
        float edge=sin(v.x*3.14159)*sin(v.y*3.14159);
        gl_FragColor=vec4(.3,.42,.26,wisps*edge*edge*alpha);
      }`} />
  </mesh>;
}

export function GammaFacility({ state }: Props) {
  const portrait = usePortrait(), center = portrait ? .6 : 3;
  const ring = useRef<THREE.Group>(null);
  useFrame(() => { if (ring.current) {
    const p=state.current.progress, displacement=state.current.reduced?0:smooth(3.38,3.7,p);
    ring.current.rotation.z = -.08 - smooth(2.72, 3.15,p) * .045 - displacement*.09;
    ring.current.position.x=center+displacement*3.7;
    ring.current.position.y=-.35-displacement*.45;
  } });
  return <group name="gamma-containment-facility">
    <mesh position={[0, -4.5, -7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[35, 32]} /><meshStandardMaterial color="#4a5149" roughness={.94} onBeforeCompile={concreteFloor} customProgramCacheKey={() => "cracked-concrete-v1"} /></mesh>
    <ContactPool position={[center, -4.47, .7]} radius={3.5} />
    <BrokenFloor state={state} portrait={portrait} />
    {[-1, 1].map(side => <mesh key={`containment-wall-${side}`} position={[side * 10.75, .5, -15]} receiveShadow><boxGeometry args={[11.5, 13, .55]} /><meshStandardMaterial color="#17211c" roughness={.94} /></mesh>)}
    <mesh position={[0, 6.2, -15]} rotation={[0, 0, -.025]}><boxGeometry args={[10, 1.7, .65]} /><meshStandardMaterial color="#39443a" metalness={.57} roughness={.79} /></mesh>
    <group ref={ring} position={[center, -.35, -5.2]}>
      <mesh rotation={[0, .15, 0]}><torusGeometry args={[4.5, .38, 12, 64, Math.PI * 1.73]} /><meshStandardMaterial color="#414d43" metalness={.78} roughness={.6} /></mesh>
      {Array.from({ length: 14 }, (_, i) => {
        if (i > 11) return null;
        const a = i * Math.PI / 7 + .12;
        return <group key={i} position={[Math.cos(a) * 4.45, Math.sin(a) * 4.45, 0]} rotation={[0, 0, a - Math.PI / 2]}>
          <Panel position={[0, 0, 0]} scale={[1.45, 1.12, 3]} color={i % 3 ? "#35473d" : "#5c6246"} />
          <Beam position={[0, .13, .55]} length={.83} color={i % 4 ? "#83ad71" : "#c39752"} />
          <mesh position={[0, -.3, .52]}><boxGeometry args={[.9, .08, .05]} /><meshStandardMaterial color="#151e19" roughness={.8} /></mesh>
        </group>;
      })}
    </group>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[center + side * 7.1, -.3, -5]} rotation={[0, 0, side === 1 ? -.16 : .015]}><boxGeometry args={[1.2, 8.7, 1.4]} /><meshStandardMaterial color="#3b453e" roughness={.88} /></mesh>
      <Pipe a={[center + side * 6.4, -4.2, -8]} b={[center + side * 6.4, 3.2, -8]} radius={.16} color="#606c60" />
      <Pipe a={[center + side * 6.4, 3.2, -8]} b={[center + side * 3.2, 3.2, -8]} radius={.16} color="#606c60" />
      <Panel position={[center + side * 6.5, -2.8, -.4]} rotation={[0, -side * .23, side * .07]} scale={[2.3, 2.8, 2]} color="#39483c" />
      <Beam position={[center + side * 6.5, -1.95, .03]} length={1.45} color="#bea363" />
      {[0, 1, 2, 3].map(i => <mesh key={i} position={[center + side * 6.5, -2.5 - i * .22, .04]}><boxGeometry args={[1.5, .09, .04]} /><meshStandardMaterial color="#18251d" roughness={.8} /></mesh>)}
      <Pipe a={[center + side * 5.3, -3.9, 1.7]} b={[center + side * 5.3, -2.8, 1.7]} radius={.055} color="#9c8e4b" />
      <Pipe a={[center + side * 5.3, -2.8, 1.7]} b={[center + side * 8.5, -2.8, 1.7]} radius={.055} color="#9c8e4b" />
    </group>)}
    <mesh position={[center + 4.5, 3.25, .3]} rotation={[0, -.1, -.16]}><boxGeometry args={[10, .44, .55]} /><meshStandardMaterial color="#3c443b" metalness={.68} roughness={.7} /></mesh>
    <Pipe a={[center + 2.7, 3.2, .1]} b={[center + 1.9, 1.7, .1]} radius={.033} color="#121b18" />
    <Beam position={[center + 2.2, 2.85, .6]} length={1.8} color="#96b67d" />
    <ReactorMist state={state} portrait={portrait} />
    <pointLight position={[center + 3, 3, -.5]} color="#b3c69b" intensity={28} distance={18} decay={2} />
    <pointLight position={[center - 2, 0, -6.5]} color="#7da462" intensity={13} distance={12} decay={2} />
    <pointLight position={[center - 4, 1, 2]} color="#cba66b" intensity={14} distance={16} decay={2} />
  </group>;
}

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { JourneyRef } from "./state";
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
    float crack=1.-smoothstep(.004,.012,abs(sin(vSurface.x*.55+sin(vSurface.y*.7)*.2)));
    diffuseColor.rgb*=mix(.9,1.04,stain)*mix(.94,1.03,grain)*(1.-crack*.18);
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
  return <group name="stark-clean-assembly-bay" position={[0,portrait&&productionArmorUrl?-1:0,0]}>
    <mesh position={[0,-4.45,-8]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[32,34]}/><meshStandardMaterial color="#20272d" metalness={.65} roughness={.42} onBeforeCompile={machineFloor} customProgramCacheKey={()=>"machined-floor-v1"}/></mesh>
    <ContactPool position={[center,-4.43,.3]} radius={3}/>
    <group position={[center,-4.25,.15]}>
      <mesh><cylinderGeometry args={[3.1,3.2,.3,64]}/><meshStandardMaterial color="#283039" metalness={.82} roughness={.3}/></mesh>
      <mesh position={[0,.16,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[2.92,2.95,80]}/><meshBasicMaterial color="#8bc8d6" toneMapped={false}/></mesh>
    </group>
    {/* Clear rectangular steel bays, no overlapping arches or holographic circles. */}
    <mesh position={[center+2,.4,-9]}><boxGeometry args={[6.8,10,.35]}/><meshStandardMaterial color="#151c24" metalness={.6} roughness={.43}/></mesh>
    <mesh position={[-8,.4,-10]}><boxGeometry args={[10,10,.35]}/><meshStandardMaterial color="#10171d" metalness={.5} roughness={.5}/></mesh>
    {[-1,1].map(side=><group key={side}>
      <mesh position={[center+side*3.8,.3,-8.7]}><boxGeometry args={[.25,9.4,.3]}/><meshStandardMaterial color="#35404b" metalness={.8} roughness={.3}/></mesh>
      <Beam position={[center+side*3.6,.35,-8.49]} length={7.8} color="#8ecad8" vertical/>
      <Panel position={[center+side*4.8,-2.5,-5]} scale={[1.3,1.4,1]} color="#30282a"/>
      <Beam position={[center+side*4.8,-2.2,-4.77]} length={.8} color="#dc5444"/>
    </group>)}
    <Beam position={[center,4.55,-8.5]} length={7.3} color="#94cfde"/>
    <mesh position={[center+2,.4,-8.8]}><boxGeometry args={[.035,8.8,.1]}/><meshStandardMaterial color="#36242b" emissive="#6a1c23" emissiveIntensity={.4}/></mesh>
    {!portrait&&<ServiceArm state={state} position={[center+4,-1,-6.5]} mirror={-1}/>}
    <pointLight position={[center+3,3.2,-2]} color="#c3dbe8" intensity={34} distance={18} decay={2}/>
    <pointLight position={[center-3,-.5,0]} color="#cd6350" intensity={12} distance={12} decay={2}/>
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
  const mesh = useRef<THREE.InstancedMesh>(null), count = portrait ? 6 : 10;
  const dummy = useMemo(() => new THREE.Object3D(), []), time = useJourneyTime(state), lastAction = useRef(0), hitTime = useRef(-10);
  useFrame(() => {
    const s = state.current;
    if (s.action === 3 && s.actionTime !== lastAction.current) { lastAction.current = s.actionTime; hitTime.current = time.current; }
    const age = time.current - hitTime.current;
    const hit = s.reduced ? 0 : Math.max(0, 1 - age / .9);
    if (!mesh.current) return;
    mesh.current.visible = hit > .01;
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
export function GammaFacility({ state }: Props) {
  const portrait=usePortrait(), center=portrait?.6:3;
  return <group name="gamma-clean-containment-bay">
    <mesh position={[0,-4.5,-7]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[32,34]}/><meshStandardMaterial color="#2d342d" roughness={.86} onBeforeCompile={concreteFloor} customProgramCacheKey={()=>"gamma-concrete-v2"}/></mesh>
    <ContactPool position={[center,-4.47,.7]} radius={3.2}/>
    <BrokenFloor state={state} portrait={portrait}/>
    <mesh position={[center+2,.6,-9]}><boxGeometry args={[7.8,10.5,.45]}/><meshStandardMaterial color="#17231c" metalness={.24} roughness={.82}/></mesh>
    <mesh position={[-8,.6,-10]}><boxGeometry args={[10,10.5,.45]}/><meshStandardMaterial color="#121c17" roughness={.84}/></mesh>
    {[-1,1].map(side=><group key={side}>
      <mesh position={[center+side*4.3,.2,-8.6]}><boxGeometry args={[.55,9.7,.6]}/><meshStandardMaterial color="#38443a" metalness={.5} roughness={.62}/></mesh>
      <Beam position={[center+side*3.95,.3,-8.24]} length={7.6} color="#8cbb68" vertical/>
      <Panel position={[center+side*4.9,-2.7,-5.5]} scale={[1.4,1.7,1]} color="#323c2f"/>
      <Beam position={[center+side*4.9,-2.3,-5.3]} length={.85} color="#d2b057"/>
    </group>)}
    <mesh position={[center,4.6,-8.7]}><boxGeometry args={[8.8,.6,.7]}/><meshStandardMaterial color="#354032" metalness={.4} roughness={.7}/></mesh>
    <Beam position={[center,4.27,-8.3]} length={7.4} color="#9ab979"/>
    <mesh position={[center+2,-4.46,-.5]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.17,9]}/><meshStandardMaterial color="#bda45b" roughness={.85}/></mesh>
    <pointLight position={[center+3,3,1]} color="#ced3b3" intensity={32} distance={18} decay={2}/>
    <pointLight position={[center-3,1,-5]} color="#89b85b" intensity={12} distance={13} decay={2}/>
  </group>;
}

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Glow, Strand } from "./geometry";
import { CinematicHero } from "./ArtLayers";
import { ArmorAssembly } from "./ArmorAssembly";
import { productionArmorUrl } from "./armor";
import { StarkLab, CityCanyon, GammaFacility } from "./SpatialEnvironments";
import { PortalRing, DestinationWindow, MissionEnvironment } from "./Portal";
import { smooth, type JourneyRef } from "./state";
import { useJourneyTime } from "./useJourneyTime";

function World({state,start,children}:{state:JourneyRef;start:number;children:React.ReactNode}) {
 const group=useRef<THREE.Group>(null);
 useFrame(()=>{if(group.current)group.current.visible=state.current.progress>start-.24&&state.current.progress<(start===3?3.5:start+.9999);});
 return <group ref={group} position={[0,0,-start*32]}>{children}</group>;
}

export function Gateway({state,finale=false}:{state:JourneyRef;finale?:boolean}) {
 const mobile=useThree(s=>s.size.width<768),group=useRef<THREE.Group>(null);
 useFrame(()=>{const s=state.current;if(group.current)group.current.visible=finale?s.progress>4.35:s.progress<1.02;});
 return <group ref={group} position={[0,0,finale?-160:0]}><group position={[mobile?0:2.7,mobile?-1.8:0,0]}>
  <PortalRing state={state} intro={!finale} finale={finale}/><Glow color="#e88745" size={14} opacity={.23} position={[0,0,-2]}/>
  <Dust state={state} color="#fcb371" count={mobile?70:170}/>
 </group></group>;
}

function Dust({state,color,count=180,impact=false}:{state:JourneyRef;color:string;count?:number;impact?:boolean}){
 const material=useRef<THREE.ShaderMaterial>(null),time=useJourneyTime(state);
 const positions=useMemo(()=>{const data=new Float32Array(count*3);for(let i=0;i<count;i++){data[i*3]=Math.sin(i*127.1)*8;data[i*3+1]=Math.cos(i*311.7)*5;data[i*3+2]=Math.sin(i*59.7)*5;}return data;},[count]);
 const uniforms=useMemo(()=>({time:{value:0},burst:{value:0},color:{value:new THREE.Color(color)}}),[color]);
 useFrame(()=>{if(material.current){material.current.uniforms.time.value=time.current;const s=state.current,hit=s.action===3&&!s.reduced&&!s.paused?Math.max(0,1-(performance.now()-s.actionTime)/1000):0;material.current.uniforms.burst.value=impact?Math.max(hit,(s.motion?.smash??0)*(1-smooth(3,3.3,s.progress))):0;}});
 return <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry>
  <shaderMaterial ref={material} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending}
   vertexShader={`uniform float time;uniform float burst;varying float opacity;void main(){vec3 p=position;p.y+=sin(time*.15+position.x)*.12;p.x+=sin(time*.09+position.z)*.08;p.xy*=1.+burst*1.2;p.z+=burst*(2.+abs(position.z));vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((12.+burst*40.)/max(1.,-mv.z),1.,12.);opacity=.2+fract(position.x*3.7)*.45;}`}
   fragmentShader={`uniform vec3 color;varying float opacity;void main(){float r=length(gl_PointCoord-.5);gl_FragColor=vec4(color,exp(-r*r*22.)*opacity);}`}/>
 </points>;
}

function Haze({state,color,position=[0,0,0]}:{state:JourneyRef;color:string;position?:[number,number,number]}){
 const time=useJourneyTime(state),mat=useRef<THREE.ShaderMaterial>(null),uniforms=useMemo(()=>({time:{value:0},color:{value:new THREE.Color(color)}}),[color]);
 useFrame(()=>{if(mat.current)mat.current.uniforms.time.value=time.current;});
 return <mesh position={position}><planeGeometry args={[25,13]}/><shaderMaterial ref={mat} uniforms={uniforms} transparent depthWrite={false}
  vertexShader={`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
  fragmentShader={`varying vec2 v;uniform float time;uniform vec3 color;void main(){float mist=(sin(v.x*14.+sin(v.y*8.+time*.12)*1.8+time*.09)*.5+.5)*(sin(v.y*12.-v.x*6.+time*.11)*.5+.5);float edge=pow(max(0.,1.-length((v-.5)*1.8)),2.);gl_FragColor=vec4(color,mist*edge*.13);}`}/></mesh>;
}

export function IronWorld({state}:{state:JourneyRef}){
 const mobile=useThree(s=>s.size.width<1024||s.size.width/s.size.height<1.2),repulsor=useRef<THREE.Group>(null);
 useFrame(({camera})=>{const p=state.current.progress,shoot=smooth(1.55,1.72,p);
  if(repulsor.current){const origin=state.current.armorAnchors?.left_gauntlet;
   repulsor.current.visible=p>1.53&&p<1.85&&!state.current.reduced;repulsor.current.position.set(THREE.MathUtils.lerp(origin?.[0]??(mobile?1.34:3.9),camera.position.x,shoot),THREE.MathUtils.lerp(origin?.[1]??(mobile?-2.24:.25),camera.position.y,shoot),THREE.MathUtils.lerp(origin?.[2]??-31.25,camera.position.z-3,shoot));repulsor.current.scale.setScalar(.12+(state.current.motion?.blast??0)*.8);}});
 return <><World state={state} start={1}><StarkLab state={state}/><Glow color="#ac512c" size={8} opacity={.06} position={[3,0,-5]}/>
  <group position={[mobile?.7:2.8,productionArmorUrl?(mobile?-2.2:-.2):(mobile?-2.55:-.25),.5]}><ArmorAssembly state={state} height={productionArmorUrl?(mobile?5.8:7.8):(mobile?7:8.4)}/></group>
 </World><group ref={repulsor}><Glow color="#b6faff" size={2.2} opacity={.7}/><Glow color="#f1ffff" size={.35} opacity={1}/></group></>;
}

function PhysicalWeb({state}:{state:JourneyRef}){
 const group=useRef<THREE.Group>(null),material=useRef<THREE.ShaderMaterial>(null),time=useJourneyTime(state);
 const path=useMemo(()=>new THREE.CatmullRomCurve3([new THREE.Vector3(-1.55,3.3,1),new THREE.Vector3(-3,5,-2),new THREE.Vector3(-6,6,-8)]),[]);
 const uniforms=useMemo(()=>({reveal:{value:1},time:{value:0}}),[]);
 useFrame(()=>{if(group.current)group.current.rotation.z=state.current.reduced?0:state.current.pointer[0]*.008;if(material.current){material.current.uniforms.time.value=time.current;material.current.uniforms.reveal.value=state.current.action===2?Math.min(1,(performance.now()-state.current.actionTime)/550):1;}});
 return <group ref={group}><mesh><tubeGeometry args={[path,64,.015,5,false]}/><shaderMaterial ref={material} uniforms={uniforms} transparent depthWrite={false}
  vertexShader={`varying vec2 v;uniform float time;void main(){v=uv;vec3 p=position;p.x+=sin(uv.x*30.+time*4.)*.009*sin(uv.x*3.14159);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`}
  fragmentShader={`varying vec2 v;uniform float reveal;void main(){if(v.x>reveal)discard;gl_FragColor=vec4(.8,.91,1.,.8);}`}/></mesh></group>;
}

export function SpiderWorld({state}:{state:JourneyRef}){
 const mobile=useThree(s=>s.size.width<1024||s.size.width/s.size.height<1.2),actor=useRef<THREE.Group>(null);
 const path=useMemo(()=>new THREE.CatmullRomCurve3([new THREE.Vector3(-5,3,5),new THREE.Vector3(1.7,1.9,2),new THREE.Vector3(3.2,-.2,0),new THREE.Vector3(3.5,-.25,0)]),[]),pos=useMemo(()=>new THREE.Vector3(),[]);
 useFrame(()=>{if(actor.current){const s=state.current;const flight=s.reduced?1:smooth(1.76,2,s.progress);path.getPoint(flight,pos);actor.current.position.copy(pos);if(mobile){actor.current.position.x=THREE.MathUtils.lerp(-3.5,.8,flight);actor.current.position.y=THREE.MathUtils.lerp(1.5,-3.65,flight);}actor.current.rotation.z=s.reduced?0:Math.sin(s.progress*3)*.035;}});
 return <World state={state} start={2}><CityCanyon state={state}/><Glow color="#315ea8" size={15} opacity={.14} position={[3,0,-4]}/>
  <group ref={actor}><CinematicHero name="spider" state={state} height={mobile?6.6:8.3} lightColor="#5689e8" region={[.86,.34,.2,.18]}/><PhysicalWeb state={state}/></group>
  <Haze state={state} color="#6e85a5" position={[1,-1,3]}/><Dust state={state} color="#9fbdda" count={mobile?60:130}/>
 </World>;
}

export function GammaWorld({state}:{state:JourneyRef}){
 const mobile=useThree(s=>s.size.width<1024||s.size.width/s.size.height<1.2),actor=useRef<THREE.Group>(null),cracks=useRef<THREE.Group>(null);
 useFrame(()=>{const s=state.current;if(actor.current)actor.current.scale.setScalar(.86+smooth(2.78,3.1,s.progress)*.14);if(cracks.current){cracks.current.visible=s.action===3&&!s.reduced&&!s.paused&&performance.now()-s.actionTime<900;cracks.current.scale.setScalar(.65+(s.action===3?Math.min(1,(performance.now()-s.actionTime)/500):.35)*.55);}});
 return <World state={state} start={3}><GammaFacility state={state}/><Glow color="#7b9f35" size={8} opacity={.055} position={[3,0,-5]}/>
  <group ref={actor} position={[mobile?.3:3.1,mobile?-2.1:-1.05,.5]}><CinematicHero name="hulk" state={state} height={mobile?4.7:6.5} lightColor="#94d454" region={[.13,.71,.15,.22]}/></group>
  <group ref={cracks} position={[2,-3.7,1]} rotation={[-Math.PI/2,0,0]}>{Array.from({length:11},(_,i)=>{const a=i*2.399;return <Strand key={i} color="#73a94e" radius={.007} points={[[0,0,0],[Math.cos(a)*1.3,Math.sin(a)*1.3,.02],[Math.cos(a+.11)*2.6,Math.sin(a+.11)*2.6,.02],[Math.cos(a)*4.5,Math.sin(a)*4.5,.02]]}/>;})}</group>
 </World>;
}

function WebTunnel({state}:{state:JourneyRef}){
 const group=useRef<THREE.Group>(null);
 useFrame(()=>{if(group.current){const s=state.current,p=s.progress;group.current.visible=!s.reduced&&((p>1.64&&p<2.05)||(p>2.5&&p<2.9));group.current.position.z=p<2.2?-47:-77;const tension=s.motion?.tension??0,fracture=smooth(2.78,2.92,p);group.current.scale.set(1-tension*.26+fracture*.8,1-tension*.26+fracture*.8,1);group.current.rotation.z=s.pointer[0]*.025+tension*.025;}});
 return <group ref={group}>
  {Array.from({length:14},(_,i)=>{const a=i*Math.PI/7;return <Strand key={i} radius={.012} color="#a5c6d9" points={[[Math.cos(a)*6,Math.sin(a)*6,9],[Math.cos(a+.1)*3.8,Math.sin(a+.1)*3.8,0],[Math.cos(a+.22)*3.2,Math.sin(a+.22)*3.2,-9]]}/>;})}
  {Array.from({length:5},(_,ring)=>{const r=3.3+ring*.5;return <group key={ring}>{Array.from({length:14},(_,i)=>{const a=i*Math.PI/7,b=(i+1)*Math.PI/7;return <Strand key={i} radius={.008} color="#809aab" points={[[Math.cos(a)*r,Math.sin(a)*r,7-ring*4],[Math.cos((a+b)/2)*r*.94,Math.sin((a+b)/2)*r*.94,7-ring*4-.13],[Math.cos(b)*r,Math.sin(b)*r,7-ring*4]]}/>;})}</group>;})}
 </group>;
}

function Fracture({state}:{state:JourneyRef}){
 const mesh=useRef<THREE.InstancedMesh>(null),fist=useRef<THREE.Group>(null),dummy=useMemo(()=>new THREE.Object3D(),[]),mobile=useThree(s=>s.size.width<768),count=mobile?20:44;
 useFrame(()=>{const s=state.current,p=s.progress,smash=s.motion?.smash??0;
  if(fist.current){fist.current.visible=!s.reduced&&p>2.65&&p<2.9;fist.current.position.z=-85+smash*18;fist.current.scale.setScalar(.3+smash*.7);}
  if(mesh.current){mesh.current.visible=p>2.72&&p<3.35;const progress=smooth(2.72,3.15,p);for(let i=0;i<count;i++){const a=i*2.399,r=2.8+progress*(5+i%3),speed=i%2?1:1.6;dummy.position.set(Math.cos(a)*r,Math.sin(a)*r-progress*progress*2,-79+progress*speed*18);dummy.rotation.set(i+progress*3,i*.7+progress*5,i);dummy.scale.set(.10+(i%4)*.09,.08+(i%3)*.06,.12);dummy.updateMatrix();mesh.current.setMatrixAt(i,dummy.matrix);}mesh.current.instanceMatrix.needsUpdate=true;}});
 return <><group ref={fist} position={[6.8,0,-85]}><CinematicHero name="hulk" state={state} height={16} lightColor="#94d454" region={[.11,.7,.18,.25]} onlyFront/></group>
  <instancedMesh ref={mesh} args={[undefined,undefined,count]}><tetrahedronGeometry args={[1,0]}/><meshStandardMaterial color="#62665d" roughness={.9}/></instancedMesh></>;
}

function StrangePassage({state}:{state:JourneyRef}){
 const group=useRef<THREE.Group>(null),actor=useRef<THREE.Group>(null),mobile=useThree(s=>s.size.width<1024||s.size.width/s.size.height<1.2);
 useFrame(()=>{const s=state.current;if(group.current)group.current.visible=s.progress>3.49&&s.progress<4.18;if(actor.current)actor.current.position.y=(mobile?-2.2:-1)+(s.reduced?0:(1-smooth(3.49,3.57,s.progress))*.35);});
 return <group ref={group} name="doctor-strange-image-interlude">
  <group position={[mobile?-1.25:.15,mobile?-1.1:.65,-112]}><DestinationWindow state={state}/><PortalRing state={state}/></group>
  <group ref={actor} position={[mobile?1.4:3.2,mobile?-2.2:-1,-111]} scale={[-1,1,1]}><CinematicHero name="strange" state={state} height={mobile?5.8:7.3} lightColor="#ff8f40" region={[.73,.82,.18,.2]} singleLayer/></group>
  <pointLight position={[2,1,-109]} color="#ff8e42" intensity={14} distance={8}/>
 </group>;
}

export function Passage({state}:{state:JourneyRef}){
 const mission=useRef<THREE.Group>(null);
 useFrame(()=>{const s=state.current;if(mission.current)mission.current.visible=s.progress<5.2&&(s.progress>=4||(!s.reduced&&s.progress>3.84&&(s.cameraPosition?.[2]??0)<-111.8));});
 return <><WebTunnel state={state}/><Fracture state={state}/><StrangePassage state={state}/><group ref={mission} position={[0,0,-128]}><MissionEnvironment/></group></>;
}

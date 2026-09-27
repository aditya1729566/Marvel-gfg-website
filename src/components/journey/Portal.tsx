import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, RenderTexture } from "@react-three/drei";
import * as THREE from "three";
import { Glow } from "./geometry";
import { journeyCamera, smooth, type JourneyRef } from "./state";
import { useJourneyTime } from "./useJourneyTime";

// The destination FBO and actual destination share this physical architecture.
// The exhibition is atmosphere, not invented event facts or signage.
export function MissionEnvironment() {
 const exhibitionTarget=useMemo(()=>{const target=new THREE.Object3D();target.position.set(3.3,0,-7);return target;},[]);
 return <group>
  <primitive object={exhibitionTarget} />
  <ambientLight intensity={.32} color="#a7b5c5" />
  <spotLight target={exhibitionTarget} position={[2,8,3]} intensity={115} color="#ffe0b6" angle={.58} penumbra={.75} distance={36} />
  <pointLight position={[-5,1,-5]} intensity={24} color="#699fa8" distance={24} decay={2} />
  <pointLight position={[4,3,-14]} intensity={38} color="#ffc084" distance={22} decay={2} />
  <mesh position={[0,-4,-8]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[27,64]} /><meshStandardMaterial color="#18212a" metalness={.62} roughness={.32} /></mesh>
  <mesh position={[0,5.6,-12]} rotation={[Math.PI/2,0,0]}><planeGeometry args={[25,46]} /><meshStandardMaterial color="#0d1119" roughness={.8} /></mesh>
  {/* A traversable ten-unit doorway keeps the finale artifact visible beyond the hall. */}
  {[-1,1].map(side=><mesh key={`rear-${side}`} position={[side*9,.5,-29]}><boxGeometry args={[8,12,.6]} /><meshStandardMaterial color="#16202b" roughness={.7} /></mesh>)}
  <mesh position={[0,6,-29]}><boxGeometry args={[10,1,.6]} /><meshStandardMaterial color="#16202b" roughness={.7} /></mesh>
  {[-1,1].map(side=><mesh key={`door-${side}`} position={[side*5,-.15,-28.65]}><boxGeometry args={[.04,10.8,.06]} /><meshBasicMaterial color="#c09b71" toneMapped={false} /></mesh>)}
  {[12,5].map((z,i)=><group key={z} position={[0,0,z]}>
   {[-1,1].map(side=><group key={side} position={[side*(3.6+i*.6),.4,0]}>
    <mesh><boxGeometry args={[.22,8.8,.34]} /><meshStandardMaterial color="#39414b" metalness={.7} roughness={.3} /></mesh>
    <mesh position={[-side*.12,0,.18]}><boxGeometry args={[.025,7.6,.025]} /><meshBasicMaterial color="#d4a478" toneMapped={false} /></mesh>
   </group>)}
   <mesh position={[0,4.7,0]}><boxGeometry args={[7.6+i*1.2,.16,.34]} /><meshStandardMaterial color="#39414b" metalness={.7} roughness={.3} /></mesh>
  </group>)}
  {[-1,1].map(side=><group key={side}>
   <mesh position={[side*10.6,.5,-13]}><boxGeometry args={[.7,11,36]} /><meshStandardMaterial color="#18202b" metalness={.25} roughness={.65} /></mesh>
   {Array.from({length:6},(_,i)=><group key={i} position={[side*8.3,.8,2-i*5.7]}>
    <mesh><boxGeometry args={[.6,9.4,.7]} /><meshStandardMaterial color="#303742" metalness={.62} roughness={.35} /></mesh>
    <mesh position={[-side*.34,0,.12]}><boxGeometry args={[.035,6.8,.12]} /><meshBasicMaterial color="#caa17a" toneMapped={false} /></mesh>
    <mesh position={[side*1.1,4.1,0]} rotation={[0,0,side*-.36]}><boxGeometry args={[2.7,.18,.5]} /><meshStandardMaterial color="#26313d" metalness={.5} roughness={.5} /></mesh>
   </group>)}
   <mesh position={[side*5.3,-3.985,-12]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.023,34]} /><meshBasicMaterial color="#b38b65" /></mesh>
  </group>)}
  {Array.from({length:10},(_,i)=><mesh key={i} position={[0,-3.98,5-i*3.6]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[20.5,.012]} /><meshBasicMaterial color="#46515e" transparent opacity={.45} /></mesh>)}
  <group position={[3.3,-3.4,-7]}>
   <mesh><cylinderGeometry args={[2.15,2.35,1.15,64]} /><meshStandardMaterial color="#1f2831" metalness={.8} roughness={.28} /></mesh>
   <mesh position={[0,.585,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.85,1.89,96]} /><meshBasicMaterial color="#dfad78" toneMapped={false} /></mesh>
  </group>
 </group>;
}

const ringVertex=`varying vec3 local;void main(){local=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const ringFragment=`varying vec3 local;uniform float time;uniform float strength;
 float hash(float p){return fract(sin(p*127.1)*43758.5453);}
 float noise(float x){float i=floor(x);float f=fract(x);return mix(hash(i),hash(i+1.),f*f*(3.-2.*f));}
 void main(){float r=length(local.xy);float a=atan(local.y,local.x);float turn=fract((a+3.14159265)/6.2831853+.12);
  float tip=strength*1.06;float formed=1.-smoothstep(tip-.035,tip+.015,turn);
  float broken=mix(.35,1.,smoothstep(.18,.65,noise(turn*19.+time*.37)));
  float ripple=(noise(turn*23.-time*.31)-.5)*.082+sin(a*7.+time*1.6)*.018;
  float filament=exp(-abs(r-(2.70+ripple))*90.);
  float second=exp(-abs(r-(2.75+ripple*.5+sin(a*9.-time*2.)*.02))*110.);
  float hotTip=exp(-pow((turn-tip)*42.,2.))*exp(-abs(r-2.72)*32.);
  float heat=(filament*.65+second*.28+exp(-abs(r-2.71)*14.)*.12)*formed*broken+hotTip*.7;
  gl_FragColor=vec4(mix(vec3(2.1,.32,.035),vec3(2.4,1.1,.37),filament*.42+hotTip*.5),heat*smoothstep(.002,.05,strength));}`;

export function PortalRing({state,intro=false,finale=false}:{state:JourneyRef;intro?:boolean;finale?:boolean}) {
 const mobile=useThree(s=>s.size.width<1024||s.size.width/s.size.height<1.2);
 const group=useRef<THREE.Group>(null),ring=useRef<THREE.ShaderMaterial>(null),sparks=useRef<THREE.ShaderMaterial>(null),light=useRef<THREE.PointLight>(null);
 const time=useJourneyTime(state);
 const uniforms=useMemo(()=>({time:{value:0},strength:{value:1}}),[]);
 const sparkUniforms=useMemo(()=>({time:{value:0},strength:{value:1},pixelRatio:{value:mobile?1.25:1.5}}),[mobile]);
 const data=useMemo(()=>{
  // Five tapered samples make each spark a short trajectory rather than a spoke.
  const count=mobile?180:370,p=new Float32Array(count*5*3),seeds=new Float32Array(count*5*4);
  for(let i=0;i<count;i++)for(let tail=0;tail<5;tail++){const j=i*5+tail;seeds.set([(i*.61803398875)%1,(i*.41421356)%1,(i*.75487766)%1,tail/5],j*4);}return{p,seeds};
 },[mobile]);
 useFrame(()=>{
  const s=state.current,m=s.motion,amount=intro||finale?1:m?.portal??0;
  if(group.current){group.current.visible=amount>.001;group.current.scale.setScalar(intro?1+smooth(.5,1,s.progress)*3.5:finale?1:1+(m?.portalOpen??0)*2.5);}
  if(ring.current){ring.current.uniforms.time.value=time.current;ring.current.uniforms.strength.value=amount;}
  if(sparks.current){sparks.current.uniforms.time.value=time.current;sparks.current.uniforms.strength.value=amount;}
  if(light.current)light.current.intensity=amount*(intro||finale?8:22);
 });
 return <group ref={group}>
  <mesh><ringGeometry args={[2.38,3.13,192,3]} /><shaderMaterial ref={ring} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} side={THREE.DoubleSide} vertexShader={ringVertex} fragmentShader={ringFragment} /></mesh>
  <points frustumCulled={false}>
   <bufferGeometry><bufferAttribute attach="attributes-position" args={[data.p,3]} /><bufferAttribute attach="attributes-spark" args={[data.seeds,4]} /></bufferGeometry>
   <shaderMaterial ref={sparks} uniforms={sparkUniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false}
    vertexShader={`attribute vec4 spark;uniform float time;uniform float strength;uniform float pixelRatio;varying float heat;varying float tail;
     void main(){float age=fract(spark.x+time*(.33+spark.z*.19));age=max(0.,age-spark.w*.048);
      float turn=fract(spark.y+time*.045);float a=(turn-.12)*6.2831853-3.14159265;
      vec3 origin=vec3(cos(a)*2.71,sin(a)*2.71,0.);vec3 tangent=vec3(-sin(a),cos(a),0.);
      vec3 p=origin+tangent*age*(.8+spark.z*2.5)+vec3(cos(a),sin(a),0.)*age*age*.42;
      p.y-=age*age*(.55+spark.z);p.z+=(spark.x-.5)*age*2.5;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      float formed=1.-smoothstep(strength*1.06-.035,strength*1.06+.015,turn);
      heat=(1.-age)*(1.-spark.w*.82)*formed*smoothstep(.002,.06,strength);
      gl_PointSize=clamp((15.+spark.z*30.)*pixelRatio/max(1.,-mv.z),1.,7.)*(1.-spark.w*.6);tail=spark.w;}`}
    fragmentShader={`varying float heat;varying float tail;void main(){vec2 q=gl_PointCoord-.5;float core=exp(-dot(q,q)*27.);if(core*heat<.008)discard;gl_FragColor=vec4(mix(vec3(2.4,1.35,.55),vec3(1.5,.19,.018),tail),core*heat);}`} />
  </points>
  <pointLight ref={light} color="#ff9b47" intensity={12} distance={22} decay={2} position={[0,0,1]} />
  <Glow color="#e77229" size={8} opacity={.08} position={[0,0,-.2]} />
 </group>;
}

export function DestinationWindow({state}:{state:JourneyRef}) {
 const {size,viewport}=useThree(),mobile=size.width<1024||size.width/size.height<1.2,group=useRef<THREE.Group>(null),material=useRef<THREE.ShaderMaterial>(null);
 const uniforms=useMemo(()=>({destination:{value:null},resolution:{value:new THREE.Vector2(1,1)},strength:{value:0},time:{value:0}}),[]);
 const time=useJourneyTime(state),[live,setLive]=useState(false);
 useEffect(()=>{const update=()=>setLive(!state.current.reduced&&!state.current.paused&&state.current.progress>3.35&&state.current.progress<4.15);window.addEventListener("journey-update",update);update();return()=>window.removeEventListener("journey-update",update);},[state]);
 useFrame(()=>{const s=state.current;if(group.current){group.current.visible=(s.motion?.portal??0)>.04;group.current.scale.setScalar(1+(s.motion?.portalOpen??0)*2.5);}if(material.current){material.current.uniforms.resolution.value.set(size.width*viewport.dpr,size.height*viewport.dpr);material.current.uniforms.strength.value=s.motion?.portal??0;material.current.uniforms.time.value=time.current;}});
 return <group ref={group}><mesh position={[0,0,-.06]}><circleGeometry args={[2.65,128]} /><shaderMaterial ref={material} uniforms={uniforms} transparent depthWrite={false}
  vertexShader={`varying vec2 localUv;void main(){localUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
  fragmentShader={`uniform sampler2D destination;uniform vec2 resolution;uniform float strength;uniform float time;varying vec2 localUv;
   void main(){vec2 q=localUv-.5;float edge=length(q)*2.;float turn=fract((atan(q.y,q.x)+3.14159265)/6.2831853+.12);
    float formed=1.-smoothstep(strength*1.06-.035,strength*1.06+.015,turn);
    float aperture=smoothstep(.14,.76,strength)*formed*(1.-smoothstep(.965,1.,edge));
    vec2 heat=q*sin(edge*32.-time*3.)*.0016*smoothstep(.65,1.,edge);
    gl_FragColor=texture2D(destination,gl_FragCoord.xy/resolution+heat);gl_FragColor.a=aperture;
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`}>
   <RenderTexture attach="uniforms-destination-value" width={mobile?384:768} height={mobile?384:768} frames={live?Infinity:1} samples={0}>
    <color attach="background" args={["#0b141b"]} /><PerspectiveCamera makeDefault manual aspect={size.width/size.height} position={[0,0,11.5]} fov={45} /><PortalCamera state={state} mobile={mobile} /><MissionEnvironment />
   </RenderTexture>
  </shaderMaterial></mesh></group>;
}
function PortalCamera({state,mobile}:{state:JourneyRef;mobile:boolean}) {
 useFrame(({camera})=>{const s=state.current;
  const actual=s as typeof s&{cameraPosition?:[number,number,number];cameraQuaternion?:[number,number,number,number]};
  if(actual.cameraPosition&&actual.cameraQuaternion){camera.position.set(actual.cameraPosition[0],actual.cameraPosition[1],actual.cameraPosition[2]+128);camera.quaternion.fromArray(actual.cameraQuaternion);}
  else{const p=journeyCamera(s.progress,s.reduced,mobile);camera.position.set(p.x+(s.reduced?0:s.pointer[0]*.15),p.y+(s.reduced?0:s.pointer[1]*.1),p.z+128);camera.lookAt(p.x*.45,p.y*.3,camera.position.z-18);camera.rotation.z=p.roll;}
 });return null;
}

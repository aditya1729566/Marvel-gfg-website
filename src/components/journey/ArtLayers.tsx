import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { JourneyRef } from "./state";
import { useJourneyTime } from "./useJourneyTime";

export const art = {
  iron: "/art/iron.webp", spider: "/art/spider.webp", hulk: "/art/hulk.webp", strange: "/art/strange-multiarms.webp",
  lab: "/art/lab.webp", city: "/art/city.webp", ruins: "/art/ruins.webp",
};
export type HeroName = "iron" | "spider" | "hulk" | "strange";
function configureTexture(value: THREE.Texture | THREE.Texture[]) {
 for (const texture of Array.isArray(value)?value:[value]) { texture.colorSpace=THREE.SRGBColorSpace; texture.anisotropy=4; texture.needsUpdate=true; }
}
// Runtime, code-native silhouette compositing; the supplied raster files are unchanged.
const outlines: Record<HeroName, [number,number][]> = {
 iron: [[.32,.19],[.38,.155],[.48,.16],[.57,.22],[.57,.31],[.60,.36],[.66,.245],[.72,.23],[.74,.34],[.82,.255],[.87,.26],[.79,.39],[.94,.325],[.955,.35],[.86,.435],[.97,.385],[.985,.42],[.87,.485],[.845,.545],[.76,.58],[.635,.595],[.59,.66],[.47,.71],[.44,.735],[.28,.68],[.155,.785],[.09,.79],[.04,.755],[.08,.64],[.17,.57],[.20,.46],[.20,.35],[.155,.29],[.065,.255],[.05,.235],[.065,.21],[.13,.205],[.22,.25],[.275,.265]],
 spider: [[.03,.015],[.095,.01],[.135,.05],[.138,.07],[.235,.11],[.36,.14],[.40,.17],[.42,.14],[.455,.115],[.55,.102],[.61,.105],[.65,.14],[.67,.19],[.665,.27],[.65,.30],[.715,.32],[.755,.39],[.775,.425],[.85,.423],[.91,.44],[.92,.47],[.88,.515],[.85,.535],[.86,.55],[1,.54],[1,.712],[.88,.75],[.79,.737],[.745,.714],[.73,.826],[.705,.85],[.66,.846],[.60,.80],[.55,.746],[.46,.69],[.36,.664],[.27,.597],[.17,.57],[.105,.55],[.055,.51],[.03,.447],[.047,.40],[.075,.38],[.14,.37],[.21,.39],[.28,.43],[.355,.48],[.35,.395],[.315,.34],[.31,.265],[.315,.205],[.305,.17],[.22,.142],[.105,.087],[.055,.077],[.023,.061]],
 hulk: [[0,0],[1,0],[1,1],[0,1]],
 strange: [[.456,.268],[.485,.25],[.52,.251],[.548,.276],[.568,.317],[.573,.392],[.565,.478],[.577,.528],[.612,.55],[.636,.624],[.653,.729],[.681,.81],[.715,1],[.288,1],[.315,.81],[.345,.702],[.365,.622],[.392,.544],[.417,.483],[.427,.416],[.421,.361],[.435,.301]],
};

const vertex = `varying vec2 vUv; uniform sampler2D image; uniform float depth; uniform vec2 pointer;
void main(){vUv=uv;vec4 pixel=texture2D(image,uv);float profile=sin(uv.x*3.14159)*sin(uv.y*3.14159);
 vec3 p=position; p.z+=profile*depth*pixel.a; p.xy+=pointer*profile*.035;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
const fragment = `varying vec2 vUv; uniform sampler2D image; uniform vec3 lightColor; uniform float light;
uniform float opacity; uniform float layer; uniform vec4 region; uniform vec2 texel;
uniform vec2 outline[80]; uniform int count; uniform float whiteKey; uniform float neutralKey;
float silhouette(vec2 p){bool inside=false;float distance=1.;for(int i=0;i<80;i++){if(i>=count)break;int j=i+1;if(j==count)j=0;
 vec2 a=outline[i],b=outline[j],edge=b-a;float t=clamp(dot(p-a,edge)/max(dot(edge,edge),.00001),0.,1.);
 distance=min(distance,length(p-a-edge*t));if((a.y>p.y)!=(b.y>p.y)){float crossX=(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x;if(p.x<crossX)inside=!inside;}}
 return inside?smoothstep(0.,.003,distance):0.;}
float preserveRegion(vec2 center,vec2 size){return 1.-smoothstep(.7,1.,length((vUv-center)/size));}
float spiderOpening(vec2 p){
 vec2 hole[5];hole[0]=vec2(.399,.547);hole[1]=vec2(.667,.528);hole[2]=vec2(.734,.553);hole[3]=vec2(.662,.695);hole[4]=vec2(.543,.651);
 bool inside=false;float distance=1.;for(int i=0;i<5;i++){int j=i+1;if(j==5)j=0;vec2 a=hole[i],b=hole[j],e=b-a;
 float t=clamp(dot(p-a,e)/max(dot(e,e),.00001),0.,1.);distance=min(distance,length(p-a-e*t));
 if((a.y>p.y)!=(b.y>p.y)){float x=(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x;if(p.x<x)inside=!inside;}}
 return inside?smoothstep(0.,.003,distance):0.;}
void main(){vec4 c=texture2D(image,vUv);vec2 q=(vUv-region.xy)/region.zw;
 float m=1.-smoothstep(.85,1.05,length(q));
 // Complementary foreground/background masks: no double-rendered palm or rectangular card edge.
 float mask=layer<-.5 ? 1. : layer<.5 ? 1.-m : m; float key=whiteKey>.5?1.-smoothstep(.12,.35,min(c.r,min(c.g,c.b))):silhouette(vUv);
 if(whiteKey>.5){float mouth=1.-smoothstep(.65,1.,length((vUv-vec2(.69,.74))/vec2(.04,.04)));key=max(key,mouth);c.rgb*=.82;}
 float low=min(c.r,min(c.g,c.b)),high=max(c.r,max(c.g,c.b));
 float protect=neutralKey<1.5?max(1.-smoothstep(.8,1.,length((vUv-vec2(.50,.79))/vec2(.18,.18))),max(1.-smoothstep(.8,1.,length((vUv-vec2(.2,.70))/vec2(.12,.12))),1.-smoothstep(.8,1.,length((vUv-vec2(.61,.53))/vec2(.11,.1))))):1.-smoothstep(.8,1.,length((vUv-vec2(.55,.75))/vec2(.18,.18)));
 float gray=(1.-smoothstep(.07,.20,(high-low)/max(high,.001)))*smoothstep(.01,.08,low)*(1.-protect);
 if(neutralKey>1.5)key*=(1.-gray)*(1.-spiderOpening(vec2(vUv.x,1.-vUv.y)));
 if(neutralKey>.5&&neutralKey<1.5){
  float faceKeep=preserveRegion(vec2(.44,.71),vec2(.14,.17));
  float palmKeep=preserveRegion(vec2(.72,.565),vec2(.18,.16));
  float reactorKeep=preserveRegion(vec2(.29,.5),vec2(.09,.09));
  float keepArt=max(faceKeep,max(palmKeep,reactorKeep));
  float sky=smoothstep(.025,.11,c.b-c.r)*smoothstep(.01,.065,c.g-c.r)*(1.-keepArt);key*=1.-sky;
 }
 float a=c.a*mask*key*opacity*smoothstep(0.,.055,vUv.y);if(a<.008)discard;
 float rim=max(0.,c.a-texture2D(image,vUv+vec2(texel.x*3.,0.)).a);
 float castLight=exp(-length(vUv-region.xy)*5.5);
 c.rgb+=lightColor*(castLight*.32+rim*.8)*light;
 gl_FragColor=vec4(c.rgb,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

// Segmented alpha-textured depth meshes, not HTML image cards or invented hero geometry.
export function CinematicHero({ name, state, height=8, lightColor="#84e5ec", region=[.23,.7,.19,.2], onlyFront=false, geometry, singleLayer=false }: {
 name: HeroName; state: JourneyRef; height?: number; lightColor?: string; region?: [number,number,number,number];onlyFront?:boolean;
 geometry?: THREE.BufferGeometry; singleLayer?:boolean;
}) {
 const mobile=useThree(s=>s.size.width<768);
 const texture=useTexture(mobile ? art[name].replace(".webp","-mobile.webp") : art[name],configureTexture);
 const group=useRef<THREE.Group>(null);
 const front=useRef<THREE.Mesh>(null);
 const materials=useRef<(THREE.ShaderMaterial|null)[]>([]);
 const time=useJourneyTime(state);
 const dimensions=texture.image as {width:number;height:number};
 const aspect=dimensions.width/dimensions.height;
 const uniforms=useMemo(()=>[0,1].map(layer=>({image:{value:texture},depth:{value:.16},pointer:{value:new THREE.Vector2()},
  lightColor:{value:new THREE.Color(lightColor)},light:{value:.5},opacity:{value:1},layer:{value:singleLayer?-1:layer},
  region:{value:new THREE.Vector4(...region)},texel:{value:new THREE.Vector2(1/dimensions.width,1/dimensions.height)},
  outline:{value:Array.from({length:80},(_,i)=>new THREE.Vector2(...(outlines[name][i]??[0,0])).setY(1-(outlines[name][i]?.[1]??0)))},count:{value:outlines[name].length},whiteKey:{value:name==="hulk"?1:0},neutralKey:{value:name==="iron"?1:name==="spider"?2:0}})),[texture,lightColor,region,name,dimensions.width,dimensions.height,singleLayer]);
 useFrame((_,delta)=>{
  const s=state.current, quiet=s.reduced||s.paused, t=time.current;
  if(group.current){
   group.current.rotation.y=THREE.MathUtils.damp(group.current.rotation.y,quiet?0:s.pointer[0]*.035,7,Math.min(delta,.2));
   group.current.position.y=quiet?0:Math.sin(t*.8)*.025;
  }
  const hit=!quiet&&name==="hulk"&&s.action===3 ? Math.max(0,1-(performance.now()-s.actionTime)/750) : 0;
  const charge=name==="iron" ? .25+(s.action===1?.5:0)+(s.motion?.reactorCharge??0)*.8+(s.motion?.blast??0)*1.4 : name==="strange" ? .45 : .22+hit*.5;
  const chapter={iron:1,spider:2,hulk:3,strange:3.5}[name];
  const depart=name==="hulk"?.49:.58,span=name==="hulk"?.08:.2;
  const leave=s.reduced||name==="strange"?1:1-Math.max(0,Math.min(1,(s.progress-chapter-depart)/span));
  materials.current.forEach(m=>{if(m){m.uniforms.light.value=charge;m.uniforms.opacity.value=onlyFront?1:leave*leave; m.uniforms.pointer.value.set(...(quiet?[0,0]:s.pointer));}});
  if(front.current)front.current.position.z=.24+hit*.7;
 });
 return <group ref={group}>
  {(singleLayer?[0]:onlyFront?[1]:[0,1]).map(layer=><mesh key={layer} geometry={geometry} ref={layer===1?front:undefined} position={[0,0,layer*.24]}>
   {!geometry&&<planeGeometry args={[height*aspect,height,40,40]}/>}
   <shaderMaterial ref={m=>{materials.current[layer]=m;}} uniforms={uniforms[layer]} vertexShader={vertex} fragmentShader={fragment}
    transparent depthWrite={false} side={THREE.DoubleSide}/>
  </mesh>)}
 </group>;
}

export function EnvironmentPlate({name,state,z=-7}:{name:"lab"|"city"|"ruins";state:JourneyRef;z?:number}){
 const mobile=useThree(s=>s.size.width<768);
 const texture=useTexture(mobile?art[name].replace(".webp","-mobile.webp"):art[name],configureTexture);
 const back=useRef<THREE.Mesh>(null),front=useRef<THREE.Mesh>(null);
 const uniforms=useMemo(()=>({image:{value:texture},foreground:{value:0},opacity:{value:1}}),[texture]);
 const near=useMemo(()=>({image:{value:texture},foreground:{value:1},opacity:{value:1}}),[texture]);
 const backMaterial=useRef<THREE.ShaderMaterial>(null),frontMaterial=useRef<THREE.ShaderMaterial>(null);
 useFrame(()=>{const s=state.current, x=s.reduced?0:s.pointer[0];if(back.current)back.current.position.x=x*.07;if(front.current)front.current.position.x=x*.16;
  const start={lab:1,city:2,ruins:3}[name],out=s.reduced?0:Math.max(0,Math.min(1,(s.progress-start-.6)/.28));if(backMaterial.current)backMaterial.current.uniforms.opacity.value=1-out;if(frontMaterial.current)frontMaterial.current.uniforms.opacity.value=1-out;
 });
 const f=`varying vec2 v;uniform sampler2D image;uniform float foreground;uniform float opacity;
 void main(){vec4 c=texture2D(image,v);float edge=smoothstep(.32,.04,v.y)*smoothstep(.35,.72,v.x);
 float border=smoothstep(0.,.14,min(min(v.x,1.-v.x),min(v.y,1.-v.y)));
 float a=(foreground>.5?edge*.4:1.)*opacity*border;gl_FragColor=vec4(c.rgb,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`;
 return <>
  <mesh ref={back} position={[0,0,z]}><planeGeometry args={[38,21.4]}/><shaderMaterial ref={backMaterial} uniforms={uniforms} vertexShader={`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`} fragmentShader={f} transparent depthWrite={false}/></mesh>
  <mesh ref={front} position={[0,-.8,z+2]}><planeGeometry args={[34,19.1]}/><shaderMaterial ref={frontMaterial} uniforms={near} vertexShader={`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`} fragmentShader={f} transparent depthWrite={false}/></mesh>
 </>;
}

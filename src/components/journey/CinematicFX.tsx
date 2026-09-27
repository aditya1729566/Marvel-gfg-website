import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import * as THREE from "three";
import type { JourneyRef } from "./state";
import { smooth } from "./state";
import { useJourneyTime } from "./useJourneyTime";

// A single restrained finishing pass: selective energy bloom, lens warp and impact.
export function CinematicFX({state}:{state:JourneyRef}) {
 const {size,viewport}=useThree(),time=useJourneyTime(state);
 const fbo=useFBO(Math.round(size.width*viewport.dpr),Math.round(size.height*viewport.dpr),{type:THREE.HalfFloatType,samples:0});
 const scene=useMemo(()=>new THREE.Scene(),[]),camera=useMemo(()=>new THREE.OrthographicCamera(-1,1,1,-1,0,1),[]);
 const uniforms=useMemo(()=>({image:{value:fbo.texture},resolution:{value:new THREE.Vector2()},blast:{value:0},impact:{value:0},portal:{value:0},web:{value:0},time:{value:0}}),[fbo.texture]);
 const material=useMemo(()=>new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,
  vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}`,
  fragmentShader:`varying vec2 v;uniform sampler2D image;uniform vec2 resolution;uniform float blast;uniform float impact;uniform float portal;uniform float web;uniform float time;
   void main(){vec2 p=v-.5;float r=length(p);vec2 dir=p/max(r,.001);
    float wave=exp(-pow((r-(1.-impact)*.8)*28.,2.))*impact*.011;
    vec2 uv=v+dir*wave+p*sin(r*28.-time*2.)*portal*.012+vec2(sin(v.y*16.),cos(v.x*12.))*web*.0015;
    vec3 c=texture2D(image,uv).rgb;vec3 bloom=vec3(0.);vec2 px=1./resolution;
    for(int i=0;i<4;i++){float a=float(i)*1.570796;vec3 sampleColor=texture2D(image,uv+vec2(cos(a),sin(a))*px*4.).rgb;bloom+=max(sampleColor-vec3(.85),vec3(0.));}
    float flare=exp(-dot(p,p)*32.);float streak=exp(-abs(p.y)*130.)*exp(-abs(p.x)*2.5);
    c+=bloom*.11;c+=vec3(.55,.83,1.)*blast*(flare*.35+streak*.24);
    float grain=fract(sin(dot(v*resolution,vec2(12.9898,78.233))+time)*43758.5453)-.5;c+=grain*.006;
    gl_FragColor=vec4(c,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`}),[uniforms]);
 const liveMaterial=useRef<THREE.ShaderMaterial|null>(null);
 useEffect(()=>{
  const geometry=new THREE.PlaneGeometry(2,2),mesh=new THREE.Mesh(geometry,material);scene.add(mesh);liveMaterial.current=material;
  return()=>{scene.remove(mesh);geometry.dispose();material.dispose();};
 },[scene,material]);
 useFrame(({gl,scene:world,camera:worldCamera})=>{
  const s=state.current,quiet=s.reduced||s.paused,m=s.motion;
  const live=liveMaterial.current?.uniforms;if(!live)return;
  // GPU uniforms are intentionally imperative; they are not React-owned UI state.
  // eslint-disable-next-line react-hooks/immutability
  live.resolution.value.set(fbo.width,fbo.height);live.time.value=time.current;
  live.blast.value=quiet?0:m?.blast??0;
  const age=(performance.now()-s.actionTime)/1000;
  live.impact.value=quiet?0:s.action===3&&age<.8?1-age/.8:(m?.smash??0)*(1-smooth(2.78,3,s.progress));
  live.portal.value=quiet?0:(m?.portalOpen??0)*(m?.portal??0)*(1-smooth(3.9,4.04,s.progress));
  live.web.value=quiet?0:m?.tension??0;
  const previous=gl.getRenderTarget();gl.setRenderTarget(fbo);gl.render(world,worldCamera);gl.setRenderTarget(previous);gl.render(scene,camera);
 },1);
 return null;
}

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";
import { armorTransform, evaluateArmorTransform, advanceAssembly, assemblyClock, type ArmorTransform } from "./armor";
import { smooth, armorChanged, inspectArmor, type JourneyRef } from "./state";
// R3F events and frames deliberately mutate the shared imperative Three.js scene ref, never React props used for rendering.
/* eslint-disable react-hooks/immutability */

type PreparedPart = ArmorTransform & { object: THREE.Object3D; materials: THREE.MeshStandardMaterial[]; anchor: THREE.Vector3 };

export function ProductionArmor({state,url,height}:{state:JourneyRef;url:string;height:number}) {
  const source=useGLTF(url);
  const rig=useRef<THREE.Group>(null), amount=useRef(assemblyClock()), {invalidate}=useThree();
  const gesture=useRef<{pointer:number;x:number;y:number;distance:number;part:string;userSelect:string}|null>(null);
  const active=()=>state.current.progress>=1&&state.current.progress<1.49;
  const overUI=(event:ThreeEvent<PointerEvent>)=>(event.nativeEvent.target as HTMLElement)?.closest?.("a,button,select,input,.armor-gesture-guide,.mobile-nav");
  const down=(event:ThreeEvent<PointerEvent>)=>{
    if(!active()||overUI(event)||event.button!==0)return;
    event.stopPropagation();
    let object:THREE.Object3D|null=event.object;
    while(object&&!object.userData.armor_part)object=object.parent;
    if(!object)return;
    gesture.current={pointer:event.pointerId,x:event.clientX,y:event.clientY,distance:0,part:String(object.userData.armor_part),userSelect:document.body.style.userSelect};
    document.body.style.userSelect="none"; // R3F listeners are passive; prevent DOM selection without cancelling native scrolling.
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };
  const move=(event:ThreeEvent<PointerEvent>)=>{
    const drag=gesture.current;
    if(!drag||drag.pointer!==event.pointerId||!active())return;
    event.stopPropagation();
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    drag.distance+=Math.hypot(dx,dy);drag.x=event.clientX;drag.y=event.clientY;
    if(drag.distance>6&&state.current.armor?.open){
      state.current.armor.dragging=true;
      state.current.armor.rotation+=dx*.008;
      state.current.armor.rotationX=THREE.MathUtils.clamp((state.current.armor.rotationX??0)+dy*.006,-.8,.8);
      invalidate();
    }
  };
  const up=(event:ThreeEvent<PointerEvent>)=>{
    const drag=gesture.current;if(!drag)return;
    event.stopPropagation();(event.target as HTMLElement).releasePointerCapture(event.pointerId);gesture.current=null;
    document.body.style.userSelect=drag.userSelect;
    if(state.current.armor)state.current.armor.dragging=false;
    if(active()&&drag.distance<=6)inspectArmor(state.current,drag.part);
    else armorChanged();
  };
  const prepared=useMemo(()=>{
    const scene=clone(source.scene);
    scene.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(scene), center=bounds.getCenter(new THREE.Vector3()), size=bounds.getSize(new THREE.Vector3());
    const materials:THREE.MeshStandardMaterial[]=[];
    scene.traverse(object=>{
      if(!(object instanceof THREE.Mesh))return;
      const raycast=object.raycast;
      object.raycast=function(raycaster,intersections){
        if(!this.visible)return;
        let ancestor:THREE.Object3D|null=this.parent;
        while(ancestor){if(!ancestor.visible)return;ancestor=ancestor.parent;}
        raycast.call(this,raycaster,intersections);
      };
      object.castShadow=true;object.receiveShadow=true;
      const cloneMaterial=(material:THREE.Material)=>{
        const copy=material.clone();
        if(copy instanceof THREE.MeshStandardMaterial){materials.push(copy);copy.envMapIntensity=1.25;copy.userData.assemblyEmission=copy.emissive.clone();copy.userData.assemblyEmissionIntensity=copy.emissiveIntensity;}
        return copy;
      };
      object.material=Array.isArray(object.material)?object.material.map(cloneMaterial):cloneMaterial(object.material);
    });
    const objects:THREE.Object3D[]=[];
    scene.traverse(object=>{if(typeof object.userData.armor_part==="string" && !object.parent?.userData.armor_part)objects.push(object);});
    const parts:PreparedPart[]=objects.map((object,index)=>{
      const localCenter=new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());
      const direction=localCenter.clone().sub(center);
      if(direction.length()<.001)direction.set(index%2?1:-1,.2,0);
      direction.normalize().multiplyScalar(size.y*.12);
      direction.z+=size.y*(index%3-1)*.035;
      const parent=object.parent!;
      const from=parent.worldToLocal(localCenter.clone()), to=parent.worldToLocal(localCenter.clone().add(direction));
      const wrapper=new THREE.Group();wrapper.name=`assembly-${object.userData.armor_part}`;
      parent.add(wrapper);wrapper.add(object); // Local transforms, normals, UVs and bones are untouched.
      const partMaterials:THREE.MeshStandardMaterial[]=[];
      object.traverse(child=>{
        if(child instanceof THREE.SkinnedMesh)child.bindMode="detached"; // Keep the shared skeleton while moving dedicated part wrappers.
        if(child instanceof THREE.Mesh)for(const material of Array.isArray(child.material)?child.material:[child.material])if(material instanceof THREE.MeshStandardMaterial)partMaterials.push(material);
      });
      return {...armorTransform(String(object.userData.armor_part),new THREE.Vector3(),new THREE.Quaternion(),to.sub(from),new THREE.Euler((index%3-1)*.05,(index%2?1:-1)*.08,0)),object:wrapper,materials:partMaterials,anchor:wrapper.worldToLocal(localCenter.clone())};
    });
    return {scene,parts,materials,center,scale:height/Math.max(size.y,.001)};
  },[source.scene,height]);
  const anchorPoint=useMemo(()=>new THREE.Vector3(),[]);
  const selectionColor=useMemo(()=>new THREE.Color("#28616a").multiplyScalar(.25),[]);
  const spin=useMemo(()=>new THREE.Quaternion(),[]),pivotBefore=useMemo(()=>new THREE.Vector3(),[]),pivotAfter=useMemo(()=>new THREE.Vector3(),[]);
  const anchors=useMemo(()=>Object.fromEntries(prepared.parts.map(part=>[part.id,[0,0,0] as [number,number,number]])),[prepared]);
  useEffect(()=>()=>prepared.materials.forEach(material=>material.dispose()),[prepared]);
  // The render loop owns model transforms and shared scene anchors, not React's render state.
  /* eslint-disable react-hooks/immutability */
  useFrame((_,dt)=>{
    const s=state.current, inspection=s.armor, open=Boolean(inspection?.open&&s.progress>=1&&s.progress<1.49), destination=open?1:0;
    const playhead=advanceAssembly(amount.current,destination,performance.now(),s.reduced);
    if(Math.abs(destination-playhead)>.001)invalidate();
    prepared.parts.forEach((part,index)=>{
      const progress=smooth(index*.008,.78+index*.008,playhead);
      evaluateArmorTransform(part,progress,part.object.position,part.object.quaternion);
      const selected=open&&inspection?.selected===part.id;
      if(selected&&inspection?.isolate){
        pivotBefore.copy(part.anchor).applyQuaternion(part.object.quaternion);
        spin.setFromEuler(new THREE.Euler(inspection.rotationX??0,inspection.rotation,0));
        part.object.quaternion.multiply(spin);
        pivotAfter.copy(part.anchor).applyQuaternion(part.object.quaternion);
        part.object.position.add(pivotBefore.sub(pivotAfter));
      }
      part.object.visible=!open||!inspection?.isolate||!inspection.selected||selected;
      for(const material of part.materials){
        material.emissive.copy(material.userData.assemblyEmission as THREE.Color);
        if(selected)material.emissive.add(selectionColor);
        material.emissiveIntensity=Number(material.userData.assemblyEmissionIntensity)+(selected?.32:0)+(part.id==="arc_reactor_housing"?(s.motion?.reactorCharge??0)*1.2:0);
      }
    });
    if(rig.current){
      rig.current.rotation.y=THREE.MathUtils.damp(rig.current.rotation.y,open&&!inspection?.isolate?inspection?.rotation??0:-.12,9,Math.min(dt,.06));
      rig.current.rotation.x=THREE.MathUtils.damp(rig.current.rotation.x,open&&!inspection?.isolate?inspection?.rotationX??0:0,9,Math.min(dt,.06));
    }
    rig.current?.updateWorldMatrix(true,true);
    prepared.parts.forEach(part=>{anchorPoint.copy(part.anchor);part.object.localToWorld(anchorPoint);anchorPoint.toArray(anchors[part.id]);});
    state.current.armorAnchors=anchors;
  });
  return <group ref={rig} scale={prepared.scale} onPointerDown={down} onPointerMove={move} onPointerUp={up}
    onPointerOver={event=>{if(active()&&!overUI(event)){document.body.style.cursor=state.current.armor?.open?"grab":"pointer";}}}
    onPointerOut={()=>{if(!gesture.current)document.body.style.cursor="";}}
    onPointerCancel={()=>{if(gesture.current)document.body.style.userSelect=gesture.current.userSelect;gesture.current=null;if(state.current.armor)state.current.armor.dragging=false;document.body.style.cursor="";}}>
    <group position={prepared.center.clone().multiplyScalar(-1)}><primitive object={prepared.scene} dispose={null}/></group></group>;
}

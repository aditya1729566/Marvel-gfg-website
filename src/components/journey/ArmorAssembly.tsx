import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CinematicHero } from "./ArtLayers";
import { armorParts, armorTransform, evaluateArmorTransform, fallbackArmorGeometry, productionArmorUrl, advanceAssembly, assemblyClock } from "./armor";
import { ProductionArmor } from "./ProductionArmor";
import { smooth, type JourneyRef } from "./state";

// Temporary source-image segmentation. This is not a skinned model or a substitute for model acquisition.
export function ArmorAssembly({state,height}:{state:JourneyRef;height:number}) {
  return productionArmorUrl ? <ProductionArmor state={state} height={height} url={productionArmorUrl}/> : <FallbackArmor state={state} height={height}/>;
}
function FallbackArmor({state,height}:{state:JourneyRef;height:number}) {
  const groups=useRef<(THREE.Group|null)[]>([]), assembly=useRef<THREE.Group>(null), amount=useRef(assemblyClock());
  const {invalidate}=useThree();
  const visible=useMemo(()=>armorParts.filter(part=>part.visible),[]);
  const parts=useMemo(()=>visible.map((part,index)=>{
    const {geometry,center}=fallbackArmorGeometry(index,height,446/686);
    const side=center.x<0?-1:1;
    const offset=new THREE.Vector3(side*(.65+Math.abs(center.x)*.28),center.y*.24,(index%3-.5)*.55);
    return {...armorTransform(part.id,center,new THREE.Quaternion(),offset,new THREE.Euler((index%3-1)*.09,side*.16,side*.06)),geometry};
  }),[height,visible]);
  useEffect(()=>()=>parts.forEach(part=>part.geometry.dispose()),[parts]);
  useFrame((_,dt)=>{
    const s=state.current, inspection=s.armor;
    const open=Boolean(inspection?.open&&s.progress>=1&&s.progress<1.49);
    const destination=open?1:0;
    const playhead=advanceAssembly(amount.current,destination,performance.now(),s.reduced);
    if(Math.abs(destination-playhead)>.001)invalidate();
    const selected=inspection?.selected;
    groups.current.forEach((group,index)=>{
      if(!group)return;
      const part=parts[index], progress=smooth(index*.012,.78+index*.012,playhead);
      evaluateArmorTransform(part,progress,group.position,group.quaternion);
      group.visible= !open || !inspection?.isolate || !selected || selected===part.id;
      const focus=open&&selected===part.id;
      group.scale.setScalar(focus?1.08:1);
      if(focus)group.position.z+=.6;
    });
    if(assembly.current)assembly.current.rotation.y=THREE.MathUtils.damp(assembly.current.rotation.y,open?THREE.MathUtils.clamp(inspection?.rotation??0,-.6,.6):0,10,Math.min(dt,.06));
  });
  return <group ref={assembly}>{parts.map((part,index)=><group name={part.id} key={part.id} ref={group=>{groups.current[index]=group;}} position={part.assembledPosition}>
    <CinematicHero name="iron" state={state} height={height} geometry={part.geometry} singleLayer region={[.72,.565,.18,.16]}/>
  </group>)}</group>;
}

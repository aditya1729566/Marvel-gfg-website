import * as THREE from "three";

export type ArmorPartId = typeof armorParts[number]["id"];
// Set only after a verified local export exists; never fetch a speculative marketplace URL.
export const productionArmorUrl: string | null = "/models/iron-man.glb";
export interface AssemblyClock { value: number; from: number; target: number; at: number }
export const assemblyClock = (): AssemblyClock => ({ value: 0, from: 0, target: 0, at: 0 });
export function advanceAssembly(clock: AssemblyClock, target: number, now: number, reduced: boolean) {
  if(clock.target!==target){clock.from=clock.value;clock.target=target;clock.at=now;}
  const duration=1600*Math.max(.05,Math.abs(target-clock.from));
  clock.value=reduced?target:THREE.MathUtils.lerp(clock.from,target,THREE.MathUtils.clamp((now-clock.at)/duration,0,1));
  return clock.value;
}
// Image-space placeholders are intentionally not represented as production armor meshes.
// These twenty logical roles match the GLB preprocessing extras. Hidden surfaces remain unavailable.
export const armorParts = [
  { id: "helmet", label: "Helmet", uv: [.44,.21], visible: true },
  { id: "faceplate", label: "Faceplate", uv: [.43,.32], visible: true },
  { id: "chest_plate", label: "Chest plate", uv: [.38,.46], visible: true },
  { id: "arc_reactor_housing", label: "Arc reactor housing", uv: [.29,.50], visible: true },
  { id: "left_shoulder", label: "Left shoulder", uv: [.57,.40], visible: true },
  { id: "right_shoulder", label: "Right shoulder", uv: [.24,.32], visible: true },
  { id: "left_upper_arm", label: "Left upper arm", uv: [.61,.49], visible: true },
  { id: "right_upper_arm", label: "Right upper arm", uv: [.19,.29], visible: true },
  { id: "left_forearm", label: "Left forearm", uv: [.73,.52], visible: true },
  { id: "right_forearm", label: "Right forearm", uv: [.12,.25], visible: true },
  { id: "left_gauntlet", label: "Left gauntlet", uv: [.80,.38], visible: true },
  { id: "right_gauntlet", label: "Right gauntlet", uv: [.08,.23], visible: true },
  { id: "pelvis_armor", label: "Pelvis armor", uv: [.39,.61], visible: true },
  { id: "left_thigh", label: "Left thigh", uv: [.43,.68], visible: true },
  { id: "right_thigh", label: "Right thigh", uv: [.22,.62], visible: true },
  { id: "left_shin", label: "Left shin — obscured", uv: [.43,.80], visible: false },
  { id: "right_shin", label: "Right shin", uv: [.14,.71], visible: true },
  { id: "left_boot", label: "Left boot — obscured", uv: [.42,.90], visible: false },
  { id: "right_boot", label: "Right boot", uv: [.08,.76], visible: true },
  { id: "back_armor", label: "Back armor — obscured", uv: [.36,.36], visible: false },
] as const;

export interface ArmorTransform {
  id: string;
  assembledPosition: THREE.Vector3;
  explodedPosition: THREE.Vector3;
  assembledQuaternion: THREE.Quaternion;
  explodedQuaternion: THREE.Quaternion;
}

export function armorTransform(id: string, position: THREE.Vector3, quaternion: THREE.Quaternion, offset: THREE.Vector3, tilt: THREE.Euler): ArmorTransform {
  return { id, assembledPosition: position.clone(), explodedPosition: position.clone().add(offset),
    assembledQuaternion: quaternion.clone(), explodedQuaternion: quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(tilt)) };
}

// A shared transform evaluator also works on real GLB objects, without applying transforms or changing bind poses.
export function evaluateArmorTransform(part: ArmorTransform, amount: number, position: THREE.Vector3, quaternion: THREE.Quaternion) {
  position.lerpVectors(part.assembledPosition, part.explodedPosition, amount);
  quaternion.slerpQuaternions(part.assembledQuaternion, part.explodedQuaternion, amount);
}

type Point = [number, number];
export function fallbackArmorGeometry(index: number, height: number, aspect: number) {
  const visible = armorParts.filter(part => part.visible);
  const seed = visible[index].uv;
  let cell: Point[] = [[0,0],[1,0],[1,1],[0,1]];
  // Voronoi half-planes produce complementary UV cells: no duplicated pixels, rectangular overlap, or missing seams.
  visible.forEach((other, i) => {
    if(i === index) return;
    const nx=other.uv[0]-seed[0], ny=other.uv[1]-seed[1];
    const boundary=(other.uv[0]**2+other.uv[1]**2-seed[0]**2-seed[1]**2)/2;
    const next: Point[]=[];
    cell.forEach((a,j)=>{
      const b=cell[(j+1)%cell.length], da=a[0]*nx+a[1]*ny-boundary, db=b[0]*nx+b[1]*ny-boundary;
      if(da<=0) next.push(a);
      if((da<=0)!==(db<=0)){const t=da/(da-db);next.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
    });
    cell=next;
  });
  const center = new THREE.Vector3((seed[0]-.5)*height*aspect,(.5-seed[1])*height,0);
  const positions: number[]=[], uvs: number[]=[];
  for(let i=1;i<cell.length-1;i++) for(const p of [cell[0],cell[i+1],cell[i]]) {
    positions.push((p[0]-.5)*height*aspect-center.x,(.5-p[1])*height-center.y,0);uvs.push(p[0],1-p[1]);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));geometry.computeVertexNormals();
  return {geometry, center};
}

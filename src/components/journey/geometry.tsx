import { useMemo } from "react";
import * as THREE from "three";

export function Plate({
  points,
  depth = 0.12,
  color = "#c39549",
  metalness = 0.8,
  roughness = 0.28,
  ...props
}: {
  points: [number, number][];
  depth?: number;
  color?: string;
  metalness?: number;
  roughness?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    points.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    s.closePath();
    return s;
  }, [points]);
  return (
    <mesh {...props}>
      <extrudeGeometry
        args={[
          shape,
          {
            depth,
            bevelEnabled: true,
            bevelSize: 0.035,
            bevelThickness: 0.04,
            bevelSegments: 2,
            steps: 1,
          },
        ]}
      />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
      />
    </mesh>
  );
}
export function Orb({
  position,
  scale,
  color,
  metalness = 0.1,
  roughness = 0.65,
  detail = 1,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  metalness?: number;
  roughness?: number;
  detail?: number;
}) {
  return (
    <mesh position={position} scale={scale}>
      <icosahedronGeometry args={[1, detail]} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        flatShading
      />
    </mesh>
  );
}
export function Strand({
  points,
  color = "#d6e2e9",
  radius = 0.008,
}: {
  points: [number, number, number][];
  color?: string;
  radius?: number;
}) {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    [points],
  );
  return (
    <mesh>
      <tubeGeometry args={[curve, 24, radius, 4, false]} />
      <meshBasicMaterial color={color} transparent opacity={0.65} />
    </mesh>
  );
}
export function Glow({
  color,
  size = 4,
  opacity = 0.5,
  position = [0, 0, 0],
}: {
  color: string;
  size?: number;
  opacity?: number;
  position?: [number, number, number];
}) {
  const uniforms = useMemo(
    () => ({
      color: { value: new THREE.Color(color) },
      alpha: { value: opacity },
    }),
    [color, opacity],
  );
  return (
    <mesh position={position}>
      <planeGeometry args={[size, size]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
        fragmentShader={`varying vec2 v;uniform vec3 color;uniform float alpha;void main(){float r=length(v-.5)*2.;float a=pow(max(0.,1.-r),3.)*alpha;gl_FragColor=vec4(color,a);}`}
      />
    </mesh>
  );
}

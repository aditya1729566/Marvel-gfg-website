/** Factual GLB/glTF inventory. Does not claim unavailable geometry is segmented. */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const [input, output] = process.argv.slice(2);
if (!input) throw new Error('Usage: node scripts/inspect-model.mjs model.glb [report.json]');
const file = await fs.readFile(input);
let document, binary;
if (file.readUInt32LE(0) === 0x46546c67) {
  if (file.readUInt32LE(4) !== 2) throw new Error('Only glTF 2 GLB is supported');
  for (let offset = 12; offset < file.length;) {
    const length = file.readUInt32LE(offset), type = file.readUInt32LE(offset + 4);
    const chunk = file.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) document = JSON.parse(chunk.toString().trim());
    if (type === 0x004e4942) binary = chunk;
    offset += length + 8;
  }
} else document = JSON.parse(file.toString());
if (!document?.asset) throw new Error('Invalid glTF document');
const fromUri = async (uri) => uri.startsWith('data:')
  ? Buffer.from(uri.slice(uri.indexOf(',') + 1), 'base64')
  : await fs.readFile(path.resolve(path.dirname(input), decodeURIComponent(uri)));
const buffers = await Promise.all((document.buffers ?? []).map((buffer, i) => buffer.uri ? fromUri(buffer.uri) : i === 0 && binary ? binary : Promise.reject(new Error('Missing binary buffer'))));
const textures = await Promise.all((document.images ?? []).map(async (image, index) => {
  try {
    let bytes;
    if (image.uri) bytes = await fromUri(image.uri);
    else {
      const view = document.bufferViews[image.bufferView];
      bytes = buffers[view.buffer].subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
    }
    const meta = await sharp(bytes).metadata();
    return { index, name: image.name ?? image.uri ?? `embedded-${index}`, width: meta.width, height: meta.height, format: meta.format, bytes: bytes.length };
  } catch (error) { return { index, name: image.name ?? image.uri, unreadable: String(error.message) }; }
}));
const meshes = (document.meshes ?? []).map((mesh, index) => {
  let triangles = 0;
  const primitives = mesh.primitives.map((primitive) => {
    const count = document.accessors[primitive.indices ?? primitive.attributes.POSITION].count;
    const mode = primitive.mode ?? 4;
    const triangleCount = mode === 4 ? count / 3 : mode === 5 || mode === 6 ? Math.max(0, count - 2) : 0;
    triangles += triangleCount;
    return { material: primitive.material == null ? null : (document.materials[primitive.material].name ?? `material-${primitive.material}`), triangleCount, mode, attributes: Object.keys(primitive.attributes) };
  });
  return { index, name: mesh.name ?? `mesh-${index}`, triangles, primitives };
});
const jointIndices = new Set((document.skins ?? []).flatMap((skin) => skin.joints));
const nodes = (document.nodes ?? []).map((node, index) => ({ index, name: node.name ?? `node-${index}`, mesh: node.mesh ?? null, skin: node.skin ?? null, armorPart: node.extras?.armor_part ?? null, translation: node.translation ?? [0, 0, 0], rotation: node.rotation ?? [0, 0, 0, 1], scale: node.scale ?? [1, 1, 1], matrix: node.matrix ?? null }));
const armorParts = ['helmet','faceplate','chest_plate','arc_reactor_housing','left_shoulder','right_shoulder','left_upper_arm','right_upper_arm','left_forearm','right_forearm','left_gauntlet','right_gauntlet','pelvis_armor','left_thigh','right_thigh','left_shin','right_shin','left_boot','right_boot','back_armor'].map((part) => {
  const selected = nodes.filter((node) => node.mesh !== null && (node.armorPart === part || node.name === part));
  return { part, separatelySelectable: selected.length > 0, nodes: selected.map((node) => node.name), status: selected.length ? 'explicitly mapped mesh node; verify visually' : 'not mapped — do not infer from shared material' };
});
const materials = (document.materials ?? []).map((material, index) => ({ index, name: material.name ?? `material-${index}`, pbr: material.pbrMetallicRoughness ?? null, normalTexture: material.normalTexture ?? null, occlusionTexture: material.occlusionTexture ?? null, emissiveTexture: material.emissiveTexture ?? null, extensions: material.extensions ?? {} }));
const report = { input: path.resolve(input), bytes: file.length, generator: document.asset.generator ?? null, meshCount: meshes.length, meshes, materials, boneCount: jointIndices.size, bones: [...jointIndices].map((index) => document.nodes[index].name ?? `node-${index}`), textures, triangleCountUniqueGeometry: meshes.reduce((sum, mesh) => sum + mesh.triangles, 0), triangleCountMeshInstances: nodes.reduce((sum, node) => sum + (node.mesh === null ? 0 : meshes[node.mesh].triangles), 0), skins: document.skins ?? [], nodes, armorParts };
if (output) await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
else process.stdout.write(JSON.stringify(report, null, 2) + '\n');

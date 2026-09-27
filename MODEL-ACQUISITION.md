# Iron Man model acquisition and inspection

Checked 27 September 2026. Rebuilding the environments and interaction architecture proceeds independently; the previous prototype is not being treated as the final visual baseline.

## Current decision: supplied full-body suit imported

The user subsequently supplied `/Users/adityaagrawal/Downloads/Iron+Man`, containing BLEND/FBX/OBJ/MTL files. The actual native BLEND was inspected in Blender and exported as `public/models/iron-man.glb`. This is now the selected integration asset: detailed full-body surfaces, genuinely independent armor geometry, clean scalar metallic materials and all twenty selectable control groups are verified. It is materially stronger than the image-plane fallback and the bust-only candidate. The selection is based on inspected geometry and web integration, not mere file availability.

Important limits: this supplied package has **zero bones and zero animation clips**, no PBR texture images, and UVs on only 44 of 102 meshes. It is not described as a rigged 4K textured suit. Its identity/source/license is not inferred from a different marketplace listing; no license document was included in the supplied directory, so release rights remain to be confirmed independently. The original four files are preserved unchanged in `asset-sources/model/`, and their SHA-256 hashes match the user's originals.

The researched candidates below remain comparison history, not substitutes for measured native import results.

| Candidate | Quality / structure evidence | Geometry and PBR evidence | Web decision / acquisition result |
| --- | --- | --- | --- |
| [IRON MAN — shamus / consistent_models](https://sketchfab.com/3d-models/iron-man-16848ba0aa564fa1aa68f6b64c82e81f) | Creator describes a rigged model. Full-body hierarchy, anatomical part separation and topology remain unverified. | Listing reports 142.9k triangles and CC Attribution; PBR maps, texture sizes and bone count unknown. | First free candidate to inspect after a lawful package is available, not selected just because it says “download.” Detail route returns 403; no viewer data extracted. |
| [Iron Man Game Ready — MetalMan3D](https://sketchfab.com/3d-models/iron-man-game-ready-1b981469aa394e77b1887b8bfeeca04b) | Explicitly stylized, low-poly; a weaker match for the cinematic realism brief. Rigging and independent armor objects unverified. | Creator reports 10.4k triangles, 5.2k vertices and a unique material using 4096² PBR textures. | Efficient geometry budget, but visual-style mismatch and unknown modularity prevent selecting on file availability. Indexed as a store asset; detail route returns 403. No purchase made. |
| [IRON MAN III — 512Ui3](https://www.cgtrader.com/free-3d-models/character/sci-fi-character/iron-man-iii) | Browser preview visibly depicts a helmet/chest bust, not a complete suit. Listing claims animation and rigging. | GLTF/PNG/FBX offered. CGTrader lists FBX checks including PBR, manifold geometry and UV mapping. Triangle and bone counts unknown. | Rejected for the full-body requirement. Logged-out rendered page exposed no model download control. No hidden endpoint or viewer extraction used. |
| [Iron Man Mark 85 Rigged — B.R.W. Productions](https://www.artstation.com/marketplace/p/WmMAg/iron-man-mark-85-rigged) | Seller claims rigging, named/grouped objects and multiple LODs; anatomical independence is not established. | Seller lists 2K PBR textures and BLEND/FBX/GLB. Listed GLB is 76 MB; triangles unknown. | Potential higher-fidelity paid package, but unsuitable to ship unchanged at that size. Purchase/license approval and file inspection are required. No cart or purchase action taken. |

Additional routes checked: [Free3D Iron Man Suit](https://free3d.com/3d-model/iron-man-2-11174.html), offering MAX/FBX, reaches a DataDome device-check screen in the browser. It was not bypassed. [Free3D older Iron Man](https://free3d.com/3d-model/ironman-rigged-original-model--98611.html) lists OBJ/MAX and a personal-use license; its claimed rigging conflicts with the structured specifications. It is not certified as a web-ready PBR replacement. [CGTrader low-poly Mark 85](https://www.cgtrader.com/free-3d-models/character/sci-fi-character/iron-man-mark-85-c51c34bc-67e3-488a-b395-51890ece24b2) is an editorial-license candidate with 8,674 **polygons**, not a verified triangle count; it is not substituted solely to claim an acquired model.

## Measured imported-model report

| Requested metric | Result |
| --- | --- |
| Source / production meshes | 102 named native meshes; 102 GLB meshes |
| Mesh names | Complete native object/data names in [blend-inspection.json](asset-sources/model/blend-inspection.json); complete GLB names in [production-report.json](asset-sources/model/production-report.json) |
| Material names | `red`, `yellow`, `white`, `arc`, `glss` (unused native `Dots Stroke` is not an exported armor material) |
| PBR properties | Red/gold/white metallic factor 1, roughness .5, clearcoat .25; `arc` emission strength 9.90000057; glass roughness .5, IOR 1.45, transmission 1 |
| Bone / skin count | 0 bones, 0 skins; original skeleton cannot be preserved because none exists |
| Animation clips | 0; assembly motion operates independent rigid wrapper groups |
| Texture resolution | None: no image texture assets; no fabricated 2K/4K texture claim |
| UVs / normals | 44 of 102 meshes have UVs, matching native UV-bearing meshes; all 102 exported meshes contain normals |
| Triangle count | 504,464, unchanged from native mesh triangles |
| Major armor-part selectability | All 20 independent wrapper controls; 102 constituent objects assigned, none unmapped |
| Nodes / file size | 122 nodes; 11,828,744 bytes (uncompressed GLB) |
| GLB dimensions | X .7292349 × Y 1.7290908 × Z .3932432; front faces +Z |
| Original transforms | Source files unmodified; maximum assembled world-transform difference after grouping below 1e-5. Wrapper parenting changes child local transforms, while native local/world matrices remain recorded in the import report |
| Production GLB export | [iron-man.glb](public/models/iron-man.glb), exported with official Blender 4.5.12 LTS |

The native suit already consisted of separate armor objects, so a destructive single-mesh split was unnecessary. Twenty `armor_control: true` parent wrappers were added, with `armor_part` metadata, retaining original child names and geometry. No remeshing, decimation, normal recalculation, transform application or rig invention was performed. Two source knee inserts incorrectly named `.r` were assigned by actual geometry side. Elbow/knee inserts accompany forearm/shin controls; abdominal plates accompany the pelvis control. This is explicitly a first logical segmentation, refinable without altering source geometry.

Native Glass BSDF is not directly representable in glTF. Its scalar color, roughness and IOR were translated to equivalent Principled transmission before export, avoiding a silent opaque default over the reactor. Original source material is unchanged. The GLB records `KHR_materials_transmission`, `KHR_materials_ior`, clearcoat and emissive-strength extensions.

Blender was originally absent. An official portable ARM64 build was downloaded only to this task's `work/blender-portable/` folder, its SHA-256 verified against the official release checksum, and its DMG mounted read-only. Nothing was installed globally or into `/Applications`. The sandboxed startup failed in Metal initialization; the approved non-sandboxed background export succeeded.

Three.js GLTFLoader reimport verification confirms the model loads, its full-body bounds, all 20 controls, triangle counts, available UV attributes and normals. Blender round-trip diagnostics are recorded in [roundtrip-report.json](asset-sources/model/roundtrip-report.json): all mesh triangles and UV-layer counts preserved; maximum two-way nearest UV-coordinate difference `2.98e-8`; maximum assembled world-vertex difference `4.39e-7` units. Both are below `1e-5`, and normal attributes are present on every mesh. This verifies coordinate preservation, not a claim of identical vertex ordering or visual normal/material quality. Visual material/assembly checks belong to the website QA pass.

### Selectable armor groups

| Control / canonical role | Native mesh count |
| --- | ---: |
| Helmet | 1 |
| Faceplate (including chin/eyes) | 4 |
| Chest plate | 11 |
| Arc reactor housing/lens/core | 3 |
| Left / right shoulder | 4 / 4 |
| Left / right upper arm | 4 / 4 |
| Left / right forearm | 4 / 4 |
| Left / right gauntlet | 5 / 5 |
| Pelvis armor | 4 |
| Left / right thigh | 3 / 3 |
| Left / right shin | 10 / 10 |
| Left / right boot | 6 / 6 |
| Back armor | 7 |

[import-report.json](asset-sources/model/import-report.json) lists every original mesh assigned to each group, together with its original local/world matrices, triangle count, material names and UV layers. [production-report.json](asset-sources/model/production-report.json) lists the actual GLB meshes, primitive bindings, all node names, complete skeleton/texture inventories and selectable canonical roles. Three.js sanitizes punctuation in mesh names, so runtime interaction uses stable wrapper roles rather than guessing sanitized child names.

## Prepared import pipeline

`scripts/inspect-model.mjs` inventories GLB/glTF meshes, material names/PBR bindings, skeleton joints, embedded or relative texture dimensions, unique/instanced triangles, original node transforms and all twenty requested part mappings. It accepts explicit `armor_part` node extras or canonical names, and labels mapping as requiring visual verification. An unreadable compressed texture is reported, not assigned an invented resolution.

```sh
node scripts/inspect-model.mjs asset-sources/models/source.glb asset-sources/models/source-report.json
```

`scripts/preprocess-armor.py` imports FBX, BLEND or GLB/glTF in Blender, optionally separates by material or loose topology islands, then accepts a reviewed anatomical mapping. It does not apply transforms, decimate, recalculate normals, remesh, rewrite the skeleton or overwrite the source. Mesh separation retains face material assignments, loop UVs, vertex groups and armature modifiers. Before export, it checks total triangles, skeleton count and material names; visual normals/deformation/transform checks remain mandatory after round-trip. Material groups alone do not identify a helmet/faceplate/boot reliably.

```sh
blender --background --python scripts/preprocess-armor.py -- \
  asset-sources/models/source.fbx asset-sources/models/production.glb \
  --split material --report asset-sources/models/import-report.json

# Inspect the result, then author an explicit map from canonical role to actual object names.
# Example mapping fragment: {"helmet":["verified_actual_object_name"]}
blender --background --python scripts/preprocess-armor.py -- \
  asset-sources/models/source.fbx asset-sources/models/production.glb \
  --split material --mapping asset-sources/models/armor-map.json \
  --report asset-sources/models/import-report.json

node scripts/inspect-model.mjs asset-sources/models/production.glb asset-sources/models/production-report.json
```

For a combined mesh with one material, run a separate `--split loose` inspection. Connected logical regions require professionally reviewed manual selection rather than an automatic material guess. Map only independently selectable, inspected geometry; unmatched parts remain unsupported. A retained skeleton is required for posing, but exploded armor animation should move dedicated part wrapper groups instead of changing bind matrices.

Required canonical roles: `helmet`, `faceplate`, `chest_plate`, `arc_reactor_housing`, left/right `shoulder`, `upper_arm`, `forearm`, `gauntlet`, `thigh`, `shin`, `boot`, plus `pelvis_armor` and `back_armor`.

The earlier code-native fallback geometry was a development assembly rig, not the supplied native suit. The default production path now uses the real inspected GLB. The fallback must not be confused with the selected package or be falsely described as its rigged/texture-rich equivalent. Native geometry remains substantial at 504k triangles; real-device performance and an independently approved LOD pass remain relevant before release.

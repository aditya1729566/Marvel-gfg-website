# Artwork and asset pipeline

## Current production geometry

Iron Man now uses `public/models/iron-man.glb`, exported from the user-supplied `Iron+Man` native BLEND package. It has 102 real meshes grouped into all twenty requested armor controls. Source meshes, available UVs and normals are preserved; scalar metallic/emissive/glass PBR materials are exported. It has no bones, animation clips or image textures. The former Iron Man image is preserved as a fallback/reference, not mounted by the production path. Complete measurements and per-part mappings are in `MODEL-ACQUISITION.md`.

## Supplied characters

| Runtime asset | User image | Native source dimensions |
| --- | --- | --- |
| `public/art/iron.webp` (fallback only) | 1 / flying pose, forward palm | 446 × 686 |
| `public/art/spider.webp` | 13 / suspended athletic pose | 414 × 740 |
| `public/art/hulk.webp` | 8 / charging pose | 475 × 421 |
| `public/art/strange-multiarms.webp` | 11 / central real actor, runtime central-figure silhouette | 738 × 370 |

These are user-supplied images, not generated character replacements or independently licensed assets. Sources are copied unchanged into `asset-sources/{iron,spider,hulk,strange}.png`. No embedded watermark was deliberately removed. Unselected references, including the visibly attributed image 7, were not used.

Runtime encoding uses Sharp only for resizing/format optimization, never for segmentation or semantic editing. No enlargement is performed. The character textures therefore do not magically gain native 2K detail. Runtime GLSL silhouette/chroma masks composite the unmodified images into the worlds. Two complementary material masks put the foreground hand/fist ahead of the body; subdivided depth meshes, pointer parallax, light overlays and atmospheric layers provide the spatial treatment.

## Retired generated environment plates

The earlier three generated environment plates are preserved for provenance but are no longer mounted or preloaded. `SpatialEnvironments.tsx` now builds the actual bay, canyon and gamma chamber from native geometry, standard physical materials, procedural surface detail, instanced buildings, contact pools and local lights. `Portal.tsx` supplies the same actual exhibition-hall architecture to the portal render target and destination world.

Historical PNG sources are preserved in `asset-sources/{lab,city,ruins}.png`; desktop/mobile encodings remain in `public/art/`. Native generated size was 1672 × 941. Original prompts follow for traceability, not as descriptions of the current runtime environments.

Final prompt set:

- Lab: “Wide cinematic photoreal environment plate, futuristic engineering hangar at night, sophisticated dark industrial architecture, a circular reactor bay on right side, brass red metal details and long cyan light strips, hazy volumetric illumination, reflective worn black floor, rich photographic materials, dramatic darkness with red-gold highlights and faint cyan fog. Premium live action sci-fi movie still. No people, no characters, no words, no logos, no UI or HUD. Landscape 16:9 composition, most interesting architecture in right two thirds, left third deep quiet darkness for headline.”
- City: “Wide cinematic photoreal nighttime New York city canyon seen suspended above rooftops, layered detailed skyscrapers and concrete brick facades, intricate lit windows, deep blue dusk atmosphere and distant crimson glow, slight mist between towers, cinematic perspective vanishing toward middle right. Premium live action superhero movie environmental still, realistic architecture and lighting, no people, no characters, no webs, no text, no logos. Landscape 16:9, darker quiet left third for headline.”
- Ruins: “Wide cinematic photoreal destroyed urban industrial courtyard at night, realistic cracked concrete floor, fractured slabs and rubble in foreground lower right, distant shadowy building silhouettes, fine dust drifting in deep green gamma-lit haze, muted warm neutral key illumination. Dramatic premium live action movie environment, tactile real concrete texture, cinematic layers and perspective, no people, no characters, no words, no logos. Landscape 16:9, darkest left third for text, detailed environment in middle and right.”

The built-in tool rejected the named-character generation and supplied-image background-extraction attempts. No rejected output is referenced, and no CLI/API retry was used.

## Replace with higher-resolution approved art

Supply alpha WebP/PNG artwork with the same pose/framing and update `art` in `src/components/journey/ArtLayers.tsx`. For genuine alpha textures, disable the outline/chroma key and keep the alpha channel, then adjust the foreground UV region and hero height. Maintain desktop/mobile variants, check silhouette and palm coordinates, update the beam/web attachment points, and rerun the transition captures. Do not publish until the organizer has confirmed image rights and event facts. This project makes no claim of Marvel/Disney endorsement.

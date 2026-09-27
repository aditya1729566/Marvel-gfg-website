# Original asset-first audit — superseded by implemented rebuild

This is the historical pre-rebuild audit. The website was subsequently rebuilt; its earlier unchanged-prototype status no longer applies. The user supplied a native Iron Man package, now imported as a real full-body GLB. Current results are in `MODEL-ACQUISITION.md` and `VERIFICATION.md`; old functional passes never established cinematic visual quality.

## Implemented after this audit

- Full-body Iron Man: 102 real meshes, 20 independent armor controls, reversible assembled/exploded positions and quaternions, selection, isolation, rotation and camera inspection.
- Physical Stark assembly bay, layered city canyon and damaged gamma facility replace all three photographic environment plates.
- One damped WebGL playhead drives the master score; camera targets and quaternion orientation are damped, with distinct city/gamma routes and actual wrist-anchored repulsor origin.
- Irregular forming portal, tangential GPU sparks, warm lighting and camera-matched destination exhibition hall; open architectural corridors avoid flying into opaque walls.
- Responsive portrait composition, shader/asset warmup and truthful low-power/error fallback. Original sources remain preserved.

The remaining asset limitation is the low-resolution 2.5D Spider-Man, Hulk and Strange artwork. The native Iron Man has no bones or texture images. High-quality hero assets, release rights, event facts, physical-device performance and a reviewed LOD pass remain launch work—not a reason to leave the old prototype untouched.

## Inspection performed

Ran production at localhost:3003. Captured and visually reviewed all six chapters at 1920×1080, 1440×1000, 1280×900, 834×1112, 430×932 and 390×844. Captured and reviewed eleven checkpoints on each of four exit connectors (44 transition frames). No page errors occurred during capture. Native screenshots and contact sheets are in `../current-build-audit/`; `index.html` links to the originals. Software Chromium is not a physical-device performance measurement.

## Why it looks composited

- `ArtLayers.tsx` samples baked RGB photographs with runtime polygon/chroma masks. Native source widths are 414–475px; enlarged edges and contamination cannot become studio-quality alpha or geometry through extra shader glow. Foreground masks add shallow displacement but no genuine side/back surfaces, normals or articulation.
- `EnvironmentPlate` places the same full image on two planes. A partial lower-corner mask is not a city canyon or a modeled laboratory. Moving forward magnifies wallpaper rather than passing between structures.
- Hero shaders add radial RGB light overlays. They do not receive the scene's physical lights, shadows or reflections. Hulk's bright stylized source especially conflicts with dark photographic ruins.
- `Conductor` assigns the camera transform directly each frame. The curved route improves continuity but still lacks target-transform damping and quaternion orientation momentum. World visibility and departure opacity are chapter thresholds, not physical scene occlusion.
- The Iron Man action only increases light and HUD scale. There are no armor meshes, part mappings, detachment paths, isolation or inspection mode. The current button does not meet the new requirement.
- At 834px the WebGL composition uses desktop positions and camera distance while the DOM becomes narrower. Iron Man, Spider-Man and Hulk are visibly cropped. Mobile actors are placed low and remain too small relative to the requested poster composition.
- Repulsor midpoint frames wash into a bright field rather than a volumetric energy passage. Spider/Hulk travel reveals superimposed backgrounds and outgoing translucent art. Strange has coarse silhouette/background fragments. The ring's regular teeth read as mechanical, not irregular magical arcs.

## Asset research, not approved selections

- [IRON MAN by shamus / consistent_models](https://sketchfab.com/3d-models/iron-man-16848ba0aa564fa1aa68f6b64c82e81f): creator lists a free rigged model, 142.9k triangles, CC Attribution. Both browser and fetch returned 403. File hierarchy, material quality and separate armor parts are **not verified**; rigging alone does not establish modularity.
- [IRON MAN III by 512Ui3](https://www.cgtrader.com/free-3d-models/character/sci-fi-character/iron-man-iii): accessible listing offers glTF and PBR/rigging information, but inspected preview depicts a bust. Rejected for full-body exploded suit interaction.
- [Iron Man Mark II marketplace listing](https://www.artstation.com/marketplace/p/Jmzdq/ironman-mark-ii-rigged-3d-model): paid rigged model with glTF listed. No purchase made. Independent armor components are not verified.
- [Iron Man classic printable armor](https://pinshape.com/items/48143-3d-printed-iron-man-classic-vintage-wearable-armor-3d-print-model): creator lists separate STLs and CC BY, login required. Print-oriented geometry lacks the verified complete textured digital suit needed here; not substituted merely to claim true 3D.
- Hulk results include low-detail models or uploads whose authors explicitly state they did not create the source. Strange results include voxel/low-poly models and game-extracted models. These were not silently bundled as lawful high-fidelity replacements.
- A GitHub showcase contains GLB references but gives only generic platform credits and no identifiable asset license. Public availability is not evidence of suitable reuse rights; no asset copied.

## Originally required input — Iron Man dependency resolved

The supplied `Iron+Man` BLEND/FBX/OBJ/MTL package resolves the full-body geometry and separate-component dependency. Source rigging/textures are absent; release rights are still unconfirmed. See the measured model report instead of treating marketplace claims as its attributes.

For the other heroes, provide approved high-resolution alpha artwork (preferably 2000px+ native height) with separable foreground limbs, or textured rigged models. The current low-resolution references can remain composition references, not final-production assets.

If a paid asset is preferred, a budget and chosen candidate must be approved before purchase. No account creation, license acceptance or payment is authorized by this implementation request alone.

## Build order once the model package is available

1. Inspect native model hierarchy and textures; normalize scale, preserve assembled transforms, validate material/color-space and alpha-edge quality. Establish a factual node mapping and record provenance before bundling.
2. Build the reversible 1.7s mechanical assembly score from immutable home transforms; reactor → HUD → locks → faceplate → helmet → shoulders → chest → arms → legs. Add raycast hover/select/isolate, camera focus/orbit, keyboard/tap alternatives and an explicit return control. Reverse into assembly before scroll travel.
3. Frame the actual suit with modeled lab architecture, floor response and matched lights. Build a real city canyon and gamma facility with foreground structures, atmospheric depth and intentional occlusion. Grade approved 2.5D heroes consistently; do not keep the wallpaper-plane shortcut.
4. Replace the camera controller with damped targets and quaternion orientation. Keep a single shared cinematic playhead for actors, effects, copy and portal cameras so smoothing does not introduce cross-system lag.
5. Choreograph overlapping anticipation/action/follow-through/settle: volumetric repulsor → fibers; wrist-anchored elastic web → heavy impact/fragments; dust → growing irregular sparks → animated Strange → live destination crossing.
6. Art-direct desktop, tablet and mobile separately. Run a second pass on edges/light/depth/camera and a third pass on interaction/timing/occlusion. Review all eleven transition checkpoints again, then test accessibility, fallback, reduced motion, texture/model disposal and real-device performance.

This historical build order has now been implemented in substantial part. It is not a claim that remaining masked artwork meets final AAA-character fidelity.

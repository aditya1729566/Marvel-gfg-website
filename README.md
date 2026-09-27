# Enter the Multiverse — GFG Bennett

A continuous cinematic WebGL event experience. One persistent canvas connects a full-body Iron Man GLB inside a clean assembly bay, a city canyon, gamma containment bay, a dedicated Doctor Strange portal interlude, Avengers-style mission dossier and final convergence. Spider-Man and Hulk use supplied 2.5D artwork; Strange uses a sourced casting photograph with restrained image-based animation. They are not rigged 3D models.

## Run

```sh
npm install
npm run dev -- --port 3003
```

Open [the local experience](http://localhost:3003). For production, run `npm run build` then `npm start -- --port 3003`. Deployment uses the Next.js preset in `vercel.json`; the Vercel production domain supplies the social metadata origin automatically. See `DEPLOYMENT.md` for publication status.

## Suit interaction

Click the actual suit once to disassemble it. Click an exposed armor part to isolate and zoom it; drag horizontally or vertically to rotate around its center. Click empty space to return to the complete assembly, then again to reassemble. No visible selection, isolation or rotate buttons are needed.

Keyboard users can focus the suit instructions: Enter opens, arrow keys rotate, Escape returns. A component selector and viewing-angle slider appear on keyboard focus. This retains accessible alternatives without obstructing the 3D scene. Hidden parts are excluded from ray picking, and mesh dragging does not select the page's text.

## Doctor Strange transition

`#doctor-strange` is its own native-scroll section between Hulk and the mission. The camera approaches, holds on a real casting pose while the forearm traces the ring, then enters the expanding portal. The master score is reversible; reduced motion presents a static open gateway. “Skip to mission” remains available without requiring the animation. Source attribution and the third-party noncommercial license claim are documented in `CINEMATIC-ASSETS.md`.

## Organizer information

All event facts live in `src/data/event.ts`. Replace the working title and set `workingTitle: false` when confirmed. Fill in date, venue, format, eligibility, team size, registration deadline, prize pool, schedule, contact email, registration URL, and FAQ answers. Null fields are displayed as pending, not inferred. Registration links switch to the official URL when provided. This site does not collect payments or simulate successful registration.

Learn / Build / Compete are creative themes, not confirmed competition tracks. Spider-Man and Hulk images were supplied by the user; Strange's casting photograph is sourced and attributed. Rights were not independently verified and this is not an official Marvel/Disney site. Source images are preserved in `asset-sources/`; optimized runtime textures are in `public/art/`. See `CINEMATIC-ASSETS.md` for provenance, the third-party noncommercial license claim, and replacement instructions. Set `NEXT_PUBLIC_SITE_URL` to the deployment origin.

## Architecture

- `Experience.tsx`: accessible chapter overlays, native scrolling, navigation, action state, and ScrollTrigger progress mapping.
- `journey/JourneyStage.tsx`: lazy-loaded scene, WebGL capability check, error boundary, and low-power fallback.
- `journey/JourneyScene.tsx`: persistent canvas, camera conductor, lighting, fog, generated environment reflections, particle atmosphere, adaptive DPR.
- `journey/CinematicWorlds.tsx`: spatial world composition, wrist-anchored energy, GPU dust/haze, physical web paths, swinging actor, gamma impact, instanced fracture, Strange passage and convergence.
- `journey/SpatialEnvironments.tsx`: real machined assembly bay, instanced PBR city facades/fire escapes, cracked gamma chamber and open travel corridors. Photographic background plates are no longer mounted.
- `journey/ProductionArmor.tsx` / `armor.ts`: inspected full-body GLB, preserved geometry/materials, twenty independent part controls, immutable assembled/exploded position/quaternion snapshots, selection, isolation, rotation and inspection camera targets.
- `journey/ArtLayers.tsx`: supplied images on segmented, subtly displaced WebGL meshes with runtime silhouette masks, foreground hands and light response.
- `journey/Portal.tsx`: irregular angular portal formation, tapered GPU spark trails, warm lights and a perspective-correct render-target view of the actual exhibition hall.
- `journey/timeline.ts`: one reversible labeled GSAP score shared by the DOM and WebGL effects.
- `journey/CinematicFX.tsx`: one finishing pass for selective bloom, repulsor burn, web tension, radial impact and portal lens distortion.
- `journey/state.ts`: shared state and curved Catmull-Rom camera dolly controls.

Native scrolling sets one target playhead; the frame conductor damps it and seeks one reversible score for every actor/effect. Camera position and quaternion orientation have their own restrained inertia. DOM anchors remain immediately accessible. No scroll hijacking or canvas replacement. Portrait composition uses both width and aspect ratio; particles and DPR adapt. Reduced motion fixes the camera and removes sweeps/warps/shake. Pause/visibility switch rendering to demand, while user-triggered assembly remains responsive. Shader/model/texture loading completes before the scene-ready state. Information remains usable without WebGL.

The supplied model contains 102 meshes, twenty control groups, 504,464 triangles, no skeleton/animations and no image textures. All existing UVs and normals are preserved. Read `MODEL-ACQUISITION.md` for complete measured inventories, source hashes and Blender round-trip checks. An approved LOD pass and real-device profiling are needed before promising mobile frame rates.

## Verification

```sh
npm run lint
npm run typecheck
npm run build
TEST_BASE_URL=http://localhost:3003 npx playwright test
```

Tests default to `http://localhost:3001`. Override with `TEST_BASE_URL` for a different local server. Chromium must be available (`npx playwright install chromium`). Tests cover camera continuity, a single persistent canvas, chapter actions, native anchors, mobile focus trapping, honest event facts, reduced motion, WebGL fallback, overflow at five widths, and Axe accessibility scans on mobile/desktop across all chapters.

See `CINEMATIC-AUDIT.md`, `CINEMATIC-ASSETS.md` and `VERIFICATION.md`. `DESIGN.md` and `REBUILD-AUDIT.md` record the earlier structural prototype and are superseded by the cinematic rebuild.

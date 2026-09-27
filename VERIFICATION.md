# Native-model rebuild verification — 27 September 2026

Current production preview: http://localhost:3004 in the isolated publishing checkout. Publication status is recorded separately in `DEPLOYMENT.md`. This replaces the earlier image-plane prototype verification; its twelve-test result below is archived, not reused as proof of this rebuild.

## Native import and rebuild

The supplied Iron Man BLEND was inspected and exported using official portable Blender. Production GLB: 102 meshes, twenty armor controls, 504,464 triangles, 11,828,744 bytes. No skeleton, animation clips or image textures exist in this source. Scalar metallic/emissive/transmission PBR materials and all existing UVs/normals are retained. Original files remain unchanged.

Blender/Three reimport checks preserve per-mesh triangle counts and all existing UV layers; maximum world-vertex difference is `4.39e-7`, maximum UV-coordinate difference is `2.98e-8`. Full names, materials, assignments and transforms are in `MODEL-ACQUISITION.md` and `asset-sources/model/` reports.

Actual Stark lab, city canyon and gamma facility geometry replaces all photographic background plates. One damped WebGL playhead seeks the global score; camera position/quaternion targets are damped, and the portal camera mirrors the actual final transform. Native armor uses assembled/exploded positions/quaternions, interruptible elapsed-time assembly, twenty selectable groups, isolation, rotation and inspection-camera focus. Reactor emission is retained and the beam reads the actual gauntlet anchor.

The irregular forming portal, tapered GPU spark trails and warm lights reveal the same actual exhibition hall mounted in the destination world. A separate anchorable Doctor Strange scroll section now holds the camera while the photographed casting hand draws the ring, then expands the portal and takes the camera through. The destination remains inside the portal until the crossing; reduced motion keeps a static composition and working skip. Open corridors fix wall occlusion, and the finale is visible through the rear doorway. Portrait composition uses width and aspect ratio. Explicit chapter links are immediate; wheel/touch travel follows the physical camera path. Model/texture Suspense and shader warmup precede readiness, with a truthful low-power failure path.

## Current checks

ESLint, TypeScript and the optimized Webpack production build pass. All **19 production Playwright regression cases are verified** across the full run and focused recheck. The full run passed eighteen cases and caught low-contrast inactive chapter numbers on the new desktop dossier background. After making those numbers opaque and rebuilding, the failing desktop six-chapter accessibility case and the extended Strange interlude accessibility case both passed in a focused two-test run. No failed case remains unverified and no error/accessibility assertions were removed.

Coverage includes actual mesh-click disassembly, exposed chest-plate picking, isolated cursor rotation, empty-space return, keyboard selection/rotation/reassembly, all six worlds, all cinematic connectors, the dedicated reversible Strange interval, reduced motion, WebGL fallback, navigation and responsive/accessibility checks. The checks cover 320, 390, 768, 1024 and 1440px; Axe scans cover all six chapters at 390 and 1440px plus the active reduced-motion Strange interlude.

The hosted smoke check exposed stale scroll boundaries when changing the operating-system motion preference during the journey: the interlude's CSS height changed without a viewport resize. A layout observer now refreshes those boundaries without resetting the master timeline. The interlude regression also switches reduced motion back off, checks two animated portal positions, and follows the skip into the visible mission dossier. All three post-fix checks pass: the extended interlude case and the complete six-chapter 390/1440px responsive/Axe cases. Lint, TypeScript and both publishing/original production builds pass after the fix.

The screenshot-requested revision removes the intro/finale gems and orbit lines, removes the mission exhibit gem, replaces the translucent mission reading surface with an opaque high-contrast panel, and increases fact/timeline/contact typography. Visible armor action/selection/rotation buttons are replaced by direct mesh picking and pivot-centered dragging. Keyboard-focus-only selector and angle slider preserve alternatives. Invisible parts are excluded before triangle raycasting, and a visibility-aware event filter prevents hidden parts intercepting return gestures. Passive pointer handlers preserve native scrolling without console errors or DOM text selection during mesh dragging.

The first native-model review captured six chapters at 1440×1000, 834×1112 and 390×844, eleven checkpoints on all four connectors, and armor views, with no page/console errors. Historical captures belong in the workspace's `outputs/rebuild-review/`; `outputs/current-build-audit/` deliberately records the rejected visual baseline.

The final cursor revision was rendered again into `../pointer-review/`: clean intro/finale rings and mission layouts at desktop, tablet and mobile, actual disassembly/part isolation/drag rotation, mobile pointer selection and the scrolled mission timeline. These captures have no page/console errors. The selected part rotates about its own center rather than orbiting out of view, and hidden armor no longer intercepts empty-space clicks.

Review caught and fixed shader-prefix compilation errors, blocked portal/finale sightlines, frame-dependent assembly delay and slow explicit anchor navigation under software WebGL. Error assertions remain intact. The full six-world functional test has a 90-second software-rendering budget, not an FPS guarantee.

The Marvel-theme revision replaces the briefing and FAQ with opaque Avengers dossier/field-manual surfaces, red framing, restrained halftone backgrounds and readable pale body text. Event facts remain unchanged. Stark and gamma resting scenes are simple steel/concrete bays with local cyan/green lighting; idle haze, overlapping frames and stray adjacent-world geometry were removed. Gamma rubble and cracks appear only during the explicit impact interaction.

New visual captures in `outputs/marvel-theme-review/` cover 1440×1000, 834×1112 and 390×844, both cleaned hero scenes, briefing/FAQ and five interlude checkpoints. The focused refinement in `outputs/marvel-theme-final/` covers desktop, portrait, 844×390 landscape, scrolled mission facts and a separate portrait reduced-motion portal. Both runs report zero horizontal overflow and no browser/console errors. Inspection corrected an offset FAQ card, landscape briefing clipping, premature destination visibility and stale reduced-motion hall visibility. Fixed navigation has an opaque reading-page surface so scrolled facts do not compete with navigation labels.

## Current limits

Iron Man is actual detailed 3D. Spider-Man and Hulk remain low-resolution 2.5D supplied art; masks/depth do not manufacture studio alpha, back surfaces or rigging. Strange now uses a sourced 1159×1920 alpha photograph in a casting pose with restrained code-native forearm/cloak animation, not an invented full-body model. Its source and the third-party noncommercial license claim are documented in `CINEMATIC-ASSETS.md` and visibly attributed in the interlude.

The 504k-triangle suit still needs physical-device profiling and a reviewed LOD/compression pass before frame-rate promises. Asset rights were not independently verified, and event facts remain pending. Automated accessibility checks are not a complete manual audit. No model purchase was made. See `DEPLOYMENT.md` for publication status.

---

# Archived image-plane prototype verification (not the current build)

The production preview is served locally at http://localhost:3003. It has not been deployed publicly.

## Completed checks

- ESLint: passed, no errors or warnings.
- TypeScript: passed.
- Optimized Next.js build: passed with `npm run build -- --webpack`; homepage is statically prerendered and WebGL is dynamically loaded on the client. The final Turbopack retry hit a local worker-socket sandbox error; the documented Webpack alternative completed successfully.
- Playwright: **12 tests passed** against the production build, including the reversible master score and five scrub checkpoints on each of four cinematic connectors.
- Camera position/roll continuity checked at all five world boundaries; reduced-motion camera remains fixed within each chapter.
- One original canvas element persisted across all chapter navigation and actions.
- Armor open/close, keyboard-operated theme nodes, gamma impact feedback, chapter anchors, registration status, and FAQ disclosure passed.
- No page errors or browser console errors during the full interactive journey. Three.js/R3F emits a dependency deprecation warning concerning its internal Clock API; this is not a runtime failure.
- Mobile navigation focus trap, Escape dismissal, trigger focus restoration, and scroll restoration passed.
- No horizontal document overflow at 320, 390, 768, 1024, or 1440 pixels.
- Axe WCAG 2 A/AA and 2.1 AA scans passed across six chapters at 390 and 1440 pixels. Automated scans are not a substitute for a complete accessibility audit.
- Reduced motion and unavailable WebGL both preserve complete event information and truthful registration status.
- Gateway, repulsor, web-fracture, concrete-lift and Doctor Strange portal scenes were captured and inspected. Destination sampling is screen-projected into a live render target, eliminating the earlier magnified empty window.

## Rendered inspection

Inspected desktop hero, Iron Man, Spider-Man, Hulk, mission, finale, mobile character composition, and twenty cinematic connector checkpoints plus the Strange passage. Refined native silhouette masks, foreground hands, mobile actor placement, selective bloom, outward impact distortion, departure visibility and copy overlap. Final production screenshots are in the parent outputs directory (`journey-*.png`, `mobile-*.png` and `cinematic-*.png`).

## Limits and launch requirements

The characters now use supplied artwork on segmented, subtly displaced WebGL meshes, not primitive character models. Source images are only 414–475 pixels wide: native masks and depth treatment do not turn them into high-resolution 3D models or studio alpha cutouts. Fine-edge/background artifacts can remain, particularly in Doctor Strange's complex source. Approved high-resolution transparent artwork is the next fidelity upgrade. Rights were not independently verified. Source provenance, generated environment prompts and replacement instructions are in `CINEMATIC-ASSETS.md`.

Dates, venue, format, eligibility, team size, deadline, rewards, schedule, contact and registration URL remain unconfirmed. Update `src/data/event.ts` and confirm organizer approval/image rights before public launch. Test representative real mobile hardware before making FPS guarantees; automated Chromium uses software WebGL, not a physical phone. Portrait widths were tested; exhaustive device/orientation and full manual accessibility audits remain launch work.

The former primitive character modules were removed after saving a recoverable backup under the workspace's `work/primitive-backup/` directory. Event data, fonts, metadata, public brand/social assets and unrelated files were preserved.

# Cinematic rebuild — 27 September 2026

## Inspected before implementation

Ran the current production site at localhost:3001 and inspected Iron Man, Spider-Man and Hulk in the browser. Inspected the existing opening, repulsor, fracture and mission connector screenshots and the actual component/scroll architecture.

- Iron Man: extruded face plates, sphere shell, box torso and floating box plates; reads as a toy.
- Spider-Man: a sphere mask and tiny primitive swinging body; radial webs read as a diagram, not a physical swing.
- Hulk: faceted icosahedron anatomy and stacked knuckles; not a believable character.
- Travel: moving down the document exposes the outgoing footer and incoming title simultaneously. The repulsor flies away rather than toward the camera. The mission connector is a stack of boxes, not a portal.
- Good work retained: persistent R3F canvas, native chapter anchors, keyboard controls, typography, honest unconfirmed event facts, reduced-motion and WebGL fallback.
- Assets: no character models/textures existed. No verified bundling permission was found for official promotional art. A named-character generation request was rejected; approved character artwork or permission to use original non-Marvel characters is required.

## Implementation direction

Palette: charcoal #080b11, warm ivory #eeece4, cyan #84e5ec, red #ec6262, gamma #b4f37b, portal orange #ff9c45. Keep Bebas Neue and Inter. Keep left-aligned editorial headlines and cinematic right-hand subject placement. Signature interaction: one continuous camera journey, repulsor-to-web burn, web fracture, then a live destination visible through an orange portal.

Replace hero primitives with a swappable, alpha-textured WebGL asset pipeline. Add photographic environment plates with independently moving foreground masks and atmospheric layers. One labeled GSAP master timeline controls the scene and DOM phases. Use curved camera travel, GPU particles, physically anchored webs, a render-target portal interior, restrained screen-space impact, and depth-layered hero lighting. Cap DPR, lower mobile textures/particles, pause hidden tabs and ambient motion, keep reduced-motion traversal immediate and legible.

## Asset decision resolved

The user supplied fifteen character references on this turn. The runtime uses supplied images 1 (Iron Man), 13 (Spider-Man), 8 (Hulk), and 10 (Doctor Strange). Source files are preserved. Background-extraction requests through the built-in image tool were also rejected; no CLI bypass was attempted. The site instead uses code-native WebGL compositing masks and unchanged raster source content. Higher-resolution alpha artwork remains a recommended replacement, not a claim about the current files.

## Rendered refinement

Removed the primitive character modules after preserving a recoverable copy under the workspace's work/primitive-backup. Inspected the initial desktop/mobile images and all four connectors at five checkpoints. Corrected a reserved GLSL identifier, texture color-space setup, masked-edge spill, chapter copy overlap, mobile subject placement, outgoing Hulk occlusion, and portal UV magnification. The portal now samples a screen-projected secondary-camera render of the actual next environment, keeping destination geometry visible as the ring expands. Its secondary camera follows the same master route in destination-local coordinates. No all-character pile-up is used in the finale.

## Delivery constraints

Do not fabricate artwork approval, licensing, event dates, prizes or a registration link. No public deployment is part of this request. The supplied images resolve implementation input, but do not establish independently verified public-use rights. Native character-image resolution and imperfect runtime masks are real remaining limits.

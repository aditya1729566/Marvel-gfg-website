# Earlier structural art direction — superseded by the cinematic rebuild

This document records the former primitive-geometry prototype. The current implementation is described in `CINEMATIC-AUDIT.md`, `CINEMATIC-ASSETS.md` and `README.md`.

The organizing metaphor is a reality core that opens into three different physical worlds. The canvas is the environment of the page, not an illustration placed beside a landing page. DOM text supplies an accessible cinematic overlay; real geometry supplies depth, parallax, lighting, and the travel between chapters.

## World identities

| Chapter | Spatial language | Palette | Type and interaction |
| --- | --- | --- | --- |
| 00 / Assembly | Glass artifact panels, metallic gateway, suspended fragments | Warm gold, smoke, ice blue | Oversized partly outlined title; artifact unfolds as the camera approaches |
| 01 / Iron Man | Engineered armor plates, lab grid, reactor, holographic rings | Deep red, reflective gold, cyan | Precise technical labels; armor assembly opens and closes; reactor becomes the passage |
| 02 / Spider-Man | Instanced city skyline, swinging symbolic figure, dimensional web | Midnight blue, red, pale web light | Slanted kinetic typography; web-linked theme nodes trigger a moving signal |
| 03 / Hulk | Faceted green sculptural mass, enlarged fists, debris, cracked ground | Gamma green, concrete, charcoal | Heavy compressed type; impact extends the fist, lifts rocks, expands a shockwave, adds restrained camera shake |
| 04 / Mission | Concrete fragments lift, rotate, and flatten into metal panels | Steel blue, cool white | Quieter two-column factual briefing, mobile vertical reading flow |
| 05 / Convergence | Three colored rings reunite the helmet, mask, and fist | Gold plus cyan/red/green | Final invitation, honest registration status, compact native FAQ disclosure |

Two font families are sufficient: Bebas Neue for title-sequence typography; Inter for readable copy and navigation. Technical, slanted, and heavy treatment differentiates worlds without introducing unrelated fonts. Primary UI remains restrained so the scene carries the visual detail.

## References and skill application

Research used the [Awwwards 3D collection](https://www.awwwards.com/websites/3d/) and [Dribbble 3D website work](https://dribbble.com/tags/3d-website), alongside earlier Zajno environment/object references. Their useful patterns were integrated spatial objects, disciplined environmental lighting, and quieter controls—not copied page layouts or assets.

The 3d-frontend-engineer skill drove the audit → art direction → implementation → rendered inspection → critique → refinement → test loop. frontend-design guided the signature artifact and nonuniform chapter identities. UI/UX Pro Max supplied 3D/hyperrealism, responsive, and accessibility guidance; generic purple and enterprise design-system suggestions were rejected because they conflicted with the brief. Its specific Three.js search did not return a match; implementation used the skill's general performance guidance and the existing stack instead.

## Motion and usability

Native scroll maps actual chapter offsets to a deterministic 3D camera route. Smooth camera damping, orbit/truck, roll, staged nearby-world visibility, and connector geometry establish continuity. No section-crossfade slideshow is used. Ambient time is local and pauses without restarting gateway/swing phase. Context loss replaces the scene with a readable low-power composition.

Reduced motion removes spatial sweeps, roll, swing, unfolding travel, and gamma shake. It retains a static view of each world and every informational action. Mobile keeps real 3D with lower DPR and moved/scaled models; the mission and FAQ become regular readable sections rather than trapping content in a screen-sized frame.

All dates, money, schedules, eligibility, teams, contact details, and registration remain organizer-controlled. No testimonials, metrics, sponsors, fabricated rewards, or fake submission flows were added.

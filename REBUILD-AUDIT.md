# Structural rebuild audit

## Before implementation

Inspected the previous Experience, portal scene/wrapper, event sections, shared UI, global CSS, data model, motion hook, assets, dependencies, and tests. Rendered the existing hero in the browser. No character models were present; the existing public assets were brand/social vectors and a social image.

The critical weakness was structural: the portal lived in a hero composition while the event unfolded as ordinary stacked DOM sections. Pointer motion and reveal animation were decorative rather than a physical narrative. The single portal did not establish distinct Iron Man, Spider-Man, and Hulk worlds. Reusing the old section system would not satisfy the supplied change brief.

## Rebuilt

Replaced the old portal and section components with a persistent scene and six sequential chapters. Preserved the existing stack, centralized event configuration, fonts, metadata, and truthful pending registration. Created original procedural character-inspired forms and environments. Replaced the global stylesheet with a chapter-based visual system rather than piling overrides onto the old landing-page styles.

## Rendered critique and refinement

1. Reviewed desktop hero and all character chapters in the actual browser.
2. Found front city buildings occluding the mask and persisting into the gamma zone. Moved the city behind the portrait, shortened its depth, and staged it out before Hulk.
3. Found a sideways reactor and mirrored eye/ear offsets. Corrected the geometry orientation and mirrored local coordinates.
4. Found dense Spider chapter text near lower controls on short desktop screens. Reduced title size and spacing at the short-height breakpoint.
5. Reviewed mobile scenes at 390 × 844. Raised Iron/Hulk models away from the ground clipping plane, enlarged mobile copy/control text, and removed an intrusive city coordinate overlay.
6. Strengthened the gamma silhouette with flat-shaded facets, an angular facial plane, enlarged foreground fist, lifted debris, and restrained impact shake. Removed shake in reduced motion.
7. Added physically separating artifact panels, colored finale rings, three reunited symbolic forms, and a moving web-node signal.
8. Confirmed mobile factual briefing and FAQ use natural document flow rather than clipping information in sticky panels.
9. Moved the FAQ below the final chapter after seeing it obscure the convergence. Brought colored ring tubes in front of the metal geometry to prevent their being hidden inside the metal surfaces.
10. Transition screenshots exposed camera damping lag at low software-rendered frame rates. Increased the safe frame-delta allowance so damping follows elapsed time rather than slowing with low FPS. Scoped text palettes to their own chapters so entering content does not inherit the outgoing world's accent. Restricted web tunnels to the two web-connected transitions; the gateway and concrete-panel passage retain their own geometry.

## Checks

Automated checks and rendered screenshots are produced by `tests/experience.spec.ts`. Initial interaction failures were incorrect test selectors (FAQ text included a plus glyph; menu labels included whitespace), not broken controls. Corrected the selectors and reran verification. Final lint, TypeScript, production build, and all 10 browser tests passed. See `VERIFICATION.md` for the check coverage and limitations.

## Remaining launch inputs

The event's official title, dates, venue, format, eligibility, team requirements, deadline, schedule, rewards, contact email, and registration URL have not been supplied. They remain pending in `src/data/event.ts`. The site is a local implementation, not a public deployment. High-end visual quality is a design goal, not a claimed award or third-party certification. Real device performance should be checked before launch; software-rendered test-browser speed is not representative of user hardware.

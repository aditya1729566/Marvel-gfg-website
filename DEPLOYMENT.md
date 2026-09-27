# Publication

Target repository: https://github.com/aditya1729566/Marvel-gfg-website

Live production: https://marvel-gfg-website.vercel.app

Vercel project: `marvel-gfg-website` in the existing account's project scope. This is a new project; no other Vercel website is modified. GitHub `main` is connected to automatic production deployments.

Only this application is copied into an isolated repository checkout before publishing. Original Blender/FBX/OBJ source packages, environment files, dependencies, build caches and browser captures are excluded. The production GLB and optimized supplied artwork are intentionally published as the site's runtime assets. Model inventory/preservation JSON reports are included in Git but excluded from the Vercel upload.

The initial source commit was `6b0fbf8`; it is retained in Git history. The Marvel-theme revision adds the Avengers briefing/FAQ, cleaner Stark/gamma environments, sourced casting-image animation and a separate Doctor Strange portal interval. Production updates are published by pushing the isolated application's `main` branch to the repository above; Vercel builds that revision and promotes the successful deployment to the live alias.

Local lint, TypeScript and the optimized build pass. All nineteen regression cases are verified across the full run and the focused post-fix accessibility recheck. See `VERIFICATION.md` for the exact results and visual-review coverage. Source provenance, attribution and the Strange image's third-party noncommercial license claim are documented in `CINEMATIC-ASSETS.md`.

Asset rights were not independently verified; this is an unofficial superhero-inspired student chapter website. All unconfirmed event information remains explicitly pending.

# Nikhil Jatale — Portfolio

An isometric town, explored by scooter, built with three.js + Vite. Riding around it reveals about/work/projects/skills/contact as physical places instead of page sections.

## Develop

```bash
npm install
npm run dev
```

## Before this goes live

Real bio, historical roles (Syntel, Addicor Tech), and a real (but 2023-era) CV link are filled in from the old portfolio. Still open, each marked `// TODO`:

- `src/data/zones.ts` — Tech Lane's current/most recent role and employer (the old portfolio data stops at 2023 freelance work and doesn't mention Bloomberg or a fintech/e-commerce employer by name); the Station's résumé link is a 2023 CV and should be swapped for a current one
- `src/data/projects.ts` — all four Workshop District case studies are illustrative placeholders — nothing in the old portfolio covers this era of work, so these need real numbers from scratch

## Deploy

Push to `main`. `.github/workflows/deploy.yml` builds with Vite and publishes to GitHub Pages via the "GitHub Actions" Pages source (Settings → Pages → Source → GitHub Actions, one-time setup on the repo).

## Structure

- `src/data/` — all content (zones, projects, skills) as typed data, no hardcoded copy in render code
- `src/scene/` — three.js world: camera rig, lighting, town/road geometry, the scooter+rider character
- `src/systems/` — input (keyboard + click-drag), ground-bounds clamping, zone-proximity detection
- `src/ui/` — DOM overlays: boot sequence, legend, minimap, the slide-out detail panel

# Nikhil Jatale — Portfolio

An isometric town, explored by scooter, built with three.js + Vite. Riding around it reveals about/work/projects/skills/contact as physical places instead of page sections.

## Develop

```bash
npm install
npm run dev
```

## Before this goes live

Placeholder content lives in three files, each marked `// TODO`:

- `src/data/zones.ts` — Tech Lane's company/role chips
- `src/data/projects.ts` — the four Workshop District case studies (all four metrics are illustrative placeholders)
- `src/data/skills.ts` — Skill Tower entries (years currently carried over from the design brief)

Also drop a real `resume.pdf` into `public/assets/` — the Station's résumé link expects it there.

## Deploy

Push to `main`. `.github/workflows/deploy.yml` builds with Vite and publishes to GitHub Pages via the "GitHub Actions" Pages source (Settings → Pages → Source → GitHub Actions, one-time setup on the repo).

## Structure

- `src/data/` — all content (zones, projects, skills) as typed data, no hardcoded copy in render code
- `src/scene/` — three.js world: camera rig, lighting, town/road geometry, the scooter+rider character
- `src/systems/` — input (keyboard + click-drag), ground-bounds clamping, zone-proximity detection
- `src/ui/` — DOM overlays: boot sequence, legend, minimap, the slide-out detail panel

# Nikhil Jatale — Portfolio

An isometric town, explored by scooter, built with three.js + Vite. Riding around it reveals about/work/projects/skills/contact as physical places instead of page sections.

## Develop

```bash
npm install
npm run dev
```

## Before this goes live

Real bio, work history (Orbit Tree → Syntel → Addicor Tech → freelance → Bloomberg, Feb 2024–present, promoted twice, top performer on the team), and skills are filled in from Nikhil directly. Still open, each marked `// TODO`:

- `src/data/zones.ts` — Station's résumé link is a 2023 CV, swap for a current one when available
- `src/data/projects.ts` — all four Workshop District case studies are still illustrative placeholders and need real numbers

**Skill honesty constraint**: Nikhil's real strength is Python/SQL, enterprise data support, orchestration (Airflow), and BI (Power BI/Tableau) — built over ~8 years. AWS/Terraform/cloud infra are explicitly *in progress*, not established (see `src/data/skills.ts` — entries without a `years` value render as "Learning" rather than a fabricated tenure). Keep that distinction when writing the real Workshop District case studies — don't imply years of cloud/IaC mastery in project descriptions or stack chips that the Skill Tower doesn't claim.

## Deploy

Push to `main`. `.github/workflows/deploy.yml` builds with Vite and publishes to GitHub Pages via the "GitHub Actions" Pages source (Settings → Pages → Source → GitHub Actions, one-time setup on the repo).

## Structure

- `src/data/` — all content (zones, projects, skills) as typed data, no hardcoded copy in render code
- `src/scene/` — three.js world: camera rig, lighting, town/road geometry, the scooter+rider character
- `src/systems/` — input (keyboard + click-drag), ground-bounds clamping, zone-proximity detection
- `src/ui/` — DOM overlays: boot sequence, legend, minimap, the slide-out detail panel

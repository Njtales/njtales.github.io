# Coastlight Village

Nikhil Jatale's interactive portfolio, built with React, React Three Fiber, Three.js and TypeScript. Read the sections directly or explore the coastal village with Niro, a golden fox guide.

Public site: [njtales.github.io](https://njtales.github.io/).

## Run locally

Use Node 20.19+ or 22.12+ for the installed Vite version.

```sh
npm install
npm run dev
```

Vite normally serves the app at `http://localhost:5173/`. The plain, printable profile is at `/profile/` and works without JavaScript or WebGL.

```sh
npm run build
npm run preview
```

Both `dev` and `build` first run `scripts/build-profile.mjs`. It generates the initial HTML, social metadata, JSON-LD, robots.txt, sitemap and plain profile from the same content used by the interactive app. Edit `src/scene/profileData.ts` and `src/scene/portfolioData.ts`, then restart the dev server or run `node scripts/build-profile.mjs` to refresh the static pages.

## Explore the village

- Seven landmarks represent Experience, Skills, Projects, Learning, About, Hobbies and Contact.
- The header shortcuts and map open sections immediately; walking is optional.
- Click/tap the ground to walk, or steer with WASD/arrow keys. Touch devices also have a movement pad.
- Near a landmark, press **E** to open or close its card. Escape, the Close button and the backdrop also close it.
- Dialogs manage focus and background interaction. Section navigation remains available if the 3D scene fails.
- The compact map uses large section buttons. The desktop and compact layouts meet at 760px, with additional short-landscape and touch handling.

## Engineering

The world includes terrain-aware two-legged walking, collision-aware pathfinding, a following camera, mixed foliage, distant islands and a Forge with lightweight fire and chimney particles. Most environmental detail is merged into shared geometry. The Clocktower currently uses a painted 2.5D asset derived from the approved concept artwork; the other buildings are procedural drafts.

The canvas loads lazily. Framebuffer resolution is bounded above native CSS resolution, and remains fixed during movement to avoid crawling edges. Lighter graphics reduce shadows and effects. Continuous rendering pauses when a section panel is open or the tab is hidden. Reduced-motion preferences are supported.

## Portfolio facts

The public headline is **Cloud Data Engineer**, as requested by the owner. It is professional positioning; the portfolio does not invent employers, employment dates, credentials or production outcomes. Project descriptions distinguish demonstrable source code from current study, and practice projects remain labelled.

`profileData.ts` holds public links and an optional `cvUrl`. Until a real CV is supplied, the Profile link opens the plain, printable profile. Do not add placeholder downloads or imply a complete employment history.

The social preview currently uses a captured village view. Refresh it after the building artwork has passed visual review.

## Deployment

The GitHub Pages workflow in `.github/workflows/pages.yml` builds and deploys commits to `main`. Local changes are not published until committed and pushed. Keep personal attachments, backup folders and QA artifacts out of release commits.

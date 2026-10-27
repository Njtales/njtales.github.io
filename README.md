# Coastlight Village

A small React Three Fiber portfolio world built from the supplied coastal-village reference.

## Run locally

```sh
npm install
npm run dev
```

Vite prints the local preview URL, usually `http://localhost:5173/`.

## Current scene

- Responsive three-quarter camera following Niro around the island
- Irregular grass shelf, teal ocean, shallow-water inlet, beach, and foam edge
- Left-side dock, tide-line stones, shallow inlet, foam, starfish, and a broken boat
- Seven distinct portfolio landmarks: tapered clocktower, stepped data archive, industrial forge, domed lab, porch cottage, round creative hut, and beacon station
- A cobbled beach approach, worn footpaths, ground location names, and village residents
- Mixed palms, irregular leafy trees, flowering shrubs, painted distant islands, and large white cloud banks
- Cloud Forge with flickering fire, embers, and a rising chimney plume
- Named map sections, a live Niro marker, and direct portfolio shortcuts
- Golden fox adventurer with grounded two-legged walking, keyboard controls, and collision-aware click/tap-to-walk
- Walk near a landmark and press **E** to open or close its section card; Escape and the Close button also return to the world
- Saved graphics and reduced-motion options, phone-sized controls, and an HTML navigation fallback if the 3D view cannot start

## Portfolio content

The seven cards use Nikhil's supplied role, career direction, AWS and data engineering stack, project outlines, learning goals, interests, and personal philosophy. Contact includes email, LinkedIn, and GitHub actions. Add verified dates, measured outcomes, project repositories, certification status, and a CV link as those details become available.

## Deployment

The site is published at [njtales.github.io](https://njtales.github.io/) through GitHub Pages. Commits to `main` build the Vite app and deploy the `dist` directory using the workflow in `.github/workflows/pages.yml`.

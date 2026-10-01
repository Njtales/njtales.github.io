# Coastlight Village

A small React Three Fiber portfolio world built from the supplied coastal-village reference.

## Run locally

```sh
npm install
npm run dev
```

Vite prints the local preview URL, usually `http://localhost:5173/`.

## Current scene

- Fixed, wide three-quarter camera
- Irregular grass shelf, teal ocean, shallow-water inlet, beach, and foam edge
- Left-side dock, tide-line stones, shallow inlet, foam, starfish, and a broken boat
- Seven distinct portfolio landmarks: tapered clocktower, stepped data archive, industrial forge, domed lab, porch cottage, round creative hut, and beacon station
- A cobbled beach approach, worn footpaths, ground location names, and village residents
- Palm silhouettes, flowering shrubs, layered distant peaks, and slowly drifting clouds
- A clickable landmark map that opens the matching portfolio section
- Chibi fox-like hero with idle bob and keyboard movement
- Walk near a landmark and press **E** to open its section card

## Portfolio content

The seven cards use Nikhil's supplied role, career direction, AWS and data engineering stack, project outlines, learning goals, interests, and personal philosophy. Add verified dates, measured outcomes, project repositories, certification status, email, professional profile, and CV links as those details become available.

## Deployment

The site is published at [njtales.github.io](https://njtales.github.io/) through GitHub Pages. Commits to `main` build the Vite app and deploy the `dist` directory using the workflow in `.github/workflows/pages.yml`.

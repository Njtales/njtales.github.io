# Niro's Town

Nikhil Jatale's portfolio — a small walkable 3D town in the style of Cat Quest III. Explore as Niro the fox and walk up to each building to read about a different part of the work: projects, tech stack, experience, and more.

## Stack

React + TypeScript + Vite, [React Three Fiber](https://r3f.docs.pmnd.rs/) (Three.js) for the 3D scene, [drei](https://github.com/pmndrs/drei) for helpers, [Zustand](https://zustand.docs.pmnd.rs/) for state, [GSAP](https://gsap.com/) for UI transitions, Tailwind CSS for the overlay UI.

Every building and character in the scene is built procedurally from primitives in code — there's no external 3D asset pipeline (no Blender/GLTF), which keeps the whole project buildable and editable as plain TypeScript.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Deploys automatically to GitHub Pages on push to `main` via `.github/workflows/deploy.yml`.

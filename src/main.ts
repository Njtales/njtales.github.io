import * as THREE from 'three';
import './styles/main.css';

import { GATE_POSITION } from './data/zones';
import { addLighting } from './scene/lighting';
import { buildTown } from './scene/town';
import { buildRoads } from './scene/roads';
import { Character } from './scene/character';
import { IsoCamera } from './scene/camera';
import { InputController } from './systems/input';
import { clampToTownBounds } from './systems/collision';
import { findActiveZone } from './systems/proximity';
import { Boot } from './ui/boot';
import { Legend } from './ui/legend';
import { Minimap } from './ui/minimap';
import { DetailPanel } from './ui/detailPanel';

const app = document.getElementById('app')!;
const canvas = document.getElementById('scene') as HTMLCanvasElement;

// ---------- Hero (Gate) ----------
const hero = document.createElement('div');
hero.id = 'hero';
hero.innerHTML = `
  <h1>Nikhil — systems that stay up when it matters.</h1>
  <p>WASD / arrows to ride, or click-drag toward a direction</p>
  <p class="hint">Explore the town to find the story.</p>
`;
app.appendChild(hero);

// ---------- Three.js setup ----------
const scene = new THREE.Scene();
addLighting(scene);
buildTown(scene);
buildRoads(scene);

const character = new Character();
character.position.set(GATE_POSITION.x, 0, GATE_POSITION.z);
scene.add(character.group);

const isoCamera = new IsoCamera(window.innerWidth / window.innerHeight);
const { forward, right } = isoCamera.getGroundAxes();

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  isoCamera.onResize(window.innerWidth / window.innerHeight);
});

// ---------- UI ----------
const boot = new Boot(app);
const legend = new Legend(app);
const minimap = new Minimap(app);
const detailPanel = new DetailPanel(app);

// ---------- Input ----------
const input = new InputController(canvas);
input.notifyFirstMove(() => hero.classList.add('hidden'));

// ---------- Game loop ----------
const MOVE_SPEED = 9; // world units per second
const clock = new THREE.Clock();
let activeZoneId: string | null = null;

function tick() {
  const delta = Math.min(clock.getDelta(), 0.05);
  const { right: r, forward: f } = input.getIntent();

  const moveDir = new THREE.Vector2(
    right.x * r + forward.x * f,
    right.z * r + forward.z * f,
  );
  if (moveDir.length() > 1) moveDir.normalize();
  const velocityPerSecond = moveDir.clone().multiplyScalar(MOVE_SPEED);

  const next = clampToTownBounds(
    character.position.x + velocityPerSecond.x * delta,
    character.position.z + velocityPerSecond.y * delta,
  );
  character.position.set(next.x, 0, next.z);
  character.update(delta, velocityPerSecond);

  isoCamera.follow(character.position);

  const zone = findActiveZone(character.position.x, character.position.z);
  if (zone?.id !== activeZoneId) {
    activeZoneId = zone?.id ?? null;
    if (zone) {
      detailPanel.show(zone);
      legend.markVisited(zone.id);
    } else {
      detailPanel.hide();
    }
  }

  minimap.update(character.position.x, character.position.z);

  renderer.render(scene, isoCamera.camera);
  requestAnimationFrame(tick);
}

boot.hide();
requestAnimationFrame(tick);

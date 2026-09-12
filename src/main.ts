import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import './styles/main.css';

import { GATE_POSITION } from './data/zones';
import { addLighting } from './scene/lighting';
import { buildTown } from './scene/town';
import { buildRoads } from './scene/roads';
import { Character } from './scene/character';
import { IsoCamera } from './scene/camera';
import { DustTrail } from './scene/dust';
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

const dustTrail = new DustTrail(scene);

const isoCamera = new IsoCamera(window.innerWidth / window.innerHeight);
const { forward, right } = isoCamera.getGroundAxes();

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, isoCamera.camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.42, // strength — nudged back up a touch from the last pass, which read too dim
  0.4, // radius
  0.68, // threshold
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
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
const MOVE_SPEED = 9; // world units per second, top speed
const ACCEL = 26; // units/s^2 ramping up to top speed
const DECEL = 34; // units/s^2 coasting to a stop — brakes a bit harder than it accelerates
const clock = new THREE.Clock();
let activeZoneId: string | null = null;
const velocity = new THREE.Vector2(); // persists across frames for momentum

function stepFrame(delta: number) {
  const { right: r, forward: f } = input.getIntent();

  const moveDir = new THREE.Vector2(
    right.x * r + forward.x * f,
    right.z * r + forward.z * f,
  );
  if (moveDir.length() > 1) moveDir.normalize();
  const targetVelocity = moveDir.multiplyScalar(MOVE_SPEED);

  // Ease current velocity toward the target instead of snapping to it — an
  // instant on/off felt robotic; ramping up/down reads as an actual vehicle
  // with weight, closer to the physically-simulated feel of a car controller.
  const rate = targetVelocity.lengthSq() > velocity.lengthSq() ? ACCEL : DECEL;
  const diff = targetVelocity.clone().sub(velocity);
  const maxStep = rate * delta;
  if (diff.length() > maxStep) diff.setLength(maxStep);
  velocity.add(diff);

  const next = clampToTownBounds(
    character.position.x + velocity.x * delta,
    character.position.z + velocity.y * delta,
  );
  character.position.set(next.x, 0, next.z);
  character.update(delta, velocity);
  dustTrail.update(delta, character.position, velocity.length());

  isoCamera.follow(character.position, delta);

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
  composer.render();
}

function tick() {
  stepFrame(Math.min(clock.getDelta(), 0.05));
  requestAnimationFrame(tick);
}

boot.hide();
requestAnimationFrame(tick);

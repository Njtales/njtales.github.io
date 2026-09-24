import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import './styles/main.css';

import { GATE_POSITION } from './data/zones';
import { addLighting } from './scene/lighting';
import { buildTown, heightAt } from './scene/town';
import { buildRoads } from './scene/roads';
import { Character } from './scene/character';
import { IsoCamera } from './scene/camera';
import { InputController } from './systems/input';
import { clampToTownBounds, resolveBuildingCollisions } from './systems/collision';
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
  <p>W/Up to accelerate, S/Down to brake or reverse, A/D or arrows to steer</p>
  <p class="hint">Explore the town to find the story.</p>
`;
app.appendChild(hero);

// ---------- Three.js setup ----------
const scene = new THREE.Scene();
addLighting(scene);
const town = buildTown(scene);
buildRoads(scene);

const character = new Character();
character.position.set(GATE_POSITION.x, heightAt(GATE_POSITION.x, GATE_POSITION.z), GATE_POSITION.z);
scene.add(character.group);

const isoCamera = new IsoCamera(window.innerWidth / window.innerHeight);

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
// Daytime scenes are much brighter overall (sky, sunlit grass) and no longer
// rely on glowing windows/lamps for their mood — bloom now only needs to
// catch genuine light sources like the gate's flame, so threshold is raised
// and strength pulled back to avoid a hazy, overexposed look.
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.25, // strength
  0.4, // radius
  0.85, // threshold
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
const minimap = new Minimap(app);
// A selection from the legend "pins" the panel open — see the `pinned` flag
// in the game loop below — so it doesn't get closed again on the next frame
// by the proximity check simply seeing the character isn't really there.
const detailPanel = new DetailPanel(app, () => {
  pinned = false;
  activeZoneId = null;
});
const legend = new Legend(app, (zone) => {
  pinned = true;
  activeZoneId = zone.id;
  detailPanel.show(zone);
  legend.markVisited(zone.id);
});

// ---------- Input ----------
const input = new InputController(canvas);
input.notifyFirstMove(() => hero.classList.add('hidden'));

// ---------- Game loop ----------
// Vehicle-style controls: steering only turns the heading, throttle/brake
// control a signed speed along that heading — not the old omnidirectional
// scheme where each key set an absolute movement direction.
const MAX_FORWARD_SPEED = 9;
const MAX_REVERSE_SPEED = 4;
const THROTTLE_ACCEL = 14; // units/s^2 while the gas is held
const BRAKE_DECEL = 24; // units/s^2 while braking (speed > 0) — stops harder than it accelerates
const REVERSE_ACCEL = 7; // units/s^2 accelerating backward once already stopped
const COAST_DECEL = 6; // units/s^2 natural drag with no input at all — this is the inertia:
// releasing the throttle is not the same as braking, it glides to a stop instead of snapping
const TURN_RATE = 2.6; // radians/sec
const WHEEL_OFFSET = 0.75; // roughly half the wheelbase — see character.ts's wheel positions

// Establishing-shot zoom: the camera eases out to a wider view after a few
// seconds of no input (see IsoCamera.setTargetViewSize), revealing more of
// the town — including the far cluster — as landmarks, then eases back in
// the moment the visitor touches a control again.
const BASE_VIEW_SIZE = 26;
const IDLE_VIEW_SIZE = 58;
const IDLE_DELAY = 3; // seconds of no steer/throttle input before zooming out

const clock = new THREE.Clock();
let activeZoneId: string | null = null;
let idleTime = 0;
// True while the detail panel is showing a zone the legend/text-nav jumped
// to directly, rather than one the character actually walked up to —
// suppresses the proximity system's show/hide until the visitor closes it
// or really drives into a (possibly different) zone.
let pinned = false;
let heading = 0; // steering-controlled facing angle; 0 = facing -Z, matching spawn orientation
let speed = 0; // signed scalar along heading — positive forward, negative reverse

function stepFrame(delta: number) {
  const { steer, throttle } = input.getIntent();

  if (steer !== 0 || throttle !== 0) {
    idleTime = 0;
    isoCamera.setTargetViewSize(BASE_VIEW_SIZE);
  } else {
    idleTime += delta;
    if (idleTime >= IDLE_DELAY) isoCamera.setTargetViewSize(IDLE_VIEW_SIZE);
  }

  heading += steer * TURN_RATE * delta;

  if (throttle > 0) {
    speed = Math.min(speed + THROTTLE_ACCEL * delta, MAX_FORWARD_SPEED);
  } else if (throttle < 0) {
    if (speed > 0) {
      speed = Math.max(speed - BRAKE_DECEL * delta, 0); // braking
    } else {
      speed = Math.max(speed - REVERSE_ACCEL * delta, -MAX_REVERSE_SPEED); // reversing
    }
  } else if (speed > 0) {
    speed = Math.max(speed - COAST_DECEL * delta, 0);
  } else if (speed < 0) {
    speed = Math.min(speed + COAST_DECEL * delta, 0);
  }

  const headingDir = new THREE.Vector2(Math.sin(heading), -Math.cos(heading));

  const moved = resolveBuildingCollisions(
    character.position.x + headingDir.x * speed * delta,
    character.position.z + headingDir.y * speed * delta,
  );
  const next = clampToTownBounds(moved.x, moved.z);

  // Sample the ground at the front and rear wheel positions rather than one
  // point at the vehicle's center — on real terrain relief, a single-point
  // sample keeps the body perfectly flat and lets one wheel sink into (or
  // float off) any slope steeper than a couple of degrees. Approximates
  // character.ts's actual wheel z-offsets (-0.78 front, 0.7 rear).
  const frontX = next.x + headingDir.x * WHEEL_OFFSET;
  const frontZ = next.z + headingDir.y * WHEEL_OFFSET;
  const rearX = next.x - headingDir.x * WHEEL_OFFSET;
  const rearZ = next.z - headingDir.y * WHEEL_OFFSET;
  const frontHeight = heightAt(frontX, frontZ);
  const rearHeight = heightAt(rearX, rearZ);
  const groundPitch = Math.atan2(frontHeight - rearHeight, WHEEL_OFFSET * 2);

  character.position.set(next.x, (frontHeight + rearHeight) / 2, next.z);
  character.update(delta, headingDir, speed, groundPitch);

  isoCamera.follow(character.position, delta);

  const zone = findActiveZone(character.position.x, character.position.z);
  if (!pinned) {
    if (zone?.id !== activeZoneId) {
      activeZoneId = zone?.id ?? null;
      if (zone) {
        detailPanel.show(zone);
        legend.markVisited(zone.id);
      } else {
        detailPanel.hide();
      }
    }
  } else if (zone && zone.id !== activeZoneId) {
    // Real arrival takes back over from a pinned text-nav selection.
    pinned = false;
    activeZoneId = zone.id;
    detailPanel.show(zone);
    legend.markVisited(zone.id);
  }

  minimap.update(character.position.x, character.position.z);
  town.update(delta);
  composer.render();
}

function tick() {
  stepFrame(Math.min(clock.getDelta(), 0.05));
  requestAnimationFrame(tick);
}

boot.hide();
requestAnimationFrame(tick);

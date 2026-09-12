import * as THREE from 'three';

interface Puff {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  age: number;
  active: boolean;
}

const POOL_SIZE = 20;
const SPAWN_INTERVAL = 0.07;
const LIFETIME = 0.55;
const MOVE_THRESHOLD = 1.5;

/** Small fading dust puffs kicked up behind the scooter while it's moving at speed. */
export class DustTrail {
  private puffs: Puff[] = [];
  private timeSinceSpawn = 0;
  private nextIndex = 0;

  constructor(scene: THREE.Scene) {
    const geo = new THREE.CircleGeometry(0.16, 8);
    for (let i = 0; i < POOL_SIZE; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xcbb6a8,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      scene.add(mesh);
      this.puffs.push({ mesh, material, age: 0, active: false });
    }
  }

  update(delta: number, emitPosition: THREE.Vector3, speed: number) {
    this.timeSinceSpawn += delta;
    if (speed > MOVE_THRESHOLD && this.timeSinceSpawn >= SPAWN_INTERVAL) {
      this.timeSinceSpawn = 0;
      this.spawn(emitPosition);
    }

    for (const p of this.puffs) {
      if (!p.active) continue;
      p.age += delta;
      if (p.age >= LIFETIME) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      const t = p.age / LIFETIME;
      p.material.opacity = 0.35 * (1 - t);
      p.mesh.scale.setScalar(0.5 + t * 1.2);
    }
  }

  private spawn(position: THREE.Vector3) {
    const p = this.puffs[this.nextIndex];
    this.nextIndex = (this.nextIndex + 1) % this.puffs.length;
    p.active = true;
    p.age = 0;
    p.mesh.visible = true;
    p.mesh.scale.setScalar(0.5);
    p.mesh.position.set(
      position.x + (Math.random() - 0.5) * 0.3,
      0.03,
      position.z + (Math.random() - 0.5) * 0.3,
    );
  }
}

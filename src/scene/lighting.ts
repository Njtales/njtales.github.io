import * as THREE from 'three';

/** Warm twilight mood: cool ambient fill, warm key light, near-black fog for depth. */
export function addLighting(scene: THREE.Scene) {
  scene.background = new THREE.Color(0x0e0b12);
  scene.fog = new THREE.Fog(0x0e0b12, 60, 140);

  const ambient = new THREE.AmbientLight(0x3a3048, 1.1);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffb877, 0.9);
  key.position.set(30, 45, 20);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x7c93ff, 0.35);
  rim.position.set(-25, 20, -30);
  scene.add(rim);

  const hemi = new THREE.HemisphereLight(0x4a3f5c, 0x0e0b12, 0.5);
  scene.add(hemi);
}

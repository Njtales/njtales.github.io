import * as THREE from 'three';

/** Warm twilight mood: cool ambient fill, warm key light casting soft shadows, near-black fog for depth. */
export function addLighting(scene: THREE.Scene) {
  scene.background = new THREE.Color(0x0e0b12);
  scene.fog = new THREE.Fog(0x0e0b12, 60, 140);

  const ambient = new THREE.AmbientLight(0x3a3048, 1.1);
  scene.add(ambient);

  // Town spans roughly x:[-34,36] z:[-88,10] — center the shadow frustum over
  // it (not the origin) so buildings near the Station/Skill Tower aren't clipped.
  const townCenter = new THREE.Vector3(1, 0, -39);
  const key = new THREE.DirectionalLight(0xffb877, 1.0);
  key.position.copy(townCenter).add(new THREE.Vector3(30, 45, 20));
  key.target.position.copy(townCenter);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -70;
  key.shadow.camera.right = 70;
  key.shadow.camera.top = 70;
  key.shadow.camera.bottom = -70;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 150;
  // normalBias (offsets the shadow lookup along the surface normal) clears up
  // the acne/hatching artifact that plain depth bias alone left visible on
  // large flat surfaces like the ground, especially in the gate's shadow.
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.06;
  scene.add(key);
  scene.add(key.target);

  const rim = new THREE.DirectionalLight(0x7c93ff, 0.35);
  rim.position.set(-25, 20, -30);
  scene.add(rim);

  const hemi = new THREE.HemisphereLight(0x4a3f5c, 0x0e0b12, 0.5);
  scene.add(hemi);
}

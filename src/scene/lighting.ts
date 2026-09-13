import * as THREE from 'three';

/** Bright daytime mood: warm sunlight, a sky-tinted hemisphere fill, soft shadows. */
export function addLighting(scene: THREE.Scene) {
  scene.background = new THREE.Color(0xa9d1e0);
  scene.fog = new THREE.Fog(0xcfe6e8, 70, 160);

  const ambient = new THREE.AmbientLight(0xfff6e8, 1.2);
  scene.add(ambient);

  // Town spans roughly x:[-34,36] z:[-88,10] — center the shadow frustum over
  // it (not the origin) so buildings near the Station/Skill Tower aren't clipped.
  const townCenter = new THREE.Vector3(1, 0, -39);
  const key = new THREE.DirectionalLight(0xfff4d6, 1.5);
  key.position.copy(townCenter).add(new THREE.Vector3(30, 55, 20));
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

  // Soft sky-blue fill from the opposite side, standing in for bounced skylight.
  const rim = new THREE.DirectionalLight(0xbfe0f0, 0.3);
  rim.position.set(-25, 20, -30);
  scene.add(rim);

  const hemi = new THREE.HemisphereLight(0xaed4e0, 0x6b8f4e, 0.75);
  scene.add(hemi);
}

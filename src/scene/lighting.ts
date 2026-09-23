import * as THREE from 'three';

/** Bright daytime mood: warm sunlight, a sky-tinted hemisphere fill, soft shadows. */
export function addLighting(scene: THREE.Scene) {
  scene.background = new THREE.Color(0xa9d1e0);
  // Pushed further out than a close-up camera would need — the idle
  // "establishing shot" zoom (see main.ts) widens the view specifically to
  // show the far cluster as a landmark, which only works if fog doesn't eat
  // it first.
  scene.fog = new THREE.Fog(0xcfe6e8, 100, 230);

  const ambient = new THREE.AmbientLight(0xfff6e8, 1.2);
  scene.add(ambient);

  // Town spans roughly x:[-13,30] z:[-72,18] — center the shadow frustum over
  // it (not the origin) so buildings near the Skill Tower aren't clipped.
  const townCenter = new THREE.Vector3(8, 0, -27);
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
  // Raised further to clear a new artifact: the terrain's own small bump
  // relief was self-shadowing at the wrong offset, producing a faint but
  // very regular diagonal-grid acne pattern that followed the ground mesh's
  // triangulation once the ground texture became smooth enough to reveal it.
  key.shadow.normalBias = 0.15;
  scene.add(key);
  scene.add(key.target);

  // Soft sky-blue fill from the opposite side, standing in for bounced skylight.
  const rim = new THREE.DirectionalLight(0xbfe0f0, 0.3);
  rim.position.set(-25, 20, -30);
  scene.add(rim);

  const hemi = new THREE.HemisphereLight(0xaed4e0, 0x6b8f4e, 0.75);
  scene.add(hemi);
}

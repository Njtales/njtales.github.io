import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildingPoint } from './villageBuildingGeometry'
import { useAmbientTime, useScenePreferences } from './ScenePreferences'

export const FORGE_EFFECT_BUDGET = { cloudPuffs: 32, embers: 5, flames: 6, drawCalls: 3 }

function particleGeometry(count: number) {
  const geometry = new THREE.PlaneGeometry(2, 2)
  const seeds = new Float32Array(count * 2)
  for (let i = 0; i < count; i++) seeds.set([(i + .35) / count, (i * .618034) % 1], i * 2)
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 2))
  return geometry
}

function particleMaterial(embers: boolean) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false,
    uniforms: { uTime: { value: 0 }, uEmbers: { value: Number(embers) },
      uShade: { value: new THREE.Color('#bdcccd') }, uLight: { value: new THREE.Color('#fffdf3') },
      uSpark: { value: new THREE.Color('#ffcf65') } },
    vertexShader: `
      attribute vec2 aSeed;
      uniform float uTime, uEmbers;
      varying vec2 vUv;
      varying float vOpacity, vAge;
      void main() {
        float age = fract(uTime / mix(15.5, 2.1, uEmbers) + aSeed.x);
        float seed = aSeed.y * 6.283185;
        vec3 centre;
        float size;
        if (uEmbers > .5) {
          centre = vec3(sin(seed + age * 3.0) * .28, age * 1.16, .018);
          size = .014 + aSeed.y * .010;
          vOpacity = sin(age * 3.14159) * .8;
        } else {
          // A narrow warm wisp becomes broad pale puffs before dispersing.
          centre = vec3(-3.4 * pow(age, 1.65) + sin(age * 9.0 + seed) * age * .62,
            pow(age, 1.35) * 8.0, -1.65 * age + cos(seed) * age * .25);
          size = (.22 + pow(age, 1.15) * 1.45) * (.84 + aSeed.y * .30);
          vOpacity = smoothstep(0.0, .035, age) * (1.0 - smoothstep(.73, 1.0, age)) * .68;
        }
        // Billboard in view space; no per-frame matrices or particle objects.
        vec4 viewCentre = modelViewMatrix * vec4(centre, 1.0);
        viewCentre.xy += position.xy * size * vec2(mix(1.35, 1.0, uEmbers), 1.0);
        gl_Position = projectionMatrix * viewCentre;
        vUv = uv * 2.0 - 1.0;
        vAge = age;
      }`,
    fragmentShader: `
      uniform float uEmbers;
      uniform vec3 uShade, uLight, uSpark;
      varying vec2 vUv;
      varying float vOpacity, vAge;
      void main() {
        float alpha;
        vec3 colour;
        if (uEmbers > .5) {
          alpha = (1.0 - smoothstep(.25, 1.0, length(vUv))) * vOpacity;
          colour = uSpark;
        } else {
          float edge = min(length(vUv - vec2(-.32, -.05)) - .49,
            min(length(vUv - vec2(.07, .15)) - .59, length(vUv - vec2(.40, -.08)) - .42));
          alpha = (1.0 - smoothstep(-.16, .06, edge)) * vOpacity;
          float light = clamp(.52 + vUv.y * .35 + vAge * .22, 0.0, 1.0);
          colour = mix(uShade, uLight, light);
        }
        if (alpha < .005) discard;
        gl_FragColor = vec4(colour, alpha);
        #include <colorspace_fragment>
      }`,
  })
}

function fireGeometry() {
  const shape = new THREE.Shape()
  shape.moveTo(-.5, 0)
  shape.bezierCurveTo(-.61, .32, -.11, .45, -.13, 1)
  shape.bezierCurveTo(.30, .76, .13, .60, .36, .43)
  shape.bezierCurveTo(.62, .24, .48, .08, .5, 0)
  shape.closePath()
  const geometry = new THREE.ShapeGeometry(shape, 5)
  geometry.setAttribute('aCore', new THREE.InstancedBufferAttribute(new Float32Array([0, 0, 0, 1, 1, 1]), 1))
  geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(new Float32Array([.2, 2.7, 4.4, 1.2, 3.5, 5.3]), 1))
  return geometry
}

function fireMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, depthWrite: false, toneMapped: false,
    uniforms: { uTime: { value: 0 }, uOrange: { value: new THREE.Color('#ee7528') },
      uGold: { value: new THREE.Color('#ffc44b') }, uCream: { value: new THREE.Color('#fff0a2') } },
    vertexShader: `
      attribute float aCore, aPhase;
      uniform float uTime;
      varying vec2 vWindow;
      varying float vCore, vHeight;
      void main() {
        vec3 flame = position;
        flame.x += flame.y * flame.y * sin(uTime * 3.7 + aPhase) * .11;
        flame.y *= .89 + sin(uTime * 4.1 + aPhase) * .075 + sin(uTime * 2.3 + aPhase) * .035;
        vec4 local = instanceMatrix * vec4(flame, 1.0);
        vWindow = local.xy;
        vCore = aCore; vHeight = position.y;
        gl_Position = projectionMatrix * modelViewMatrix * local;
      }`,
    fragmentShader: `
      uniform vec3 uOrange, uGold, uCream;
      varying vec2 vWindow;
      varying float vCore, vHeight;
      void main() {
        // Keep every flickering tip within the existing arched furnace.
        if (abs(vWindow.x) > .52 || (vWindow.y > .82 && length(vec2(vWindow.x, vWindow.y - .82)) > .52)) discard;
        vec3 colour = mix(uOrange, uGold, .72 - vHeight * .38);
        gl_FragColor = vec4(mix(colour, uCream, vCore * (.93 - vHeight * .18)), 1.0);
        #include <colorspace_fragment>
      }`,
  })
}

export function createForgeEffectResources(light = false) {
  return { smoke: particleGeometry(light ? 18 : FORGE_EFFECT_BUDGET.cloudPuffs),
    sparks: particleGeometry(light ? 3 : FORGE_EFFECT_BUDGET.embers), fire: fireGeometry(),
    smokeMaterial: particleMaterial(false), sparkMaterial: particleMaterial(true), fireMaterial: fireMaterial() }
}

export function ForgeEffects() {
  const { quality } = useScenePreferences(), ambient = useAmbientTime(), light = quality === 'light'
  const flames = useRef<THREE.InstancedMesh>(null)
  const effects = useMemo(() => createForgeEffectResources(light), [light])
  const chimney = useMemo(() => buildingPoint('cloud-forge', .94, 5.34, -.78), [])
  const hearth = useMemo(() => buildingPoint('cloud-forge', -.60, .99, 1.555), [])
  useLayoutEffect(() => {
    if (!flames.current) return
    const matrix = new THREE.Object3D()
    const placement = [[-.25, .50, 1.03], [.25, .45, .89], [0, .56, 1.28],
      [-.17, .24, .58], [.17, .25, .65], [0, .25, .85]]
    placement.forEach(([x, width, height], i) => {
      matrix.position.set(x, 0, i < 3 ? 0 : .008)
      matrix.scale.set(width, height, 1); matrix.updateMatrix()
      flames.current!.setMatrixAt(i, matrix.matrix)
    })
    flames.current.instanceMatrix.needsUpdate = true
  }, [effects])
  useFrame(() => {
    effects.smokeMaterial.uniforms.uTime.value = ambient.current
    effects.sparkMaterial.uniforms.uTime.value = ambient.current
    effects.fireMaterial.uniforms.uTime.value = ambient.current
  })
  useEffect(() => () => Object.values(effects).forEach(resource => resource.dispose()), [effects])
  return <group dispose={null}>
    <instancedMesh name="Cloud Forge chimney clouds" position={chimney}
      args={[effects.smoke, effects.smokeMaterial, light ? 18 : FORGE_EFFECT_BUDGET.cloudPuffs]} frustumCulled={false} raycast={() => {}} />
    <group position={hearth}>
      <instancedMesh name="Cloud Forge live furnace" ref={flames}
        args={[effects.fire, effects.fireMaterial, FORGE_EFFECT_BUDGET.flames]} frustumCulled={false} raycast={() => {}} />
      <instancedMesh name="Cloud Forge embers" position={[0, .06, .024]}
        args={[effects.sparks, effects.sparkMaterial, light ? 3 : FORGE_EFFECT_BUDGET.embers]} frustumCulled={false} raycast={() => {}} />
    </group>
  </group>
}

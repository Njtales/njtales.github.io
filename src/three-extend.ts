import { extend, type ThreeElement } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Registers <roundedBoxGeometry args={[w,h,d,segments,radius]} /> as a JSX
// tag — R3F only auto-recognizes plain THREE.* geometries, so anything from
// three/examples needs this one-time extend() call before it's used
// anywhere. Used for building bodies to soften the sharp box-corner look
// into something closer to the reference's cartoonish, toy-like silhouette.
extend({ RoundedBoxGeometry });

declare module '@react-three/fiber' {
  interface ThreeElements {
    roundedBoxGeometry: ThreeElement<typeof RoundedBoxGeometry>;
  }
}

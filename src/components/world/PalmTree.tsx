import { useMemo } from 'react';
import { getToonGradientMap } from '../../materials/toonGradient';

const TRUNK_COLOR = '#8B5E3C';
const LEAF_COLORS = ['#2D8C1A', '#3DAA2A'];
const COCONUT_COLOR = '#5C3A1A';
const LEAF_COUNT = 5;

function hash(n: number): number {
  const s = Math.sin(n * 43.17) * 71923.31;
  return s - Math.floor(s);
}

interface Props {
  position: [number, number, number];
  scale?: number;
  seed?: number;
}

/** A low-poly cartoon palm tree — a leaning cylinder trunk with 5 flat cone
 * "leaf fans" splayed around the top and a couple of coconuts, all stacked
 * primitives in the same spirit as the rest of the world's procedural
 * buildings/character. The only tree in the scene until this pass — the
 * world previously had none at all. */
export function PalmTree({ position, scale = 1, seed = 0 }: Props) {
  const gradientMap = useMemo(() => getToonGradientMap(), []);
  const leanZ = (hash(seed * 7.3) - 0.5) * 0.3;

  const leaves = useMemo(
    () =>
      Array.from({ length: LEAF_COUNT }, (_, i) => {
        const azimuth = (i / LEAF_COUNT) * Math.PI * 2 + hash(seed * 3.1 + i) * 0.4;
        const color = LEAF_COLORS[i % LEAF_COLORS.length];
        return { azimuth, color };
      }),
    [seed],
  );

  return (
    <group position={position} scale={scale} rotation={[0, hash(seed * 5.5) * Math.PI * 2, leanZ]}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.25, 3, 6]} />
        <meshToonMaterial color={TRUNK_COLOR} gradientMap={gradientMap} />
      </mesh>

      <group position={[0, 3, 0]}>
        {leaves.map((leaf, i) => (
          <group key={i} rotation={[0, leaf.azimuth, 0]}>
            {/* Cone's axis defaults to local Y (apex up, base at origin).
                Rotating -1.0 rad about Z tips that axis to point mostly
                outward (+X in this azimuth-rotated frame) with a bit of
                upward lift, then the position offset pushes the whole
                frond out from the trunk instead of through its center —
                reads as a leaf springing from the crown and arching out. */}
            <mesh position={[0.5, 0.25, 0]} rotation={[0, 0, -1.0]} castShadow>
              <coneGeometry args={[0.8, 1.8, 4, 1]} />
              <meshToonMaterial color={leaf.color} gradientMap={gradientMap} />
            </mesh>
          </group>
        ))}
      </group>

      {Array.from({ length: 2 + Math.floor(hash(seed * 9.9) * 2) }, (_, i) => (
        <mesh
          key={i}
          position={[(hash(seed * 11 + i) - 0.5) * 0.3, 2.95 + hash(seed * 13 + i) * 0.1, (hash(seed * 17 + i) - 0.5) * 0.3]}
        >
          <sphereGeometry args={[0.12, 6, 6]} />
          <meshToonMaterial color={COCONUT_COLOR} gradientMap={gradientMap} />
        </mesh>
      ))}
    </group>
  );
}

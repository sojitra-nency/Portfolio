'use client';

/**
 * StarField — three parallax-layered instanced star planes for spatial
 * depth behind the neural network. Deeper layers are denser and spread
 * wider; closer layers are fewer and smaller.
 *
 * Budget: every frame we do **3 group-translation writes** — no per-star
 * matrix churn — so the whole system stays under ~0.5 ms of JS work.
 * Three draw calls total (one per InstancedMesh). All instance data is
 * populated once per `count` change in a `useEffect` and never rewritten.
 *
 * GPU-tier adaptation: tiers 0 and 1 halve every layer's instance count.
 * The local `useGPUTier` fallback here is a lean version of what Task 23
 * will consolidate into `useResponsive`.
 */

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { useHudStore } from '@/store/useHudStore';

// ---------------------------------------------------------------------------
// Layer configuration (deepest → closest)
// ---------------------------------------------------------------------------

const PLANES = [
  // Deep background — vast, fills corners and edges
  { z: -350, count: 4000, parallax: 0.01, spreadX: 900, spreadY: 650, spreadZ: 60, sizeMin: 0.15, sizeMax: 0.40 },
  // Mid-deep — main star field body
  { z: -250, count: 3200, parallax: 0.03, spreadX: 700, spreadY: 500, spreadZ: 50, sizeMin: 0.20, sizeMax: 0.55 },
  // Mid layer
  { z: -180, count: 2200, parallax: 0.06, spreadX: 520, spreadY: 370, spreadZ: 40, sizeMin: 0.28, sizeMax: 0.65 },
  // Near layer — slightly brighter, fewer
  { z: -100, count: 1200, parallax: 0.10, spreadX: 380, spreadY: 270, spreadZ: 30, sizeMin: 0.35, sizeMax: 0.80 },
  // Hero stars — sparse, large, punchy highlights
  { z: -140, count: 200,  parallax: 0.05, spreadX: 750, spreadY: 540, spreadZ: 80, sizeMin: 0.70, sizeMax: 1.50 },
] as const;

type PlaneConfig = (typeof PLANES)[number];

// ---------------------------------------------------------------------------
// Single parallax layer
// ---------------------------------------------------------------------------

function StarPlane({
  config,
  halveCount,
}: {
  config: PlaneConfig;
  halveCount: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  const count = halveCount ? Math.floor(config.count / 2) : config.count;

  // Populate instance matrices + colors once per count change.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      pos.set(
        (Math.random() * 2 - 1) * config.spreadX,
        (Math.random() * 2 - 1) * config.spreadY,
        config.z + (Math.random() * 2 - 1) * config.spreadZ * 0.5,
      );
      scale.setScalar(
        config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin),
      );
      matrix.compose(pos, quat, scale);
      mesh.setMatrixAt(i, matrix);

      // Varied star colours: mix of blue-white (O/B type), pure white (A),
      // and a few warm yellow-white (F/G) — gives the field a natural look.
      const alpha = 0.70 + Math.random() * 0.30;
      const starType = Math.random();
      let r, g, b;
      if (starType < 0.55) {
        // Blue-white (most common in deep field)
        r = alpha * (0.80 + Math.random() * 0.15);
        g = alpha * (0.88 + Math.random() * 0.10);
        b = alpha * 1.00;
      } else if (starType < 0.85) {
        // Pure white
        const w = alpha * (0.92 + Math.random() * 0.08);
        r = w; g = w; b = w;
      } else {
        // Warm yellow-white
        r = alpha * 1.00;
        g = alpha * (0.90 + Math.random() * 0.08);
        b = alpha * (0.72 + Math.random() * 0.15);
      }
      color.setRGB(r, g, b);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [
    count,
    config.z,
    config.spreadX,
    config.spreadY,
    config.spreadZ,
    config.sizeMin,
    config.sizeMax,
  ]);

  // Parallax: translate the whole group once per frame — no per-instance
  // work. camera.position × coefficient keeps deep planes almost still
  // while closer ones drift more, producing depth.
  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    group.position.x = camera.position.x * config.parallax;
    group.position.y = camera.position.y * config.parallax;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        key={count}
        ref={meshRef}
        args={[undefined, undefined, count]}
        frustumCulled={false}
        renderOrder={1}
      >
        <sphereGeometry args={[1, 6, 4]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// StarField — exported scene component
// ---------------------------------------------------------------------------

export default function StarField() {
  const tier = useHudStore((s) => s.gpuTier);
  const isMobile = useHudStore((s) => s.isMobile);
  // Halve on tier 0/1 OR on mobile — fewer draw-calls and overdraw on
  // small screens that also tend to have lower fillrate.
  const halveCount = tier <= 1 || isMobile;
  return (
    <>
      {PLANES.map((config) => (
        <StarPlane key={config.z} config={config} halveCount={halveCount} />
      ))}
    </>
  );
}

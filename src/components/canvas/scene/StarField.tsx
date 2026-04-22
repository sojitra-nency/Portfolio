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

import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { getGPUTier } from 'detect-gpu';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Layer configuration (deepest → closest)
// ---------------------------------------------------------------------------

const PLANES = [
  { z: -300, count: 1500, parallax: 0.02, spreadX: 420, spreadY: 310, spreadZ: 40, sizeMin: 0.06, sizeMax: 0.18 },
  { z: -200, count: 1500, parallax: 0.06, spreadX: 280, spreadY: 200, spreadZ: 30, sizeMin: 0.05, sizeMax: 0.15 },
  { z: -100, count: 1000, parallax: 0.12, spreadX: 160, spreadY: 115, spreadZ: 20, sizeMin: 0.05, sizeMax: 0.12 },
] as const;

type PlaneConfig = (typeof PLANES)[number];

// ---------------------------------------------------------------------------
// GPU tier (local fallback; folded into useResponsive in Task 23)
// ---------------------------------------------------------------------------

function useGPUTier(): number {
  const [tier, setTier] = useState<number>(2);
  useEffect(() => {
    let cancelled = false;
    getGPUTier().then((result) => {
      if (!cancelled) setTier(result.tier ?? 2);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return tier;
}

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

      // Alpha is baked into RGB — additive blending sums RGB regardless
      // of material alpha, so a 0.4 RGB contributes 0.4 of full brightness.
      const alpha = 0.4 + Math.random() * 0.6;
      color.setRGB(alpha, alpha, alpha);
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
        // Remount if count changes — the instance buffer is fixed-size.
        key={count}
        ref={meshRef}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          depthWrite={false}
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
  const tier = useGPUTier();
  const halveCount = tier <= 1;
  return (
    <>
      {PLANES.map((config) => (
        <StarPlane key={config.z} config={config} halveCount={halveCount} />
      ))}
    </>
  );
}

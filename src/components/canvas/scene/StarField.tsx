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
  // Hero stars — sparse bokeh blobs, larger for soft haze effect
  { z: -140, count: 200,  parallax: 0.05, spreadX: 750, spreadY: 540, spreadZ: 80, sizeMin: 1.00, sizeMax: 2.20 },
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

      // Star colours shifted toward blue-violet bokeh to match the reference
      // image's background depth haze. Higher alpha makes the haze more visible.
      const alpha = 0.80 + Math.random() * 0.20;
      const starType = Math.random();
      let r, g, b;
      if (starType < 0.50) {
        // Electric blue-violet (dominant — matches dendrite color palette)
        r = alpha * (0.35 + Math.random() * 0.20);
        g = alpha * (0.40 + Math.random() * 0.15);
        b = alpha * (0.90 + Math.random() * 0.10);
      } else if (starType < 0.75) {
        // Soft violet-purple bokeh blobs
        r = alpha * (0.55 + Math.random() * 0.25);
        g = alpha * (0.30 + Math.random() * 0.15);
        b = alpha * (0.85 + Math.random() * 0.15);
      } else if (starType < 0.92) {
        // Near-white with slight blue tint
        const w = alpha * (0.85 + Math.random() * 0.15);
        r = w * 0.88; g = w * 0.92; b = w;
      } else {
        // Rare warm accent — tiny orange-red pinpoints for depth contrast
        r = alpha * (0.90 + Math.random() * 0.10);
        g = alpha * (0.45 + Math.random() * 0.15);
        b = alpha * (0.15 + Math.random() * 0.15);
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
// BokehLayer — soft glowing orange/violet particles for atmospheric depth
// ---------------------------------------------------------------------------

const BOKEH_COUNT = 120;
const BOKEH_SPREAD_X = 600;
const BOKEH_SPREAD_Y = 420;
const BOKEH_Z_MIN = -300;
const BOKEH_Z_MAX = -100;

function BokehLayer() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();

    for (let i = 0; i < BOKEH_COUNT; i++) {
      pos.set(
        (Math.random() * 2 - 1) * BOKEH_SPREAD_X,
        (Math.random() * 2 - 1) * BOKEH_SPREAD_Y,
        BOKEH_Z_MIN + Math.random() * (BOKEH_Z_MAX - BOKEH_Z_MIN),
      );
      // Larger soft blobs in front, smaller far away.
      const sizeBoost = 0.5 + (pos.z - BOKEH_Z_MIN) / (BOKEH_Z_MAX - BOKEH_Z_MIN);
      scale.setScalar((1.0 + Math.random() * 1.4) * sizeBoost);
      matrix.compose(pos, quat, scale);
      mesh.setMatrixAt(i, matrix);

      const roll = Math.random();
      if (roll < 0.6) {
        // Warm orange-amber (matches dendrite tip terminals).
        color.setRGB(
          0.95 + Math.random() * 0.05,
          0.55 + Math.random() * 0.20,
          0.30 + Math.random() * 0.15,
        );
      } else if (roll < 0.9) {
        // Violet bokeh.
        color.setRGB(
          0.55 + Math.random() * 0.20,
          0.40 + Math.random() * 0.15,
          0.95 + Math.random() * 0.05,
        );
      } else {
        // Pale blue-white highlights.
        color.setRGB(
          0.70 + Math.random() * 0.15,
          0.80 + Math.random() * 0.15,
          1.00,
        );
      }
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, BOKEH_COUNT]}
      frustumCulled={false}
      renderOrder={0}
    >
      <sphereGeometry args={[1, 8, 6]} />
      <meshBasicMaterial
        transparent
        opacity={0.30}
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
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
      <BokehLayer />
    </>
  );
}

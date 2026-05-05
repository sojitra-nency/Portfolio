'use client';

/**
 * DendriteField — procedural bioluminescent dendrite art layer.
 *
 * Generates ~3000–5000 branching tubes radiating from the origin (0,0,0),
 * recursively branching 4 levels deep to form a fractal dendrite silhouette
 * matching the reference bioluminescent neuron image. All tubes are merged
 * into a single BufferGeometry → 1 draw call.
 *
 * At each leaf branch tip, a warm orange-amber sprite is added to a shared
 * Points buffer → 1 additional draw call for all tip sprites.
 *
 * Performance: generated once on mount with a seeded PRNG so the shape is
 * deterministic across re-renders. The full structure is static (no
 * per-frame mutation) — only the shader uniforms (uTime) advance.
 *
 * Raycast disabled — this is purely visual. Pointer events fall through to
 * the graph nodes underneath.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { createShaderMaterial } from '@/lib/shader-utils';
import dendriteVert from '../shaders/dendrite.vert.glsl';
import dendriteFrag from '../shaders/dendrite.frag.glsl';

// ---------------------------------------------------------------------------
// Tunables — exposed at top of file for fast iteration.
// ---------------------------------------------------------------------------

const PRIMARY_COUNT = 70;           // sparser primaries — less radial chaos
const PRIMARY_LENGTH_MIN = 45;
const PRIMARY_LENGTH_MAX = 95;
const PRIMARY_RADIUS = 0.30;
const BRANCH_DEPTH = 5;             // deeper recursion → more organic sub-branching
const BRANCHES_PER_NODE_MIN = 2;
const BRANCHES_PER_NODE_MAX = 4;    // wider spread per node
const LENGTH_DECAY = 0.62;          // slightly longer secondaries
const RADIUS_DECAY = 0.45;          // sharp taper → hair-thin tips
const ANGLE_MIN_DEG = 28;
const ANGLE_MAX_DEG = 58;           // wider angles → more organic curvature
const TUBE_RADIAL_SEGMENTS = 5;
const TUBE_TUBULAR_SEGMENTS = 10;   // more segments → smoother curves
const Z_FLATTEN = 0.55;             // squash z to favor camera-plane visibility

const TIP_SPRITE_SIZE = 0.80;
const TIP_COLOR = new THREE.Color('#FF7833');  // vivid warm orange (saturated)
const TIP_CORE_SIZE = 0.35;                    // smaller white-hot inner core
const TIP_CORE_COLOR = new THREE.Color('#FFE5C2'); // warm white center

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) — deterministic dendrite shape across reloads.
// ---------------------------------------------------------------------------

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------
// Material
// ---------------------------------------------------------------------------

const DendriteMaterial = createShaderMaterial({
  vertexShader: dendriteVert,
  fragmentShader: dendriteFrag,
  uniforms: {
    uTime: 0,
  },
});

// ---------------------------------------------------------------------------
// Branch generation
// ---------------------------------------------------------------------------

interface GeneratedTip {
  position: THREE.Vector3;
}

function buildBranch(
  rng: () => number,
  start: THREE.Vector3,
  direction: THREE.Vector3,
  length: number,
  radius: number,
  depth: number,
  branches: THREE.BufferGeometry[],
  distAttrs: number[][],
  tips: GeneratedTip[],
): void {
  // Build a curved path with 1–2 mid control points jittered off the
  // straight line for organic curvature.
  const end = start.clone().addScaledVector(direction, length);
  const mid1 = start.clone().lerp(end, 0.33);
  const mid2 = start.clone().lerp(end, 0.66);

  // Lateral jitter perpendicular to the branch direction — increased
  // for more organic, less radial-straight branches matching reference.
  const perp1 = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
  const perp2 = direction.clone().cross(perp1).normalize();
  const jitterMag = length * 0.22;
  mid1.addScaledVector(perp1, (rng() - 0.5) * jitterMag);
  mid1.addScaledVector(perp2, (rng() - 0.5) * jitterMag);
  mid2.addScaledVector(perp1, (rng() - 0.5) * jitterMag);
  mid2.addScaledVector(perp2, (rng() - 0.5) * jitterMag);

  const curve = new THREE.CatmullRomCurve3([start, mid1, mid2, end]);

  // Tube geometry for this branch.
  const tubeGeo = new THREE.TubeGeometry(
    curve,
    TUBE_TUBULAR_SEGMENTS,
    radius,
    TUBE_RADIAL_SEGMENTS,
    false,
  );

  // Per-vertex distance-from-origin attribute (used by the shader for
  // distance-based brightness fade).
  const positions = tubeGeo.attributes.position;
  const distArray: number[] = [];
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    distArray.push(Math.sqrt(x * x + y * y + z * z));
  }
  branches.push(tubeGeo);
  distAttrs.push(distArray);

  // Recurse — children sprout from the end of this branch in slightly
  // perturbed directions.
  if (depth >= BRANCH_DEPTH) {
    // Leaf — record tip position for sprite.
    tips.push({ position: end.clone() });
    return;
  }

  const childCount =
    BRANCHES_PER_NODE_MIN +
    Math.floor(rng() * (BRANCHES_PER_NODE_MAX - BRANCHES_PER_NODE_MIN + 1));

  // Always keep one child roughly continuing the trunk direction so the
  // structure looks like growing dendrites rather than radial bursts.
  for (let c = 0; c < childCount; c++) {
    const angle =
      (ANGLE_MIN_DEG + rng() * (ANGLE_MAX_DEG - ANGLE_MIN_DEG)) * DEG;

    // Random axis perpendicular to direction.
    const axis = new THREE.Vector3(
      rng() - 0.5,
      rng() - 0.5,
      rng() - 0.5,
    ).cross(direction).normalize();

    // Slight random twist so siblings spread out around the parent.
    const twist = rng() * Math.PI * 2;
    const childDir = direction
      .clone()
      .applyAxisAngle(axis, angle)
      .applyAxisAngle(direction, twist)
      .normalize();

    const childLength = length * LENGTH_DECAY * (0.85 + rng() * 0.3);
    const childRadius = Math.max(0.04, radius * RADIUS_DECAY);

    buildBranch(
      rng,
      end,
      childDir,
      childLength,
      childRadius,
      depth + 1,
      branches,
      distAttrs,
      tips,
    );
  }
}

function generateDendrites(): {
  geometry: THREE.BufferGeometry;
  tipPositions: Float32Array;
} {
  const rng = makeRng(0x9D4F2C);
  const branches: THREE.BufferGeometry[] = [];
  const distAttrs: number[][] = [];
  const tips: GeneratedTip[] = [];

  for (let i = 0; i < PRIMARY_COUNT; i++) {
    // Spherical-ish distribution biased to camera plane via z flatten.
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1);
    const dir = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi) * Z_FLATTEN,
    ).normalize();

    const length =
      PRIMARY_LENGTH_MIN +
      rng() * (PRIMARY_LENGTH_MAX - PRIMARY_LENGTH_MIN);

    // Skip the central few units so branches start outside the central star.
    const startRadius = 1.5 + rng() * 1.5;
    const start = dir.clone().multiplyScalar(startRadius);

    buildBranch(
      rng,
      start,
      dir,
      length,
      PRIMARY_RADIUS,
      0,
      branches,
      distAttrs,
      tips,
    );
  }

  // Merge all tube geometries into one for a single draw call.
  const merged = mergeGeometries(branches, false);
  if (!merged) {
    throw new Error('DendriteField: mergeGeometries returned null');
  }

  // Build the merged aDist buffer attribute by concatenating per-branch arrays.
  const totalVerts = merged.attributes.position.count;
  const distBuffer = new Float32Array(totalVerts);
  let offset = 0;
  for (const arr of distAttrs) {
    for (let i = 0; i < arr.length; i++) distBuffer[offset + i] = arr[i];
    offset += arr.length;
  }
  merged.setAttribute('aDist', new THREE.BufferAttribute(distBuffer, 1));

  // Dispose source geometries — merged owns its own buffers now.
  for (const g of branches) g.dispose();

  // Tips → flat Float32Array for the Points geometry.
  const tipPositions = new Float32Array(tips.length * 3);
  for (let i = 0; i < tips.length; i++) {
    tipPositions[i * 3] = tips[i].position.x;
    tipPositions[i * 3 + 1] = tips[i].position.y;
    tipPositions[i * 3 + 2] = tips[i].position.z;
  }

  return { geometry: merged, tipPositions };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DendriteField() {
  // Generate once. The shape is deterministic via seeded PRNG.
  const { geometry, tipPositions } = useMemo(() => generateDendrites(), []);

  const material = useMemo(() => {
    const mat = new DendriteMaterial() as THREE.ShaderMaterial;
    mat.transparent = true;
    mat.depthWrite = false;
    mat.blending = THREE.AdditiveBlending;
    mat.side = THREE.DoubleSide;
    return mat;
  }, []);

  // Tips geometry + material (warm orange Points).
  const tipsGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(tipPositions, 3));
    return g;
  }, [tipPositions]);

  // Outer warm-orange glow layer.
  const tipsMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: TIP_SPRITE_SIZE,
        color: TIP_COLOR,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  // Inner hot-core layer (smaller, brighter white-warm) — gives the tips
  // the bright pinpoint look from the reference image.
  const tipsCoreMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: TIP_CORE_SIZE,
        color: TIP_CORE_COLOR,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  // Mesh ref — disable raycast so clicks fall through to graph nodes.
  const meshRef = useRef<THREE.Mesh>(null);
  const tipsRef = useRef<THREE.Points>(null);
  const tipsCoreRef = useRef<THREE.Points>(null);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.raycast = () => {};
    }
    if (tipsRef.current) {
      tipsRef.current.raycast = () => {};
    }
    if (tipsCoreRef.current) {
      tipsCoreRef.current.raycast = () => {};
    }
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
      tipsGeometry.dispose();
      tipsMaterial.dispose();
      tipsCoreMaterial.dispose();
    };
  }, [geometry, material, tipsGeometry, tipsMaterial, tipsCoreMaterial]);

  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta;
  });

  return (
    <>
      <mesh ref={meshRef} frustumCulled={false}>
        <primitive object={geometry} attach="geometry" />
        <primitive object={material} attach="material" />
      </mesh>
      <points ref={tipsRef} frustumCulled={false}>
        <primitive object={tipsGeometry} attach="geometry" />
        <primitive object={tipsMaterial} attach="material" />
      </points>
      <points ref={tipsCoreRef} frustumCulled={false}>
        <primitive object={tipsGeometry} attach="geometry" />
        <primitive object={tipsCoreMaterial} attach="material" />
      </points>
    </>
  );
}

'use client';

/**
 * Synapse — a single connection rendered as a curved, glowing tube.
 *
 * Pulls both endpoint positions from `useGraphStore.positions` and builds
 * a `CatmullRomCurve3` via `graph-math` (a gentle 0.2 curvature for the
 * signature synapse bow). Renders a `TubeGeometry(curve, 20, 0.04, 8)`
 * shaded by `synapse.frag.glsl`.
 *
 * `uActive` is damped toward 1 when either endpoint is hovered or active;
 * otherwise it decays to 0. `uDashed` is a boolean flag (0/1) set once at
 * construction — cross-domain edges get a soft dashed pattern.
 *
 * Memoized with `React.memo` on primitive props (sourceId / targetId /
 * color / dashed / flowSpeed). Geometry is cached per (source, target)
 * pair and disposed when it changes.
 */

import { memo, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { damp } from 'maath/easing';
import * as THREE from 'three';

import { createShaderMaterial } from '@/lib/shader-utils';
import { catmullRomPath, computeCurvePoints } from '@/lib/graph-math';
import { useGraphStore } from '@/store/useGraphStore';
import synapseFrag from '../shaders/synapse.frag.glsl';

// ---------------------------------------------------------------------------
// Material
// ---------------------------------------------------------------------------

// Passthrough vertex — TubeGeometry already assigns sensible UVs (u along
// length, v around cross-section) which are exactly what the frag needs.
const synapseVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SynapseMaterial = createShaderMaterial({
  vertexShader: synapseVert,
  fragmentShader: synapseFrag,
  uniforms: {
    uColor: new THREE.Color('#FFFFFF'),
    uTime: 0,
    uFlowSpeed: 0.3,
    uActive: 0,
    uDashed: 0,
  },
});

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SynapseProps {
  sourceId: string;
  targetId: string;
  /** Category color of the source node. */
  color: string;
  /** `true` for cross-domain edges — gets a soft-dashed pattern. */
  dashed?: boolean;
  /** Per-second fraction of tube length the gradient travels. */
  flowSpeed?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function Synapse({
  sourceId,
  targetId,
  color,
  dashed = false,
  flowSpeed = 0.3,
}: SynapseProps) {
  // Endpoint positions — Vector3 refs stay stable unless THIS node's
  // position is rewritten (only at force-layout finish), so the memos
  // downstream don't rebuild unnecessarily.
  const source = useGraphStore((s) => s.positions.get(sourceId));
  const target = useGraphStore((s) => s.positions.get(targetId));

  // Single-selector boolean reduces Zustand subscription cost to 1 per edge.
  const isActive = useGraphStore(
    (s) =>
      s.hoveredNodeId === sourceId ||
      s.hoveredNodeId === targetId ||
      s.activeNodeId === sourceId ||
      s.activeNodeId === targetId,
  );

  // Curve + tube. Rebuilt only when either endpoint changes reference.
  const geometry = useMemo(() => {
    if (!source || !target) return null;
    const points = computeCurvePoints(source, target, 0.2, 20);
    const curve = catmullRomPath(points);
    return new THREE.TubeGeometry(curve, 20, 0.04, 8);
  }, [source, target]);

  // Per-instance material — drei's shaderMaterial clones uniforms.
  const material = useMemo(() => {
    const mat = new SynapseMaterial() as THREE.ShaderMaterial;
    (mat.uniforms.uColor.value as THREE.Color).set(color);
    mat.uniforms.uFlowSpeed.value = flowSpeed;
    mat.uniforms.uDashed.value = dashed ? 1 : 0;
    mat.uniforms.uActive.value = 0;
    mat.uniforms.uTime.value = 0;
    mat.transparent = true;
    mat.depthWrite = false;
    return mat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync uniforms when the primitive props change.
  useEffect(() => {
    (material.uniforms.uColor.value as THREE.Color).set(color);
  }, [color, material]);
  useEffect(() => {
    material.uniforms.uFlowSpeed.value = flowSpeed;
  }, [flowSpeed, material]);
  useEffect(() => {
    material.uniforms.uDashed.value = dashed ? 1 : 0;
  }, [dashed, material]);

  // Dispose the previous tube when geometry changes or the component
  // unmounts. Not shared — each edge has its own TubeGeometry.
  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  // Advance time + smoothly damp uActive toward target.
  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta;
    damp(
      material.uniforms.uActive as { value: number },
      'value',
      isActive ? 1 : 0,
      0.15,
      delta,
    );
  });

  if (!geometry) return null;

  return (
    <mesh>
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export default memo(Synapse);

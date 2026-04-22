'use client';

/**
 * NeuronHalo — a camera-facing billboard quad that renders the soft glow
 * surrounding each neuron. Sits on the selective-bloom layer (layer 1)
 * so the EffectsStack in Task 21 can pick it up for bloom.
 *
 * Positioning is delegated to the parent `Neuron`; this component renders
 * at local origin inside drei's `<Billboard>` wrapper which keeps the
 * quad facing the camera at all times (including during cinema-focus
 * tilts and guided-tour sweeps).
 *
 * The plane geometry is a fixed 1×1 unit — final world size comes from the
 * `scale` prop (which represents the parent neuron's radius). The halo
 * expands to 2.5× that so it overshoots the core noticeably.
 */

import {
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';

import { createShaderMaterial } from '@/lib/shader-utils';
import haloFrag from '../shaders/halo.frag.glsl';

// ---------------------------------------------------------------------------
// Material
// ---------------------------------------------------------------------------

// Passthrough vertex — the Billboard group already orients the quad to face
// the camera, so we only need the standard MVP transform + UV forwarding.
const haloVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NeuronHaloMaterial = createShaderMaterial({
  vertexShader: haloVert,
  fragmentShader: haloFrag,
  uniforms: {
    uColor: new THREE.Color('#FFFFFF'),
    uPulse: 0,
    uOpacity: 1,
  },
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Halo world size = parent node size × HALO_SCALE. */
const HALO_SCALE = 2.5;

export interface NeuronHaloProps {
  /** Category color — accepts any CSS / hex / 0x number string. */
  color: string;
  /** Shared pulse envelope (0..1). Written by the chain-reaction hook
   * (Task 19); read here every frame. */
  pulseRef: MutableRefObject<number>;
  /** Global halo opacity (0..1). Defaults to 1. Lowered for dimmed nodes
   * such as unvisited clusters during progressive discovery. */
  opacity?: number;
  /** Parent neuron's radius (world units). The halo renders at 2.5× this. */
  scale: number;
}

export default function NeuronHalo({
  color,
  pulseRef,
  opacity = 1,
  scale,
}: NeuronHaloProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloSize = scale * HALO_SCALE;

  // Fresh material per instance — drei's shaderMaterial clones uniforms
  // so per-neuron color/opacity/pulse stay isolated.
  const material = useMemo(() => {
    const mat = new NeuronHaloMaterial() as THREE.ShaderMaterial;
    (mat.uniforms.uColor.value as THREE.Color).set(color);
    mat.uniforms.uOpacity.value = opacity;
    mat.uniforms.uPulse.value = 0;
    mat.transparent = true;
    mat.depthWrite = false;
    mat.blending = THREE.AdditiveBlending;
    return mat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync uColor / uOpacity on prop change.
  useEffect(() => {
    (material.uniforms.uColor.value as THREE.Color).set(color);
  }, [color, material]);
  useEffect(() => {
    material.uniforms.uOpacity.value = opacity;
  }, [opacity, material]);

  // Isolate to the selective-bloom layer so only halos (and firing
  // connections, later) get the bloom pass.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.layers.set(1);
  }, []);

  // Read shared pulse every frame. Cheap — single uniform write.
  useFrame(() => {
    material.uniforms.uPulse.value = pulseRef.current;
  });

  return (
    <Billboard follow>
      <mesh ref={meshRef} scale={haloSize}>
        <planeGeometry args={[1, 1]} />
        <primitive object={material} attach="material" />
      </mesh>
    </Billboard>
  );
}

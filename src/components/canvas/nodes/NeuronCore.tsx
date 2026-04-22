'use client';

/**
 * NeuronCore — a single glowing icosahedron that represents the body of
 * a neuron. Reads a shared `pulseRef` every frame for the firing envelope
 * (0..1) and consumes `state` for the steady activation multiplier.
 *
 * Material is built via `createShaderMaterial` + the paired
 * `neuron.vert.glsl` / `neuron.frag.glsl` sources. Each mounted neuron
 * gets its own material instance (drei's `shaderMaterial` clones
 * uniforms per instance), so per-node `uColor` / `uPulse` / `uState`
 * stay isolated.
 *
 * Positioning is delegated to the parent `Neuron` wrapper — this
 * component renders at local origin.
 */

import {
  useEffect,
  useMemo,
  type MutableRefObject,
} from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { createShaderMaterial } from '@/lib/shader-utils';
import neuronVert from '../shaders/neuron.vert.glsl';
import neuronFrag from '../shaders/neuron.frag.glsl';

/** Shared material class — compiled once by `createShaderMaterial`'s cache. */
const NeuronCoreMaterial = createShaderMaterial({
  vertexShader: neuronVert,
  fragmentShader: neuronFrag,
  uniforms: {
    uColor: new THREE.Color('#FFFFFF'),
    uPulse: 0,
    uState: 0,
    uNoiseAmp: 0.08,
    uTime: 0,
  },
});

export interface NeuronCoreProps {
  /** Category color — accepts any CSS / hex / 0x number string. */
  color: string;
  /** Shared pulse envelope (0..1). Written by the chain-reaction hook
   * (Task 19); read here every frame. */
  pulseRef: MutableRefObject<number>;
  /** Activation state: 0 = idle, 1 = active. Drives the steady brightness
   * multiplier. */
  state: number;
  /** Node radius in world units — passed to `icosahedronGeometry` so the
   * geometry itself is sized correctly, no mesh-scale math needed. */
  size: number;
  /** Icosahedron subdivision detail (0 = 20 tris, 1 = 80, 2 = 320). The
   * parent `Neuron` derives this from `node.level`. */
  detail?: number;
  /** Override for the surface-displacement amplitude. Defaults to 0.08. */
  noiseAmp?: number;
}

export default function NeuronCore({
  color,
  pulseRef,
  state,
  size,
  detail = 1,
  noiseAmp = 0.08,
}: NeuronCoreProps) {
  // Fresh material instance per mount. drei's shaderMaterial clones
  // uniform values, so uColor / uPulse / uState won't leak between neurons.
  const material = useMemo(() => {
    const mat = new NeuronCoreMaterial() as THREE.ShaderMaterial;
    (mat.uniforms.uColor.value as THREE.Color).set(color);
    mat.uniforms.uState.value = state;
    mat.uniforms.uNoiseAmp.value = noiseAmp;
    mat.uniforms.uPulse.value = 0;
    mat.uniforms.uTime.value = 0;
    return mat;
    // Intentionally construct once; prop syncs happen in useEffect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync uColor when the prop changes (category switch is unusual but
  // supported — e.g. when the node data itself changes identity).
  useEffect(() => {
    (material.uniforms.uColor.value as THREE.Color).set(color);
  }, [color, material]);

  // Sync uState on prop change.
  useEffect(() => {
    material.uniforms.uState.value = state;
  }, [state, material]);

  // Sync uNoiseAmp if overridden.
  useEffect(() => {
    material.uniforms.uNoiseAmp.value = noiseAmp;
  }, [noiseAmp, material]);

  // Advance time; read shared pulse ref each frame.
  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta;
    material.uniforms.uPulse.value = pulseRef.current;
  });

  return (
    <mesh>
      <icosahedronGeometry args={[size, detail]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

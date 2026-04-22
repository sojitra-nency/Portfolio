'use client';

/**
 * NebulaBackground — shader-driven, full-bleed nebula plane sitting at
 * z = -500 behind every other scene element.
 *
 * Behaviour:
 * - `uTime` is advanced every frame via `useFrame`.
 * - `uActivity` is smoothly damped toward `1` whenever any neuron is active
 *   (via `useGraphStore.activeNodeId`) and back to `0` otherwise. The
 *   whole substrate subtly "wakes up" on focus.
 * - `uResolution` tracks the R3F framebuffer so the screen-space pattern
 *   stays aspect-correct on resize.
 *
 * Depth-write/test are disabled and renderOrder is pinned to -1 so the
 * nebula never fights the depth buffer with the rest of the scene.
 */

import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { damp } from 'maath/easing';
import * as THREE from 'three';

import { createShaderMaterial } from '@/lib/shader-utils';
import { useGraphStore } from '@/store/useGraphStore';
import nebulaFrag from '../shaders/nebula.frag.glsl';

// Passthrough vertex shader — the plane is already screen-aligned, so all
// we need is the standard MVP transform + a uv varying for future tweaks.
const nebulaVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NebulaMaterial = createShaderMaterial({
  vertexShader: nebulaVert,
  fragmentShader: nebulaFrag,
  uniforms: {
    uTime: 0,
    uActivity: 0,
    uResolution: new THREE.Vector2(1, 1),
  },
});

export default function NebulaBackground() {
  const { size } = useThree();

  const material = useMemo(() => {
    const mat = new NebulaMaterial() as THREE.ShaderMaterial;
    mat.depthWrite = false;
    mat.depthTest = false;
    mat.transparent = false;
    return mat;
  }, []);

  // Keep the shader aware of framebuffer dimensions so the fbm pattern
  // stays aspect-correct when the viewport resizes.
  useEffect(() => {
    const res = material.uniforms.uResolution.value as THREE.Vector2;
    res.set(size.width, size.height);
  }, [size.width, size.height, material]);

  // Advance time + smoothly damp uActivity.
  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta;
    const anyActive = useGraphStore.getState().activeNodeId !== null;
    damp(
      material.uniforms.uActivity as { value: number },
      'value',
      anyActive ? 1 : 0,
      0.4, // smoothTime — ~400 ms to reach target
      delta,
    );
  });

  return (
    <mesh position={[0, 0, -500]} renderOrder={-1} frustumCulled={false}>
      {/* Large enough to cover the camera frustum at z = -500 on ultrawide. */}
      <planeGeometry args={[2000, 1200]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

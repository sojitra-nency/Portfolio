'use client';

/**
 * CentralStar — the blinding white-hot point of light at origin.
 *
 * A camera-facing billboard rendering three concentric radial layers:
 *   1. Inner core   (HDR pure white)        — exceeds bloom threshold heavily
 *   2. Mid corona   (white-violet)          — wide bloom skirt
 *   3. Outer halo   (deep violet falloff)   — soft atmospheric glow
 *
 * Inline shader (small, no external GLSL files needed). Subtle sine pulse
 * gives it a living/breathing feel. Renders behind the graph nodes (the
 * level-0 origin neuron sits in front of it for interaction).
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';

import { createShaderMaterial } from '@/lib/shader-utils';

// ---------------------------------------------------------------------------
// Inline shader
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uPulse;
  varying vec2 vUv;

  void main() {
    // Distance from quad center [0..1] across half-width.
    float d = length(vUv - 0.5) * 2.0;

    // Three radial layers.
    float core   = smoothstep(0.10, 0.0,  d);   // tight blinding center
    float corona = smoothstep(0.40, 0.05, d);   // wide bright corona
    float halo   = smoothstep(1.00, 0.0,  d);   // soft outer aura

    // Restrained HDR — center reads as bright but not blinding.
    vec3 coreColor   = vec3(2.5);                          // soft white
    vec3 coronaColor = vec3(1.2, 1.0, 1.8);                // white-violet
    vec3 haloColor   = vec3(0.40, 0.30, 0.85);             // violet glow

    vec3 color = coreColor   * core
               + coronaColor * corona * 0.7
               + haloColor   * halo   * 0.5;

    // Subtle living pulse (slow sine).
    float breathe = 0.92 + 0.08 * sin(uTime * 1.6);
    color *= breathe * (1.0 + uPulse * 0.3);

    // Alpha — softer falloff so the star integrates with the background.
    float a = core * 0.95 + corona * 0.55 + halo * 0.20;
    a = clamp(a, 0.0, 1.0);

    gl_FragColor = vec4(color, a);
  }
`;

const CentralStarMaterial = createShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: 0,
    uPulse: 0,
  },
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const STAR_SIZE = 50; // world units — restrained so the dendrites and bokeh have visual room

export default function CentralStar() {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    const mat = new CentralStarMaterial() as THREE.ShaderMaterial;
    mat.transparent = true;
    mat.depthWrite = false;
    mat.blending = THREE.AdditiveBlending;
    return mat;
  }, []);

  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta;
  });

  return (
    <Billboard follow>
      <mesh ref={meshRef} scale={STAR_SIZE} renderOrder={2}>
        <planeGeometry args={[1, 1]} />
        <primitive object={material} attach="material" />
      </mesh>
    </Billboard>
  );
}

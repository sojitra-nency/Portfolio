'use client';

/**
 * EffectsStack — the Neural View's post-processing pipeline.
 *
 * Pipeline (ordered):
 *   1. Bloom             — luminance-threshold bloom on all bright pixels.
 *   2. DepthOfField      — focus on `useCinemaStore.focusTarget`, bokeh
 *                          scales with cinema mode. Disabled on mobile
 *                          and GPU tier < 2.
 *   3. ChromaticAberration — constant subtle offset, bumps briefly on
 *                            `useHudStore.chromaticSpike()` (wired from
 *                            the chain-reaction fire in Task 19).
 *   4. Noise             — film grain, OVERLAY blend.
 *   5. Vignette          — classic edge darkening.
 *
 * All effects entirely disabled on GPU tier 0/1 (component returns null).
 */

import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Noise,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction, ChromaticAberrationEffect } from 'postprocessing';
import * as THREE from 'three';

import { useCinemaStore } from '@/store/useCinemaStore';
import { useHudStore, CHROMATIC_SPIKE_DURATION } from '@/store/useHudStore';

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------

const BLOOM_INTENSITY_TIER2 = 1.0;
const BLOOM_INTENSITY_TIER3 = 1.4;
const BLOOM_LUMINANCE_THRESHOLD = 0.45;
const BLOOM_LUMINANCE_SMOOTHING = 0.6;

const BOKEH_AMBIENT = 1.2;
const BOKEH_FOCUS = 3.0;

// Disabled — chromatic aberration was producing heavy RGB fringing on every
// dendrite, making the scene look glitchy. Reference image has clean lines.
const CHROMATIC_BASE = 0.0;
const CHROMATIC_PEAK = 0.0008;

const NOISE_OPACITY = 0.035;

const VIGNETTE_OFFSET = 0.25;
const VIGNETTE_DARKNESS = 0.90;

const MOBILE_BREAKPOINT = 768;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EffectsStack() {
  const tier = useHudStore((s) => s.gpuTier);
  const isMobile = useThree((s) => s.size.width < MOBILE_BREAKPOINT);
  const mode = useCinemaStore((s) => s.mode);
  const focusTarget = useCinemaStore((s) => s.focusTarget);

  // Stable fallback target for DoF when nothing is focused.
  const originTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const dofTarget = focusTarget ?? originTarget;

  const chromaticEffect = useMemo(
    () =>
      new ChromaticAberrationEffect({
        offset: new THREE.Vector2(CHROMATIC_BASE, CHROMATIC_BASE),
        radialModulation: false,
        modulationOffset: 0,
      }),
    [],
  );

  // Animate chromatic offset: decays from CHROMATIC_PEAK → CHROMATIC_BASE
  // over CHROMATIC_SPIKE_DURATION after `useHudStore.chromaticSpike()`.
  useFrame(() => {
    const now = performance.now() / 1000;
    const spikeEnd = useHudStore.getState().chromaticSpikeEndAt;
    const remaining = spikeEnd - now;
    let value = CHROMATIC_BASE;
    if (remaining > 0) {
      const t = Math.min(1, remaining / CHROMATIC_SPIKE_DURATION);
      value = CHROMATIC_BASE + (CHROMATIC_PEAK - CHROMATIC_BASE) * t;
    }
    chromaticEffect.offset.set(value, value);
  });

  // Only skip on tier 0 (completely incapable GPU). Tier 1 still gets bloom.
  if (tier <= 0) return null;

  const effectiveTier = isMobile ? Math.min(tier, 2) : tier;

  const bloomIntensity =
    effectiveTier >= 3 ? BLOOM_INTENSITY_TIER3 : BLOOM_INTENSITY_TIER2;
  const bokehScale = mode === 'focus' ? BOKEH_FOCUS : BOKEH_AMBIENT;
  const dofEnabled = effectiveTier >= 2 && !isMobile;
  const chromaticEnabled = !isMobile;

  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={BLOOM_LUMINANCE_THRESHOLD}
        luminanceSmoothing={BLOOM_LUMINANCE_SMOOTHING}
        mipmapBlur
      />
      {dofEnabled ? (
        <DepthOfField
          target={dofTarget}
          bokehScale={bokehScale}
          focusRange={0.01}
        />
      ) : (
        <></>
      )}
      {chromaticEnabled ? (
        <primitive object={chromaticEffect} />
      ) : (
        <></>
      )}
      <Noise
        opacity={NOISE_OPACITY}
        blendFunction={BlendFunction.OVERLAY}
        premultiply={false}
      />
      <Vignette offset={VIGNETTE_OFFSET} darkness={VIGNETTE_DARKNESS} />
    </EffectComposer>
  );
}

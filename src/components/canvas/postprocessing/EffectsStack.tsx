'use client';

/**
 * EffectsStack — the Neural View's post-processing pipeline.
 *
 * Pipeline (ordered):
 *   1. SelectiveBloom    — layer-1 bloom (halos, firing edges).
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
 *
 * The local `useGPUTier` hook mirrors the pattern used in StarField and
 * EnergyParticles — Task 23 folds all three into `useResponsive`.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  EffectComposer,
  SelectiveBloom,
  DepthOfField,
  ChromaticAberration,
  Noise,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction, type ChromaticAberrationEffect } from 'postprocessing';
import { getGPUTier } from 'detect-gpu';
import * as THREE from 'three';

import { useCinemaStore } from '@/store/useCinemaStore';
import { useHudStore, CHROMATIC_SPIKE_DURATION } from '@/store/useHudStore';

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------

const BLOOM_INTENSITY_TIER2 = 0.5;
const BLOOM_INTENSITY_TIER3 = 1.1;
const BLOOM_LUMINANCE_THRESHOLD = 0.2;

const BOKEH_AMBIENT = 1.2;
const BOKEH_FOCUS = 3.0;

const CHROMATIC_BASE = 0.0008;
const CHROMATIC_PEAK = 0.003;

const NOISE_OPACITY = 0.035;

const VIGNETTE_OFFSET = 0.3;
const VIGNETTE_DARKNESS = 0.75;

const MOBILE_BREAKPOINT = 768;

// ---------------------------------------------------------------------------
// Local GPU-tier hook (Task 23 will consolidate into useResponsive).
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
// Component
// ---------------------------------------------------------------------------

export default function EffectsStack() {
  const tier = useGPUTier();
  const isMobile = useThree((s) => s.size.width < MOBILE_BREAKPOINT);
  const mode = useCinemaStore((s) => s.mode);
  const focusTarget = useCinemaStore((s) => s.focusTarget);

  // Stable fallback target for DoF when nothing is focused — mutated
  // never, so DepthOfField reuses the same Vector3 across re-renders.
  const originTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const dofTarget = focusTarget ?? originTarget;

  // Ref to the underlying ChromaticAberrationEffect so we can mutate
  // its offset uniform each frame without triggering React re-renders.
  // The library's type declares the ref as `typeof ChromaticAberrationEffect`
  // (a class constructor) — this is a type-declaration quirk; the runtime
  // ref is actually the effect instance. Cast with `as unknown`.
  const chromaticRef = useRef<ChromaticAberrationEffect>(null);

  // Animate chromatic offset: decays from CHROMATIC_PEAK → CHROMATIC_BASE
  // over CHROMATIC_SPIKE_DURATION after `useHudStore.chromaticSpike()`.
  useFrame(() => {
    const eff = chromaticRef.current;
    if (!eff) return;
    const now = performance.now() / 1000;
    const spikeEnd = useHudStore.getState().chromaticSpikeEndAt;
    const remaining = spikeEnd - now;
    let value = CHROMATIC_BASE;
    if (remaining > 0) {
      const t = Math.min(1, remaining / CHROMATIC_SPIKE_DURATION);
      value = CHROMATIC_BASE + (CHROMATIC_PEAK - CHROMATIC_BASE) * t;
    }
    eff.offset.set(value, value);
  });

  // Entirely skip post-processing on low-end GPUs.
  if (tier <= 1) return null;

  const bloomIntensity =
    tier >= 3 ? BLOOM_INTENSITY_TIER3 : BLOOM_INTENSITY_TIER2;
  const bokehScale = mode === 'focus' ? BOKEH_FOCUS : BOKEH_AMBIENT;
  const dofEnabled = tier >= 2 && !isMobile;

  return (
    <EffectComposer>
      <SelectiveBloom
        selectionLayer={1}
        intensity={bloomIntensity}
        luminanceThreshold={BLOOM_LUMINANCE_THRESHOLD}
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
      <ChromaticAberration
        // Ref typing is wrong in the library (`typeof ChromaticAberrationEffect`);
        // the runtime ref is an instance. Cast safely.
        ref={chromaticRef as unknown as React.Ref<typeof ChromaticAberrationEffect>}
        offset={new THREE.Vector2(CHROMATIC_BASE, CHROMATIC_BASE)}
        radialModulation={false}
        modulationOffset={0}
      />
      <Noise
        opacity={NOISE_OPACITY}
        blendFunction={BlendFunction.OVERLAY}
        premultiply={false}
      />
      <Vignette offset={VIGNETTE_OFFSET} darkness={VIGNETTE_DARKNESS} />
    </EffectComposer>
  );
}

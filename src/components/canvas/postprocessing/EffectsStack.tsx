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

import { useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  EffectComposer,
  SelectiveBloom,
  DepthOfField,
  Noise,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction, ChromaticAberrationEffect } from 'postprocessing';
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
  const scene = useThree((s) => s.scene);
  const isMobile = useThree((s) => s.size.width < MOBILE_BREAKPOINT);
  const mode = useCinemaStore((s) => s.mode);
  const focusTarget = useCinemaStore((s) => s.focusTarget);
  const [hasSceneLights, setHasSceneLights] = useState(false);

  // Stable fallback target for DoF when nothing is focused — mutated
  // never, so DepthOfField reuses the same Vector3 across re-renders.
  const originTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const dofTarget = focusTarget ?? originTarget;

  // Ref to the underlying ChromaticAberrationEffect so we can mutate
  // its offset uniform each frame without triggering React re-renders.
  // We instantiate the effect directly instead of using the
  // <ChromaticAberration /> wrapper because that wrapper stringifies props;
  // in React 19, passing `ref` as a prop can produce a cyclic object error.
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

  // SelectiveBloom needs at least one light in the scene graph when it mounts.
  // In React Three Fiber, the lighting rig and postprocessing can initialize in
  // the same commit, so we wait until a light is actually present.
  useFrame(() => {
    if (hasSceneLights) return;

    let foundLight = false;
    scene.traverse((object) => {
      if ((object as THREE.Object3D & { isLight?: boolean }).isLight) {
        foundLight = true;
      }
    });

    if (foundLight) {
      setHasSceneLights(true);
    }
  });

  // Entirely skip post-processing on low-end GPUs.
  if (tier <= 1) return null;

  // Mobile treats every device as at-most tier 2 regardless of what
  // detect-gpu reports — prevents a high-end phone from burning fillrate
  // on tier-3 bloom intensity and DoF that's wasted on a small viewport.
  const effectiveTier = isMobile ? Math.min(tier, 2) : tier;

  const bloomIntensity =
    effectiveTier >= 3 ? BLOOM_INTENSITY_TIER3 : BLOOM_INTENSITY_TIER2;
  const bokehScale = mode === 'focus' ? BOKEH_FOCUS : BOKEH_AMBIENT;
  const dofEnabled = effectiveTier >= 2 && !isMobile;
  // ChromaticAberration costs a full-screen pass and a uniform update
  // every frame — skip it on mobile regardless of tier.
  const chromaticEnabled = !isMobile;

  return (
    <EffectComposer>
      {hasSceneLights ? (
        <SelectiveBloom
          selectionLayer={1}
          intensity={bloomIntensity}
          luminanceThreshold={BLOOM_LUMINANCE_THRESHOLD}
          mipmapBlur
        />
      ) : (
        <></>
      )}
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

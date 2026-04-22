'use client';

/**
 * UnlockReveal — the glitch-materialize choreography for newly-unlocked
 * (hidden) nodes.
 *
 * Flow when `useExplorationStore`'s `checkUnlocks()` emits:
 *   1. Our `onUnlock` listener runs **synchronously** before React re-renders,
 *      so the newly-unlocked node id lands in `activeReveals` BEFORE the
 *      Neuron component for that id mounts. (Neuron's initial `revealRef`
 *      value reads `hasActiveReveal(id)` to decide whether to start at 0.)
 *   2. We fire the post-processing `chromaticSpike()` for a chromatic punch
 *      and `playFX('unlock-chord')` for the audio cue.
 *   3. A per-frame `useFrame` walks `activeReveals`, computes the reveal
 *      envelope (0 → 1.08 overshoot → 1), and writes into the Neuron's
 *      registered `revealRef`. Neuron applies that ref as `group.scale`
 *      and damping-jitter on `group.position`.
 *
 * Envelope shape over UNLOCK_GLITCH (1.2 s):
 *     ──────▶ t
 *     0.0 ─ 0.7     ease-out cubic 0 → 1.08
 *     0.7 ─ 1.0     linear 1.08 → 1.0
 *
 * Jitter (applied by Neuron, not here): damps as `(1 − reveal)` so the
 * newly-materialising node trembles heavily at first and settles by the
 * end of the 1.2 s window.
 *
 * Mount once inside the R3F Canvas tree — NeuralScene does this.
 */

import {
  useEffect,
  type MutableRefObject,
} from 'react';
import { useFrame } from '@react-three/fiber';

import { onUnlock } from '@/store/useExplorationStore';
import { useHudStore } from '@/store/useHudStore';
import { playFX } from '@/hooks/useAudio';
import { UNLOCK_GLITCH } from '@/lib/neural-motion';

// ---------------------------------------------------------------------------
// Registries
// ---------------------------------------------------------------------------

/** Map of nodeId → reveal ref (0 = invisible, 1 = fully materialised). */
const revealRegistry = new Map<string, MutableRefObject<number>>();

/** Map of nodeId → reveal start time in seconds (`performance.now() / 1000`). */
const activeReveals = new Map<string, number>();

/**
 * Neuron calls this on mount to publish its reveal ref. Returns an
 * unregister function (cleanup).
 */
export function registerReveal(
  id: string,
  ref: MutableRefObject<number>,
): () => void {
  revealRegistry.set(id, ref);
  return () => {
    if (revealRegistry.get(id) === ref) revealRegistry.delete(id);
  };
}

/**
 * Neuron calls this when deciding whether its `revealRef` should start
 * at 0 (just-unlocking) or 1 (previously unlocked or not hidden).
 */
export function hasActiveReveal(id: string): boolean {
  return activeReveals.has(id);
}

// ---------------------------------------------------------------------------
// Envelope
// ---------------------------------------------------------------------------

/**
 * Compute the reveal value at time `t` in [0, 1]:
 * - First 70% of the window: ease-out cubic from 0 to 1.08 (overshoot)
 * - Remaining 30%: linear settle from 1.08 back to 1.0
 */
function revealEnvelope(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (t < 0.7) {
    const u = t / 0.7;
    return 1.08 * (1 - Math.pow(1 - u, 3));
  }
  const u = (t - 0.7) / 0.3;
  return 1.08 + (1 - 1.08) * u;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UnlockReveal() {
  useEffect(() => {
    // Subscribe to unlock events. Runs synchronously inside the store's
    // `checkUnlocks()` call, so activeReveals is populated before React
    // re-renders the newly-unlocked Neuron.
    return onUnlock((id) => {
      activeReveals.set(id, performance.now() / 1000);
      // Post-processing chromatic spike — EffectsStack reads the timestamp.
      useHudStore.getState().chromaticSpike();
      // Audio cue.
      playFX('unlock-chord');
    });
  }, []);

  useFrame(() => {
    if (activeReveals.size === 0) return;
    const now = performance.now() / 1000;
    const done: string[] = [];

    for (const [id, start] of activeReveals) {
      const elapsed = now - start;
      const t = Math.min(elapsed / UNLOCK_GLITCH, 1);
      const value = revealEnvelope(t);
      const ref = revealRegistry.get(id);
      if (ref) ref.current = value;
      if (t >= 1) {
        if (ref) ref.current = 1;
        done.push(id);
      }
    }

    for (const id of done) activeReveals.delete(id);
  });

  return null;
}

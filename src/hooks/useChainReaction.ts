'use client';

/**
 * useChainReaction — orchestrates node pulse envelopes across the whole
 * graph from a single central `useFrame`. Replaces the per-neuron local
 * fire animation from Task 15.
 *
 * Architecture:
 * - Every Neuron calls `registerPulse(id, pulseRef)` on mount to publish
 *   its `MutableRefObject<number>` into a module-level registry.
 * - Module-level `fire()` / `preFire()` functions are imported by Neuron
 *   handlers — they set an `activeEvent` describing the wave(s) to run.
 * - A single `useChainReaction()` hook (mounted once by NeuralNetwork)
 *   registers a `useFrame` that reads `activeEvent`, computes each
 *   neuron's envelope value for the current time, and writes into its
 *   registered pulse ref. The neuron's shader materials read the same
 *   ref in their own `useFrame`s.
 *
 * Envelopes (all eased-out quadratic over 60 ms):
 * - fire(src):
 *     t=0   → source peaks at 1.0, decays over 60 ms
 *     t=90  → 1-hop neighbors peak at 0.6, decay over 60 ms
 *     t=180 → 2-hop neighbors peak at 0.3, decay over 60 ms
 *     Total event lifetime ≈ 240 ms.
 * - preFire(src):
 *     t=0   → 1-hop neighbors peak at 0.4, decay over 60 ms. No cascade.
 *
 * Cancellation: any new `fire()` / `preFire()` cancels the previous
 * event (resets its affected neurons' pulses to 0 immediately) before
 * starting its own.
 *
 * Timing uses `performance.now()` exclusively — no setTimeout / setInterval.
 * The useFrame advances state on every tick; render is unaffected.
 */

import { useEffect, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';

import { useGraphStore } from '@/store/useGraphStore';
import { useHudStore } from '@/store/useHudStore';
import { getNeighbors } from '@/lib/graph-math';

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const pulseRegistry = new Map<string, MutableRefObject<number>>();

/**
 * Publish a neuron's pulse ref so `fire()` / `preFire()` can write into
 * it. Returns an unregister function suitable as a `useEffect` cleanup.
 */
export function registerPulse(
  id: string,
  ref: MutableRefObject<number>,
): () => void {
  pulseRegistry.set(id, ref);
  return () => {
    if (pulseRegistry.get(id) === ref) {
      pulseRegistry.delete(id);
    }
  };
}

function writePulse(id: string, value: number): void {
  const ref = pulseRegistry.get(id);
  if (ref) ref.current = value;
}

// ---------------------------------------------------------------------------
// Event shape
// ---------------------------------------------------------------------------

interface FireEvent {
  kind: 'fire';
  source: string;
  sourceStart: number; // seconds (performance.now() / 1000)
  hop1Ids: readonly string[];
  hop1Start: number;
  hop2Ids: readonly string[];
  hop2Start: number;
}

interface PreFireEvent {
  kind: 'preFire';
  ids: readonly string[];
  start: number;
}

type ActiveEvent = FireEvent | PreFireEvent;

// Module-level — a single event is in flight at any time.
let activeEvent: ActiveEvent | null = null;

// ---------------------------------------------------------------------------
// Timing / amplitudes
// ---------------------------------------------------------------------------

/** Per-wave decay duration. */
const DECAY = 0.06; // 60 ms
/** Delay before the 1-hop wave peaks after a fire's source. */
const HOP1_DELAY = 0.09; // 90 ms
/** Delay before the 2-hop wave peaks after a fire's source. */
const HOP2_DELAY = 0.18; // 180 ms

const FIRE_SOURCE_PEAK = 1.0;
const FIRE_HOP1_PEAK = 0.6;
const FIRE_HOP2_PEAK = 0.3;
const PRE_FIRE_PEAK = 0.4;

// ---------------------------------------------------------------------------
// Envelope math
// ---------------------------------------------------------------------------

/**
 * Ease-out quadratic decay from `peak` to 0 over {@link DECAY} seconds.
 * Returns 0 before `elapsed < 0` or after the decay window.
 */
function waveValue(elapsed: number, peak: number): number {
  if (elapsed < 0 || elapsed >= DECAY) return 0;
  const t = elapsed / DECAY;
  const remaining = 1 - t;
  return peak * remaining * remaining;
}

// ---------------------------------------------------------------------------
// Cancellation
// ---------------------------------------------------------------------------

function cancelActiveEvent(): void {
  if (!activeEvent) return;
  if (activeEvent.kind === 'fire') {
    writePulse(activeEvent.source, 0);
    for (const id of activeEvent.hop1Ids) writePulse(id, 0);
    for (const id of activeEvent.hop2Ids) writePulse(id, 0);
  } else {
    for (const id of activeEvent.ids) writePulse(id, 0);
  }
  activeEvent = null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fire the full chain reaction from `nodeId`: source (peak 1) → 1-hop at
 * +90 ms (peak 0.6) → 2-hop at +180 ms (peak 0.3). Cancels any in-flight
 * event first.
 */
export function fire(nodeId: string): void {
  cancelActiveEvent();

  const reducedMotion = useHudStore.getState().isReducedMotion;

  // Chromatic shock — skipped under reduced motion; just the source
  // flash is kept, everything else is visual noise the spec excludes.
  if (!reducedMotion) {
    useHudStore.getState().chromaticSpike();
  }

  const connections = useGraphStore.getState().connections;
  const oneHop = getNeighbors(nodeId, 1, connections);
  const twoHop = getNeighbors(nodeId, 2, connections);

  // Partition: 2-hop exclusive = (within 2) minus (within 1) minus source.
  const hop2Only: string[] = [];
  for (const id of twoHop) {
    if (id !== nodeId && !oneHop.has(id)) hop2Only.push(id);
  }

  const start = performance.now() / 1000;
  activeEvent = {
    kind: 'fire',
    source: nodeId,
    sourceStart: start,
    // Reduced motion: collapse the cascade to a single source flash.
    hop1Ids: reducedMotion ? [] : [...oneHop],
    hop1Start: start + HOP1_DELAY,
    hop2Ids: reducedMotion ? [] : hop2Only,
    hop2Start: start + HOP2_DELAY,
  };
}

/**
 * Send a short 0.4-amplitude shimmer to `nodeId`'s immediate (1-hop)
 * neighbors. No cascade. Cancels any in-flight event first — typical
 * trigger is hover-enter.
 */
export function preFire(nodeId: string): void {
  cancelActiveEvent();

  // Hover shimmer is pure decoration — skip entirely on reduced motion.
  if (useHudStore.getState().isReducedMotion) return;

  const connections = useGraphStore.getState().connections;
  const oneHop = getNeighbors(nodeId, 1, connections);

  activeEvent = {
    kind: 'preFire',
    ids: [...oneHop],
    start: performance.now() / 1000,
  };
}

// ---------------------------------------------------------------------------
// Hook — mount once from a component inside the R3F Canvas tree
// ---------------------------------------------------------------------------

export default function useChainReaction(): void {
  useFrame(() => {
    if (!activeEvent) return;
    const now = performance.now() / 1000;

    if (activeEvent.kind === 'fire') {
      const ev = activeEvent;
      // Source
      writePulse(
        ev.source,
        waveValue(now - ev.sourceStart, FIRE_SOURCE_PEAK),
      );
      // 1-hop
      const hop1Elapsed = now - ev.hop1Start;
      for (const id of ev.hop1Ids) {
        writePulse(id, waveValue(hop1Elapsed, FIRE_HOP1_PEAK));
      }
      // 2-hop
      const hop2Elapsed = now - ev.hop2Start;
      for (const id of ev.hop2Ids) {
        writePulse(id, waveValue(hop2Elapsed, FIRE_HOP2_PEAK));
      }
      // The 2-hop wave finishes last — clear when its window has passed.
      if (hop2Elapsed >= DECAY) {
        writePulse(ev.source, 0);
        for (const id of ev.hop1Ids) writePulse(id, 0);
        for (const id of ev.hop2Ids) writePulse(id, 0);
        activeEvent = null;
      }
    } else {
      const ev = activeEvent;
      const elapsed = now - ev.start;
      for (const id of ev.ids) {
        writePulse(id, waveValue(elapsed, PRE_FIRE_PEAK));
      }
      if (elapsed >= DECAY) {
        for (const id of ev.ids) writePulse(id, 0);
        activeEvent = null;
      }
    }
  });

  // Safety net: clear the registry and any in-flight event if this hook
  // unmounts (e.g. route change). Registry entries are also removed by
  // each Neuron's own cleanup — this is belt-and-braces.
  useEffect(() => {
    return () => {
      cancelActiveEvent();
    };
  }, []);
}

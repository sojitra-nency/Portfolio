'use client';

/**
 * useAudio — the Neural View's ambient drone + FX pool.
 *
 * Architecture:
 * - Module-level singleton `AudioContext` initialised on the FIRST user
 *   gesture (browsers require this; creating a context at page load
 *   breaks Safari and triggers a "not allowed" error in Chrome).
 * - All 5 buffers (`ambient-drone` + 4 FX) are fetched + decoded in
 *   parallel once the gesture fires. Decode failures are swallowed
 *   with a console warning — the system still works, those calls just
 *   no-op until real audio drops into `public/audio/`.
 * - Routing:  source → fx/drone gain → masterGain → destination.
 *   masterGain smooth-ramps to 0 whenever `isMuted` flips or
 *   `prefers-reduced-motion` is active.
 * - FX pool: up to {@link MAX_VOICES} simultaneous sources; extras are
 *   silently dropped. Each FX play also briefly DUCKS the drone so the
 *   effect cuts through (3 ms ramp-down, 250 ms ramp-back).
 * - Drone: 600 ms linear crossfade on start / stop — no audible clicks.
 *
 * Public API (imported directly — like fire/preFire in useChainReaction):
 *   playFX(name)    FX name => hover-blip | select-chime | fire-whoosh | unlock-chord
 *   playDrone()     fade in the ambient drone
 *   stopDrone()     fade out the ambient drone
 *
 * Hook: mount once from `page.tsx` to wire the gesture listener, the
 * reduced-motion watcher, and the `isMuted` store subscription.
 */

import { useEffect } from 'react';
import { useAudioStore } from '@/store/useAudioStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FXName =
  | 'hover-blip'
  | 'select-chime'
  | 'fire-whoosh'
  | 'unlock-chord';

const DRONE_NAME = 'ambient-drone' as const;
type SoundName = FXName | typeof DRONE_NAME;

const ALL_SOUNDS: readonly SoundName[] = [
  'ambient-drone',
  'hover-blip',
  'select-chime',
  'fire-whoosh',
  'unlock-chord',
];

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------

const MAX_VOICES = 5;

/** Full-volume master gain when un-muted. */
const MASTER_GAIN = 0.8;
/** Gain applied per-FX (before master). */
const FX_GAIN = 0.7;
/** Drone resting gain. */
const DRONE_GAIN_FULL = 0.5;
/** Drone gain while an FX ducks it. */
const DRONE_GAIN_DUCKED = 0.22;
/** Drone fade duration for start / stop. */
const CROSSFADE_S = 0.6;
/** FX ducking envelope. */
const DUCK_ATTACK_S = 0.03;
const DUCK_RELEASE_S = 0.25;
/** Master-gain mute/unmute ramp duration. */
const MUTE_RAMP_S = 0.2;

// ---------------------------------------------------------------------------
// Module-level audio state
// ---------------------------------------------------------------------------

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let droneSource: AudioBufferSourceNode | null = null;
let droneGain: GainNode | null = null;
const buffers = new Map<SoundName, AudioBuffer>();
const activeVoices = new Set<AudioBufferSourceNode>();
let initPromise: Promise<void> | null = null;
let isReducedMotion = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function effectiveMuted(): boolean {
  return useAudioStore.getState().isMuted || isReducedMotion;
}

/** Resolve the current masterGain target for the effective mute state. */
function masterTarget(): number {
  return effectiveMuted() ? 0 : MASTER_GAIN;
}

/** Smooth the master gain toward the effective mute state over MUTE_RAMP_S. */
function syncMuteRamp(): void {
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(masterGain.gain.value, now);
  masterGain.gain.linearRampToValueAtTime(masterTarget(), now + MUTE_RAMP_S);
}

// ---------------------------------------------------------------------------
// Procedural synthesis (fallback when an OGG file is missing / empty)
// ---------------------------------------------------------------------------
//
// Each synthesiser renders its audio once into an AudioBuffer via
// OfflineAudioContext, then we hand that buffer to the same voice-pool
// code the fetch path uses. First & last samples are aligned for the
// drone so it loops seamlessly.

type Synthesizer = (sampleRate: number) => Promise<AudioBuffer>;

// ── Envelope helper — a gentle attack-decay curve used by every voice ───────
//
// linearRamp for the attack is softer than setValueAtTime; a final
// linearRamp down (instead of exponentialRamp to epsilon) avoids the
// tiny audible "click" you get when exp curves snap off near zero.
function adEnvelope(
  gain: GainNode,
  start: number,
  attack: number,
  peak: number,
  release: number,
): void {
  const end = start + attack + release;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.linearRampToValueAtTime(0, end);
}

/** A soft, bell-ish A5 ping — 120 ms total, sine + faint octave sheen. */
const synthHoverBlip: Synthesizer = async (sampleRate) => {
  const duration = 0.12;
  const oc = new OfflineAudioContext(1, Math.ceil(duration * sampleRate), sampleRate);

  // Fundamental — A5 (880 Hz), sine for a clean core.
  const osc = oc.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 880;
  const gain = oc.createGain();
  adEnvelope(gain, 0, 0.005, 0.28, 0.11);
  osc.connect(gain).connect(oc.destination);
  osc.start(0);
  osc.stop(duration);

  // Octave sparkle — quieter, shorter.
  const osc2 = oc.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 1760;
  const gain2 = oc.createGain();
  adEnvelope(gain2, 0, 0.002, 0.08, 0.06);
  osc2.connect(gain2).connect(oc.destination);
  osc2.start(0);
  osc2.stop(duration);

  return oc.startRendering();
};

/**
 * A warm major-third descending chime (E5 → C5) — triangle wave for warmth,
 * sine harmonic for bell-like body. Both notes overlap so the second
 * arrives while the first is still ringing.
 */
const synthSelectChime: Synthesizer = async (sampleRate) => {
  const duration = 0.42;
  const oc = new OfflineAudioContext(1, Math.ceil(duration * sampleRate), sampleRate);

  const notes: Array<{ freq: number; start: number }> = [
    { freq: 659.25, start: 0 }, // E5
    { freq: 523.25, start: 0.09 }, // C5
  ];

  // A mild low-pass takes the harsh top off the triangle wave.
  const tone = oc.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 3000;
  tone.Q.value = 0.4;
  tone.connect(oc.destination);

  for (const { freq, start } of notes) {
    const tail = 0.33;
    // Warm body — triangle.
    const body = oc.createOscillator();
    body.type = 'triangle';
    body.frequency.value = freq;
    const bodyGain = oc.createGain();
    adEnvelope(bodyGain, start, 0.01, 0.22, tail - 0.01);
    body.connect(bodyGain).connect(tone);
    body.start(start);
    body.stop(start + tail);

    // Octave sine "bell" — adds sparkle without brightness.
    const bell = oc.createOscillator();
    bell.type = 'sine';
    bell.frequency.value = freq * 2;
    const bellGain = oc.createGain();
    adEnvelope(bellGain, start, 0.005, 0.05, tail * 0.7);
    bell.connect(bellGain).connect(tone);
    bell.start(start);
    bell.stop(start + tail);
  }

  return oc.startRendering();
};

/**
 * Air-rush whoosh — pink-ish noise (white-noise through a gentle low-pass
 * rolloff) + a low descending body sine. Feels like soft air moving
 * rather than a razor-blade filter sweep.
 */
const synthFireWhoosh: Synthesizer = async (sampleRate) => {
  const duration = 0.4;
  const length = Math.ceil(duration * sampleRate);
  const oc = new OfflineAudioContext(1, length, sampleRate);

  // Pre-render noise buffer. One-pole low-pass filter in place smooths the
  // white → pink-ish spectrum (less piercing highs).
  const noiseBuf = oc.createBuffer(1, length, sampleRate);
  const channel = noiseBuf.getChannelData(0);
  let prev = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    prev = prev * 0.85 + white * 0.15; // gentle LPF
    channel[i] = prev;
  }

  const src = oc.createBufferSource();
  src.buffer = noiseBuf;

  // Smooth filter sweep — low Q keeps it airy, not resonant.
  const filter = oc.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.7;
  filter.frequency.setValueAtTime(2200, 0);
  filter.frequency.exponentialRampToValueAtTime(260, duration);

  const noiseGain = oc.createGain();
  // Fade in, hold, fade out — no exp snap.
  noiseGain.gain.setValueAtTime(0, 0);
  noiseGain.gain.linearRampToValueAtTime(0.28, 0.08);
  noiseGain.gain.linearRampToValueAtTime(0.18, duration * 0.7);
  noiseGain.gain.linearRampToValueAtTime(0, duration);
  src.connect(filter).connect(noiseGain).connect(oc.destination);

  // Low body sine — a soft sub-presence that descends with the noise.
  const body = oc.createOscillator();
  body.type = 'sine';
  body.frequency.setValueAtTime(180, 0);
  body.frequency.exponentialRampToValueAtTime(80, duration);
  const bodyGain = oc.createGain();
  adEnvelope(bodyGain, 0, 0.04, 0.14, duration - 0.04);
  body.connect(bodyGain).connect(oc.destination);

  src.start(0);
  body.start(0);
  body.stop(duration);
  return oc.startRendering();
};

/**
 * Major-pentatonic rising arpeggio (C4 E4 G4 A4 C5) — every pair of notes
 * is consonant, so the ear never catches on dissonance. Each note blends
 * a triangle body with a sine octave for bell-like warmth, routed
 * through a shared low-pass to keep the top from getting spikey.
 */
const synthUnlockChord: Synthesizer = async (sampleRate) => {
  const duration = 1.0;
  const oc = new OfflineAudioContext(1, Math.ceil(duration * sampleRate), sampleRate);

  const tone = oc.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 2800;
  tone.Q.value = 0.5;
  tone.connect(oc.destination);

  // C major pentatonic — C4 E4 G4 A4 C5.
  const notes = [261.63, 329.63, 392.0, 440.0, 523.25];
  const stride = 0.12;
  const tail = 0.68;

  for (let i = 0; i < notes.length; i++) {
    const freq = notes[i];
    const t0 = i * stride;

    // Body — triangle for warmth.
    const body = oc.createOscillator();
    body.type = 'triangle';
    body.frequency.value = freq;
    const bodyGain = oc.createGain();
    adEnvelope(bodyGain, t0, 0.02, 0.16, tail);
    body.connect(bodyGain).connect(tone);
    body.start(t0);
    body.stop(Math.min(duration, t0 + tail + 0.02));

    // Octave sparkle — sine, much quieter, shorter decay.
    const sparkle = oc.createOscillator();
    sparkle.type = 'sine';
    sparkle.frequency.value = freq * 2;
    const sparkleGain = oc.createGain();
    adEnvelope(sparkleGain, t0, 0.01, 0.05, tail * 0.6);
    sparkle.connect(sparkleGain).connect(tone);
    sparkle.start(t0);
    sparkle.stop(Math.min(duration, t0 + tail * 0.6 + 0.01));
  }

  return oc.startRendering();
};

/**
 * Warm 4-second loopable pad — open fifth (D3 + A3) + octave harmonic
 * (D4), all triangle waves, low-pass filtered at 1200 Hz. No detune
 * beating (that's what made the old version sound haunted); instead, a
 * very slow amplitude LFO (0.5 Hz sine modulating ±0.04 around a base
 * of 0.16) gives the pad a gentle breathing motion.
 *
 * Frequencies are whole integers so (freq × 4s) is an integer cycle
 * count → seamless loop. The LFO completes exactly 2 full cycles in 4s
 * so it also returns to zero at the seam.
 */
const synthAmbientDrone: Synthesizer = async (sampleRate) => {
  const duration = 4;
  const oc = new OfflineAudioContext(1, Math.ceil(duration * sampleRate), sampleRate);

  // Shared tone shaper — keeps the pad warm, no aggressive top-end.
  const tone = oc.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 1200;
  tone.Q.value = 0.3;
  tone.connect(oc.destination);

  // Open-fifth pad: D3 (147) + A3 (220), plus a quieter D4 (294) sheen.
  const layers: Array<{ freq: number; amp: number }> = [
    { freq: 147, amp: 0.18 },
    { freq: 220, amp: 0.11 },
    { freq: 294, amp: 0.05 },
  ];

  for (const { freq, amp } of layers) {
    const osc = oc.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const voiceGain = oc.createGain();
    voiceGain.gain.value = amp;
    osc.connect(voiceGain).connect(tone);
    osc.start(0);
    osc.stop(duration);

    // LFO → ±amp*0.25 modulation around the base voice gain — subtle
    // breathing that completes integer cycles across the 4-second loop.
    const lfo = oc.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5; // 2s period → 2 full cycles in 4s
    const lfoScale = oc.createGain();
    lfoScale.gain.value = amp * 0.25;
    lfo.connect(lfoScale).connect(voiceGain.gain);
    lfo.start(0);
    lfo.stop(duration);
  }

  return oc.startRendering();
};

const SYNTHESIZERS: Record<SoundName, Synthesizer> = {
  'ambient-drone': synthAmbientDrone,
  'hover-blip': synthHoverBlip,
  'select-chime': synthSelectChime,
  'fire-whoosh': synthFireWhoosh,
  'unlock-chord': synthUnlockChord,
};

// ---------------------------------------------------------------------------
// Buffer loading (fetch OGG → fall back to synthesis)
// ---------------------------------------------------------------------------

/**
 * Try to decode `/audio/<name>.ogg` first. If the file is missing,
 * empty, or can't be decoded, synthesise the sound instead. Returns
 * `null` only if both paths fail — shouldn't happen in practice since
 * `SYNTHESIZERS` covers every sound name.
 */
async function loadBuffer(
  c: AudioContext,
  name: SoundName,
): Promise<AudioBuffer | null> {
  // Try the file first — real OGG always wins over the procedural fallback.
  try {
    const response = await fetch(`/audio/${name}.ogg`);
    if (response.ok) {
      const arrayBuf = await response.arrayBuffer();
      if (arrayBuf.byteLength > 0) {
        return await c.decodeAudioData(arrayBuf);
      }
    }
  } catch {
    // Fall through to synthesis.
  }

  // Synthesise — always succeeds, and gives us audible output even with
  // empty placeholders in public/audio/.
  try {
    return await SYNTHESIZERS[name](c.sampleRate);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[useAudio] Synthesis failed for "${name}"`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Initialisation (called on first user gesture)
// ---------------------------------------------------------------------------

async function initialize(): Promise<void> {
  if (ctx) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;

    const c = new AC();
    const mg = c.createGain();
    mg.gain.value = effectiveMuted() ? 0 : MASTER_GAIN;
    mg.connect(c.destination);

    ctx = c;
    masterGain = mg;

    // Preload all 5 buffers in parallel. For each name we try the OGG
    // file first; if it's missing, empty, or can't be decoded, we fall
    // back to synthesising the sound with an OfflineAudioContext (see
    // `SYNTHESIZERS` below) so the system always has audible output.
    await Promise.all(
      ALL_SOUNDS.map(async (name) => {
        const buffer = await loadBuffer(c, name);
        if (buffer) buffers.set(name, buffer);
      }),
    );

    useAudioStore.getState().setReady(true);
  })();

  return initPromise;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function playFX(name: FXName): void {
  if (!ctx || !masterGain || effectiveMuted()) return;
  const buffer = buffers.get(name);
  if (!buffer) return;
  if (activeVoices.size >= MAX_VOICES) return;

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.value = FX_GAIN;

  source.connect(gain).connect(masterGain);
  activeVoices.add(source);
  source.onended = () => {
    activeVoices.delete(source);
    gain.disconnect();
    source.disconnect();
  };
  source.start();

  // Duck the drone briefly so the FX cuts through cleanly.
  if (droneGain) {
    const now = ctx.currentTime;
    droneGain.gain.cancelScheduledValues(now);
    droneGain.gain.setValueAtTime(droneGain.gain.value, now);
    droneGain.gain.linearRampToValueAtTime(
      DRONE_GAIN_DUCKED,
      now + DUCK_ATTACK_S,
    );
    droneGain.gain.linearRampToValueAtTime(
      DRONE_GAIN_FULL,
      now + DUCK_ATTACK_S + DUCK_RELEASE_S,
    );
  }
}

export function playDrone(): void {
  if (!ctx || !masterGain || effectiveMuted()) return;
  if (droneSource) return; // already playing
  const buffer = buffers.get(DRONE_NAME);
  if (!buffer) return;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = 0;

  source.connect(gain).connect(masterGain);
  source.start();

  droneSource = source;
  droneGain = gain;

  // Fade in.
  const now = ctx.currentTime;
  gain.gain.linearRampToValueAtTime(DRONE_GAIN_FULL, now + CROSSFADE_S);
}

export function stopDrone(): void {
  if (!ctx || !droneSource || !droneGain) return;

  const source = droneSource;
  const gain = droneGain;
  droneSource = null;
  droneGain = null;

  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0, now + CROSSFADE_S);

  source.stop(now + CROSSFADE_S);
  source.onended = () => {
    gain.disconnect();
    source.disconnect();
  };
}

// ---------------------------------------------------------------------------
// Hook — mount once from page.tsx
// ---------------------------------------------------------------------------

export default function useAudio(): void {
  useEffect(() => {
    // Reduced motion: forces muted without touching the user's preference.
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    isReducedMotion = motionQuery.matches;
    const onMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
      syncMuteRamp();
      if (effectiveMuted()) stopDrone();
      else if (ctx) playDrone();
    };
    motionQuery.addEventListener('change', onMotionChange);

    // One-shot user-gesture handler → creates the AudioContext + loads buffers.
    const onGesture = () => {
      void initialize().then(() => {
        if (ctx && ctx.state === 'suspended') void ctx.resume();
        if (!effectiveMuted()) playDrone();
      });
    };
    const gestureOpts: AddEventListenerOptions = {
      once: true,
      capture: true,
      passive: true,
    };
    window.addEventListener('click', onGesture, gestureOpts);
    window.addEventListener('keydown', onGesture, gestureOpts);
    window.addEventListener('touchstart', onGesture, gestureOpts);

    // Mute-state subscription — requires `subscribeWithSelector` middleware,
    // which useAudioStore declares (see src/store/useAudioStore.ts).
    const unsubscribe = useAudioStore.subscribe(
      (state) => state.isMuted,
      (muted) => {
        syncMuteRamp();
        if (muted) stopDrone();
        else if (ctx && !isReducedMotion) playDrone();
      },
    );

    return () => {
      motionQuery.removeEventListener('change', onMotionChange);
      window.removeEventListener('click', onGesture, true);
      window.removeEventListener('keydown', onGesture, true);
      window.removeEventListener('touchstart', onGesture, true);
      unsubscribe();
      stopDrone();
    };
  }, []);
}

'use client';

/**
 * CinemaCamera — drives the scene camera through three modes dispatched
 * from `useCinemaStore`:
 *
 * - **ambient**: subtle orbital sway (yaw ±2° / pitch ±1° on 60 s sines)
 *   plus slow z-breathing (±3 units on a 24 s sine). Makes the scene feel
 *   alive even when no one interacts.
 *
 * - **focus**: lerp position + lookAt toward a node-specific target
 *   (`focusTarget + focusDistance back-off` on +Z, offset by a 4°
 *   azimuth for cinematic framing). Adds a 2° dutch tilt on
 *   `camera.rotation.z` after lookAt. Smoothing uses maath/damp3.
 *
 * - **reset**: lerp back to [0, 0, 55] looking at the origin. Same
 *   smoothing as focus but no dutch tilt.
 *
 * - **tour**: (Task 34) treated the same as ambient here — the guided
 *   tour hook drives per-step focusOn calls.
 *
 * Reduced-motion users get an instant teleport to the desired pose every
 * frame, bypassing both drift and damping.
 *
 * The task's "lambda 4.0" is interpreted as a decay-rate (≈ inverse of
 * maath's smoothTime), so we pass `smoothTime = 0.25` — reaching ~95 %
 * of the target in ~0.75 s, well within the 0.9 s FOCUS window from
 * `neural-motion.ts`.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { damp3 } from 'maath/easing';
import * as THREE from 'three';

import { useCinemaStore } from '@/store/useCinemaStore';
import { useReducedMotion } from '@/lib/animations';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEG = Math.PI / 180;
const AMBIENT_R = 55;

/** smoothTime for damp3 in seconds — ~95 % of distance covered in ~0.75 s. */
const SMOOTH = 0.25;

/** Cinematic framing for focus mode. */
const FOCUS_AZIMUTH = 4 * DEG;
const FOCUS_DUTCH = 2 * DEG;

/** Ambient drift amplitudes + periods. */
const YAW_AMP = 2 * DEG;
const PITCH_AMP = 1 * DEG;
const DRIFT_PERIOD = 60; // s
const BREATHE_AMP = 3; // units
const BREATHE_PERIOD = 24; // s

/** Pinch-zoom range. The final camera distance from origin is clamped
 *  into [MIN_DIST, MAX_DIST] after pinch + ambient drift compose. */
const MIN_DIST = 20;
const MAX_DIST = 120;
/** Pixels of finger-travel → world-unit zoom. Tuned so a 150-pixel pinch
 *  moves the camera ~50 units — satisfying but not twitchy. */
const PINCH_SENSITIVITY = 0.35;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CinemaCamera() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const reducedMotion = useReducedMotion();

  // Scratch vectors — mutated in place every frame. Allocated once per mount.
  const desiredPos = useMemo(() => new THREE.Vector3(), []);
  const desiredLookAt = useMemo(() => new THREE.Vector3(), []);
  const currentLookAt = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  // Pinch-zoom offset applied on top of whichever pose the mode produced.
  // Positive = camera further out; negative = camera closer in. Ref-based
  // so a pinch in progress doesn't trigger React re-renders.
  const pinchOffsetRef = useRef(0);
  const pinchStateRef = useRef<{
    startDist: number;
    startOffset: number;
  } | null>(null);

  // Seed camera pose on mount so the first frame doesn't snap from wherever
  // R3F leaves the default.
  useEffect(() => {
    camera.position.set(0, 0, AMBIENT_R);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Two-finger pinch on the canvas → camera-distance offset. Listens on
  // the window so the gesture doesn't end if fingers slide off the
  // canvas element mid-pinch. touchmove is non-passive so we can
  // preventDefault and stop the browser from page-zooming underneath us.
  useEffect(() => {
    const canvas = gl.domElement;

    const distanceBetween = (a: Touch, b: Touch): number => {
      const dx = a.clientX - b.clientX;
      const dy = a.clientY - b.clientY;
      return Math.hypot(dx, dy);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      pinchStateRef.current = {
        startDist: distanceBetween(e.touches[0], e.touches[1]),
        startOffset: pinchOffsetRef.current,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      const state = pinchStateRef.current;
      if (!state || e.touches.length !== 2) return;
      e.preventDefault();
      const currentDist = distanceBetween(e.touches[0], e.touches[1]);
      const delta = (state.startDist - currentDist) * PINCH_SENSITIVITY;
      // Fingers apart (currentDist > startDist) → delta < 0 → zoom in.
      // Fingers together → delta > 0 → zoom out.
      pinchOffsetRef.current = state.startOffset + delta;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchStateRef.current = null;
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const { mode, focusTarget, focusDistance } = useCinemaStore.getState();
    let dutchTilt = 0;

    // ── 1. Compute the desired pose for this mode. ────────────────────────
    if (mode === 'focus' && focusTarget) {
      // Back-off from the node along +Z, nudged 4° sideways for framing.
      desiredPos.set(
        focusTarget.x + Math.sin(FOCUS_AZIMUTH) * focusDistance,
        focusTarget.y,
        focusTarget.z + Math.cos(FOCUS_AZIMUTH) * focusDistance,
      );
      desiredLookAt.copy(focusTarget);
      dutchTilt = FOCUS_DUTCH;
    } else if (mode === 'reset') {
      desiredPos.set(0, 0, AMBIENT_R);
      desiredLookAt.set(0, 0, 0);
    } else {
      // ambient / tour — orbital drift with subtle z-breathing.
      if (reducedMotion) {
        desiredPos.set(0, 0, AMBIENT_R);
      } else {
        const now = performance.now() / 1000;
        const yaw = Math.sin((now * 2 * Math.PI) / DRIFT_PERIOD) * YAW_AMP;
        // Offset pitch phase so yaw and pitch aren't perfectly in sync.
        const pitch =
          Math.sin((now * 2 * Math.PI) / DRIFT_PERIOD + Math.PI / 3) *
          PITCH_AMP;
        const zBreathe =
          Math.sin((now * 2 * Math.PI) / BREATHE_PERIOD) * BREATHE_AMP;
        const r = AMBIENT_R + zBreathe;
        desiredPos.set(
          Math.sin(yaw) * r,
          Math.sin(pitch) * r,
          Math.cos(yaw) * r,
        );
      }
      desiredLookAt.set(0, 0, 0);
    }

    // ── 1b. Apply pinch-zoom offset, then clamp to [MIN_DIST, MAX_DIST] ──
    // We scale the desired position vector (from its look-at target)
    // outward by the pinch offset. This preserves the mode's direction
    // while pushing the camera closer or further away. Clamping keeps
    // the user inside a sane range even if they fling the pinch.
    const pinch = pinchOffsetRef.current;
    if (pinch !== 0 || MIN_DIST > 0) {
      const offsetFromLook = desiredPos.clone().sub(desiredLookAt);
      const baseDist = offsetFromLook.length();
      if (baseDist > 1e-4) {
        let nextDist = baseDist + pinch;
        if (nextDist < MIN_DIST) {
          nextDist = MIN_DIST;
          pinchOffsetRef.current = MIN_DIST - baseDist;
        } else if (nextDist > MAX_DIST) {
          nextDist = MAX_DIST;
          pinchOffsetRef.current = MAX_DIST - baseDist;
        }
        offsetFromLook.multiplyScalar(nextDist / baseDist);
        desiredPos.copy(desiredLookAt).add(offsetFromLook);
      }
    }

    // ── 2. Move the camera toward the desired pose. ───────────────────────
    if (reducedMotion) {
      camera.position.copy(desiredPos);
      currentLookAt.copy(desiredLookAt);
    } else {
      damp3(camera.position, desiredPos, SMOOTH, delta);
      damp3(currentLookAt, desiredLookAt, SMOOTH, delta);
    }

    // lookAt must be called after position; rotation.z tilt is layered on
    // top afterward (lookAt would otherwise overwrite any prior roll).
    camera.lookAt(currentLookAt);
    if (dutchTilt !== 0) {
      camera.rotation.z += dutchTilt;
    }
  });

  return null;
}

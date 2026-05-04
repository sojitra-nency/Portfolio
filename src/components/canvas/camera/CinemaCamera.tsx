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
import { cameraSignals } from '@/lib/cameraControls';

/** Pixels of mouse-drag → world-unit pan. Lower = slower pan. */
const PAN_SENSITIVITY = 0.12;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEG = Math.PI / 180;
const AMBIENT_R = 40;

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

/** Zoom range.
 *  MIN_DIST ≈ 5    — fills the view with a single node up close.
 *  MAX_DIST ≈ 250  — zooms out far enough to see the whole galaxy with breathing room. */
const MIN_DIST = 5;
const MAX_DIST = 250;
/** Pixels of finger-travel → world-unit zoom. Tuned so a 150-pixel pinch
 *  moves the camera ~50 units — satisfying but not twitchy. */
const PINCH_SENSITIVITY = 0.35;
/** Wheel delta (px) → world-unit zoom. Scaled so one scroll notch (≈100 px)
 *  moves ~4 units near origin but we apply exponential feel via a multiplier
 *  proportional to current distance, so far-out scrolling is faster. */
const WHEEL_SENSITIVITY = 0.002;
/** World units per +/- keyboard tap — proportional step applied below. */
const KEY_ZOOM_FACTOR = 0.12;

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
  const pinchOffsetRef = useRef(0);
  const pinchStateRef = useRef<{
    startDist: number;
    startOffset: number;
  } | null>(null);

  // Pan offset — accumulated world-space XY shift from Space+drag or Ctrl+drag.
  const panOffsetRef = useRef(new THREE.Vector2(0, 0));
  const panDragRef = useRef<{ lastX: number; lastY: number } | null>(null);
  const spaceHeldRef = useRef(false);

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

  // Space+drag or Ctrl+drag → pan the camera view.
  useEffect(() => {
    const canvas = gl.domElement;

    const isPanTrigger = (e: MouseEvent) =>
      spaceHeldRef.current || e.ctrlKey;

    const updateCursor = () => {
      if (panDragRef.current) {
        canvas.style.cursor = 'grabbing';
      } else if (spaceHeldRef.current) {
        canvas.style.cursor = 'grab';
      } else {
        canvas.style.cursor = '';
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeldRef.current = true;
        if (document.activeElement === canvas || document.activeElement === document.body) {
          e.preventDefault();
        }
        updateCursor();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeldRef.current = false;
        panDragRef.current = null;
        updateCursor();
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!isPanTrigger(e)) return;
      e.preventDefault();
      panDragRef.current = { lastX: e.clientX, lastY: e.clientY };
      updateCursor();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (e.ctrlKey && !panDragRef.current) {
        canvas.style.cursor = 'grab';
      } else if (!e.ctrlKey && !spaceHeldRef.current) {
        if (!panDragRef.current) canvas.style.cursor = '';
      }
      const drag = panDragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.lastX;
      const dy = e.clientY - drag.lastY;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      panOffsetRef.current.x -= dx * PAN_SENSITIVITY;
      panOffsetRef.current.y += dy * PAN_SENSITIVITY;
    };

    const onMouseUp = () => {
      panDragRef.current = null;
      updateCursor();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [gl]);

  // Mouse wheel + keyboard +/- → zoom in/out via the shared pinchOffsetRef.
  useEffect(() => {
    const canvas = gl.domElement;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Scale delta proportionally to current distance so scrolling feels
      // equally responsive at min zoom (close) and max zoom (galaxy view).
      const currentDist = Math.max(
        MIN_DIST,
        camera.position.length() + pinchOffsetRef.current,
      );
      // deltaY > 0 = scroll down = zoom out (camera moves back).
      pinchOffsetRef.current += e.deltaY * WHEEL_SENSITIVITY * currentDist;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Skip if a text input is focused.
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '+' || e.key === '=') {
        const currentDist = camera.position.length() + pinchOffsetRef.current;
        pinchOffsetRef.current -= currentDist * KEY_ZOOM_FACTOR;
      } else if (e.key === '-' || e.key === '_') {
        const currentDist = camera.position.length() + pinchOffsetRef.current;
        pinchOffsetRef.current += currentDist * KEY_ZOOM_FACTOR;
      }
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
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

    // ── 1bb. Apply UI button signals ─────────────────────────────────────
    if (cameraSignals.resetRequested) {
      cameraSignals.resetRequested = false;
      pinchOffsetRef.current = 0;
      panOffsetRef.current.set(0, 0);
      // focusOn('origin') is called from the button — just clear offsets here.
    }
    if (cameraSignals.fitRequested) {
      cameraSignals.fitRequested = false;
      panOffsetRef.current.set(0, 0);
      // Push camera out to MAX_DIST by setting pinch offset.
      const currentDist = desiredPos.clone().sub(desiredLookAt).length();
      pinchOffsetRef.current = MAX_DIST - currentDist;
    }
    if (cameraSignals.zoomDelta !== 0) {
      pinchOffsetRef.current += cameraSignals.zoomDelta;
      cameraSignals.zoomDelta = 0;
    }

    // ── 1c. Apply pan offset to both desired position and look-at ────────
    const pan = panOffsetRef.current;
    desiredPos.x += pan.x;
    desiredPos.y += pan.y;
    desiredLookAt.x += pan.x;
    desiredLookAt.y += pan.y;

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

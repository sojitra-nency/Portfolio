'use client';

/**
 * NeuralScene — top-level R3F canvas wrapper.
 *
 * Hosts the scene, lighting, network, camera, and post-processing layers
 * (all added by later tasks). Wrapped in a class-based ErrorBoundary so a
 * WebGL-init failure or shader compile error lands on a branded fallback
 * card that directs the user to Quick View instead of a crashed canvas.
 *
 * Scene contents remain empty placeholders for now — populated by Tasks
 * 9 – 21 (background, nodes, connections, camera, effects).
 */

import {
  Suspense,
  Component,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';

import VolumetricFog from './scene/VolumetricFog';
import SceneLighting from './scene/SceneLighting';
import NeuralNetwork from './NeuralNetwork';
import CinemaCamera from './camera/CinemaCamera';
import EffectsStack from './postprocessing/EffectsStack';

// ---------------------------------------------------------------------------
// Error boundary — catches render/init failures inside <Canvas>.
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface 3D failures to the console so we can diagnose; the fallback
    // UI already redirects the user somewhere working.
    // eslint-disable-next-line no-console
    console.error('[NeuralScene] 3D render failed:', error, info);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Fallback — branded "signal lost" card with a Quick-View CTA.
// ---------------------------------------------------------------------------

function CanvasFallback() {
  return (
    <div
      role="alertdialog"
      aria-labelledby="neural-fallback-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--void)] px-6 text-white"
    >
      <div className="max-w-md rounded-xl border border-[color:var(--synapse)]/20 bg-[color:var(--void-warm)]/70 backdrop-blur-md p-8 text-center shadow-[0_20px_80px_-20px_rgba(124,211,255,0.25)]">
        <div
          aria-hidden
          className="mx-auto mb-5 h-2.5 w-2.5 rounded-full bg-[var(--synapse)] animate-neural-pulse shadow-[0_0_18px_rgba(124,211,255,0.7)]"
        />
        <h2
          id="neural-fallback-title"
          className="font-mono-hud text-xs uppercase tracking-[0.2em] text-[color:var(--synapse)]"
        >
          Signal Lost
        </h2>
        <p className="mt-3 text-lg font-semibold text-white">3D unavailable</p>
        <p className="mt-2 text-sm text-gray-400">
          Your browser or device couldn&apos;t initialize WebGL. Open the Quick
          View for a clean, scroll-based read of the portfolio.
        </p>
        <a
          href="/quick-view"
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[color:var(--synapse)]/40 bg-[color:var(--synapse)]/10 px-5 py-2.5 text-sm font-medium text-[color:var(--synapse)] transition-colors hover:bg-[color:var(--synapse)]/20"
        >
          Open Quick View
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NeuralScene — the mounted component.
// ---------------------------------------------------------------------------

export default function NeuralScene() {
  return (
    <div
      className="fixed inset-0 w-full h-full"
      style={{ background: 'var(--void)' }}
    >
      <CanvasErrorBoundary fallback={<CanvasFallback />}>
        <Canvas
          camera={{ position: [0, 0, 200], fov: 55, near: 0.1, far: 1000 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
        >
          <color attach="background" args={['#04050E']} />

          <Suspense fallback={null}>
            {/* Scene layers:                                                */}
            {/* <NebulaBackground />  Task  9 — shader-driven nebula plane   */}
            {/* <StarField />         Task 10 — 3-plane parallax stars       */}
            <VolumetricFog />
            <SceneLighting />
            <NeuralNetwork />
            <CinemaCamera />
            <EffectsStack />

            <Preload all />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}

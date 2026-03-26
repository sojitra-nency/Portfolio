'use client';

import { Suspense, Component, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import NeuralNetwork from './NeuralNetwork';
import AmbientParticles from './AmbientParticles';
import CameraController from './CameraController';
import PostProcessing from './PostProcessing';
import { useNetworkStore } from '@/store/useNetworkStore';

class CanvasErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function CanvasFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0A0A1A] text-white">
      <div className="text-center space-y-4 px-6">
        <h2 className="text-xl font-semibold font-display">3D rendering unavailable</h2>
        <p className="text-gray-400 text-sm max-w-md">
          Your browser or device doesn&apos;t support WebGL. Try the classic view instead.
        </p>
        <a
          href="/quick-view"
          className="inline-block px-5 py-2.5 rounded-lg bg-[#FFD700]/20 text-[#FFD700] text-sm font-medium border border-[#FFD700]/30 hover:bg-[#FFD700]/30 transition-colors"
        >
          Open Quick View
        </a>
      </div>
    </div>
  );
}

export default function NeuralCanvas() {
  const deactivateNode = useNetworkStore((s) => s.deactivateNode);

  return (
    <div className="fixed inset-0 w-full h-full" style={{ background: '#0A0A1A' }}>
      <CanvasErrorBoundary fallback={<CanvasFallback />}>
        <Canvas
          camera={{
            position: [0, 0, 50],
            fov: 60,
            near: 0.1,
            far: 1000,
          }}
          onPointerMissed={() => deactivateNode()}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#0A0A1A']} />

          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <pointLight position={[20, 20, 30]} intensity={0.6} color="#4466ff" />
          <pointLight position={[-20, -20, 30]} intensity={0.4} color="#ff00e5" />

          <Suspense fallback={null}>
            <NeuralNetwork />
            <AmbientParticles />
            <CameraController />
            <PostProcessing />
            <Preload all />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}

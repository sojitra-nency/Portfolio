'use client';

import dynamic from 'next/dynamic';
import { useResponsive } from '@/hooks/useResponsive';
import { useKeyboardNav } from '@/hooks/useKeyboardNav';
import Navigation from '@/components/ui/Navigation';
import DetailPanel from '@/components/ui/DetailPanel';
import ProgressTracker from '@/components/ui/ProgressTracker';
import Minimap from '@/components/ui/Minimap';
import LoadingScreen from '@/components/ui/LoadingScreen';
import IntroHint from '@/components/ui/IntroHint';

// Dynamic import for the 3D canvas (no SSR)
const NeuralCanvas = dynamic(
  () => import('@/components/canvas/NeuralCanvas'),
  { ssr: false }
);

export default function Home() {
  useResponsive();
  useKeyboardNav();

  return (
    <main id="main-content" className="relative w-full h-screen overflow-hidden">
      {/* Loading screen */}
      <LoadingScreen />

      {/* 3D Neural Network Canvas */}
      <NeuralCanvas />

      {/* UI Overlays */}
      <Navigation />
      <DetailPanel />
      <ProgressTracker />
      <Minimap />
      <IntroHint />
    </main>
  );
}

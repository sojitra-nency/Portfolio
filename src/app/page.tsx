'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

import useResponsive from '@/hooks/useResponsive';
import useKeyboardNav from '@/hooks/useKeyboardNav';
import useAudio from '@/hooks/useAudio';
import useGuidedTour from '@/hooks/useGuidedTour';
import useIdleCuriosity from '@/hooks/useIdleCuriosity';
import useEasterEggs from '@/hooks/useEasterEggs';
import useDeepLink from '@/hooks/useDeepLink';
import BootSequence from '@/components/hud/BootSequence';
import CornerHUD from '@/components/hud/CornerHUD';
import CoherenceMeter from '@/components/hud/CoherenceMeter';
import NeuralMap from '@/components/hud/NeuralMap';
import DetailCard from '@/components/hud/DetailCard';
import KeyCheatSheet from '@/components/hud/KeyCheatSheet';
import UnlockBanner from '@/components/hud/UnlockBanner';
import CommandPalette from '@/components/hud/CommandPalette';
import QuickViewPortal from '@/components/hud/QuickViewPortal';
import CanvasControls from '@/components/hud/CanvasControls';
import { useHudStore } from '@/store/useHudStore';

/**
 * Neural View entry. Mounts environment-detection + global keyboard
 * shortcuts, the 3D scene (SSR-disabled since R3F needs the DOM), and
 * the HUD layer.
 *
 * Render order in the stacking context:
 *   - NeuralScene fills the viewport at default z-index (0).
 *   - BootSequence sits above it at z-50 until the user dismisses it.
 *   - HUDs sit above the scene at z-30 / z-40 after boot.
 *
 * The scene mounts on first render (even during boot) so its force-layout
 * and shader compilation complete in parallel with the boot animation —
 * no blank gap when the boot flash clears.
 */
const NeuralScene = dynamic(
  () => import('@/components/canvas/NeuralScene'),
  { ssr: false },
);

/** useDeepLink reads `useSearchParams`, which Next 16 requires to live
 * inside a Suspense boundary. Isolating it here keeps the rest of the
 * page outside that boundary so nothing else is affected. */
function DeepLinkBridge() {
  useDeepLink();
  return null;
}

export default function Home() {
  useResponsive();
  useKeyboardNav();
  useAudio();
  useGuidedTour();
  useIdleCuriosity();
  useEasterEggs();
  const isBootComplete = useHudStore((s) => s.isBootComplete);
  const isDetailOpen = useHudStore((s) => s.isDetailOpen);
  const isDetailMinimized = useHudStore((s) => s.isDetailMinimized);
  const isMobile = useHudStore((s) => s.isMobile);
  const panelWidth = useHudStore((s) => s.panelWidth);

  // Panel is only "open as sidebar" on desktop.
  const sidebarOpen = isDetailOpen && !isMobile;

  return (
    <main
      id="main-content"
      className="relative w-full h-screen overflow-hidden bg-[var(--void)] flex"
    >
      <Suspense fallback={null}>
        <DeepLinkBridge />
      </Suspense>

      {/* Canvas area — shrinks when the detail panel opens, leaves 40px when minimized */}
      <motion.div
        data-canvas-area
        className="relative h-full flex-shrink-0"
        animate={{ width: sidebarOpen
          ? `calc(100% - ${isDetailMinimized ? 40 : panelWidth}px)`
          : '100%'
        }}
        transition={{ duration: 0.35, ease: [0.32, 0, 0.67, 0] }}
      >
        <NeuralScene />
        {/* Toolbar inside canvas so bottom-center is relative to canvas width */}
        {isBootComplete && <CanvasControls />}
      </motion.div>

      {!isBootComplete && <BootSequence />}
      {isBootComplete && (
        <>
          <CornerHUD />
          <CoherenceMeter />
          <NeuralMap />
          <DetailCard />
          <KeyCheatSheet />
          <UnlockBanner />
          <CommandPalette />
          <QuickViewPortal />
        </>
      )}
    </main>
  );
}

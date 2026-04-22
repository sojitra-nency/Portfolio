'use client';

import dynamic from 'next/dynamic';

import useResponsive from '@/hooks/useResponsive';
import useKeyboardNav from '@/hooks/useKeyboardNav';
import BootSequence from '@/components/hud/BootSequence';
import CornerHUD from '@/components/hud/CornerHUD';
import CoherenceMeter from '@/components/hud/CoherenceMeter';
import NeuralMap from '@/components/hud/NeuralMap';
import DetailCard from '@/components/hud/DetailCard';
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

export default function Home() {
  useResponsive();
  useKeyboardNav();
  const isBootComplete = useHudStore((s) => s.isBootComplete);

  return (
    <main
      id="main-content"
      className="relative w-full h-screen overflow-hidden bg-[var(--void)]"
    >
      <NeuralScene />

      {!isBootComplete && <BootSequence />}
      {isBootComplete && (
        <>
          <CornerHUD />
          <CoherenceMeter />
          <NeuralMap />
          <DetailCard />
        </>
      )}
    </main>
  );
}

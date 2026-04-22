'use client';

import useResponsive from '@/hooks/useResponsive';
import useKeyboardNav from '@/hooks/useKeyboardNav';
import BootSequence from '@/components/hud/BootSequence';
import { useHudStore } from '@/store/useHudStore';

/**
 * Neural View entry. Mounts the environment-detection hook + global
 * keyboard shortcuts, then gates the scene layer on `isBootComplete`.
 *
 * BootSequence renders as a full-screen terminal overlay until the user
 * dismisses it; it calls `useHudStore.setBootComplete(true)` on exit,
 * after which this component unmounts it.
 *
 * NeuralScene and the corner HUDs are wired up in subsequent tasks.
 */
export default function Home() {
  useResponsive();
  useKeyboardNav();
  const isBootComplete = useHudStore((s) => s.isBootComplete);

  return (
    <main
      id="main-content"
      className="relative w-full h-screen overflow-hidden bg-[var(--void)]"
    >
      {!isBootComplete && <BootSequence />}
      {/* Scene + HUDs mount here in later tasks. */}
    </main>
  );
}

/**
 * HUD-layer UI state for the Neural View.
 *
 * Flags here gate which DOM overlays are visible at any given moment —
 * boot sequence, detail card, cheat sheet, tour — plus the current
 * commTooltip text. No persistence; HUD state resets on reload.
 *
 * The responsive / GPU-tier flags (`isMobile`, `isReducedMotion`,
 * `gpuTier`) will be appended to this store in Task 23.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Duration (in seconds) of the chromatic-aberration spike triggered by
 * `chromaticSpike()`. Consumed by the EffectsStack to decay the offset
 * back to baseline.
 */
export const CHROMATIC_SPIKE_DURATION = 0.2;

export interface HudState {
  /** True once the BootSequence overlay has dismissed. Other HUD pieces
   * wait for this flag before entering. */
  isBootComplete: boolean;
  /** Whether the DetailCard is currently visible. */
  isDetailOpen: boolean;
  /** Whether the KeyCheatSheet overlay is visible (toggled by `?`). */
  isCheatSheetOpen: boolean;
  /** Whether the guided tour is actively playing. */
  isTourActive: boolean;
  /** Text shown in the CommTooltip pill, or `null` to hide it. */
  commTooltipText: string | null;
  /** `performance.now() / 1000` when the current chromatic spike ends, or
   * `0` if no spike is active. Read by EffectsStack each frame to
   * animate the ChromaticAberration offset. */
  chromaticSpikeEndAt: number;

  setBootComplete: (value: boolean) => void;
  setDetailOpen: (value: boolean) => void;
  setCheatSheetOpen: (value: boolean) => void;
  setTourActive: (value: boolean) => void;
  setCommTooltipText: (value: string | null) => void;
  /** Trigger a brief chromatic-aberration pulse — typically wired to
   * chain-reaction fire events for a "signal shock" feel. */
  chromaticSpike: () => void;
}

export const useHudStore = create<HudState>()(
  subscribeWithSelector((set) => ({
    isBootComplete: false,
    isDetailOpen: false,
    isCheatSheetOpen: false,
    isTourActive: false,
    commTooltipText: null,
    chromaticSpikeEndAt: 0,

    setBootComplete: (value) => set({ isBootComplete: value }),
    setDetailOpen: (value) => set({ isDetailOpen: value }),
    setCheatSheetOpen: (value) => set({ isCheatSheetOpen: value }),
    setTourActive: (value) => set({ isTourActive: value }),
    setCommTooltipText: (value) => set({ commTooltipText: value }),
    chromaticSpike: () =>
      set({
        chromaticSpikeEndAt:
          performance.now() / 1000 + CHROMATIC_SPIKE_DURATION,
      }),
  })),
);

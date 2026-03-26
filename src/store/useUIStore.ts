'use client';

import { create } from 'zustand';

interface UIStore {
  isPanelOpen: boolean;
  isGuidedMode: boolean;
  isQuickViewMode: boolean;
  isMinimapVisible: boolean;
  isIntroComplete: boolean;
  isMobile: boolean;
  isReducedMotion: boolean;
  guidedStep: number;

  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  setGuidedMode: (on: boolean) => void;
  nextGuidedStep: () => void;
  setQuickViewMode: (on: boolean) => void;
  setMinimapVisible: (visible: boolean) => void;
  completeIntro: () => void;
  setMobile: (mobile: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isPanelOpen: false,
  isGuidedMode: false,
  isQuickViewMode: false,
  isMinimapVisible: true,
  isIntroComplete: false,
  isMobile: false,
  isReducedMotion: false,
  guidedStep: 0,

  setPanelOpen: (open) => set({ isPanelOpen: open }),
  togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
  setGuidedMode: (on) => set({ isGuidedMode: on, guidedStep: 0 }),
  nextGuidedStep: () => set((s) => ({ guidedStep: s.guidedStep + 1 })),
  setQuickViewMode: (on) => set({ isQuickViewMode: on }),
  setMinimapVisible: (visible) => set({ isMinimapVisible: visible }),
  completeIntro: () => set({ isIntroComplete: true }),
  setMobile: (mobile) => set({ isMobile: mobile }),
  setReducedMotion: (reduced) => set({ isReducedMotion: reduced }),
}));

/**
 * Audio subsystem state for the Neural View.
 *
 * `isMuted` defaults to `true` — audio is opt-in per Awwwards convention
 * and browser autoplay policy. The choice is persisted so returning
 * visitors don't re-surprise themselves on each session.
 *
 * `isAudioReady` is a runtime flag set by `useAudio` (Task 30) once the
 * AudioContext has been unlocked by a user gesture and all buffers are
 * decoded. Not persisted — it must be re-derived on each page load.
 */

import { create } from 'zustand';
import {
  subscribeWithSelector,
  persist,
  createJSONStorage,
} from 'zustand/middleware';

export interface AudioState {
  isMuted: boolean;
  isAudioReady: boolean;

  setMuted: (value: boolean) => void;
  setReady: (value: boolean) => void;
}

/** SSR-safe localStorage fallback — used during Next.js server render. */
const ssrSafeStorage: Storage = {
  length: 0,
  clear: () => {},
  getItem: () => null,
  key: () => null,
  removeItem: () => {},
  setItem: () => {},
};

export const useAudioStore = create<AudioState>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        isMuted: true,
        isAudioReady: false,

        setMuted: (value) => set({ isMuted: value }),
        setReady: (value) => set({ isAudioReady: value }),
      }),
      {
        name: 'neural-nexus-audio',
        storage: createJSONStorage(() =>
          typeof window !== 'undefined' ? localStorage : ssrSafeStorage,
        ),
        // Only `isMuted` survives reloads; `isAudioReady` is runtime-only.
        partialize: (state) => ({ isMuted: state.isMuted }),
      },
    ),
  ),
);

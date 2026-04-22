/**
 * Camera choreography state for the Neural View.
 *
 * `mode` drives the CinemaCamera component (Task 20):
 * - `ambient` — slow orbital sway, default idle.
 * - `focus`   — smooth dolly to `focusTarget` at `focusDistance`.
 * - `reset`   — transitional lerp back to the origin view, then flips to
 *               `ambient` once the camera settles.
 * - `tour`    — guided-tour mode; the useGuidedTour hook walks keyframes
 *               and calls `focusOn` for each step.
 *
 * `focusOn(nodeId)` looks up the node's position from `useGraphStore` and
 * sets `focusDistance` based on the node's level — higher levels (tools)
 * pull the camera closer; level 0 (origin) backs it out far.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as THREE from 'three';

import { useGraphStore } from '@/store/useGraphStore';
import type { NodeLevel } from '@/data/types';

export type CinemaMode = 'ambient' | 'focus' | 'reset' | 'tour';

/** Distance from camera to focus target, per node level. Tuned in Task 20. */
const FOCUS_DISTANCE_BY_LEVEL: Record<NodeLevel, number> = {
  0: 60,
  1: 30,
  2: 18,
  3: 14,
  4: 12,
};

/** Default ambient back-off distance. */
const AMBIENT_DISTANCE = 55;

export interface CinemaState {
  mode: CinemaMode;
  focusTarget: THREE.Vector3 | null;
  focusDistance: number;

  /** Enter focus mode on a specific node. No-op if the node or its position
   * isn't known yet (e.g. force-layout still settling). */
  focusOn: (nodeId: string) => void;

  /** Leave focus/tour mode and return to ambient orbital sway. */
  returnToAmbient: () => void;

  /** Flip into guided-tour mode. The useGuidedTour hook (Task 34) reads
   * this flag and drives camera via repeated `focusOn` calls. */
  startTour: () => void;
}

export const useCinemaStore = create<CinemaState>()(
  subscribeWithSelector((set) => ({
    mode: 'ambient',
    focusTarget: null,
    focusDistance: AMBIENT_DISTANCE,

    focusOn: (nodeId) => {
      const { nodes, positions } = useGraphStore.getState();
      const node = nodes.find((n) => n.id === nodeId);
      const position = positions.get(nodeId);
      if (!node || !position) return;

      set({
        mode: 'focus',
        focusTarget: position.clone(),
        focusDistance: FOCUS_DISTANCE_BY_LEVEL[node.level],
      });
    },

    returnToAmbient: () =>
      set({
        mode: 'ambient',
        focusTarget: null,
        focusDistance: AMBIENT_DISTANCE,
      }),

    startTour: () =>
      set({
        mode: 'tour',
        // focusTarget/Distance are driven by the tour hook per-step.
        focusTarget: null,
      }),
  })),
);

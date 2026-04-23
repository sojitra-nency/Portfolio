'use client';

/**
 * useEasterEggs — three hidden interactions in the Neural View.
 *
 * 1. Konami code (↑↑↓↓←→←→BA)
 *    Injects a "DEV MODE" neuron near the origin (position 5,5,0) into the
 *    graph store, prints an ASCII signature to the console, and fires a
 *    chain-reaction pulse from origin. Re-triggering while the node is
 *    already active is a no-op (idempotent).
 *
 * 2. Triple-click on origin neuron
 *    Prints a ritual ASCII message to the console and fires a full-graph
 *    radial pulse from origin.
 *    Detection: three `pointerdown` events on the same target within 600 ms.
 *    The origin neuron's group sits at roughly screen-center before any
 *    camera movement, but we detect it by comparing `dataset.nodeId` on the
 *    canvas's enclosing element — R3F's pointer events bubble to the
 *    `<canvas>` which we annotate with a `data-active-node` attribute via
 *    a Zustand subscription.
 *    Simpler alternative used here: listen for `pointerdown` on `window`,
 *    check `useGraphStore.activeNodeId === 'origin'` at the time of the
 *    third tap. This works because a single click on origin already
 *    activates it (sets activeNodeId).
 *
 * 3. Hidden keyboard-only node ("ghost-node")
 *    A node with id `ghost-node` is added to the graph at (0,0,-60) — deep
 *    behind the scene, invisible to mouse users. It is reachable only by
 *    Tab-cycling through nodes (useKeyboardNav cycles all visible nodes).
 *    Activating it logs a secret message.
 *    The node is injected on first Tab press if not already present.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { useGraphStore } from '@/store/useGraphStore';
import { fire } from '@/hooks/useChainReaction';
import type { NeuralNode } from '@/data/types';

// ---------------------------------------------------------------------------
// ASCII art payloads (console only — never rendered in the DOM)
// ---------------------------------------------------------------------------

const ASCII_SIGNATURE = `
 ███╗   ██╗███████╗███╗   ██╗ ██████╗██╗   ██╗
 ████╗  ██║██╔════╝████╗  ██║██╔════╝╚██╗ ██╔╝
 ██╔██╗ ██║█████╗  ██╔██╗ ██║██║      ╚████╔╝
 ██║╚██╗██║██╔══╝  ██║╚██╗██║██║       ╚██╔╝
 ██║ ╚████║███████╗██║ ╚████║╚██████╗   ██║
 ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═══╝ ╚═════╝   ╚═╝

 NEURAL NEXUS — DEV MODE UNLOCKED
 Built by Nency Sojitra · Full Stack Python Developer
 github.com/nency-sojitra · surat, gujarat

 "Code is just thinking made executable."
`;

const RITUAL_MESSAGE = `
 ✦ You have clicked the origin three times. ✦

 The neural core acknowledges your persistence.
 All synapses are now attuned to your signal.

 — N E N C Y   S O J I T R A —
`;

const GHOST_MESSAGE = `
 👻  You found the ghost node.

 This neuron exists at coordinates (0, 0, -60) —
 60 units behind the visible graph, accessible
 only by those who Tab their way through the void.

 You are one of very few who made it here.
 — Neural Nexus, hidden layer
`;

// ---------------------------------------------------------------------------
// Dev-mode node definition
// ---------------------------------------------------------------------------

const DEV_NODE_ID = 'dev-mode';
const GHOST_NODE_ID = 'ghost-node';

const DEV_NODE: NeuralNode = {
  id: DEV_NODE_ID,
  label: 'DEV MODE',
  category: 'core',
  level: 2,
  parentId: 'origin',
  summary: 'You found the secret.',
  description:
    'Unlocked via the Konami code. This neuron only exists for those who know the sequence.',
  isHidden: false,
  metadata: {
    tags: ['easter egg', 'konami', '↑↑↓↓←→←→BA'],
  },
};

const GHOST_NODE: NeuralNode = {
  id: GHOST_NODE_ID,
  label: 'GHOST NODE',
  category: 'core',
  level: 4,
  parentId: null,
  summary: 'You navigated into the void.',
  description:
    'A hidden neuron at depth −60. Reachable only via keyboard Tab cycling.',
  isHidden: false,
  metadata: {
    tags: ['hidden', 'keyboard-only', 'ghost'],
  },
};

// ---------------------------------------------------------------------------
// Konami sequence
// ---------------------------------------------------------------------------

const KONAMI = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'b', 'a',
];

// ---------------------------------------------------------------------------
// Store injection helpers
// ---------------------------------------------------------------------------

function injectNode(node: NeuralNode, position: THREE.Vector3): boolean {
  const state = useGraphStore.getState();
  const already = state.nodes.some((n) => n.id === node.id);
  if (already) return false;

  // Zustand stores are readonly via the type — cast to bypass for the
  // one-time mutation needed here.
  (useGraphStore as unknown as { setState: (p: object) => void }).setState({
    nodes: [...state.nodes, node],
  });
  useGraphStore.getState().setPosition(node.id, position);
  return true;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export default function useEasterEggs() {
  const konamiProgress = useRef(0);
  const clickTimes = useRef<number[]>([]);
  const ghostInjected = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ── 1. Konami code ──────────────────────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      const expected = KONAMI[konamiProgress.current];
      if (e.key === expected) {
        konamiProgress.current++;
        if (konamiProgress.current === KONAMI.length) {
          konamiProgress.current = 0;
          activateDevMode();
        }
      } else {
        // Reset — allow partial restart if current key matches index 0.
        konamiProgress.current = e.key === KONAMI[0] ? 1 : 0;
      }

      // ── 3. Ghost-node keyboard injection ───────────────────────────
      // Inject on first Tab press so the node enters the cycle exactly
      // when the user starts keyboard navigation.
      if (e.key === 'Tab' && !ghostInjected.current) {
        ghostInjected.current = true;
        injectNode(GHOST_NODE, new THREE.Vector3(0, 0, -60));
      }

      // Log secret message when ghost node becomes active.
      if (
        e.key === 'Enter' &&
        useGraphStore.getState().activeNodeId === GHOST_NODE_ID
      ) {
        console.log('%c' + GHOST_MESSAGE, 'color: #7CD3FF; font-family: monospace');
      }
    };

    // ── 2. Triple-click on origin ───────────────────────────────────────
    const onPointerDown = () => {
      const now = performance.now();
      const activeId = useGraphStore.getState().activeNodeId;
      if (activeId !== 'origin') {
        clickTimes.current = [];
        return;
      }
      clickTimes.current.push(now);
      // Keep only clicks within the last 600 ms.
      clickTimes.current = clickTimes.current.filter((t) => now - t < 600);
      if (clickTimes.current.length >= 3) {
        clickTimes.current = [];
        activateOriginRitual();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);
}

// ---------------------------------------------------------------------------
// Easter egg actions (module-level so they don't close over stale state)
// ---------------------------------------------------------------------------

function activateDevMode() {
  const injected = injectNode(DEV_NODE, new THREE.Vector3(5, 5, 0));
  if (!injected) return; // already present — don't double-log

  console.log('%c' + ASCII_SIGNATURE, 'color: #FFD700; font-family: monospace; font-size: 11px');
  console.log('%c↑↑↓↓←→←→BA — sequence recognised.', 'color: #7CD3FF; font-family: monospace');

  // Give the force layout a tick to receive the new node before firing.
  setTimeout(() => {
    fire('origin');
    useGraphStore.getState().activate(DEV_NODE_ID);
  }, 100);
}

function activateOriginRitual() {
  console.log('%c' + RITUAL_MESSAGE, 'color: #FF00E5; font-family: monospace; font-size: 12px');
  fire('origin');
}

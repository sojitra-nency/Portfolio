'use client';

import { useEffect } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { useUIStore } from '@/store/useUIStore';

export function useKeyboardNav() {
  const activateNode = useNetworkStore((s) => s.activateNode);
  const deactivateNode = useNetworkStore((s) => s.deactivateNode);
  const activeNodeId = useNetworkStore((s) => s.activeNodeId);
  const resetView = useNetworkStore((s) => s.resetView);
  const getVisibleNodes = useNetworkStore((s) => s.getVisibleNodes);
  const setPanelOpen = useUIStore((s) => s.setPanelOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'Escape':
          deactivateNode();
          setPanelOpen(false);
          break;

        case 'Home':
          resetView();
          break;

        case 'Tab': {
          e.preventDefault();
          const visible = getVisibleNodes();
          if (visible.length === 0) break;
          const currentIdx = visible.findIndex((n) => n.id === activeNodeId);
          const nextIdx = e.shiftKey
            ? (currentIdx - 1 + visible.length) % visible.length
            : (currentIdx + 1) % visible.length;
          activateNode(visible[nextIdx].id);
          break;
        }

        case 'Enter':
          if (activeNodeId) {
            setPanelOpen(true);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNodeId, activateNode, deactivateNode, resetView, getVisibleNodes, setPanelOpen]);
}

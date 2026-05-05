'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioStore } from '@/store/useAudioStore';
import { useHudStore } from '@/store/useHudStore';
import { useCinemaStore } from '@/store/useCinemaStore';
import { useGraphStore } from '@/store/useGraphStore';
import { cameraSignals } from '@/lib/cameraControls';
import { hudEnter, EASE_EXPO } from '@/lib/neural-motion';

// ---------------------------------------------------------------------------
// Individual control button
// ---------------------------------------------------------------------------

function CtrlBtn({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative flex items-center justify-center">
      <motion.button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={active}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        transition={{ duration: 0.14, ease: EASE_EXPO }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-150"
        style={{
          background: active ? 'rgba(91,143,255,0.12)' : 'transparent',
          color: hovered ? 'rgba(255,255,255,0.9)' : active ? 'rgba(91,143,255,0.9)' : 'rgba(255,255,255,0.5)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {children}
      </motion.button>

      {/* Tooltip — appears above button */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key="tip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12, ease: EASE_EXPO }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap"
          >
            <span
              className="font-mono-hud text-[9px] uppercase tracking-[0.16em] px-2 py-1 rounded-md"
              style={{
                background: 'rgba(10,12,26,0.92)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
            >
              {label}
            </span>
            {/* Arrow */}
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
              style={{
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '4px solid rgba(255,255,255,0.1)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Divider() {
  return <div className="h-5 w-px bg-white/10 my-auto" />;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const ZoomIn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ZoomOut = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const Center = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="3" />
    <path d="M3 12h3M18 12h3M12 3v3M12 18v3" />
  </svg>
);

const FitAll = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M3 7V3h4M17 3h4v4M21 17v4h-4M7 21H3v-4" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SpeakerOn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const SpeakerOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="22" y1="9" x2="16" y2="15" />
    <line x1="16" y1="9" x2="22" y2="15" />
  </svg>
);

const ExpandAllIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="5" r="2" />
    <circle cx="5" cy="19" r="2" />
    <circle cx="12" cy="19" r="2" />
    <circle cx="19" cy="19" r="2" />
    <path d="M12 7v5M12 12l-5 5M12 12l5 5M12 12v2" />
  </svg>
);

const CmdIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
  </svg>
);

// ---------------------------------------------------------------------------
// CanvasControls — vertical toolbar, left-center
// ---------------------------------------------------------------------------

export default function CanvasControls() {
  const reducedMotion = useHudStore((s) => s.isReducedMotion);
  const isMobile = useHudStore((s) => s.isMobile);
  const isMuted = useAudioStore((s) => s.isMuted);
  const setMuted = useAudioStore((s) => s.setMuted);
  const allExpanded = useGraphStore((s) =>
    s.nodes.filter((n) => n.level === 1 && !n.isHidden).every((n) => s.expandedClusters.has(n.id))
  );

  if (isMobile) return null;

  const ZOOM_STEP_FACTOR = 0.18; // 18% of current distance per click

  const zoomIn = () => {
    const dist = 40; // rough estimate; actual clamping happens in CinemaCamera
    cameraSignals.zoomDelta -= dist * ZOOM_STEP_FACTOR;
  };

  const zoomOut = () => {
    const dist = 40;
    cameraSignals.zoomDelta += dist * ZOOM_STEP_FACTOR;
  };

  const resetCenter = () => {
    cameraSignals.resetRequested = true;
    useCinemaStore.getState().focusOn('origin');
  };

  const fitAll = () => {
    cameraSignals.fitRequested = true;
  };

  const openCommandPalette = () => {
    useHudStore.getState().setCommandPaletteOpen(true);
  };

  return (
    <motion.div
      className="absolute bottom-6 left-0 right-0 flex justify-center z-30 pointer-events-none opacity-50 hover:opacity-100 transition-opacity duration-300"
      variants={hudEnter(reducedMotion)}
      initial="hidden"
      animate="visible"
    >
      <div
        className="flex flex-row items-center gap-1 rounded-2xl p-1.5 pointer-events-auto"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <CtrlBtn label="Zoom in" onClick={zoomIn}><ZoomIn /></CtrlBtn>
        <CtrlBtn label="Zoom out" onClick={zoomOut}><ZoomOut /></CtrlBtn>

        <Divider />

        <CtrlBtn label="Reset to center" onClick={resetCenter}><Center /></CtrlBtn>
        <CtrlBtn label="Fit all nodes" onClick={fitAll}><FitAll /></CtrlBtn>
        <CtrlBtn
          label={allExpanded ? 'Collapse nodes' : 'Expand all nodes'}
          onClick={() => {
            if (allExpanded) {
              useGraphStore.getState().collapseAll();
            } else {
              useGraphStore.getState().expandAll();
              // Close any open detail card and deactivate selection.
              useHudStore.getState().setDetailOpen(false);
              useHudStore.getState().setDetailMinimized(false);
              useGraphStore.getState().deactivate();
              useCinemaStore.getState().returnToAmbient();
              // Pull back so all newly-visible nodes fit in view.
              cameraSignals.fitRequested = true;
            }
          }}
          active={allExpanded}
        >
          <ExpandAllIcon />
        </CtrlBtn>

        <Divider />

        <CtrlBtn label={isMuted ? 'Unmute' : 'Mute'} onClick={() => setMuted(!isMuted)} active={isMuted}>
          {isMuted ? <SpeakerOff /> : <SpeakerOn />}
        </CtrlBtn>

        <Divider />

        <CtrlBtn label="Command palette (⌘K)" onClick={openCommandPalette}>
          <CmdIcon />
        </CtrlBtn>
      </div>
    </motion.div>
  );
}

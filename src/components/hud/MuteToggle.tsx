'use client';

/**
 * MuteToggle — small speaker / speaker-off button bound to `useAudioStore`.
 *
 * Intended to live inside the top-right cluster of CornerHUD (desktop)
 * or inside CornerHUD's mobile hamburger menu. Shares its styling with
 * the other round icon buttons via `HUD_BUTTON_CLASS`.
 *
 * Accessibility:
 *   - `aria-label` reflects the action, not the current state
 *   - `aria-pressed` communicates the toggle state to screen readers
 */

import { motion } from 'framer-motion';
import { useAudioStore } from '@/store/useAudioStore';
import { EASE_EXPO } from '@/lib/neural-motion';

// ---------------------------------------------------------------------------
// Icons (inline feather-style SVGs)
// ---------------------------------------------------------------------------

function SpeakerOnIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Shared HUD icon-button styling
// ---------------------------------------------------------------------------

/** Class string shared by every round icon button in CornerHUD (mute,
 *  tour, quick-view). Keeps their size/affordance consistent. */
export const HUD_BUTTON_CLASS =
  'relative inline-flex h-9 w-9 items-center justify-center rounded-full ' +
  'border border-white/10 bg-white/[0.03] backdrop-blur-md ' +
  'text-white/75 transition-colors duration-200 ' +
  'hover:text-white hover:border-[color:var(--synapse)]/40 ' +
  'hover:bg-[color:var(--synapse)]/10 hover:shadow-[0_0_18px_rgba(124,211,255,0.22)] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-[color:var(--synapse)]';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface MuteToggleProps {
  className?: string;
}

export default function MuteToggle({ className }: MuteToggleProps) {
  const isMuted = useAudioStore((s) => s.isMuted);
  const setMuted = useAudioStore((s) => s.setMuted);

  return (
    <motion.button
      type="button"
      onClick={() => setMuted(!isMuted)}
      aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
      aria-pressed={!isMuted}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      transition={{ duration: 0.18, ease: EASE_EXPO }}
      className={`${HUD_BUTTON_CLASS}${className ? ` ${className}` : ''}`}
    >
      {isMuted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
    </motion.button>
  );
}

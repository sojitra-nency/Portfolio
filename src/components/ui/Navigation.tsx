'use client';

import { motion } from 'framer-motion';
import { useNetworkStore } from '@/store/useNetworkStore';
import { useUIStore } from '@/store/useUIStore';

export default function Navigation() {
  const resetView = useNetworkStore((s) => s.resetView);
  const isGuidedMode = useUIStore((s) => s.isGuidedMode);
  const setGuidedMode = useUIStore((s) => s.setGuidedMode);

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 2.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-40"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <button
            onClick={resetView}
            className="flex items-center gap-2.5 group"
          >
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFD700] group-hover:shadow-[0_0_12px_#FFD700] transition-shadow duration-300" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-[#FFD700] animate-ping opacity-20" />
            </div>
            <span className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors duration-200 font-display tracking-wide">
              Neural Nexus
            </span>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Guided Tour */}
            <button
              onClick={() => setGuidedMode(!isGuidedMode)}
              className={`
                px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                ${isGuidedMode
                  ? 'bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/25 shadow-[0_0_15px_rgba(255,215,0,0.1)]'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                }
              `}
            >
              {isGuidedMode ? 'Exit Tour' : 'Guided Tour'}
            </button>

            {/* Quick View */}
            <a
              href="/quick-view"
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-200"
            >
              Quick View
            </a>

            {/* Reset */}
            <button
              onClick={resetView}
              className="p-2 rounded-lg bg-white/[0.04] text-gray-500 hover:text-white hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-200"
              aria-label="Reset view"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1.5v3m0 0L5 2.5m2 2L9 2.5M7 12.5v-3m0 0l-2 2m2-2l2 2M1.5 7h3m0 0L2.5 5m2 2L2.5 9M12.5 7h-3m0 0l2-2m-2 2l2 2"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

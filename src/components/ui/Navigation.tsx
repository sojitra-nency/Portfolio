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
      transition={{ delay: 2, duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-40 px-6 py-4"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <button
          onClick={resetView}
          className="flex items-center gap-2 group"
        >
          <div className="w-2 h-2 rounded-full bg-[#FFD700] group-hover:shadow-[0_0_10px_#FFD700] transition-shadow" />
          <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors font-display">
            Neural Nexus
          </span>
        </button>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Guided Tour */}
          <button
            onClick={() => setGuidedMode(!isGuidedMode)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${isGuidedMode
                ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
              }
            `}
          >
            {isGuidedMode ? 'Exit Tour' : 'Guided Tour'}
          </button>

          {/* Quick View */}
          <a
            href="/quick-view"
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all"
          >
            Quick View
          </a>

          {/* Reset */}
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all"
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
    </motion.nav>
  );
}

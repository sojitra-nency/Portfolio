'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useExplorationStore } from '@/store/useExplorationStore';

export default function ProgressTracker() {
  const explorationPercent = useExplorationStore((s) => s.explorationPercent);
  const visitedCount = useExplorationStore((s) => s.visitedNodes.size);

  if (visitedCount === 0) return null;

  const getMessage = () => {
    if (explorationPercent >= 100) return 'Full neural map unlocked';
    if (explorationPercent >= 75) return 'Deep connections forming...';
    if (explorationPercent >= 50) return 'Neural network growing...';
    if (explorationPercent >= 25) return 'Synapses forming...';
    return 'Exploring pathways...';
  };

  const circumference = 2 * Math.PI * 16;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="fixed bottom-6 left-6 z-40"
    >
      <div className="bg-[#0e0e1a]/80 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/[0.05]">
        <div className="flex items-center gap-3">
          {/* Progress ring */}
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
              <circle
                cx="20" cy="20" r="16"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="2.5"
                fill="none"
              />
              <circle
                cx="20" cy="20" r="16"
                stroke="url(#progressGradient)"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray={`${(explorationPercent / 100) * circumference} ${circumference}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#FF00E5" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white tabular-nums">
              {explorationPercent}%
            </span>
          </div>

          <div>
            <p className="text-xs font-medium text-white/80">{getMessage()}</p>
            <p className="text-[10px] text-gray-500">{visitedCount} neurons explored</p>
          </div>
        </div>
      </div>

      {/* Milestone flash */}
      <AnimatePresence>
        {[25, 50, 75, 100].includes(explorationPercent) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="absolute -top-10 left-0 right-0 text-center"
          >
            <span className="text-[11px] font-medium text-[#FFD700] bg-[#FFD700]/10 px-3 py-1 rounded-full border border-[#FFD700]/20">
              Milestone reached!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

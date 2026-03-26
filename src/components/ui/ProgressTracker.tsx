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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 left-6 z-40"
    >
      <div className="bg-[#12121F]/80 backdrop-blur-md rounded-xl px-4 py-3 border border-white/5">
        <div className="flex items-center gap-3">
          {/* Progress ring */}
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
              <circle
                cx="20" cy="20" r="16"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="20" cy="20" r="16"
                stroke="#FFD700"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${(explorationPercent / 100) * 100.53} 100.53`}
                strokeDashoffset="0"
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
              {explorationPercent}%
            </span>
          </div>

          <div>
            <p className="text-xs font-medium text-white">{getMessage()}</p>
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
            <span className="text-xs font-medium text-[#FFD700] bg-[#FFD700]/10 px-3 py-1 rounded-full">
              Milestone reached!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/useUIStore';
import { useNetworkStore } from '@/store/useNetworkStore';

export default function IntroHint() {
  const [visible, setVisible] = useState(false);
  const isIntroComplete = useUIStore((s) => s.isIntroComplete);
  const activeNodeId = useNetworkStore((s) => s.activeNodeId);

  useEffect(() => {
    if (!isIntroComplete) return;
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [isIntroComplete]);

  useEffect(() => {
    if (activeNodeId) setVisible(false);
  }, [activeNodeId]);

  // Auto-hide after 6 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed bottom-1/4 left-1/2 -translate-x-1/2 z-30"
        >
          <div className="bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10">
            <p className="text-sm text-gray-300">
              <span className="text-[#FFD700]">Click a neuron</span> to explore
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/useUIStore';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'done'>('loading');
  const completeIntro = useUIStore((s) => s.completeIntro);
  const isIntroComplete = useUIStore((s) => s.isIntroComplete);

  useEffect(() => {
    if (isIntroComplete) {
      setPhase('done');
      return;
    }

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setPhase('ready');
          return 100;
        }
        return p + Math.random() * 15 + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isIntroComplete]);

  useEffect(() => {
    if (phase === 'ready') {
      const timer = setTimeout(() => {
        setPhase('done');
        completeIntro();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [phase, completeIntro]);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="loading-screen"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[100] bg-[#0A0A1A] flex flex-col items-center justify-center"
        >
          {/* Neural pulse animation */}
          <div className="relative mb-8">
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 w-16 h-16 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)',
                transform: 'translate(-50%, -50%)',
                left: '50%',
                top: '50%',
              }}
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-full border border-[#FFD700]/20"
              style={{
                borderTopColor: '#FFD700',
              }}
            />
          </div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white mb-2 font-display"
          >
            Neural Nexus
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-gray-500 mb-6"
          >
            Initializing neural pathways...
          </motion.p>

          {/* Progress bar */}
          <div className="w-48 h-0.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FFD700] to-[#FF00E5] rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <p className="text-[10px] text-gray-600 mt-3 font-mono">
            {Math.min(Math.round(progress), 100)}%
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/useUIStore';

const MESSAGES = [
  'Initializing neural pathways...',
  'Mapping synaptic connections...',
  'Activating knowledge clusters...',
  'Calibrating exploration engine...',
];

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'done'>('loading');
  const completeIntro = useUIStore((s) => s.completeIntro);
  const isIntroComplete = useUIStore((s) => s.isIntroComplete);

  useEffect(() => {
    if (isIntroComplete) {
      setPhase('done');
      return;
    }

    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 12 + 4;
        if (next >= 100) {
          clearInterval(interval);
          setPhase('ready');
          return 100;
        }
        // Cycle messages at 25% intervals
        const msgIdx = Math.min(Math.floor(next / 25), MESSAGES.length - 1);
        setMessageIndex(msgIdx);
        return next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isIntroComplete]);

  useEffect(() => {
    if (phase === 'ready') {
      const timer = setTimeout(() => {
        setPhase('done');
        completeIntro();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [phase, completeIntro]);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="loading-screen"
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] bg-[#0A0A1A] flex flex-col items-center justify-center"
        >
          {/* Layered pulse rings */}
          <div className="relative w-24 h-24 mb-10">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 2.5, 1],
                  opacity: [0.15, 0, 0.15],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.8,
                  ease: 'easeOut',
                }}
                className="absolute inset-0 rounded-full border border-[#FFD700]/20"
              />
            ))}
            {/* Core pulse */}
            <motion.div
              animate={{
                scale: [0.8, 1, 0.8],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 m-auto w-10 h-10 rounded-full"
              style={{
                background: 'radial-gradient(circle, #FFD700 0%, rgba(255,215,0,0.3) 50%, transparent 70%)',
              }}
            />
            {/* Spinning ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-2 rounded-full border border-transparent"
              style={{
                borderTopColor: '#FFD700',
                borderRightColor: 'rgba(255,0,229,0.3)',
              }}
            />
          </div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-white mb-2 font-display tracking-tight"
          >
            Neural Nexus
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.4 }}
            className="text-xs text-gray-400 mb-8 font-mono h-4"
          >
            {MESSAGES[messageIndex]}
          </motion.p>

          {/* Progress bar */}
          <div className="w-56 h-[3px] bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: 'linear-gradient(90deg, #FFD700, #FF00E5, #4D7CFF)',
              }}
              transition={{ duration: 0.2 }}
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 0.5 }}
            className="text-[10px] text-gray-600 mt-3 font-mono tabular-nums"
          >
            {Math.min(Math.round(progress), 100)}%
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

import { motion } from 'framer-motion';
import { fadeInUp, viewportConfig } from '@/lib/animations';

const TECH = ['Next.js', 'React Three Fiber', 'TypeScript'];

export default function FooterSection() {
  return (
    <motion.footer
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportConfig}
      className="relative border-t border-white/[0.04]"
    >
      {/* Animated top gradient separator — slow shimmer across the seam */}
      <div className="relative h-px w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FFD700]/20 to-transparent" />
        <motion.div
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#FFD700]/60 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '350%' }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'linear',
            repeatDelay: 2,
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-10 px-6">
        {/* Left: Logo with pulsing dot */}
        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-[#FFD700]"
              animate={{ scale: [1, 2.2, 2.2], opacity: [0.4, 0, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
            />
            <div className="relative w-2 h-2 rounded-full bg-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.6)]" />
          </div>
          <span className="text-xs text-gray-400 font-[var(--font-syne)] tracking-wide">
            Neural Nexus
          </span>
        </div>

        {/* Right: Built with — hover lifts each tech name */}
        <p className="text-xs text-gray-400 flex items-center gap-1 flex-wrap justify-center">
          <span>Built with</span>
          {TECH.map((name, i) => (
            <span key={name} className="inline-flex items-center gap-1">
              <motion.span
                whileHover={{ y: -2, color: '#FFD700' }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="cursor-default text-gray-300 hover:text-[#FFD700] transition-colors"
              >
                {name}
              </motion.span>
              {i < TECH.length - 1 && (
                <span className="text-gray-600">
                  {i === TECH.length - 2 ? '&' : ','}
                </span>
              )}
            </span>
          ))}
        </p>
      </div>
    </motion.footer>
  );
}

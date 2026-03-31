'use client';

import { motion } from 'framer-motion';
import { fadeInUp, viewportConfig } from '@/lib/animations';

export default function FooterSection() {
  return (
    <motion.footer
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportConfig}
      className="border-t border-white/[0.04]"
    >
      {/* Top gradient separator */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#FFD700]/20 to-transparent" />

      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-10 px-6">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#FFD700]/40" />
          <span className="text-xs text-gray-600 font-[var(--font-syne)]">Neural Nexus</span>
        </div>

        {/* Right: Built with */}
        <p className="text-xs text-gray-600">
          Built with Next.js, React Three Fiber & TypeScript
        </p>
      </div>
    </motion.footer>
  );
}

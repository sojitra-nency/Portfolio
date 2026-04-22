'use client';

import { motion } from 'framer-motion';
import { headingReveal, viewportConfig } from '@/lib/animations';

interface SectionHeadingProps {
  title: string;
  subtitle: string;
  color: string;
}

export default function SectionHeading({ title, subtitle, color }: SectionHeadingProps) {
  return (
    <motion.div
      variants={headingReveal}
      initial="hidden"
      whileInView="visible"
      viewport={viewportConfig}
      className="mb-8"
    >
      <div className="flex items-center gap-3 mb-3">
        {/* Pulsing dot — outer halo pings, inner core stays crisp */}
        <div className="relative shrink-0">
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: color }}
            animate={{ scale: [1, 1.9, 1.9], opacity: [0.5, 0, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
          />
          <div
            className="relative w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}66` }}
          />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold font-[var(--font-syne)] tracking-tight">
          {title}
        </h2>
      </div>

      {/* Animated underline bar — reveals horizontally when heading scrolls in */}
      <motion.div
        className="h-[2px] rounded-full mb-3 origin-left"
        style={{
          width: 48,
          background: `linear-gradient(90deg, ${color}, ${color}00)`,
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      />

      <p className="text-sm text-gray-400">{subtitle}</p>
    </motion.div>
  );
}

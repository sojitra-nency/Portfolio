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
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
        />
        <h2 className="text-2xl sm:text-3xl font-bold font-[var(--font-syne)] tracking-tight">
          {title}
        </h2>
      </div>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </motion.div>
  );
}

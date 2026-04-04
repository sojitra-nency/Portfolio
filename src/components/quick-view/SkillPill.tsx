'use client';

import { motion } from 'framer-motion';
import type { SkillPillData } from './skillCloudConstants';

interface SkillPillProps {
  pill: SkillPillData;
  isActive: boolean;
  index: number;
  isMobile: boolean;
}

export default function SkillPill({
  pill,
  isActive,
  index,
  isMobile,
}: SkillPillProps) {
  const sizeClasses =
    pill.size === 'lg'
      ? isMobile
        ? 'px-3 py-1.5 text-xs'
        : 'px-4 py-2 text-sm'
      : pill.size === 'md'
        ? isMobile
          ? 'px-2.5 py-1 text-[11px]'
          : 'px-3 py-1.5 text-xs'
        : isMobile
          ? 'px-2 py-0.5 text-[10px]'
          : 'px-2.5 py-1 text-[11px]';

  // Each pill gets a unique float duration & delay for organic feel (#7)
  const floatDuration = 3 + (index % 5) * 0.6; // 3s–5.4s
  const floatDelay = (index % 7) * 0.4; // stagger the phase

  // Stagger delay for cascade entry (#1)
  const row = Math.floor(index / (isMobile ? 4 : 8));
  const cascadeDelay = row * 0.08 + (index % (isMobile ? 4 : 8)) * 0.03;

  return (
    <motion.span
      className={`inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap select-none cursor-default ${sizeClasses}`}
      style={{
        minWidth: isMobile ? 40 : 48,
        // CSS custom property for the glow keyframe (#2)
        '--pill-glow': `${pill.color}40`,
        color: pill.color,
        backgroundColor: `${pill.color}10`,
        border: `1px solid ${pill.color}30`,
        boxShadow: isActive
          ? `0 0 12px ${pill.color}20, 0 0 4px ${pill.color}10`
          : 'none',
        // Floating idle animation (#7) — only when active
        animation: isActive
          ? `skill-float ${floatDuration}s ease-in-out ${floatDelay}s infinite`
          : 'none',
      } as React.CSSProperties}
      // Cascade entry (#1) — drops in from above with spring bounce
      initial={{ opacity: 0, scale: 0.3, y: -30 }}
      animate={{
        opacity: isActive ? 1 : 0.12,
        scale: isActive ? 1 : 0.8,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.3,
        y: 10,
        transition: { duration: 0.2, ease: 'easeIn' },
      }}
      transition={{
        opacity: { duration: 0.35, ease: 'easeOut', delay: cascadeDelay },
        scale: {
          type: 'spring',
          stiffness: 350,
          damping: 20,
          delay: cascadeDelay,
        },
        y: {
          type: 'spring',
          stiffness: 300,
          damping: 18,
          delay: cascadeDelay,
        },
      }}
      // Glow pulse on hover (#2)
      whileHover={
        isActive
          ? {
              scale: 1.12,
              boxShadow: `0 0 20px ${pill.color}50, 0 0 40px ${pill.color}30, 0 0 6px ${pill.color}40`,
              transition: { duration: 0.2 },
            }
          : undefined
      }
      whileTap={isActive ? { scale: 0.95 } : undefined}
      layout
    >
      {pill.label}
    </motion.span>
  );
}

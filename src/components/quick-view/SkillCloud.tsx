'use client';

import { useRef } from 'react';
import { useInView, AnimatePresence, motion } from 'framer-motion';
import SkillPill from './SkillPill';
import type { SkillPillData } from './skillCloudConstants';

interface SkillCloudProps {
  pills: SkillPillData[];
  activeCategory: string | null;
  isMobile: boolean;
  reducedMotion: boolean;
}

export default function SkillCloud({
  pills,
  activeCategory,
  isMobile,
  reducedMotion,
}: SkillCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, {
    once: true,
    amount: 0.15,
    margin: '-50px',
  });

  // Separate active and inactive pills for ordering —
  // active pills render first (top), inactive after (fade behind)
  const activePills = pills.filter(
    (p) => activeCategory === null || p.categoryId === activeCategory,
  );
  const inactivePills = pills.filter(
    (p) => activeCategory !== null && p.categoryId !== activeCategory,
  );
  const orderedPills = [...activePills, ...inactivePills];

  return (
    <motion.div
      ref={containerRef}
      className="flex flex-wrap items-center justify-center gap-2 md:gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.01] px-4 py-6 md:px-8 md:py-10"
      // Layout animation on the container so it resizes smoothly (#4)
      layout
      transition={{ layout: { duration: 0.4, ease: 'easeInOut' } }}
    >
      {/* AnimatePresence for smooth filter morph (#4) */}
      <AnimatePresence mode="popLayout">
        {isInView &&
          orderedPills.map((pill, i) => {
            const isActive =
              activeCategory === null || pill.categoryId === activeCategory;
            return (
              <SkillPill
                key={pill.id}
                pill={pill}
                isActive={isActive}
                index={reducedMotion ? 0 : i}
                isMobile={isMobile}
              />
            );
          })}
      </AnimatePresence>
    </motion.div>
  );
}

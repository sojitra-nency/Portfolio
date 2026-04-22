'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  fadeInUp,
  staggerContainer,
  viewportConfig,
  tagReveal,
  cardLift,
  iconPop,
  useCountUp,
} from '@/lib/animations';
import SectionHeading from '@/components/quick-view/SectionHeading';
import type { NeuralNode } from '@/data/types';

const ACCENT = '#FF8C00';

interface EducationSectionProps {
  nodes: NeuralNode[];
  color: string;
  subtitle: string;
}

// Graduation-cap icon — reacts to the parent card's hover state via iconPop.
function GradCapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 10L12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5a6 6 0 0012 0v-5" />
    </svg>
  );
}

// Count-up display — gated to viewport entry so the number doesn't animate
// before the card is visible.
function AnimatedNumber({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.4, margin: '-20px' });

  const numeric = parseFloat(value);
  const isValid = !Number.isNaN(numeric);
  const decimals = isValid && value.includes('.')
    ? value.split('.')[1]?.length ?? 0
    : 0;

  const count = useCountUp(inView && isValid ? numeric : 0, 1600, decimals);

  if (!isValid) {
    return <span ref={ref}>{value}</span>;
  }

  return (
    <span ref={ref} className="tabular-nums">
      {count.toFixed(decimals)}
    </span>
  );
}

export default function EducationSection({
  nodes,
  color,
  subtitle,
}: EducationSectionProps) {
  return (
    <section id="education" className="scroll-mt-20">
      <SectionHeading
        title="Education"
        subtitle={subtitle}
        color={color}
      />

      <motion.div
        className="grid gap-4 sm:grid-cols-2"
        variants={staggerContainer(0.12)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        {nodes.map((node, idx) => {
          const stats = node.metadata?.stats;
          const tags = node.metadata?.tags;
          const prominentKey = stats
            ? Object.keys(stats).find((k) => k === 'CGPA' || k === 'PR')
            : undefined;
          const prominentValue = prominentKey ? stats![prominentKey] : undefined;

          return (
            <motion.div key={node.id} variants={fadeInUp} className="group block">
              {/* Hover container — cardLift drives lift; iconPop children react. */}
              <motion.div
                variants={cardLift}
                initial="rest"
                animate="rest"
                whileHover="hover"
                className="relative overflow-hidden bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 transition-colors duration-300 group-hover:bg-white/[0.04] group-hover:border-white/[0.12] will-change-transform"
              >
                {/* Animated top accent — scales in on scroll, glows on hover */}
                <motion.div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[2px] origin-left"
                  style={{
                    background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT}00)`,
                  }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={viewportConfig}
                  transition={{
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.15 + idx * 0.12,
                  }}
                />

                {/* Orange glow ring — fades in on hover (consistent with Contact/Certs) */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    boxShadow: `0 0 0 1px ${ACCENT}33, 0 14px 40px -14px ${ACCENT}40`,
                  }}
                />

                {/* Subtle radial wash — concentrates warmth in the top-left */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl"
                  style={{ background: `${ACCENT}14` }}
                />

                <div className="relative flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    {stats?.Duration && (
                      <div className="inline-flex items-center gap-1.5 mb-2">
                        <span
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: `${ACCENT}` }}
                        />
                        <p className="font-[var(--font-mono)] text-[10px] text-gray-400 uppercase tracking-[0.08em]">
                          {stats.Duration}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <motion.span
                        variants={iconPop}
                        className="inline-flex shrink-0 text-[#FF8C00]"
                      >
                        <GradCapIcon />
                      </motion.span>
                      <h3 className="text-[15px] font-semibold text-[#FF8C00] leading-tight">
                        {node.label}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{node.summary}</p>
                  </div>

                  {prominentValue && (
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                        {prominentKey}
                      </p>
                      <motion.p
                        variants={iconPop}
                        className="text-3xl font-bold text-[#FF8C00] tabular-nums leading-none mt-1"
                        style={{
                          textShadow: `0 0 24px ${ACCENT}30`,
                        }}
                      >
                        <AnimatedNumber value={prominentValue} />
                      </motion.p>
                    </div>
                  )}
                </div>

                <p className="relative text-[13px] text-gray-400 leading-relaxed mb-3">
                  {node.description}
                </p>

                {tags && tags.length > 0 && (
                  <motion.div
                    className="relative flex flex-wrap gap-1.5"
                    variants={staggerContainer(0.05)}
                  >
                    {tags.map((tag) => (
                      <motion.span
                        key={tag}
                        variants={tagReveal}
                        whileHover={{ y: -2, scale: 1.05 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="px-2 py-0.5 text-[10px] rounded-md font-medium text-[#FF8C00] bg-[#FF8C00]/[0.08] border border-[#FF8C00]/20 cursor-default"
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

'use client';

import { motion } from 'framer-motion';
import {
  fadeInUp,
  staggerContainer,
  viewportConfig,
  tagReveal,
} from '@/lib/animations';
import SectionHeading from '@/components/quick-view/SectionHeading';
import type { NeuralNode } from '@/data/types';

interface EducationSectionProps {
  nodes: NeuralNode[];
  color: string;
  subtitle: string;
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
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        {nodes.map((node) => {
          const stats = node.metadata?.stats;
          const tags = node.metadata?.tags;
          // Extract the prominent value (CGPA or PR)
          const prominentKey = stats
            ? Object.keys(stats).find(
                (k) => k === 'CGPA' || k === 'PR',
              )
            : undefined;
          const prominentValue = prominentKey
            ? stats![prominentKey]
            : undefined;

          return (
            <motion.div
              key={node.id}
              variants={fadeInUp}
              className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 hover:border-white/[0.1] hover:bg-white/[0.03] transition-all duration-300 border-t-2 border-t-[#FF8C00]"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  {stats?.Duration && (
                    <p className="font-[var(--font-mono)] text-[10px] text-gray-600 uppercase mb-1.5">
                      {stats.Duration}
                    </p>
                  )}
                  <h3 className="text-[15px] font-semibold text-[#FF8C00]">
                    {node.label}
                  </h3>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {node.summary}
                  </p>
                </div>
                {prominentValue && (
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-gray-600 uppercase">
                      {prominentKey}
                    </p>
                    <p className="text-3xl font-bold text-[#FF8C00]">
                      {prominentValue}
                    </p>
                  </div>
                )}
              </div>

              <p className="text-[13px] text-gray-400 leading-relaxed mb-3">
                {node.description}
              </p>

              {tags && tags.length > 0 && (
                <motion.div
                  className="flex flex-wrap gap-1.5"
                  variants={staggerContainer(0.05)}
                >
                  {tags.map((tag) => (
                    <motion.span
                      key={tag}
                      variants={tagReveal}
                      className="px-2 py-0.5 text-[10px] rounded-md font-medium text-[#FF8C00]/75 bg-[#FF8C00]/[0.06] border border-[#FF8C00]/[0.12]"
                    >
                      {tag}
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

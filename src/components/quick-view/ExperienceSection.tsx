'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  fadeInUp,
  staggerContainer,
  viewportConfig,
  tagReveal,
} from '@/lib/animations';
import SectionHeading from '@/components/quick-view/SectionHeading';
import type { NeuralNode } from '@/data/types';

interface ExperienceSectionProps {
  nodes: NeuralNode[];
  color: string;
  subtitle: string;
}

export default function ExperienceSection({
  nodes,
  color,
  subtitle,
}: ExperienceSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const spineScaleY = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <section id="experience" className="scroll-mt-20" ref={sectionRef}>
      <SectionHeading
        title="Experience"
        subtitle={subtitle}
        color={color}
      />

      <motion.div
        className="relative space-y-6"
        variants={staggerContainer(0.15)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        {/* Animated timeline spine */}
        <motion.div
          className="absolute left-[5px] top-4 bottom-4 w-[2px] origin-top hidden sm:block"
          style={{
            scaleY: spineScaleY,
            background: 'linear-gradient(to bottom, #00FF88, transparent)',
          }}
        />

        {nodes.map((node, index) => {
          const isFirst = index === 0;
          const stats = node.metadata?.stats;
          const tags = node.metadata?.tags;

          return (
            <motion.div
              key={node.id}
              className="relative sm:pl-10"
              variants={fadeInUp}
            >
              {/* Timeline dot */}
              <div className="absolute left-0 top-6 hidden sm:flex items-center justify-center">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: '#00FF88' }}
                />
                {isFirst && (
                  <div className="absolute w-3 h-3 rounded-full bg-[#00FF88] animate-ping" />
                )}
              </div>

              {/* Card */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 hover:border-white/[0.1] hover:bg-white/[0.03] transition-all duration-300 border-t-2 border-t-[#00FF88]">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[#00FF88]">
                      {node.label}
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {node.summary}
                    </p>
                  </div>
                  {stats && (
                    <div className="flex gap-4 shrink-0">
                      {Object.entries(stats).map(([key, value]) => (
                        <div key={key} className="sm:text-right">
                          <p className="font-[var(--font-mono)] text-[10px] text-gray-600 uppercase">
                            {key}
                          </p>
                          <p className="font-[var(--font-mono)] text-[10px] text-gray-600 uppercase flex items-center gap-1.5">
                            {key === 'Duration' && isFirst && value.includes('Present') ? (
                              <>
                                {value.replace('Present', '').trim()}{' '}
                                <span className="inline-flex items-center gap-1">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF88]" />
                                  </span>
                                  Present
                                </span>
                              </>
                            ) : (
                              value
                            )}
                          </p>
                        </div>
                      ))}
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
                        className="px-2 py-0.5 text-[10px] rounded-md font-medium text-[#00FF88]/75 bg-[#00FF88]/[0.06] border border-[#00FF88]/[0.12]"
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

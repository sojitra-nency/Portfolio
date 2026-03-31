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

interface SkillsSectionProps {
  nodes: NeuralNode[];
  allTools: NeuralNode[];
  color: string;
  subtitle: string;
}

const TOOLS_COLOR = '#A855F7';

export default function SkillsSection({ nodes, allTools, color, subtitle }: SkillsSectionProps) {
  return (
    <section id="skills" className="scroll-mt-20">
      <SectionHeading title="Skills" subtitle={subtitle} color={color} />

      {/* Skill cards grid */}
      <motion.div
        className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3"
        variants={staggerContainer(0.08)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            variants={fadeInUp}
            className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 hover:border-white/10 hover:bg-white/[0.03] transition-all duration-300"
            style={{
              borderLeft: `3px solid ${color}`,
            }}
          >
            {/* Title */}
            <h3
              className="text-[15px] font-semibold mb-1"
              style={{ color }}
            >
              {node.label}
            </h3>

            {/* Summary */}
            <p className="text-[11px] text-gray-600 mb-3">
              {node.summary}
            </p>

            {/* Description */}
            <p className="text-[13px] text-gray-400 leading-relaxed mb-3">
              {node.description}
            </p>

            {/* Tags */}
            {node.metadata?.tags && (
              <motion.div
                className="flex flex-wrap gap-1.5"
                variants={staggerContainer(0.04)}
                initial="hidden"
                whileInView="visible"
                viewport={viewportConfig}
              >
                {node.metadata.tags.map((tag) => (
                  <motion.span
                    key={tag}
                    variants={tagReveal}
                    className="px-2 py-0.5 text-[10px] rounded-md font-medium"
                    style={{
                      color: `${color}bb`,
                      backgroundColor: `${color}08`,
                      border: `1px solid ${color}15`,
                    }}
                  >
                    {tag}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* All Tools & Technologies */}
      {allTools.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-[0.1em] mb-4">
            All Tools & Technologies
          </h3>
          <motion.div
            className="flex flex-wrap gap-2"
            variants={staggerContainer(0.03)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            {allTools.map((tool) => (
              <motion.span
                key={tool.id}
                variants={tagReveal}
                className="px-3 py-1.5 text-xs rounded-lg font-medium"
                style={{
                  color: TOOLS_COLOR,
                  backgroundColor: `${TOOLS_COLOR}08`,
                  border: `1px solid ${TOOLS_COLOR}18`,
                }}
              >
                {tool.label}
              </motion.span>
            ))}
          </motion.div>
        </div>
      )}
    </section>
  );
}

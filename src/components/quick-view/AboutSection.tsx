'use client';

import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, viewportConfig } from '@/lib/animations';
import SectionHeading from '@/components/quick-view/SectionHeading';
import type { NeuralNode } from '@/data/types';

interface AboutSectionProps {
  nodes: NeuralNode[];
  color: string;
  subtitle: string;
}

const CARD_ICONS = [
  // Terminal / code brackets
  <svg key="terminal" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>,
  // Lightbulb
  <svg key="lightbulb" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
  </svg>,
  // Compass
  <svg key="compass" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>,
];

export default function AboutSection({ nodes, color, subtitle }: AboutSectionProps) {
  return (
    <section id="about" className="scroll-mt-20">
      <SectionHeading title="About Me" subtitle={subtitle} color={color} />

      <motion.div
        className="grid gap-4 sm:grid-cols-3"
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        {nodes.map((node, i) => (
          <motion.div
            key={node.id}
            variants={fadeInUp}
            className="group bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:border-white/10 hover:-translate-y-1"
            style={{
              borderTop: `2px solid ${color}`,
            }}
            whileHover={{
              boxShadow: `0 4px 30px ${color}15`,
            }}
          >
            {/* Icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{
                color,
                backgroundColor: `${color}10`,
                border: `1px solid ${color}15`,
              }}
            >
              {CARD_ICONS[i] ?? CARD_ICONS[0]}
            </div>

            {/* Title */}
            <h3
              className="text-[15px] font-semibold mb-2"
              style={{ color }}
            >
              {node.label}
            </h3>

            {/* Summary */}
            <p className="text-[11px] text-gray-600 mb-2">
              {node.summary}
            </p>

            {/* Description */}
            <p className="text-[13px] text-gray-400 leading-relaxed">
              {node.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

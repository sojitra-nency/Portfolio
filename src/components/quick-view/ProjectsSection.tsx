'use client';

import { motion } from 'framer-motion';
import {
  fadeInUp,
  scaleIn,
  staggerContainer,
  viewportConfig,
  cardHover,
  tagReveal,
} from '@/lib/animations';
import SectionHeading from '@/components/quick-view/SectionHeading';
import type { NeuralNode } from '@/data/types';

interface ProjectsSectionProps {
  nodes: NeuralNode[];
  color: string;
  subtitle: string;
}

const FEATURED_IDS = ['proj-rooflink', 'proj-futureforce', 'proj-fixmytext', 'proj-moodsense'];
const ACCENT = '#4D7CFF';

function GitHubLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium hover:brightness-125 transition-all"
      style={{
        color: ACCENT,
        backgroundColor: 'rgba(77,124,255,0.1)',
        border: '1px solid rgba(77,124,255,0.2)',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
      Source
    </a>
  );
}

function FeaturedCard({ node }: { node: NeuralNode }) {
  const tags = node.metadata?.tags ?? [];
  const stats = node.metadata?.stats ?? {};

  return (
    <motion.div
      variants={fadeInUp}
      initial="rest"
      whileHover="hover"
      className="group"
    >
      <motion.div
        variants={cardHover}
        className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 sm:p-8 transition-shadow duration-300"
        style={{
          borderLeft: `4px solid ${ACCENT}`,
        }}
        whileHover={{
          boxShadow: '0 4px 30px rgba(77,124,255,0.12)',
        }}
      >
        {/* Top row: Type badge + GitHub link */}
        <div className="flex items-center justify-between mb-3">
          {stats.Type && (
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
              style={{
                color: ACCENT,
                backgroundColor: 'rgba(77,124,255,0.1)',
                border: '1px solid rgba(77,124,255,0.15)',
              }}
            >
              {stats.Type}
            </span>
          )}
          {node.metadata?.url && <GitHubLink url={node.metadata.url} />}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold" style={{ color: ACCENT }}>
          {node.label}
        </h3>

        {/* Summary */}
        <p className="text-xs text-gray-500 mt-0.5">{node.summary}</p>

        {/* Description */}
        <p className="text-[13px] text-gray-400 leading-relaxed mb-4 mt-2 line-clamp-3">
          {node.description}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <motion.div
            className="flex flex-wrap gap-1.5 mb-3"
            variants={staggerContainer(0.04, 0)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            {tags.map((tag) => (
              <motion.span
                key={tag}
                variants={tagReveal}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  color: ACCENT,
                  backgroundColor: 'rgba(77,124,255,0.08)',
                  border: '1px solid rgba(77,124,255,0.12)',
                }}
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>
        )}

        {/* Role stat */}
        {stats.Role && (
          <span
            className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-md text-gray-400"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {stats.Role}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}

function CompactCard({ node }: { node: NeuralNode }) {
  const tags = node.metadata?.tags ?? [];

  return (
    <motion.div
      variants={scaleIn}
      initial="rest"
      whileHover="hover"
      className="group"
    >
      <motion.div
        variants={cardHover}
        className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 h-full transition-shadow duration-300"
        whileHover={{
          boxShadow: '0 4px 20px rgba(77,124,255,0.08)',
        }}
      >
        {/* Title + GitHub link */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-[15px] font-semibold" style={{ color: ACCENT }}>
            {node.label}
          </h3>
          {node.metadata?.url && (
            <a
              href={node.metadata.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-1.5 rounded-md hover:brightness-125 transition-all"
              style={{
                color: ACCENT,
                backgroundColor: 'rgba(77,124,255,0.1)',
                border: '1px solid rgba(77,124,255,0.2)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </a>
          )}
        </div>

        {/* Summary */}
        <p className="text-xs text-gray-500 mb-3">{node.summary}</p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  color: ACCENT,
                  backgroundColor: 'rgba(77,124,255,0.08)',
                  border: '1px solid rgba(77,124,255,0.1)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function ProjectsSection({ nodes, color, subtitle }: ProjectsSectionProps) {
  const featured = FEATURED_IDS
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is NeuralNode => !!n);

  const others = nodes.filter(
    (n) => !FEATURED_IDS.includes(n.id) && n.id !== 'projects',
  );

  return (
    <section id="projects" className="scroll-mt-20 space-y-8">
      <SectionHeading title="Projects" subtitle={subtitle} color={color} />

      {/* Featured Projects */}
      <motion.p
        className="text-xs font-semibold text-gray-500 uppercase tracking-[0.1em] mb-4"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        Featured
      </motion.p>

      <motion.div
        className="flex flex-col gap-4"
        variants={staggerContainer(0.12)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        {featured.map((node) => (
          <FeaturedCard key={node.id} node={node} />
        ))}
      </motion.div>

      {/* Other Projects */}
      {others.length > 0 && (
        <>
          <motion.p
            className="text-xs font-semibold text-gray-500 uppercase tracking-[0.1em] mb-4 mt-8"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            More Projects
          </motion.p>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            variants={staggerContainer(0.06)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            {others.map((node) => (
              <CompactCard key={node.id} node={node} />
            ))}
          </motion.div>
        </>
      )}
    </section>
  );
}

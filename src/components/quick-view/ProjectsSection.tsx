'use client';

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import {
  staggerContainer,
  viewportConfig,
  tagReveal,
} from '@/lib/animations';
import SectionHeading from '@/components/quick-view/SectionHeading';
import type { NeuralNode } from '@/data/types';

interface ProjectsSectionProps {
  nodes: NeuralNode[];
  color: string;
  subtitle: string;
}

const ACCENT = '#4D7CFF';

function GitHubLink({ url, size = 'sm' }: { url: string; size?: 'sm' | 'lg' }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 rounded-md font-medium hover:brightness-125 transition-all"
      style={{
        color: ACCENT,
        backgroundColor: 'rgba(77,124,255,0.1)',
        border: '1px solid rgba(77,124,255,0.2)',
        fontSize: size === 'lg' ? '13px' : '11px',
        padding: size === 'lg' ? '6px 14px' : '4px 12px',
      }}
    >
      <svg width={size === 'lg' ? 16 : 12} height={size === 'lg' ? 16 : 12} viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
      View Source
    </a>
  );
}

/* ─── Project Detail Modal ─── */

function ProjectModal({
  node,
  index,
  onClose,
}: {
  node: NeuralNode;
  index: number;
  onClose: () => void;
}) {
  const tags = node.metadata?.tags ?? [];
  const stats = node.metadata?.stats ?? {};
  const statEntries = Object.entries(stats);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal content */}
      <motion.div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[#0d0d1a] scrollbar-none"
        style={{
          border: `1px solid ${ACCENT}25`,
          borderTop: `2px solid ${ACCENT}60`,
          boxShadow: `0 0 40px ${ACCENT}15, 0 25px 60px rgba(0,0,0,0.5)`,
        }}
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-gray-400 hover:bg-white/[0.1] hover:text-white transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>

        {/* Header */}
        <div className="relative p-6 sm:p-8 pb-0">
          {/* Number watermark */}
          <span
            className="pointer-events-none absolute right-8 top-6 -z-0 select-none text-[80px] font-black leading-none opacity-[0.04]"
            style={{ color: ACCENT }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          {/* Top row: Type badge + GitHub link */}
          <div className="flex items-center justify-between gap-3 mb-3">
            {stats.Type && (
              <span
                className="inline-flex text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                style={{
                  color: ACCENT,
                  backgroundColor: 'rgba(77,124,255,0.1)',
                  border: '1px solid rgba(77,124,255,0.15)',
                }}
              >
                {stats.Type}
              </span>
            )}
            {node.metadata?.url && <GitHubLink url={node.metadata.url} size="sm" />}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-1" style={{ color: ACCENT }}>
            {node.label}
          </h2>

          {/* Summary */}
          <p className="text-sm text-gray-400">{node.summary}</p>

          {/* Divider */}
          <div className="mt-5 h-px bg-white/[0.06]">
            <div
              className="h-full w-20"
              style={{ background: `linear-gradient(90deg, ${ACCENT}80, transparent)` }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 pt-5 space-y-6">
          {/* Description - full, no clamp */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 mb-2">
              About
            </h4>
            <p className="text-[14px] leading-7 text-gray-300">
              {node.description}
            </p>
          </div>

          {/* Stats grid */}
          {statEntries.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 mb-3">
                Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {statEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-xl bg-white/[0.03] px-3.5 py-2.5"
                    style={{
                      border: `1px solid ${ACCENT}12`,
                    }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500 mb-0.5">
                      {key}
                    </p>
                    <p className="text-[13px] font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tech stack */}
          {tags.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 mb-3">
                Tech Stack
              </h4>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{
                      color: ACCENT,
                      backgroundColor: 'rgba(77,124,255,0.1)',
                      border: '1px solid rgba(77,124,255,0.15)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Featured Card ─── */

const featuredCardVariant = {
  hidden: { opacity: 0, y: 60, rotateX: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.15,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
};

function FeaturedCard({
  node,
  index,
  onOpen,
}: {
  node: NeuralNode;
  index: number;
  onOpen: () => void;
}) {
  const tags = node.metadata?.tags ?? [];
  const stats = node.metadata?.stats ?? {};

  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [4, -4]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-4, 4]), {
    stiffness: 200,
    damping: 20,
  });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      custom={index}
      variants={featuredCardVariant}
      className="group relative h-full cursor-pointer"
      style={{
        perspective: 800,
        animation: `skill-float 6s ease-in-out ${index * 1.5}s infinite`,
      }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onOpen}
    >
      <motion.div
        className="relative h-full overflow-hidden rounded-2xl bg-white/[0.02] p-6 sm:p-7 transition-all duration-500"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          border: `1px solid ${ACCENT}20`,
          borderTop: `2px solid ${ACCENT}50`,
          boxShadow: `0 0 15px ${ACCENT}0a, 0 4px 24px rgba(0,0,0,0.25)`,
        }}
        whileHover={{
          borderColor: `${ACCENT}38`,
          boxShadow: `0 0 20px ${ACCENT}14, 0 0 40px ${ACCENT}0a, 0 4px 24px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Shimmer sweep on hover */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${ACCENT}06 48%, ${ACCENT}0a 50%, ${ACCENT}06 52%, transparent 60%)`,
            animation: 'card-shimmer 2s ease-in-out infinite',
            transition: 'opacity 0.5s ease',
          }}
        />

        {/* Number watermark */}
        <span
          className="pointer-events-none absolute right-6 top-5 select-none text-[56px] font-black leading-none opacity-[0.06] group-hover:opacity-[0.12]"
          style={{ color: ACCENT, transition: 'opacity 0.5s ease' }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Type badge */}
        <div className="relative mb-3">
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
        </div>

        {/* Title */}
        <h3 className="relative text-lg font-semibold" style={{ color: ACCENT }}>
          {node.label}
        </h3>

        {/* Summary */}
        <p className="relative text-xs text-gray-500 mt-0.5">{node.summary}</p>

        {/* Description */}
        <p className="relative text-[13px] text-gray-400 leading-relaxed mb-4 mt-2 line-clamp-3">
          {node.description}
        </p>

        {/* Animated divider */}
        <div className="relative mb-4 h-px bg-white/[0.06]">
          <div
            className="absolute left-0 top-0 h-full w-10 group-hover:w-full"
            style={{
              background: `linear-gradient(90deg, ${ACCENT}80, transparent)`,
              transition: 'width 0.5s ease',
            }}
          />
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <motion.div
            className="relative flex flex-wrap gap-1.5 mb-3"
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

        {/* Bottom row: Role + GitHub */}
        <div className="relative flex items-center justify-between">
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
          {node.metadata?.url && <GitHubLink url={node.metadata.url} />}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Section ─── */

export default function ProjectsSection({ nodes, color, subtitle }: ProjectsSectionProps) {
  const allProjects = nodes.filter((n) => n.id !== 'projects');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleClose = useCallback(() => setSelectedIndex(null), []);

  return (
    <section id="projects" className="scroll-mt-20 space-y-8">
      <SectionHeading title="Projects" subtitle={subtitle} color={color} />

      {/* All Projects — 2-column grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
        variants={staggerContainer(0.12)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        style={{ perspective: 1000 }}
      >
        {allProjects.map((node, i) => (
          <FeaturedCard
            key={node.id}
            node={node}
            index={i}
            onOpen={() => setSelectedIndex(i)}
          />
        ))}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {selectedIndex !== null && allProjects[selectedIndex] && (
          <ProjectModal
            node={allProjects[selectedIndex]}
            index={selectedIndex}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

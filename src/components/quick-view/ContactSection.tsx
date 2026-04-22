'use client';

import { motion } from 'framer-motion';
import {
  scaleIn,
  staggerContainer,
  viewportConfig,
  fadeInUp,
  cardLift,
  iconPop,
  arrowSlide,
} from '@/lib/animations';
import type { NeuralNode } from '@/data/types';

const ACCENT = '#FFD700';

interface ContactSectionProps {
  nodes: NeuralNode[];
  color: string;
  subtitle: string;
}

const ICONS: Record<string, React.ReactNode> = {
  Email: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 4L12 13L2 4" />
    </svg>
  ),
  LinkedIn: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
    </svg>
  ),
  GitHub: (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  ),
  Phone: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  ),
};

function getLinkText(label: string): string {
  switch (label) {
    case 'Email':
      return 'Send Email';
    case 'LinkedIn':
      return 'Connect';
    case 'GitHub':
      return 'View Profile';
    case 'Phone':
      return 'Call';
    default:
      return 'Open';
  }
}

export default function ContactSection({
  nodes,
  subtitle,
}: ContactSectionProps) {
  // Find email node for primary CTA
  const emailNode = nodes.find((n) => n.id === 'contact-email');

  return (
    <section id="contact" className="scroll-mt-20">
      {/* CTA Heading */}
      <motion.div
        className="relative mb-8"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(400px circle at center, rgba(255,215,0,0.03), transparent)',
          }}
        />
        <h2 className="text-3xl sm:text-4xl font-bold font-[var(--font-syne)] text-white">
          Let&apos;s Build Something Together
        </h2>
        <p className="text-sm text-gray-400 mt-2">{subtitle}</p>
      </motion.div>

      {/* Contact Cards */}
      <motion.div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        {nodes.map((node) => {
          const url = node.metadata?.url;
          const linkText = getLinkText(node.label);

          const cardBody = (
            <motion.div
              // Nested hover state — decoupled from parent's scroll-in variants.
              variants={cardLift}
              initial="rest"
              animate="rest"
              whileHover="hover"
              className="relative bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 transition-colors duration-300 group-hover:bg-white/[0.04] group-hover:border-white/[0.12] text-center will-change-transform overflow-hidden"
            >
              {/* Gold glow ring — fades in on hover */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  boxShadow: `0 0 0 1px ${ACCENT}33, 0 14px 40px -12px ${ACCENT}40`,
                }}
              />

              {/* Subtle top-edge gradient sweep on hover */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(90deg, transparent, ${ACCENT}80, transparent)`,
                }}
              />

              <motion.div
                variants={iconPop}
                className="relative w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-3 text-white transition-colors duration-300 group-hover:text-[#FFD700] group-hover:border-[#FFD700]/30"
              >
                {ICONS[node.label] ?? null}
              </motion.div>

              <h3 className="relative text-[15px] font-semibold text-white mb-1">
                {node.label}
              </h3>
              <p className="relative text-xs text-gray-400 mb-2">{node.summary}</p>

              <motion.span
                variants={arrowSlide}
                className="relative inline-flex items-center gap-1 text-xs font-medium"
                style={{ color: ACCENT }}
              >
                {linkText}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </motion.span>
            </motion.div>
          );

          // Outer wrapper only handles scroll-in (scaleIn) and inherits
          // "hidden"/"visible" from the parent staggerContainer. Hover is
          // handled by the nested cardBody above.
          const wrapperProps = {
            variants: scaleIn,
            className: 'group block',
          };

          return url ? (
            <motion.a
              key={node.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              {...wrapperProps}
            >
              {cardBody}
            </motion.a>
          ) : (
            <motion.div key={node.id} {...wrapperProps}>
              {cardBody}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Primary CTA Button */}
      {emailNode?.metadata?.url && (
        <motion.div
          className="mt-10 text-center"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <motion.a
            href={emailNode.metadata.url}
            initial="rest"
            animate="rest"
            whileHover="hover"
            whileTap={{ scale: 0.97 }}
            className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-[#0A0A1A] overflow-hidden shadow-[0_8px_30px_-8px_rgba(255,215,0,0.5)]"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            }}
          >
            {/* Shimmer sweep on hover */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] opacity-0 group-hover:opacity-100 group-hover:left-[150%] transition-all duration-700 ease-out"
            />
            <motion.span variants={iconPop} className="relative flex">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 4L12 13L2 4" />
              </svg>
            </motion.span>
            <span className="relative">Send Email</span>
            <motion.span variants={arrowSlide} className="relative flex">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </motion.span>
          </motion.a>
        </motion.div>
      )}
    </section>
  );
}

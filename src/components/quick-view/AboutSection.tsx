'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { fadeInUp, staggerContainer, viewportConfig } from '@/lib/animations';
import SectionHeading from '@/components/quick-view/SectionHeading';
import type { NeuralNode } from '@/data/types';

interface AboutSectionProps {
  nodes: NeuralNode[];
  color: string;
  subtitle: string;
}

const CARD_ICONS = [
  <svg
    key="terminal"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>,
  <svg
    key="lightbulb"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
  </svg>,
  <svg
    key="compass"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>,
];

const CARD_NUMBER = ['01', '02', '03'];
const ABOUT_HIGHLIGHTS = [
  { label: 'Based In', value: 'Surat, Gujarat' },
  { label: 'Experience', value: '3+ Years' },
  { label: 'Focus', value: 'Backend + AI Systems' },
];

const CARD_TILT_Y = [-10, 0, 10]; // left tilt, no tilt, right tilt

const cardVariant = {
  hidden: { opacity: 0, y: 60, rotateX: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.18,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
};

function TiltCard({
  node,
  color,
  index,
}: {
  node: NeuralNode;
  color: string;
  index: number;
}) {
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
      variants={cardVariant}
      className="group relative h-full"
      style={{ perspective: 800 }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      whileHover={{ y: -4, scale: 1.015, rotateY: CARD_TILT_Y[index] }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <motion.div
        className="relative h-full overflow-hidden rounded-2xl bg-white/[0.02] p-6 sm:p-7 transition-all duration-500"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          border: `1px solid ${color}20`,
          borderTop: `2px solid ${color}50`,
          boxShadow: `0 0 15px ${color}0a, 0 4px 24px rgba(0,0,0,0.25)`,
        }}
        whileHover={{
          borderColor: `${color}38`,
          boxShadow: `0 0 20px ${color}14, 0 0 40px ${color}0a, 0 4px 24px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Shimmer sweep on hover */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${color}06 48%, ${color}0a 50%, ${color}06 52%, transparent 60%)`,
            animation: 'card-shimmer 2s ease-in-out infinite',
            transition: 'opacity 0.5s ease',
          }}
        />

        {/* Card number watermark */}
        <span
          className="pointer-events-none absolute right-6 top-5 select-none text-[56px] font-black leading-none opacity-[0.08] group-hover:opacity-[0.15]"
          style={{ color, transition: 'opacity 0.5s ease' }}
        >
          {CARD_NUMBER[index]}
        </span>

        {/* Icon */}
        <div className="relative mb-6">
          <div
            className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{
              color,
              background: `${color}0d`,
              border: `1px solid ${color}22`,
            }}
          >
            {CARD_ICONS[index] ?? CARD_ICONS[0]}
          </div>
          <div
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
            style={{
              border: `1px solid ${color}40`,
              animation: 'icon-ping 2s cubic-bezier(0,0,0.2,1) infinite',
              transition: 'opacity 0.3s ease',
            }}
          />
        </div>

        {/* Title */}
        <h3 className="mb-2 text-xl font-bold tracking-tight text-white">{node.label}</h3>

        {/* Summary tag */}
        <p
          className="mb-5 text-[0.68rem] font-semibold uppercase tracking-[0.22em]"
          style={{ color: `${color}90` }}
        >
          {node.summary}
        </p>

        {/* Divider */}
        <div className="relative mb-5 h-px bg-white/[0.06]">
          <div
            className="absolute left-0 top-0 h-full w-10 group-hover:w-full"
            style={{
              background: `linear-gradient(90deg, ${color}80, transparent)`,
              transition: 'width 0.5s ease',
            }}
          />
        </div>

        {/* Description */}
        <p className="flex-1 text-[14px] leading-7 text-gray-300">{node.description}</p>
      </motion.div>
    </motion.div>
  );
}

export default function AboutSection({ nodes, color, subtitle }: AboutSectionProps) {
  return (
    <section id="about" className="scroll-mt-20">
      <div className="space-y-8">
        <SectionHeading title="About Me" subtitle={subtitle} color={color} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-2xl bg-white/[0.02] p-6 sm:p-7"
          style={{
            border: `1px solid ${color}20`,
            borderTop: `2px solid ${color}50`,
            boxShadow: `0 0 15px ${color}0a, 0 4px 24px rgba(0,0,0,0.25)`,
          }}
        >
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-center">
            <div>
              {/* Terminal decoration */}
              <div className="mb-5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3 font-[var(--font-mono)]">
                <div className="mb-2.5 flex items-center gap-1.5">
                  <span className="h-[7px] w-[7px] rounded-full bg-[#FF5F57]" />
                  <span className="h-[7px] w-[7px] rounded-full bg-[#FFBD2E]" />
                  <span className="h-[7px] w-[7px] rounded-full bg-[#28CA41]" />
                </div>
                <p className="text-[11px] leading-5 text-gray-600">
                  <span style={{ color: `${color}60` }}>{'>'}</span>{' '}
                  <span className="text-gray-500">const</span> developer ={' '}
                  <span className="text-gray-500">await</span> init();
                </p>
                <p className="text-[11px] leading-5 text-gray-600">
                  <span style={{ color: `${color}60` }}>{'>'}</span> developer.status
                  <span className="text-green-500/50">{' // "building"'}</span>
                </p>
                <p className="text-[11px] leading-5 text-gray-600">
                  <span style={{ color: `${color}60` }}>{'>'}</span> developer.focus
                  <span className="text-green-500/50">{' // "backend + AI"'}</span>
                </p>
              </div>

              <span
                className="mb-4 inline-flex rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.28em]"
                style={{
                  color,
                  borderColor: `${color}30`,
                  backgroundColor: `${color}10`,
                }}
              >
                Developer Snapshot
              </span>
              <p className="max-w-3xl text-base leading-8 text-gray-300 sm:text-[1.05rem]">
                Building production-grade backend systems with a strong bias for clarity,
                reliability, and thoughtful product execution. The work blends scalable SaaS
                engineering, applied AI, and maintainable full-stack delivery.
              </p>
            </div>

            <motion.div
              className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1"
              variants={staggerContainer(0.1, 0.2)}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
            >
              {ABOUT_HIGHLIGHTS.map((item) => (
                <motion.div
                  key={item.label}
                  variants={fadeInUp}
                  className="rounded-xl bg-white/[0.03] px-4 py-3"
                  style={{
                    border: `1px solid ${color}15`,
                    boxShadow: `0 0 10px ${color}08`,
                  }}
                >
                  <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-gray-500">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold text-white sm:text-[0.95rem]">
                    {item.value}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          variants={staggerContainer(0.18)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          style={{ perspective: 1000 }}
        >
          {nodes.map((node, i) => (
            <TiltCard key={node.id} node={node} color={color} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

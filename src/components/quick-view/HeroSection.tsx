'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import AvatarGirl from '@/components/ui/AvatarGirl';

interface HeroSectionProps {
  name: string;
  summary: string;
  description: string;
}

import type { Variants } from 'framer-motion';

const ease = [0.16, 1, 0.3, 1] as const;

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease },
  },
};

const avatarVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85, x: 40 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: { duration: 0.8, ease },
  },
};

export default function HeroSection({ name, summary }: HeroSectionProps) {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const nameParts = name.split(' ');

  return (
    <section ref={heroRef} className="relative pt-10 pb-20 sm:pt-14 sm:pb-24 overflow-hidden">
      {/* Background blobs */}
      <div
        className="absolute top-0 left-[20%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(77,124,255,0.025) 0%, transparent 60%)',
          filter: 'blur(50px)',
        }}
      />
      <div
        className="absolute bottom-0 right-[15%] w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,0,229,0.02) 0%, transparent 60%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Cursor-following glow */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: '500px',
          height: '500px',
          left: `${mousePos.x * 100}%`,
          top: `${mousePos.y * 100}%`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255,215,0,0.02) 0%, transparent 60%)',
          transition: 'left 0.4s ease-out, top 0.4s ease-out',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center md:items-center gap-12 md:gap-8">
          {/* Avatar — mobile: top centered, desktop: right 40% */}
          <motion.div
            className="md:order-2 md:w-[40%] flex justify-center"
            variants={avatarVariants}
            initial="hidden"
            animate="visible"
          >
            <AvatarGirl className="w-[240px] h-[260px] sm:w-[280px] sm:h-[300px] md:w-[300px] md:h-[320px]" />
          </motion.div>

          {/* Text content — mobile: below, desktop: left 60% */}
          <motion.div
            className="md:order-1 md:w-[60%] flex flex-col items-center md:items-start text-center md:text-left space-y-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Open to Work badge */}
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-emerald-400 border border-emerald-500/20 bg-emerald-500/[0.06]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Open to Work
              </span>
            </motion.div>

            {/* Name with gradient + shimmer */}
            <motion.div variants={itemVariants}>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-[var(--font-syne)] tracking-tight text-white leading-[1.1]">
                {nameParts.map((word, i) => (
                  <span key={i}>
                    {i === nameParts.length - 1 ? (
                      <span
                        className="bg-gradient-to-r from-[#FFD700] via-[#FF00E5] to-[#4D7CFF] bg-clip-text text-transparent"
                        style={{
                          backgroundSize: '200% auto',
                          animation: 'shimmer 3s linear infinite',
                        }}
                      >
                        {word}
                      </span>
                    ) : (
                      word
                    )}
                    {i < nameParts.length - 1 ? ' ' : ''}
                  </span>
                ))}
              </h1>
            </motion.div>

            {/* Summary / Role */}
            <motion.div variants={itemVariants}>
              <p className="text-xl sm:text-2xl text-gray-300 font-medium">{summary}</p>
            </motion.div>

            {/* Description */}
            <motion.div variants={itemVariants}>
              <p className="text-[15px] text-gray-500 leading-relaxed max-w-xl">
                I build scalable backends, clean APIs, and production-ready web apps using
                Django, FastAPI, and React. 3+ years of shipping reliable software with a focus on
                modular architecture and test-driven development.
              </p>
            </motion.div>

            {/* Stats row */}
            <motion.div variants={itemVariants} className="flex flex-wrap justify-center md:justify-start gap-8 pt-2">
              {[
                { value: '3+', label: 'Years Experience' },
                { value: '16', label: 'Projects Shipped' },
                { value: '19', label: 'Certifications' },
              ].map((stat) => (
                <div key={stat.label} className="text-center md:text-left">
                  <p className="text-2xl sm:text-3xl font-bold text-white font-[var(--font-syne)]">
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-[0.12em] mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>

            {/* CTA buttons */}
            <motion.div variants={itemVariants} className="flex flex-wrap justify-center md:justify-start gap-3 pt-3">
              <a
                href="#contact"
                className="group relative px-7 py-3 rounded-xl text-sm font-semibold text-[#0A0A1A] overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,215,0,0.2)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] to-[#FFB800] transition-transform duration-300 group-hover:scale-105" />
                <span className="relative z-10 flex items-center gap-1.5">
                  Get in Touch
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="group-hover:translate-x-0.5 transition-transform"
                  >
                    <path
                      d="M2 7H12M12 7L8 3M12 7L8 11"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </a>
              <a
                href="#projects"
                className="px-7 py-3 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-300 border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300"
              >
                View Projects
              </a>
              <a
                href="https://github.com/sojitra-nency"
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-300 border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300 inline-flex items-center gap-2"
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                GitHub
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom separator line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(255,215,0,0.08) 30%, rgba(255,0,229,0.06) 60%, transparent)',
        }}
      />

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1.8, duration: 0.8 }}
      >
        <span className="text-[9px] text-gray-600 uppercase tracking-[0.2em]">Scroll</span>
        <motion.svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M3 5L7 9L11 5" stroke="white" strokeWidth="1" strokeLinecap="round" />
        </motion.svg>
      </motion.div>

      {/* Shimmer keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
      `}</style>
    </section>
  );
}

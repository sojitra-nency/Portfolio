'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { fadeInDown, viewportConfig } from '@/lib/animations';

interface StickyHeaderProps {
  sections: Array<{ id: string; label: string; color: string }>;
}

export default function StickyHeader({ sections }: StickyHeaderProps) {
  const [activeSection, setActiveSection] = useState<string>('');
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 50);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Track active section with IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(section.id);
            }
          });
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.header
      variants={fadeInDown}
      initial="hidden"
      animate="visible"
      viewport={viewportConfig}
      className={`fixed top-0 left-0 right-0 z-50 h-14 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-xl bg-[#0A0A1A]/80 border-b border-white/[0.06]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-full">
        {/* Left: Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFD700]" />
          <span className="text-sm font-semibold text-white/70 font-[var(--font-syne)] tracking-wide">
            Neural Nexus
          </span>
        </div>

        {/* Center: Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`relative px-2.5 py-1 text-[11px] rounded-md transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-white/[0.06]'
                    : 'text-gray-500 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                  style={{ backgroundColor: section.color }}
                />
                {section.label}
                {isActive && (
                  <motion.div
                    layoutId="activeSection"
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                    style={{ backgroundColor: section.color }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile: Horizontal scrollable nav */}
        <nav className="flex md:hidden items-center gap-1 overflow-x-auto scrollbar-none max-w-[50%]">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`shrink-0 px-2 py-1 text-[10px] rounded-md transition-all ${
                  isActive ? 'text-white' : 'text-gray-500'
                }`}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle"
                  style={{ backgroundColor: section.color }}
                />
                {section.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Neural View button */}
        <a
          href="/"
          className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#FFD700]/10 text-[#FFD700] hover:bg-[#FFD700]/20 border border-[#FFD700]/20 transition-all"
        >
          Neural View
        </a>
      </div>
    </motion.header>
  );
}

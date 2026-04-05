'use client';

import { useEffect, useState, useRef } from 'react';
import AvatarGirl from './AvatarGirl';

interface AnimatedHeroProps {
  name: string;
  summary: string;
  description: string;
}

export default function AnimatedHero({ name, summary }: AnimatedHeroProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
    const timers = [
      setTimeout(() => setStep(1), 100),
      setTimeout(() => setStep(2), 300),
      setTimeout(() => setStep(3), 500),
      setTimeout(() => setStep(4), 700),
      setTimeout(() => setStep(5), 900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

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

  const px = (mousePos.x - 0.5) * 16;
  const py = (mousePos.y - 0.5) * 10;

  const reveal = (s: number, delay = 0) => ({
    opacity: step >= s ? 1 : 0,
    transform: step >= s ? 'translateY(0)' : 'translateY(20px)',
    transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
  });

  return (
    <section ref={heroRef} className="relative pt-6 pb-16 sm:pt-8 sm:pb-20 overflow-hidden">
      {/* Subtle background blobs */}
      <div className="absolute top-0 left-[20%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(77,124,255,0.025) 0%, transparent 60%)', filter: 'blur(50px)' }} />
      <div className="absolute bottom-0 right-[15%] w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,0,229,0.02) 0%, transparent 60%)', filter: 'blur(50px)' }} />

      {/* Cursor glow */}
      <div className="absolute pointer-events-none rounded-full"
        style={{
          width: '500px', height: '500px',
          left: `${mousePos.x * 100}%`, top: `${mousePos.y * 100}%`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255,215,0,0.02) 0%, transparent 60%)',
          transition: 'left 0.4s ease-out, top 0.4s ease-out',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Photo — centered, large, prominent */}
        <div className="flex justify-center mb-10" style={reveal(1)}>
          <div
            style={{
              transform: mounted ? `translate(${px * -0.2}px, ${py * -0.2}px)` : 'scale(0.9)',
              transition: 'transform 0.35s ease-out',
            }}
          >
            <AvatarGirl className="w-[220px] h-[240px] sm:w-[280px] sm:h-[300px]" />
          </div>
        </div>

        {/* Text content — centered */}
        <div className="text-center space-y-5 max-w-2xl mx-auto">
          {/* Badge */}
          <div style={reveal(2)}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-[#FFD700] border border-[#FFD700]/15"
              style={{ backgroundColor: 'rgba(255,215,0,0.06)' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-40" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD700]" />
              </span>
              Open to Work
            </span>
          </div>

          {/* Name */}
          <div style={reveal(2, 80)}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-[var(--font-syne)] tracking-tight text-white leading-[1.1]">
              {name.split(' ').map((word, i) => (
                <span key={i}>
                  {i === 1 ? (
                    <span className="bg-gradient-to-r from-[#FFD700] via-[#FF00E5] to-[#4D7CFF] bg-clip-text text-transparent">
                      {word}
                    </span>
                  ) : word}
                  {i < name.split(' ').length - 1 ? ' ' : ''}
                </span>
              ))}
            </h1>
          </div>

          {/* Role */}
          <div style={reveal(3)}>
            <p className="text-xl sm:text-2xl text-gray-300 font-medium">
              {summary}
            </p>
          </div>

          {/* Description */}
          <div style={reveal(3, 80)}>
            <p className="text-[15px] text-gray-500 leading-relaxed max-w-xl mx-auto">
              I build scalable backends, clean APIs, and production-ready web apps using Django, FastAPI, and React. 3+ years of shipping reliable software with a focus on modular architecture and test-driven development.
            </p>
          </div>

          {/* Stats */}
          <div style={reveal(4)} className="flex justify-center gap-10 pt-2">
            {[
              { value: '3+', label: 'Years Experience' },
              { value: '16', label: 'Projects Shipped' },
              { value: '19', label: 'Certifications' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white font-[var(--font-syne)]">{stat.value}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.12em] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={reveal(5)} className="flex flex-wrap justify-center gap-3 pt-3">
            <a href="#contact"
              className="group relative px-7 py-3 rounded-xl text-sm font-semibold text-[#0A0A1A] overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,215,0,0.2)]">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] to-[#FFB800] transition-transform duration-300 group-hover:scale-105" />
              <span className="relative z-10 flex items-center gap-1.5">
                Get in Touch
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="group-hover:translate-x-0.5 transition-transform">
                  <path d="M2 7H12M12 7L8 3M12 7L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </a>
            <a href="#projects"
              className="px-7 py-3 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-300 border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300">
              View Projects
            </a>
            <a href="https://github.com/sojitra-nency" target="_blank" rel="noopener noreferrer"
              className="px-7 py-3 rounded-xl text-sm font-medium bg-white/[0.04] text-gray-300 border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300 inline-flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.06) 30%, rgba(255,0,229,0.04) 70%, transparent)',
          opacity: step >= 5 ? 1 : 0, transition: 'opacity 1s ease-out',
        }}
      />

      {/* Scroll */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        style={{ opacity: step >= 5 ? 0.3 : 0, transition: 'opacity 1s ease-out 0.5s' }}>
        <span className="text-[9px] text-gray-600 uppercase tracking-[0.2em]">Scroll</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'heroFloat 2s ease-in-out infinite' }}>
          <path d="M3 5L7 9L11 5" stroke="white" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>

      <style jsx>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </section>
  );
}

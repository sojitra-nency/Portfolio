'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';

interface AvatarGirlProps {
  className?: string;
}

export default function AvatarGirl({ className = '' }: AvatarGirlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseAngle, setMouseAngle] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [time, setTime] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const animate = (now: number) => {
      setTime((now - startTime) / 1000);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    setMouseAngle(Math.max(-1, Math.min(1, dx / 400)));
    setMouseY(Math.max(-1, Math.min(1, dy / 300)));
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const t = time;
  // Floating motion
  const floatY = Math.sin(t * 0.8) * 6;
  const floatX = Math.cos(t * 0.6) * 3;
  // Tilt toward cursor
  const tiltX = mouseY * -8;
  const tiltY = mouseAngle * 10;
  // Glow pulse
  const glowPulse = 0.5 + Math.sin(t * 1.2) * 0.2;
  // Ring rotation
  const ringRotate = t * 15;
  // Sparkle positions (reduced from 8 to 6)
  const sparkles = Array.from({ length: 6 }, (_, i) => ({
    angle: (i / 6) * Math.PI * 2 + t * 0.3,
    dist: 130 + Math.sin(t * 0.7 + i * 1.2) * 15,
    size: 2 + Math.sin(t * 1.5 + i * 0.8) * 1.5,
    opacity: 0.3 + Math.sin(t * 1.2 + i * 0.9) * 0.25,
  }));

  return (
    <div
      ref={containerRef}
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{ background: 'transparent', perspective: '800px' }}
    >
      {/* Outer glow rings (opacity reduced from 0.08 to 0.06) */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '280px',
          height: '280px',
          border: '1px solid rgba(255,215,0,0.06)',
          transform: `rotate(${ringRotate}deg)`,
          transition: 'transform 0.1s linear',
        }}
      >
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#FFD700]/30" />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#FF00E5]/25" />
        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#4D7CFF]/25" />
      </div>

      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '320px',
          height: '320px',
          border: '1px solid rgba(255,215,0,0.04)',
          transform: `rotate(${-ringRotate * 0.6}deg)`,
        }}
      >
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00FF88]/20" />
        <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#FFB800]/20" />
      </div>

      {/* Sparkles */}
      <svg className="absolute w-[300px] h-[300px] pointer-events-none" viewBox="0 0 300 300" overflow="visible">
        {sparkles.map((s, i) => (
          <circle
            key={i}
            cx={150 + Math.cos(s.angle) * s.dist}
            cy={150 + Math.sin(s.angle) * s.dist}
            r={s.size}
            fill="#FFD700"
            opacity={s.opacity}
          />
        ))}
      </svg>

      {/* Glow behind photo */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '240px',
          height: '240px',
          background: `radial-gradient(circle, rgba(255,215,0,${0.12 * glowPulse}) 0%, rgba(255,0,229,${0.06 * glowPulse}) 40%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />

      {/* Photo container with 3D tilt */}
      <div
        style={{
          transform: `
            translateY(${floatY}px) translateX(${floatX}px)
            rotateX(${tiltX}deg) rotateY(${tiltY}deg)
          `,
          transition: 'transform 0.25s ease-out',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Frame glow */}
        <div
          className="absolute -inset-[3px] rounded-full pointer-events-none"
          style={{
            background: `conic-gradient(from ${ringRotate * 2}deg, #FFD700, #FF00E5, #4D7CFF, #00FF88, #FFD700)`,
            opacity: 0.4,
            filter: 'blur(8px)',
          }}
        />

        {/* Photo frame border */}
        <div
          className="relative w-[210px] h-[210px] sm:w-[250px] sm:h-[250px] rounded-full overflow-hidden"
          style={{
            border: '3px solid rgba(255,215,0,0.3)',
            boxShadow: `
              0 0 30px rgba(255,215,0,${0.15 * glowPulse}),
              0 0 60px rgba(255,0,229,${0.08 * glowPulse}),
              inset 0 0 20px rgba(0,0,0,0.3)
            `,
          }}
        >
          {/* Soft vignette overlay */}
          <div
            className="absolute inset-0 z-10 pointer-events-none rounded-full"
            style={{
              background: 'radial-gradient(circle, transparent 55%, rgba(10,10,26,0.4) 100%)',
            }}
          />

          {/* Warm dreamy color overlay */}
          <div
            className="absolute inset-0 z-10 pointer-events-none rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(255,215,0,0.06) 0%, transparent 50%, rgba(255,0,229,0.04) 100%)',
              mixBlendMode: 'overlay',
            }}
          />

          {/* Actual photo */}
          <Image
            src="/images/Nency.jpg"
            alt="Nency Sojitra"
            fill
            className="object-cover object-top"
            sizes="230px"
            priority
            style={{
              filter: 'saturate(1.1) contrast(1.05) brightness(1.02)',
            }}
          />
        </div>

        {/* Reflection / shine on glass */}
        <div
          className="absolute top-2 left-4 w-[60%] h-[30%] rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)',
            transform: 'rotate(-15deg)',
          }}
        />
      </div>

      {/* Name tag below photo */}
      <div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          transform: `translateX(-50%) translateY(${floatY * 0.3}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        <div className="px-4 py-1.5 rounded-full bg-[#0A0A1A]/80 backdrop-blur-md border border-[#FFD700]/15">
          <span className="text-[11px] text-[#FFD700]/70 font-medium tracking-wider">
            NENCY SOJITRA
          </span>
        </div>
      </div>
    </div>
  );
}

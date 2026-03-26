'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/useUIStore';

export function useResponsive() {
  const setMobile = useUIStore((s) => s.setMobile);
  const setReducedMotion = useUIStore((s) => s.setReducedMotion);

  useEffect(() => {
    const checkMobile = () => {
      setMobile(window.innerWidth < 768);
    };

    const checkMotion = () => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
    };

    checkMobile();
    checkMotion();

    window.addEventListener('resize', checkMobile);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = () => checkMotion();
    mq.addEventListener('change', handleMotionChange);

    return () => {
      window.removeEventListener('resize', checkMobile);
      mq.removeEventListener('change', handleMotionChange);
    };
  }, [setMobile, setReducedMotion]);
}

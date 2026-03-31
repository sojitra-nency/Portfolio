'use client';

import { motion, useScroll } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left bg-gradient-to-r from-[#FFD700] to-[#FF00E5]"
      style={{ scaleX: scrollYProgress, transformOrigin: 'left' }}
    />
  );
}

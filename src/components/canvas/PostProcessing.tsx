'use client';

import { useState, useEffect } from 'react';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { getGPUTier } from 'detect-gpu';

export default function PostProcessing() {
  const [gpuTier, setGpuTier] = useState<number>(2); // default mid-range

  useEffect(() => {
    getGPUTier().then((result) => {
      setGpuTier(result.tier);
    });
  }, []);

  // Tier 0-1: no post-processing at all
  if (gpuTier <= 1) return null;

  return (
    <EffectComposer>
      <Bloom
        intensity={gpuTier >= 3 ? 0.8 : 0.4}
        luminanceThreshold={0.3}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette
        offset={0.3}
        darkness={0.7}
      />
    </EffectComposer>
  );
}

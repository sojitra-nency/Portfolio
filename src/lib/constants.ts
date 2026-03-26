export const CAMERA_DEFAULTS = {
  position: [0, 0, 50] as [number, number, number],
  fov: 60,
  near: 0.1,
  far: 1000,
};

import type { NodeLevel } from '@/data/types';

export const ZOOM_LEVELS: Record<NodeLevel, number> = {
  0: 50,   // full network
  1: 30,   // region
  2: 20,   // cluster
  3: 12,   // detail
  4: 8,    // hidden node
};

export const NODE_SIZES = {
  0: 2.5,  // origin
  1: 1.6,  // primary
  2: 1.0,  // secondary
  3: 0.6,  // detail
  4: 0.8,  // hidden/unlockable
} as const;

export const FORCE_CONFIG = {
  chargeStrength: -120,
  linkDistance: 12,
  linkStrength: 0.4,
  centerStrength: 0.03,
  collisionRadius: 3,
  alphaDecay: 0.02,
  velocityDecay: 0.3,
};

export const ANIMATION = {
  cameraTransition: 800,
  clusterExpand: 600,
  pulseRing: 800,
  signalSpeed: 0.02,
  floatAmplitude: 0.3,
  floatFrequency: 0.4,
  hoverScale: 1.2,
  nodeGlowIntensity: 2,
};

export const INTERACTION = {
  hoverRadius: 3,
  clickDebounce: 200,
  doubleclickTime: 300,
};

export const COLORS = {
  background: '#0A0A1A',
  surface: '#12121F',
  surfaceBorder: 'rgba(255,255,255,0.06)',
  textPrimary: '#F0F0F0',
  textSecondary: '#8888AA',
  gridLine: 'rgba(255,255,255,0.02)',
};

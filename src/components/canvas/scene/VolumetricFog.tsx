'use client';

/**
 * VolumetricFog — exponential depth fog tinted to `--void`. Adds subtle
 * depth separation between the neural network and the parallax star
 * field behind it without harming selective-bloom contrast.
 *
 * Two densities are supported via {@link fogDensityForTier}: the default
 * 0.005 for GPU tier ≥ 2 and a lighter 0.0025 for tier 0/1 where we want
 * to preserve as much contrast as possible given the lack of bloom.
 *
 * Honours reduced motion implicitly — fog is static, no animation.
 */

export interface VolumetricFogProps {
  /** Exp2 density. Defaults to 0.005. Use {@link fogDensityForTier} to
   * pick a tier-appropriate value. */
  density?: number;
  /** Fog color. Defaults to `--void` (`#04050E`). */
  color?: string;
}

/** Tier-aware fog density. Returns 0.0025 on tiers 0 and 1, 0.005 otherwise. */
export function fogDensityForTier(tier: number): number {
  return tier <= 1 ? 0.0025 : 0.005;
}

export default function VolumetricFog({
  density = 0.005,
  color = '#04050E',
}: VolumetricFogProps = {}) {
  // R3F 9 requires `args` on primitive JSX; FogExp2 constructor is (color, density).
  return <fogExp2 attach="fog" args={[color, density]} />;
}

'use client';

/**
 * Typed wrappers around drei's `shaderMaterial` + small GPU-tier helpers.
 *
 * Goals:
 * - One entry point (`createShaderMaterial`) that memoizes material classes by
 *   shader source, so mounting/unmounting components doesn't rebuild shaders.
 * - Explicit `THREE.Color` / `THREE.Vector3` coercion so consumers can pass
 *   hex strings / `[r,g,b]` tuples without worrying about what three.js
 *   expects under the hood.
 * - `useShaderTime` to advance a `uTime` uniform inside `useFrame`.
 * - `createFallbackMaterial` — a plain `MeshBasicMaterial` for GPU tier 0/1
 *   where the real shader stack is disabled.
 */

import { useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import type { RefObject } from 'react';

// ---------------------------------------------------------------------------
// Uniform coercion
// ---------------------------------------------------------------------------

/** Values accepted for a color-like uniform. */
export type ColorLike =
  | THREE.Color
  | string
  | number
  | readonly [number, number, number];

/** Values accepted for a `vec3` directional / positional uniform. */
export type Vec3Like = THREE.Vector3 | readonly [number, number, number];

/**
 * Coerce any color-like input to a `THREE.Color` instance. Hex strings
 * (`'#FFD700'`), hex numbers (`0xffd700`), tuples (`[1, 0.8, 0]`), and
 * existing `Color` instances all work.
 */
export function coerceColor(value: ColorLike): THREE.Color {
  if (value instanceof THREE.Color) return value;
  if (Array.isArray(value)) {
    return new THREE.Color(value[0], value[1], value[2]);
  }
  // THREE.Color accepts string (hex/css) or number (hex).
  return new THREE.Color(value as string | number);
}

/**
 * Coerce any vec3-like input to a `THREE.Vector3` instance. Existing
 * `Vector3` instances are returned as-is (not cloned).
 */
export function coerceVec3(value: Vec3Like): THREE.Vector3 {
  if (value instanceof THREE.Vector3) return value;
  return new THREE.Vector3(value[0], value[1], value[2]);
}

// ---------------------------------------------------------------------------
// Shader material factory
// ---------------------------------------------------------------------------

/**
 * Per-uniform type hint used by {@link createShaderMaterial} to auto-coerce
 * raw values into the right `THREE.*` instance. Omit a hint to pass the
 * value through unchanged (numbers, textures, matrices, etc.).
 */
export type UniformTypeHint = 'color' | 'vec3';

export interface ShaderMaterialConfig<
  U extends Record<string, unknown> = Record<string, unknown>,
> {
  /** GLSL vertex shader source. */
  vertexShader: string;
  /** GLSL fragment shader source. */
  fragmentShader: string;
  /** Initial uniform values. Keys must match the GLSL `uniform` names. */
  uniforms: U;
  /**
   * Optional map from uniform name → type hint. When provided, initial
   * values for `color` / `vec3` uniforms are coerced into the correct
   * `THREE.*` instance before being handed to drei's `shaderMaterial`.
   */
  uniformTypes?: Partial<Record<keyof U, UniformTypeHint>>;
}

/**
 * Return type of drei's `shaderMaterial`: a class constructor whose
 * instances extend `THREE.ShaderMaterial`.
 */
export type ShaderMaterialClass = ReturnType<typeof shaderMaterial>;

const materialCache = new Map<string, ShaderMaterialClass>();

/**
 * Create (or retrieve from cache) a `ShaderMaterial` class from a
 * `{ vertexShader, fragmentShader, uniforms }` config. Cache key is the
 * concatenated shader source — identical shader pairs share a single class,
 * which keeps component remounts cheap and avoids duplicate program
 * compilation on the GPU.
 *
 * The returned class is a constructor; instantiate it at the usage site
 * (typically via `<primitive object={new MaterialCtor()} />` or by calling
 * `extend({ MyMaterial })` and using JSX like `<myMaterial />`).
 */
export function createShaderMaterial<U extends Record<string, unknown>>(
  config: ShaderMaterialConfig<U>,
): ShaderMaterialClass {
  const key = `${config.vertexShader}:::${config.fragmentShader}`;
  const cached = materialCache.get(key);
  if (cached) return cached;

  const coerced: Record<string, unknown> = { ...config.uniforms };
  if (config.uniformTypes) {
    for (const name of Object.keys(config.uniformTypes) as Array<keyof U>) {
      const hint = config.uniformTypes[name];
      const value = coerced[name as string];
      if (value === undefined || value === null) continue;
      if (hint === 'color') {
        coerced[name as string] = coerceColor(value as ColorLike);
      } else if (hint === 'vec3') {
        coerced[name as string] = coerceVec3(value as Vec3Like);
      }
    }
  }

  // Cast to drei's expected uniform shape — values have already been
  // coerced (or passed through) to valid THREE uniform types above.
  const material = shaderMaterial(
    coerced as Parameters<typeof shaderMaterial>[0],
    config.vertexShader,
    config.fragmentShader,
  );
  materialCache.set(key, material);
  return material;
}

// ---------------------------------------------------------------------------
// Time-advancing hook
// ---------------------------------------------------------------------------

/**
 * Advance the `uTime` uniform on a `ShaderMaterial` by the frame delta
 * every tick. No-op when the ref is null or when the material doesn't
 * declare a `uTime` uniform — so it's safe to attach unconditionally.
 *
 * ```tsx
 * const matRef = useRef<THREE.ShaderMaterial>(null);
 * useShaderTime(matRef);
 * return <mesh><myMaterial ref={matRef} /></mesh>;
 * ```
 */
export function useShaderTime(
  materialRef: RefObject<THREE.ShaderMaterial | null>,
): void {
  useFrame((_, delta) => {
    const mat = materialRef.current;
    if (!mat) return;
    const uniform = mat.uniforms?.uTime;
    if (uniform) uniform.value += delta;
  });
}

// ---------------------------------------------------------------------------
// Low-tier GPU fallback
// ---------------------------------------------------------------------------

/**
 * A plain `MeshBasicMaterial` for GPU tier 0/1 where shader + post-processing
 * effects are disabled. Transparent when `opacity < 1`. Swap this in place of
 * the shader material so components render cleanly even without effects.
 */
export function createFallbackMaterial(
  color: ColorLike,
  opacity = 1,
): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: coerceColor(color),
    transparent: opacity < 1,
    opacity,
  });
}

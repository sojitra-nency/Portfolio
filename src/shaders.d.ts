/**
 * Module declarations for GLSL shader imports.
 *
 * Both bundlers are configured in `next.config.mjs` to load these files
 * as string modules:
 * - Turbopack: `raw-loader` mapped via `turbopack.rules`
 * - Webpack:   `asset/source` (no extra dep)
 *
 * Usage:
 * ```ts
 * import nebulaFrag from '../shaders/nebula.frag.glsl';
 * ```
 */

declare module '*.glsl' {
  const content: string;
  export default content;
}

declare module '*.vert' {
  const content: string;
  export default content;
}

declare module '*.frag' {
  const content: string;
  export default content;
}

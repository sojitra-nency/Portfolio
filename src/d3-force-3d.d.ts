/**
 * Minimal type declarations for `d3-force-3d` (the package ships no .d.ts).
 * Covers only the surface we use in `useForceLayout` — expand as needed.
 */

declare module 'd3-force-3d' {
  export interface Simulation<N> {
    force(name: string, force: unknown): this;
    alpha(): number;
    alpha(value: number): this;
    alphaMin(): number;
    alphaMin(value: number): this;
    alphaDecay(): number;
    alphaDecay(value: number): this;
    tick(iterations?: number): this;
    stop(): this;
    restart(): this;
    nodes(): N[];
    nodes(nodes: N[]): this;
  }

  export interface ManyBodyForce<N> {
    strength(s: number | ((n: N) => number)): this;
    distanceMin(d: number): this;
    distanceMax(d: number): this;
  }

  export interface LinkForce<N, L> {
    links(): L[];
    links(links: L[]): this;
    id(fn: (n: N) => string | number): this;
    distance(d: number | ((l: L) => number)): this;
    strength(s: number | ((l: L) => number)): this;
  }

  export interface CenterForce {
    strength(s: number): this;
    x(x: number): this;
    y(y: number): this;
    z(z: number): this;
  }

  export interface CollideForce<N> {
    radius(r: number | ((n: N) => number)): this;
    strength(s: number): this;
  }

  export function forceSimulation<N = unknown>(
    nodes?: N[],
    numDimensions?: number,
  ): Simulation<N>;

  export function forceManyBody<N = unknown>(): ManyBodyForce<N>;
  export function forceLink<N = unknown, L = unknown>(
    links?: L[],
  ): LinkForce<N, L>;
  export function forceCenter(
    x?: number,
    y?: number,
    z?: number,
  ): CenterForce;
  export function forceCollide<N = unknown>(
    radius?: number | ((n: N) => number),
  ): CollideForce<N>;
}

/**
 * Pure graph-math helpers for the Neural View — neighbor lookups, curve
 * interpolation, and cluster centroid math. All functions are side-effect
 * free; callers supply the connection list / position map they want to
 * query. No npm deps beyond `three`.
 */

import * as THREE from 'three';
import type { NeuralConnection } from '@/data/types';

// ---------------------------------------------------------------------------
// Neighbor lookups
// ---------------------------------------------------------------------------

/**
 * Return the set of node IDs reachable from `nodeId` within `hops` edges
 * (undirected). The source node itself is **not** included. Used by the
 * chain-reaction hook to propagate pulses outward one hop at a time.
 *
 * Complexity: O(hops × |connections|) — fine for the project's ~115-edge
 * graph; switch to an adjacency map for larger graphs.
 *
 * @param nodeId Source node.
 * @param hops Maximum edge distance (1 = immediate neighbors, 2 = one step
 *   further, etc). Values ≤ 0 yield an empty set.
 * @param connections The full edge list to traverse.
 */
export function getNeighbors(
  nodeId: string,
  hops: number,
  connections: readonly NeuralConnection[],
): Set<string> {
  const reached = new Set<string>([nodeId]);
  if (hops <= 0) return new Set();

  let frontier = new Set<string>([nodeId]);

  for (let h = 0; h < hops; h++) {
    const next = new Set<string>();
    for (const id of frontier) {
      for (const conn of connections) {
        if (conn.sourceId === id && !reached.has(conn.targetId)) {
          next.add(conn.targetId);
          reached.add(conn.targetId);
        } else if (conn.targetId === id && !reached.has(conn.sourceId)) {
          next.add(conn.sourceId);
          reached.add(conn.sourceId);
        }
      }
    }
    if (next.size === 0) break;
    frontier = next;
  }

  reached.delete(nodeId);
  return reached;
}

// ---------------------------------------------------------------------------
// Curve sampling
// ---------------------------------------------------------------------------

/**
 * Sample `segments + 1` points along a smoothly-bowed arc from `start` to
 * `end`. `curvature` controls how far the midpoint bows perpendicular to
 * the straight line — `0` yields a straight line, `0.2` a gentle synapse-
 * shaped arc, `1` an aggressively bowed curve.
 *
 * The bow direction is chosen automatically: cross-product of the segment
 * direction with a non-parallel reference axis, so the result is stable
 * regardless of where the endpoints sit in 3D.
 */
export function computeCurvePoints(
  start: THREE.Vector3,
  end: THREE.Vector3,
  curvature = 0.2,
  segments = 20,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const direct = new THREE.Vector3().subVectors(end, start);
  const length = direct.length();

  if (length === 0) {
    // Degenerate endpoints — return `segments + 1` copies of `start`.
    for (let i = 0; i <= segments; i++) points.push(start.clone());
    return points;
  }

  if (curvature === 0) {
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      points.push(new THREE.Vector3().lerpVectors(start, end, t));
    }
    return points;
  }

  // Choose a reference axis not (too) parallel to the direct line.
  const directNorm = direct.clone().normalize();
  const reference =
    Math.abs(directNorm.y) < 0.9
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);

  const perpendicular = new THREE.Vector3()
    .crossVectors(directNorm, reference)
    .normalize();

  // Bowed midpoint sits perpendicular to the direct line.
  const midpoint = new THREE.Vector3()
    .addVectors(start, end)
    .multiplyScalar(0.5);
  const peak = midpoint.add(perpendicular.multiplyScalar(length * curvature));

  const curve = new THREE.CatmullRomCurve3([start, peak, end]);
  for (let i = 0; i <= segments; i++) {
    points.push(curve.getPoint(i / segments));
  }
  return points;
}

// ---------------------------------------------------------------------------
// CatmullRom wrapper
// ---------------------------------------------------------------------------

/**
 * Build a `THREE.CatmullRomCurve3` through the given control points.
 *
 * Thin wrapper so callers don't have to import `three` directly just to
 * construct a curve. Defaults to non-closed, `catmullrom` variant, tension
 * `0.5` — sane values for synapse paths. Throws on fewer than 2 points.
 */
export function catmullRomPath(
  points: readonly THREE.Vector3[],
): THREE.CatmullRomCurve3 {
  if (points.length < 2) {
    throw new Error(
      `catmullRomPath: need at least 2 points, received ${points.length}`,
    );
  }
  return new THREE.CatmullRomCurve3(
    points as THREE.Vector3[],
    false,
    'catmullrom',
    0.5,
  );
}

// ---------------------------------------------------------------------------
// Cluster centroid
// ---------------------------------------------------------------------------

/**
 * Average the positions of a set of nodes — used as a camera focus target
 * when framing a cluster. Nodes without a known position are silently
 * skipped. Returns the origin when no positions resolve.
 */
export function clusterCenter(
  nodeIds: readonly string[],
  positions: ReadonlyMap<string, THREE.Vector3>,
): THREE.Vector3 {
  if (nodeIds.length === 0) return new THREE.Vector3();

  const sum = new THREE.Vector3();
  let count = 0;
  for (const id of nodeIds) {
    const pos = positions.get(id);
    if (pos) {
      sum.add(pos);
      count++;
    }
  }
  if (count === 0) return new THREE.Vector3();
  return sum.divideScalar(count);
}

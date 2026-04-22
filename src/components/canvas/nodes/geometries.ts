/**
 * Per-category geometry factory for the neural core mesh.
 *
 * Each category gets a distinct silhouette so the viewer can read what
 * kind of node they're looking at before any label renders:
 *
 *   core       icosahedron (detail 2) + planetary ring accent
 *   about      plain icosahedron (detail 1)
 *   skills     icosahedron + four small antennae (hints at tools orbiting)
 *   projects   flattened octahedron — cut-gem diamond
 *   experience torus — reads as a timeline loop
 *   education  icosahedron + dotted outer ring (academic orbit)
 *   contact    plain icosahedron — the beacon work is done by the halo
 *   tools      tetrahedron — small, stud-like
 *
 * Geometries are cached so that all neurons of the same category share a
 * single BufferGeometry instance. Scale (node size) is applied by the
 * parent mesh, not baked into the geometry, so caching is safe.
 *
 * `level` is accepted for API symmetry with future refinements (e.g. LOD
 * variants per level) but is currently unused — category alone drives
 * shape.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { NodeCategory, NodeLevel } from '@/data/types';

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

const cache = new Map<NodeCategory, THREE.BufferGeometry>();

function cached(
  key: NodeCategory,
  build: () => THREE.BufferGeometry,
): THREE.BufferGeometry {
  const hit = cache.get(key);
  if (hit) return hit;
  const geom = build();
  cache.set(key, geom);
  return geom;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * `mergeGeometries` requires every input to share the same indexing
 * convention. `IcosahedronGeometry` is non-indexed (for flat shading);
 * most other primitives are indexed — so we normalise to non-indexed
 * before merging.
 */
function ensureNonIndexed(g: THREE.BufferGeometry): THREE.BufferGeometry {
  return g.index ? g.toNonIndexed() : g;
}

function safeMerge(
  parts: readonly THREE.BufferGeometry[],
  label: string,
): THREE.BufferGeometry {
  const normalised = parts.map(ensureNonIndexed);
  const merged = mergeGeometries(normalised);
  if (!merged) throw new Error(`geometryFor: failed to merge ${label}`);
  return merged;
}

// ---------------------------------------------------------------------------
// Per-category builders
// ---------------------------------------------------------------------------

function buildCore(): THREE.BufferGeometry {
  const icos = new THREE.IcosahedronGeometry(1, 2);
  // Saturn-style planetary ring in the XY plane.
  const ring = new THREE.RingGeometry(1.4, 1.55, 48);
  return safeMerge([icos, ring], 'core');
}

function buildAbout(): THREE.BufferGeometry {
  return new THREE.IcosahedronGeometry(1, 1);
}

function buildSkills(): THREE.BufferGeometry {
  const icos = new THREE.IcosahedronGeometry(1, 1);
  const parts: THREE.BufferGeometry[] = [icos];

  // Four small cone "antennae" at ±X, ±Y — each cone's apex points
  // radially outward from the neuron centre.
  //
  // ConeGeometry's default: apex at +Y (height/2), base at -Y. We rotate
  // to re-aim the apex along the desired axis, then translate so the
  // cone's midpoint sits at radius 1.2 (base at the icosahedron surface,
  // apex 0.4 beyond it).
  const coneArgs: [number, number, number] = [0.15, 0.4, 8];

  type Dir = { rotate: (c: THREE.BufferGeometry) => void; pos: [number, number, number] };
  const dirs: Dir[] = [
    { rotate: () => {},                  pos: [0, 1.2, 0] },
    { rotate: (c) => c.rotateX(Math.PI), pos: [0, -1.2, 0] },
    { rotate: (c) => c.rotateZ(-Math.PI / 2), pos: [1.2, 0, 0] },
    { rotate: (c) => c.rotateZ(Math.PI / 2),  pos: [-1.2, 0, 0] },
  ];

  for (const { rotate, pos } of dirs) {
    const cone = new THREE.ConeGeometry(...coneArgs);
    rotate(cone);
    cone.translate(...pos);
    parts.push(cone);
  }

  return safeMerge(parts, 'skills');
}

function buildProjects(): THREE.BufferGeometry {
  // Flatten an octahedron vertically → diamond facet silhouette.
  const oct = new THREE.OctahedronGeometry(1);
  oct.scale(1, 0.65, 1);
  return oct;
}

function buildExperience(): THREE.BufferGeometry {
  return new THREE.TorusGeometry(1, 0.25, 16, 32);
}

function buildEducation(): THREE.BufferGeometry {
  const icos = new THREE.IcosahedronGeometry(1, 1);
  const parts: THREE.BufferGeometry[] = [icos];

  // Dotted outer ring — 16 tiny spheres arranged on a circle in the XY
  // plane. Gives the academic "orbit" read without requiring shader-based
  // dashing on a Ring.
  const DOT_COUNT = 16;
  const DOT_RADIUS = 1.4;
  const DOT_SIZE = 0.06;
  for (let i = 0; i < DOT_COUNT; i++) {
    const angle = (i / DOT_COUNT) * Math.PI * 2;
    const dot = new THREE.SphereGeometry(DOT_SIZE, 6, 4);
    dot.translate(
      Math.cos(angle) * DOT_RADIUS,
      Math.sin(angle) * DOT_RADIUS,
      0,
    );
    parts.push(dot);
  }

  return safeMerge(parts, 'education');
}

function buildContact(): THREE.BufferGeometry {
  return new THREE.IcosahedronGeometry(1, 1);
}

function buildTools(): THREE.BufferGeometry {
  return new THREE.TetrahedronGeometry(1, 0);
}

// ---------------------------------------------------------------------------
// Public entry
// ---------------------------------------------------------------------------

/**
 * Return the cached BufferGeometry for a given (category, level) pair.
 * Geometry is returned at unit size — the caller applies world size via
 * mesh scale.
 */
export function geometryFor(
  category: NodeCategory,
  level: NodeLevel,
): THREE.BufferGeometry {
  void level;

  switch (category) {
    case 'core':
      return cached('core', buildCore);
    case 'about':
      return cached('about', buildAbout);
    case 'skills':
      return cached('skills', buildSkills);
    case 'projects':
      return cached('projects', buildProjects);
    case 'experience':
      return cached('experience', buildExperience);
    case 'education':
      return cached('education', buildEducation);
    case 'contact':
      return cached('contact', buildContact);
    case 'tools':
      return cached('tools', buildTools);
  }
}

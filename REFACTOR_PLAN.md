# Bioluminescent Neuron Refactor — Detailed Plan

## Goal

Transform the current force-directed graph visualization into a single radiating bioluminescent neuron that matches the reference image's aesthetic exactly:

- One blindingly bright central star (white-hot core with violet bloom corona)
- Hundreds of organic branching dendrites radiating outward in all directions
- Rich purple-violet color (`#7B6FFF` to `#A678FF`)
- Tiny orange-amber "spark" terminals at dendrite tips
- Floating orange/blue bokeh particles in the background depth
- Dendrites taper from thick (near core) to hair-thin (at tips), with recursive sub-branching
- Deep navy-violet atmospheric background (not pure black)

## Strategy

**Keep all existing data, interactions, and HUD** — but add a new **artistic visualization layer** that renders the bioluminescent dendrite structure on top of (or behind) the graph nodes.

The graph nodes themselves remain functional but become visually subordinate — their halos blend into the overall composition rather than standing out as discrete dots.

---

## Phase 1 — Procedural Dendrite System (NEW component)

**Create:** `src/components/canvas/scene/DendriteField.tsx`

This is the centerpiece. A new Three.js component that procedurally generates a fractal-branching dendrite structure radiating from origin `(0, 0, 0)`.

**Algorithm:**

1. Generate **N = 80–120 primary trunks** in spherical coordinates from the origin, slightly biased to favor the camera's view plane (so we see them, not just dots)
2. Each primary trunk has length 60–120 world units
3. Each trunk **recursively branches** 3–5 times:
   - Branch angle: 25–45° from parent direction (random)
   - Branch length: 0.5–0.7× parent length
   - Branch thickness: 0.5–0.7× parent thickness
   - Recursive depth: 4 levels max
4. Each branch is rendered as a **`TubeGeometry`** along a curved 3D path (slight noise displacement for organic feel) with tapered radius
5. All branches share a **single shader material** with the violet glow
6. At each leaf tip, place a **bright orange-amber sprite** (the warm terminal dot)

**Total primitive count:** ~3,000 branches → ~3,000 tube meshes → batched via `InstancedMesh` or merged into one `BufferGeometry` for performance.

**Performance:**
- Pre-generate the entire structure ONCE on mount (seeded random — same shape every time)
- Merge all tube geometries into a single `BufferGeometry` via `BufferGeometryUtils.mergeGeometries`
- Single draw call for all dendrites
- Tip sprites batched as `Points` material (one draw call)

**File:** `src/components/canvas/scene/DendriteField.tsx`
**Lines:** ~250

---

## Phase 2 — Dendrite Shader (NEW shader)

**Create:**
- `src/components/canvas/shaders/dendrite.vert.glsl`
- `src/components/canvas/shaders/dendrite.frag.glsl`

**Vertex:** Standard MVP transform + pass distance-from-origin as varying.

**Fragment:**
- Color: pure violet (`vec3(0.55, 0.42, 1.0)` to `vec3(0.70, 0.55, 1.0)`) based on UV
- **Bright glowing center spine** along v=0.5 (UV cross-section)
- **Brightness fades with distance from origin** — bright near core, dim at tips (matches reference)
- **HDR output** (3.0+ at spine center) so bloom amplifies it heavily
- Subtle flowing pulse along U (signal travelling outward)
- Alpha: 0.9 along spine, 0.4 at tube edges

---

## Phase 3 — Central Star (NEW component)

**Create:** `src/components/canvas/scene/CentralStar.tsx`

A single sprite billboard at origin that creates the **blinding white-hot center**. Three concentric layers:

1. **Inner core:** ~3 units radius, pure white HDR (`vec3(8.0)`)
2. **Mid corona:** ~12 units radius, white-violet (`vec3(4.0, 3.5, 6.0)`)
3. **Outer bloom halo:** ~40 units radius, soft violet falloff

Uses billboard plane + custom radial shader. Pulses subtly.

**Why a separate component (not a Neuron):** The reference image shows a single dominant point of light at the center. This needs to be authoritative — not competing with graph node halos.

---

## Phase 4 — Background Bokeh Particles (Enhance StarField)

**Modify:** `src/components/canvas/scene/StarField.tsx`

Add a new layer of **soft glowing orange-amber sprite particles** scattered throughout 3D space:
- 200 particles
- Size variance: 0.3 to 1.2 world units
- Colors: 60% warm orange (`#FF9966`), 30% cool violet (`#9966FF`), 10% white-blue
- Soft circular sprite (radial gradient PNG or shader)
- Slow drift animation (subtle parallax)
- Render BEHIND the dendrite field (z = -300 to -100)

This gives the composition the depth/atmosphere of the reference.

---

## Phase 5 — Atmospheric Background

**Modify:** `src/components/canvas/shaders/nebula.frag.glsl`

Strengthen the deep navy-violet wash:
- Increase nebula intensity from 0.20 to 0.35
- Shift colors to richer indigo (`vec3(0.10, 0.08, 0.40)`) and deep violet (`vec3(0.18, 0.10, 0.50)`)
- Add a soft radial brightening at center (so the area around the star glows)
- Reduce vignette darkening (let some color reach the edges)

**Modify:** `src/components/canvas/NeuralScene.tsx`
- Canvas background: `#03061A` (deep navy with violet tint)

---

## Phase 6 — Graph Node Visual Subordination

**Modify:** `src/components/canvas/nodes/Neuron.tsx`

When the dendrite field is active, the graph nodes should **blend in** rather than dominate:
- Reduce node body brightness (output values capped at 1.5, not HDR 5+)
- Halo opacity reduced to ~0.5 by default, only bright on hover/active
- Leaf nodes keep the warm orange halo (matches the tip sprites in the dendrite field)
- Core node (level 0) stays bright but its halo blends into the central star
- Reduce halo scale: 0:`3.0`, 1:`2.5`, 2+:`2.0`

This way the artistic dendrite layer is the visual hero, while the graph remains interactive underneath.

---

## Phase 7 — Hide HUD Clutter (Cleaner Composition)

The reference image is pure art — no labels, no UI. To get closer to it, make HUD elements **subtler**:

**Modify:** `src/components/hud/CornerHUD.tsx`
- Reduce opacity to 0.6 by default

**Modify:** `src/components/canvas/nodes/Neuron.tsx`
- Hide labels by default for level 1+ nodes (only show on hover/active)
- Currently `showLabel = node.level <= 2 || isHovered || isActive` → change to `node.level === 0 || isHovered || isActive`

**Optional:** Move CoherenceMeter and NeuralMap to corners with reduced opacity.

---

## Phase 8 — Mount & Integration

**Modify:** `src/components/canvas/NeuralScene.tsx`

Add new components inside the Suspense:

```tsx
<NebulaBackground />
<StarField />              // enhanced with bokeh particles
<VolumetricFog />
<SceneLighting />
<DendriteField />          // NEW — artistic dendrite layer
<CentralStar />            // NEW — central white-hot star
<NeuralNetwork />          // graph nodes (visually subordinate now)
<UnlockReveal />
<CinemaCamera />
<EffectsStack />
```

Render order matters:
- Nebula + StarField at z = -300 to -100 (background)
- DendriteField at z = -50 to +50 (mid)
- CentralStar at z = 0 (foreground point)
- Graph nodes at varying z (interactive layer, slightly forward)
- Bloom unifies it all

---

## Phase 9 — Bloom & Post-Processing Tuning

**Modify:** `src/components/canvas/postprocessing/EffectsStack.tsx`

The dendrite field outputs HDR — bloom needs to spread it generously:
- Bloom intensity: 2.0 → **3.5** (tier 2), 3.0 → **5.0** (tier 3)
- Luminance threshold: 0.05 → **0.15** (only the brightest pixels bloom — keeps dim dendrites crisp)
- Luminance smoothing: 0.5 → **0.8** (wider falloff)
- Add a radius/kernel-size boost if available

---

## Files Summary

| Action | File |
|---|---|
| **CREATE** | `src/components/canvas/scene/DendriteField.tsx` |
| **CREATE** | `src/components/canvas/scene/CentralStar.tsx` |
| **CREATE** | `src/components/canvas/shaders/dendrite.vert.glsl` |
| **CREATE** | `src/components/canvas/shaders/dendrite.frag.glsl` |
| **MODIFY** | `src/components/canvas/scene/StarField.tsx` (add bokeh particles) |
| **MODIFY** | `src/components/canvas/shaders/nebula.frag.glsl` (richer atmosphere) |
| **MODIFY** | `src/components/canvas/NeuralScene.tsx` (mount new components, bg color) |
| **MODIFY** | `src/components/canvas/nodes/Neuron.tsx` (subordinate visuals, hide labels) |
| **MODIFY** | `src/components/canvas/nodes/NeuronHalo.tsx` (reduce default scale) |
| **MODIFY** | `src/components/canvas/postprocessing/EffectsStack.tsx` (bloom tuning) |
| **MODIFY** | `src/components/hud/CornerHUD.tsx` (reduce opacity) |

---

## Verification Checklist

After implementation, the scene should have:

- [ ] One unmistakable central star — blindingly bright white-hot point
- [ ] Hundreds of fine violet dendrites radiating outward (visible without interaction)
- [ ] Dendrites taper from thick (center) to hair-thin (edges)
- [ ] Tiny orange-amber spark dots at dendrite tips
- [ ] Soft bokeh haze of warm/cool dots in background
- [ ] Deep navy-violet atmospheric background (not pure black)
- [ ] Heavy bloom creating light bleed and halation
- [ ] Graph nodes still interactive but visually integrated, not competing
- [ ] No clutter from labels (only on hover/active)
- [ ] Frame rate ≥ 60fps on mid-tier hardware

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| 3000 tube draw calls = perf drop | Merge all branches into single BufferGeometry → 1 draw call |
| Dendrite field obscures clickable nodes | Render nodes at slightly forward Z, disable raycast on dendrites |
| Bloom too aggressive on text/HUD | HUD is in DOM (HTML), not canvas — unaffected by bloom |
| Visual not matching reference | Iterate on shader colors and dendrite density values; expose constants for quick tuning |

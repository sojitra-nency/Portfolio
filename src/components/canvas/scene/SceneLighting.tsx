'use client';

/**
 * SceneLighting — the Neural View's static lighting rig.
 *
 * A soft ambient fills the scene so no neuron is ever pitch-black, plus
 * two coloured point lights (cool blue + magenta) that kiss the nodes
 * from opposite sides. The tinting gives standard materials a hint of
 * the brand palette without relying on post-processing.
 *
 * Every light is static — no positions, colours, or intensities animate
 * over time — so the rig honours `prefers-reduced-motion` by default
 * with zero extra handling. Shader-driven neurons use `MeshBasicMaterial`
 * where applicable and are therefore unaffected by this rig; standard
 * materials (halos, labels' future anchors) pick up the tinting.
 */

export default function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight
        position={[30, 30, 40]}
        color="#4466ff"
        intensity={0.7}
      />
      <pointLight
        position={[-30, -30, 40]}
        color="#ff00e5"
        intensity={0.5}
      />
    </>
  );
}

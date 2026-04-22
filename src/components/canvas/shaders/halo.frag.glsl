// halo.frag.glsl
// ---------------------------------------------------------------------------
// Fragment shader for a neuron's outer halo — a soft, radially-falling-off
// glow billboarded to the camera. Combined with additive blending on the
// selective-bloom layer, this gives each neuron its signature "aura".
//
// Uniforms:
//   uColor:   vec3  — category color (linear-ish sRGB)
//   uPulse:   float — 0..1 firing envelope; lifts intensity during fire
//   uOpacity: float — global opacity (defaults to 1; lowered for dimmed
//                     nodes, e.g. unvisited in fog-of-war).
//
// Varying:
//   vUv — standard plane UVs in [0, 1]².
// ---------------------------------------------------------------------------

precision highp float;

uniform vec3  uColor;
uniform float uPulse;
uniform float uOpacity;

varying vec2 vUv;

void main() {
  // Distance from quad center, normalised so the corners sit at d ≈ √2.
  // Multiplying by 2 makes the disc's edge land at d = 1 across the
  // midpoints of the quad's edges.
  float d = length(vUv - 0.5) * 2.0;

  // Soft radial falloff: 1 at the centre, 0 at d = 1, smooth in-between.
  float a = smoothstep(1.0, 0.0, d);

  // Additive colour lifted by the firing envelope. Alpha multiplies the
  // radial mask by the caller-supplied opacity.
  gl_FragColor = vec4(uColor * (0.6 + uPulse * 1.5), a * uOpacity);
}

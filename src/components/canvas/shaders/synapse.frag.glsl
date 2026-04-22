// synapse.frag.glsl
// ---------------------------------------------------------------------------
// Fragment shader for a neural synapse tube. Flows a bright-tipped gradient
// along the length of the tube, with:
//   - Static alpha 0.06 when inactive, 0.95 when either endpoint is
//     hovered or focused (uActive)
//   - Optional dash pattern for cross-domain edges (uDashed == 1)
//
// Uniforms:
//   uColor:     vec3  — category color of the source node (linear-ish sRGB)
//   uTime:      float — seconds, monotonic
//   uFlowSpeed: float — per-second fraction of tube length (e.g. 0.3 ≈
//                       one revolution every 3.3 s)
//   uActive:    float — 0..1 smoothed focus state
//   uDashed:    float — 0 or 1; when 1, soft-dashed for cross-domain edges
//
// TubeGeometry's UVs run u along the tube's length (0 → 1) and v around
// its cross-section — so `vUv.x` is exactly what we need to scroll.
// ---------------------------------------------------------------------------

precision highp float;

uniform vec3  uColor;
uniform float uTime;
uniform float uFlowSpeed;
uniform float uActive;
uniform float uDashed;

varying vec2 vUv;

void main() {
  // Scrolling gradient: fract wraps to [0, 1); cubic tip sharpens the
  // bright crest so the energy reads as a discrete pulse, not a wash.
  float t = fract(vUv.x - uTime * uFlowSpeed);
  vec3  color = uColor * (0.3 + 0.7 * pow(t, 3.0));

  // Base alpha step: inactive edges are nearly invisible (0.06), active
  // ones nearly opaque (0.95). Linear blend by uActive so smoothing via
  // maath/damp on the JS side produces a clean fade.
  float alpha = uActive * 0.95 + (1.0 - uActive) * 0.06;

  // Dash pattern — 12 dashes across the length with soft edges (smoothstep)
  // so we don't get aliased gap boundaries at low zoom levels. `mix`
  // blends between full-line (uDashed=0) and dashed (uDashed=1).
  float dashPattern = smoothstep(0.45, 0.55, fract(vUv.x * 12.0));
  float dashMask    = mix(1.0, dashPattern, uDashed);

  gl_FragColor = vec4(color, alpha * dashMask);
}

// neuron.frag.glsl
// ---------------------------------------------------------------------------
// Fragment shader for the neural core. Produces a soft, glowing icosahedron
// with:
//   - Base emissive = uColor * (0.6 + uPulse * 2.5)
//       Lifts the node from a dim resting tone up to a bright flash when
//       `fire()` sets pulse to 1.
//   - Rim factor = pow(1 - max(dot(vNormal, vViewDir), 0), 2.2)
//       Classical Fresnel-style rim that lights the silhouette.
//   - Rim color leans toward white so edges glow hot against the base.
//   - Final multiplier = 0.7 + uState * 0.6
//       Globally brightens the node as it activates (idle → active).
//
// Uniforms:
//   uColor: vec3  — category color (linear-ish sRGB)
//   uPulse: float — instant 0..1 envelope (firing)
//   uState: float — 0 idle → 1 active (steady brightness)
//
// `uTime` and `uNoiseAmp` are consumed by the vertex shader only but live on
// the same shared material's uniforms object.
// ---------------------------------------------------------------------------

precision highp float;

uniform vec3  uColor;
uniform float uPulse;
uniform float uState;

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  // Emissive: base tint lifted heavily by uPulse.
  vec3 baseEmissive = uColor * (0.6 + uPulse * 2.5);

  // Rim color: brighten toward white so silhouettes catch a hot glow while
  // still tinted to the node's category.
  vec3 rimColor = mix(uColor, vec3(1.0), 0.65);

  // Fresnel-style rim factor in [0, 1].
  float rim = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.2);

  // Composite: interior shows base emissive, edges pick up the rim color.
  // Final multiplier tracks activation state.
  vec3 color = mix(baseEmissive, rimColor, rim) * (0.7 + uState * 0.6);

  gl_FragColor = vec4(color, 1.0);
}

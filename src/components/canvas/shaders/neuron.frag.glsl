// neuron.frag.glsl — white-hot bioluminescent neural core
precision highp float;

uniform vec3  uColor;
uniform float uPulse;
uniform float uState;

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  // Fresnel rim factor — 0 at face center, 1 at silhouette edge.
  float NdotV = max(dot(vNormal, vViewDir), 0.0);
  float rim   = pow(1.0 - NdotV, 2.0);
  float face  = 1.0 - rim;

  // Restrained — graph nodes integrate into the composition rather than
  // dominate. Dim base, brighter on hover/active via uState/uPulse.
  vec3 coreWhite = vec3(1.1, 1.1, 1.3);
  vec3 bodyColor = uColor * 0.85;
  vec3 rimColor  = mix(uColor, vec3(0.3, 0.4, 1.0), 0.5) * 0.7;

  // Blend from category body → white center → blue rim outward.
  vec3 color = mix(rimColor, bodyColor, smoothstep(0.0, 0.5, face));
  color      = mix(color, coreWhite,   smoothstep(0.4, 1.0, face));

  // Activation/pulse lift — only really bright when interacting.
  float boost = 1.0 + uState * 0.6 + uPulse * 1.8;
  color *= boost;

  gl_FragColor = vec4(color, 1.0);
}

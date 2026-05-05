// halo.frag.glsl — bioluminescent node aura
precision highp float;

uniform vec3  uColor;
uniform float uPulse;
uniform float uOpacity;

varying vec2 vUv;

void main() {
  // Distance from quad center [0..1] across half-width.
  float d = length(vUv - 0.5) * 2.0;

  // Three-layer radial structure matching the reference image:
  //   1. Tight white-hot core   (d < 0.15) — blinding center
  //   2. Mid color corona       (d < 0.45) — category color bloom
  //   3. Wide soft aura         (d < 1.0)  — outer diffuse glow
  float core   = smoothstep(0.18, 0.0,  d);
  float corona = smoothstep(0.50, 0.05, d);
  float aura   = smoothstep(1.0,  0.0,  d);

  // White-hot center blending to category color outward.
  vec3 coreColor   = vec3(1.0);                           // pure white
  vec3 coronaColor = mix(uColor, vec3(1.0), 0.5);         // half-white
  vec3 auraColor   = uColor;                              // full category color

  vec3 color = coreColor   * core   * 1.6   // soft white center
             + coronaColor * corona * 0.9   // mid corona
             + auraColor   * aura   * 0.45; // soft outer glow

  // Pulse adds a moderate flash on firing (not a supernova).
  color *= (1.0 + uPulse * 2.0);

  // Alpha: visible at core, falls off softly.
  float a = core * 0.85 + corona * 0.45 + aura * 0.15;
  a = clamp(a, 0.0, 1.0);

  gl_FragColor = vec4(color, a * uOpacity);
}

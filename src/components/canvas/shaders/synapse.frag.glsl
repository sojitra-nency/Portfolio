// synapse.frag.glsl — animated neural synapse connection
precision highp float;

uniform vec3  uColor;
uniform float uTime;
uniform float uFlowSpeed;
uniform float uActive;
uniform float uDashed;

varying vec2 vUv;

void main() {
  float u = vUv.x; // 0→1 along tube length
  float v = vUv.y; // 0→1 around cross-section

  // ── 1. Travelling energy pulses ─────────────────────────────────────────
  // Two pulses offset in phase so they don't overlap — gives a sense of
  // continuous bidirectional signal flow.
  float pulse1 = fract(u - uTime * uFlowSpeed);
  float pulse2 = fract(u - uTime * uFlowSpeed * 0.6 + 0.5);

  // Sharp bright crest: smoothstep falloff so the tip is crisp, tail fades.
  float crest1 = pow(max(0.0, 1.0 - pulse1 * 6.0), 2.5);
  float crest2 = pow(max(0.0, 1.0 - pulse2 * 8.0), 3.0) * 0.5;
  float pulseGlow = clamp(crest1 + crest2, 0.0, 1.0);

  // ── 2. Slow breathing ambient glow ──────────────────────────────────────
  // Makes idle connections feel alive even without interaction.
  float breathe = 0.5 + 0.5 * sin(uTime * 1.2 + u * 3.14159);

  // ── 3. Cross-section rim glow ───────────────────────────────────────────
  // Brighter at tube edges (v near 0 or 1) → glowing tube effect.
  float rim = pow(abs(sin(v * 3.14159)), 0.4);

  // ── 4. Compose brightness ───────────────────────────────────────────────
  // Base: dim but visible ambient (0.25) + slow breathe modulation.
  // Pulse layer adds sharp bright crests on top.
  // Active state boosts everything and adds extra pulse intensity.
  float ambient   = 0.25 + 0.12 * breathe;
  float pulseFull = pulseGlow * (0.8 + 0.2 * uActive);
  float brightness = (ambient + pulseFull) * (0.7 + 0.3 * rim);
  brightness = clamp(brightness, 0.0, 1.5); // allow slight HDR bloom

  vec3 color = uColor * brightness;

  // ── 5. Alpha ────────────────────────────────────────────────────────────
  // Idle: 0.55 — clearly visible. Pulse crests spike to near-1.
  // Active: boosts base to 0.85 + full pulse opacity.
  float baseAlpha  = mix(0.55, 0.85, uActive);
  float pulseAlpha = pulseGlow * 0.45;
  float alpha = clamp(baseAlpha + pulseAlpha, 0.0, 1.0);

  // ── 6. Dashed pattern for cross-domain edges ────────────────────────────
  float dashPattern = smoothstep(0.35, 0.65, fract(u * 10.0));
  float dashMask    = mix(1.0, dashPattern, uDashed);

  gl_FragColor = vec4(color, alpha * dashMask);
}

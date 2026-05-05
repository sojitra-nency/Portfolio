// synapse.frag.glsl — glowing bioluminescent dendrite connection
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
  float pulse1 = fract(u - uTime * uFlowSpeed);
  float pulse2 = fract(u - uTime * uFlowSpeed * 0.6 + 0.5);
  float crest1 = pow(max(0.0, 1.0 - pulse1 * 6.0), 2.5);
  float crest2 = pow(max(0.0, 1.0 - pulse2 * 8.0), 3.0) * 0.5;
  float pulseGlow = clamp(crest1 + crest2, 0.0, 1.0);

  // ── 2. Slow breathing ambient glow ──────────────────────────────────────
  float breathe = 0.5 + 0.5 * sin(uTime * 1.2 + u * 3.14159);

  // ── 3. Cross-section shape: glowing tube with bright center spine ────────
  // v=0.5 is the top of the tube. Make the center spine very bright (like
  // the reference image's illuminated dendrite core).
  float distFromCenter = abs(v - 0.5); // 0 at center, 0.5 at edges
  float spine     = smoothstep(0.5, 0.0, distFromCenter);         // full tube fill
  float hotSpine  = smoothstep(0.15, 0.0, distFromCenter);        // bright center line
  float rimGlow   = smoothstep(0.5, 0.3, distFromCenter) * 0.4;   // edge glow

  // ── 4. Electric blue-violet dendrite color ───────────────────────────────
  // Force the color toward the reference image's electric blue regardless
  // of category color — dendrites are always cool blue, nodes are warm.
  vec3 dendBlue   = vec3(0.30, 0.42, 1.00); // electric blue
  vec3 dendViolet = vec3(0.45, 0.30, 1.00); // violet shift
  float colorShift = 0.5 + 0.5 * sin(u * 6.28 + uTime * 0.5);
  vec3  tubeColor  = mix(dendBlue, dendViolet, colorShift * 0.3);

  // ── 5. Compose brightness — restrained, atmospheric ─────────────────────
  float ambient    = 0.30 + 0.15 * breathe;
  float pulseFull  = pulseGlow * (0.5 + 0.6 * uActive);
  float brightness = (ambient + pulseFull) * spine
                   + hotSpine * 0.8
                   + rimGlow * 0.5;
  brightness = clamp(brightness, 0.0, 2.0);

  // Subtle white-hot bleed only when active.
  vec3 color = mix(tubeColor * brightness, vec3(brightness), hotSpine * 0.25 * uActive);

  // ── 6. Alpha — visible but soft ──────────────────────────────────────────
  float baseAlpha = mix(0.55, 0.85, uActive);
  float alpha     = clamp(baseAlpha * spine + pulseGlow * 0.2, 0.0, 1.0);

  // ── 7. Dashed pattern for cross-domain edges ─────────────────────────────
  float dashPattern = smoothstep(0.35, 0.65, fract(u * 10.0));
  float dashMask    = mix(1.0, dashPattern, uDashed);

  gl_FragColor = vec4(color, alpha * dashMask);
}

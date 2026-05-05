// dendrite.frag.glsl — bioluminescent dendrite glow
// ---------------------------------------------------------------------------
// Renders thick glowing tubes that fade from bright violet (near origin) to
// dim violet (at tips). A bright white-hot spine runs along v=0.5 (the
// longitudinal center of the tube) and outputs HDR values >1 so bloom
// catches it. A subtle flowing pulse travels outward along U.
// ---------------------------------------------------------------------------

precision highp float;

uniform float uTime;

varying vec2  vUv;
varying float vDist;

// Maximum distance — used to normalise vDist into [0,1]. Branches longer
// than this still render; they just plateau at the dimmest brightness.
const float MAX_DIST = 220.0;

// Brightness floor at the tips so they're still visible (matches the
// reference image — every branch tip has a faint glow).
const float TIP_FLOOR = 0.45;

void main() {
  float u = vUv.x; // 0→1 along tube length
  float v = vUv.y; // 0→1 around cross-section

  // Cross-section profile — tube fills entirely with bright color, with
  // a hot center spine and softer rim at edges.
  float distFromCenter = abs(v - 0.5);                    // 0 at spine, 0.5 at rim
  float fill           = smoothstep(0.5, 0.0, distFromCenter);  // 1 at spine, 0 at rim
  float spine          = smoothstep(0.18, 0.0, distFromCenter); // bright core line
  float hotSpine       = smoothstep(0.06, 0.0, distFromCenter); // white-hot center

  // Distance-based attenuation: bright near core, dim at tips.
  float distNorm = clamp(vDist / MAX_DIST, 0.0, 1.0);
  float distFade = mix(1.0, TIP_FLOOR, smoothstep(0.0, 1.0, distNorm));

  // Travelling pulse — a soft bright wavefront moving outward from origin.
  float pulse  = fract(distNorm * 2.0 - uTime * 0.25);
  float crest  = pow(max(0.0, 1.0 - pulse * 4.0), 2.0);

  // Pure violet (no pink shift) matching the reference image.
  // Near origin: deeper violet. Toward tips: lighter lavender.
  vec3 violetBase = vec3(0.42, 0.34, 0.91);  // #6B57E8 — deep violet
  vec3 violetMid  = vec3(0.53, 0.44, 1.00);  // #8870FF — primary
  vec3 violetTip  = vec3(0.66, 0.56, 1.00);  // #A990FF — light lavender
  vec3 tubeColor  = mix(violetBase, violetMid, smoothstep(0.0, 0.4, distNorm));
  tubeColor       = mix(tubeColor,  violetTip, smoothstep(0.5, 1.0, distNorm));

  // Brightness composition — restrained, atmospheric (not blinding).
  float ambient    = 0.45 * fill;
  float spineBoost = 0.85 * spine;
  float hotBoost   = 1.30 * hotSpine;
  float pulseBoost = 0.45 * crest * spine;
  float brightness = (ambient + spineBoost + pulseBoost) * distFade + hotBoost * distFade;

  // Soft white-hot bleed at the spine (kept subtle).
  vec3 color = mix(tubeColor * brightness, vec3(brightness), hotSpine * 0.35);

  // Alpha — visible but soft so dendrites read as a delicate veil.
  float alpha = clamp(fill * 0.55 + spine * 0.20, 0.0, 1.0) * mix(0.5, 1.0, distFade);

  gl_FragColor = vec4(color, alpha);
}

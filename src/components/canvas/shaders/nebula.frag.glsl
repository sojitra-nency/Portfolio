// nebula.frag.glsl
// ---------------------------------------------------------------------------
// Background nebula for the Neural View. Screen-space fragment shader that
// runs on a full-bleed plane at z = -500. Three-octave simplex noise is
// warped by another noise layer and layered over the --void color, with a
// subtle cyan/magenta tint. Intensity is capped at 0.15 total and
// brightened by uActivity (0 idle → 1 while any neuron is active).
// ---------------------------------------------------------------------------

precision highp float;

uniform float uTime;
uniform float uActivity;
uniform vec2  uResolution;

// ---------------------------------------------------------------------------
// Ashima 2D simplex noise — public domain.
// https://github.com/ashima/webgl-noise
// ---------------------------------------------------------------------------

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4( 0.211324865405187,  // (3 - sqrt(3)) / 6
                       0.366025403784439,  // 0.5 * (sqrt(3) - 1)
                      -0.577350269189626,  // -1 + 2 * C.x
                       0.024390243902439); // 1 / 41
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                 + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                          dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// ---------------------------------------------------------------------------
// 3-octave fractional Brownian motion
// ---------------------------------------------------------------------------

float fbm(vec2 p) {
  float v = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 3; i++) {
    v += amplitude * snoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return v;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

void main() {
  // Screen-space UVs mapped to [-1, 1], aspect-corrected so the nebula
  // pattern doesn't stretch on ultrawide displays.
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 p  = uv * 2.0 - 1.0;
  p.x    *= uResolution.x / uResolution.y;

  // Warp the coordinate space with another noise layer — gives the nebula
  // its drifting, cloud-like feel instead of static mountains.
  vec2 warp = vec2(
    fbm(p * 1.5 + vec2(uTime * 0.020, 0.000)),
    fbm(p * 1.5 + vec2(0.000, uTime * 0.025))
  ) * 0.6;

  // Density in [0, 1] after remapping the signed fbm result.
  float density = fbm(p * 1.2 + warp + uTime * 0.010);
  density = smoothstep(-0.25, 0.80, density);

  // Brand palette as vec3s.
  vec3 voidColor = vec3(0.016, 0.020, 0.055); // --void
  vec3 cyan      = vec3(0.000, 0.941, 1.000); // #00F0FF
  vec3 magenta   = vec3(1.000, 0.000, 0.898); // #FF00E5

  // Spatial tint variation — some regions lean cyan, others magenta.
  float tintMix    = smoothstep(0.1, 0.9, fbm(p * 0.5 + 12.34));
  vec3  nebulaTint = mix(cyan, magenta, tintMix);

  // Intensity envelope: capped at 0.15 total, lifted from 0.06 → 0.15 by
  // uActivity so the whole substrate "wakes up" when a neuron is focused.
  float baseIntensity = 0.06 + uActivity * 0.09;
  vec3  color = voidColor + nebulaTint * baseIntensity * density;

  gl_FragColor = vec4(color, 1.0);
}

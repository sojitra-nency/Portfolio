// dendrite.vert.glsl — bioluminescent dendrite branches
// Standard MVP transform; passes UV (length × cross-section) and
// per-vertex distance-from-origin attribute to the fragment.

attribute float aDist;

varying vec2 vUv;
varying float vDist;

void main() {
  vUv = uv;
  vDist = aDist;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

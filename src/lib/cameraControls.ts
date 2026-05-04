/**
 * Shared camera control signals — written by UI buttons, read by CinemaCamera
 * each frame. Using a plain object ref avoids Zustand overhead for
 * high-frequency per-frame reads.
 */

export const cameraSignals = {
  /** Pending zoom delta to apply next frame (world units, + = zoom out). */
  zoomDelta: 0,
  /** If true, reset to ambient pose next frame. */
  resetRequested: false,
  /** If true, fit entire galaxy (max zoom out) next frame. */
  fitRequested: false,
};

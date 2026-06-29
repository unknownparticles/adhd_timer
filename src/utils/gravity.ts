import { TimerDirection, DeviceFaceState } from "../types";

/**
 * Normalizes device orientation angles (beta, gamma) and maps them to a DeviceFaceState
 * and a TimerDirection.
 * 
 * Beta (pitch): -180 to 180. 0 is flat face-up, 90 is upright, -90 is upside-down.
 * Gamma (roll): -90 to 90. 0 is flat face-up, -90 is tilted left, 90 is tilted right.
 */
export function classifyDeviceState(beta: number, gamma: number): {
  faceState: DeviceFaceState;
  direction: TimerDirection | null;
} {
  const absBeta = Math.abs(beta);
  const absGamma = Math.abs(gamma);

  // 1. Detect Face Down (倒扣 / Screen facing table)
  // When a phone is lying flat face down:
  // - beta is near 180 or -180, or
  // - gamma is near 180 or -180 (some platforms limit gamma to -90..90, so beta is key).
  if (absBeta > 145 || (absBeta < 35 && absGamma > 75 && Math.abs(absGamma - 180) < 35)) {
    return { faceState: DeviceFaceState.FACE_DOWN, direction: null };
  }

  // 2. Detect Face Up (翻面 / Screen facing ceiling)
  // When lying flat face up:
  // - beta and gamma are both close to 0.
  if (absBeta < 25 && absGamma < 25) {
    return { faceState: DeviceFaceState.FACE_UP, direction: null };
  }

  // 3. Tilted (In one of the 4 directions)
  // We determine direction based on which axis has the stronger tilt.
  let direction: TimerDirection | null = null;

  // Let's decide which is stronger: pitch (portrait) or roll (landscape)
  if (absBeta > absGamma) {
    // Portrait orientation
    if (beta > 30) {
      // Tilted forward (Held upright)
      direction = TimerDirection.PORTRAIT_UP;
    } else if (beta < -30) {
      // Tilted backward (Held upside-down)
      direction = TimerDirection.PORTRAIT_DOWN;
    }
  } else {
    // Landscape orientation
    if (gamma > 30) {
      // Tilted to the right
      direction = TimerDirection.LANDSCAPE_RIGHT;
    } else if (gamma < -30) {
      // Tilted to the left
      direction = TimerDirection.LANDSCAPE_LEFT;
    }
  }

  return {
    faceState: DeviceFaceState.TILTED,
    direction: direction
  };
}

/**
 * Alternative classification using acceleration including gravity values (x, y, z in m/s²)
 */
export function classifyDeviceStateFromGravity(x: number, y: number, z: number): {
  faceState: DeviceFaceState;
  direction: TimerDirection | null;
} {
  const threshold = 6.5; // m/s² (gravity is ~9.8 m/s²)

  // z represents perpendicular force to the screen.
  // Positive z: gravity pulling through screen (Face Up).
  // Negative z: gravity pulling through back (Face Down).
  if (z > threshold) {
    return { faceState: DeviceFaceState.FACE_UP, direction: null };
  }
  if (z < -threshold) {
    return { faceState: DeviceFaceState.FACE_DOWN, direction: null };
  }

  let direction: TimerDirection | null = null;

  // If phone is upright or tilted sideways, z is small. Let's compare x and y.
  if (Math.abs(y) > Math.abs(x)) {
    // Portrait
    if (y > 3.0) {
      direction = TimerDirection.PORTRAIT_UP;
    } else if (y < -3.0) {
      direction = TimerDirection.PORTRAIT_DOWN;
    }
  } else {
    // Landscape
    if (x > 3.0) {
      direction = TimerDirection.LANDSCAPE_LEFT;
    } else if (x < -3.0) {
      direction = TimerDirection.LANDSCAPE_RIGHT;
    }
  }

  return {
    faceState: DeviceFaceState.TILTED,
    direction: direction
  };
}

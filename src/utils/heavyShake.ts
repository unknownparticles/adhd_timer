/** A three-axis acceleration sample measured in m/s². */
export interface AccelerationSample {
  x: number;
  y: number;
  z: number;
}

const STRONG_CHANGE_THRESHOLD = 15;
const MAX_SHAKE_DURATION_MS = 800;
const MAX_SAMPLE_GAP_MS = 250;
const REQUIRED_DIRECTION_REVERSALS = 2;
const REVERSAL_COSINE_THRESHOLD = -0.5;

interface TimedAccelerationSample {
  acceleration: AccelerationSample;
  timestamp: number;
}

/** Detects whether motion samples contain a deliberate heavy shake. */
export class HeavyShakeDetector {
  private previousSample: TimedAccelerationSample | null = null;
  private previousStrongChange: AccelerationSample | null = null;
  private shakeStartedAt: number | null = null;
  private directionReversals = 0;

  /**
   * Adds one motion sample and reports whether this sample completes a heavy shake.
   * Invalid samples and isolated movements never trigger the detector.
   */
  addSample(sample: AccelerationSample, timestamp: number): boolean {
    if (!this.isValidSample(sample) || !Number.isFinite(timestamp)) {
      return false;
    }

    const currentSample = { acceleration: sample, timestamp };
    if (!this.previousSample) {
      this.previousSample = currentSample;
      return false;
    }

    const sampleGap = timestamp - this.previousSample.timestamp;
    if (sampleGap <= 0 || sampleGap > MAX_SAMPLE_GAP_MS) {
      this.previousSample = currentSample;
      this.resetShakeSequence();
      return false;
    }

    const change = this.subtract(sample, this.previousSample.acceleration);
    this.previousSample = currentSample;

    const changeStrength = this.length(change);
    if (changeStrength < STRONG_CHANGE_THRESHOLD) {
      if (
        this.shakeStartedAt !== null &&
        timestamp - this.shakeStartedAt > MAX_SHAKE_DURATION_MS
      ) {
        this.resetShakeSequence();
      }
      return false;
    }

    if (
      this.shakeStartedAt === null ||
      timestamp - this.shakeStartedAt > MAX_SHAKE_DURATION_MS
    ) {
      this.shakeStartedAt = timestamp;
      this.previousStrongChange = change;
      this.directionReversals = 0;
      return false;
    }

    if (this.previousStrongChange && this.isOppositeDirection(change, this.previousStrongChange)) {
      this.directionReversals += 1;
    }
    this.previousStrongChange = change;

    if (this.directionReversals >= REQUIRED_DIRECTION_REVERSALS) {
      this.resetShakeSequence();
      return true;
    }

    return false;
  }

  private isValidSample(sample: AccelerationSample): boolean {
    return Number.isFinite(sample.x) && Number.isFinite(sample.y) && Number.isFinite(sample.z);
  }

  private subtract(
    current: AccelerationSample,
    previous: AccelerationSample,
  ): AccelerationSample {
    return {
      x: current.x - previous.x,
      y: current.y - previous.y,
      z: current.z - previous.z,
    };
  }

  private length(sample: AccelerationSample): number {
    return Math.sqrt(sample.x ** 2 + sample.y ** 2 + sample.z ** 2);
  }

  private isOppositeDirection(
    current: AccelerationSample,
    previous: AccelerationSample,
  ): boolean {
    const dotProduct = current.x * previous.x + current.y * previous.y + current.z * previous.z;
    const directionSimilarity = dotProduct / (this.length(current) * this.length(previous));

    // A negative cosine means the motion changed direction; -0.5 avoids counting sideways noise.
    return directionSimilarity <= REVERSAL_COSINE_THRESHOLD;
  }

  private resetShakeSequence(): void {
    this.previousStrongChange = null;
    this.shakeStartedAt = null;
    this.directionReversals = 0;
  }
}

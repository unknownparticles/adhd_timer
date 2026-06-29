import { AppSettings } from "../types";

/**
 * Triggers physical device vibration feedback based on settings and API support.
 * Safely falls back if the Vibration API is not supported (like on iOS Safari).
 */
export function triggerVibrate(pattern: number | number[], settings: AppSettings) {
  if (settings.vibrationEnabled && typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn("Physical vibration feedback blocked or failed:", e);
    }
  }
}

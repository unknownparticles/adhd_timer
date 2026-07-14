/**
 * Reports whether the current countdown second should play the regular reminder.
 * The finish second is reserved for the distinct completion melody.
 */
export function shouldPlayRegularReminder(
  remainingSeconds: number,
  totalSeconds: number,
  intervalSeconds: number,
): boolean {
  if (remainingSeconds <= 0 || totalSeconds <= 0) {
    return false;
  }

  const elapsedSeconds = totalSeconds - remainingSeconds;
  if (elapsedSeconds <= 0) {
    return false;
  }

  const safeInterval = Number.isFinite(intervalSeconds)
    ? Math.max(1, Math.round(intervalSeconds))
    : 1;

  return elapsedSeconds % safeInterval === 0;
}

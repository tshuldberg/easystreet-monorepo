/**
 * Formats countdown intervals into human-readable strings.
 * Ported from CountdownFormatter.swift.
 */

/**
 * Format a time interval into a human-readable countdown string.
 * @param intervalSeconds - Seconds until sweep starts. Negative means sweep has started or passed.
 * @param sweepDurationSeconds - Duration of the sweep in seconds. Used to detect in-progress vs completed.
 * @returns Formatted countdown string.
 */
export function formatCountdown(
    intervalSeconds: number,
    sweepDurationSeconds: number = 0,
): string {
    if (intervalSeconds <= 0) {
        if (sweepDurationSeconds > 0 && Math.abs(intervalSeconds) < sweepDurationSeconds) {
            return "Sweeping in progress";
        } else if (intervalSeconds === 0) {
            return "Sweeping in progress";
        } else {
            return "Sweep completed";
        }
    }

    const totalSeconds = Math.floor(intervalSeconds);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (totalSeconds >= 86400) {
        return `${days}d ${hours}h remaining`;
    } else if (totalSeconds >= 3600) {
        return `${hours}h ${minutes}m remaining`;
    } else {
        return `${minutes}m ${seconds}s remaining`;
    }
}

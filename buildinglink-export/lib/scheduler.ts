/**
 * Scheduler utilities.
 * The actual cron execution is done by a background worker (worker.ts).
 * This module provides helpers used by the API.
 */

/**
 * Given a cron pattern, compute the next run time.
 * This is a simple approximation — uses date arithmetic for common patterns.
 */
export function getNextRun(cronPattern: string): Date {
  // For a proper implementation use the `cron-parser` library.
  // This basic version handles daily/hourly patterns.
  const now = new Date()
  const parts = cronPattern.split(" ")
  if (parts.length !== 5) return new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const [minute, hour] = parts
  const next = new Date(now)
  next.setSeconds(0, 0)
  next.setMinutes(Number(minute) || 0)
  next.setHours(Number(hour) || 2)

  if (next <= now) {
    next.setDate(next.getDate() + 1)
  }
  return next
}

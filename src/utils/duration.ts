/**
 * Duration parsing and formatting helpers.
 *
 * Users enter free-form durations ("30 min", "1 hour", "1h 30m", "2 hours").
 * Internally we always store the value as minutes.
 */

const HOUR_MINUTES = 60;
const DAY_MINUTES = 24 * HOUR_MINUTES;

// Matches sequences like "1h 30m", "2 hours", "45 min", "1.5 h", "1 day"
// Units are ordered longest-first so "min" isn't captured as "m"
const DURATION_TOKEN_RE = /(\d+(?:\.\d+)?)\s*(minutes|minute|mins|min|m|hours|hour|hrs|hr|h|days|day|d)/gi;

/**
 * Parse a free-form duration string into total minutes.
 * Returns null when the string is empty or not parseable.
 *
 * Examples:
 *   "30 min"      -> 30
 *   "1 hour"      -> 60
 *   "2 hours"     -> 120
 *   "1h 30m"      -> 90
 *   "1.5 h"       -> 90
 *   "1 day"       -> 1440
 *   "garbage"     -> null
 *   ""            -> null
 */
export function parseDurationToMinutes(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const tokens = trimmed.match(DURATION_TOKEN_RE);
  if (!tokens) return null;

  // Reject inputs with leftover unparsed content (e.g. "1h banana")
  const parsedLength = tokens.join('').replace(/\s+/g, '').length;
  const inputLength = trimmed.replace(/\s+/g, '').length;
  if (parsedLength !== inputLength) return null;

  let totalMinutes = 0;
  for (const token of tokens) {
    const match = token.match(/(\d+(?:\.\d+)?)\s*([a-z]+)/i);
    if (!match) return null;

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    if (unit.startsWith('h')) {
      totalMinutes += value * HOUR_MINUTES;
    } else if (unit.startsWith('d')) {
      totalMinutes += value * DAY_MINUTES;
    } else {
      totalMinutes += value; // minutes
    }
  }

  if (!isFinite(totalMinutes) || totalMinutes <= 0) return null;
  return Math.round(totalMinutes);
}

/**
 * Format minutes as a compact human-readable duration.
 * Examples:
 *   90   -> "1h 30m"
 *   45   -> "45m"
 *   60   -> "1h"
 *   0    -> ""
 *   undefined -> ""
 */
export function formatMinutesAsDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return '';

  const days = Math.floor(minutes / DAY_MINUTES);
  const hours = Math.floor((minutes % DAY_MINUTES) / HOUR_MINUTES);
  const mins = minutes % HOUR_MINUTES;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  return parts.join(' ');
}

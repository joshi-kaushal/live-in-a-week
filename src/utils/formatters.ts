/**
 * Format display text utilities
 */

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format energy level for display
 */
export function formatEnergyLevel(level: 'low' | 'medium' | 'high'): string {
  return capitalize(level);
}

/**
 * Format priority for display
 */
export function formatPriority(priority: 'low' | 'medium' | 'high'): string {
  return capitalize(priority);
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

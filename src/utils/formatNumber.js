/**
 * Number formatting utilities for consistent display
 */

/**
 * Format integer with thin space as thousands separator
 * @param {number|string} n - The number to format
 * @returns {string} Formatted number
 */
export const formatInt = (n) => {
  if (n === null || n === undefined) return '0';
  const num = typeof n === 'string' ? parseInt(n, 10) : n;
  if (isNaN(num)) return '0';
  return num.toLocaleString('sv-SE').replace(/\s/g, '\u2009'); // thin space
};

/**
 * Format percentage
 * @param {number|string} n - The number to format as percentage
 * @returns {string} Formatted percentage
 */
export const formatPercent = (n) => {
  if (n === null || n === undefined) return '0 %';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '0 %';
  return num.toFixed(0) + ' %';
};

/**
 * Format score (0-100)
 * @param {number|string} score - The score to format
 * @returns {string} Formatted score
 */
export const formatScore = (score) => {
  if (score === null || score === undefined) return '0';
  const num = typeof score === 'string' ? parseFloat(score) : score;
  if (isNaN(num)) return '0';
  return Math.round(num).toString();
};

/**
 * Format word count properly (no "k" abbreviation for small numbers)
 * @param {number|string} count - The word count
 * @returns {string} Formatted word count
 */
export const formatWordCount = (count) => {
  if (count === null || count === undefined) return '0 ord';
  const num = typeof count === 'string' ? parseInt(count, 10) : count;
  if (isNaN(num)) return '0 ord';
  
  if (num === 0) return '0 ord';
  if (num === 1) return '1 ord';
  
  // Use thousands separator for large numbers
  return `${formatInt(num)} ord`;
};
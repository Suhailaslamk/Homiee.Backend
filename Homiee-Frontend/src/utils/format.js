/**
 * Centralized formatting utilities for the Homiee premium design system.
 */

/**
 * Formats a number as Indian Rupee (INR) currency.
 * @param {number|string} value - The amount to format.
 * @param {boolean} includeCents - Whether to show decimal places (default false for clean premium look).
 * @returns {string}
 */
export function formatCurrency(value, includeCents = false) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeCents ? 2 : 0,
    minimumFractionDigits: includeCents ? 2 : 0,
  }).format(Number(value || 0));
}

/**
 * Formats a date into a sophisticated editorial style.
 * Example: 24 Oct 2023
 * @param {Date|string} date - The date to format.
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Formats a date and time into a precise log style.
 * Example: 24 Oct 2023, 10:30 AM
 * @param {Date|string} date - The date to format.
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(new Date(date));
}

/**
 * Formats a large number into a compact signal (e.g., 1.2k).
 * @param {number} value - The number to format.
 * @returns {string}
 */
export function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

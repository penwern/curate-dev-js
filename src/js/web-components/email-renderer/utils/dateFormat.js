/**
 * Format date for display
 * Shows relative time for recent dates, absolute for older
 */

/**
 * Format date for email list display
 * @param {string} isoDate - ISO 8601 date string
 * @returns {string} Formatted date
 */
export function formatEmailDate(isoDate) {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Today: show time
  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // Yesterday
  if (diffDays === 1) {
    return 'Yesterday';
  }

  // This week: show day name
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  // This year: show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Older: show full date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format full date for email detail view
 * @param {string} isoDate - ISO 8601 date string
 * @returns {string} Full formatted date with time and timezone
 */
export function formatFullDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
}
/**
 * Client-side search and filter utilities
 */

/**
 * Search emails by from, subject, and snippet
 * @param {Array} emails - Array of email objects
 * @param {string} query - Search query
 * @returns {Array} Filtered emails
 */
export function searchEmails(emails, query) {
  if (!query || query.trim() === '') {
    return emails;
  }

  const lowerQuery = query.toLowerCase().trim();

  return emails.filter(email => {
    const fromName = email.from.name?.toLowerCase() || '';
    const fromEmail = email.from.email?.toLowerCase() || '';
    const subject = email.subject?.toLowerCase() || '';
    const snippet = email.snippet?.toLowerCase() || '';

    return (
      fromName.includes(lowerQuery) ||
      fromEmail.includes(lowerQuery) ||
      subject.includes(lowerQuery) ||
      snippet.includes(lowerQuery)
    );
  });
}

/**
 * Sort emails
 * @param {Array} emails - Array of email objects
 * @param {string} sortBy - Sort field (date, from, subject)
 * @param {string} direction - Sort direction (asc, desc)
 * @returns {Array} Sorted emails
 */
export function sortEmails(emails, sortBy = 'date', direction = 'desc') {
  const sorted = [...emails].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date) - new Date(b.date);
        break;
      case 'from':
        comparison = (a.from.name || a.from.email).localeCompare(b.from.name || b.from.email);
        break;
      case 'subject':
        comparison = a.subject.localeCompare(b.subject);
        break;
      default:
        comparison = 0;
    }

    return direction === 'desc' ? -comparison : comparison;
  });

  return sorted;
}
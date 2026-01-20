import { html } from "lit";

/**
 * Search, filter, and text highlighting utilities.
 */

/**
 * Highlight matching text with a span wrapper.
 * Returns a Lit template array with highlighted portions.
 * @param {string} text - Text to highlight
 * @param {string} query - Search query to highlight
 * @returns {Array|string} - Array of Lit templates or original text
 */
export function highlightText(text, query) {
  if (!query || !text) return text;
  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
  const parts = text.split(regex);
  return parts.map((part) =>
    part.toLowerCase() === query.toLowerCase()
      ? html`<span class="search-highlight">${part}</span>`
      : part
  );
}

/**
 * Escape special regex characters in a string.
 * @param {string} str - String to escape
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Get match metadata for a node against a search query.
 * Returns which fields match the query.
 * @param {Object} node - Node to check
 * @param {string} query - Search query
 * @param {string} field - Field to search ('all', 'title', 'identifier', 'status', 'location')
 * @returns {Object} - Object with boolean values for each field
 */
export function getNodeMatchMetadata(node, query, field = "all") {
  const normalizedQuery = (query || "").toLowerCase();
  const matches = {
    title: false,
    identifier: false,
    status: false,
    location: false,
  };

  if (!normalizedQuery || !node) {
    return matches;
  }

  matches.title = (node.title || "").toLowerCase().includes(normalizedQuery);
  matches.identifier = (node.code || "").toLowerCase().includes(normalizedQuery);
  matches.status = (node.status || "").toLowerCase().includes(normalizedQuery);
  matches.location = (node.location || "").toLowerCase().includes(normalizedQuery);

  if (!field || field === "all") {
    return matches;
  }

  // Filter to only the requested field
  const filtered = {
    title: false,
    identifier: false,
    status: false,
    location: false,
  };
  const normalizedField = ["title", "identifier", "status", "location"].includes(field)
    ? field
    : "title";
  filtered[normalizedField] = matches[normalizedField];
  return filtered;
}

/**
 * Check if a node matches a search query in the specified field.
 * @param {Object} node - Node to check
 * @param {string} field - Field to search
 * @param {string} query - Search query (lowercase)
 * @returns {boolean}
 */
export function nodeMatchesSearchField(node, field, query) {
  const matchMetadata = getNodeMatchMetadata(node, query, field);
  return Object.values(matchMetadata).some(Boolean);
}

/**
 * Check if a collection matches a search query.
 * @param {Object} collection - Collection to check
 * @param {string} query - Search query (lowercase)
 * @param {string} field - Field to search ('all', 'title', 'identifier', 'subject', 'date')
 * @returns {boolean}
 */
export function matchesCollectionSearch(collection, query, field = "all") {
  if (!query) return true;
  const q = query.toLowerCase();

  switch (field) {
    case "title":
      return collection.title?.toLowerCase().includes(q);
    case "identifier":
      return collection.code?.toLowerCase().includes(q);
    case "subject":
      return (collection.subjects || []).some((subject) =>
        subject.toLowerCase().includes(q)
      );
    case "date":
      return collection.dateRange?.toLowerCase().includes(q);
    default:
      return (
        collection.title?.toLowerCase().includes(q) ||
        collection.code?.toLowerCase().includes(q) ||
        (collection.subjects || []).some((subject) =>
          subject.toLowerCase().includes(q)
        )
      );
  }
}

/**
 * Check if a repository matches a search query.
 * @param {Object} repo - Repository to check
 * @param {string} query - Search query (lowercase)
 * @param {string} field - Field to search ('all', 'name', 'code', 'location')
 * @returns {boolean}
 */
export function matchesRepositorySearch(repo, query, field = "all") {
  if (!query) return true;
  const q = query.toLowerCase();

  switch (field) {
    case "name":
      return repo.name?.toLowerCase().includes(q);
    case "code":
      return repo.code?.toLowerCase().includes(q);
    case "location":
      return repo.location?.toLowerCase().includes(q);
    default:
      return (
        repo.name?.toLowerCase().includes(q) ||
        repo.code?.toLowerCase().includes(q) ||
        repo.location?.toLowerCase().includes(q)
      );
  }
}

/**
 * Get label for a hierarchical level value.
 * @param {string} value - Level value
 * @returns {string}
 */
export function getLevelLabel(value) {
  switch (value) {
    case "collection":
      return "Collection";
    case "series":
      return "Series";
    case "subseries":
      return "Subseries";
    case "file":
      return "File";
    case "item":
      return "Item";
    default:
      return value;
  }
}

/**
 * Get label for a status value.
 * @param {string} value - Status value
 * @returns {string}
 */
export function getStatusLabel(value) {
  switch (value) {
    case "success":
      return "Available";
    case "warning":
      return "Needs Attention";
    case "error":
      return "Restricted";
    default:
      return value;
  }
}

/**
 * Tree traversal and manipulation utilities for ArchivesSpace hierarchy data.
 */

/**
 * Flatten a tree structure into a list with path information.
 * @param {Array} nodes - Array of tree nodes
 * @param {Array} path - Current path (for recursion)
 * @returns {Array<{node: Object, path: string[]}>}
 */
export function flattenTree(nodes = [], path = []) {
  if (!nodes) return [];
  let results = [];
  for (const node of nodes) {
    const currentPath = [...path, node.title];
    results.push({ node, path: currentPath });
    if (node.children && node.children.length) {
      results = results.concat(flattenTree(node.children, currentPath));
    }
  }
  return results;
}

/**
 * Find a node by ID in a tree structure.
 * @param {Array} nodes - Array of tree nodes
 * @param {string} id - Node ID to find
 * @returns {Object|null}
 */
export function findNode(nodes, id) {
  if (!nodes || !id) return null;
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Find a node by either its id or uri property.
 * @param {Array} nodes - Array of tree nodes
 * @param {string} identifier - Node ID or URI to find
 * @returns {Object|null}
 */
export function findNodeByLogicalId(nodes, identifier) {
  if (!identifier || !Array.isArray(nodes)) return null;
  const stack = [...nodes];
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    if (node.id === identifier || node.uri === identifier) {
      return node;
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        stack.push(child);
      }
    }
  }
  return null;
}

/**
 * Get breadcrumb path from root to a target node.
 * @param {Array} nodes - Array of tree nodes
 * @param {string} targetId - Target node ID
 * @param {Array} path - Current path (for recursion)
 * @returns {string[]}
 */
export function getBreadcrumbs(nodes, targetId, path = []) {
  if (!nodes || !targetId) return [];
  for (const node of nodes) {
    const currentPath = [...path, node.title];
    if (node.id === targetId) return currentPath;
    if (node.children) {
      const found = getBreadcrumbs(node.children, targetId, currentPath);
      if (found.length > 0) return found;
    }
  }
  return [];
}

/**
 * Collect all IDs of a node and its descendants.
 * @param {Object} node - Root node
 * @returns {string[]}
 */
export function collectNodeAndDescendants(node) {
  if (!node) return [];
  const ids = [];
  const stack = [node];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || !current.id) continue;
    ids.push(current.id);
    if (current.children && current.children.length) {
      for (const child of current.children) {
        stack.push(child);
      }
    }
  }
  return ids;
}

/**
 * Get visible tree rows based on expanded state.
 * Returns flat array of {node, depth, parentId} for virtualized rendering.
 * @param {Array} nodes - Array of tree nodes
 * @param {Set} expandedNodes - Set of expanded node IDs
 * @returns {Array<{node: Object, depth: number, parentId: string|null}>}
 */
export function getVisibleTreeRows(nodes = [], expandedNodes = new Set()) {
  const rows = [];
  const walk = (list, depth, parentId) => {
    if (!Array.isArray(list)) return;
    for (const node of list) {
      if (!node) continue;
      rows.push({ node, depth, parentId });
      if (
        expandedNodes &&
        expandedNodes.has(node.id) &&
        Array.isArray(node.children) &&
        node.children.length
      ) {
        walk(node.children, depth + 1, node.id);
      }
    }
  };
  walk(nodes, 0, null);
  return rows;
}

/**
 * Search tree nodes matching a query.
 * @param {Array} nodes - Array of tree nodes
 * @param {string} query - Search query (lowercase)
 * @param {Array} path - Current path (for recursion)
 * @param {Array} idPath - Current ID path (for recursion)
 * @param {string} field - Field to search ('all', 'title', 'identifier', 'status', 'location')
 * @param {Function} getMatchMetadata - Function to compute match metadata for a node
 * @returns {Array<{node: Object, path: string[], idPath: string[], matches: Object}>}
 */
export function searchTree(nodes, query, path = [], idPath = [], field = 'all', getMatchMetadata = null) {
  if (!nodes || !nodes.length || !query) return [];
  let results = [];
  for (const node of nodes) {
    const newPath = [...path, node.title];
    const newIdPath = [...idPath, node.id];

    // Use provided match function or default simple matching
    let matchMetadata;
    if (getMatchMetadata) {
      matchMetadata = getMatchMetadata(node, query, field);
    } else {
      matchMetadata = defaultMatchMetadata(node, query, field);
    }

    const matches = Object.values(matchMetadata).some(Boolean);

    if (matches) {
      results.push({ node, path: newPath, idPath: newIdPath, matches: matchMetadata });
    }

    if (node.children) {
      results = results.concat(searchTree(node.children, query, newPath, newIdPath, field, getMatchMetadata));
    }
  }
  return results;
}

/**
 * Default match metadata computation.
 * @param {Object} node - Node to check
 * @param {string} query - Search query (lowercase)
 * @param {string} field - Field to search
 * @returns {Object}
 */
function defaultMatchMetadata(node, query, field) {
  const normalizedQuery = (query || '').toLowerCase();
  const matches = {
    title: false,
    identifier: false,
    status: false,
    location: false,
  };

  if (!normalizedQuery || !node) return matches;

  matches.title = (node.title || '').toLowerCase().includes(normalizedQuery);
  matches.identifier = (node.code || '').toLowerCase().includes(normalizedQuery);
  matches.status = (node.status || '').toLowerCase().includes(normalizedQuery);
  matches.location = (node.location || '').toLowerCase().includes(normalizedQuery);

  if (!field || field === 'all') return matches;

  // Filter to only the requested field
  const filtered = {
    title: false,
    identifier: false,
    status: false,
    location: false,
  };
  const normalizedField = ['title', 'identifier', 'status', 'location'].includes(field)
    ? field
    : 'title';
  filtered[normalizedField] = matches[normalizedField];
  return filtered;
}

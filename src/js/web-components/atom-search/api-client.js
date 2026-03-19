/**
 * AtoM Search API Client
 * Handles all API interactions for AtoM archival description search and linking.
 */
class AtomSearchAPI {
  constructor() {
    this.searchUrl = `${window.location.protocol}//${window.location.hostname}/api/v1/atom/search`;
    this.atomUrl = null;
  }

  async getAuthToken() {
    return await PydioApi._PydioRestClient.getOrUpdateJwt();
  }

  /**
   * Fetch the configured AtoM instance URL
   * @returns {Promise<string>} The AtoM base URL
   */
  async getAtomUrl() {
    if (this.atomUrl) return this.atomUrl;
    const response = await Curate.api.fetchCurate("/api/v1/atom-configs", "GET");
    this.atomUrl = response.host;
    return this.atomUrl;
  }

  /**
   * Perform a search against the AtoM API
   * @param {Array<{query: string, field: string, operator: string}>} criteria - Search criteria
   * @param {number} page - Page number (1-based)
   * @param {number} resultsPerPage - Number of results per page
   * @returns {Promise<{results: Array, total: number}>} Search results and total count
   */
  async search(criteria, page = 1, resultsPerPage = 10) {
    const token = await this.getAuthToken();
    const params = new URLSearchParams();

    criteria.forEach((criterion, index) => {
      if (index > 0) {
        params.append(`so${index}`, criterion.operator);
      }
      params.append(`sq${index}`, criterion.query);
      params.append(`sf${index}`, criterion.field);
    });

    params.append("topLod", 0);
    params.append("skip", (page - 1) * resultsPerPage);

    const response = await fetch(`${this.searchUrl}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Search failed with status ${response.status}`);
    }

    return response.json();
  }

  /**
   * Link an AtoM description slug to a Curate node
   * @param {string} nodeUuid - The UUID of the node to link
   * @param {string} slug - The AtoM description slug
   * @returns {Promise<Object>} API response
   */
  async linkDescription(nodeUuid, slug) {
    const metaDatas = [
      {
        NodeUuid: nodeUuid,
        JsonValue: JSON.stringify(slug),
        Namespace: "usermeta-atom-linked-description",
        Policies: [
          { Action: "READ", Effect: "allow", Subject: "*" },
          { Action: "WRITE", Effect: "allow", Subject: "*" },
        ],
      },
    ];

    return Curate.api.fetchCurate("/a/user-meta/update", "PUT", {
      MetaDatas: metaDatas,
      Operation: "PUT",
    });
  }
}

export { AtomSearchAPI };

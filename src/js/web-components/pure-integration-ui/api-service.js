// api-service.js

class ApiService {
  constructor(baseUrl = `${window.location.origin}/api/v1`) {
    // Different port for Pure integration
    this.baseUrl = baseUrl;
  }

  async _makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, finalOptions);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Unknown error" }));
        throw new Error(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Pure API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this._makeRequest("/health");
  }

  // === PURE SEARCH AND HARVEST ===

  // Pure search (for UI preview)
  async searchPureRecords(searchQuery) {
    return this._makeRequest("/pure/search", {
      method: "POST",
      body: JSON.stringify({ search_query: searchQuery }),
    });
  }

  // Harvest operations
  async harvestByIds(recordUuids, summaryMessage = null) {
    return this._makeRequest("/harvest/uuids", {
      method: "POST",
      body: JSON.stringify({
        record_uuids: recordUuids,
        summary_message: summaryMessage,
      }),
    });
  }

  async harvestBySearch(searchQuery) {
    return this._makeRequest("/harvest/search", {
      method: "POST",
      body: JSON.stringify({ search_query: searchQuery }),
    });
  }

  async triggerAutomatedHarvest() {
    return this._makeRequest("/harvest/automated/trigger", {
      method: "POST",
    });
  }

  // Harvest monitoring
  async getHarvestHistory(limit = 50) {
    return this._makeRequest(`/harvest/history?limit=${limit}`);
  }

  async getHarvestStatus(jobId) {
    return this._makeRequest(`/harvest/status/${jobId}`);
  }

  // === WHITELIST MANAGEMENT ===

  // Get current whitelist
  async getWhitelist() {
    return this._makeRequest("/metadata/whitelist");
  }

  // Add fields to whitelist
  async addWhitelistFields(fieldNames, description = null) {
    return this._makeRequest("/metadata/whitelist/fields", {
      method: "POST",
      body: JSON.stringify({
        field_names: fieldNames,
        description: description,
      }),
    });
  }

  // Remove field from whitelist
  async removeWhitelistField(fieldName) {
    return this._makeRequest(
      `/metadata/whitelist/fields/${encodeURIComponent(fieldName)}`,
      {
        method: "DELETE",
      }
    );
  }

  // Reset whitelist to defaults
  async resetWhitelist() {
    return this._makeRequest("/metadata/whitelist/reset", {
      method: "PUT",
    });
  }

  // === DISCOVERED FIELDS QUEUE MANAGEMENT ===

  // Get discovered fields queue
  async getDiscoveredFieldsQueue(unreviwedOnly = true) {
    return this._makeRequest(
      `/metadata/discovered-fields?unreviewed_only=${unreviwedOnly}`
    );
  }

  // Review a single discovered field
  async reviewDiscoveredField(discoveredId, action, addToWhitelist = false) {
    return this._makeRequest("/metadata/discovered-fields/review", {
      method: "POST",
      body: JSON.stringify({
        discovered_id: discoveredId,
        action: action, // "whitelisted", "ignored", "pending"
        add_to_whitelist: addToWhitelist,
      }),
    });
  }

  // Bulk review discovered fields
  async bulkReviewDiscoveredFields(fieldNames, action, addToWhitelist = false) {
    return this._makeRequest("/metadata/discovered-fields/bulk-review", {
      method: "POST",
      body: JSON.stringify({
        field_names: fieldNames,
        action: action,
        add_to_whitelist: addToWhitelist,
      }),
    });
  }

  // Cleanup old reviewed discovered fields
  async cleanupDiscoveredFields(daysOld = 30) {
    return this._makeRequest(
      `/metadata/discovered-fields/cleanup?days_old=${daysOld}`,
      {
        method: "DELETE",
      }
    );
  }

  // === FIELD MAPPING (for whitelisted fields) ===

  // Field Discovery for whitelisted fields
  async discoverFields(sampleSize = 50) {
    return this._makeRequest("/metadata/discover-fields", {
      method: "POST",
      body: JSON.stringify({ sample_size: sampleSize }),
    });
  }

  // Get complete metadata mapping overview (whitelisted fields + mappings)
  async getMetadataMappingOverview() {
    return this._makeRequest("/metadata/mapping-overview");
  }

  // Save all mappings with three-state support (mapped/rejected/unmapped)
  async saveMetadataMappingsBulk(mappings) {
    return this._makeRequest("/metadata/mappings/bulk", {
      method: "POST",
      body: JSON.stringify({ mappings: mappings }),
    });
  }

  // Add individual mapping
  async addMetadataMapping(pureField, curateField, action = "mapped") {
    return this._makeRequest("/metadata/mappings/add", {
      method: "POST",
      body: JSON.stringify({
        pure_field: pureField,
        curate_field: curateField,
        action: action,
      }),
    });
  }

  // Delete individual mapping
  async deleteMetadataMapping(mappingId) {
    return this._makeRequest(`/metadata/mappings/${mappingId}`, {
      method: "DELETE",
    });
  }

  // === CACHED RECORDS MANAGEMENT ===

  // Get cached records waiting for field resolution
  async getCachedRecords() {
    return this._makeRequest("/metadata/cached-records");
  }

  // Process cached records manually
  async processCachedRecords() {
    return this._makeRequest("/metadata/process-cached-records", {
      method: "POST",
    });
  }

  // === CONFIGURATION ===

  // Get automated harvest configuration
  async getAutomatedHarvestConfig() {
    return this._makeRequest("/config/automated-harvest");
  }

  // Save automated harvest configuration
  async saveAutomatedHarvestConfig(criteriaJson, isEnabled = true) {
    return this._makeRequest("/config/automated-harvest", {
      method: "POST",
      body: JSON.stringify({
        criteria_json: criteriaJson,
        is_enabled: isEnabled,
      }),
    });
  }

  // === PURE-SPECIFIC ENDPOINTS ===

  // Get Pure organizations for filtering
  async getPureOrganizations() {
    return this._makeRequest("/pure/organizations");
  }

  // Get Pure research output types
  async getPureResearchOutputTypes() {
    return this._makeRequest("/pure/research-output-types");
  }

  // Test Pure API connection
  async testPureConnection() {
    return this._makeRequest("/pure/connection-test");
  }

  // === SYSTEM STATISTICS ===

  // Get system statistics
  async getSystemStats() {
    return this._makeRequest("/system/stats");
  }

  // === BACKWARD COMPATIBILITY (if needed) ===

  // Keep some methods for compatibility with existing code patterns
  async getDiscoveredFields() {
    // For Pure, this returns whitelisted fields that have been seen
    const overview = await this.getMetadataMappingOverview();
    return overview.discovered_pure_fields || [];
  }

  async getMetadataMappings() {
    const overview = await this.getMetadataMappingOverview();
    return overview.field_mappings || {};
  }

  // Legacy single mapping save (use bulk instead)
  async saveMetadataMapping(
    pureField,
    curateField,
    transformationLogic = null
  ) {
    const mappings = {};
    if (curateField) {
      mappings[pureField] = {
        action: "mapped",
        curate_field: curateField,
      };
    } else {
      mappings[pureField] = {
        action: "rejected",
        curate_field: null,
      };
    }
    return this.saveMetadataMappingsBulk(mappings);
  }
}

export default ApiService;

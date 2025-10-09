// api-service.js
class ApiService {
  constructor(baseUrl = `${window.location.origin}/api/calm`) {
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

      if (response.status === 204) {
        return { status: "success" };
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this._makeRequest("/health");
  }

  // CALM search (for UI preview)
  async searchCalmRecords(searchExpression) {
    return this._makeRequest("/calm/search", {
      method: "POST",
      body: JSON.stringify({ search_expression: searchExpression }),
    });
  }

  // Harvest operations
  async harvestByIds(recordIds, summaryMessage = null) {
    return this._makeRequest("/harvest/ids", {
      method: "POST",
      body: JSON.stringify({
        record_ids: recordIds,
        summary_message: summaryMessage,
      }),
    });
  }

  async harvestBySearch(searchExpression) {
    return this._makeRequest("/harvest/search", {
      method: "POST",
      body: JSON.stringify({ search_expression: searchExpression }),
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

  // === WHITELISTED METADATA WORKFLOW ===

  // Field discovery runs GetMetadata under the hood (100% coverage)
  async discoverFields(sampleSize = 50) {
    return this._makeRequest("/metadata/discover-fields", {
      method: "POST",
      body: JSON.stringify({ sample_size: sampleSize }),
    });
  }

  // Fetch the current whitelist with descriptions
  async getWhitelist() {
    return this._makeRequest("/metadata/whitelist");
  }

  // Add a CALM field to the whitelist (optional description)
  async addToWhitelist(fieldName, description = null) {
    const params = new URLSearchParams({ field_name: fieldName });
    if (description) {
      params.append("description", description);
    }

    return this._makeRequest(`/metadata/whitelist/add?${params.toString()}`, {
      method: "POST",
    });
  }

  // Support Pure-style API by accepting an array of field names
  async addWhitelistFields(fieldNames, description = null) {
    const names = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
    let lastResponse = null;

    for (const rawName of names) {
      const trimmed = typeof rawName === "string" ? rawName.trim() : rawName;
      if (!trimmed) continue;
      lastResponse = await this.addToWhitelist(trimmed, description);
    }

    return lastResponse || { status: "success" };
  }

  // Remove a CALM field from the whitelist
  async removeFromWhitelist(fieldName) {
    const encodedField = encodeURIComponent(fieldName);
    return this._makeRequest(`/metadata/whitelist/${encodedField}`, {
      method: "DELETE",
    });
  }

  // Support Pure-style method name for compatibility
  async removeWhitelistField(fieldName) {
    return this.removeFromWhitelist(fieldName);
  }

  // Reset whitelist back to backend defaults (if supported)
  async resetWhitelist() {
    return this._makeRequest("/metadata/whitelist/reset", {
      method: "PUT",
    });
  }

  // Discovered fields queue helpers (whitelist workflow)
  async getDiscoveredFieldsQueue(unreviewedOnly = true) {
    return this._makeRequest(
      `/metadata/discovered-fields?unreviewed_only=${unreviewedOnly}`
    );
  }

  async reviewDiscoveredField(discoveredId, action, addToWhitelist = false) {
    return this._makeRequest("/metadata/discovered-fields/review", {
      method: "POST",
      body: JSON.stringify({
        discovered_id: discoveredId,
        action: action,
        add_to_whitelist: addToWhitelist,
      }),
    });
  }

  async bulkReviewDiscoveredFields(fieldNames, action, addToWhitelist = false) {
    const names = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
    return this._makeRequest("/metadata/discovered-fields/bulk-review", {
      method: "POST",
      body: JSON.stringify({
        field_names: names,
        action: action,
        add_to_whitelist: addToWhitelist,
      }),
    });
  }

  async cleanupDiscoveredFields(daysOld = 30) {
    return this._makeRequest(
      `/metadata/discovered-fields/cleanup?days_old=${daysOld}`,
      {
        method: "DELETE",
      }
    );
  }

  // Get whitelisted CALM fields, mapping status, and cached record info
  async getMetadataMappingOverview() {
    return this._makeRequest("/metadata/mapping-overview");
  }

  // Add individual metadata mapping (returns mapping_id)
  async addMetadataMapping(calmField, curateField, action = "mapped") {
    return this._makeRequest("/metadata/mappings/add", {
      method: "POST",
      body: JSON.stringify({
        calm_field: calmField,
        curate_field: curateField,
        action: action,
      }),
    });
  }

  // Delete individual metadata mapping by mapping_id
  async deleteMetadataMapping(mappingId) {
    return this._makeRequest(`/metadata/mappings/${mappingId}`, {
      method: "DELETE",
    });
  }

  // Save bulk metadata mappings (mapped/rejected/unmapped support)
  async saveMetadataMappingsBulk(mappings) {
    return this._makeRequest("/metadata/mappings/bulk", {
      method: "POST",
      body: JSON.stringify({ mappings: mappings }),
    });
  }

  // Cached records awaiting mapping resolutions
  async getCachedRecords() {
    return this._makeRequest("/metadata/cached-records");
  }

  async processCachedRecords() {
    return this._makeRequest("/metadata/process-cached-records", {
      method: "POST",
    });
  }

  // === BACKWARD COMPATIBILITY HELPERS ===
  async getDiscoveredFields() {
    return this._makeRequest("/metadata/fields");
  }

  async getMetadataMappings() {
    return this._makeRequest("/metadata/mappings");
  }

  async saveMetadataMapping(
    calmField,
    curateField,
    transformationLogic = null
  ) {
    return this._makeRequest("/metadata/mappings", {
      method: "POST",
      body: JSON.stringify({
        calm_field: calmField,
        curate_field: curateField,
        transformation_logic: transformationLogic,
      }),
    });
  }

  // Configuration
  async getAutomatedHarvestConfig() {
    return this._makeRequest("/config/automated-harvest");
  }

  async saveAutomatedHarvestConfig(criteriaJson, isEnabled = true) {
    return this._makeRequest("/config/automated-harvest", {
      method: "POST",
      body: JSON.stringify({
        criteria_json: criteriaJson,
        is_enabled: isEnabled,
      }),
    });
  }

  // System statistics
  async getSystemStats() {
    return this._makeRequest("/system/stats");
  }
}

export default ApiService;

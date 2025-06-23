/**
 * Preservation Config API Client
 * Handles all API interactions for preservation configurations
 */
class PreservationConfigAPI {
  constructor() {
    this.baseUrl = `${window.location.origin}/api/v1`;
  }

  /**
   * Get JWT token for authentication
   * @returns {Promise<string>} JWT token
   */
  async getAuthToken() {
    return await PydioApi._PydioRestClient.getOrUpdateJwt();
  }

  /**
   * Health check endpoint
   * @returns {Promise<Object>} Health status response
   */
  async healthCheck() {
    const token = await this.getAuthToken();

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error checking health:", error);
      throw error;
    }
  }

  /**
   * Get all preservation configurations
   * @returns {Promise<Array>} Array of preservation configs
   */
  async getConfigs() {
    const token = await this.getAuthToken();

    try {
      const response = await fetch(`${this.baseUrl}/preservation-configs`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      // Save configs to session storage
      sessionStorage.setItem("preservationConfigs", JSON.stringify(data));

      return data;
    } catch (error) {
      console.error("Error fetching preservation configs:", error);
      throw error;
    }
  }

  /**
   * Get a specific preservation configuration by ID
   * @param {string|number} configId - ID of the config to retrieve
   * @returns {Promise<Object>} Configuration object
   */
  async getConfig(configId) {
    const token = await this.getAuthToken();

    try {
      const response = await fetch(`${this.baseUrl}/preservation-configs/${configId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching preservation config:", error);
      throw error;
    }
  }

  /**
   * Create a new preservation configuration
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>} Created config response
   */
  async createConfig(config) {
    const token = await this.getAuthToken();

    try {
      const response = await fetch(`${this.baseUrl}/preservation-configs`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error while creating config, Status: ${response.status}`
        );
      }

      console.info("Config created successfully");
      return await response.json();
    } catch (error) {
      console.error("Error creating preservation config:", error);
      this.showErrorModal(
        "There was an error saving your configuration. Please try again, or contact support if the problem persists."
      );
      throw error;
    }
  }

  /**
   * Update an existing preservation configuration
   * @param {Object} config - Configuration object with id
   * @returns {Promise<Object>} Updated config response
   */
  async updateConfig(config) {
    const token = await this.getAuthToken();
    const url = `${this.baseUrl}/preservation-configs/${config.id}`;

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error while updating config, Status: ${response.status}`
        );
      }

      if (response.status === 200) {
        console.info("Config updated successfully");
        return await response.json();
      }
    } catch (error) {
      console.error("Error updating preservation config:", error);
      this.showErrorModal(
        "There was an error saving your modified configuration. Please try again, or contact support if the problem persists."
      );
      throw error;
    }
  }

  /**
   * Delete a preservation configuration
   * @param {string|number} configId - ID of the config to delete
   * @returns {Promise<Object>} Delete response
   */
  async deleteConfig(configId) {
    const token = await this.getAuthToken();
    const url = `${this.baseUrl}/preservation-configs/${configId}`;

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data) {
        // Refresh configs in session storage
        await this.getConfigs();
        return data;
      } else {
        throw new Error("Delete operation failed.");
      }
    } catch (error) {
      console.error("Error deleting preservation config:", error);
      this.showErrorModal(
        "There was an error deleting your configuration. Please try again, or contact support if the problem persists."
      );
      throw error;
    }
  }

  /**
   * Save or update a config (determines create vs update based on presence of id)
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>} Save response
   */
  async saveConfig(config) {
    if (config.id) {
      return await this.updateConfig(config);
    } else {
      return await this.createConfig(config);
    }
  }

  /**
   * Get configs from session storage
   * @returns {Array} Array of configs from session storage
   */
  getConfigsFromStorage() {
    const configs = sessionStorage.getItem("preservationConfigs");
    return configs ? JSON.parse(configs) : [];
  }

  /**
   * Show error modal using the existing Curate UI system
   * @param {string} message - Error message to display
   */
  showErrorModal(message) {
    if (typeof Curate !== "undefined" && Curate.ui && Curate.ui.modals) {
      Curate.ui.modals
        .curatePopup({
          title: "Error",
          type: "error",
          content: message,
        })
        .fire();
    }
  }
}

// Export the class
export { PreservationConfigAPI };

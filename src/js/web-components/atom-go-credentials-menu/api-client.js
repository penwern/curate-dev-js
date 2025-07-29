/**
 * Atom Config API Client
 * Handles all API interactions for atom configurations
 */
class AtomConfigAPI {
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
   * Get all atom configurations
   * @returns {Promise<Array>} Array of atom configs
   */
  async getConfigs() {
    const token = await this.getAuthToken();

    try {
      const response = await fetch(`${this.baseUrl}/atom-configs`, {
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
      sessionStorage.setItem("atomConfigs", JSON.stringify(data));

      return data;
    } catch (error) {
      console.error("Error fetching atom configs:", error);
      throw error;
    }
  }


  /**
   * Create a new atom configuration
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>} Created config response
   */
  async createConfig(config) {
    const token = await this.getAuthToken();

    try {
      const response = await fetch(`${this.baseUrl}/atom-configs`, {
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

      console.info("Atom config created successfully");
      return await response.json();
    } catch (error) {
      console.error("Error creating atom config:", error);
      this.showErrorModal(
        "There was an error saving your atom configuration. Please try again, or contact support if the problem persists."
      );
      throw error;
    }
  }

  /**
   * Update atom configuration
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>} Updated config response
   */
  async updateConfig(config) {
    const token = await this.getAuthToken();

    try {
      const response = await fetch(`${this.baseUrl}/atom-configs`, {
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
        console.info("Atom config updated successfully");
        return await response.json();
      }
    } catch (error) {
      console.error("Error updating atom config:", error);
      this.showErrorModal(
        "There was an error saving your atom configuration. Please try again, or contact support if the problem persists."
      );
      throw error;
    }
  }


  /**
   * Save or update a config (determines create vs update based on existing config)
   * @param {Object} config - Configuration object
   * @param {boolean} hasExisting - Whether an existing config exists
   * @returns {Promise<Object>} Save response
   */
  async saveConfig(config, hasExisting = false) {
    if (hasExisting) {
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
    const configs = sessionStorage.getItem("atomConfigs");
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
export { AtomConfigAPI };
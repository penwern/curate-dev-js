// main.js
import { LitElement, html, css } from "lit";
import { when } from "lit/directives/when.js";
import ApiService from "./api-service.js";

import {
  dbImportIcon,
  historyIcon,
  chartLineIcon,
  sitemapIcon,
} from "../utils/icons.js";

// Material Web Components
import "@material/web/tabs/tabs.js";
import "@material/web/tabs/primary-tab.js";
import "@material/web/dialog/dialog.js";
import "@material/web/button/text-button.js";
import "@material/web/progress/circular-progress.js";
// Note: Material Web doesn't have snackbar yet, we'll use a custom toast

// Child Tab Components
import "./configuration-tab-content.js";
import "./manual-harvest-tab-content.js";
import "./history-tab-content.js";
import "./analytics-tab-content.js";
import "./metadata-mapping-tab-content.js";

class CalmIntegrationInterface extends LitElement {
  static get properties() {
    return {
      // API Configuration
      baseApiUrl: { type: String },

      // Standard properties
      activeTab: { type: Number, state: true },
      queryFilters: { type: Array, state: true },
      hasConfig: { type: Boolean, state: true }, // New property for tracking config existence
      showVariablesDialog: { type: Boolean, state: true },
      manualHarvestMode: { type: String, state: true },
      manualHarvestIds: { type: String, state: true },
      manualSearchTerm: { type: String, state: true },
      isManualSearching: { type: Boolean, state: true },
      manualSearchResults: { type: Array, state: true },
      isManualHarvesting: { type: Boolean, state: true },
      recentHarvests: { type: Array, state: true },
      showSuccessDialog: { type: Boolean, state: true },
      successDialogMessage: { type: String, state: true },
      selectedChart: { type: String, state: true },
      expandedHistoryId: { type: Number, state: true },

      // Properties for Metadata Mapping
      discoveredFields: { type: Array, state: true },
      availableCurateTargets: { type: Array, state: true },
      fieldMappings: { type: Object, state: true },

      // Error handling
      showErrorSnackbar: { type: Boolean, state: true },
      errorMessage: { type: String, state: true },

      // Loading states
      isLoadingHistory: { type: Boolean, state: true },
      isLoadingConfig: { type: Boolean, state: true },

      // Cached records tracking
      cachedRecordsCount: { type: Number, state: true },
    };
  }

  constructor() {
    super();

    // API Configuration - can be overridden via property
    //this.baseApiUrl = "http://localhost:8000";
    this.apiService = new ApiService(this.baseApiUrl);

    // Initialize standard properties
    this.activeTab = 0;
    this.queryFilters = [
      { field: "modified_date", condition: "since", value: "LAST_HARVEST" },
    ];
    this.hasConfig = true; // Initialize as true, will be updated based on API response
    this.showVariablesDialog = false;
    this.manualHarvestMode = "ids";
    this.manualHarvestIds = "";
    this.manualSearchTerm = "";
    this.isManualSearching = false;
    this.manualSearchResults = [];
    this.isManualHarvesting = false;
    this.showSuccessDialog = false;
    this.successDialogMessage = "";
    this.selectedChart = "trends";
    this.expandedHistoryId = null;
    this.recentHarvests = [];

    // Initialize Metadata Mapping properties
    this.discoveredFields = [];
    this.fieldMappings = {};

    // Cached records tracking
    this.cachedRecordsCount = 0;

    // Error handling
    this.showErrorSnackbar = false;
    this.errorMessage = "";

    // Loading states
    this.isLoadingHistory = false;
    this.isLoadingConfig = false;

    // Bind event handlers
    this._handleMappingsUpdated = this._handleMappingsUpdated.bind(this);
  }

  async connectedCallback() {
    super.connectedCallback();

    // Update API service if baseApiUrl was set via property
    this.apiService = new ApiService(this.baseApiUrl);

    // Load initial data
    await this._loadInitialData();
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    // Update API service if baseApiUrl changed
    if (changedProperties.has("baseApiUrl")) {
      this.apiService = new ApiService(this.baseApiUrl);
    }
  }

  static get styles() {
    return css`
      :host {
        display: block;
        color: var(--md-sys-color-on-background);
        font-family: "Roboto", sans-serif;
        padding-bottom: 100px;
      }

      md-primary-tab svg {
        margin-right: 8px;
        width: 24px;
        height: 24px;
        fill: currentColor;
      }

      .content-wrapper {
        background: var(--md-sys-color-surface-2);
        color: var(--md-sys-color-on-surface);
        border-radius: 12px;
        overflow: hidden;
        width: 100%;
        max-width: 100%;
        min-width: 0;
        margin: 0 auto;
      }

      @media (max-width: 720px) {
        .content-wrapper {
          border-radius: 10px;
        }
      }

      md-tabs {
        --md-primary-tab-container-color: var(--md-sys-color-surface-2);
        overflow-x: auto;
        scrollbar-width: none;
      }

      md-tabs::-webkit-scrollbar {
        display: none;
      }

      .tab-content {
        padding: clamp(16px, 4vw, 32px);
        min-height: 400px;
        position: relative;
      }

      md-dialog {
        --md-dialog-container-color: var(--md-sys-color-surface-3);
      }

      .variables-dialog-content dt {
        font-weight: 500;
        color: var(--md-sys-color-primary);
      }

      .variables-dialog-content dd {
        margin-left: 16px;
        font-size: 14px;
        color: var(--md-sys-color-on-surface-variant);
      }

      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
      }

      .error-toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--md-sys-color-error-container);
        color: var(--md-sys-color-on-error-container);
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 1000;
        max-width: 90vw;
        animation: slide-up 0.3s ease-out;
      }

      .error-toast.hide {
        animation: slide-down 0.3s ease-in forwards;
      }

      @keyframes slide-up {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(100%);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }

      @keyframes slide-down {
        from {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        to {
          opacity: 0;
          transform: translateX(-50%) translateY(100%);
        }
      }
    `;
  }

  async _loadInitialData() {
    try {
      // Load harvest history
      await this._refreshHarvestHistory();

      // Load metadata mapping data (fields, targets, and mappings in one call)
      await this._loadMetadataMappingData();

      // Load automated harvest configuration
      await this._loadAutomatedHarvestConfig();
    } catch (error) {
      this._showError(`Failed to load initial data: ${error.message}`);
    }
  }

  async _refreshHarvestHistory() {
    try {
      this.isLoadingHistory = true;
      const response = await this.apiService.getHarvestHistory(50);

      // Transform API response to match UI expectations (enhanced job details)
      this.recentHarvests = response.jobs.map((job) => {
        const typeLabel =
          job.type === "automated"
            ? "Automated"
            : job.type === "manual_id"
            ? "Manual (IDs)"
            : job.type === "manual_search"
            ? "Manual (Search)"
            : (job.type || "Manual");

        const isSuccessful =
          job.status === "success" || job.status === "partial_success";

        return {
          id: job.job_id,
          date: new Date(job.start_time).toLocaleString("en-GB"),
          status:
            job.status === "success" || job.status === "partial_success"
              ? "completed"
              : job.status,
          source: typeLabel,
          attempted: job.records_attempted ?? 0,
          successful: job.records_successful ?? 0,
          failed: job.records_failed ?? 0,
          duration: job.end_time
            ? this._calculateDuration(job.start_time, job.end_time)
            : "In progress",
          success: isSuccessful,
          error: job.status === "failed" ? (job.summary_message || "") : null,
          summary: job.summary_message || "",
        };
      });
    } catch (error) {
      this._showError(`Failed to load harvest history: ${error.message}`);
    } finally {
      this.isLoadingHistory = false;
    }
  }

  async _loadMetadataMappingData() {
    try {
      const response = await this.apiService.getMetadataMappingOverview();

      // Set the data exactly as the API returns it
      this.discoveredFields = response.discovered_calm_fields;
      this.availableCurateTargets = response.available_curate_targets;
      this.fieldMappings = response.field_mappings;
      this.cachedRecordsCount = response.cached_records_count || 0;
    } catch (error) {
      this._showError(`Failed to load metadata mapping data: ${error.message}`);
    }
  }

  async _loadAutomatedHarvestConfig() {
    try {
      this.isLoadingConfig = true;
      const response = await this.apiService.getAutomatedHarvestConfig();

      // Check if the API response indicates no config
      if (response && response.status === "no_config") {
        // No configuration exists
        this.hasConfig = false;
        this.queryFilters = []; // Clear any default filters
      } else if (response && response.criteria_json) {
        // Valid configuration exists
        this.hasConfig = true;
        // Ensure we always have an array
        this.queryFilters = Array.isArray(response.criteria_json)
          ? response.criteria_json
          : [];
      } else {
        // Fallback - treat as no config if response structure is unexpected
        this.hasConfig = false;
        this.queryFilters = [];
      }
    } catch (error) {
      // On error, treat as no config scenario
      this.hasConfig = false;
      this.queryFilters = [];

      // Only show error if it's not a "no config found" type error
      if (!error.message.includes("No automated harvest configuration")) {
        this._showError(
          `Failed to load automated harvest configuration: ${error.message}`
        );
      }
    } finally {
      this.isLoadingConfig = false;
    }
  }

  _calculateDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;

    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  _showError(message) {
    this.errorMessage = message;
    this.showErrorSnackbar = true;
    console.error("CALM Integration Error:", message);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.showErrorSnackbar = false;
    }, 5000);
  }

  _showSuccess(message) {
    this.successDialogMessage = message;
    this.showSuccessDialog = true;
  }

  // Updated Event Handlers with API Integration

  // Configuration Tab Events
  _handleOpenVariablesDialog() {
    this.showVariablesDialog = true;
  }

  _handleUpdateQueryFilter(e) {
    const { index, property, value, additionalUpdates } = e.detail;
    this.queryFilters = this.queryFilters.map((filter, i) =>
      i === index
        ? {
            ...filter,
            [property]: value,
            // Apply any additional updates (like condition reset)
            ...(additionalUpdates || {}),
          }
        : filter
    );
  }

  _handleRemoveQueryFilter(e) {
    this.queryFilters = this.queryFilters.filter(
      (_, i) => i !== e.detail.index
    );
  }

  _handleAddQueryFilter() {
    // When adding the first filter after no config, mark as having config
    if (!this.hasConfig && this.queryFilters.length === 0) {
      this.hasConfig = true;
    }

    this.queryFilters = [
      ...this.queryFilters,
      { field: "title", condition: "contains", value: "" },
    ];
  }

  _handleResetConfiguration() {
    this.resetForm();
  }

  async _handleSaveConfiguration() {
    await this.saveConfiguration();
  }

  // Manual Harvest Events with API Integration
  _handleSetManualHarvestMode(e) {
    this.manualHarvestMode = e.detail.mode;
  }

  _handleUpdateManualIds(e) {
    this.manualHarvestIds = e.detail.value;
  }

  _handleUpdateManualSearchTerm(e) {
    this.manualSearchTerm = e.detail.value;
  }

  async _handleRunManualSearch() {
    // IMMEDIATE guard before any other code
    if (this.isManualSearching) return;

    try {
      this.isManualSearching = true; // Set immediately after guard
      this.manualSearchResults = [];

      const response = await this.apiService.searchCalmRecords(
        this.manualSearchTerm
      );

      this.manualSearchResults = (response.records || []).filter(r => !r?.already_harvested).map((record) => {
        // Prefer CALM RefNo (human identifier), fallback to `id` then GUID
        const chosenId =
          record?.RefNo || record?.id || record?.RecordID || "";
        return {
          id: chosenId,
          title: record?.Title || `Record ${chosenId}`,
          collection: "CALM Collection",
          modified: record?.Date || "Unknown",
          selected: false,
        };
      });
    } catch (error) {
      this._showError(`Search failed: ${error.message}`);
    } finally {
      this.isManualSearching = false;
    }
  }

  _handleToggleSelectAll(e) {
    this.manualSearchResults = this.manualSearchResults.map((r) => ({
      ...r,
      selected: e.detail.checked,
    }));
  }

  _handleToggleRecordSelection(e) {
    this.manualSearchResults = this.manualSearchResults.map((r, i) =>
      i === e.detail.index ? { ...r, selected: !r.selected } : r
    );
  }

  async _handleRunHarvestIds() {
    await this.runHarvestForEnteredIds();
  }

  async _handleRunHarvestSelectedRecords() {
    await this.runHarvestForSelectedRecords();
  }

  // History Tab Events
  _handleToggleHistoryExpansion(e) {
    this.toggleHistoryExpansion(e.detail.id);
  }

  // Analytics Tab Events
  _handleSelectChartType(e) {
    this.selectedChart = e.detail.value;
  }

  // Metadata Mapping Events
  async _handleMappingsUpdated(e) {
    const newMappings = e.detail.mappings;

    try {
      // Use the new bulk save method instead of saving one by one
      await this.apiService.saveMetadataMappingsBulk(newMappings);

      // Update local state
      this.fieldMappings = { ...newMappings };

      this._showSuccess("Metadata mappings have been saved.");
    } catch (error) {
      this._showError(`Failed to save metadata mappings: ${error.message}`);
    }
  }

  _handleRefreshMappingData = async () => {
    await this._loadMetadataMappingData();
  };

  // Handle cached records count refresh
  _handleRefreshCachedCount = async () => {
    try {
      const cachedRecords = await this.apiService.getCachedRecords();
      this.cachedRecordsCount = cachedRecords.total_count || 0;
    } catch (error) {
      console.error("Failed to refresh cached records count:", error);
    }
  };

  // Handle errors from child components
  _handleShowError = (e) => {
    this._showError(e.detail.message);
  };

  // Updated Core Methods with API Integration
  handleTabChange(e) {
    this.activeTab = e.target.activeTabIndex;

    // Refresh data when switching to certain tabs
    if (this.activeTab === 1) {
      // History tab
      this._refreshHarvestHistory();
    } else if (this.activeTab === 3) {
      // Mappings tab - use the new combined method
      this._loadMetadataMappingData();
    }
  }

  resetForm() {
    this.queryFilters = [
      { field: "modified_date", condition: "since", value: "LAST_HARVEST" },
    ];
    this.hasConfig = true; // Reset to having config when resetting to defaults
  }

  async saveConfiguration() {
    try {
      // Send all criteria filters as an array
      const criteriaJson =
        this.queryFilters.length > 0
          ? this.queryFilters
          : [
              {
                field: "modified_date",
                condition: "since",
                value: "LAST_HARVEST",
              },
            ];

      await this.apiService.saveAutomatedHarvestConfig(
        criteriaJson,
        true // Automation is always enabled when criteria are saved
      );

      // After successful save, mark as having config
      this.hasConfig = true;

      this._showSuccess("Your automated harvest configuration has been saved.");
    } catch (error) {
      this._showError(`Failed to save configuration: ${error.message}`);
    }
  }

  toggleHistoryExpansion(id) {
    this.expandedHistoryId = this.expandedHistoryId === id ? null : id;
  }

  async runHarvestForEnteredIds() {
    // IMMEDIATE guard before any other code
    if (this.isManualHarvesting) return;

    const ids = this.manualHarvestIds.split("\n").filter((id) => id.trim());
    if (ids.length === 0) return;

    try {
      this.isManualHarvesting = true;

      const result = await this.apiService.harvestByIds(ids, "Manual ID Entry");

      this._showSuccess(
        `Harvest job ${result.job_id} started successfully. ` +
          `${result.records_successful}/${result.records_attempted} records processed.`
      );

      // Clear the input and refresh history
      this.manualHarvestIds = "";
      await this._refreshHarvestHistory();
      this.activeTab = 2; // Switch to history tab
    } catch (error) {
      this._showError(`Harvest failed: ${error.message}`);
    } finally {
      this.isManualHarvesting = false;
    }
  }

  async runHarvestForSelectedRecords() {
    // IMMEDIATE guard before any other code
    if (this.isManualHarvesting) return;

    const selectedRecords = this.manualSearchResults.filter((r) => r.selected);
    const ids = selectedRecords.map((r) => r.id);

    if (ids.length === 0) return;

    try {
      this.isManualHarvesting = true; // Set immediately after guard

      const result = await this.apiService.harvestByIds(
        ids,
        "Manual Search Selection"
      );

      this._showSuccess(
        `Harvest job ${result.job_id} started successfully. ` +
          `${result.records_successful}/${result.records_attempted} records processed.`
      );

      this.manualSearchResults = [];
      this.manualSearchTerm = "";
      await this._refreshHarvestHistory();
      this.activeTab = 2;
    } catch (error) {
      this._showError(`Harvest failed: ${error.message}`);
    } finally {
      this.isManualHarvesting = false;
    }
  }

  render() {
    return html`
      <div class="content-wrapper">
        <md-tabs
          @change=${this.handleTabChange}
          .activeTabIndex=${this.activeTab}
        >
                    <md-primary-tab>${dbImportIcon} Manual Harvest</md-primary-tab>
          <md-primary-tab>${historyIcon} History</md-primary-tab>
          <md-primary-tab>${chartLineIcon} Analytics</md-primary-tab>
          <md-primary-tab>${sitemapIcon} Mappings</md-primary-tab>
        </md-tabs>

        <div class="tab-content">
          ${this.isLoadingConfig && this.activeTab === 0
            ? html`
                <div class="loading-overlay">
                  <md-circular-progress indeterminate></md-circular-progress>
                </div>
              `
            : ""}
          ${when(this.activeTab === -1,
            () =>
              html`<configuration-tab-content
                .queryFilters=${this.queryFilters}
                .hasConfig=${this.hasConfig}
                @open-variables-dialog=${this._handleOpenVariablesDialog}
                @update-query-filter=${this._handleUpdateQueryFilter}
                @remove-query-filter=${this._handleRemoveQueryFilter}
                @add-query-filter=${this._handleAddQueryFilter}
                @reset-configuration=${this._handleResetConfiguration}
                @save-configuration=${this._handleSaveConfiguration}
              ></configuration-tab-content>`
          )}
          ${when(
            this.activeTab === 0,
            () =>
              html`<calm-manual-harvest-tab-content
                .manualHarvestMode=${this.manualHarvestMode}
                .manualHarvestIds=${this.manualHarvestIds}
                .manualSearchTerm=${this.manualSearchTerm}
                .isManualSearching=${this.isManualSearching}
                .manualSearchResults=${this.manualSearchResults}
                .isManualHarvesting=${this.isManualHarvesting}
                @set-manual-harvest-mode=${this._handleSetManualHarvestMode}
                @update-manual-ids=${this._handleUpdateManualIds}
                @update-manual-search-term=${this._handleUpdateManualSearchTerm}
                @run-manual-search=${this._handleRunManualSearch}
                @toggle-select-all=${this._handleToggleSelectAll}
                @toggle-record-selection=${this._handleToggleRecordSelection}
                @run-harvest-ids=${this._handleRunHarvestIds}
                @run-harvest-selected-records=${this
                  ._handleRunHarvestSelectedRecords}
              ></calm-manual-harvest-tab-content>`
          )}
          ${when(
            this.activeTab === 1,
            () =>
              html`<calm-history-tab-content
                .recentHarvests=${this.recentHarvests}
                .expandedHistoryId=${this.expandedHistoryId}
                .isLoading=${this.isLoadingHistory}
                @toggle-history-expansion=${this._handleToggleHistoryExpansion}
                @refresh-history=${() => this._refreshHarvestHistory()}
              ></calm-history-tab-content>`
          )}
          ${when(
            this.activeTab === 2,
            () =>
              html`<calm-analytics-tab-content
                .recentHarvests=${this.recentHarvests}
                .selectedChart=${this.selectedChart}
                .apiService=${this.apiService}
                @select-chart-type=${this._handleSelectChartType}
              ></calm-analytics-tab-content>`
          )}
          ${when(
            this.activeTab === 3,
            () =>
              html`<calm-metadata-mapping-tab-content
                .discoveredFields=${this.discoveredFields}
                .availableCurateTargets=${this.availableCurateTargets}
                .fieldMappings=${this.fieldMappings}
                .cachedRecordsCount=${this.cachedRecordsCount}
                .apiService=${this.apiService}
                @mappings-updated=${this._handleMappingsUpdated}
                @refresh-mapping-data=${this._handleRefreshMappingData}
                @refresh-cached-count=${this._handleRefreshCachedCount}
                @show-error=${this._handleShowError}
              ></calm-metadata-mapping-tab-content>`
          )}
        </div>
      </div>

      <!-- Success Dialog -->
      <md-dialog
        ?open=${this.showSuccessDialog}
        @closed=${() => (this.showSuccessDialog = false)}
      >
        <div slot="headline">Success</div>
        <div slot="content">${this.successDialogMessage}</div>
        <div slot="actions">
          <md-text-button @click=${() => (this.showSuccessDialog = false)}
            >Close</md-text-button
          >
        </div>
      </md-dialog>

      <!-- Variables Dialog -->
      <md-dialog
        ?open=${this.showVariablesDialog}
        @closed=${() => (this.showVariablesDialog = false)}
      >
        <div slot="headline">Dynamic Date Variables</div>
        <div slot="content" class="variables-dialog-content">
          <p>
            You can use the following dynamic variables in the 'Value' field for
            any date-based criteria.
          </p>
          <dl>
            <dt>LAST_HARVEST</dt>
            <dd>The date and time of the last successful automated run.</dd>
            <dt>TODAY</dt>
            <dd>The start of the current day (00:00:00).</dd>
            <dt>YESTERDAY</dt>
            <dd>The start of the previous day.</dd>
            <dt>START_OF_MONTH</dt>
            <dd>The first day of the current month.</dd>
          </dl>
        </div>
        <div slot="actions">
          <md-text-button @click=${() => (this.showVariablesDialog = false)}
            >Got it</md-text-button
          >
        </div>
      </md-dialog>

      <!-- Error Toast (Custom implementation since Material Web doesn't have snackbar yet) -->
      ${this.showErrorSnackbar
        ? html`
            <div class="error-toast ${this.showErrorSnackbar ? "" : "hide"}">
              <span>⚠️ ${this.errorMessage}</span>
              <md-text-button @click=${() => (this.showErrorSnackbar = false)}>
                Dismiss
              </md-text-button>
            </div>
          `
        : ""}
    `;
  }
}

customElements.define("calm-integration-interface", CalmIntegrationInterface);
export default CalmIntegrationInterface;







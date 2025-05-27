import { LitElement, html, css } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { when } from "lit/directives/when.js";
import Chart from "chart.js/auto";

// All necessary Material Web Components
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/button/text-button.js";
import "@material/web/button/filled-tonal-button.js";
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/select/outlined-select.js";
import "@material/web/select/select-option.js";
import "@material/web/checkbox/checkbox.js";
import "@material/web/chips/chip-set.js";
import "@material/web/chips/filter-chip.js";
import "@material/web/tabs/tabs.js";
import "@material/web/tabs/primary-tab.js";
import "@material/web/icon/icon.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/progress/linear-progress.js";
import "@material/web/dialog/dialog.js";
import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/divider/divider.js";
import "@material/web/fab/fab.js";
import "@material/web/switch/switch.js";

// A static, realistic pool of records to simulate searching in CALM.
const DUMMY_CALM_RECORDS = [
  {
    id: "REC/001/A",
    title: "Minutes of the Brighton Ratepayers Association",
    collection: "Civic Records",
    modified: "2025-04-15",
    selected: false,
  },
  {
    id: "DOC/452",
    title: "Correspondence regarding the construction of the West Pier",
    collection: "Historical Documents",
    modified: "2025-05-02",
    selected: false,
  },
  {
    id: "PHO/199/B",
    title: "Photograph Album: The Great Storm of 1987",
    collection: "Media Collection",
    modified: "2024-11-20",
    selected: false,
  },
  {
    id: "REC/009/F",
    title: "Architectural plans for the Royal Pavilion estate",
    collection: "Civic Records",
    modified: "2023-01-10",
    selected: false,
  },
  {
    id: "MED/034",
    title: "Audio Interview: A Brighton Fisherman's memoirs",
    collection: "Media Collection",
    modified: "2025-02-28",
    selected: false,
  },
  {
    id: "MAP/076",
    title: "Survey Map of Sussex County Railways, 1902",
    collection: "Special Collections",
    modified: "2024-08-01",
    selected: false,
  },
];

class CalmHarvestInterface extends LitElement {
  static get properties() {
    return {
      activeTab: { type: Number, state: true },
      // Automated harvest state
      queryFilters: { type: Array, state: true },
      isEnabled: { type: Boolean, state: true },
      showVariablesDialog: { type: Boolean, state: true },
      // Manual harvest state
      manualHarvestMode: { type: String, state: true }, // 'ids' or 'search'
      manualHarvestIds: { type: String, state: true },
      manualSearchTerm: { type: String, state: true },
      isManualSearching: { type: Boolean, state: true },
      manualSearchResults: { type: Array, state: true },
      isManualHarvesting: { type: Boolean, state: true },
      // Shared state
      recentHarvests: { type: Array, state: true },
      showSuccessDialog: { type: Boolean, state: true },
      successDialogMessage: { type: String, state: true },
    };
  }

  constructor() {
    super();
    this.activeTab = 0;
    this.queryFilters = [
      { field: "modified_date", condition: "since", value: "LAST_HARVEST" },
    ];
    this.isEnabled = true;
    this.showVariablesDialog = false;
    this.manualHarvestMode = "ids";
    this.manualHarvestIds = "";
    this.manualSearchTerm = "";
    this.isManualSearching = false;
    this.manualSearchResults = [];
    this.isManualHarvesting = false;
    this.showSuccessDialog = false;
    this.successDialogMessage = "";
    this.recentHarvests = [
      {
        id: 1,
        date: "2025-05-22 02:00",
        status: "completed",
        records: 1247,
        duration: "12m 34s",
        success: true,
      },
      {
        id: 2,
        date: "2025-05-21 02:00",
        status: "completed",
        records: 1189,
        duration: "11m 48s",
        success: true,
      },
      {
        id: 3,
        date: "2025-05-20 02:00",
        status: "failed",
        records: 0,
        duration: "2m 15s",
        success: false,
        error: "Connection timeout",
      },
    ];
    this.chart = null;
  }

  get selectedManualRecords() {
    return this.manualSearchResults.filter((r) => r.selected);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  updated(changedProperties) {
    if (changedProperties.has("activeTab")) {
      if (this.activeTab === 3) {
        this.initChart();
      } else if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
    }
  }

  initChart() {
    requestAnimationFrame(() => {
      const canvas = this.shadowRoot.querySelector("#analyticsChart");
      if (!canvas || this.chart) return;
      const ctx = canvas.getContext("2d");
      const labels = this.recentHarvests
        .map((h) => h.date.split(" ")[0])
        .reverse();
      const data = this.recentHarvests.map((h) => h.records).reverse();
      this.chart = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Records Harvested",
              data,
              fill: true,
              borderColor: "#1976d2",
              backgroundColor: "rgba(25, 118, 210, 0.1)",
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true } },
        },
      });
    });
  }

  static get styles() {
    return css`
      :host {
        display: block;
        background: #f5f5f5;
        min-height: 100vh;
        color: rgba(0, 0, 0, 0.87);
      }
      .header {
        background: var(--md-sys-color-primary-container);
        color: var(--md-sys-color-on-primary-container);
        padding: 24px 24px 80px;
        position: relative;
        overflow: hidden;
      }
      .header-content {
        position: relative;
        max-width: 1200px;
        margin: 0 auto;
      }
      .header h1 {
        margin: 0 0 8px;
        font-size: 32px;
        font-weight: 300;
      }
      .header p {
        margin: 0;
        opacity: 0.9;
        font-size: 16px;
      }
      .container {
        max-width: 1200px;
        margin: -60px auto 0;
        padding: 0 24px 24px;
        position: relative;
      }
      .card {
        background: white;
        border-radius: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        margin-bottom: 24px;
      }
      md-tabs {
        --md-primary-tab-container-color: white;
      }
      .tab-content {
        padding: 24px;
        min-height: 400px;
      }
      .form-section {
        margin-bottom: 32px;
      }
      .form-section h3 {
        margin: 0 0 8px;
        font-size: 18px;
        font-weight: 500;
        color: var(--md-sys-color-primary);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .form-section p {
        margin: 0 0 16px;
        color: rgba(0, 0, 0, 0.6);
      }
      .harvest-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .harvest-item {
        background: #f5f5f5;
        border-radius: 12px;
        padding: 16px;
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 16px;
        align-items: center;
      }
      .harvest-status {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .harvest-status.completed {
        background: #e8f5e9;
        color: #2e7d32;
      }
      .harvest-status.failed {
        background: var(--md-sys-color-error-container);
        color: var(--md-sys-color-on-error-container);
      }
      .harvest-details h4 {
        margin: 0 0 4px;
        font-size: 16px;
      }
      .harvest-meta {
        display: flex;
        gap: 16px;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);
      }
      .button-group {
        display: flex;
        gap: 12px;
        margin-top: 24px;
        justify-content: flex-end;
      }
      md-dialog {
        --md-dialog-container-color: white;
      }
      .query-builder-group {
        background: #f5f5f5;
        border-radius: 8px;
        padding: 16px;
        border-left: 3px solid var(--md-sys-color-primary);
      }
      .filter-row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr auto;
        gap: 12px;
        align-items: center;
        margin-bottom: 12px;
      }
      .mode-toggle-group {
        display: flex;
        gap: 8px;
        margin-bottom: 24px;
      }
      .search-results-container {
        margin-top: 24px;
        border-top: 1px solid #eee;
        padding-top: 24px;
      }
      .search-results-list {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid #ddd;
        border-radius: 8px;
      }
      .search-result-item {
        --md-list-item-leading-space: 12px;
      }
      .search-result-item md-checkbox {
        margin-right: 8px;
      }
      .chart-container {
        position: relative;
        height: 350px;
        background: #fafafa;
        border-radius: 8px;
        padding: 16px;
      }
      .variables-dialog-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .variables-dialog-content dt {
        font-weight: 500;
        color: #1e88e5;
      }
      .variables-dialog-content dd {
        margin-left: 16px;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.7);
      }
    `;
  }

  render() {
    return html`
      <div class="header">
        <div class="header-content">
          <h1>Harvest Scheduler</h1>
          <p>Configure and monitor your CALM to Curate harvest operations</p>
        </div>
      </div>
      <div class="container">
        <div class="card">
          <md-tabs
            @change=${this.handleTabChange}
            .activeTabIndex=${this.activeTab}
          >
            <md-primary-tab
              ><md-icon slot="icon">tune</md-icon>Configuration</md-primary-tab
            >
            <md-primary-tab
              ><md-icon slot="icon">play_for_work</md-icon>Manual
              Harvest</md-primary-tab
            >
            <md-primary-tab
              ><md-icon slot="icon">history</md-icon>History</md-primary-tab
            >
            <md-primary-tab
              ><md-icon slot="icon">insights</md-icon>Analytics</md-primary-tab
            >
          </md-tabs>
          <div class="tab-content">
            ${when(this.activeTab === 0, () => this.renderConfiguration())}
            ${when(this.activeTab === 1, () => this.renderManualHarvest())}
            ${when(this.activeTab === 2, () => this.renderHistory())}
            ${when(this.activeTab === 3, () => this.renderAnalytics())}
          </div>
        </div>
      </div>

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
    `;
  }

  renderConfiguration() {
    return html`
      <div class="form-section">
        <h3>
          Automated Harvest Criteria
          <md-icon-button
            @click=${() => (this.showVariablesDialog = true)}
            title="View available variables"
          >
            <md-icon>help_outline</md-icon>
          </md-icon-button>
        </h3>
        <p>
          Define the rules for the recurring, automated harvest of records from
          CALM.
        </p>
        <div class="query-builder-group">
          ${repeat(
            this.queryFilters,
            (f, i) => i,
            (filter, index) => html`
              <div class="filter-row">
                <md-outlined-select
                  label="Field"
                  .value=${filter.field}
                  @change=${(e) => this.updateFilter(e, index, "field")}
                >
                  <md-select-option value="modified_date" selected
                    ><div slot="headline">Modified Date</div></md-select-option
                  >
                  <md-select-option value="created_date"
                    ><div slot="headline">Created Date</div></md-select-option
                  >
                  <md-select-option value="title"
                    ><div slot="headline">Title</div></md-select-option
                  >
                </md-outlined-select>
                <md-outlined-select
                  label="Condition"
                  .value=${filter.condition}
                  @change=${(e) => this.updateFilter(e, index, "condition")}
                >
                  <md-select-option value="since" selected
                    ><div slot="headline">Is After</div></md-select-option
                  >
                  <md-select-option value="contains"
                    ><div slot="headline">Contains</div></md-select-option
                  >
                </md-outlined-select>
                <md-outlined-text-field
                  label="Value"
                  .value=${filter.value}
                  @input=${(e) => this.updateFilter(e, index, "value")}
                ></md-outlined-text-field>
                <md-icon-button
                  @click=${() => this.removeFilter(index)}
                  title="Remove filter"
                  ><md-icon>delete</md-icon></md-icon-button
                >
              </div>
            `
          )}
          <md-text-button @click=${this.addFilter}
            ><md-icon slot="icon">add</md-icon> Add Criteria</md-text-button
          >
        </div>
      </div>
      <div class="form-section">
        <h3><md-icon>power_settings_new</md-icon>Automated Harvest Status</h3>
        <div
          style="display: flex; align-items: center; gap: 12px; padding: 8px 0;"
        >
          <md-switch
            ?selected=${this.isEnabled}
            @change=${(e) => (this.isEnabled = e.target.selected)}
          ></md-switch>
          <span
            >Automated harvesting is currently
            <strong>${this.isEnabled ? "enabled" : "disabled"}</strong>.</span
          >
        </div>
      </div>
      <div class="button-group">
        <md-outlined-button @click=${this.resetForm}
          ><md-icon slot="icon">restart_alt</md-icon>Reset</md-outlined-button
        >
        <md-filled-button @click=${this.saveConfiguration}
          ><md-icon slot="icon">save</md-icon>Save
          Configuration</md-filled-button
        >
      </div>
    `;
  }

  renderManualHarvest() {
    return html`
      <div class="mode-toggle-group">
        <md-filled-tonal-button
          @click=${() => (this.manualHarvestMode = "ids")}
          ?disabled=${this.manualHarvestMode === "ids"}
        >
          <md-icon slot="icon">short_text</md-icon> Enter IDs Directly
        </md-filled-tonal-button>
        <md-filled-tonal-button
          @click=${() => (this.manualHarvestMode = "search")}
          ?disabled=${this.manualHarvestMode === "search"}
        >
          <md-icon slot="icon">search</md-icon> Search & Select
        </md-filled-tonal-button>
      </div>
      ${when(
        this.manualHarvestMode === "ids",
        () => this.renderManualHarvestByIds(),
        () => this.renderManualHarvestBySearch()
      )}
    `;
  }

  renderManualHarvestByIds() {
    return html`
      <div class="form-section">
        <h3><md-icon>short_text</md-icon>Harvest by Identifier</h3>
        <p>
          Fetch specific records by pasting their unique CALM identifiers below,
          one per line.
        </p>
        <md-outlined-text-field
          type="textarea"
          rows="5"
          label="Record Identifiers"
          .value=${this.manualHarvestIds}
          @input=${(e) => (this.manualHarvestIds = e.target.value)}
          style="width: 100%;"
        ></md-outlined-text-field>
      </div>
      <div class="button-group">
        <md-filled-button
          @click=${this.runHarvestForEnteredIds}
          ?disabled=${!this.manualHarvestIds.trim() || this.isManualHarvesting}
        >
          <md-icon slot="icon">play_arrow</md-icon> ${this.isManualHarvesting
            ? "Harvesting..."
            : "Start Harvest"}
        </md-filled-button>
      </div>
    `;
  }

  renderManualHarvestBySearch() {
    const selectedCount = this.selectedManualRecords.length;
    return html`
      <div class="form-section">
        <h3><md-icon>search</md-icon>Find and Select Records</h3>
        <p>
          Search for records using a keyword and then select the ones you wish
          to harvest.
        </p>
        <div style="display: flex; gap: 8px; align-items: center;">
          <md-outlined-text-field
            label="Search by keyword, title, or ID"
            .value=${this.manualSearchTerm}
            @input=${(e) => (this.manualSearchTerm = e.target.value)}
            style="flex-grow: 1;"
          ></md-outlined-text-field>
          <md-filled-button
            @click=${this.runManualSearch}
            ?disabled=${!this.manualSearchTerm.trim() || this.isManualSearching}
          >
            <md-icon slot="icon">search</md-icon> ${this.isManualSearching
              ? "Searching..."
              : "Search"}
          </md-filled-button>
        </div>
      </div>
      ${when(
        this.isManualSearching,
        () => html`<md-linear-progress indeterminate></md-linear-progress>`
      )}
      ${when(
        this.manualSearchResults.length > 0 && !this.isManualSearching,
        () => html`
          <div class="search-results-container">
            <h4>Search Results</h4>
            <div class="search-results-list">
              <md-list>
                ${repeat(
                  this.manualSearchResults,
                  (r) => r.id,
                  (record, index) => html`
                    <md-list-item
                      class="search-result-item"
                      type="button"
                      @click=${() => this.toggleRecordSelection(index)}
                    >
                      <md-checkbox
                        slot="start"
                        ?checked=${record.selected}
                      ></md-checkbox>
                      <div slot="headline">${record.title}</div>
                      <div slot="supporting-text">
                        ID: ${record.id} | Modified: ${record.modified}
                      </div>
                    </md-list-item>
                  `
                )}
              </md-list>
            </div>
            <div class="button-group">
              <md-filled-button
                @click=${this.runHarvestForSelectedRecords}
                ?disabled=${selectedCount === 0 || this.isManualHarvesting}
              >
                <md-icon slot="icon">play_arrow</md-icon>
                ${this.isManualHarvesting
                  ? "Harvesting..."
                  : `Harvest ${selectedCount} Selected Record${
                      selectedCount === 1 ? "" : "s"
                    }`}
              </md-filled-button>
            </div>
          </div>
        `
      )}
    `;
  }

  renderHistory() {
    return html`
      <h3 style="margin: 0 0 16px; font-size: 18px;">Recent Harvests</h3>
      <div class="harvest-list">
        ${repeat(
          this.recentHarvests,
          (h) => h.id,
          (harvest) => html`
            <div class="harvest-item">
              <div class="harvest-status ${harvest.status}">
                <md-icon
                  >${harvest.success ? "check" : "error_outline"}</md-icon
                >
              </div>
              <div class="harvest-details">
                <h4>${harvest.date}</h4>
                <div class="harvest-meta">
                  <span
                    >${harvest.success
                      ? `${harvest.records} records`
                      : `Error: ${harvest.error}`}</span
                  >
                  <span>Duration: ${harvest.duration}</span>
                </div>
              </div>
              <md-icon-button><md-icon>chevron_right</md-icon></md-icon-button>
            </div>
          `
        )}
      </div>
    `;
  }

  renderAnalytics() {
    return html`
      <h3 style="margin: 0 0 16px; font-size: 18px;">Harvest Trends</h3>
      <div class="chart-container"><canvas id="analyticsChart"></canvas></div>
    `;
  }

  handleTabChange(e) {
    this.activeTab = e.target.activeTabIndex;
  }
  addFilter() {
    this.queryFilters = [
      ...this.queryFilters,
      { field: "title", condition: "contains", value: "" },
    ];
  }
  removeFilter(index) {
    this.queryFilters = this.queryFilters.filter((_, i) => i !== index);
  }

  // Handles updating a specific property of a filter object
  updateFilter(e, index, property) {
    const newValue = e.target.value;
    this.queryFilters = this.queryFilters.map((filter, i) =>
      i === index ? { ...filter, [property]: newValue } : filter
    );
  }

  async runManualSearch() {
    this.isManualSearching = true;
    this.manualSearchResults = [];
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const searchTerm = this.manualSearchTerm.toLowerCase();
    this.manualSearchResults = DUMMY_CALM_RECORDS.filter(
      (record) =>
        record.title.toLowerCase().includes(searchTerm) ||
        record.id.toLowerCase().includes(searchTerm)
    );
    this.isManualSearching = false;
  }

  toggleRecordSelection(index) {
    this.manualSearchResults = this.manualSearchResults.map((r, i) =>
      i === index ? { ...r, selected: !r.selected } : r
    );
  }

  async runHarvest(ids, source) {
    this.isManualHarvesting = true;
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const newHarvest = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      status: "completed",
      records: ids.length,
      duration: `${Math.floor(Math.random() * 30) + 5}s`,
      success: true,
    };
    this.recentHarvests = [newHarvest, ...this.recentHarvests];
    this.successDialogMessage = `Successfully harvested ${ids.length} record(s) from your ${source}.`;
    this.showSuccessDialog = true;
    this.isManualHarvesting = false;
    this.activeTab = 2;
  }

  runHarvestForEnteredIds() {
    const ids = this.manualHarvestIds.split("\n").filter((id) => id.trim());
    if (ids.length > 0) {
      this.runHarvest(ids, "manual input");
      this.manualHarvestIds = "";
    }
  }

  runHarvestForSelectedRecords() {
    const ids = this.selectedManualRecords.map((r) => r.id);
    if (ids.length > 0) {
      this.runHarvest(ids, "search selection");
      this.manualSearchResults = [];
      this.manualSearchTerm = "";
    }
  }

  saveConfiguration() {
    this.successDialogMessage =
      "Your automated harvest configuration has been saved.";
    this.showSuccessDialog = true;
  }

  resetForm() {
    this.queryFilters = [
      { field: "modified_date", condition: "since", value: "LAST_HARVEST" },
    ];
    this.isEnabled = true;
  }
}

customElements.define("calm-harvest-interface", CalmHarvestInterface);
export default CalmHarvestInterface;

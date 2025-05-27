import { LitElement, html, css } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { when } from "lit/directives/when.js";
import Chart from "chart.js/auto";

// Import all the SVG icons from your local file
import {
  tuneIcon,
  dbImportIcon,
  historyIcon,
  chartLineIcon,
  helpCircleIcon,
  deleteIcon,
  plusIcon,
  powerPlugIcon,
  restartIcon,
  saveIcon,
  textboxIcon,
  searchIcon,
  playIcon,
  checkCircleIcon,
  alertCircleIcon,
  chevronRightIcon,
  chevronDownIcon,
} from "./icons.js";

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
      queryFilters: { type: Array, state: true },
      isEnabled: { type: Boolean, state: true },
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
    this.selectedChart = "trends";
    this.expandedHistoryId = null;
    this.recentHarvests = [
      {
        id: 1,
        date: "2025-05-22 02:00",
        status: "completed",
        source: "Automated",
        records: 1247,
        duration: "12m 34s",
        success: true,
      },
      {
        id: 2,
        date: "2025-05-21 02:00",
        status: "completed",
        source: "Automated",
        records: 1189,
        duration: "11m 48s",
        success: true,
      },
      {
        id: 3,
        date: "2025-05-20 02:00",
        status: "failed",
        source: "Automated",
        records: 0,
        duration: "2m 15s",
        success: false,
        error: "Connection timeout",
      },
    ];
    this.charts = {};
  }

  get selectedManualRecords() {
    return this.manualSearchResults.filter((r) => r.selected);
  }

  get areAllSelected() {
    return (
      this.manualSearchResults.length > 0 &&
      this.manualSearchResults.every((r) => r.selected)
    );
  }

  get areSomeSelected() {
    const selectedCount = this.selectedManualRecords.length;
    return selectedCount > 0 && selectedCount < this.manualSearchResults.length;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.destroyCharts();
  }

  destroyCharts() {
    Object.values(this.charts).forEach((chart) => {
      if (chart) chart.destroy();
    });
    this.charts = {};
  }

  updated(changedProperties) {
    if (
      changedProperties.has("activeTab") ||
      changedProperties.has("selectedChart")
    ) {
      if (this.activeTab === 3) {
        this.destroyCharts();
        this.initSelectedChart();
      } else if (changedProperties.get("activeTab") === 3) {
        this.destroyCharts();
      }
    }
  }

  initSelectedChart() {
    requestAnimationFrame(() => {
      switch (this.selectedChart) {
        case "trends":
          this.initLineChart();
          break;
        case "status":
          this.initBarChart();
          break;
        case "source":
          this.initDoughnutChart();
          break;
      }
    });
  }

  initLineChart() {
    const canvas = this.shadowRoot.querySelector("#analyticsChart");
    if (!canvas || this.charts.line) return;
    const ctx = canvas.getContext("2d");
    const labels = this.recentHarvests
      .map((h) => h.date.split(" ")[0])
      .reverse();
    const data = this.recentHarvests.map((h) => h.records).reverse();

    this.charts.line = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Records Harvested",
            data,
            fill: true,
            borderColor: "rgba(59, 130, 246, 1)",
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: "var(--md-sys-color-on-surface-variant)" },
            grid: { color: "rgba(128, 128, 128, 0.2)" },
          },
          x: {
            ticks: { color: "var(--md-sys-color-on-surface-variant)" },
            grid: { display: false },
          },
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "var(--md-sys-color-on-surface)" },
          },
        },
      },
    });
  }

  initBarChart() {
    const canvas = this.shadowRoot.querySelector("#statusChart");
    if (!canvas || this.charts.bar) return;
    const ctx = canvas.getContext("2d");
    const successCount = this.recentHarvests.filter((h) => h.success).length;
    const failCount = this.recentHarvests.length - successCount;

    this.charts.bar = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Completed", "Failed"],
        datasets: [
          {
            label: "Harvest Status",
            data: [successCount, failCount],
            backgroundColor: [
              "rgba(52, 211, 153, 0.5)",
              "rgba(248, 113, 113, 0.5)",
            ],
            borderColor: ["rgba(52, 211, 153, 1)", "rgba(248, 113, 113, 1)"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: {
              color: "var(--md-sys-color-on-surface-variant)",
              stepSize: 1,
            },
            grid: { display: false },
          },
          y: {
            ticks: { color: "var(--md-sys-color-on-surface-variant)" },
            grid: { display: false },
          },
        },
      },
    });
  }

  initDoughnutChart() {
    const canvas = this.shadowRoot.querySelector("#sourceChart");
    if (!canvas || this.charts.doughnut) return;
    const ctx = canvas.getContext("2d");
    const sourceCounts = this.recentHarvests.reduce((acc, h) => {
      const sourceName = h.source || "Unknown";
      acc[sourceName] = (acc[sourceName] || 0) + 1;
      return acc;
    }, {});

    this.charts.doughnut = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(sourceCounts),
        datasets: [
          {
            label: "Harvest Source",
            data: Object.values(sourceCounts),
            backgroundColor: [
              "rgba(59, 130, 246, 0.7)",
              "rgba(234, 179, 8, 0.7)",
              "rgba(139, 92, 246, 0.7)",
            ],
            borderColor: "var(--md-sys-color-surface-1)",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "var(--md-sys-color-on-surface)" },
          },
        },
      },
    });
  }

  static get styles() {
    return css`
      :host {
        display: block;
        color: var(--md-sys-color-on-background);
        font-family: "Roboto", sans-serif;
      }
      md-filled-button span,
      md-outlined-button span,
      md-text-button span,
      md-filled-tonal-button span {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      md-primary-tab svg {
        margin-right: 8px;
      }
      .content-wrapper {
        background: var(--md-sys-color-surface-2);
        color: var(--md-sys-color-on-surface);
        border-radius: 12px;
        overflow: hidden;
        min-width: 800px;
      }
      md-tabs {
        --md-primary-tab-container-color: var(--md-sys-color-surface-2);
      }
      .tab-content {
        padding: 24px;
        min-height: 400px;
        position: relative;
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
        color: var(--md-sys-color-on-surface-variant);
        max-width: 65ch;
      }
      .harvest-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .harvest-item {
        background: var(--md-sys-color-surface-1);
        border-radius: 12px;
        padding: 16px;
        display: grid;
        grid-template-columns: auto 1fr auto;
        grid-template-rows: auto;
        gap: 16px;
        align-items: center;
        transition: background-color 0.2s ease-in-out;
      }
      .harvest-status {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }
      .harvest-status.completed {
        background: var(--md-sys-color-tertiary-container);
        color: var(--md-sys-color-on-tertiary-container);
      }
      .harvest-status.failed {
        background: var(--md-sys-color-error-container);
        color: var(--md-sys-color-on-error-container);
      }
      .harvest-details h4 {
        margin: 0 0 4px;
        font-size: 16px;
        font-weight: 500;
      }
      .harvest-meta {
        display: flex;
        gap: 16px;
        font-size: 14px;
        color: var(--md-sys-color-on-surface-variant);
      }
      .history-details-grid {
        grid-column: 1 / -1;
        padding: 16px 0 0 0;
        margin-top: 16px;
        border-top: 1px solid var(--md-sys-color-outline-variant);
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 8px 16px;
        font-size: 14px;
      }
      .history-details-grid dt {
        font-weight: 500;
        color: var(--md-sys-color-on-surface-variant);
      }
      .history-details-grid dd {
        margin: 0;
        color: var(--md-sys-color-on-surface);
      }
      .history-details-grid dd.failed {
        color: var(--md-sys-color-error);
      }
      .button-group {
        display: flex;
        gap: 12px;
        margin-top: 24px;
        justify-content: flex-end;
      }
      md-dialog {
        --md-dialog-container-color: var(--md-sys-color-surface-3);
      }
      .query-builder-group {
        background: var(--md-sys-color-surface-1);
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
        border-top: 1px solid var(--md-sys-color-outline-variant);
        padding-top: 24px;
      }
      .search-results-table {
        border: 1px solid var(--md-sys-color-outline);
        border-radius: 12px;
        overflow: hidden;
      }
      .table-header,
      .table-row {
        display: grid;
        grid-template-columns: 48px 2.5fr 1fr 1fr;
        gap: 16px;
        align-items: center;
        padding: 8px 16px;
      }
      .table-header {
        background: var(--md-sys-color-surface-1);
        font-weight: 500;
        color: var(--md-sys-color-on-surface-variant);
        border-bottom: 1px solid var(--md-sys-color-outline);
        padding: 12px 16px;
        font-size: 14px;
      }
      .table-header md-checkbox {
        margin-left: -10px;
      }
      .table-row {
        cursor: pointer;
        transition: background-color 0.15s ease-in-out;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
      }
      .table-row:last-child {
        border-bottom: none;
      }
      .table-row:hover {
        background-color: var(--md-sys-color-surface-container-hover);
      }
      .table-row md-checkbox {
        margin-left: -10px;
      }
      .record-title {
        font-weight: 500;
      }
      .record-collection {
        font-size: 13px;
        color: var(--md-sys-color-on-surface-variant);
      }
      .record-meta {
        font-family: monospace;
        font-size: 14px;
        color: var(--md-sys-color-on-surface-variant);
      }
      .selection-summary-bar {
        background: var(--md-sys-color-primary-container);
        color: var(--md-sys-color-on-primary-container);
        padding: 8px 16px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 24px;
        animation: slide-in 0.3s ease-out;
      }
      @keyframes slide-in {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .selection-summary-bar span {
        font-weight: 500;
      }
      .analytics-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      md-outlined-select {
        max-width: 300px;
      }
      .chart-wrapper {
        position: relative;
        height: 380px;
        background: var(--md-sys-color-surface-1);
        border-radius: 12px;
        padding: 16px;
      }
      .variables-dialog-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
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
    `;
  }

  render() {
    return html`
      <div class="content-wrapper">
        <md-tabs
          @change=${this.handleTabChange}
          .activeTabIndex=${this.activeTab}
        >
          <md-primary-tab>${tuneIcon} Configuration</md-primary-tab>
          <md-primary-tab>${dbImportIcon} Manual Harvest</md-primary-tab>
          <md-primary-tab>${historyIcon} History</md-primary-tab>
          <md-primary-tab>${chartLineIcon} Analytics</md-primary-tab>
        </md-tabs>
        <div class="tab-content">
          ${when(this.activeTab === 0, () => this.renderConfiguration())}
          ${when(this.activeTab === 1, () => this.renderManualHarvest())}
          ${when(this.activeTab === 2, () => this.renderHistory())}
          ${when(this.activeTab === 3, () => this.renderAnalytics())}
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
            ${helpCircleIcon}
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
            (filter, index) => html` <div class="filter-row">
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
              >
                ${deleteIcon}
              </md-icon-button>
            </div>`
          )}
          <md-text-button @click=${this.addFilter}>
            <span>${plusIcon} Add Criteria</span>
          </md-text-button>
        </div>
      </div>
      <div class="form-section">
        <h3><span>${powerPlugIcon}</span>Automated Harvest Status</h3>
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
        <md-outlined-button @click=${this.resetForm}>
          <span>${restartIcon} Reset</span>
        </md-outlined-button>
        <md-filled-button @click=${this.saveConfiguration}>
          <span>${saveIcon} Save Configuration</span>
        </md-filled-button>
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
          <span>${textboxIcon} Enter IDs Directly</span>
        </md-filled-tonal-button>
        <md-filled-tonal-button
          @click=${() => (this.manualHarvestMode = "search")}
          ?disabled=${this.manualHarvestMode === "search"}
        >
          <span>${searchIcon} Search & Select</span>
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
        <h3><span>${textboxIcon}</span>Harvest by Identifier</h3>
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
          <span
            >${playIcon}
            ${this.isManualHarvesting ? "Harvesting..." : "Start Harvest"}</span
          >
        </md-filled-button>
      </div>
    `;
  }

  renderManualHarvestBySearch() {
    const selectedCount = this.selectedManualRecords.length;
    return html`
      <div class="form-section">
        <h3><span>${searchIcon}</span>Find and Select Records</h3>
        <p>
          Search for records using a keyword, then select the ones you wish to
          harvest.
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
            <span
              >${searchIcon}
              ${this.isManualSearching ? "Searching..." : "Search"}</span
            >
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
            <div class="search-results-table">
              <div class="table-header">
                <md-checkbox
                  aria-label="Select all results"
                  ?checked=${this.areAllSelected}
                  ?indeterminate=${this.areSomeSelected}
                  @change=${this.toggleSelectAll}
                ></md-checkbox>
                <div>RECORD</div>
                <div>ID</div>
                <div>MODIFIED</div>
              </div>
              ${repeat(
                this.manualSearchResults,
                (r) => r.id,
                (record, index) => html`
                  <div
                    class="table-row"
                    @click=${() => this.toggleRecordSelection(index)}
                  >
                    <md-checkbox
                      ?checked=${record.selected}
                      aria-labelledby="title-${index}"
                    ></md-checkbox>
                    <div>
                      <div class="record-title" id="title-${index}">
                        ${record.title}
                      </div>
                      <div class="record-collection">${record.collection}</div>
                    </div>
                    <div class="record-meta">${record.id}</div>
                    <div class="record-meta">${record.modified}</div>
                  </div>
                `
              )}
            </div>
          </div>
        `
      )}
      ${when(
        selectedCount > 0,
        () => html`
          <div class="selection-summary-bar">
            <span
              >${selectedCount} record${selectedCount === 1 ? "" : "s"}
              selected</span
            >
            <md-filled-button
              @click=${this.runHarvestForSelectedRecords}
              ?disabled=${this.isManualHarvesting}
            >
              <span
                >${playIcon}
                ${this.isManualHarvesting ? "Harvesting..." : "Harvest"}</span
              >
            </md-filled-button>
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
                ${harvest.success ? checkCircleIcon : alertCircleIcon}
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
              <md-icon-button
                @click=${() => this.toggleHistoryExpansion(harvest.id)}
              >
                ${this.expandedHistoryId === harvest.id
                  ? chevronDownIcon
                  : chevronRightIcon}
              </md-icon-button>

              ${when(this.expandedHistoryId === harvest.id, () =>
                this.renderHistoryDetails(harvest)
              )}
            </div>
          `
        )}
      </div>
    `;
  }

  renderHistoryDetails(harvest) {
    return html`
      <dl class="history-details-grid">
        <dt>Harvest ID</dt>
        <dd>${harvest.id}</dd>
        <dt>Source</dt>
        <dd>${harvest.source}</dd>
        <dt>Status</dt>
        <dd class="${harvest.status}">${harvest.status}</dd>
        ${when(
          !harvest.success,
          () => html`
            <dt>Error Detail</dt>
            <dd class="failed">${harvest.error}</dd>
          `
        )}
      </dl>
    `;
  }

  renderAnalytics() {
    return html`
      <div class="analytics-container">
        <md-outlined-select
          label="Chart Type"
          .value=${this.selectedChart}
          @change=${(e) => (this.selectedChart = e.target.value)}
        >
          <md-select-option value="trends"
            ><div slot="headline">Harvest Trends</div></md-select-option
          >
          <md-select-option value="status"
            ><div slot="headline">Run Status</div></md-select-option
          >
          <md-select-option value="source"
            ><div slot="headline">Harvest Source</div></md-select-option
          >
        </md-outlined-select>

        <div class="chart-wrapper">
          ${when(
            this.selectedChart === "trends",
            () => html`<canvas id="analyticsChart"></canvas>`
          )}
          ${when(
            this.selectedChart === "status",
            () => html`<canvas id="statusChart"></canvas>`
          )}
          ${when(
            this.selectedChart === "source",
            () => html`<canvas id="sourceChart"></canvas>`
          )}
        </div>
      </div>
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
      date: new Date().toLocaleString("en-GB"),
      status: "completed",
      records: ids.length,
      duration: `${Math.floor(Math.random() * 30) + 5}s`,
      success: true,
      source: source,
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
      this.runHarvest(ids, "Manual Input");
      this.manualHarvestIds = "";
    }
  }
  runHarvestForSelectedRecords() {
    const ids = this.selectedManualRecords.map((r) => r.id);
    if (ids.length > 0) {
      this.runHarvest(ids, "Manual Search");
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
  toggleHistoryExpansion(id) {
    if (this.expandedHistoryId === id) {
      this.expandedHistoryId = null;
    } else {
      this.expandedHistoryId = id;
    }
  }
  toggleSelectAll(e) {
    const isChecked = e.target.checked;
    this.manualSearchResults = this.manualSearchResults.map((r) => ({
      ...r,
      selected: isChecked,
    }));
  }
}

customElements.define("calm-harvest-interface", CalmHarvestInterface);
export default CalmHarvestInterface;

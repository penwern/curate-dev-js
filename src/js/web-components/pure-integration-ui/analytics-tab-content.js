import { LitElement, html, css } from "lit";
import { when } from "lit/directives/when.js";
import Chart from "chart.js/auto";
import "@material/web/button/text-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/button/filled-button.js";
import "@material/web/switch/switch.js";
import "@material/web/select/outlined-select.js";
import "@material/web/select/select-option.js";
import "@material/web/progress/circular-progress.js";
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/progress/circular-progress.js";

class AnalyticsTabContent extends LitElement {
  static properties = {
    recentHarvests: { type: Array },
    selectedChart: { type: String },
    apiService: { type: Object },
    systemStats: { type: Object, state: true },
    isLoadingStats: { type: Boolean, state: true },
    selectedHealthMetric: { type: String, state: true },
  };

  constructor() {
    super();
    this.charts = {};
    this.systemStats = null;
    this.isLoadingStats = false;
    this.selectedHealthMetric = 'overview';
  }

  static styles = css`
    .analytics-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .stats-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      gap: 16px;
    }
    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    .stat-card {
      background: var(--md-sys-color-surface-container);
      border-radius: 12px;
      padding: 12px;
      text-align: center;
    }
    .stat-card h4 {
      margin: 0 0 6px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-card .value {
      font-size: 24px;
      font-weight: 600;
      color: var(--md-sys-color-primary);
      margin: 0;
    }
    md-outlined-select {
      max-width: 300px;
    }
    .chart-wrapper {
      position: relative;
      height: 320px;
      background: var(--md-sys-color-surface-1);
      border-radius: 12px;
      padding: 16px;
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
      border-radius: 12px;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    await this._loadSystemStats();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.destroyCharts();
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (
      changedProperties.has("selectedChart") ||
      changedProperties.has("recentHarvests") ||
      changedProperties.has("selectedHealthMetric") ||
      changedProperties.has("systemStats")
    ) {
      this.destroyCharts();
      this.initSelectedChart();
    }
  }

  async _loadSystemStats() {
    if (!this.apiService) return;

    try {
      this.isLoadingStats = true;
      this.systemStats = await this.apiService.getSystemStats();
    } catch (error) {
      console.error("Failed to load system stats:", error);
      // Use fallback stats based on harvest history
      this.systemStats = this._calculateFallbackStats();
    } finally {
      this.isLoadingStats = false;
    }
  }

  _calculateFallbackStats() {
    const totalHarvests = this.recentHarvests?.length || 0;
    const successfulHarvests =
      this.recentHarvests?.filter((h) => h.success).length || 0;
    const totalRecords =
      this.recentHarvests?.reduce((sum, h) => sum + h.records, 0) || 0;

    return {
      total_harvest_jobs: totalHarvests,
      successful_jobs: successfulHarvests,
      total_records_harvested: totalRecords,
      success_rate:
        totalHarvests > 0
          ? Math.round((successfulHarvests / totalHarvests) * 100)
          : 0,
    };
  }

  destroyCharts() {
    Object.values(this.charts).forEach((chart) => {
      if (chart) chart.destroy();
    });
    this.charts = {};
  }

  initSelectedChart() {
    requestAnimationFrame(() => {
      if (!this.shadowRoot) return;
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
        case "health":
          this.initHealthChart();
          break;
        case "fields":
          this.initFieldMappingChart();
          break;
      }
    });
  }

  initLineChart() {
    const canvas = this.shadowRoot.querySelector("#analyticsChart");
    if (!canvas || this.charts.line) return;

    const ctx = canvas.getContext("2d");
    const labels = (this.recentHarvests || [])
      .map((h) => h.date.split(" ")[0])
      .reverse();
    const data = (this.recentHarvests || []).map((h) => h.records).reverse();

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
            grid: { color: "rgba(128,128,128,0.2)" },
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
    const successCount = (this.recentHarvests || []).filter(
      (h) => h.success
    ).length;
    const failCount = (this.recentHarvests || []).length - successCount;

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
    const sourceCounts = (this.recentHarvests || []).reduce((acc, h) => {
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

  initHealthChart() {
    const canvas = this.shadowRoot.querySelector("#healthChart");
    if (!canvas || this.charts.health) return;
    const ctx = canvas.getContext("2d");

    const stats = this.systemStats || this._calculateFallbackStats();
    let healthData = {};
    let chartTitle = "";

    switch (this.selectedHealthMetric) {
      case 'harvest_performance':
        healthData = {
          'Successful Jobs': stats.successful_jobs || 0,
          'Failed Jobs': stats.failed_jobs || 0,
          'Partial Success': stats.partial_success_jobs || 0,
        };
        chartTitle = `Harvest Performance: ${stats.success_rate || 0}% Success Rate`;
        break;

      case 'field_mapping':
        healthData = {
          'Mapped Fields': stats.mapped_fields_count || 0,
          'Rejected Fields': stats.rejected_fields_count || 0,
          'Unmapped Fields': stats.unmapped_fields_count || 0,
          'Blocking Fields': stats.blocking_unmapped_fields_count || 0,
        };
        chartTitle = `Field Mapping: ${Math.round(stats.field_mapping_completion || 0)}% Complete`;
        break;

      case 'recent_activity':
        healthData = {
          'Recent Jobs': stats.recent_jobs_count || 0,
          'Recent Records': stats.recent_records_processed || 0,
          'Recent Successful': stats.recent_successful_records || 0,
          'Recent Cached': stats.recent_records_cached || 0,
        };
        chartTitle = `Recent Activity: ${stats.recent_success_rate || 0}% Success Rate`;
        break;

      default: // overview
        healthData = {
          'Successful Records': stats.successful_records || 0,
          'Failed Records': stats.failed_records || 0,
          'Cached Records': stats.cached_records_count || 0,
          'Total Jobs': stats.total_harvest_jobs || 0,
        };
        chartTitle = `System Overview: ${stats.system_health?.harvest_success_rate || stats.success_rate || 0}% Health`;
    }

    this.charts.health = new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(healthData),
        datasets: [
          {
            label: "System Health Metrics",
            data: Object.values(healthData),
            backgroundColor: [
              "rgba(52, 211, 153, 0.7)", // green
              "rgba(248, 113, 113, 0.7)", // red
              "rgba(250, 204, 21, 0.7)",  // yellow
              "rgba(59, 130, 246, 0.7)",  // blue
              "rgba(156, 163, 175, 0.7)", // gray
            ],
            borderColor: [
              "rgba(52, 211, 153, 1)",
              "rgba(248, 113, 113, 1)",
              "rgba(250, 204, 21, 1)",
              "rgba(59, 130, 246, 1)",
              "rgba(156, 163, 175, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: chartTitle,
            color: "var(--md-sys-color-on-surface)",
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "var(--md-sys-color-on-surface-variant)",
              stepSize: 1,
            },
            grid: { color: "rgba(128,128,128,0.2)" },
          },
          x: {
            ticks: {
              color: "var(--md-sys-color-on-surface-variant)",
              maxRotation: 45,
            },
            grid: { display: false },
          },
        },
      },
    });
  }

  _handleChartSelect(e) {
    this.dispatchEvent(
      new CustomEvent("select-chart-type", {
        detail: { value: e.target.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleHealthMetricSelect(e) {
    this.selectedHealthMetric = e.target.value;
    // Recreate the health chart with the new metric
    if (this.selectedChart === 'health') {
      this.destroyCharts();
      this.initHealthChart();
    }
  }

  initFieldMappingChart() {
    const canvas = this.shadowRoot.querySelector("#fieldsChart");
    if (!canvas || this.charts.fields) return;
    const ctx = canvas.getContext("2d");

    const stats = this.systemStats || this._calculateFallbackStats();
    const fieldData = {
      'Mapped': stats.mapped_fields_count || 0,
      'Rejected': stats.rejected_fields_count || 0,
      'Unmapped': stats.unmapped_fields_count || 0,
      'Discovered': stats.discovered_fields_count || 0,
      'Whitelisted': stats.whitelisted_fields_count || 0,
    };

    this.charts.fields = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(fieldData),
        datasets: [
          {
            label: "Field Mappings",
            data: Object.values(fieldData),
            backgroundColor: [
              "rgba(52, 211, 153, 0.8)", // green - mapped
              "rgba(248, 113, 113, 0.8)", // red - rejected
              "rgba(156, 163, 175, 0.8)", // gray - unmapped
              "rgba(59, 130, 246, 0.8)",  // blue - discovered
              "rgba(250, 204, 21, 0.8)",  // yellow - whitelisted
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
            position: "right",
            labels: { color: "var(--md-sys-color-on-surface)" },
          },
          title: {
            display: true,
            text: `Field Mapping Status: ${Math.round(stats.field_mapping_completion || 0)}% Complete`,
            color: "var(--md-sys-color-on-surface)",
          }
        },
      },
    });
  }

  render() {
    const stats = this.systemStats || this._calculateFallbackStats();

    return html`
      <div class="analytics-container">
        ${this.isLoadingStats
          ? html`
              <div class="loading-overlay">
                <md-circular-progress indeterminate></md-circular-progress>
              </div>
            `
          : ""}

        <div class="stats-header">
          <h3 style="margin: 0; color: var(--md-sys-color-on-surface);">System Statistics</h3>
          <div style="display: flex; gap: 12px;">
            <md-outlined-select
              label="Chart Type"
              .value=${this.selectedChart}
              @change=${this._handleChartSelect}
            >
              <md-select-option value="trends">
                <div slot="headline">Harvest Trends</div>
              </md-select-option>
              <md-select-option value="status">
                <div slot="headline">Success vs Failed</div>
              </md-select-option>
              <md-select-option value="source">
                <div slot="headline">Harvest Sources</div>
              </md-select-option>
              <md-select-option value="health">
                <div slot="headline">System Health</div>
              </md-select-option>
              <md-select-option value="fields">
                <div slot="headline">Field Mappings</div>
              </md-select-option>
            </md-outlined-select>
            ${when(
              this.selectedChart === 'health',
              () => html`
                <md-outlined-select
                  label="Health Metric"
                  .value=${this.selectedHealthMetric}
                  @change=${this._handleHealthMetricSelect}
                >
                  <md-select-option value="overview">
                    <div slot="headline">Overview</div>
                  </md-select-option>
                  <md-select-option value="harvest_performance">
                    <div slot="headline">Harvest Performance</div>
                  </md-select-option>
                  <md-select-option value="field_mapping">
                    <div slot="headline">Field Mapping Status</div>
                  </md-select-option>
                  <md-select-option value="recent_activity">
                    <div slot="headline">Recent Activity</div>
                  </md-select-option>
                </md-outlined-select>
              `
            )}
          </div>
        </div>

        <div class="stats-cards">
          <!-- Harvest Statistics -->
          <div class="stat-card">
            <h4>Total Harvests</h4>
            <p class="value">${stats.total_harvest_jobs || 0}</p>
          </div>
          <div class="stat-card">
            <h4>Success Rate</h4>
            <p class="value">${stats.success_rate || 0}%</p>
          </div>
          <div class="stat-card">
            <h4>Failed Jobs</h4>
            <p class="value">${stats.failed_jobs || 0}</p>
          </div>
          <div class="stat-card">
            <h4>Automated Jobs</h4>
            <p class="value">${stats.automated_jobs || 0}</p>
          </div>

          <!-- Record Statistics -->
          <div class="stat-card">
            <h4>Records Processed</h4>
            <p class="value">${stats.total_records_processed || 0}</p>
          </div>
          <div class="stat-card">
            <h4>Successful Records</h4>
            <p class="value">${stats.successful_records || 0}</p>
          </div>
          <div class="stat-card">
            <h4>Failed Records</h4>
            <p class="value">${stats.failed_records || 0}</p>
          </div>
          <div class="stat-card">
            <h4>Cached Records</h4>
            <p class="value">${stats.cached_records_count || 0}</p>
          </div>

          <!-- Field Mapping Statistics -->
          <div class="stat-card">
            <h4>Field Mapping</h4>
            <p class="value">${Math.round(stats.field_mapping_completion || 0)}%</p>
          </div>
          <div class="stat-card">
            <h4>Mapped Fields</h4>
            <p class="value">${stats.mapped_fields_count || 0}</p>
          </div>
          <div class="stat-card">
            <h4>Rejected Fields</h4>
            <p class="value">${stats.rejected_fields_count || 0}</p>
          </div>
          <div class="stat-card">
            <h4>Unmapped Fields</h4>
            <p class="value">${stats.unmapped_fields_count || 0}</p>
          </div>

          <!-- System Health -->
          <div class="stat-card">
            <h4>Pure API Status</h4>
            <p class="value" style="font-size: 14px; text-transform: capitalize;">${stats.pure_api_status || 'unknown'}</p>
          </div>
          <div class="stat-card">
            <h4>Blocking Fields</h4>
            <p class="value">${stats.blocking_unmapped_fields_count || 0}</p>
          </div>
        </div>

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
          ${when(
            this.selectedChart === "health",
            () => html`<canvas id="healthChart"></canvas>`
          )}
          ${when(
            this.selectedChart === "fields",
            () => html`<canvas id="fieldsChart"></canvas>`
          )}
        </div>
      </div>
    `;
  }
}

customElements.define("analytics-tab-content", AnalyticsTabContent);
export { AnalyticsTabContent };

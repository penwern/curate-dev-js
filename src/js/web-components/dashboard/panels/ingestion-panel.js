import { LitElement, html, css } from "lit";
import "../components/stat-card.js";
import "../components/chart-card.js";
import "../components/data-table.js";
import {
  getAuditChartData,
  getAuditLogs,
  formatBytes,
  formatNumber,
} from "../client.js";
import { cloudUploadIcon, chartLineIcon } from "../../utils/icons.js";

const UPLOAD_MSG_ID = "22";

class IngestionPanel extends LitElement {
  static properties = {
    workspaces: { type: Array },
    selectedWorkspace: { type: String },
    _statsLoading: { state: true },
    _chartLoading: { state: true },
    _tableLoading: { state: true },
    _totalUploads: { state: true },
    _recentUploads: { state: true },
    _chartData: { state: true },
    _granularity: { state: true },
    _tableRows: { state: true },
    _totalRows: { state: true },
    _hideAipUploads: { state: true },
    _dateFrom: { state: true },
    _dateTo: { state: true },
  };

  static styles = css`
    :host { display: block; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 8px;
    }
    .aip-note {
      font-size: 11px;
      color: var(--md-sys-color-outline);
      margin-bottom: 24px;
    }
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .granularity-toggle {
      display: flex;
      gap: 4px;
      background: var(--md-sys-color-surface-variant);
      border-radius: 8px;
      padding: 2px;
    }
    .gran-btn {
      border: none;
      background: transparent;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-family: "Roboto", sans-serif;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .gran-btn.active {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
    }
    .chart-section { margin-bottom: 24px; }
    .table-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .table-heading {
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
    }
    .aip-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-family: "Roboto", sans-serif;
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
      user-select: none;
    }
    .aip-toggle input[type="checkbox"] {
      appearance: none;
      width: 32px;
      height: 18px;
      background: var(--md-sys-color-outline);
      border-radius: 9px;
      cursor: pointer;
      position: relative;
      transition: background 0.2s ease;
      flex-shrink: 0;
    }
    .aip-toggle input[type="checkbox"]::after {
      content: "";
      position: absolute;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: white;
      top: 3px;
      left: 3px;
      transition: transform 0.2s ease;
    }
    .aip-toggle input[type="checkbox"]:checked {
      background: var(--md-sys-color-primary);
    }
    .aip-toggle input[type="checkbox"]:checked::after {
      transform: translateX(14px);
    }
    .table-filter-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .date-range {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-family: "Roboto", sans-serif;
      color: var(--md-sys-color-on-surface-variant);
    }
    .date-range input[type="date"] {
      font-family: "Roboto", sans-serif;
      font-size: 12px;
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 6px;
      padding: 5px 8px;
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      cursor: pointer;
    }
    .date-range input[type="date"]:focus {
      outline: none;
      border-color: var(--md-sys-color-primary);
    }
    .date-range input[type="date"]::-webkit-calendar-picker-indicator {
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
    }
    .clear-dates {
      font-size: 11px;
      color: var(--md-sys-color-primary);
      cursor: pointer;
      background: none;
      border: none;
      font-family: "Roboto", sans-serif;
      padding: 0;
      text-decoration: underline;
    }
  `;

  constructor() {
    super();
    this.workspaces = [];
    this.selectedWorkspace = "";
    this._statsLoading = true;
    this._chartLoading = true;
    this._tableLoading = true;
    this._totalUploads = 0;
    this._recentUploads = 0;
    this._chartData = null;
    this._granularity = "monthly";
    this._tableRows = [];
    this._totalRows = 0;
    this._hideAipUploads = true;
    this._dateFrom = "";
    this._dateTo = "";
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadData();
  }

  updated(changed) {
    if (changed.has("selectedWorkspace")) {
      this._loadTable(0);
    }
  }

  _loadData() {
    this._loadStats();
    this._loadChart();
    this._loadTable();
  }

  _archiveWsUuid() {
    return this.workspaces.find((w) => w.Slug === "archive")?.UUID ?? null;
  }

  _selectedWsDsPath() {
    if (!this.selectedWorkspace) return null;
    const ws = this.workspaces.find((w) => w.Slug === this.selectedWorkspace);
    if (!ws) return null;
    for (const rn of Object.values(ws.RootNodes ?? {})) {
      const p = rn.Path?.replace(/\/$/, "");
      if (p) return p;
    }
    return null;
  }

  _buildTableQuery() {
    let query = `+MsgId:${UPLOAD_MSG_ID}`;
    if (this.selectedWorkspace) {
      const dsPath = this._selectedWsDsPath();
      if (dsPath) {
        query += ` +NodePath:${dsPath}*`;
      } else {
        const wsUuid = this.workspaces.find((w) => w.Slug === this.selectedWorkspace)?.UUID;
        if (wsUuid) query += ` +WsUuid:${wsUuid}`;
      }
    } else if (this._hideAipUploads) {
      const uuid = this._archiveWsUuid();
      if (uuid) query += ` -WsUuid:${uuid}`;
    }
    if (this._dateFrom) {
      const ts = Math.floor(new Date(this._dateFrom + "T00:00:00").getTime() / 1000);
      query += ` +Ts:>${ts}`;
    }
    if (this._dateTo) {
      const ts = Math.floor(new Date(this._dateTo + "T23:59:59").getTime() / 1000);
      query += ` +Ts:<${ts}`;
    }
    return query;
  }

  async _loadStats() {
    this._statsLoading = true;
    try {
      const now = Math.floor(Date.now() / 1000);
      const [yearRes, monthRes] = await Promise.all([
        getAuditChartData(UPLOAD_MSG_ID, "Y", now),
        getAuditChartData(UPLOAD_MSG_ID, "M", now),
      ]);
      this._totalUploads = (yearRes.Results ?? []).reduce((s, r) => s + (r.Count ?? 0), 0);
      this._recentUploads = (monthRes.Results ?? []).reduce((s, r) => s + (r.Count ?? 0), 0);
    } catch (err) {
      console.error("IngestionPanel stats error:", err);
    } finally {
      this._statsLoading = false;
    }
  }

  async _loadChart() {
    this._chartLoading = true;
    try {
      await this._buildChart();
    } catch (err) {
      console.error("IngestionPanel chart error:", err);
    } finally {
      this._chartLoading = false;
    }
  }

  async _buildChart() {
    const rangeMap = { daily: "W", weekly: "M", monthly: "Y" };
    const now = Math.floor(Date.now() / 1000);
    const res = await getAuditChartData(UPLOAD_MSG_ID, rangeMap[this._granularity] ?? "Y", now);
    const results = (res.Results ?? []).filter((r) => r.Name);

    const style = getComputedStyle(document.documentElement);
    const primary = style.getPropertyValue("--md-sys-color-primary").trim() || "#006689";
    const primaryContainer = style.getPropertyValue("--md-sys-color-primary-container").trim() || "#c3e8ff";

    this._chartData = {
      labels: results.map((r) => r.Name),
      datasets: [{
        label: "Files Uploaded",
        data: results.map((r) => r.Count ?? 0),
        borderColor: primary,
        backgroundColor: primaryContainer + "99",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: primary,
        borderWidth: 2,
      }],
    };
  }

  async _setGranularity(g) {
    this._granularity = g;
    this._chartLoading = true;
    try {
      await this._buildChart();
    } finally {
      this._chartLoading = false;
    }
  }

  _buildPathToLabel() {
    const map = new Map();
    for (const ws of this.workspaces) {
      for (const rn of Object.values(ws.RootNodes ?? {})) {
        const dsPath = rn.Path?.replace(/\/$/, "") ?? "";
        if (dsPath) map.set(dsPath, ws.Label ?? dsPath);
      }
    }
    return map;
  }

  async _loadTable(page = 0) {
    this._tableLoading = true;
    try {
      const pathToLabel = this._buildPathToLabel();
      const res = await getAuditLogs(this._buildTableQuery(), page, 25);
      this._totalRows = res.Total ?? 0;
      const logs = res.Logs ?? [];
      this._tableRows = logs.map((log) => {
        const path = log.NodePath ?? "";
        const parts = path.split("/");
        const name = parts.pop() || "Unknown";
        const dsRoot = parts[0] ?? "";
        return {
          name,
          workspace: pathToLabel.get(dsRoot) ?? dsRoot,
          user: log.UserName ?? "",
          size: parseInt(log.TransferSize ?? "0", 10),
          date: log.Ts ?? 0,
          path,
        };
      });
    } catch (err) {
      console.error("IngestionPanel table error:", err);
    } finally {
      this._tableLoading = false;
    }
  }

  _onPageChanged(e) {
    this._loadTable(e.detail.page);
  }

  _formatUploadDate(ts) {
    if (!ts) return "—";
    return new Date(ts * 1000).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  render() {
    const columns = [
      { field: "name", label: "File Name" },
      { field: "workspace", label: "Workspace" },
      { field: "user", label: "Uploaded By" },
      { field: "size", label: "Size", format: (v) => formatBytes(v) },
      { field: "date", label: "Date", format: (v) => this._formatUploadDate(v) },
    ];

    return html`
      <div class="stats-grid">
        <stat-card
          label="Total Uploads"
          .value=${formatNumber(this._totalUploads)}
          subtitle="Upload events · last 12 months"
          .loading=${this._statsLoading}
          style="--stat-accent: var(--md-sys-color-primary)"
        >
          <span slot="icon">${cloudUploadIcon}</span>
        </stat-card>
        <stat-card
          label="This Month"
          .value=${formatNumber(this._recentUploads)}
          subtitle="Uploads this month"
          .loading=${this._statsLoading}
          style="--stat-accent: var(--md-sys-color-tertiary)"
        >
          <span slot="icon">${chartLineIcon}</span>
        </stat-card>
      </div>
      <div class="aip-note">Stats and chart include AIP uploads · counts reflect individual file events; a single folder deletion can remove many uploaded files</div>

      <div class="filter-bar">
        <div class="granularity-toggle">
          ${["daily", "weekly", "monthly"].map((g) => html`
            <button
              class="gran-btn ${this._granularity === g ? "active" : ""}"
              @click=${() => this._setGranularity(g)}
            >
              ${g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          `)}
        </div>
      </div>

      <div class="chart-section">
        <chart-card
          heading="Uploads Over Time"
          type="line"
          .data=${this._chartData}
          .loading=${this._chartLoading}
          .height=${320}
          .options=${{
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw.toLocaleString()} files uploaded` } },
            },
            scales: { y: { ticks: { precision: 0 } } },
          }}
        ></chart-card>
      </div>

      <div class="table-header">
        <div class="table-heading">Recent Uploads</div>
        <label class="aip-toggle">
          <input
            type="checkbox"
            .checked=${this._hideAipUploads}
            @change=${(e) => {
              this._hideAipUploads = e.target.checked;
              this._loadTable(0);
            }}
          />
          Hide AIP uploads
        </label>
      </div>
      <div class="table-filter-bar">
        <div class="date-range">
          <span>From</span>
          <input
            type="date"
            .value=${this._dateFrom}
            .max=${this._dateTo || ""}
            @change=${(e) => { this._dateFrom = e.target.value; this._loadTable(0); }}
          />
          <span>To</span>
          <input
            type="date"
            .value=${this._dateTo}
            .min=${this._dateFrom || ""}
            @change=${(e) => { this._dateTo = e.target.value; this._loadTable(0); }}
          />
        </div>
        ${this._dateFrom || this._dateTo ? html`
          <button class="clear-dates" @click=${() => { this._dateFrom = ""; this._dateTo = ""; this._loadTable(0); }}>
            Clear dates
          </button>
        ` : ""}
      </div>
      <data-table
        .columns=${columns}
        .rows=${this._tableRows}
        .loading=${this._tableLoading}
        .pageSize=${25}
        .serverPaginated=${true}
        .sortable=${false}
        @page-changed=${this._onPageChanged}
      ></data-table>
    `;
  }
}

customElements.define("ingestion-panel", IngestionPanel);

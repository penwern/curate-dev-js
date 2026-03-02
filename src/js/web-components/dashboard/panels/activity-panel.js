import { LitElement, html, css } from "lit";
import "../components/stat-card.js";
import "../components/chart-card.js";
import "../components/data-table.js";
import { getAuditChartData, getAuditLogs, formatNumber } from "../client.js";
import { historyIcon, chartLineIcon } from "../../utils/icons.js";
import { fetchAllAuditLogs } from "../utils/export-utils.js";

const MSG_IDS = ["11", "13", "19", "20", "21", "22", "75", "77"];

const BASE_QUERY = "MsgId:11 MsgId:13 MsgId:19 MsgId:20 MsgId:21 MsgId:22 MsgId:75 MsgId:77";

const ACTIVITY_TYPES = {
  "11": { label: "Create", color: "#006d43" },
  "13": { label: "Access", color: "#006689" },
  "19": { label: "Delete", color: "#ba1a1a" },
  "20": { label: "Move", color: "#7e5700" },
  "21": { label: "Access", color: "#006689" },
  "22": { label: "Upload", color: "#0e5cb7" },
  "75": { label: "Share", color: "#4e616d" },
  "77": { label: "Share Modified", color: "#605a7d" },
};

const TYPE_FILTER_OPTIONS = [
  { label: "All Types", query: "" },
  { label: "Access", query: "MsgId:13 MsgId:21" },
  { label: "Create", query: "MsgId:11" },
  { label: "Delete", query: "MsgId:19" },
  { label: "Move", query: "MsgId:20" },
  { label: "Upload", query: "MsgId:22" },
  { label: "Share", query: "MsgId:75" },
  { label: "Share Modified", query: "MsgId:77" },
];

const LABEL_COLORS = {
  Access: "#4285f4",
  Create: "#34a853",
  Delete: "#ea4335",
  Move: "#fbbc04",
  Upload: "#00acc1",
  Share: "#9334e6",
  "Share Modified": "#e8710a",
};

class ActivityPanel extends LitElement {
  static properties = {
    workspaces: { type: Array },
    selectedWorkspace: { type: String },
    _statsLoading: { state: true },
    _chartLoading: { state: true },
    _tableLoading: { state: true },
    _totalActivities: { state: true },
    _thisMonth: { state: true },
    _timelineData: { state: true },
    _typeData: { state: true },
    _granularity: { state: true },
    _tableRows: { state: true },
    _tablePage: { state: true },
    _typeFilter: { state: true },
  };

  static styles = css`
    :host { display: block; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
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
    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .table-section { margin-top: 8px; }
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
    .type-filter {
      font-family: "Roboto", sans-serif;
      font-size: 12px;
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 6px;
      padding: 5px 8px;
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      cursor: pointer;
    }
    .type-filter:focus {
      outline: none;
      border-color: var(--md-sys-color-primary);
    }
    @media (max-width: 768px) {
      .charts-row { grid-template-columns: 1fr; }
    }
  `;

  constructor() {
    super();
    this.workspaces = [];
    this.selectedWorkspace = "";
    this._statsLoading = true;
    this._chartLoading = true;
    this._tableLoading = true;
    this._totalActivities = 0;
    this._thisMonth = 0;
    this._timelineData = null;
    this._typeData = null;
    this._granularity = "monthly";
    this._tableRows = [];
    this._tablePage = 0;
    this._typeFilter = "";
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadStats();
    this._loadChart();
    this._loadTable(0);
  }

  updated(changed) {
    if (changed.has("selectedWorkspace") && changed.get("selectedWorkspace") !== undefined) {
      this._tablePage = 0;
      this._loadTable(0);
    }
  }

  _buildQuery() {
    const typeOpt = TYPE_FILTER_OPTIONS.find((o) => o.label === this._typeFilter);
    let query = typeOpt?.query || BASE_QUERY;
    if (this.selectedWorkspace) {
      const ws = this.workspaces.find((w) => w.Slug === this.selectedWorkspace);
      if (ws?.UUID) query += ` +WsUuid:${ws.UUID}`;
    }
    return query;
  }

  async _loadStats() {
    this._statsLoading = true;
    try {
      const now = Math.floor(Date.now() / 1000);
      const [yearResults, monthResults] = await Promise.all([
        Promise.all(MSG_IDS.map((id) => getAuditChartData(id, "Y", now))),
        Promise.all(MSG_IDS.map((id) => getAuditChartData(id, "M", now))),
      ]);
      this._totalActivities = yearResults.reduce(
        (sum, res) => sum + (res.Results ?? []).reduce((s, r) => s + (r.Count ?? 0), 0),
        0,
      );
      this._thisMonth = monthResults.reduce(
        (sum, res) => sum + (res.Results ?? []).reduce((s, r) => s + (r.Count ?? 0), 0),
        0,
      );
      this._buildTypeChart(yearResults);
    } catch (err) {
      console.error("ActivityPanel stats error:", err);
    } finally {
      this._statsLoading = false;
    }
  }

  async _loadChart() {
    this._chartLoading = true;
    try {
      await this._buildChart();
    } catch (err) {
      console.error("ActivityPanel chart error:", err);
    } finally {
      this._chartLoading = false;
    }
  }

  async _buildChart() {
    const rangeMap = { daily: "W", weekly: "M", monthly: "Y" };
    const now = Math.floor(Date.now() / 1000);
    const allResults = await Promise.all(
      MSG_IDS.map((id) => getAuditChartData(id, rangeMap[this._granularity] ?? "Y", now)),
    );

    const merged = {};
    for (const res of allResults) {
      for (const { Name, Count } of (res.Results ?? []).filter((r) => r.Name)) {
        merged[Name] = (merged[Name] ?? 0) + (Count ?? 0);
      }
    }
    const entries = Object.entries(merged);

    const style = getComputedStyle(document.documentElement);
    const primary = style.getPropertyValue("--md-sys-color-primary").trim() || "#006689";
    const primaryContainer = style.getPropertyValue("--md-sys-color-primary-container").trim() || "#c3e8ff";

    this._timelineData = {
      labels: entries.map(([name]) => name),
      datasets: [
        {
          label: "Activities",
          data: entries.map(([, count]) => count),
          borderColor: primary,
          backgroundColor: primaryContainer + "99",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: primary,
          borderWidth: 2,
        },
      ],
    };
  }

  _buildTypeChart(yearResults) {
    const typeTotals = {};
    for (let i = 0; i < MSG_IDS.length; i++) {
      const count = (yearResults[i].Results ?? []).reduce((s, r) => s + (r.Count ?? 0), 0);
      if (count === 0) continue;
      const label = ACTIVITY_TYPES[MSG_IDS[i]]?.label ?? MSG_IDS[i];
      typeTotals[label] = (typeTotals[label] ?? 0) + count;
    }

    const entries = Object.entries(typeTotals).sort((a, b) => b[1] - a[1]);
    this._typeData = {
      labels: entries.map(([l]) => l),
      datasets: [
        {
          data: entries.map(([, v]) => v),
          backgroundColor: entries.map(([l]) => LABEL_COLORS[l] ?? "#71787d"),
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
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
    this._tablePage = page;
    try {
      const pathToLabel = this._buildPathToLabel();
      const res = await getAuditLogs(this._buildQuery(), page, 25);
      this._tableRows = (res.Logs ?? []).map((log) => this._mapLog(log, pathToLabel));
    } catch (err) {
      console.error("ActivityPanel table error:", err);
    } finally {
      this._tableLoading = false;
    }
  }

  _onPageChanged(e) {
    this._loadTable(e.detail.page);
  }

  _mapLog(log, pathToLabel = new Map()) {
    const msgId = String(log.MsgId ?? "");
    let path = log.NodePath ?? "";

    if (!path) {
      const msg = log.Msg ?? "";
      if (msgId === "20") {
        const match = msg.match(/Moved \[(.+?)\] to \[(.+?)\]/);
        if (match) path = match[2]; // use destination path
      } else if (msgId === "75" || msgId === "77") {
        const match = msg.match(/\[([^\]]+)\]/);
        // only use if it looks like a name, not a UUID
        if (match && !/^[0-9a-f-]{36}$/.test(match[1])) path = match[1];
      }
    }

    const parts = path.split("/").filter(Boolean);
    const dsRoot = parts[0] ?? "";
    const wsLabel = pathToLabel.get(dsRoot) ?? dsRoot;
    // If path has only the datasource root segment, don't echo it as the item name
    const rawObject = parts.length > 0 ? parts[parts.length - 1] : "";
    const object = rawObject === dsRoot && pathToLabel.has(dsRoot) ? "" : rawObject;

    return {
      typeLabel: ACTIVITY_TYPES[msgId]?.label ?? "Activity",
      actor: log.UserName ?? "",
      object,
      workspace: wsLabel,
      date: log.Ts ?? 0,
    };
  }

  /**
   * Returns all activity data structured for export.
   * Fetches ALL matching log records (bypasses pagination).
   */
  async getExportData() {
    const pathToLabel = this._buildPathToLabel();
    const query = this._buildQuery();

    const [allLogs, yearResults, monthResults] = await Promise.all([
      fetchAllAuditLogs(getAuditLogs, query),
      Promise.all(MSG_IDS.map((id) => getAuditChartData(id, "Y", Math.floor(Date.now() / 1000)))),
      Promise.all(MSG_IDS.map((id) => getAuditChartData(id, "M", Math.floor(Date.now() / 1000)))),
    ]);

    const totalYear = yearResults.reduce(
      (sum, res) => sum + (res.Results ?? []).reduce((s, r) => s + (r.Count ?? 0), 0), 0,
    );
    const totalMonth = monthResults.reduce(
      (sum, res) => sum + (res.Results ?? []).reduce((s, r) => s + (r.Count ?? 0), 0), 0,
    );

    const summary = [
      { Metric: "Total Activities (Last 12 Months)", Value: totalYear },
      { Metric: "This Month", Value: totalMonth },
      { Metric: "Workspace Filter", Value: this.selectedWorkspace || "All Workspaces" },
      { Metric: "Activity Type Filter", Value: this._typeFilter || "All Types" },
    ];

    const log = allLogs.map((rawLog) => {
      const mapped = this._mapLog(rawLog, pathToLabel);
      return {
        "Activity Type": mapped.typeLabel,
        User: mapped.actor,
        Item: mapped.object,
        Workspace: mapped.workspace,
        Date: rawLog.Ts ? new Date(rawLog.Ts * 1000).toISOString() : "",
      };
    });

    // Aggregate by type for the "by type" sheet
    const typeTotals = {};
    for (let i = 0; i < MSG_IDS.length; i++) {
      const count = (yearResults[i].Results ?? []).reduce((s, r) => s + (r.Count ?? 0), 0);
      if (count === 0) continue;
      const label = ACTIVITY_TYPES[MSG_IDS[i]]?.label ?? MSG_IDS[i];
      typeTotals[label] = (typeTotals[label] ?? 0) + count;
    }
    const byType = Object.entries(typeTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ "Activity Type": type, Count: count }));

    // Time series (merged across all types) for annual view
    const merged = {};
    for (const res of yearResults) {
      for (const { Name, Count } of (res.Results ?? []).filter((r) => r.Name)) {
        merged[Name] = (merged[Name] ?? 0) + (Count ?? 0);
      }
    }
    const timeSeries = Object.entries(merged).map(([period, count]) => ({
      Period: period,
      "Total Events": count,
    }));

    return { summary, log, byType, timeSeries };
  }

  _formatDate(ts) {
    if (!ts) return "—";
    return new Date(ts * 1000).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  render() {
    const columns = [
      { field: "typeLabel", label: "Activity" },
      { field: "actor", label: "User" },
      { field: "object", label: "Item" },
      { field: "workspace", label: "Workspace" },
      { field: "date", label: "Date", format: (v) => this._formatDate(v) },
    ];

    return html`
      <div class="stats-grid">
        <stat-card
          label="Total Activities"
          .value=${formatNumber(this._totalActivities)}
          subtitle="All time"
          .loading=${this._statsLoading}
          style="--stat-accent: var(--md-sys-color-primary)"
        >
          <span slot="icon">${historyIcon}</span>
        </stat-card>
        <stat-card
          label="This Month"
          .value=${formatNumber(this._thisMonth)}
          subtitle="Activity this month"
          .loading=${this._statsLoading}
          style="--stat-accent: var(--md-sys-color-tertiary)"
        >
          <span slot="icon">${chartLineIcon}</span>
        </stat-card>
      </div>

      <div class="filter-bar">
        <div class="granularity-toggle">
          ${["daily", "weekly", "monthly"].map(
            (g) => html`
              <button
                class="gran-btn ${this._granularity === g ? "active" : ""}"
                @click=${() => this._setGranularity(g)}
              >
                ${g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            `,
          )}
        </div>
      </div>

      <div class="charts-row">
        <chart-card
          heading="Activity Over Time"
          type="line"
          .data=${this._timelineData}
          .loading=${this._chartLoading}
          .height=${280}
          .options=${{
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw.toLocaleString()} events` } },
            },
            scales: { y: { ticks: { precision: 0 } } },
          }}
        ></chart-card>
        <chart-card
          heading="Activity by Type"
          type="doughnut"
          .data=${this._typeData}
          .loading=${this._statsLoading}
          .height=${280}
          .options=${{
            cutout: "55%",
            plugins: {
              legend: { display: true, position: "right" },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.label}: ${ctx.raw.toLocaleString()} events`,
                },
              },
            },
          }}
        ></chart-card>
      </div>

      <div class="table-section">
        <div class="table-header">
          <div class="table-heading">Activity Log</div>
          <select
            class="type-filter"
            .value=${this._typeFilter}
            @change=${(e) => { this._typeFilter = e.target.value; this._tablePage = 0; this._loadTable(0); }}
          >
            ${TYPE_FILTER_OPTIONS.map((o) => html`<option value=${o.label}>${o.label}</option>`)}
          </select>
        </div>
        <data-table
          .columns=${columns}
          .rows=${this._tableRows}
          .loading=${this._tableLoading}
          .pageSize=${25}
          .serverPaginated=${true}
          .sortable=${false}
          .page=${this._tablePage}
          @page-changed=${this._onPageChanged}
        ></data-table>
      </div>
    `;
  }
}

customElements.define("activity-panel", ActivityPanel);

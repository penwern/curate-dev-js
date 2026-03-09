import { LitElement, html, css } from "lit";
import "../components/stat-card.js";
import "../components/chart-card.js";
import { listRootStats, getStorageHistory, formatBytes, formatNumber } from "../client.js";
import { harddiskIcon, folderIcon } from "../../utils/icons.js";

class StoragePanel extends LitElement {
  static properties = {
    workspaces: { type: Array },
    selectedWorkspace: { type: String },
    storageReportingUrl: { type: String },
    _statsLoading: { state: true },
    _chartsLoading: { state: true },
    _totalSize: { state: true },
    _largestWs: { state: true },
    _wsCount: { state: true },
    _barData: { state: true },
    _doughnutData: { state: true },
    _wsDetails: { state: true },
    _historyLoading: { state: true },
    _historyData: { state: true },
    _bucket: { state: true },
    _rangeKey: { state: true },
    _historyView: { state: true },
  };

  static styles = css`
    :host { display: block; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .ws-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .ws-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--md-sys-color-surface);
      border: 1px solid var(--md-sys-color-outline-variant-50);
      border-radius: 8px;
    }
    .ws-row-name {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
    }
    .ws-row-size {
      width: 72px;
      flex-shrink: 0;
      text-align: right;
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
      font-variant-numeric: tabular-nums;
    }
    .ws-row-bar {
      width: 120px;
      height: 6px;
      background: var(--md-sys-color-surface-variant);
      border-radius: 3px;
      overflow: hidden;
    }
    .ws-row-bar-fill {
      height: 100%;
      background: var(--md-sys-color-primary);
      border-radius: 3px;
      transition: width 0.4s ease;
    }
    .history-section {
      margin-top: 24px;
    }
    .history-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .history-controls select {
      font-family: inherit;
      font-size: 12px;
      padding: 4px 8px;
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 6px;
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      cursor: pointer;
      outline: none;
    }
    .history-controls select:focus {
      border-color: var(--md-sys-color-primary);
    }
    .history-controls .ctrl-sep {
      width: 1px;
      height: 16px;
      background: var(--md-sys-color-outline-variant);
      margin: 0 2px;
    }
    .toggle-group {
      display: flex;
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 6px;
      overflow: hidden;
    }
    .toggle-btn {
      padding: 4px 10px;
      font-family: inherit;
      font-size: 12px;
      border: none;
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .toggle-btn.active {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }
    .toggle-btn + .toggle-btn {
      border-left: 1px solid var(--md-sys-color-outline-variant);
    }
    .section-heading {
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      margin-bottom: 12px;
    }
    .note {
      font-size: 12px;
      color: var(--md-sys-color-outline);
      font-style: italic;
      margin-top: 16px;
    }
    @media (max-width: 768px) {
      .charts-row { grid-template-columns: 1fr; }
    }
  `;

  constructor() {
    super();
    this.workspaces = [];
    this.selectedWorkspace = "";
    this.storageReportingUrl = "";
    this._statsLoading = true;
    this._chartsLoading = true;
    this._totalSize = 0;
    this._largestWs = "";
    this._wsCount = 0;
    this._barData = null;
    this._doughnutData = null;
    this._wsDetails = [];
    this._loadGen = 0;
    this._historyLoading = false;
    this._historyData = null;
    this._bucket = "day";
    this._rangeKey = "30d";
    this._historyView = "total";
    this._historyGen = 0;
    this._rawHistorySeries = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadData();
  }

  updated(changed) {
    if (changed.has("workspaces") && this.workspaces.length) {
      this._loadData();
    }
    if (changed.has("storageReportingUrl") && this.storageReportingUrl) {
      this._loadHistory();
    }
    if ((changed.has("_bucket") || changed.has("_rangeKey")) && this.storageReportingUrl) {
      this._loadHistory();
    }
    if (changed.has("_historyView") && this._rawHistorySeries) {
      this._rebuildHistoryChart();
    }
  }

  async _loadData() {
    if (!this.workspaces.length) return;
    const gen = ++this._loadGen;
    this._statsLoading = true;
    this._chartsLoading = true;
    this._wsDetails = [];

    const style = getComputedStyle(document.documentElement);
    const primary = style.getPropertyValue("--md-sys-color-primary").trim() || "#006689";
    const vibrantHues = [primary, "#4285f4", "#34a853", "#fbbc04", "#ea4335", "#9334e6", "#e8710a", "#00acc1"];

    try {
      // Build datasource path → workspace label map via RootNodes (same approach as file-overview panel).
      // This avoids using workspace slugs as tree paths, which breaks when slug ≠ datasource name.
      const pathToLabel = new Map();
      for (const ws of this.workspaces) {
        for (const rn of Object.values(ws.RootNodes ?? {})) {
          const dsPath = rn.Path?.replace(/\/$/, "") ?? "";
          if (dsPath) pathToLabel.set(dsPath, ws.Label ?? dsPath);
        }
      }

      const res = await listRootStats();
      if (gen !== this._loadGen) return;

      const results = (res.Children ?? [])
        .filter((c) => pathToLabel.has(c.Path))
        .map((c) => ({
          slug: c.Path,
          label: pathToLabel.get(c.Path),
          size: parseInt(c.Size ?? "0", 10),
          children: parseInt(c.MetaStore?.RecursiveCount ?? "0", 10),
        }))
        .sort((a, b) => b.size - a.size);

      this._wsDetails = results;
      this._totalSize = results.reduce((s, r) => s + r.size, 0);
      this._wsCount = results.length;
      this._largestWs = results[0]?.label ?? "—";
      this._rebuildCharts(results, vibrantHues);
    } catch (err) {
      console.error("StoragePanel load error:", err);
    } finally {
      if (gen === this._loadGen) {
        this._statsLoading = false;
        this._chartsLoading = false;
      }
    }
  }

  /**
   * Returns all storage data structured for export.
   */
  async getExportData() {
    // Build workspace stats inline — works on detached elements (global export)
    let wsDetails = this._wsDetails;
    if (!wsDetails.length && this.workspaces.length) {
      const pathToLabel = new Map();
      for (const ws of this.workspaces) {
        for (const rn of Object.values(ws.RootNodes ?? {})) {
          const dsPath = rn.Path?.replace(/\/$/, "") ?? "";
          if (dsPath) pathToLabel.set(dsPath, ws.Label ?? dsPath);
        }
      }
      const res = await listRootStats();
      wsDetails = (res.Children ?? [])
        .filter((c) => pathToLabel.has(c.Path))
        .map((c) => ({
          slug: c.Path,
          label: pathToLabel.get(c.Path),
          size: parseInt(c.Size ?? "0", 10),
          children: parseInt(c.MetaStore?.RecursiveCount ?? "0", 10),
        }))
        .sort((a, b) => b.size - a.size);
    }

    const totalSize = wsDetails.reduce((s, r) => s + r.size, 0);

    const summary = [
      { Metric: "Total Storage", Value: formatBytes(totalSize) },
      { Metric: "Total Storage (Bytes)", Value: totalSize },
      { Metric: "Workspaces with Content", Value: wsDetails.length },
      { Metric: "Largest Workspace", Value: wsDetails[0]?.label ?? "—" },
      { Metric: "Largest Workspace Size", Value: formatBytes(wsDetails[0]?.size ?? 0) },
    ];

    const workspaces = wsDetails.map((ws) => ({
      Workspace: ws.label,
      "Size (Bytes)": ws.size,
      "Size (Formatted)": formatBytes(ws.size),
      "File Count": ws.children,
      "% of Total": totalSize > 0 ? ((ws.size / totalSize) * 100).toFixed(1) + "%" : "0%",
    }));

    return { summary, workspaces };
  }

  async _loadHistory() {
    if (!this.storageReportingUrl) return;
    const gen = ++this._historyGen;
    this._historyLoading = true;
    this._historyData = null;

    const now = Math.floor(Date.now() / 1000);
    const offsets = { "30d": 30 * 86400, "6m": 180 * 86400, "1y": 365 * 86400 };
    const from = now - (offsets[this._rangeKey] ?? 30 * 86400);

    try {
      const res = await getStorageHistory(this.storageReportingUrl, {
        bucket: this._bucket,
        from,
        to: now,
      });
      if (gen !== this._historyGen) return;
      this._rawHistorySeries = res.series ?? [];
      this._rebuildHistoryChart();
    } catch (err) {
      console.error("StoragePanel history load error:", err);
    } finally {
      if (gen === this._historyGen) this._historyLoading = false;
    }
  }

  _rebuildHistoryChart() {
    const series = this._rawHistorySeries;
    if (!series || !series.length) {
      this._historyData = null;
      return;
    }

    const style = getComputedStyle(document.documentElement);
    const primary = style.getPropertyValue("--md-sys-color-primary").trim() || "#006689";
    const vibrantHues = [primary, "#4285f4", "#34a853", "#fbbc04", "#ea4335", "#9334e6", "#e8710a", "#00acc1"];

    if (this._historyView === "total") {
      const bucketMap = new Map();
      for (const ds of series) {
        for (const point of ds.data) {
          bucketMap.set(point.bucket, (bucketMap.get(point.bucket) ?? 0) + point.bytes);
        }
      }
      const sorted = [...bucketMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      this._historyData = {
        labels: sorted.map(([b]) => b),
        datasets: [{
          label: "Total Storage",
          data: sorted.map(([, v]) => v),
          borderColor: primary,
          backgroundColor: primary + "22",
          fill: true,
          tension: 0.3,
          pointRadius: sorted.length > 60 ? 0 : 3,
          pointHoverRadius: 4,
        }],
      };
    } else {
      const allBuckets = new Set();
      for (const ds of series) {
        for (const point of ds.data) allBuckets.add(point.bucket);
      }
      const labels = [...allBuckets].sort((a, b) => a.localeCompare(b));
      this._historyData = {
        labels,
        datasets: series.map((ds, i) => {
          const dataMap = new Map(ds.data.map((p) => [p.bucket, p.bytes]));
          const color = vibrantHues[i % vibrantHues.length];
          return {
            label: ds.datasource,
            data: labels.map((l) => dataMap.get(l) ?? null),
            borderColor: color,
            backgroundColor: color + "22",
            fill: false,
            tension: 0.3,
            pointRadius: labels.length > 60 ? 0 : 3,
            pointHoverRadius: 4,
            spanGaps: true,
          };
        }),
      };
    }
  }

  _rebuildCharts(results, vibrantHues) {
    this._barData = {
      labels: results.map((r) => r.label),
      datasets: [{
        label: "Storage",
        data: results.map((r) => r.size),
        backgroundColor: results.map((_, i) => vibrantHues[i % vibrantHues.length] + "CC"),
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 28,
      }],
    };

    this._doughnutData = {
      labels: results.map((r) => r.label),
      datasets: [{
        data: results.map((r) => r.size),
        backgroundColor: results.map((_, i) => vibrantHues[i % vibrantHues.length]),
        borderWidth: 0,
        hoverOffset: 4,
      }],
    };
  }

  render() {
    const maxSize = Math.max(...this._wsDetails.map((w) => w.size), 1);

    return html`
      <div class="stats-grid">
        <stat-card
          label="Total Storage"
          .value=${formatBytes(this._totalSize)}
          subtitle="Across all workspaces"
          .loading=${this._statsLoading}
          style="--stat-accent: var(--md-sys-color-tertiary)"
        >
          <span slot="icon">${harddiskIcon}</span>
        </stat-card>
        <stat-card
          label="Workspaces"
          .value=${formatNumber(this._wsCount)}
          subtitle="With stored content"
          .loading=${this._statsLoading}
          style="--stat-accent: var(--md-sys-color-secondary)"
        >
          <span slot="icon">${folderIcon}</span>
        </stat-card>
        <stat-card
          label="Largest Workspace"
          .value=${this._largestWs}
          subtitle=${formatBytes(this._wsDetails[0]?.size ?? 0)}
          .loading=${this._statsLoading}
          style="--stat-accent: var(--md-sys-color-primary)"
        ></stat-card>
      </div>

      <div class="charts-row">
        <chart-card
          heading="Storage by Workspace"
          type="bar"
          .data=${this._barData}
          .loading=${this._chartsLoading}
          .height=${300}
          .options=${{
            indexAxis: "y",
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx) => ` ${formatBytes(ctx.raw)}` } },
            },
            scales: {
              x: { ticks: { callback: (v) => formatBytes(v) } },
            },
          }}
        ></chart-card>
        <chart-card
          heading="Storage Distribution"
          type="doughnut"
          .data=${this._doughnutData}
          .loading=${this._chartsLoading}
          .height=${300}
          .options=${{
            cutout: "55%",
            plugins: {
              legend: { display: true, position: "right" },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const pct = ((ctx.raw / this._totalSize) * 100).toFixed(1);
                    return ` ${ctx.label}: ${formatBytes(ctx.raw)} (${pct}%)`;
                  },
                },
              },
            },
          }}
        ></chart-card>
      </div>

      <div class="section-heading">Workspace Breakdown</div>
      <div class="ws-list">
        ${this._wsDetails.map(
          (ws) => html`
            <div class="ws-row">
              <span class="ws-row-name">${ws.label}</span>
              <div class="ws-row-bar">
                <div class="ws-row-bar-fill" style="width:${(ws.size / maxSize) * 100}%"></div>
              </div>
              <span class="ws-row-size">${formatBytes(ws.size)}</span>
            </div>
          `,
        )}
      </div>

      <div class="note">
        Storage allowance information is not currently available from the API. Totals shown represent current usage only.
      </div>

      ${this.storageReportingUrl ? html`
        <div class="history-section">
          <chart-card
            heading="Storage Over Time"
            type="line"
            .data=${this._historyData}
            .loading=${this._historyLoading}
            .height=${280}
            .options=${{
              plugins: {
                legend: { display: this._historyView === "datasource", position: "bottom" },
                tooltip: {
                  callbacks: {
                    label: (ctx) => ` ${ctx.dataset.label}: ${formatBytes(ctx.raw)}`,
                  },
                },
              },
              scales: {
                x: { ticks: { maxTicksLimit: 10, maxRotation: 0 } },
                y: { ticks: { callback: (v) => formatBytes(v) } },
              },
            }}
          >
            <div slot="actions" class="history-controls">
              <select
                @change=${(e) => { this._bucket = e.target.value; }}
              >
                <option value="day" ?selected=${this._bucket === "day"}>Day</option>
                <option value="week" ?selected=${this._bucket === "week"}>Week</option>
                <option value="month" ?selected=${this._bucket === "month"}>Month</option>
              </select>
              <select
                @change=${(e) => { this._rangeKey = e.target.value; }}
              >
                <option value="30d" ?selected=${this._rangeKey === "30d"}>Last 30 days</option>
                <option value="6m" ?selected=${this._rangeKey === "6m"}>Last 6 months</option>
                <option value="1y" ?selected=${this._rangeKey === "1y"}>Last year</option>
              </select>
              <div class="ctrl-sep"></div>
              <div class="toggle-group">
                <button
                  class="toggle-btn ${this._historyView === "total" ? "active" : ""}"
                  @click=${() => { this._historyView = "total"; }}
                >Total</button>
                <button
                  class="toggle-btn ${this._historyView === "datasource" ? "active" : ""}"
                  @click=${() => { this._historyView = "datasource"; }}
                >Per datasource</button>
              </div>
            </div>
          </chart-card>
        </div>
      ` : html``}
    `;
  }
}

customElements.define("storage-panel", StoragePanel);

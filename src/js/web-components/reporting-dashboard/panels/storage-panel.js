import { LitElement, html, css } from "lit";
import "../components/stat-card.js";
import "../components/chart-card.js";
import { listRootStats, formatBytes, formatNumber } from "../client.js";
import { harddiskIcon, folderIcon } from "../../utils/icons.js";

class StoragePanel extends LitElement {
  static properties = {
    workspaces: { type: Array },
    selectedWorkspace: { type: String },
    _statsLoading: { state: true },
    _chartsLoading: { state: true },
    _totalSize: { state: true },
    _largestWs: { state: true },
    _wsCount: { state: true },
    _barData: { state: true },
    _doughnutData: { state: true },
    _wsDetails: { state: true },
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
    this._statsLoading = true;
    this._chartsLoading = true;
    this._totalSize = 0;
    this._largestWs = "";
    this._wsCount = 0;
    this._barData = null;
    this._doughnutData = null;
    this._wsDetails = [];
    this._loadGen = 0;
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadData();
  }

  updated(changed) {
    if (changed.has("workspaces") && this.workspaces.length) {
      this._loadData();
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
          .height=${Math.max(200, this._wsDetails.length * 40)}
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
    `;
  }
}

customElements.define("storage-panel", StoragePanel);

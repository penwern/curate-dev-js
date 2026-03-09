import { LitElement, html, css } from "lit";
import "../components/stat-card.js";
import "../components/chart-card.js";
import {
  getFormatSnapshot,
  getMimeBreakdown,
  getMimeTimeseries,
  getMimeTimeseriesByDatasource,
  categorizeMime,
  formatBytes,
  formatNumber,
} from "../client.js";
import { chartDonutIcon, fileMultipleIcon, harddiskIcon } from "../../utils/icons.js";

const PALETTE = [
  "#4285f4", "#34a853", "#fbbc04", "#ea4335", "#9334e6",
  "#e8710a", "#00acc1", "#f06292", "#8d6e63", "#78909c",
  "#26a69a", "#ab47bc",
];

class FormatsPanel extends LitElement {
  static properties = {
    formatReportingUrl: { type: String },
    _loading: { state: true },
    _snapshotAt: { state: true },
    _totalFiles: { state: true },
    _totalBytes: { state: true },
    _uniqueFormats: { state: true },
    _noMimeCount: { state: true },
    _items: { state: true },
    _aggregated: { state: true },
    _donutData: { state: true },
    _tsLoading: { state: true },
    _tsData: { state: true },
    _tsMetric: { state: true },
    _tsRange: { state: true },
    _tsView: { state: true },
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

    @media (max-width: 768px) {
      .charts-row { grid-template-columns: 1fr; }
    }

    .snapshot-badge {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
      margin-bottom: 16px;
    }
    .snapshot-badge span {
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
    }

    .format-table-card {
      background: var(--md-sys-color-surface);
      border: 1px solid var(--md-sys-color-outline-variant-50);
      border-radius: var(--md-sys-color-card-border-radius, 12px);
      padding: 20px 24px 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .card-heading {
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      letter-spacing: 0.1px;
    }

    .table-scroll {
      overflow-y: auto;
      max-height: 232px;
    }

    .format-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .format-table th {
      position: sticky;
      top: 0;
      background: var(--md-sys-color-surface);
      text-align: left;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--md-sys-color-on-surface-variant);
      border-bottom: 1px solid var(--md-sys-color-outline-variant-50);
    }

    .format-table td {
      padding: 9px 10px;
      color: var(--md-sys-color-on-surface);
      border-bottom: 1px solid var(--md-sys-color-outline-variant-50);
      font-variant-numeric: tabular-nums;
      vertical-align: middle;
    }

    .format-table tr:last-child td { border-bottom: none; }
    .format-table tr:hover td { background: var(--md-sys-color-surface-variant); }

    .mime-chip {
      display: inline-block;
      font-size: 11px;
      font-family: monospace;
      padding: 2px 6px;
      background: var(--md-sys-color-surface-variant);
      border-radius: 4px;
      max-width: 260px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: middle;
    }

    .category-badge {
      display: inline-block;
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 10px;
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      white-space: nowrap;
    }

    .bar-bg {
      height: 5px;
      width: 80px;
      background: var(--md-sys-color-surface-variant);
      border-radius: 3px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: var(--md-sys-color-primary);
      border-radius: 3px;
    }

    .ts-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ts-controls select {
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
    .ts-controls select:focus { border-color: var(--md-sys-color-primary); }

    .ctrl-sep {
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
    .toggle-btn + .toggle-btn { border-left: 1px solid var(--md-sys-color-outline-variant); }

    .not-configured {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 64px var(--dash-gutter, 32px);
      color: var(--md-sys-color-on-surface-variant);
      text-align: center;
    }
    .not-configured svg {
      width: 48px;
      height: 48px;
      opacity: 0.35;
      fill: currentColor;
    }
    .not-configured p {
      margin: 0;
      font-size: 13px;
      max-width: 420px;
    }
    .not-configured code {
      font-size: 12px;
      background: var(--md-sys-color-surface-variant);
      padding: 1px 5px;
      border-radius: 4px;
    }
  `;

  constructor() {
    super();
    this.formatReportingUrl = "";
    this._loading = false;
    this._snapshotAt = null;
    this._totalFiles = 0;
    this._totalBytes = 0;
    this._uniqueFormats = 0;
    this._noMimeCount = 0;
    this._items = [];
    this._aggregated = [];
    this._donutData = null;
    this._tsLoading = false;
    this._tsData = null;
    this._tsMetric = "file_count";
    this._tsRange = "30d";
    this._tsView = "combined";
    this._tsGen = 0;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.formatReportingUrl) this._loadAll();
  }

  updated(changed) {
    if (changed.has("formatReportingUrl") && this.formatReportingUrl) {
      this._loadAll();
    }
    if (
      (changed.has("_tsMetric") || changed.has("_tsRange") || changed.has("_tsView")) &&
      this.formatReportingUrl
    ) {
      this._loadTimeseries();
    }
  }

  async _loadAll() {
    await Promise.all([this._loadSnapshot(), this._loadBreakdown()]);
    this._loadTimeseries();
  }

  async _loadSnapshot() {
    try {
      const res = await getFormatSnapshot(this.formatReportingUrl);
      this._snapshotAt = res.snapshot_at ?? null;
    } catch (err) {
      console.error("FormatsPanel snapshot error:", err);
    }
  }

  async _loadBreakdown() {
    this._loading = true;
    try {
      const res = await getMimeBreakdown(this.formatReportingUrl);
      this._items = res.items ?? [];
      this._processBreakdown(this._items);
    } catch (err) {
      console.error("FormatsPanel breakdown error:", err);
    } finally {
      this._loading = false;
    }
  }

  _processBreakdown(items) {
    const byFormat = new Map();
    for (const item of items) {
      const ex = byFormat.get(item.mime_or_ext) ?? { file_count: 0, total_bytes: 0, no_mime_count: 0 };
      byFormat.set(item.mime_or_ext, {
        file_count: ex.file_count + item.file_count,
        total_bytes: ex.total_bytes + item.total_bytes,
        no_mime_count: ex.no_mime_count + item.no_mime_count,
      });
    }

    this._aggregated = [...byFormat.entries()]
      .map(([mime, data]) => ({ mime, ...data, category: categorizeMime(mime) }))
      .sort((a, b) => b.file_count - a.file_count);

    this._totalFiles = this._aggregated.reduce((s, r) => s + r.file_count, 0);
    this._totalBytes = this._aggregated.reduce((s, r) => s + r.total_bytes, 0);
    this._uniqueFormats = this._aggregated.length;
    this._noMimeCount = this._aggregated.reduce((s, r) => s + r.no_mime_count, 0);

    const top = this._aggregated.slice(0, 10);
    const otherCount = this._aggregated.slice(10).reduce((s, r) => s + r.file_count, 0);
    const labels = top.map((r) => r.mime);
    const data = top.map((r) => r.file_count);
    const colors = top.map((_, i) => PALETTE[i % PALETTE.length]);

    if (otherCount > 0) {
      labels.push("Other");
      data.push(otherCount);
      colors.push("#bdbdbd");
    }

    this._donutData = labels.length
      ? { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] }
      : null;
  }

  async _loadTimeseries() {
    if (!this.formatReportingUrl) return;
    const gen = ++this._tsGen;
    this._tsLoading = true;
    this._tsData = null;

    const now = new Date();
    const days = { "30d": 30, "6m": 180, "1y": 365 }[this._tsRange] ?? 30;
    const from = new Date(now - days * 86400 * 1000).toISOString();
    const to = now.toISOString();

    try {
      if (this._tsView === "combined") {
        const res = await getMimeTimeseries(this.formatReportingUrl, { metric: this._tsMetric, from, to });
        if (gen !== this._tsGen) return;
        const style = getComputedStyle(document.documentElement);
        const primary = style.getPropertyValue("--md-sys-color-primary").trim() || "#006689";
        this._tsData = res.points?.length
          ? {
              labels: res.points.map((p) => this._fmtTs(p.snapshot_at)),
              datasets: [{
                label: this._metricLabel,
                data: res.points.map((p) => p.value),
                borderColor: primary,
                backgroundColor: primary + "22",
                fill: true,
                tension: 0.3,
                pointRadius: res.points.length > 60 ? 0 : 3,
                pointHoverRadius: 4,
              }],
            }
          : null;
      } else {
        const res = await getMimeTimeseriesByDatasource(this.formatReportingUrl, { metric: this._tsMetric, from, to });
        if (gen !== this._tsGen) return;
        const series = res.series ?? [];
        const allTs = new Set();
        for (const s of series) s.points.forEach((p) => allTs.add(p.snapshot_at));
        const sortedTs = [...allTs].sort((a, b) => a.localeCompare(b));
        this._tsData = series.length
          ? {
              labels: sortedTs.map((t) => this._fmtTs(t)),
              datasets: series.map((s, i) => {
                const map = new Map(s.points.map((p) => [p.snapshot_at, p.value]));
                const color = PALETTE[i % PALETTE.length];
                return {
                  label: s.datasource,
                  data: sortedTs.map((t) => map.get(t) ?? null),
                  borderColor: color,
                  backgroundColor: color + "22",
                  fill: false,
                  tension: 0.3,
                  pointRadius: sortedTs.length > 60 ? 0 : 3,
                  pointHoverRadius: 4,
                  spanGaps: true,
                };
              }),
            }
          : null;
      }
    } catch (err) {
      console.error("FormatsPanel timeseries error:", err);
    } finally {
      if (gen === this._tsGen) this._tsLoading = false;
    }
  }

  _fmtTs(iso) {
    try {
      return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    } catch {
      return iso;
    }
  }

  get _metricLabel() {
    return this._tsMetric === "total_bytes" ? "Total Bytes" : "File Count";
  }

  async getExportData() {
    let items = this._items;
    let aggregated = this._aggregated;

    if (!items.length && this.formatReportingUrl) {
      try {
        const res = await getMimeBreakdown(this.formatReportingUrl);
        items = res.items ?? [];
        const byFormat = new Map();
        for (const item of items) {
          const ex = byFormat.get(item.mime_or_ext) ?? { file_count: 0, total_bytes: 0, no_mime_count: 0 };
          byFormat.set(item.mime_or_ext, {
            file_count: ex.file_count + item.file_count,
            total_bytes: ex.total_bytes + item.total_bytes,
            no_mime_count: ex.no_mime_count + item.no_mime_count,
          });
        }
        aggregated = [...byFormat.entries()]
          .map(([mime, data]) => ({ mime, ...data, category: categorizeMime(mime) }))
          .sort((a, b) => b.file_count - a.file_count);
      } catch (err) {
        console.error("FormatsPanel getExportData error:", err);
      }
    }

    const totalFiles = aggregated.reduce((s, r) => s + r.file_count, 0);
    const totalBytes = aggregated.reduce((s, r) => s + r.total_bytes, 0);

    const summary = [
      { Metric: "Total Files", Value: totalFiles },
      { Metric: "Total Size", Value: formatBytes(totalBytes) },
      { Metric: "Total Size (Bytes)", Value: totalBytes },
      { Metric: "Unique Formats", Value: aggregated.length },
      { Metric: "No-MIME Count", Value: aggregated.reduce((s, r) => s + r.no_mime_count, 0) },
      { Metric: "Data Snapshot", Value: this._snapshotAt ?? "—" },
    ];

    const formats = aggregated.map((r) => ({
      "Format (MIME/Ext)": r.mime,
      Category: r.category,
      "File Count": r.file_count,
      "Total Size": formatBytes(r.total_bytes),
      "Total Size (Bytes)": r.total_bytes,
      "No-MIME Count": r.no_mime_count,
    }));

    const byDatasource = items.map((item) => ({
      Datasource: item.datasource,
      "Format (MIME/Ext)": item.mime_or_ext,
      Category: categorizeMime(item.mime_or_ext),
      "File Count": item.file_count,
      "Total Size": formatBytes(item.total_bytes),
      "Total Size (Bytes)": item.total_bytes,
      "No-MIME Count": item.no_mime_count,
    }));

    return { summary, formats, byDatasource };
  }

  render() {
    if (!this.formatReportingUrl) {
      return html`
        <div class="not-configured">
          ${chartDonutIcon}
          <p>
            Format reporting is not configured. Set <code>FORMAT_REPORTING_URL</code>
            in <code>dashboard.js</code> to point to your Cells MIME reporting API.
          </p>
        </div>
      `;
    }

    const maxFiles = this._aggregated[0]?.file_count ?? 1;

    return html`
      ${this._snapshotAt
        ? html`<div class="snapshot-badge">Data from snapshot: <span>${new Date(this._snapshotAt).toLocaleString("en-GB")}</span></div>`
        : ""}

      <div class="stats-grid">
        <stat-card
          label="Total Files"
          .value=${formatNumber(this._totalFiles)}
          subtitle="Across all formats"
          .loading=${this._loading}
          style="--stat-accent: var(--md-sys-color-primary)"
        >
          <span slot="icon">${fileMultipleIcon}</span>
        </stat-card>
        <stat-card
          label="Total Size"
          .value=${formatBytes(this._totalBytes)}
          subtitle="Cumulative file size"
          .loading=${this._loading}
          style="--stat-accent: var(--md-sys-color-tertiary)"
        >
          <span slot="icon">${harddiskIcon}</span>
        </stat-card>
        <stat-card
          label="Unique Formats"
          .value=${formatNumber(this._uniqueFormats)}
          subtitle="Distinct MIME types / extensions"
          .loading=${this._loading}
          style="--stat-accent: var(--md-sys-color-secondary)"
        >
          <span slot="icon">${chartDonutIcon}</span>
        </stat-card>
        <stat-card
          label="No-MIME Count"
          .value=${formatNumber(this._noMimeCount)}
          subtitle="Files using extension fallback"
          .loading=${this._loading}
        ></stat-card>
      </div>

      <div class="charts-row">
        <chart-card
          heading="Top Formats by File Count"
          type="doughnut"
          .data=${this._donutData}
          .loading=${this._loading}
          .height=${300}
          .options=${{
            cutout: "60%",
            plugins: {
              legend: { display: true, position: "right" },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.label}: ${Number(ctx.raw).toLocaleString()} files`,
                },
              },
            },
          }}
        ></chart-card>

        <div class="format-table-card">
          <span class="card-heading">All Formats</span>
          <div class="table-scroll">
            <table class="format-table">
              <thead>
                <tr>
                  <th>Format</th>
                  <th>Category</th>
                  <th>Files</th>
                  <th>Size</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${this._aggregated.map((row) => html`
                  <tr>
                    <td><span class="mime-chip" title="${row.mime}">${row.mime}</span></td>
                    <td><span class="category-badge">${row.category}</span></td>
                    <td>${Number(row.file_count).toLocaleString()}</td>
                    <td>${formatBytes(row.total_bytes)}</td>
                    <td>
                      <div class="bar-bg">
                        <div class="bar-fill" style="width:${(row.file_count / maxFiles) * 100}%"></div>
                      </div>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <chart-card
        heading="Format Trends Over Time"
        type="line"
        .data=${this._tsData}
        .loading=${this._tsLoading}
        .height=${280}
        .options=${{
          plugins: {
            legend: { display: this._tsView === "datasource", position: "bottom" },
            tooltip: {
              callbacks: {
                label: (ctx) => this._tsMetric === "total_bytes"
                  ? ` ${ctx.dataset.label}: ${formatBytes(ctx.raw)}`
                  : ` ${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString()} files`,
              },
            },
          },
          scales: {
            x: { ticks: { maxTicksLimit: 10, maxRotation: 0 } },
            y: {
              beginAtZero: true,
              ticks: {
                callback: (v) => this._tsMetric === "total_bytes"
                  ? formatBytes(v)
                  : Number(v).toLocaleString(),
              },
            },
          },
        }}
      >
        <div slot="actions" class="ts-controls">
          <select @change=${(e) => { this._tsMetric = e.target.value; }}>
            <option value="file_count" ?selected=${this._tsMetric === "file_count"}>File Count</option>
            <option value="total_bytes" ?selected=${this._tsMetric === "total_bytes"}>Total Bytes</option>
          </select>
          <select @change=${(e) => { this._tsRange = e.target.value; }}>
            <option value="30d" ?selected=${this._tsRange === "30d"}>Last 30 days</option>
            <option value="6m" ?selected=${this._tsRange === "6m"}>Last 6 months</option>
            <option value="1y" ?selected=${this._tsRange === "1y"}>Last year</option>
          </select>
          <div class="ctrl-sep"></div>
          <div class="toggle-group">
            <button
              class="toggle-btn ${this._tsView === "combined" ? "active" : ""}"
              @click=${() => { this._tsView = "combined"; }}
            >Combined</button>
            <button
              class="toggle-btn ${this._tsView === "datasource" ? "active" : ""}"
              @click=${() => { this._tsView = "datasource"; }}
            >Per datasource</button>
          </div>
        </div>
      </chart-card>
    `;
  }
}

customElements.define("formats-panel", FormatsPanel);

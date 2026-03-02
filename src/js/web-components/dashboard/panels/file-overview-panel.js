import { LitElement, html, css } from "lit";
import "../components/stat-card.js";
import "../components/chart-card.js";
import {
  countByExtensions,
  listRootStats,
  formatBytes,
  formatNumber,
  FILE_TYPE_GROUPS,
} from "../client.js";
import { fileMultipleIcon, harddiskIcon, folderIcon } from "../../utils/icons.js";

class FileOverviewPanel extends LitElement {
  static properties = {
    workspaces: { type: Array },
    _statsLoading: { state: true },
    _typesLoading: { state: true },
    _totalFiles: { state: true },
    _totalSize: { state: true },
    _typeData: { state: true },
    _workspaceData: { state: true },
    _fileCountData: { state: true },
  };

  static styles = css`
    :host {
      display: block;
    }

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
      .charts-row {
        grid-template-columns: 1fr;
      }
    }
  `;

  constructor() {
    super();
    this.workspaces = [];
    this._statsLoading = true;
    this._typesLoading = true;
    this._totalFiles = 0;
    this._totalSize = 0;
    this._typeData = null;
    this._workspaceData = null;
    this._fileCountData = null;
    // Cached workspace stats for export (set during _loadStats)
    this._wsStats = [];
    this._groupCounts = {};
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadData();
  }

  updated(changed) {
    if (changed.has("workspaces")) {
      this._loadData();
    }
  }

  _loadData() {
    this._loadStats();
    this._loadTypes();
  }

  async _loadStats() {
    this._statsLoading = true;
    try {
      const wsStats = await this._loadWorkspaceStats();

      this._wsStats = wsStats;

      if (wsStats.length > 0) {
        const style = getComputedStyle(document.documentElement);
        const primaryColor = style.getPropertyValue("--md-sys-color-primary").trim() || "#006689";

        let totalSize = 0;
        let totalFiles = 0;
        const wsLabels = [];
        const wsSizes = [];
        const wsCounts = [];

        for (const ws of wsStats) {
          if (ws.node) {
            wsLabels.push(ws.label);
            const size = parseInt(ws.node.Size ?? "0", 10);
            const count = parseInt(ws.node.MetaStore?.RecursiveCount ?? "0", 10);
            wsSizes.push(size);
            wsCounts.push(count);
            totalSize += size;
            totalFiles += count;
          }
        }

        this._totalSize = totalSize;
        this._totalFiles = totalFiles;

        this._workspaceData = {
          labels: wsLabels,
          datasets: [{
            label: "Storage Used",
            data: wsSizes,
            backgroundColor: primaryColor + "CC",
            borderRadius: 6,
            borderSkipped: false,
            barThickness: 28,
          }],
        };

        const tertiaryColor = style.getPropertyValue("--md-sys-color-tertiary").trim() || "#605a7d";
        this._fileCountData = {
          labels: wsLabels,
          datasets: [{
            label: "Files",
            data: wsCounts,
            backgroundColor: tertiaryColor + "CC",
            borderRadius: 6,
            borderSkipped: false,
            barThickness: 28,
          }],
        };
      }
    } catch (err) {
      console.error("FileOverviewPanel stats error:", err);
    } finally {
      this._statsLoading = false;
    }
  }

  async _loadTypes() {
    this._typesLoading = true;
    try {
      const groupCounts = await this._loadTypeBreakdown();
      this._groupCounts = groupCounts;

      const typeLabels = [];
      const typeCounts = [];
      const typeColors = [];
      const GROUP_COLORS = {
        Documents: "#4285f4",
        Spreadsheets: "#34a853",
        Presentations: "#fbbc04",
        Images: "#ea4335",
        Audio: "#9334e6",
        Video: "#e8710a",
        Archives: "#607d8b",
        PDF: "#d93025",
      };

      for (const [groupName, count] of Object.entries(groupCounts)) {
        if (count > 0) {
          typeLabels.push(groupName);
          typeCounts.push(count);
          typeColors.push(GROUP_COLORS[groupName] ?? "#71787d");
        }
      }

      this._typeData = typeLabels.length > 0 ? {
        labels: typeLabels,
        datasets: [{
          data: typeCounts,
          backgroundColor: typeColors,
          borderWidth: 0,
          hoverOffset: 4,
        }],
      } : null;
    } catch (err) {
      console.error("FileOverviewPanel types error:", err);
    } finally {
      this._typesLoading = false;
    }
  }

  async _loadTypeBreakdown() {
    // Collect all unique extensions across all groups
    const allExtensions = [];
    const extToGroup = {};
    for (const [groupName, group] of Object.entries(FILE_TYPE_GROUPS)) {
      for (const ext of group.extensions) {
        if (!extToGroup[ext]) {
          allExtensions.push(ext);
          extToGroup[ext] = groupName;
        }
      }
    }

    // Query each extension individually (batched in groups of 4)
    const extCounts = await countByExtensions(allExtensions);

    // Aggregate per group
    const groupCounts = {};
    for (const [ext, count] of Object.entries(extCounts)) {
      const group = extToGroup[ext];
      if (group) {
        groupCounts[group] = (groupCounts[group] ?? 0) + count;
      }
    }

    return groupCounts;
  }

  async _loadWorkspaceStats() {
    if (!this.workspaces.length) return [];
    try {
      const res = await listRootStats();
      const children = res.Children ?? [];

      // Build a map of datasource path → workspace label from the workspace definitions
      const pathToLabel = new Map();
      for (const ws of this.workspaces) {
        for (const rn of Object.values(ws.RootNodes ?? {})) {
          const dsPath = rn.Path?.replace(/\/$/, "") ?? "";
          if (dsPath) pathToLabel.set(dsPath, ws.Label ?? dsPath);
        }
      }

      return children
        .filter((c) => pathToLabel.has(c.Path))
        .map((c) => ({
          slug: c.Path,
          label: pathToLabel.get(c.Path),
          node: c,
        }));
    } catch (err) {
      console.error("Failed to load root stats:", err);
      return [];
    }
  }

  /**
   * Returns all overview data structured for export.
   * Called by individual panel exports and by the dashboard "Export Report".
   */
  async getExportData() {
    // Fall back to fresh API calls so this works on detached elements (global export)
    const wsStats = this._wsStats.length ? this._wsStats : await this._loadWorkspaceStats();
    const groupCounts = Object.keys(this._groupCounts).length ? this._groupCounts : await this._loadTypeBreakdown();

    // Compute totals from wsStats so summary is correct even before _loadStats has run
    let totalFiles = 0;
    let totalSize = 0;
    for (const ws of wsStats) {
      if (ws.node) {
        totalFiles += parseInt(ws.node.MetaStore?.RecursiveCount ?? "0", 10);
        totalSize += parseInt(ws.node.Size ?? "0", 10);
      }
    }

    const summary = [
      { Metric: "Total Files", Value: totalFiles },
      { Metric: "Total Storage", Value: formatBytes(totalSize) },
      { Metric: "Total Storage (Bytes)", Value: totalSize },
      { Metric: "Workspaces", Value: this.workspaces.length },
    ];

    const filesByType = Object.entries(groupCounts)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({ "File Type": type, Count: count }));

    const storageByWorkspace = wsStats
      .filter((ws) => ws.node)
      .map((ws) => ({
        Workspace: ws.label,
        "Size (Bytes)": parseInt(ws.node.Size ?? "0", 10),
        "Size (Formatted)": formatBytes(parseInt(ws.node.Size ?? "0", 10)),
        "File Count": parseInt(ws.node.MetaStore?.RecursiveCount ?? "0", 10),
      }));

    return { summary, filesByType, storageByWorkspace };
  }

  render() {
    return html`
      <div class="stats-grid">
        <stat-card
          label="Total Files"
          .value=${formatNumber(this._totalFiles)}
          subtitle="Current files in workspaces"
          .loading=${this._statsLoading}
          style="--stat-accent: var(--md-sys-color-primary)"
        >
          <span slot="icon">${fileMultipleIcon}</span>
        </stat-card>
        <stat-card
          label="Total Storage"
          .value=${formatBytes(this._totalSize)}
          subtitle="Cumulative file size"
          .loading=${this._statsLoading}
          style="--stat-accent: var(--md-sys-color-tertiary)"
        >
          <span slot="icon">${harddiskIcon}</span>
        </stat-card>
        <stat-card
          label="Workspaces"
          .value=${formatNumber(this.workspaces.length)}
          subtitle="Active workspaces"
          .loading=${this._statsLoading}
          style="--stat-accent: var(--md-sys-color-secondary)"
        >
          <span slot="icon">${folderIcon}</span>
        </stat-card>
      </div>

      <div class="charts-row">
        <chart-card
          heading="Files by Type"
          type="doughnut"
          .data=${this._typeData}
          .loading=${this._typesLoading}
          .options=${{
            plugins: {
              legend: { display: true, position: "right" },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.label}: ${Number(ctx.raw).toLocaleString()} files`,
                },
              },
            },
            cutout: "60%",
          }}
          .height=${300}
        ></chart-card>
        <chart-card
          heading="Storage by Workspace"
          type="bar"
          .data=${this._workspaceData}
          .loading=${this._statsLoading}
          .options=${{
            indexAxis: "y",
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${formatBytes(ctx.raw)}`,
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  callback: (v) => formatBytes(v),
                },
              },
            },
          }}
          .height=${300}
        ></chart-card>
      </div>

      <div class="charts-row">
        <chart-card
          heading="Files by Workspace"
          type="bar"
          .data=${this._fileCountData}
          .loading=${this._statsLoading}
          .options=${{
            indexAxis: "y",
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${Number(ctx.raw).toLocaleString()} files`,
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  callback: (v) => Number(v).toLocaleString(),
                },
              },
            },
          }}
          .height=${300}
        ></chart-card>
      </div>
    `;
  }
}

customElements.define("file-overview-panel", FileOverviewPanel);

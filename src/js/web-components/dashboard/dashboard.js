//TODO - think about showing errors in dashboard, ingestion, preservation etc.
//TODO - need proper format/mime reporting not just document classifications.
//TODO - small bug with custom router, if Im on a custom route then navigate to a new url it appends
//  the custom route to it which breaks the navigation, eg when going from reports dashboard to settings.
// this doesnt happen if I go from eg dash to a workspace. weird. might be tolerable.
//TODO - talk to the chaps about the strategy for format reporting, is database access possible
//TODO - when I deleted stuff in deletions tab, the list didnt update properly until refreshed.
import { LitElement, html, css } from "lit";
import "./components/workspace-filter.js";
import "./components/export-button.js";
import "./panels/file-overview-panel.js";
import "./panels/ingestion-panel.js";
import "./panels/storage-panel.js";
import "./panels/deletions-panel.js";
import "./panels/activity-panel.js";
import "./panels/formats-panel.js";
import { getWorkspaces, invalidateCache, currentUserCanViewDashboard } from "./client.js";
import { refreshIcon, fileMultipleIcon, cloudUploadIcon, harddiskIcon, deleteClockIcon, eyeIcon, chartDonutIcon } from "../utils/icons.js";
import "../utils/penwern-spinner.js";
import { exportToCsv, exportToXlsx, exportToJson, buildFilename } from "./utils/export-utils.js";

// URL of the curate-storage-reporting API service.
// Edit this to match your deployment (e.g. "https://storage-api.example.com").
const STORAGE_REPORTING_URL = "http://localhost:8001";

// URL of the cells-db-tests MIME/format reporting API service.
// Edit this to match your deployment (e.g. "https://format-api.example.com").
const FORMAT_REPORTING_URL = "http://localhost:8000";

const TABS = [
  { id: "overview", label: "Overview", icon: "fileMultipleIcon" },
  { id: "ingestion", label: "Ingestion", icon: "cloudUploadIcon" },
  { id: "storage", label: "Storage", icon: "harddiskIcon" },
  { id: "deletions", label: "Deletions", icon: "deleteClockIcon" },
  { id: "activity", label: "Activity", icon: "eyeIcon" },
  { id: "formats", label: "Formats", icon: "chartDonutIcon" },
];

const TAB_ICONS = {
  fileMultipleIcon,
  cloudUploadIcon,
  harddiskIcon,
  deleteClockIcon,
  eyeIcon,
  chartDonutIcon,
};

const WS_FILTER_TABS = new Set(["ingestion", "deletions", "activity"]);

class Dashboard extends LitElement {
  static properties = {
    _activeTab: { state: true },
    _workspaces: { state: true },
    _selectedWorkspace: { state: true },
    _wsLoading: { state: true },
    _refreshing: { state: true },
    _mounted: { state: true },
    _hasPermission: { state: true },
    _exportLoading: { state: true },
  };

  static styles = css`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      background: var(--md-sys-color-background);
      font-family: "DM Sans", "Roboto", sans-serif;
      --dash-max-width: 1400px;
      --dash-gutter: 32px;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }


    /* ─── Tab Navigation ─── */
    .tab-bar {
      flex-shrink: 0;
      background: var(--md-sys-color-surface);
      border-bottom: 1px solid var(--md-sys-color-outline-variant-50);
      z-index: 99;
      animation: slideDown 0.4s ease-out;
    }

    .tab-bar-inner {
      padding: 0 var(--dash-gutter);
      display: flex;
      align-items: stretch;
    }

    .tab-scroll {
      display: flex;
      align-items: center;
      gap: 2px;
      flex: 1;
      min-width: 0;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .tab-scroll::-webkit-scrollbar { display: none; }

    .tab {
      position: relative;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 12px 14px;
      border: none;
      background: transparent;
      font-family: "DM Sans", "Roboto", sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
      transition: color 0.2s ease;
      white-space: nowrap;
      letter-spacing: 0.1px;
    }

    .tab::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 10px;
      right: 10px;
      height: 2.5px;
      border-radius: 2px 2px 0 0;
      background: transparent;
      transition: background 0.25s ease, transform 0.25s ease;
      transform: scaleX(0);
    }

    .tab:hover {
      color: var(--md-sys-color-on-surface);
    }

    .tab:hover::after {
      background: var(--md-sys-color-outline-variant);
      transform: scaleX(0.6);
    }

    .tab.active {
      color: var(--md-sys-color-primary);
    }

    .tab.active::after {
      background: var(--md-sys-color-primary);
      transform: scaleX(1);
    }

    .tab svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
      flex-shrink: 0;
    }

    .tab-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
      padding-left: 16px;
    }

    .refresh-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface-variant);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .refresh-btn:hover {
      background: var(--md-sys-color-hover-background);
      border-color: var(--md-sys-color-primary);
      color: var(--md-sys-color-primary);
    }

    .refresh-btn svg {
      width: 18px;
      height: 18px;
    }

    @media (max-width: 640px) {
      .tab-bar-inner { padding: 0 12px; }
      .tab { padding: 10px 10px; }
      .tab-label { display: none; }
      .tab-actions { gap: 8px; padding-left: 8px; }
    }

    /* ─── Content Area ─── */
    .content-shell {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .content-inner {
      padding: var(--dash-gutter);
    }

    .panel-container {
      animation: panelIn 0.35s ease-out;
    }

    @keyframes panelIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* ─── Permission gate ─── */
    .permission-gate {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex: 1;
      color: var(--md-sys-color-on-surface-variant);
      text-align: center;
      padding: var(--dash-gutter);
    }

    .permission-gate svg {
      width: 48px;
      height: 48px;
      opacity: 0.4;
      fill: currentColor;
    }

    .permission-gate-title {
      font-size: 16px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      margin: 0;
    }

    .permission-gate-body {
      font-size: 13px;
      margin: 0;
      max-width: 360px;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  constructor() {
    super();
    this._activeTab = "overview";
    this._workspaces = [];
    this._selectedWorkspace = "";
    this._wsLoading = true;
    this._refreshing = false;
    this._mounted = false;
    this._hasPermission = false;
    this._exportLoading = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._hasPermission = currentUserCanViewDashboard();
    if (this._hasPermission) this._loadWorkspaces();
    requestAnimationFrame(() => {
      this._mounted = true;
    });
  }

  async _loadWorkspaces() {
    this._wsLoading = true;
    try {
      const all = await getWorkspaces();
      this._workspaces = all.filter(
        (ws) => ws.Scope === "ADMIN" && ws.Slug !== "personal-files",
      );
    } catch (err) {
      console.error("Failed to load workspaces:", err);
      this._workspaces = [];
    } finally {
      this._wsLoading = false;
    }
  }

  _onTabClick(tabId) {
    if (this._activeTab !== tabId) {
      this._activeTab = tabId;
    }
  }

  _onWorkspaceChanged(e) {
    this._selectedWorkspace = e.detail.slug;
  }

  async _onRefresh() {
    this._refreshing = true;
    invalidateCache();
    await this._loadWorkspaces();
    // Force panel re-render by briefly clearing the tab
    const current = this._activeTab;
    this._activeTab = "";
    await this.updateComplete;
    this._activeTab = current;
    setTimeout(() => {
      this._refreshing = false;
    }, 800);
  }

  get _wsFilterEnabled() {
    return WS_FILTER_TABS.has(this._activeTab);
  }

  get _exportFormats() {
    switch (this._activeTab) {
      case "overview":
        return [
          { value: "xlsx", label: "Excel (.xlsx) — All Panels" },
          { value: "json", label: "JSON — All Panels" },
        ];
      case "ingestion":
        return [
          { value: "csv", label: "CSV — Upload Records" },
          { value: "xlsx", label: "Excel (.xlsx) — All Data" },
          { value: "json", label: "JSON — All Data" },
        ];
      case "storage":
        return [
          { value: "csv", label: "CSV — Workspace Storage" },
          { value: "xlsx", label: "Excel (.xlsx) — All Data" },
          { value: "json", label: "JSON — All Data" },
        ];
      case "deletions":
        return [
          { value: "csv", label: "CSV — Recycle Bin" },
          { value: "xlsx", label: "Excel (.xlsx) — All Data" },
          { value: "json", label: "JSON — All Data" },
        ];
      case "activity":
        return [
          { value: "csv", label: "CSV — Activity Log" },
          { value: "xlsx", label: "Excel (.xlsx) — All Data" },
          { value: "json", label: "JSON — All Data" },
        ];
      case "formats":
        return [
          { value: "csv", label: "CSV — Format Breakdown" },
          { value: "xlsx", label: "Excel (.xlsx) — All Data" },
          { value: "json", label: "JSON — All Data" },
        ];
      default:
        return [];
    }
  }

  async _handleExport(e) {
    const { format } = e.detail;
    this._exportLoading = true;
    try {
      if (this._activeTab === "overview") {
        await this._doGlobalExport(format);
      } else {
        await this._doTabExport(this._activeTab, format);
      }
    } catch (err) {
      console.error("Dashboard export error:", err);
    } finally {
      this._exportLoading = false;
    }
  }

  async _doTabExport(tab, format) {
    const tagMap = {
      ingestion: "ingestion-panel",
      storage: "storage-panel",
      deletions: "deletions-panel",
      activity: "activity-panel",
      formats: "formats-panel",
    };
    const tagName = tagMap[tab];
    if (!tagName) return;

    // Use existing DOM element if available; else create a detached instance with filters set
    let el = this.shadowRoot.querySelector(tagName);
    if (!el) {
      el = document.createElement(tagName);
      el.workspaces = this._workspaces;
      el.selectedWorkspace = this._selectedWorkspace;
      if (tab === "storage") el.storageReportingUrl = STORAGE_REPORTING_URL;
      if (tab === "formats") el.formatReportingUrl = FORMAT_REPORTING_URL;
    }

    const data = await el.getExportData();
    const filters = { workspace: this._selectedWorkspace || undefined };

    if (tab === "ingestion") {
      if (format === "csv") exportToCsv(buildFilename("ingestion", "csv", filters), data.records);
      else if (format === "json") exportToJson(buildFilename("ingestion", "json", filters), data);
      else if (format === "xlsx") exportToXlsx(buildFilename("ingestion", "xlsx", filters), [
        { name: "Summary", rows: data.summary },
        { name: "Upload Records", rows: data.records },
        { name: "Time Series (Annual)", rows: data.timeSeries },
      ]);
    } else if (tab === "storage") {
      if (format === "csv") exportToCsv(buildFilename("storage", "csv", filters), data.workspaces);
      else if (format === "json") exportToJson(buildFilename("storage", "json", filters), data);
      else if (format === "xlsx") exportToXlsx(buildFilename("storage", "xlsx", filters), [
        { name: "Summary", rows: data.summary },
        { name: "Workspace Storage", rows: data.workspaces },
        { name: "Storage History", rows: data.history ?? [] },
      ]);
    } else if (tab === "deletions") {
      if (format === "csv") exportToCsv(buildFilename("deletions", "csv", filters), data.recycleBin);
      else if (format === "json") exportToJson(buildFilename("deletions", "json", filters), data);
      else if (format === "xlsx") exportToXlsx(buildFilename("deletions", "xlsx", filters), [
        { name: "Summary", rows: data.summary },
        { name: "Recycle Bin", rows: data.recycleBin },
        { name: "Deletion History", rows: data.history },
      ]);
    } else if (tab === "activity") {
      if (format === "csv") exportToCsv(buildFilename("activity", "csv", filters), data.log);
      else if (format === "json") exportToJson(buildFilename("activity", "json", filters), data);
      else if (format === "xlsx") exportToXlsx(buildFilename("activity", "xlsx", filters), [
        { name: "Summary", rows: data.summary },
        { name: "Activity Log", rows: data.log },
        { name: "By Type", rows: data.byType },
        { name: "Time Series (Annual)", rows: data.timeSeries },
      ]);
    } else if (tab === "formats") {
      if (format === "csv") exportToCsv(buildFilename("formats", "csv"), data.formats);
      else if (format === "json") exportToJson(buildFilename("formats", "json"), data);
      else if (format === "xlsx") exportToXlsx(buildFilename("formats", "xlsx"), [
        { name: "Summary", rows: data.summary },
        { name: "Format Breakdown", rows: data.formats },
        { name: "By Datasource", rows: data.byDatasource },
      ]);
    }
  }

  /**
   * Gathers data from all panels and exports as a multi-sheet XLSX or JSON.
   * Each panel's getExportData() handles its own data fetching.
   */
  async _doGlobalExport(format) {
    // Use existing DOM element if available; otherwise create a detached instance
    // with workspaces set so getExportData() can make its own API calls.
    const getPanelData = (tagName, extraProps = {}) => {
      const existing = this.shadowRoot.querySelector(tagName);
      if (existing) return existing.getExportData();
      const el = document.createElement(tagName);
      el.workspaces = this._workspaces;
      Object.assign(el, extraProps);
      return el.getExportData();
    };

    const [overview, ingestion, storage, deletions, activity, formats] = await Promise.all([
      getPanelData("file-overview-panel"),
      getPanelData("ingestion-panel"),
      getPanelData("storage-panel", { storageReportingUrl: STORAGE_REPORTING_URL }),
      getPanelData("deletions-panel"),
      getPanelData("activity-panel"),
      getPanelData("formats-panel", { formatReportingUrl: FORMAT_REPORTING_URL }),
    ]);

    if (format === "xlsx") {
      const sheets = [
        {
          name: "Summary",
          rows: [
            ...(overview?.summary ?? [{ Metric: "Overview data unavailable", Value: "" }]),
            { Metric: "", Value: "" },
            ...(ingestion?.summary?.map((r) => ({ ...r, Metric: "Ingestion — " + r.Metric })) ?? []),
            { Metric: "", Value: "" },
            ...(storage?.summary?.map((r) => ({ ...r, Metric: "Storage — " + r.Metric })) ?? []),
            { Metric: "", Value: "" },
            ...(deletions?.summary?.map((r) => ({ ...r, Metric: "Deletions — " + r.Metric })) ?? []),
            { Metric: "", Value: "" },
            ...(activity?.summary?.map((r) => ({ ...r, Metric: "Activity — " + r.Metric })) ?? []),
            { Metric: "", Value: "" },
            ...(formats?.summary?.map((r) => ({ ...r, Metric: "Formats — " + r.Metric })) ?? []),
          ],
        },
        { name: "Overview — File Types", rows: overview?.filesByType ?? [] },
        { name: "Overview — By Workspace", rows: overview?.storageByWorkspace ?? [] },
        { name: "Ingestion — Uploads", rows: ingestion?.records ?? [] },
        { name: "Ingestion — Time Series", rows: ingestion?.timeSeries ?? [] },
        { name: "Storage — Workspaces", rows: storage?.workspaces ?? [] },
        { name: "Storage — History", rows: storage?.history ?? [] },
        { name: "Deletions — Recycle Bin", rows: deletions?.recycleBin ?? [] },
        { name: "Deletions — History", rows: deletions?.history ?? [] },
        { name: "Activity — Log", rows: activity?.log ?? [] },
        { name: "Activity — By Type", rows: activity?.byType ?? [] },
        { name: "Formats — Breakdown", rows: formats?.formats ?? [] },
        { name: "Formats — By Datasource", rows: formats?.byDatasource ?? [] },
      ];
      exportToXlsx(buildFilename("full-report", "xlsx"), sheets);
    } else if (format === "json") {
      exportToJson(buildFilename("full-report", "json"), {
        overview,
        ingestion,
        storage,
        deletions,
        activity,
        formats,
      });
    }
  }

  _renderPanel() {
    switch (this._activeTab) {
      case "overview":
        return html`
          <file-overview-panel
            .workspaces=${this._workspaces}
            .formatReportingUrl=${FORMAT_REPORTING_URL}
          ></file-overview-panel>
        `;
      case "ingestion":
        return html`
          <ingestion-panel
            .workspaces=${this._workspaces}
            .selectedWorkspace=${this._selectedWorkspace}
          ></ingestion-panel>
        `;
      case "storage":
        return html`
          <storage-panel
            .workspaces=${this._workspaces}
            .storageReportingUrl=${STORAGE_REPORTING_URL}
          ></storage-panel>
        `;
      case "deletions":
        return html`
          <deletions-panel
            .workspaces=${this._workspaces}
            .selectedWorkspace=${this._selectedWorkspace}
          ></deletions-panel>
        `;
      case "activity":
        return html`
          <activity-panel
            .workspaces=${this._workspaces}
            .selectedWorkspace=${this._selectedWorkspace}
          ></activity-panel>
        `;
      case "formats":
        return html`
          <formats-panel
            .formatReportingUrl=${FORMAT_REPORTING_URL}
          ></formats-panel>
        `;
      default:
        return html``;
    }
  }

  render() {
    return html`
      <nav class="tab-bar">
        <div class="tab-bar-inner">
          <div class="tab-scroll">
            ${TABS.map(
              (tab) => html`
                <button
                  class="tab ${this._activeTab === tab.id ? "active" : ""}"
                  @click=${() => this._onTabClick(tab.id)}
                >
                  ${TAB_ICONS[tab.icon]}
                  <span class="tab-label">${tab.label}</span>
                </button>
              `,
            )}
          </div>
          <div class="tab-actions">
            <workspace-filter
              .workspaces=${this._workspaces}
              .selected=${this._selectedWorkspace}
              .loading=${this._wsLoading}
              ?disabled=${!this._wsFilterEnabled}
              @workspace-changed=${this._onWorkspaceChanged}
            ></workspace-filter>
            <export-button
              .label=${this._activeTab === "overview" ? "Export Report" : "Export"}
              .formats=${this._exportFormats}
              .loading=${this._exportLoading}
              @export-format-selected=${this._handleExport}
            ></export-button>
            <button
              class="refresh-btn"
              @click=${this._onRefresh}
              ?disabled=${this._refreshing}
              title="Refresh all data"
            >
              ${this._refreshing
                ? html`<penwern-spinner size="22"></penwern-spinner>`
                : refreshIcon}
            </button>
          </div>
        </div>
      </nav>

      <main class="content-shell">
        ${this._hasPermission
          ? html`
              <div class="content-inner">
                <div class="panel-container" .key=${this._activeTab}>
                  ${this._renderPanel()}
                </div>
              </div>
            `
          : html`
              <div class="permission-gate">
                ${eyeIcon}
                <p class="permission-gate-title">Access restricted</p>
                <p class="permission-gate-body">
                  You don't have permission to view dashboard data.
                  Contact your administrator if you believe this is an error.
                </p>
              </div>
            `}
      </main>
    `;
  }
}

customElements.define("admin-dashboard", Dashboard);

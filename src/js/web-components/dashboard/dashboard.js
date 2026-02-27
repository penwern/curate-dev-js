//TODO - think about showing errors in dashboard, ingestion, preservation etc.
//TODO - need proper format/mime reporting not just document classifications.
//TODO - small bug with custom router, if Im on a custom route then navigate to a new url it appends
//  the custom route to it which breaks the navigation, eg when going from reports dashboard to settings.
// this doesnt happen if I go from eg dash to a workspace. weird. might be tolerable.
//TODO - need to add exporting tools
//TODO - talk to the chaps about the strategy for format reporting, is database access possible
//TODO - when I deleted stuff in deletions tab, the list didnt update properly until refreshed.
import { LitElement, html, css } from "lit";
import "./components/workspace-filter.js";
import "./panels/file-overview-panel.js";
import "./panels/ingestion-panel.js";
import "./panels/storage-panel.js";
import "./panels/deletions-panel.js";
import "./panels/activity-panel.js";
import { getWorkspaces, invalidateCache, currentUserCanViewDashboard } from "./client.js";
import { refreshIcon, fileMultipleIcon, cloudUploadIcon, harddiskIcon, deleteClockIcon, eyeIcon } from "../utils/icons.js";
import "../utils/penwern-spinner.js";

const TABS = [
  { id: "overview", label: "Overview", icon: "fileMultipleIcon" },
  { id: "ingestion", label: "Ingestion", icon: "cloudUploadIcon" },
  { id: "storage", label: "Storage", icon: "harddiskIcon" },
  { id: "deletions", label: "Deletions", icon: "deleteClockIcon" },
  { id: "activity", label: "Activity", icon: "eyeIcon" },
];

const TAB_ICONS = {
  fileMultipleIcon,
  cloudUploadIcon,
  harddiskIcon,
  deleteClockIcon,
  eyeIcon,
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
      max-width: var(--dash-max-width);
      margin: 0 auto;
      padding: 0 var(--dash-gutter);
      display: flex;
      align-items: center;
      gap: 2px;
      position: relative;
    }

    .tab {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 20px;
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
      left: 16px;
      right: 16px;
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
      width: 18px;
      height: 18px;
      fill: currentColor;
      flex-shrink: 0;
    }

    .tab-spacer {
      flex: 1;
    }

    .tab-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
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
      .tab { padding: 14px 12px; }
      .tab-label { display: none; }
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
      max-width: var(--dash-max-width);
      margin: 0 auto;
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

  _renderPanel() {
    switch (this._activeTab) {
      case "overview":
        return html`
          <file-overview-panel
            .workspaces=${this._workspaces}
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
      default:
        return html``;
    }
  }

  render() {
    return html`
      <nav class="tab-bar">
        <div class="tab-bar-inner">
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
          <span class="tab-spacer"></span>
          <div class="tab-actions">
            <workspace-filter
              .workspaces=${this._workspaces}
              .selected=${this._selectedWorkspace}
              .loading=${this._wsLoading}
              ?disabled=${!this._wsFilterEnabled}
              @workspace-changed=${this._onWorkspaceChanged}
            ></workspace-filter>
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

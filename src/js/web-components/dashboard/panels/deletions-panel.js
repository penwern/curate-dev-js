import { LitElement, html, css } from "lit";
import "../components/stat-card.js";
import "../components/chart-card.js";
import "../components/data-table.js";
import {
  getRecycleBin,
  getAuditLogs,
  deleteNodes,
  restoreNodes,
  invalidateCache,
  formatBytes,
  formatNumber,
  formatDate,
  extensionFromPath,
} from "../client.js";
import {
  deleteClockIcon,
  deleteIcon,
  restartIcon,
  alertCircleIcon,
} from "../../utils/icons.js";
import { fetchAllAuditLogs } from "../utils/export-utils.js";

class DeletionsPanel extends LitElement {
  static properties = {
    workspaces: { type: Array },
    selectedWorkspace: { type: String },
    _statsLoading: { state: true },
    _recycleBinLoading: { state: true },
    _totalDeleted: { state: true },
    _totalDeletedSize: { state: true },
    _chartData: { state: true },
    _tableRows: { state: true },
    _auditRows: { state: true },
    _auditPage: { state: true },
    _auditLoading: { state: true },
    _selected: { state: true },
    _actionInProgress: { state: true },
    _actionError: { state: true },
    _confirmDelete: { state: true },
    _requesterLoading: { state: true },
    _ageBinData: { state: true },
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
      margin-bottom: 32px;
    }

    @media (max-width: 768px) {
      .charts-row { grid-template-columns: 1fr; }
    }

    /* ─── Work area ─── */
    .work-area {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    /* ─── Section headers ─── */
    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }

    .section-title {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant);
      white-space: nowrap;
    }

    .section-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      border-radius: 10px;
      background: var(--md-sys-color-error-container);
      color: var(--md-sys-color-on-error-container);
      font-size: 11px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .section-rule {
      flex: 1;
      height: 1px;
      background: var(--md-sys-color-outline-variant-50);
    }

    /* ─── Queue card ─── */
    .queue-card {
      background: var(--md-sys-color-surface);
      border: 1px solid var(--md-sys-color-outline-variant-50);
      border-radius: 16px;
      overflow: hidden;
    }

    /* ─── Action bar ─── */
    .action-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 20px;
      background: color-mix(in srgb, var(--md-sys-color-primary-container) 40%, var(--md-sys-color-surface));
      border-bottom: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 20%, transparent);
      animation: barSlideIn 0.18s ease-out;
    }

    .action-count {
      flex: 1;
      font-size: 13px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .count-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 22px;
      padding: 0 7px;
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border-radius: 11px;
      font-size: 11px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      border-radius: 10px;
      border: none;
      font-size: 12px;
      font-family: "DM Sans", "Roboto", sans-serif;
      font-weight: 600;
      letter-spacing: 0.1px;
      cursor: pointer;
      transition: filter 0.12s ease, transform 0.12s ease;
      white-space: nowrap;
    }

    .action-btn:disabled { opacity: 0.4; cursor: default; pointer-events: none; }
    .action-btn:active:not(:disabled) { transform: scale(0.97); }
    .action-btn svg { width: 15px; height: 15px; flex-shrink: 0; }

    .restore-btn {
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
    }
    .restore-btn:hover:not(:disabled) { filter: brightness(0.92); }

    .perm-delete-btn {
      background: color-mix(in srgb, var(--md-sys-color-error-container) 70%, transparent);
      color: var(--md-sys-color-on-error-container);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-error) 30%, transparent);
    }
    .perm-delete-btn:hover:not(:disabled) { filter: brightness(0.9); }

    @keyframes barSlideIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ─── Confirm bar ─── */
    .confirm-bar {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 20px;
      background: var(--md-sys-color-error);
      border-bottom: 2px solid color-mix(in srgb, var(--md-sys-color-error) 60%, black 40%);
      animation: barSlideIn 0.15s ease-out;
    }

    .confirm-icon-wrap {
      flex-shrink: 0;
      color: var(--md-sys-color-on-error);
      opacity: 0.85;
      display: flex;
    }
    .confirm-icon-wrap svg { width: 20px; height: 20px; }

    .confirm-text-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .confirm-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--md-sys-color-on-error);
    }

    .confirm-sub {
      font-size: 11px;
      color: var(--md-sys-color-on-error);
      opacity: 0.8;
    }

    .confirm-cancel-btn {
      background: rgba(255, 255, 255, 0.15);
      color: var(--md-sys-color-on-error);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .confirm-cancel-btn:hover { background: rgba(255, 255, 255, 0.25); filter: none; }

    .confirm-ok-btn {
      background: var(--md-sys-color-on-error);
      color: var(--md-sys-color-error);
      border: none;
    }
    .confirm-ok-btn:hover:not(:disabled) {
      filter: brightness(0.93);
    }

    /* ─── Error notice ─── */
    .error-notice {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: color-mix(in srgb, var(--md-sys-color-error-container) 40%, transparent);
      border-bottom: 1px solid color-mix(in srgb, var(--md-sys-color-error-container) 80%, transparent);
      font-size: 12px;
      color: var(--md-sys-color-on-error-container);
      animation: barSlideIn 0.15s ease-out;
    }
    .error-notice svg { width: 15px; height: 15px; flex-shrink: 0; }
    .error-dismiss {
      margin-left: auto;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 12px;
      color: inherit;
      text-decoration: underline;
      font-family: inherit;
      padding: 0;
      opacity: 0.7;
    }
    .error-dismiss:hover { opacity: 1; }

    /* ─── Queue table ─── */
    .queue-scroll { overflow-x: auto; }

    .queue-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .queue-table thead {
      background: var(--md-sys-color-surface-variant);
    }

    .queue-table th {
      text-align: left;
      padding: 10px 14px;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--md-sys-color-on-surface-variant);
      white-space: nowrap;
    }

    .queue-table th.col-cb,
    .queue-table td.col-cb {
      width: 44px;
      padding-right: 0;
    }

    .queue-table td {
      padding: 11px 14px;
      color: var(--md-sys-color-on-surface);
      border-top: 1px solid var(--md-sys-color-outline-variant-50);
      vertical-align: middle;
    }

    .queue-table tbody tr { transition: background 0.1s; }

    .queue-table tbody tr:hover td {
      background: var(--md-sys-color-hover-background);
    }

    .queue-table tbody tr.row-selected td {
      background: color-mix(in srgb, var(--md-sys-color-primary-container) 28%, transparent);
    }

    .queue-table tbody tr.row-selected td:first-child {
      box-shadow: inset 3px 0 0 var(--md-sys-color-primary);
    }

    .queue-table tbody tr.row-selected:hover td {
      background: color-mix(in srgb, var(--md-sys-color-primary-container) 42%, transparent);
    }

    /* ─── Custom checkbox ─── */
    .cb-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .queue-table input[type="checkbox"] {
      appearance: none;
      width: 16px;
      height: 16px;
      border: 1.5px solid var(--md-sys-color-outline);
      border-radius: 4px;
      cursor: pointer;
      position: relative;
      transition: background 0.1s, border-color 0.1s;
      flex-shrink: 0;
      display: block;
    }

    .queue-table input[type="checkbox"]:hover { border-color: var(--md-sys-color-primary); }

    .queue-table input[type="checkbox"]:checked,
    .queue-table input[type="checkbox"]:indeterminate {
      background: var(--md-sys-color-primary);
      border-color: var(--md-sys-color-primary);
    }

    .queue-table input[type="checkbox"]:checked::after {
      content: "";
      position: absolute;
      top: 2px;
      left: 4.5px;
      width: 5px;
      height: 8px;
      border-right: 2px solid var(--md-sys-color-on-primary);
      border-bottom: 2px solid var(--md-sys-color-on-primary);
      transform: rotate(45deg);
    }

    .queue-table input[type="checkbox"]:indeterminate::after {
      content: "";
      position: absolute;
      top: 6px;
      left: 3px;
      right: 3px;
      height: 2px;
      background: var(--md-sys-color-on-primary);
      border-radius: 1px;
    }

    /* ─── Name cell ─── */
    .name-cell {
      display: flex;
      flex-direction: column;
      gap: 1px;
      max-width: 210px;
    }

    .name-primary {
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .name-path {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant);
      opacity: 0.6;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ─── Type badge ─── */
    .type-badge {
      display: inline-flex;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .type-badge--file {
      background: color-mix(in srgb, var(--md-sys-color-primary-container) 55%, transparent);
      color: var(--md-sys-color-on-primary-container);
    }

    .type-badge--folder {
      background: color-mix(in srgb, var(--md-sys-color-tertiary-container) 60%, transparent);
      color: var(--md-sys-color-on-tertiary-container);
    }

    /* ─── Requester cell ─── */
    .requester-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .requester-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      max-width: 160px;
    }

    .requester-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      letter-spacing: 0;
    }

    .requester-name {
      font-size: 12px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .requester-ts {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant);
      opacity: 0.6;
      padding-left: 26px;
    }

    .requester-shimmer {
      width: 90px;
      height: 13px;
      border-radius: 3px;
      background: linear-gradient(
        90deg,
        var(--md-sys-color-surface-variant) 25%,
        color-mix(in srgb, var(--md-sys-color-surface-variant) 40%, transparent) 50%,
        var(--md-sys-color-surface-variant) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .requester-unknown {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
      opacity: 0.4;
    }

    /* ─── Skeleton rows ─── */
    .skeleton-cell {
      height: 12px;
      border-radius: 3px;
      background: linear-gradient(
        90deg,
        var(--md-sys-color-surface-variant) 25%,
        var(--md-sys-color-surface) 50%,
        var(--md-sys-color-surface-variant) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ─── Empty state ─── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 56px 24px;
      gap: 10px;
      text-align: center;
    }

    .empty-icon {
      width: 44px;
      height: 44px;
      opacity: 0.2;
      color: var(--md-sys-color-on-surface-variant);
    }
    .empty-icon svg { width: 44px; height: 44px; }

    .empty-heading {
      font-size: 14px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
      opacity: 0.5;
    }

    .empty-body {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
      opacity: 0.45;
      max-width: 280px;
      line-height: 1.6;
    }

    /* ─── Audit card ─── */
    .audit-card {
      background: var(--md-sys-color-surface);
      border: 1px solid var(--md-sys-color-outline-variant-50);
      border-radius: 16px;
      overflow: hidden;
    }

  `;

  constructor() {
    super();
    this.workspaces = [];
    this.selectedWorkspace = "";
    this._statsLoading = true;
    this._recycleBinLoading = true;
    this._totalDeleted = 0;
    this._totalDeletedSize = 0;
    this._chartData = null;
    this._tableRows = [];
    this._auditRows = [];
    this._auditPage = 0;
    this._auditLoading = true;
    this._selected = new Set();
    this._loadGen = 0;
    this._actionInProgress = false;
    this._actionError = "";
    this._confirmDelete = false;
    this._requesterLoading = false;
    this._ageBinData = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadData();
    this._loadAuditLog(0);
  }

  updated(changed) {
    if (changed.has("_tableRows")) {
      this._rebuildAgeChart();
    }
    if (changed.has("selectedWorkspace") && changed.get("selectedWorkspace") !== undefined) {
      this._selected = new Set();
      this._confirmDelete = false;
      this._actionError = "";
      this._loadData();
      this._auditPage = 0;
      this._loadAuditLog(0);
    }
    if (changed.has("workspaces") && this.workspaces.length) {
      this._loadData();
      this._loadAuditLog(0);
    }
  }

  // ── Audit log ────────────────────────────────────────────────────────────

  async _loadAuditLog(page = 0) {
    this._auditLoading = true;
    this._auditPage = page;
    try {
      const wsFilter = this.selectedWorkspace
        ? this.workspaces.find((w) => w.Slug === this.selectedWorkspace)
        : null;

      // WsUuid is absent on MsgId:19 events — fetch all and filter client-side by NodePath
      const fetchSize = wsFilter ? 200 : 10;
      const fetchPage = wsFilter ? 0 : page;

      const res = await getAuditLogs("+MsgId:19", fetchPage, fetchSize);
      let logs = res.Logs ?? [];

      if (wsFilter) {
        const prefix = wsFilter.Slug + "/";
        logs = logs.filter((log) => (log.NodePath ?? "").startsWith(prefix));
        const start = page * 10;
        this._auditRows = logs.slice(start, start + 10).map((log) => this._mapAuditLog(log));
      } else {
        this._auditRows = logs.map((log) => this._mapAuditLog(log));
      }
    } catch (err) {
      console.error("DeletionsPanel audit error:", err);
    } finally {
      this._auditLoading = false;
    }
  }

  _mapAuditLog(log) {
    const path = log.NodePath ?? "";
    const parts = path.split("/").filter(Boolean);
    return {
      actor: log.UserName ?? "",
      object: parts.length > 0 ? parts[parts.length - 1] : path,
      workspace: parts[0] ?? "",
      date: log.Ts ?? 0,
    };
  }

  _onAuditPageChanged(e) {
    this._loadAuditLog(e.detail.page);
  }

  // ── Recycle bin data ─────────────────────────────────────────────────────

  async _loadData() {
    if (!this.workspaces.length) return;
    const gen = ++this._loadGen;
    this._statsLoading = true;
    this._recycleBinLoading = true;
    this._selected = new Set();
    this._tableRows = [];

    const targets = this.selectedWorkspace
      ? this.workspaces.filter((ws) => (ws.Slug ?? ws.UUID) === this.selectedWorkspace)
      : this.workspaces;

    const style = getComputedStyle(document.documentElement);
    const errorColor = style.getPropertyValue("--md-sys-color-error").trim() || "#ba1a1a";
    const perWs = {};

    try {
      await Promise.all(
        targets.map(async (ws) => {
          const slug = ws.Slug ?? ws.UUID ?? "";
          const label = ws.Label ?? slug;
          let nodes = [];
          try {
            const res = await getRecycleBin(slug, 200, 0);
            nodes = (res.Nodes ?? []).filter((n) => !n.Path?.endsWith("/recycle_bin"));
          } catch {
            // workspace unavailable — continue with others
          }

          if (gen !== this._loadGen) return;

          const wsSize = nodes.reduce((s, n) => s + parseInt(n.Size ?? "0", 10), 0);
          perWs[label] = { count: nodes.length, size: wsSize };

          const newRows = nodes.map((node) => {
            const path = node.Path ?? "";
            const parts = path.split("/").filter(Boolean);
            return {
              name: parts[parts.length - 1] ?? "Unknown",
              workspace: label,
              path,
              size: parseInt(node.Size ?? "0", 10),
              mtime: node.MTime ? parseInt(node.MTime, 10) : 0,
              ext: extensionFromPath(path),
              type: node.Type === "COLLECTION" ? "Folder" : "File",
              requester: null,
              requesterTs: null,
            };
          });

          // Update UI progressively as each workspace resolves
          const merged = [...this._tableRows, ...newRows].sort((a, b) => b.mtime - a.mtime);
          this._tableRows = merged;
          this._totalDeleted = merged.length;
          this._totalDeletedSize = Object.values(perWs).reduce((s, w) => s + w.size, 0);
          this._statsLoading = false;

          const chartLabels = Object.keys(perWs);
          this._chartData = {
            labels: chartLabels,
            datasets: [{
              label: "Deleted Items",
              data: chartLabels.map((l) => perWs[l].count),
              backgroundColor: errorColor + "AA",
              borderRadius: 6,
              borderSkipped: false,
              barThickness: 28,
            }],
          };
          this._recycleBinLoading = false;
        }),
      );

      if (gen === this._loadGen) this._loadRequesters();
    } catch (err) {
      console.error("DeletionsPanel load error:", err);
    } finally {
      if (gen === this._loadGen) {
        this._statsLoading = false;
        this._recycleBinLoading = false;
      }
    }
  }

  // ── Age distribution ──────────────────────────────────────────────────────

  _rebuildAgeChart() {
    if (!this._tableRows.length) {
      this._ageBinData = null;
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const bins = [
      { label: "< 7 days",    max: 7 * 86400,   count: 0 },
      { label: "7–30 days",   max: 30 * 86400,  count: 0 },
      { label: "1–3 months",  max: 90 * 86400,  count: 0 },
      { label: "> 3 months",  max: Infinity,    count: 0 },
    ];

    for (const row of this._tableRows) {
      const ts = row.requesterTs || row.mtime;
      const age = ts ? now - ts : 0;
      for (const bin of bins) {
        if (age <= bin.max) { bin.count++; break; }
      }
    }

    const style = getComputedStyle(document.documentElement);
    const errorColor = style.getPropertyValue("--md-sys-color-error").trim() || "#ba1a1a";
    const colors = [errorColor + "55", errorColor + "88", errorColor + "BB", errorColor];

    this._ageBinData = {
      labels: bins.map((b) => b.label),
      datasets: [{
        label: "Items",
        data: bins.map((b) => b.count),
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 28,
      }],
    };
  }

  // ── Requester correlation ─────────────────────────────────────────────────
  // MsgId:20 events capture the user who soft-deleted (moved to recycle bin).
  // We correlate by matching the destination filename from the Msg field.

  async _loadRequesters() {
    if (!this._tableRows.length) return;
    this._requesterLoading = true;
    try {
      const res = await getAuditLogs("+MsgId:20", 0, 200);
      const logs = res.Logs ?? [];

      // Build filename → {user, ts} from the "Moved [src] to [dest]" message
      const byFilename = new Map();
      for (const log of logs) {
        const match = (log.Msg ?? "").match(/Moved \[(.+?)\] to \[(.+?)\]/);
        const dest = match ? match[2] : (log.NodePath ?? "");
        const filename = dest.split("/").pop()?.toLowerCase();
        if (filename && !byFilename.has(filename)) {
          byFilename.set(filename, { user: log.UserName ?? "", ts: log.Ts ?? 0 });
        }
      }

      this._tableRows = this._tableRows.map((row) => {
        const hit = byFilename.get(row.name.toLowerCase());
        return hit
          ? { ...row, requester: hit.user, requesterTs: hit.ts }
          : { ...row, requester: "", requesterTs: null };
      });
    } catch (err) {
      console.error("DeletionsPanel requester lookup error:", err);
      this._tableRows = this._tableRows.map((row) => ({ ...row, requester: "", requesterTs: null }));
    } finally {
      this._requesterLoading = false;
    }
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  _toggleSelectAll(e) {
    this._selected = e.target.checked
      ? new Set(this._tableRows.map((r) => r.path))
      : new Set();
  }

  _toggleRow(path, checked) {
    const next = new Set(this._selected);
    if (checked) next.add(path);
    else next.delete(path);
    this._selected = next;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async _restoreSelected() {
    if (!this._selected.size || this._actionInProgress) return;
    this._actionInProgress = true;
    this._actionError = "";
    const actioned = new Set(this._selected);
    try {
      await restoreNodes([...actioned]);
      this._tableRows = this._tableRows.filter((r) => !actioned.has(r.path));
      this._selected = new Set();
      invalidateCache();
      await this._loadData();
    } catch (err) {
      this._actionError = `Restore failed: ${err.message}`;
    } finally {
      this._actionInProgress = false;
    }
  }

  async _deleteSelectedPermanently() {
    if (!this._selected.size || this._actionInProgress) return;
    this._actionInProgress = true;
    this._confirmDelete = false;
    this._actionError = "";
    const actioned = new Set(this._selected);
    try {
      await deleteNodes([...actioned], true);
      this._tableRows = this._tableRows.filter((r) => !actioned.has(r.path));
      this._selected = new Set();
      invalidateCache();
      await this._loadData();
    } catch (err) {
      this._actionError = `Permanent deletion failed: ${err.message}`;
    } finally {
      this._actionInProgress = false;
    }
  }

  // ── Export ────────────────────────────────────────────────────────────────

  /**
   * Returns all deletions data structured for export.
   * Uses already-loaded recycle bin data and fetches complete deletion history.
   */
  async getExportData() {
    // If recycle bin hasn't loaded yet (e.g. called from global export on detached element),
    // fetch fresh data from the API using current filter state.
    let tableRows = this._tableRows;
    if (!tableRows.length && this.workspaces.length) {
      const targets = this.selectedWorkspace
        ? this.workspaces.filter((ws) => (ws.Slug ?? ws.UUID) === this.selectedWorkspace)
        : this.workspaces;

      const allNodeArrays = await Promise.all(
        targets.map(async (ws) => {
          const slug = ws.Slug ?? ws.UUID ?? "";
          const label = ws.Label ?? slug;
          try {
            const res = await getRecycleBin(slug, 200, 0);
            return (res.Nodes ?? [])
              .filter((n) => !n.Path?.endsWith("/recycle_bin"))
              .map((node) => {
                const path = node.Path ?? "";
                const parts = path.split("/").filter(Boolean);
                return {
                  name: parts[parts.length - 1] ?? "Unknown",
                  workspace: label,
                  path,
                  size: parseInt(node.Size ?? "0", 10),
                  mtime: node.MTime ? parseInt(node.MTime, 10) : 0,
                  type: node.Type === "COLLECTION" ? "Folder" : "File",
                  requester: "",
                  requesterTs: null,
                };
              });
          } catch {
            return [];
          }
        }),
      );
      tableRows = allNodeArrays.flat().sort((a, b) => b.mtime - a.mtime);
    }

    const totalDeleted = tableRows.length;
    const totalDeletedSize = tableRows.reduce((s, r) => s + r.size, 0);

    const summary = [
      { Metric: "Soft-Deleted Items", Value: totalDeleted },
      { Metric: "Recoverable Storage", Value: formatBytes(totalDeletedSize) },
      { Metric: "Recoverable Storage (Bytes)", Value: totalDeletedSize },
      { Metric: "Workspace Filter", Value: this.selectedWorkspace || "All Workspaces" },
    ];

    const recycleBin = tableRows.map((row) => ({
      Name: row.name,
      Type: row.type,
      Workspace: row.workspace,
      "Size (Bytes)": row.size,
      "Size (Formatted)": formatBytes(row.size),
      "In Bin Since": (row.requesterTs || row.mtime) ? new Date((row.requesterTs || row.mtime) * 1000).toISOString() : "",
      "Deleted By": row.requester || "Unknown",
      Path: row.path,
    }));

    const historyLogs = await fetchAllAuditLogs(getAuditLogs, "+MsgId:19");
    const history = historyLogs.map((log) => {
      const path = log.NodePath ?? "";
      const parts = path.split("/").filter(Boolean);
      return {
        Date: log.Ts ? new Date(log.Ts * 1000).toISOString() : "",
        User: log.UserName ?? "",
        Item: parts.length > 0 ? parts[parts.length - 1] : path,
        Workspace: parts[0] ?? "",
        Path: path,
      };
    });

    return { summary, recycleBin, history };
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  _renderRequester(row) {
    if (row.requester === null) {
      return html`<div class="requester-shimmer"></div>`;
    }
    if (!row.requester) {
      return html`<span class="requester-unknown">—</span>`;
    }
    const initials = row.requester.slice(0, 2).toUpperCase();
    return html`
      <div class="requester-cell">
        <div class="requester-chip">
          <div class="requester-avatar">${initials}</div>
          <span class="requester-name">${row.requester}</span>
        </div>
        ${row.requesterTs
          ? html`<span class="requester-ts">${formatDate(row.requesterTs)}</span>`
          : ""}
      </div>
    `;
  }

  _renderActionArea() {
    if (this._actionError) {
      return html`
        <div class="error-notice">
          ${alertCircleIcon}
          ${this._actionError}
          <button class="error-dismiss" @click=${() => { this._actionError = ""; }}>Dismiss</button>
        </div>
      `;
    }
    if (this._confirmDelete) {
      const count = this._selected.size;
      return html`
        <div class="confirm-bar">
          <div class="confirm-icon-wrap">${alertCircleIcon}</div>
          <div class="confirm-text-wrap">
            <span class="confirm-title">Permanently delete ${count} item${count !== 1 ? "s" : ""}?</span>
            <span class="confirm-sub">This action is irreversible. Items will be removed from all storage and cannot be recovered.</span>
          </div>
          <button class="action-btn confirm-cancel-btn" @click=${() => { this._confirmDelete = false; }}>
            Cancel
          </button>
          <button
            class="action-btn confirm-ok-btn"
            ?disabled=${this._actionInProgress}
            @click=${this._deleteSelectedPermanently}
          >
            ${deleteIcon} Confirm Delete
          </button>
        </div>
      `;
    }
    if (this._selected.size > 0) {
      const count = this._selected.size;
      return html`
        <div class="action-bar">
          <div class="action-count">
            <span class="count-pill">${count}</span>
            item${count !== 1 ? "s" : ""} selected
          </div>
          <button
            class="action-btn restore-btn"
            ?disabled=${this._actionInProgress}
            @click=${this._restoreSelected}
          >
            ${restartIcon} Restore
          </button>
          <button
            class="action-btn perm-delete-btn"
            ?disabled=${this._actionInProgress}
            @click=${() => { this._confirmDelete = true; }}
          >
            ${deleteIcon} Permanently Delete
          </button>
        </div>
      `;
    }
    return "";
  }

  _renderQueueTable() {
    const allChecked = this._tableRows.length > 0 && this._selected.size === this._tableRows.length;
    const someChecked = this._selected.size > 0 && this._selected.size < this._tableRows.length;

    if (this._recycleBinLoading) {
      return html`
        <div class="queue-scroll">
          <table class="queue-table">
            <thead>
              <tr>
                <th class="col-cb"></th>
                <th>Name</th><th>Type</th><th>Workspace</th>
                <th>Size</th><th>In bin since</th><th>Requested by</th>
              </tr>
            </thead>
            <tbody>
              ${Array.from({ length: 5 }, (_, i) => html`
                <tr>
                  <td class="col-cb"></td>
                  ${[65, 30, 45, 25, 40, 70].map((w) => html`
                    <td><div class="skeleton-cell" style="width:${w}%;animation-delay:${i * 0.07}s"></div></td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      `;
    }

    if (!this._tableRows.length) {
      return html`
        <div class="empty-state">
          <div class="empty-icon">${deleteClockIcon}</div>
          <div class="empty-heading">Recycle bins are clear</div>
          <div class="empty-body">
            No items are currently pending review. All deleted content has been actioned
            or no deletions have occurred.
          </div>
        </div>
      `;
    }

    return html`
      <div class="queue-scroll">
        <table class="queue-table">
          <thead>
            <tr>
              <th class="col-cb">
                <div class="cb-wrap">
                  <input
                    type="checkbox"
                    .checked=${allChecked}
                    .indeterminate=${someChecked}
                    @change=${this._toggleSelectAll}
                  />
                </div>
              </th>
              <th>Name</th>
              <th>Type</th>
              <th>Workspace</th>
              <th>Size</th>
              <th>In bin since</th>
              <th>Requested by</th>
            </tr>
          </thead>
          <tbody>
            ${this._tableRows.map((row) => html`
              <tr class=${this._selected.has(row.path) ? "row-selected" : ""}>
                <td class="col-cb">
                  <div class="cb-wrap">
                    <input
                      type="checkbox"
                      .checked=${this._selected.has(row.path)}
                      @change=${(e) => this._toggleRow(row.path, e.target.checked)}
                    />
                  </div>
                </td>
                <td>
                  <div class="name-cell">
                    <span class="name-primary" title=${row.name}>${row.name}</span>
                    <span class="name-path" title=${row.path}>${row.path}</span>
                  </div>
                </td>
                <td>
                  <span class="type-badge type-badge--${row.type === "Folder" ? "folder" : "file"}">
                    ${row.type}
                  </span>
                </td>
                <td>${row.workspace}</td>
                <td>${formatBytes(row.size)}</td>
                <td>${formatDate(row.requesterTs || row.mtime)}</td>
                <td>${this._renderRequester(row)}</td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }

  render() {
    return html`
      <div class="stats-grid">
        <stat-card
          label="Soft-Deleted Items"
          .value=${formatNumber(this._totalDeleted)}
          subtitle="In recycle bins"
          .loading=${this._statsLoading}
          style="--stat-accent: var(--md-sys-color-error)"
        >
          <span slot="icon">${deleteClockIcon}</span>
        </stat-card>
        <stat-card
          label="Deleted Size"
          .value=${formatBytes(this._totalDeletedSize)}
          subtitle="Recoverable storage"
          .loading=${this._statsLoading}
          style="--stat-accent: var(--md-sys-color-error)"
        >
          <span slot="icon">${deleteIcon}</span>
        </stat-card>
      </div>

      <div class="charts-row">
        <chart-card
          heading="Deleted Items by Workspace"
          type="bar"
          .data=${this._chartData}
          .loading=${this._recycleBinLoading}
          .height=${Math.max(200, (this.workspaces.length || 3) * 40)}
          .options=${{
            indexAxis: "y",
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} items` } },
            },
            scales: { x: { ticks: { precision: 0 } } },
          }}
        ></chart-card>
        <chart-card
          heading="Time in Recycle Bin"
          type="bar"
          .data=${this._ageBinData}
          .loading=${this._recycleBinLoading}
          .height=${Math.max(200, (this.workspaces.length || 3) * 40)}
          .options=${{
            indexAxis: "y",
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} item${ctx.raw !== 1 ? "s" : ""}` } },
            },
            scales: { x: { ticks: { precision: 0 } } },
          }}
        ></chart-card>
      </div>

      <div class="work-area">

        <div>
          <div class="section-header">
            <span class="section-title">Review Queue</span>
            ${this._totalDeleted > 0
              ? html`<span class="section-badge">${this._totalDeleted}</span>`
              : ""}
            <div class="section-rule"></div>
          </div>
          <div class="queue-card">
            ${this._renderActionArea()}
            ${this._renderQueueTable()}
          </div>
        </div>

        <div>
          <div class="section-header">
            <span class="section-title">Deletion History</span>
            <div class="section-rule"></div>
          </div>
          <div class="audit-card">
            <data-table
              .columns=${[
                { field: "actor", label: "User" },
                { field: "object", label: "Item" },
                { field: "workspace", label: "Workspace" },
                { field: "date", label: "Date", format: (v) => formatDate(v) },
              ]}
              .rows=${this._auditRows}
              .loading=${this._auditLoading}
              .pageSize=${10}
              .serverPaginated=${true}
              .sortable=${false}
              .page=${this._auditPage}
              @page-changed=${this._onAuditPageChanged}
            ></data-table>
          </div>
        </div>

      </div>
    `;
  }
}

customElements.define("deletions-panel", DeletionsPanel);

import { LitElement, html, css } from "lit";
import { getStorageReports, fetchStorageReportBlob, formatDate } from "../client.js";
import { downloadBlob } from "../utils/export-utils.js";
import { documentIcon, downloadIcon } from "../../utils/icons.js";
import "../../utils/penwern-spinner.js";

// How long an opened report's object URL is kept before it is revoked. The new
// tab has loaded it long before then.
const OPEN_URL_LIFETIME_MS = 60_000;

/**
 * The monthly client reports that have been sent to the client, newest first,
 * from the storage reporting service (admins only). Each month opens as a PDF
 * in a new tab, or downloads as the PDF or the self-contained web version.
 */
class ReportsPanel extends LitElement {
  static properties = {
    storageReportingUrl: { type: String },
    _loading: { state: true },
    _reports: { state: true },
    _notSetUp: { state: true },
    _error: { state: true },
    _busy: { state: true },
  };

  static styles = css`
    :host {
      display: block;
    }
    .intro {
      margin: 0 0 16px;
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      background: var(--md-sys-color-surface);
      border: 1px solid var(--md-sys-color-outline-variant-50);
      border-radius: 8px;
    }
    .row svg {
      width: 22px;
      height: 22px;
      flex-shrink: 0;
      fill: var(--md-sys-color-primary);
    }
    .row-main {
      flex: 1;
      min-width: 0;
    }
    .row-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }
    .row-meta {
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      font: inherit;
      font-size: 13px;
      font-weight: 500;
      border-radius: 999px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: transparent;
      color: var(--md-sys-color-primary);
      cursor: pointer;
    }
    button.primary {
      background: var(--md-sys-color-primary);
      border-color: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
    }
    button:hover:not(:disabled) {
      background: var(--md-sys-color-hover-background);
    }
    button.primary:hover:not(:disabled) {
      opacity: 0.9;
      background: var(--md-sys-color-primary);
    }
    button:disabled {
      opacity: 0.5;
      cursor: default;
    }
    button svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
    .empty,
    .error {
      padding: 32px 16px;
      text-align: center;
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
      background: var(--md-sys-color-surface);
      border: 1px solid var(--md-sys-color-outline-variant-50);
      border-radius: 8px;
    }
    .error {
      margin-bottom: 16px;
      color: var(--md-sys-color-error);
    }
    .loading {
      display: flex;
      justify-content: center;
      padding: 32px;
    }
  `;

  constructor() {
    super();
    this.storageReportingUrl = "";
    this._loading = false;
    this._reports = [];
    this._notSetUp = false;
    this._error = "";
    this._busy = "";
    this._loadGen = 0;
  }

  updated(changed) {
    if (changed.has("storageReportingUrl") && this.storageReportingUrl) {
      this._load();
    }
  }

  async _load() {
    const gen = ++this._loadGen;
    this._loading = true;
    this._error = "";
    try {
      const res = await getStorageReports(this.storageReportingUrl);
      if (gen !== this._loadGen) return;
      this._reports = res.reports ?? [];
      this._notSetUp = Boolean(res.notSetUp);
    } catch (err) {
      if (gen !== this._loadGen) return;
      console.error("ReportsPanel load error:", err);
      this._reports = [];
      this._error = "The reports could not be loaded. Try refreshing.";
    } finally {
      if (gen === this._loadGen) this._loading = false;
    }
  }

  _fileName(report, ext) {
    return `report-${report.period}.${ext}`;
  }

  async _openPdf(report) {
    // Open the tab now, inside the click, or the popup blocker stops it; the
    // PDF is put into it once it has been fetched with the user's token.
    const win = window.open("", "_blank");
    this._busy = `${report.period}.open`;
    try {
      const blob = await fetchStorageReportBlob(this.storageReportingUrl, report.period, "pdf");
      if (win && !win.closed) {
        const url = URL.createObjectURL(blob);
        win.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), OPEN_URL_LIFETIME_MS);
      } else {
        downloadBlob(blob, this._fileName(report, "pdf"));
      }
    } catch (err) {
      console.error("ReportsPanel open error:", err);
      if (win && !win.closed) win.close();
      this._error = `The ${report.period_label} report could not be opened.`;
    } finally {
      this._busy = "";
    }
  }

  async _download(report, ext) {
    this._busy = `${report.period}.${ext}`;
    try {
      const blob = await fetchStorageReportBlob(this.storageReportingUrl, report.period, ext);
      downloadBlob(blob, this._fileName(report, ext));
    } catch (err) {
      console.error("ReportsPanel download error:", err);
      this._error = `The ${report.period_label} report could not be downloaded.`;
    } finally {
      this._busy = "";
    }
  }

  _meta(report) {
    const parts = [];
    if (report.client_name) parts.push(report.client_name);
    if (report.sent_at) parts.push(`Sent ${formatDate(report.sent_at)}`);
    if (report.to_count) {
      parts.push(`${report.to_count} recipient${report.to_count === 1 ? "" : "s"}`);
    }
    return parts.join(" · ");
  }

  _renderRow(report) {
    const busy = Boolean(this._busy);
    return html`
      <div class="row">
        ${documentIcon}
        <div class="row-main">
          <div class="row-title">${report.period_label}</div>
          <div class="row-meta">${this._meta(report)}</div>
        </div>
        <div class="actions">
          <button class="primary" ?disabled=${busy} @click=${() => this._openPdf(report)}>
            ${this._busy === `${report.period}.open` ? "Opening…" : "Open PDF"}
          </button>
          <button ?disabled=${busy} @click=${() => this._download(report, "pdf")}>
            ${downloadIcon} PDF
          </button>
          ${
            report.has_html
              ? html`<button
                  ?disabled=${busy}
                  title="The web version opens in any browser, offline"
                  @click=${() => this._download(report, "html")}
                >
                  ${downloadIcon} Web version
                </button>`
              : ""
          }
        </div>
      </div>
    `;
  }

  _renderBody() {
    if (this._loading) {
      return html`<div class="loading"><penwern-spinner size="32"></penwern-spinner></div>`;
    }
    if (this._notSetUp) {
      return html`<div class="empty">Monthly client reports are not set up on this system.</div>`;
    }
    if (!this._reports.length && !this._error) {
      return html`<div class="empty">No reports have been sent yet.</div>`;
    }
    return html`<div class="list">${this._reports.map((r) => this._renderRow(r))}</div>`;
  }

  render() {
    return html`
      <p class="intro">
        The monthly preservation reports sent to the client, exactly as they received them.
      </p>
      ${this._error ? html`<div class="error" role="alert">${this._error}</div>` : ""}
      ${this._renderBody()}
    `;
  }
}

customElements.define("reports-panel", ReportsPanel);

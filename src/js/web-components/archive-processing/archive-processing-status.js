import { LitElement, html, css } from "lit";
import "@material/web/progress/circular-progress.js";
import "@material/web/progress/linear-progress.js";

const STATUS_CONFIG = {
  pending: {
    label: "Queued",
    description: "Job queued and awaiting processing.",
    tone: "pending",
    icon: "mdi-calendar-clock",
  },
  processing: {
    label: "Processing",
    description: "Job is currently being processed.",
    tone: "processing",
    icon: "mdi-progress-clock",
  },
  completed: {
    label: "Completed",
    description: "Job completed successfully.",
    tone: "completed",
    icon: "mdi-check-decagram",
  },
  failed: {
    label: "Failed",
    description: "Job failed. Review the error details below.",
    tone: "failed",
    icon: "mdi-alert-circle",
  },
};

const TERMINAL_STATUSES = new Set(["completed", "failed"]);

export class ArchiveProcessingStatus extends LitElement {
  static properties = {
    sourceUri: { type: String, attribute: "source-uri" },
    job: { type: Object, state: true },
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
  };

  constructor() {
    super();
    this.sourceUri = "";
    this.job = null;
    this.loading = true;
    this.error = "";
  }

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      width: 100%;
      color: var(--md-sys-color-on-surface);
      font-family: "Google Sans", "Roboto", "Segoe UI", sans-serif;
    }

    .card {
      background: var(--md-sys-color-surface-4);
      border-radius: 20px;
      padding: 24px;
      border: 1px solid var(--md-sys-color-outline-variant);
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-width: 420px;
      max-width: 560px;
      max-height: 70vh;
      overflow-y: auto;
      overflow-x: hidden;
      box-sizing: border-box;
    }

    .header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }

    .title-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .title-group h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      color: var(--md-sys-color-on-surface);
    }

    .title-group p {
      margin: 0;
      font-size: 0.95rem;
      color: var(--md-sys-color-on-surface-variant);
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.9rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      border: 1px solid transparent;
    }

    .status-chip .mdi {
      font-size: 20px;
    }

    .status-chip.pending {
      color: var(--md-sys-color-on-primary-container);
      background: var(--md-sys-color-primary-container);
      border-color: var(--md-sys-color-primary-container);
    }

    .status-chip.processing {
      color: var(--md-sys-color-on-secondary-container);
      background: var(--md-sys-color-secondary-container);
      border-color: var(--md-sys-color-secondary-container);
    }

    .status-chip.completed {
      color: var(--md-sys-color-on-tertiary-container);
      background: var(--md-sys-color-tertiary-container);
      border-color: var(--md-sys-color-tertiary-container);
    }

    .status-chip.failed {
      color: var(--md-sys-color-on-error-container);
      background: var(--md-sys-color-error-container);
      border-color: var(--md-sys-color-error-container);
    }

    .meta {
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: var(--md-sys-color-surface, rgba(255, 255, 255, 0.85));
      border-radius: 16px;
      padding: 16px;
      border: 1px solid var(--md-sys-color-outline-variant, rgba(94, 90, 113, 0.18));
    }

    .meta-label {
      font-size: 0.8rem;
      text-transform: uppercase;
      font-weight: 600;
      color: var(--md-sys-color-on-surface-variant);
      letter-spacing: 0.08em;
    }

    code {
      display: block;
      padding: 10px 12px;
      border-radius: 12px;
      background: var(--md-sys-color-surface-1);
      font-size: 0.9rem;
      color: var(--md-sys-color-on-surface);
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
    }

    .detail {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .detail dt {
      margin: 0;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant);
      letter-spacing: 0.08em;
    }

    .detail dd {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      display: flex;
      align-items: flex-start;
      min-width: 0;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .truncate {
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .progress-region {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: 16px;
      background: var(--md-sys-color-surface-2);
      border: 1px solid var(--md-sys-color-outline);
      color: var(--md-sys-color-on-surface);
    }

    .progress-region.pending {
      background: var(--md-sys-color-primary-container);
      border-color: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }

    .progress-region.processing {
      background: var(--md-sys-color-secondary-container);
      border-color: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
    }

    .progress-region.completed {
      background: var(--md-sys-color-tertiary-container);
      border-color: var(--md-sys-color-tertiary-container);
      color: var(--md-sys-color-on-tertiary-container);
    }

    .progress-region.failed {
      background: var(--md-sys-color-error-container);
      border-color: var(--md-sys-color-error-container);
      color: var(--md-sys-color-on-error-container);
    }

    .progress-copy {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .progress-copy strong {
      font-size: 0.95rem;
      font-weight: 600;
    }

    .progress-copy span {
      font-size: 0.85rem;
      color: inherit;
      opacity: 0.8;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .resource-links {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .resource-links .link-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 12px;
      background: var(--md-sys-color-surface-1);
      border: 1px solid var(--md-sys-color-outline);
      font-size: 0.92rem;
      color: var(--md-sys-color-on-surface);
    }
    .resource-links .wrap-path {
      display: inline-block;
      word-break: break-word;
      overflow-wrap: anywhere;
      flex: 1 1 auto;
    }

    .resource-links .link-row .mdi {
      font-size: 20px;
      color: currentColor;
    }

    .error-block {
      background: var(--md-sys-color-error-container);
      border: 1px solid var(--md-sys-color-error-container);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      gap: 12px;
      color: var(--md-sys-color-on-error-container);
    }

    .error-block .mdi {
      font-size: 24px;
      color: inherit;
    }

    .error-copy {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .error-copy strong {
      font-size: 0.95rem;
    }
    .error-copy span {
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .empty {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: center;
      padding: 32px;
      border-radius: 16px;
      border: 1px dashed var(--md-sys-color-outline);
      color: var(--md-sys-color-on-surface);
      background: var(--md-sys-color-surface-1);
    }

    .empty .mdi {
      font-size: 22px;
      color: inherit;
    }
  `;

  render() {
    return html`
      <div class="card">
        ${this._renderHeader()}
        ${this._renderSource()}
        ${this._renderProgress()}
        ${this._renderDetails()}
        ${this._renderLinks()}
        ${this._renderError()}
      </div>
    `;
  }

  _renderHeader() {
    const status = this.job?.status;
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const tone = config.tone;

    return html`
      <div class="header">
        <div class="title-group">
          <h2>Archive Processing</h2>
          <p>We will continue processing even if you close this window.</p>
        </div>
        <span class="status-chip ${tone}">
          <span class="mdi ${config.icon}"></span>
          ${config.label}
        </span>
      </div>
    `;
  }

  _renderSource() {
    return html`
      <section class="meta">
        <span class="meta-label">Source</span>
        <code>${this.sourceUri || "—"}</code>
      </section>
    `;
  }

  _renderProgress() {
    const status = this.job?.status;
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const tone = config.tone;
    const description = config.description;
    const isTerminal = TERMINAL_STATUSES.has(status);

    return html`
      <section class="progress-region ${tone}">
        ${this._renderProgressIndicator(status, isTerminal)}
        <div class="progress-copy">
          <strong>${config.label}</strong>
          <span>${description}</span>
        </div>
      </section>
    `;
  }

  _renderProgressIndicator(status, isTerminal) {
    if (this.loading && !isTerminal) {
      return html`<md-circular-progress indeterminate density="-4"></md-circular-progress>`;
    }

    if (!status || (!isTerminal && !this.loading)) {
      return html`<md-linear-progress indeterminate></md-linear-progress>`;
    }

    if (status === "completed") {
      return html`<span class="mdi mdi-check-circle" style="color: var(--md-sys-color-on-tertiary-container); font-size: 28px;"></span>`;
    }

    if (status === "failed") {
      return html`<span class="mdi mdi-alert-circle" style="color: var(--md-sys-color-on-error-container); font-size: 28px;"></span>`;
    }

    return html`<md-circular-progress indeterminate density="-4"></md-circular-progress>`;
  }

  _renderDetails() {
    const job = this.job;
    const status = job?.status;
    const jobId = job?.jobId || "";

    return html`
      <section class="details-grid">
        <div class="detail">
          <dt>Status</dt>
          <dd>${STATUS_CONFIG[status]?.description ?? "Awaiting update"}</dd>
        </div>
        <div class="detail">
          <dt>Job ID</dt>
          <dd>${jobId ? html`<span class="truncate" title="${jobId}">${jobId}</span>` : "—"}</dd>
        </div>
      </section>
    `;
  }

  _renderLinks() {
    const job = this.job || {};
    const output = job.outputPath;
    const manifest = job.manifestPath;

    if (!output && !manifest) {
      if (this.loading || !this.job) {
        return null;
      }
      return html`
        <div class="empty">
          <span class="mdi mdi-progress-clock"></span>
          <span>No manifest or output paths available yet.</span>
        </div>
      `;
    }

    return html`
      <section class="resource-links">
        ${output
          ? html`
              <div class="link-row">
                <span class="mdi mdi-folder-outline"></span>
                <span class="wrap-path"><strong>Output directory:</strong> ${output}</span>
              </div>
            `
          : ""}
        ${manifest
          ? html`
              <div class="link-row">
                <span class="mdi mdi-file-document-outline"></span>
                <span class="wrap-path"><strong>Manifest:</strong> ${manifest}</span>
              </div>
            `
          : ""}
      </section>
    `;
  }

  _renderError() {
    const message = this.error || this.job?.error;
    if (!message) {
      return null;
    }

    return html`
      <section class="error-block">
        <span class="mdi mdi-alert"></span>
        <div class="error-copy">
          <strong>Processing error</strong>
          <span>${message}</span>
        </div>
      </section>
    `;
  }

}

customElements.define("archive-processing-status", ArchiveProcessingStatus);





























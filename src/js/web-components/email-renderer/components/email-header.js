import { LitElement, html, css } from 'lit';
import { formatFullDate } from '../utils/dateFormat.js';
import { chevronUpIcon, chevronDownIcon, folderIcon } from "../../utils/icons.js";

export class EmailHeader extends LitElement {
  static properties = {
    email: { type: Object },
    showFullHeaders: { type: Boolean, state: true }
  };

  constructor() {
    super();
    this.email = null;
    this.showFullHeaders = false;
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .email-subject {
      margin: 0;
      font-size: 26px;
      font-weight: 700;
      line-height: 1.3;
      color: var(--md-sys-color-on-surface);
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .header-top {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      min-width: 0;
    }

    .sender-block {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .sender-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }

    .sender-email {
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }

    .sent-date {
      font-size: 13px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: minmax(120px, 160px) minmax(0, 1fr);
      gap: 12px 16px;
      padding: 16px;
      border-radius: 16px;
      background: var(--md-sys-color-surface);
      border: 1px solid var(--md-sys-color-outline-variant);
    }

    .label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--md-sys-color-on-surface-variant);
      font-weight: 600;
    }

    .value {
      font-size: 13px;
      color: var(--md-sys-color-on-surface);
      line-height: 1.5;
      min-width: 0;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .value.empty {
      color: var(--md-sys-color-on-surface-variant);
      opacity: 0.7;
    }

    .recipients {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      min-width: 0;
    }

    .recipient-chip {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 12px;
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface);
      font-size: 12px;
      max-width: 100%;
      white-space: normal;
      overflow-wrap: anywhere;
    }

    .folder-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 999px;
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      font-size: 13px;
      font-weight: 600;
    }

    .folder-chip svg {
      width: 18px !important;
      height: 18px !important;
      fill: currentColor;
    }

    .code {
      font-family: 'Roboto Mono', 'Courier New', monospace;
      font-size: 12px;
      word-break: break-all;
      color: var(--md-sys-color-on-surface-variant);
      overflow-wrap: anywhere;
    }

    .metadata-toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      align-self: flex-start;
      border-radius: 999px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface-variant);
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
    }

    .metadata-toggle:hover {
      border-color: var(--md-sys-color-primary);
      color: var(--md-sys-color-primary);
    }

    .metadata-toggle:focus-visible {
      outline: 2px solid var(--md-sys-color-primary);
      outline-offset: 2px;
    }

    .metadata-toggle .icon svg {
      width: 18px !important;
      height: 18px !important;
      fill: currentColor;
    }

    .full-headers {
      border-radius: 16px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface);
      padding: 16px;
      font-family: 'Roboto Mono', 'Courier New', monospace;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
      overflow-x: auto;
      white-space: pre-wrap;
    }
  `;

  _formatRecipient(recipient) {
    if (recipient.name) {
      return `${recipient.name} <${recipient.email}>`;
    }
    return recipient.email;
  }

  _renderRecipientValue(recipients) {
    if (!recipients || recipients.length === 0) {
      return html`<span class="value empty">None</span>`;
    }
    return html`
      <div class="value recipients">
        ${recipients.map(recipient => html`<span class="recipient-chip">${this._formatRecipient(recipient)}</span>`)}
      </div>
    `;
  }

  _getFolderLabel() {
    if (!this.email) {
      return null;
    }
    return this.email.pstFolderBreadcrumb || this.email.pstFolderDisplay || this.email.pstFolder || null;
  }

  render() {
    if (!this.email) {
      return html``;
    }

    const folderLabel = this._getFolderLabel();

    return html`
      <h1 class="email-subject">${this.email.subject || '(No Subject)'}</h1>

      <div class="header-top">
        <div class="sender-block">
          <span class="sender-name">${this.email.from?.name || this.email.from?.email || 'Unknown sender'}</span>
          <span class="sender-email">${this.email.from?.email || ''}</span>
        </div>
        <span class="sent-date">${formatFullDate(this.email.date)}</span>
      </div>

      <div class="meta-grid">
        <span class="label">To</span>
        ${this._renderRecipientValue(this.email.to)}

        ${this.email.cc && this.email.cc.length > 0 ? html`
          <span class="label">Cc</span>
          ${this._renderRecipientValue(this.email.cc)}
        ` : ''}

        ${this.email.bcc && this.email.bcc.length > 0 ? html`
          <span class="label">Bcc</span>
          ${this._renderRecipientValue(this.email.bcc)}
        ` : ''}

        ${this.email.replyTo ? html`
          <span class="label">Reply-To</span>
          <span class="value">${this._formatRecipient(this.email.replyTo)}</span>
        ` : ''}

        ${folderLabel ? html`
          <span class="label">Folder</span>
          <span class="value">
            <span class="folder-chip" title=${folderLabel}>
              ${folderIcon}
              <span>${folderLabel}</span>
            </span>
          </span>
        ` : ''}

        <span class="label">Message ID</span>
        <span class="value code">${this.email.messageId || 'Unavailable'}</span>
      </div>

      <button
        class="metadata-toggle"
        @click=${() => this.showFullHeaders = !this.showFullHeaders}
        type="button"
      >
        ${this.showFullHeaders ? 'Hide headers' : 'Show headers'}
        <span class="icon">${this.showFullHeaders ? chevronUpIcon : chevronDownIcon}</span>
      </button>

      ${this.showFullHeaders ? html`
        <pre class="full-headers">${JSON.stringify(this.email.headers || {
          'Message-ID': this.email.messageId,
          'In-Reply-To': this.email.inReplyTo,
          'References': this.email.references
        }, null, 2)}</pre>
      ` : ''}
    `;
  }
}

customElements.define('email-header', EmailHeader);

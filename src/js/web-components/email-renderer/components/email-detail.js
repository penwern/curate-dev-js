import { LitElement, html, css } from 'lit';
import './email-header.js';
import './email-body.js';
import './attachment-list.js';
import { emailOutlineIcon, chevronDownIcon, chevronRightIcon, attachmentIcon, folderIcon } from "../../utils/icons.js";
import { formatEmailDate } from '../utils/dateFormat.js';

export class EmailDetail extends LitElement {
  static properties = {
    email: { type: Object },
    emailBody: { type: Object },
    threadEmails: { type: Array },
    threadBodies: { type: Object },
    selectedEmailId: { type: String },
    collapsedMessages: { type: Set, state: true }
  };

  constructor() {
    super();
    this.email = null;
    this.emailBody = null;
    this.threadEmails = null;
    this.threadBodies = null;
    this.selectedEmailId = null;
    this.collapsedMessages = new Set();
    this._lastHighlightedId = null;
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
      background: var(--md-sys-color-surface);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--md-sys-color-on-surface-variant);
      gap: 20px;
      background: var(--md-sys-color-surface);
      text-align: center;
    }

    .empty-state .icon svg {
      width: 60px !important;
      height: 60px !important;
      fill: var(--md-sys-color-primary);
      opacity: 0.4;
    }

    .empty-state p {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      letter-spacing: 0.01em;
    }

    .email-content {
      width: min(960px, 100%);
      margin: 0 auto;
      padding: 24px 20px 32px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .email-card {
      border-radius: 20px;
      background: var(--md-sys-color-surface-1);
      border: 1px solid var(--md-sys-color-outline-variant);
      padding: 28px 32px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .thread-header-banner {
      border-radius: 16px;
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      padding: 14px 20px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .thread-stack {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .thread-message {
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 18px;
      overflow: hidden;
      background: var(--md-sys-color-surface);
      transition: border-color 0.2s ease, background 0.2s ease;
    }

    .thread-message.highlighted {
      border-color: var(--md-sys-color-primary);
      background: var(--md-sys-color-surface-2);
    }

    .thread-message.thread-root {
      border: none;
      border-radius: 0;
      background: transparent;
      overflow: visible;
    }

    .thread-message.thread-root.highlighted {
      background: transparent;
    }

    .thread-message.thread-root .email-card {
      transition: border-color 0.2s ease, background 0.2s ease;
    }

    .thread-message.thread-root.highlighted .email-card {
      border-color: var(--md-sys-color-primary);
      background: var(--md-sys-color-surface-2);
    }

    .message-toggle {
      width: 100%;
      border: none;
      background: transparent;
      padding: 18px 24px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      cursor: pointer;
      text-align: left;
      color: inherit;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      transition: background 0.2s ease;
    }

    .message-toggle:hover {
      background: var(--md-sys-color-surface-1);
    }

    .message-toggle:focus-visible {
      outline: 2px solid var(--md-sys-color-primary);
      outline-offset: 2px;
      border-radius: 16px;
    }

    .message-toggle .chevron {
      width: 18px;
      height: 18px;
      color: var(--md-sys-color-on-surface-variant);
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .message-toggle .chevron svg {
      width: 100% !important;
      height: 100% !important;
    }

    .toggle-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .toggle-from {
      font-size: 14px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }

    .toggle-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
    }

    .toggle-preview {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-top: 6px;
    }

    .toggle-indicators {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--md-sys-color-on-surface-variant);
    }

    .toggle-indicators .icon svg {
      width: 18px !important;
      height: 18px !important;
      fill: currentColor;
    }

    .thread-message-body {
      padding: 20px 24px 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      background: var(--md-sys-color-surface);
    }

    .thread-meta-panel {
      margin: 16px 16px 16px;
      padding: 12px 16px;
      border-radius: 14px;
      background: var(--md-sys-color-surface-1);
      border: 1px solid var(--md-sys-color-outline-variant);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .thread-meta-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .thread-meta-label {
      flex: 0 0 64px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--md-sys-color-on-surface-variant);
    }

    .thread-meta-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .thread-folder-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 12px;
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      font-weight: 600;
      font-size: 12px;
    }

    .thread-folder-pill svg {
      width: 16px !important;
      height: 16px !important;
      fill: currentColor;
    }

    .thread-chip {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface);
      font-size: 12px;
      font-weight: 500;
    }attachment-list {
      margin-top: 4px;
    }

    @media (max-width: 900px) {
      .email-content {
        padding: 24px 20px 32px;
      }

      .email-card {
        padding: 22px 20px;
      }

      .message-toggle {
        padding: 16px 20px;
      }

      .thread-message-body {
        padding: 18px 20px 20px;
      }      
      .thread-meta-panel {       
        margin: 14px 14px 14px;
      }
    }
  `;

  _toggleMessageCollapse(emailId) {
    const updated = new Set(this.collapsedMessages);
    if (updated.has(emailId)) {
      updated.delete(emailId);
    } else {
      updated.add(emailId);
    }
    this.collapsedMessages = updated;
  }

  _formatRecipient(recipient) {
    if (!recipient) {
      return '';
    }
    if (recipient.name && recipient.email) {
      return `${recipient.name} <${recipient.email}>`;
    }
    return recipient.email || recipient.name || '';
  }

  _renderRecipientChips(recipients) {
    const safeRecipients = Array.isArray(recipients)
      ? recipients.filter(Boolean)
      : [];

    if (safeRecipients.length === 0) {
      return null;
    }

    return html`
      <div class="thread-meta-chips">
        ${safeRecipients.map(recipient => html`<span class="thread-chip">${this._formatRecipient(recipient)}</span>`)}
      </div>
    `;
  }

  _renderThreadMeta(email) {
    if (!email) {
      return null;
    }

    const rows = [];

    const addRow = (label, recipients) => {
      const chips = this._renderRecipientChips(recipients);
      if (!chips) {
        return;
      }
      rows.push(html`
        <div class="thread-meta-row">
          <span class="thread-meta-label">${label}</span>
          ${chips}
        </div>
      `);
    };

    addRow('To', email.to);
    addRow('Cc', email.cc);
    addRow('Bcc', email.bcc);

    if (email.replyTo) {
      const replyRecipients = Array.isArray(email.replyTo) ? email.replyTo : [email.replyTo];
      addRow('Reply', replyRecipients);
    }

    if (email.pstFolder || email.pstFolderDisplay) {
      const folderLabel = email.pstFolderBreadcrumb || email.pstFolderDisplay || email.pstFolder;
      rows.push(html`
        <div class="thread-meta-row">
          <span class="thread-meta-label">Folder</span>
          <div class="thread-meta-chips">
            <span class="thread-folder-pill">
              ${folderIcon}
              <span>${folderLabel}</span>
            </span>
          </div>
        </div>
      `);
    }

    return rows.length > 0
      ? html`<div class="thread-meta-panel">${rows}</div>`
      : null;
  }
  _formatRecipients(recipients) {
    if (!recipients || recipients.length === 0) {
      return 'No recipients';
    }
    return recipients.map(recipient => recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email).join(', ');
  }

  _getTextPreview(body) {
    if (!body) {
      return '';
    }
    if (body.text) {
      return body.text.trim().slice(0, 160);
    }
    if (body.html) {
      const stripped = body.html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      return stripped.slice(0, 160);
    }
    return '';
  }

  updated(changedProperties) {
    if (changedProperties.has('threadEmails')) {
      this._lastHighlightedId = null;
    }

    if (changedProperties.has('selectedEmailId')) {
      this._scrollSelectedMessageIntoView();
    }
  }

  _scrollSelectedMessageIntoView() {
    if (!this.selectedEmailId || this._lastHighlightedId === this.selectedEmailId) {
      return;
    }

    this.updateComplete.then(() => {
      const target = this.renderRoot?.querySelector(
        `[data-thread-message="${this.selectedEmailId}"]`
      );
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        this._lastHighlightedId = this.selectedEmailId;
      }
    });
  }

  render() {
    if (!this.email) {
      return html`
        <div class="empty-state">
          <div class="icon">${emailOutlineIcon}</div>
          <p>Select an email to begin.</p>
        </div>
      `;
    }

    if (this.threadEmails && this.threadEmails.length > 1) {
      return html`
        <div class="email-content">
          <div class="thread-header-banner">
            <span>Conversation overview</span>
            <span>${this.threadEmails.length} messages</span>
          </div>
          <div class="thread-stack">
            ${this.threadEmails.map((threadEmail, index) => {
              const body = this.threadBodies ? this.threadBodies[threadEmail.id] : null;
              const regularAttachments = threadEmail.attachments
                ? threadEmail.attachments.filter(att => !att.inline)
                : [];
              const isSelected = threadEmail.id === this.selectedEmailId;
              const isCollapsed = this.collapsedMessages.has(threadEmail.id);
              const isFirst = index === 0;

              if (isCollapsed) {
                return html`
                  <article
                    class="thread-message ${isSelected ? 'highlighted' : ''}"
                    data-thread-message=${threadEmail.id}
                  >
                    <button class="message-toggle" type="button" @click=${() => this._toggleMessageCollapse(threadEmail.id)}>
                      <span class="chevron">${chevronRightIcon}</span>
                      <div class="toggle-content">
                        <span class="toggle-from">${threadEmail.from.name || threadEmail.from.email}</span>
                        <div class="toggle-meta">
                          <span>To: ${this._formatRecipients(threadEmail.to)}</span>
                          <span>${formatEmailDate(threadEmail.date)}</span>
                        </div>
                        <div class="toggle-preview">${this._getTextPreview(body)}</div>
                      </div>
                      <div class="toggle-indicators">
                        ${regularAttachments.length > 0 ? html`<span class="icon">${attachmentIcon}</span>` : ''}
                      </div>
                    </button>
                  </article>
                `;
              }

              return html`
                <article
                  class="thread-message ${isSelected ? 'highlighted' : ''} ${isFirst ? 'thread-root' : ''}"
                  data-thread-message=${threadEmail.id}
                >
                  ${isFirst ? html`
                    <div class="email-card">
                      <email-header .email=${threadEmail}></email-header>
                      ${regularAttachments.length > 0 ? html`
                        <attachment-list .attachments=${regularAttachments}></attachment-list>
                      ` : ''}
                      <email-body
                        .htmlContent=${body?.html || ''}
                        .textContent=${body?.text || ''}
                        .attachments=${threadEmail.attachments || []}
                        .hasExternalImages=${threadEmail.hasExternalImages || false}
                      ></email-body>
                    </div>
                  ` : html`
                    <button class="message-toggle" type="button" @click=${() => this._toggleMessageCollapse(threadEmail.id)}>
                      <span class="chevron">${chevronDownIcon}</span>
                      <div class="toggle-content">
                        <span class="toggle-from">${threadEmail.from.name || threadEmail.from.email}</span>
                        <div class="toggle-meta">
                          <span>To: ${this._formatRecipients(threadEmail.to)}</span>
                          <span>${formatEmailDate(threadEmail.date)}</span>
                        </div>
                      </div>
                      <div class="toggle-indicators">
                        ${regularAttachments.length > 0 ? html`<span class="icon">${attachmentIcon}</span>` : ''}
                      </div>
                    </button>
                    ${this._renderThreadMeta(threadEmail)}
                    <div class="thread-message-body">
                      ${regularAttachments.length > 0 ? html`
                        <attachment-list .attachments=${regularAttachments}></attachment-list>
                      ` : ''}
                      <email-body
                        .htmlContent=${body?.html || ''}
                        .textContent=${body?.text || ''}
                        .attachments=${threadEmail.attachments || []}
                        .hasExternalImages=${threadEmail.hasExternalImages || false}
                      ></email-body>
                    </div>
                  `}
                </article>
              `;
            })}
          </div>
        </div>
      `;
    }

    const regularAttachments = this.email.attachments
      ? this.email.attachments.filter(att => !att.inline)
      : [];

    return html`
      <div class="email-content">
        <div class="email-card">
          <email-header .email=${this.email}></email-header>
          ${regularAttachments.length > 0 ? html`
            <attachment-list .attachments=${regularAttachments}></attachment-list>
          ` : ''}
          <email-body
            .htmlContent=${this.emailBody?.html || ''}
            .textContent=${this.emailBody?.text || ''}
            .attachments=${this.email.attachments || []}
            .hasExternalImages=${this.email.hasExternalImages || false}
          ></email-body>
        </div>
      </div>
    `;
  }
}

customElements.define('email-detail', EmailDetail);

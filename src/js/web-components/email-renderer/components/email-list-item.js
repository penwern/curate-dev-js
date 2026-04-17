import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { formatEmailDate } from '../utils/dateFormat.js';
import { attachmentIcon, forumIcon, folderIcon, deleteIcon } from "../../utils/icons.js";

export class EmailListItem extends LitElement {
  static properties = {
    email: { type: Object },
    selected: { type: Boolean },
    threadCount: { type: Number },
    isInThread: { type: Boolean },
    threadIndex: { type: Number },
    isCollapsedPreview: { type: Boolean },
    canDelete: { type: Boolean },
    _confirming: { type: Boolean, state: true }
  };

  constructor() {
    super();
    this.email = null;
    this.selected = false;
    this.threadCount = 1;
    this.isInThread = false;
    this.threadIndex = 0;
    this.isCollapsedPreview = false;
    this.canDelete = false;
    this._confirming = false;
  }

  static styles = css`
    :host {
      display: block;
    }

    .email-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 14px 18px;
      border-radius: 14px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
    }

    .email-item:hover {
      background: var(--md-sys-color-surface-variant);
      border-color: var(--md-sys-color-outline);
    }

    .email-item.selected {
      border-color: var(--md-sys-color-primary);
      background: var(--md-sys-color-surface-2);
    }

    .email-item.thread {
      margin-left: 14px;
      border-left: 3px solid var(--md-sys-color-outline);
      padding-left: 22px;
    }

    .email-item.thread.selected {
      border-left-color: var(--md-sys-color-primary);
    }

    .email-item.collapsed-preview {
      opacity: 0.85;
    }

    .email-item:focus-visible {
      outline: 2px solid var(--md-sys-color-primary);
      outline-offset: 2px;
    }

    .item-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
    }

    .sender {
      font-size: 14px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .timestamp {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
      flex-shrink: 0;
    }

    .item-subject {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      overflow: hidden;
    }

    .item-subject .subject {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    .thread-pill {
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      font-size: 11px;
      font-weight: 600;
    }

    .item-snippet {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .item-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant);
      max-width: 100%;
    }

    .meta-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 999px;
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface);
      font-weight: 500;
      max-width: 100%;
    }

    .meta-pill svg {
      width: 14px !important;
      height: 14px !important;
      fill: currentColor;
    }

    .meta-pill.folder {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      min-width: 0;
    }

    .meta-pill.folder .folder-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 200px;
    }

    .item-delete-btn {
      flex-shrink: 0;
      border: none;
      background: transparent;
      color: var(--md-sys-color-on-surface-variant);
      opacity: 0;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      cursor: pointer;
      transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease;
    }

    .item-delete-btn .icon {
      width: 16px;
      height: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .item-delete-btn .icon svg {
      width: 100% !important;
      height: 100% !important;
      fill: currentColor;
    }

    .email-item:hover .item-delete-btn,
    .email-item:focus-within .item-delete-btn,
    .item-delete-btn:focus-visible {
      opacity: 1;
    }

    .item-delete-btn:hover {
      background: color-mix(in srgb, var(--md-sys-color-error) 12%, transparent);
      color: var(--md-sys-color-error);
    }

    .item-delete-btn:focus-visible {
      outline: 2px solid var(--md-sys-color-error);
      outline-offset: 2px;
    }

    .item-confirm-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 8px;
      padding-top: 4px;
    }

    .item-confirm-label {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant);
      flex: 1 1 100%;
    }

    .item-confirm-yes {
      border: none;
      border-radius: 999px;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
      background: var(--md-sys-color-error);
      color: var(--md-sys-color-on-error);
      cursor: pointer;
      transition: opacity 0.15s ease;
    }

    .item-confirm-yes:hover {
      opacity: 0.88;
    }

    .item-confirm-no {
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 999px;
      background: transparent;
      color: var(--md-sys-color-on-surface-variant);
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
      cursor: pointer;
      transition: border-color 0.15s ease, color 0.15s ease;
    }

    .item-confirm-no:hover {
      border-color: var(--md-sys-color-outline);
      color: var(--md-sys-color-on-surface);
    }

    .email-item.deleted {
      opacity: 0.5;
      cursor: default;
      pointer-events: none;
      background: color-mix(in srgb, var(--md-sys-color-surface-variant) 40%, transparent);
    }

    .deleted-label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-style: italic;
      color: var(--md-sys-color-on-surface-variant);
    }

    .deleted-label .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
    }

    .deleted-label .icon svg {
      width: 100% !important;
      height: 100% !important;
      fill: currentColor;
    }
  `;

  _handleDeleteClick(event) {
    event.stopPropagation();
    this._confirming = true;
  }

  _handleConfirmDelete(event) {
    event.stopPropagation();
    this._confirming = false;
    this.dispatchEvent(new CustomEvent('email-delete-request', {
      detail: { emailId: this.email.id, folder: this.email.folder },
      bubbles: true,
      composed: true
    }));
  }

  _handleCancelDelete(event) {
    event.stopPropagation();
    this._confirming = false;
  }

  _handleClick() {
    this._emitSelection();
  }

  _handleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this._emitSelection();
    }
  }

  _emitSelection() {
    this.dispatchEvent(new CustomEvent('email-selected', {
      detail: this.email.id,
      bubbles: true,
      composed: true
    }));
  }

  render() {
    if (!this.email) {
      return html``;
    }

    if (this.email.deleted) {
      const classes = {
        'email-item': true,
        deleted: true,
        thread: this.isInThread
      };
      return html`
        <article class=${classMap(classes)} role="listitem" aria-label="Deleted email">
          <span class="deleted-label">
            <span class="icon">${deleteIcon}</span>
            This email has been permanently removed.
          </span>
        </article>
      `;
    }

    const classes = {
      'email-item': true,
      selected: this.selected,
      thread: this.isInThread,
      'collapsed-preview': this.isCollapsedPreview && this.threadIndex === 0
    };

    const sender = this.email.from?.name || this.email.from?.email || 'Unknown sender';
    const subject = this.email.subject || '(No subject)';
    const folderLabel = this.email.pstFolderBreadcrumb || this.email.pstFolderDisplay || this.email.pstFolder || '';

    return html`
      <article
        class=${classMap(classes)}
        role="listitem"
        tabindex="0"
        aria-selected=${String(this.selected)}
        @click=${this._handleClick}
        @keydown=${this._handleKeydown}
      >
        <div class="item-header">
          <span class="sender">${sender}</span>
          <span class="timestamp">${formatEmailDate(this.email.date)}</span>
          ${this.canDelete ? html`
            <button
              class="item-delete-btn"
              type="button"
              title="Delete this email"
              @click=${this._handleDeleteClick}
            >
              <span class="icon">${deleteIcon}</span>
            </button>
          ` : ''}
        </div>
        <div class="item-subject">
          <span class="subject">${subject}</span>
          ${this.threadCount > 1 && this.threadIndex === 0 ? html`
            <span class="thread-pill">${this.threadCount}</span>
          ` : ''}
        </div>
        <div class="item-snippet">${this.email.snippet}</div>
        <div class="item-meta">
          ${this.threadCount > 1 && this.threadIndex === 0 ? html`
            <span class="meta-pill">${forumIcon}<span>Conversation</span></span>
          ` : ''}
          ${this.email.hasAttachments ? html`
            <span class="meta-pill">${attachmentIcon}<span>Attachments</span></span>
          ` : ''}
          ${folderLabel ? html`
            <span class="meta-pill folder" title=${folderLabel}>
              ${folderIcon}
              <span class="folder-label">${folderLabel}</span>
            </span>
          ` : ''}
        </div>
        ${this._confirming ? html`
          <div class="item-confirm-row" @click=${(e) => e.stopPropagation()}>
            <span class="item-confirm-label">Permanently delete?</span>
            <button class="item-confirm-yes" type="button" @click=${this._handleConfirmDelete}>Delete</button>
            <button class="item-confirm-no" type="button" @click=${this._handleCancelDelete}>Cancel</button>
          </div>
        ` : ''}
      </article>
    `;
  }
}

customElements.define('email-list-item', EmailListItem);

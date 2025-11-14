import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { formatEmailDate } from '../utils/dateFormat.js';
import { attachmentIcon, forumIcon, folderIcon } from "../../utils/icons.js";

export class EmailListItem extends LitElement {
  static properties = {
    email: { type: Object },
    selected: { type: Boolean },
    threadCount: { type: Number },
    isInThread: { type: Boolean },
    threadIndex: { type: Number },
    isCollapsedPreview: { type: Boolean }
  };

  constructor() {
    super();
    this.email = null;
    this.selected = false;
    this.threadCount = 1;
    this.isInThread = false;
    this.threadIndex = 0;
    this.isCollapsedPreview = false;
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
    }

    .meta-pill svg {
      width: 14px !important;
      height: 14px !important;
      fill: currentColor;
    }

    .meta-pill.folder {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }
  `;

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
            <span class="meta-pill folder">
              ${folderIcon}
              <span>${folderLabel}</span>
            </span>
          ` : ''}
        </div>
      </article>
    `;
  }
}

customElements.define('email-list-item', EmailListItem);

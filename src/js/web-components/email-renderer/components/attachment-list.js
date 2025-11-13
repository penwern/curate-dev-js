import { LitElement, html, css } from 'lit';
import { attachmentIcon, downloadIcon } from "../../utils/icons.js";
import { getAttachment } from '../data/dataService.js';

export class AttachmentList extends LitElement {
  static properties = {
    attachments: { type: Array }
  };

  static styles = css`
    :host {
      display: block;
    }

    .attachments {
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 16px;
      padding: 16px 18px;
      background: var(--md-sys-color-surface);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .attachments-header {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      font-size: 15px;
      color: var(--md-sys-color-on-surface);
    }

    .attachments-header .icon {
      width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--md-sys-color-primary);
    }

    .attachments-header .icon svg {
      width: 100% !important;
      height: 100% !important;
      fill: currentColor;
    }

    .attachment-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface-1);
      cursor: pointer;
      transition: border-color 0.2s ease, background 0.2s ease;
    }

    .attachment-item:hover {
      border-color: var(--md-sys-color-primary);
      background: var(--md-sys-color-surface-2);
    }

    .attachment-icon {
      width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--md-sys-color-on-surface-variant);
      flex-shrink: 0;
    }

    .attachment-icon svg,
    .download-icon svg {
      width: 100% !important;
      height: 100% !important;
      fill: currentColor;
    }

    .attachment-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .filename {
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .meta {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
      display: flex;
      gap: 10px;
    }

    .download-icon {
      width: 22px;
      height: 22px;
      color: var(--md-sys-color-primary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
  `;

  async _download(attachment) {
    try {
      const url = await getAttachment(attachment.path);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = attachment.filename;
      anchor.click();
      if (typeof url === 'string' && url.startsWith('blob:')) {
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    } catch (error) {
      console.error('Failed to download attachment:', error);
    }
  }

  _formatBytes(bytes) {
    if (!bytes || bytes === 0) {
      return '0 B';
    }
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  render() {
    if (!this.attachments || this.attachments.length === 0) {
      return html``;
    }

    return html`
      <div class="attachments">
        <div class="attachments-header">
          <span class="icon">${attachmentIcon}</span>
          <span>Attachments (${this.attachments.length})</span>
        </div>
        ${this.attachments.map(att => html`
          <div class="attachment-item" @click=${() => this._download(att)}>
            <span class="attachment-icon">${attachmentIcon}</span>
            <div class="attachment-info">
              <span class="filename">${att.filename}</span>
              <div class="meta">
                <span>${att.mimeType || 'Unknown type'}</span>
                <span>${this._formatBytes(att.size)}</span>
              </div>
            </div>
            <span class="download-icon">${downloadIcon}</span>
          </div>
        `)}
      </div>
    `;
  }
}

customElements.define('attachment-list', AttachmentList);

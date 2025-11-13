import { LitElement, html, css } from 'lit';
import DOMPurify from 'dompurify';
import { resolveInlineImage } from '../data/dataService.js';
import { imageIcon } from "../../utils/icons.js";

export class EmailBody extends LitElement {
  static properties = {
    htmlContent: { type: String },
    textContent: { type: String },
    attachments: { type: Array },
    hasExternalImages: { type: Boolean },
    showExternalImages: { type: Boolean, state: true }
  };

  constructor() {
    super();
    this.htmlContent = '';
    this.textContent = '';
    this.attachments = [];
    this.hasExternalImages = false;
    this.showExternalImages = true;
  }

  static styles = css`
    :host {
      display: block;
    }

    .external-images-warning {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      margin-bottom: 16px;
      border-radius: 16px;
      background: var(--md-sys-color-primary-container);
      border: 1px solid var(--md-sys-color-outline-variant);
      color: var(--md-sys-color-on-primary-container);
      font-size: 14px;
    }

    .external-images-warning .icon {
      width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .external-images-warning .icon svg {
      width: 100% !important;
      height: 100% !important;
      fill: currentColor;
    }

    .external-images-warning button {
      margin-left: auto;
      padding: 8px 18px;
      border-radius: 999px;
      border: none;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .external-images-warning button:hover {
      opacity: 0.9;
    }

    .external-images-warning button:focus-visible {
      outline: 2px solid var(--md-sys-color-on-primary);
      outline-offset: 2px;
    }

    .email-body-content {
      font-size: 14px;
      line-height: 1.7;
      color: var(--md-sys-color-on-surface);
      padding: 4px;
      overflow-x: auto;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .email-body-content.plain-text {
      white-space: pre-wrap;
      font-family: 'Roboto Mono', 'Courier New', monospace;
      background: var(--md-sys-color-surface);
      border-radius: 12px;
      border: 1px solid var(--md-sys-color-outline-variant);
      padding: 18px 20px;
    }

    .email-body-content :deep(*) {
      max-width: 100%;
      box-sizing: border-box;
    }

    .email-body-content :deep(p) {
      margin-top: 0;
      margin-bottom: 1em;
    }

    .email-body-content :deep(img) {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 16px auto;
      border-radius: 12px;
    }

    .email-body-content :deep(blockquote) {
      border-left: 3px solid var(--md-sys-color-outline);
      background: var(--md-sys-color-surface-1);
      padding: 12px 16px;
      border-radius: 12px;
      color: var(--md-sys-color-on-surface-variant);
      margin: 18px 0;
    }

    .email-body-content :deep(a) {
      color: var(--md-sys-color-primary);
      text-decoration: underline;
      text-decoration-thickness: 2px;
    }

    .email-body-content :deep(pre) {
      background: var(--md-sys-color-surface-variant);
      padding: 16px;
      border-radius: 12px;
      overflow-x: auto;
      border: 1px solid var(--md-sys-color-outline-variant);
      color: var(--md-sys-color-on-surface);
      font-size: 13px;
    }

    .email-body-content :deep(code) {
      background: var(--md-sys-color-surface-variant);
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 13px;
      border: 1px solid var(--md-sys-color-outline-variant);
      color: var(--md-sys-color-on-surface);
    }

    .email-body-content :deep(table) {
      border-collapse: collapse;
      width: 100%;
      margin: 18px 0;
      font-size: 13px;
    }

    .email-body-content :deep(table th),
    .email-body-content :deep(table td) {
      border: 1px solid var(--md-sys-color-outline-variant);
      padding: 10px 12px;
      text-align: left;
    }

    .email-body-content :deep(table th) {
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface);
      font-weight: 600;
    }
  `;

  async _resolveInlineImages(htmlString) {
    if (!htmlString || !this.attachments || this.attachments.length === 0) {
      return htmlString;
    }

    const cidPattern = /src=["']cid:([^"']+)["']/g;
    let result = htmlString;
    const matches = [...htmlString.matchAll(cidPattern)];

    for (const match of matches) {
      const contentId = match[1];
      const blobUrl = await resolveInlineImage(contentId, this.attachments);
      if (blobUrl) {
        result = result.replace(match[0], `src="${blobUrl}"`);
      }
    }

    return result;
  }

  async _getSanitizedHtml() {
    if (!this.htmlContent) {
      return '';
    }

    const htmlWithImages = await this._resolveInlineImages(this.htmlContent);

    const config = {
      ALLOWED_TAGS: [
        'a', 'b', 'i', 'u', 'strong', 'em', 'p', 'br', 'div', 'span',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'img', 'hr'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'id',
        'width', 'height', 'style', 'colspan', 'rowspan'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|data|blob):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    };

    return DOMPurify.sanitize(htmlWithImages, config);
  }

  async updated(changedProperties) {
    if (changedProperties.has('hasExternalImages')) {
      this.showExternalImages = !this.hasExternalImages;
    }

    if (changedProperties.has('htmlContent') || changedProperties.has('attachments') || changedProperties.has('showExternalImages')) {
      const contentDiv = this.shadowRoot.querySelector('.email-body-content');
      if (contentDiv && this.htmlContent && this.htmlContent.trim()) {
        const sanitized = await this._getSanitizedHtml();
        contentDiv.innerHTML = sanitized;
      }
    }
  }

  render() {
    const hasHtml = this.htmlContent && this.htmlContent.trim().length > 0;
    const hasText = this.textContent && this.textContent.trim().length > 0;

    return html`
      ${this.hasExternalImages && !this.showExternalImages ? html`
        <div class="external-images-warning">
          <span class="icon">${imageIcon}</span>
          <span>External images are blocked for your privacy.</span>
          <button @click=${() => this.showExternalImages = true}>Dismiss</button>
        </div>
      ` : ''}

      ${hasHtml ? html`
        <div class="email-body-content"></div>
      ` : html`
        <div class="email-body-content plain-text">
          ${hasText ? this.textContent : 'No content available'}
        </div>
      `}
    `;
  }
}

customElements.define('email-body', EmailBody);

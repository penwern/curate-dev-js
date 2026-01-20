import { LitElement, html, css, nothing } from "lit";
import { map } from "lit/directives/map.js";
import "@material/web/icon/icon.js";
import { highlightText } from "../utils/search-helpers.js";

/**
 * Reusable card component for repositories and collections.
 */
class AsCard extends LitElement {
  static properties = {
    cardTitle: { type: String },
    code: { type: String },
    icon: { type: Object },
    meta: { type: Array },
    query: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      height: 100%;
    }

    .card {
      background: var(--md-sys-color-surface);
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 8px;
      height: 100%;
      box-sizing: border-box;
    }

    .card:hover {
      background: var(--md-sys-color-surface-1);
      border-color: var(--md-sys-color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .card-icon {
      --md-icon-size: 24px;
      color: var(--md-sys-color-primary);
      flex-shrink: 0;
    }

    .card-icon svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }

    .card-content {
      flex: 1;
    }

    .card-title {
      font-size: 15px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      line-height: 1.4;
    }

    .card-code {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
      font-family: monospace;
      margin-top: 4px;
    }

    .card-meta {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 8px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .meta-item md-icon,
    .meta-item .meta-icon {
      --md-icon-size: 14px;
    }

    .meta-item .meta-icon svg {
      width: 14px;
      height: 14px;
      fill: currentColor;
    }

    .search-highlight {
      background: var(--md-sys-color-tertiary-container);
      color: var(--md-sys-color-on-tertiary-container);
      border-radius: 4px;
      padding: 0 2px;
      font-weight: 600;
    }
  `;

  constructor() {
    super();
    this.cardTitle = "";
    this.code = "";
    this.icon = null;
    this.meta = [];
    this.query = "";
  }

  render() {
    const displayTitle = this.query
      ? highlightText(this.cardTitle, this.query)
      : this.cardTitle;
    const displayCode = this.query ? highlightText(this.code, this.query) : this.code;

    return html`
      <div class="card" @click=${this._handleClick}>
        <div class="card-header">
          ${this.icon
            ? html`<span class="card-icon">${this.icon}</span>`
            : nothing}
          <div class="card-content">
            <div class="card-title">${displayTitle}</div>
            ${this.code
              ? html`<div class="card-code">${displayCode}</div>`
              : nothing}
          </div>
        </div>
        ${this.meta && this.meta.length
          ? html`
              <div class="card-meta">
                ${map(
                  this.meta,
                  (item) => html`
                    <div class="meta-item">
                      ${item.icon
                        ? html`<span class="meta-icon">${item.icon}</span>`
                        : nothing}
                      ${item.label}
                    </div>
                  `
                )}
              </div>
            `
          : nothing}
      </div>
    `;
  }

  _handleClick() {
    this.dispatchEvent(
      new CustomEvent("card-click", {
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("as-card", AsCard);

export { AsCard };

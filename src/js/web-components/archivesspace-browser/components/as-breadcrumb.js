import { LitElement, html, css, nothing } from "lit";
import { map } from "lit/directives/map.js";

/**
 * Breadcrumb navigation component.
 */
class AsBreadcrumb extends LitElement {
  static properties = {
    crumbs: { type: Array },
  };

  static styles = css`
    :host {
      display: block;
    }

    .nav-breadcrumb {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      padding: 8px var(--panel-padding, 16px);
      background: var(--md-sys-color-surface-1);
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      min-height: 48px;
      box-sizing: border-box;
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant);
    }

    .breadcrumb-link {
      color: var(--md-sys-color-primary);
      text-decoration: none;
      cursor: pointer;
      padding: 6px 8px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
      font-size: 13px;
      background: none;
      border: none;
      font-family: inherit;
    }

    .breadcrumb-link:hover {
      background: var(--md-sys-color-surface-1);
      text-decoration: underline;
    }

    .breadcrumb-separator {
      color: var(--md-sys-color-outline);
      margin: 0 4px;
      font-size: 13px;
    }

    .breadcrumb-current {
      color: var(--md-sys-color-on-surface);
      font-weight: 500;
      padding: 6px 8px;
      font-size: 13px;
    }

    @media (max-width: 800px) {
      .nav-breadcrumb {
        padding: 8px 12px;
      }
    }
  `;

  constructor() {
    super();
    this.crumbs = [];
  }

  render() {
    if (!this.crumbs || this.crumbs.length === 0) return nothing;

    const items = [];
    this.crumbs.forEach((crumb, idx) => {
      items.push(html`
        <div class="breadcrumb-item">
          ${idx < this.crumbs.length - 1
            ? html`
                <button
                  class="breadcrumb-link"
                  @click=${() => this._handleNavigate(idx)}
                >
                  ${crumb.label}
                </button>
              `
            : html`<span class="breadcrumb-current">${crumb.label}</span>`}
        </div>
      `);

      if (idx < this.crumbs.length - 1) {
        items.push(html`<span class="breadcrumb-separator">›</span>`);
      }
    });

    return html`<div class="nav-breadcrumb">${items}</div>`;
  }

  _handleNavigate(index) {
    this.dispatchEvent(
      new CustomEvent("navigate", {
        detail: { index },
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("as-breadcrumb", AsBreadcrumb);

export { AsBreadcrumb };

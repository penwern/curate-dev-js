import { LitElement, html, css, nothing } from "lit";
import { map } from "lit/directives/map.js";
import "@material/web/icon/icon.js";
import { textboxIcon, chevronDownIcon } from "../../utils/icons.js";

/**
 * Search field selector dropdown component.
 */
class AsSearchFieldSelector extends LitElement {
  static properties = {
    options: { type: Array },
    activeValue: { type: String },
    open: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    .search-field-button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 14px;
      border-radius: 999px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      cursor: pointer;
      font: inherit;
      line-height: 1;
      transition: background 0.2s ease, color 0.2s ease;
      height: var(--header-control-height, 36px);
    }

    .search-field-button:hover {
      background: var(--md-sys-color-surface-1);
    }

    .search-field-button md-icon,
    .search-field-button .button-icon {
      --md-icon-size: 18px;
    }

    .search-field-button .button-icon svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    .search-field-menu {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      min-width: 220px;
      background: var(--md-sys-color-surface);
      border-radius: 12px;
      border: 1px solid var(--md-sys-color-outline-variant);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.16);
      padding: 8px 0;
      z-index: 10;
    }

    .search-field-option {
      width: 100%;
      padding: 8px 16px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      border: none;
      background: none;
      cursor: pointer;
      font: inherit;
      color: var(--md-sys-color-on-surface);
      text-align: left;
    }

    .search-field-option:hover {
      background: var(--md-sys-color-surface-1);
    }

    .search-field-option.active {
      color: var(--md-sys-color-primary);
      font-weight: 600;
    }

    .search-field-option small {
      color: var(--md-sys-color-on-surface-variant);
      font-size: 12px;
    }
  `;

  constructor() {
    super();
    this.options = [];
    this.activeValue = "all";
    this.open = false;
  }

  render() {
    if (!this.options?.length) return nothing;

    const activeOption =
      this.options.find((opt) => opt.value === this.activeValue) || this.options[0];

    return html`
      <button
        type="button"
        class="search-field-button"
        aria-haspopup="listbox"
        aria-expanded=${this.open}
        @click=${this._handleToggle}
      >
        <span class="button-icon">${textboxIcon}</span>
        <span>${activeOption?.label || "All fields"}</span>
        <span class="button-icon">${chevronDownIcon}</span>
      </button>
      ${this.open ? this._renderMenu() : nothing}
    `;
  }

  _renderMenu() {
    return html`
      <div class="search-field-menu" role="listbox">
        ${map(
          this.options,
          (option) => html`
            <button
              type="button"
              class="search-field-option ${option.value === this.activeValue ? "active" : ""}"
              @click=${() => this._handleSelect(option.value)}
            >
              <span>${option.label}</span>
              ${option.description ? html`<small>${option.description}</small>` : nothing}
            </button>
          `
        )}
      </div>
    `;
  }

  _handleToggle(e) {
    e?.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("toggle", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleSelect(value) {
    this.dispatchEvent(
      new CustomEvent("field-select", {
        detail: { value },
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("as-search-field-selector", AsSearchFieldSelector);

export { AsSearchFieldSelector };

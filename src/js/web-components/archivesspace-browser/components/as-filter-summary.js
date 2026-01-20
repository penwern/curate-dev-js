import { LitElement, html, css, nothing } from "lit";
import "@material/web/button/text-button.js";
import { closeIcon } from "../../utils/icons.js";
import { getLevelLabel, getStatusLabel } from "../utils/search-helpers.js";

/**
 * Filter summary bar showing active filter chips.
 */
class AsFilterSummary extends LitElement {
  static properties = {
    selectedLevels: { type: Array },
    selectedStatuses: { type: Array },
    searchScope: { type: String },
    advancedFilters: { type: Array },
    selectedNodeTitle: { type: String },
  };

  static styles = css`
    :host {
      display: block;
    }

    .filter-summary {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px var(--panel-padding, 16px);
      background: var(--md-sys-color-surface-1);
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      flex-wrap: wrap;
      min-height: 40px;
    }

    .filter-summary strong {
      flex-shrink: 0;
      line-height: 28px;
      font-size: 12px;
      text-transform: uppercase;
    }

    .filter-chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }

    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      font-size: 12px;
    }

    .filter-chip button {
      border: none;
      background: transparent;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: inherit;
    }

    .filter-chip button svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }

    .filter-chip code {
      background: transparent;
      padding: 0;
      font-family: "Consolas", "Monaco", "Courier New", monospace;
      font-size: 11px;
    }

    @media (max-width: 800px) {
      .filter-summary {
        padding: 8px 12px;
      }

      .filter-chip {
        font-size: 11px;
        padding: 3px 8px;
      }
    }

    @media (max-width: 500px) {
      .filter-summary {
        padding: 6px 12px;
      }

      .filter-summary strong {
        font-size: 11px;
      }

      .filter-chip {
        font-size: 10px;
        padding: 2px 6px;
      }
    }
  `;

  constructor() {
    super();
    this.selectedLevels = [];
    this.selectedStatuses = [];
    this.searchScope = "collection";
    this.advancedFilters = [];
    this.selectedNodeTitle = "";
  }

  render() {
    const chips = this._buildChips();
    if (chips.length === 0) return nothing;

    return html`
      <div class="filter-summary">
        <strong>Filters</strong>
        <div class="filter-chip-row">${chips}</div>
        <md-text-button @click=${this._handleClearAll}>Clear all</md-text-button>
      </div>
    `;
  }

  _buildChips() {
    const chips = [];

    // Level filter chips
    (this.selectedLevels || []).forEach((level) => {
      const label = getLevelLabel(level);
      chips.push(html`
        <span class="filter-chip">
          Level: ${label}
          <button @click=${() => this._handleRemoveLevel(level)} aria-label="Remove ${label}">
            ${closeIcon}
          </button>
        </span>
      `);
    });

    // Status filter chips
    (this.selectedStatuses || []).forEach((status) => {
      const label = getStatusLabel(status);
      chips.push(html`
        <span class="filter-chip">
          Status: ${label}
          <button @click=${() => this._handleRemoveStatus(status)} aria-label="Remove ${label}">
            ${closeIcon}
          </button>
        </span>
      `);
    });

    // Scope filter chip
    if (this.searchScope === "subtree") {
      let label = "Scope: Subtree";
      if (this.selectedNodeTitle) {
        label = `Scope: Under "${this.selectedNodeTitle}"`;
      }
      chips.push(html`
        <span class="filter-chip">
          ${label}
          <button @click=${this._handleRemoveScope} aria-label="Remove scope filter">
            ${closeIcon}
          </button>
        </span>
      `);
    }

    // Advanced filter chips
    (this.advancedFilters || []).forEach((filter, idx) => {
      chips.push(html`
        <span class="filter-chip">
          <code>${filter}</code>
          <button @click=${() => this._handleRemoveAdvanced(idx)} aria-label="Remove ${filter}">
            ${closeIcon}
          </button>
        </span>
      `);
    });

    return chips;
  }

  _handleRemoveLevel(level) {
    this.dispatchEvent(
      new CustomEvent("remove-level", {
        detail: { level },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleRemoveStatus(status) {
    this.dispatchEvent(
      new CustomEvent("remove-status", {
        detail: { status },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleRemoveScope() {
    this.dispatchEvent(
      new CustomEvent("remove-scope", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleRemoveAdvanced(index) {
    this.dispatchEvent(
      new CustomEvent("remove-advanced", {
        detail: { index },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleClearAll() {
    this.dispatchEvent(
      new CustomEvent("clear-all", {
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("as-filter-summary", AsFilterSummary);

export { AsFilterSummary };

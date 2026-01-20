import { LitElement, html, css, nothing } from "lit";
import { map } from "lit/directives/map.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/filled-tonal-button.js";
import "@material/web/button/text-button.js";
import "@material/web/checkbox/checkbox.js";
import "@material/web/radio/radio.js";
import "@material/web/icon/icon.js";
import { chevronUpIcon, chevronDownIcon, closeIcon, tuneIcon } from "../../utils/icons.js";

/**
 * Filter popover component with level, status, scope, and advanced filters.
 */
class AsFilterPopover extends LitElement {
  static properties = {
    open: { type: Boolean },
    selectedLevels: { type: Array },
    selectedStatuses: { type: Array },
    searchScope: { type: String },
    advancedFilters: { type: Array },
    hasSelection: { type: Boolean },
    selectedNodeTitle: { type: String },
    showScopeFilter: { type: Boolean },
    _showAdvancedFilters: { state: true },
  };

  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    .filter-button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 14px;
      border-radius: 999px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface-1);
      color: var(--md-sys-color-on-surface);
      cursor: pointer;
      font: inherit;
      line-height: 1;
      height: var(--header-control-height, 36px);
    }

    .filter-button:hover {
      background: var(--md-sys-color-surface-2);
    }

    .filter-button .button-icon svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    .filter-badge {
      min-width: 20px;
      height: 20px;
      border-radius: 999px;
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 6px;
    }

    .filter-popover {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      width: 300px;
      max-width: min(320px, 80vw);
      max-height: min(420px, 70vh);
      overflow-y: auto;
      background: var(--md-sys-color-surface);
      border-radius: 12px;
      border: 1px solid var(--md-sys-color-outline-variant);
      box-shadow: 0 18px 42px rgba(0, 0, 0, 0.2);
      padding: 16px;
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .filter-group h4 {
      margin: 0 0 4px;
      font-size: 14px;
      color: var(--md-sys-color-on-surface);
    }

    .filter-helper {
      font-size: 12px;
      margin-bottom: 8px;
      color: var(--md-sys-color-on-surface-variant);
    }

    .filter-helper code {
      padding: 2px 4px;
      background: var(--md-sys-color-surface-variant);
      border-radius: 3px;
      font-family: "Consolas", "Monaco", "Courier New", monospace;
      font-size: 11px;
    }

    .filter-options {
      display: grid;
      gap: 6px;
    }

    .filter-option-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      cursor: pointer;
    }

    .filter-option-row div {
      flex: 1;
    }

    .filter-option-row small {
      display: block;
      color: var(--md-sys-color-on-surface-variant);
      font-size: 11px;
    }

    .filter-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    /* Advanced Filters */
    .advanced-filters .filter-group-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 0;
      margin: 0;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--md-sys-color-on-surface);
      font-family: inherit;
    }

    .advanced-filters .filter-group-toggle:hover {
      opacity: 0.8;
    }

    .advanced-filters .filter-group-toggle .toggle-icon svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    .advanced-filters-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin: 8px 0;
    }

    .advanced-filter-chip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 10px;
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      border-radius: 6px;
      font-size: 12px;
    }

    .advanced-filter-chip code {
      flex: 1;
      font-family: "Consolas", "Monaco", "Courier New", monospace;
      font-size: 11px;
      background: transparent;
      padding: 0;
    }

    .advanced-filter-chip .remove-filter {
      border: none;
      background: transparent;
      padding: 2px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: inherit;
      opacity: 0.7;
    }

    .advanced-filter-chip .remove-filter:hover {
      opacity: 1;
    }

    .advanced-filter-chip .remove-filter svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }

    .advanced-filter-input-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .advanced-filter-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid var(--md-sys-color-outline);
      border-radius: 6px;
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      font-family: "Consolas", "Monaco", "Courier New", monospace;
      font-size: 12px;
    }

    .advanced-filter-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary);
    }

    .advanced-filters .empty-state {
      padding: 12px;
      text-align: center;
      color: var(--md-sys-color-on-surface-variant);
      font-size: 12px;
      font-style: italic;
    }
  `;

  constructor() {
    super();
    this.open = false;
    this.selectedLevels = [];
    this.selectedStatuses = [];
    this.searchScope = "collection";
    this.advancedFilters = [];
    this.hasSelection = false;
    this.selectedNodeTitle = "";
    this.showScopeFilter = true;
    this._showAdvancedFilters = false;
  }

  render() {
    const filterCount = this._getActiveFilterCount();

    return html`
      <button
        type="button"
        class="filter-button"
        aria-haspopup="dialog"
        aria-expanded=${this.open}
        @click=${this._handleToggle}
      >
        <span class="button-icon">${tuneIcon}</span>
        Filters
        ${filterCount > 0 ? html`<span class="filter-badge">${filterCount}</span>` : nothing}
        <span class="button-icon">${chevronDownIcon}</span>
      </button>
      ${this.open ? this._renderPopover() : nothing}
    `;
  }

  _renderPopover() {
    return html`
      <div class="filter-popover">
        ${this._renderLevelFilterGroup()}
        ${this._renderStatusFilterGroup()}
        ${this.showScopeFilter ? this._renderScopeFilterGroup() : nothing}
        ${this._renderAdvancedFiltersGroup()}
        <div class="filter-actions">
          <md-text-button
            ?disabled=${!this._hasActiveFilters()}
            @click=${this._handleClearAll}
          >
            Clear
          </md-text-button>
          <md-filled-button @click=${this._handleClose}>Done</md-filled-button>
        </div>
      </div>
    `;
  }

  _renderLevelFilterGroup() {
    const levelOptions = [
      { value: "collection", label: "Collection", helper: "Top-level collections" },
      { value: "series", label: "Series", helper: "Series within collections" },
      { value: "subseries", label: "Subseries", helper: "Subseries groupings" },
      { value: "file", label: "File", helper: "Files and folders" },
      { value: "item", label: "Item", helper: "Individual items" },
    ];

    return html`
      <div class="filter-group">
        <h4>Hierarchical Level</h4>
        <div class="filter-helper">Filter by archival hierarchy level</div>
        <div class="filter-options">
          ${levelOptions.map(
            (option) => html`
              <label class="filter-option-row">
                <md-checkbox
                  .checked=${this.selectedLevels?.includes(option.value)}
                  @change=${() => this._handleToggleLevel(option.value)}
                ></md-checkbox>
                <div>
                  <div>${option.label}</div>
                  ${option.helper ? html`<small>${option.helper}</small>` : nothing}
                </div>
              </label>
            `
          )}
        </div>
      </div>
    `;
  }

  _renderStatusFilterGroup() {
    const statusOptions = [
      { value: "success", label: "Available", helper: "Stable and accessible" },
      { value: "warning", label: "Needs Attention", helper: "Requires review or maintenance" },
      { value: "error", label: "Restricted", helper: "Access restricted or unavailable" },
    ];

    return html`
      <div class="filter-group">
        <h4>Condition & Access</h4>
        <div class="filter-helper">Filter by availability and condition</div>
        <div class="filter-options">
          ${statusOptions.map(
            (option) => html`
              <label class="filter-option-row">
                <md-checkbox
                  .checked=${this.selectedStatuses?.includes(option.value)}
                  @change=${() => this._handleToggleStatus(option.value)}
                ></md-checkbox>
                <div>
                  <div>${option.label}</div>
                  ${option.helper ? html`<small>${option.helper}</small>` : nothing}
                </div>
              </label>
            `
          )}
        </div>
      </div>
    `;
  }

  _renderScopeFilterGroup() {
    const selectionLabel = this.selectedNodeTitle || "selected node";

    return html`
      <div class="filter-group">
        <h4>Search Scope</h4>
        <div class="filter-helper">
          Choose whether to search the entire collection or a specific subtree
        </div>
        <div class="filter-options">
          <label class="filter-option-row">
            <md-radio
              name="search-scope"
              value="collection"
              ?checked=${this.searchScope === "collection"}
              @change=${this._handleScopeChange}
            ></md-radio>
            <div>
              <div>Entire collection</div>
              <small>Search across all records in this collection</small>
            </div>
          </label>
          <label class="filter-option-row">
            <md-radio
              name="search-scope"
              value="subtree"
              ?checked=${this.searchScope === "subtree"}
              ?disabled=${!this.hasSelection}
              @change=${this._handleScopeChange}
            ></md-radio>
            <div>
              <div>
                Only under ${this.hasSelection ? `"${selectionLabel}"` : "selected node"}
              </div>
              <small>
                ${this.hasSelection
                  ? "Search is limited to this node's descendants"
                  : "Select a node in the tree to enable subtree search"}
              </small>
            </div>
          </label>
        </div>
      </div>
    `;
  }

  _renderAdvancedFiltersGroup() {
    return html`
      <div class="filter-group advanced-filters">
        <button
          type="button"
          class="filter-group-toggle"
          @click=${() => (this._showAdvancedFilters = !this._showAdvancedFilters)}
        >
          <h4>Advanced Filters</h4>
          <span class="toggle-icon">
            ${this._showAdvancedFilters ? chevronUpIcon : chevronDownIcon}
          </span>
        </button>
        ${this._showAdvancedFilters
          ? html`
              <div class="filter-helper">
                Add custom Lucene query filters. Examples: <code>condition:"good"</code>,
                <code>identifier:ABC*</code>, <code>primary_type:archival_object</code>
              </div>
              <div class="advanced-filters-list">
                ${this.advancedFilters?.length === 0
                  ? html`<div class="empty-state">No advanced filters added</div>`
                  : map(
                      this.advancedFilters,
                      (filter, idx) => html`
                        <div class="advanced-filter-chip">
                          <code>${filter}</code>
                          <button
                            type="button"
                            class="remove-filter"
                            @click=${() => this._handleRemoveAdvanced(idx)}
                            aria-label="Remove filter"
                          >
                            ${closeIcon}
                          </button>
                        </div>
                      `
                    )}
              </div>
              <div class="advanced-filter-input-row">
                <input
                  type="text"
                  class="advanced-filter-input"
                  placeholder='e.g., condition:"good"'
                  @keydown=${this._handleAdvancedKeydown}
                />
                <md-filled-tonal-button @click=${this._handleAddAdvanced}>
                  Add
                </md-filled-tonal-button>
              </div>
            `
          : nothing}
      </div>
    `;
  }

  _getActiveFilterCount() {
    let count = (this.selectedLevels?.length || 0) + (this.selectedStatuses?.length || 0);
    if (this.searchScope !== "collection") count++;
    count += this.advancedFilters?.length || 0;
    return count;
  }

  _hasActiveFilters() {
    return this._getActiveFilterCount() > 0;
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

  _handleClose() {
    this.dispatchEvent(
      new CustomEvent("close", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleToggleLevel(level) {
    this.dispatchEvent(
      new CustomEvent("toggle-level", {
        detail: { level },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleToggleStatus(status) {
    this.dispatchEvent(
      new CustomEvent("toggle-status", {
        detail: { status },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleScopeChange(e) {
    const value = e?.target?.value;
    this.dispatchEvent(
      new CustomEvent("scope-change", {
        detail: { value },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleAddAdvanced(e) {
    const button = e?.target;
    const row = button?.closest(".advanced-filter-input-row");
    const input = row?.querySelector(".advanced-filter-input");
    const value = input?.value?.trim();

    if (!value) return;

    this.dispatchEvent(
      new CustomEvent("add-advanced", {
        detail: { value },
        bubbles: true,
        composed: true,
      })
    );

    if (input) input.value = "";
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

  _handleAdvancedKeydown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      this._handleAddAdvanced(e);
    }
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

customElements.define("as-filter-popover", AsFilterPopover);

export { AsFilterPopover };

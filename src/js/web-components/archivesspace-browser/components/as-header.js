import { LitElement, html, css, nothing } from "lit";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/button/text-button.js";
import "@material/web/icon/icon.js";
import "./as-search-field-selector.js";
import "./as-filter-popover.js";
import {
  searchIcon,
  closeIcon,
  chevronLeftIcon,
  chevronRightIcon,
  hierarchyIcon,
  documentIcon,
} from "../../utils/icons.js";

/**
 * Header component with search input, field selector, filters, and navigation.
 */
class AsHeader extends LitElement {
  static properties = {
    title: { type: String },
    searchQuery: { type: String },
    searchLabel: { type: String },
    searchFieldOptions: { type: Array },
    activeSearchField: { type: String },
    searchFieldMenuOpen: { type: Boolean },
    filterMenuOpen: { type: Boolean },
    isTreeView: { type: Boolean },
    showFilters: { type: Boolean },
    showNavigation: { type: Boolean },
    showViewToggle: { type: Boolean },
    showBackToSearch: { type: Boolean },
    searchTotal: { type: Number },
    searchCurrent: { type: Number },
    recordViewMode: { type: String },
    // Filter props
    selectedLevels: { type: Array },
    selectedStatuses: { type: Array },
    searchScope: { type: String },
    advancedFilters: { type: Array },
    hasSelection: { type: Boolean },
    selectedNodeTitle: { type: String },
  };

  static styles = css`
    :host {
      display: block;
    }

    .header {
      padding: 12px var(--panel-padding, 16px);
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      flex-shrink: 0;
      min-height: var(--header-height, 64px);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .header-info h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      flex-shrink: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      flex: 1 1 auto;
      min-width: 0;
      flex-wrap: wrap;
    }

    .search-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1 1 auto;
      min-width: 200px;
      max-width: 100%;
      flex-wrap: wrap;
    }

    .search-input {
      flex: 1 1 280px;
      min-width: 180px;
      max-width: 100%;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 0 14px;
      border-radius: 999px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface);
      height: var(--header-control-height, 36px);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .search-input:focus-within {
      border-color: var(--md-sys-color-primary);
      box-shadow: 0 0 0 2px rgba(0, 102, 137, 0.15);
    }

    .search-input input {
      flex: 1;
      border: none;
      outline: none;
      font: inherit;
      background: transparent;
      color: var(--md-sys-color-on-surface);
    }

    .search-input input::placeholder {
      color: var(--md-sys-color-on-surface-variant);
    }

    .search-leading-icon {
      color: var(--md-sys-color-on-surface-variant);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }

    .search-leading-icon svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
      display: block;
    }

    .search-clear-button {
      border: none;
      background: transparent;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--md-sys-color-on-surface-variant);
      width: 24px;
      height: 24px;
    }

    .search-clear-button:hover {
      color: var(--md-sys-color-on-surface);
    }

    .search-clear-button svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    .search-navigation {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px;
      border-radius: 999px;
      background: var(--md-sys-color-surface-1);
      border: 1px solid var(--md-sys-color-outline-variant);
      color: var(--md-sys-color-on-surface-variant);
      flex-shrink: 0;
      height: var(--header-control-height, 36px);
      align-self: center;
    }

    .search-navigation-count {
      font-size: 12px;
      min-width: 36px;
      text-align: center;
    }

    .search-navigation md-icon-button {
      --md-icon-button-container-size: calc(var(--header-control-height, 36px) - 6px);
      --md-icon-button-state-layer-size: calc(var(--header-control-height, 36px) - 6px);
      --md-icon-button-container-shape: 999px;
    }

    .record-view-toggle {
      display: inline-flex;
      padding: 2px;
      border-radius: 999px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface);
      gap: 2px;
      flex-shrink: 0;
      height: var(--header-control-height, 36px);
      box-sizing: border-box;
      align-self: center;
    }

    .view-toggle-button {
      border: none;
      background: none;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: background-color 0.2s ease, color 0.2s ease;
      height: 100%;
      font-family: inherit;
    }

    .view-toggle-button.active {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
    }

    .view-toggle-button .toggle-icon {
      --md-icon-size: 18px;
    }

    .view-toggle-button .toggle-icon svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    @media (max-width: 800px) {
      .header-top {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
      }

      .header-info {
        order: -1;
      }

      .header-actions {
        width: 100%;
        justify-content: stretch;
      }

      .search-controls {
        width: 100%;
        flex: 1 1 100%;
      }

      .search-input {
        flex: 1 1 100%;
        min-width: 0;
      }
    }

    @media (max-width: 500px) {
      .header {
        padding: 8px 12px;
      }

      .header-info h2 {
        font-size: 16px;
      }
    }
  `;

  constructor() {
    super();
    this.title = "ArchivesSpace Browser";
    this.searchQuery = "";
    this.searchLabel = "Search";
    this.searchFieldOptions = [];
    this.activeSearchField = "all";
    this.searchFieldMenuOpen = false;
    this.filterMenuOpen = false;
    this.isTreeView = false;
    this.showFilters = false;
    this.showNavigation = false;
    this.showViewToggle = false;
    this.showBackToSearch = false;
    this.searchTotal = 0;
    this.searchCurrent = 0;
    this.recordViewMode = "tree";
    this.selectedLevels = [];
    this.selectedStatuses = [];
    this.searchScope = "collection";
    this.advancedFilters = [];
    this.hasSelection = false;
    this.selectedNodeTitle = "";
  }

  render() {
    const isSearchActive = this.searchQuery.trim().length > 0;

    return html`
      <div class="header">
        <div class="header-top">
          <div class="header-info">
            <h2>${this.title}</h2>
          </div>
          <div class="header-actions">
            <div class="search-controls">
              ${this._renderSearchFieldSelector()}
              <label class="search-input" aria-label=${this.searchLabel}>
                <span class="search-leading-icon">${searchIcon}</span>
                <input
                  type="text"
                  placeholder=${this.searchLabel}
                  .value=${this.searchQuery}
                  @input=${this._handleSearchInput}
                />
                ${isSearchActive
                  ? html`
                      <button
                        type="button"
                        class="search-clear-button"
                        @click=${this._handleClearSearch}
                        aria-label="Clear search"
                      >
                        ${closeIcon}
                      </button>
                    `
                  : nothing}
              </label>
              ${this.showFilters ? this._renderFilterPopover() : nothing}
              ${this.showViewToggle ? this._renderViewToggle() : nothing}
              ${this.showNavigation ? this._renderSearchNavigation() : nothing}
            </div>
            ${this.showBackToSearch
              ? html`
                  <md-text-button @click=${this._handleBackToSearch}>
                    Back to search results
                  </md-text-button>
                `
              : nothing}
          </div>
        </div>
      </div>
    `;
  }

  _renderSearchFieldSelector() {
    if (!this.searchFieldOptions?.length) return nothing;

    return html`
      <as-search-field-selector
        .options=${this.searchFieldOptions}
        .activeValue=${this.activeSearchField}
        .open=${this.searchFieldMenuOpen}
        @toggle=${this._handleSearchFieldToggle}
        @field-select=${this._handleSearchFieldSelect}
      ></as-search-field-selector>
    `;
  }

  _renderFilterPopover() {
    return html`
      <as-filter-popover
        .open=${this.filterMenuOpen}
        .selectedLevels=${this.selectedLevels}
        .selectedStatuses=${this.selectedStatuses}
        .searchScope=${this.searchScope}
        .advancedFilters=${this.advancedFilters}
        .hasSelection=${this.hasSelection}
        .selectedNodeTitle=${this.selectedNodeTitle}
        .showScopeFilter=${this.isTreeView}
        @toggle=${this._handleFilterToggle}
        @close=${this._handleFilterClose}
        @toggle-level=${this._forwardEvent}
        @toggle-status=${this._forwardEvent}
        @scope-change=${this._forwardEvent}
        @add-advanced=${this._forwardEvent}
        @remove-advanced=${this._forwardEvent}
        @clear-all=${this._forwardEvent}
      ></as-filter-popover>
    `;
  }

  _renderSearchNavigation() {
    const disablePrev = this.searchTotal === 0 || this.searchCurrent <= 1;
    const disableNext = this.searchTotal === 0 || this.searchCurrent >= this.searchTotal;

    return html`
      <div class="search-navigation">
        <md-icon-button
          aria-label="Previous search result"
          ?disabled=${disablePrev}
          @click=${this._handleSearchPrev}
        >
          ${chevronLeftIcon}
        </md-icon-button>
        <span class="search-navigation-count">${this.searchCurrent}/${this.searchTotal}</span>
        <md-icon-button
          aria-label="Next search result"
          ?disabled=${disableNext}
          @click=${this._handleSearchNext}
        >
          ${chevronRightIcon}
        </md-icon-button>
      </div>
    `;
  }

  _renderViewToggle() {
    return html`
      <div class="record-view-toggle" role="group" aria-label="Record view mode">
        <button
          type="button"
          class="view-toggle-button ${this.recordViewMode === "tree" ? "active" : ""}"
          @click=${() => this._handleViewModeChange("tree")}
        >
          <span class="toggle-icon">${hierarchyIcon}</span>
          Tree
        </button>
        <button
          type="button"
          class="view-toggle-button ${this.recordViewMode === "flat" ? "active" : ""}"
          @click=${() => this._handleViewModeChange("flat")}
        >
          <span class="toggle-icon">${documentIcon}</span>
          Flat
        </button>
      </div>
    `;
  }

  _handleSearchInput(e) {
    this.dispatchEvent(
      new CustomEvent("search-input", {
        detail: { value: e.target.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleClearSearch() {
    this.dispatchEvent(
      new CustomEvent("search-clear", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleSearchFieldToggle() {
    this.dispatchEvent(
      new CustomEvent("search-field-toggle", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleSearchFieldSelect(e) {
    this.dispatchEvent(
      new CustomEvent("search-field-change", {
        detail: e.detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleFilterToggle() {
    this.dispatchEvent(
      new CustomEvent("filter-toggle", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleFilterClose() {
    this.dispatchEvent(
      new CustomEvent("filter-close", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleSearchPrev() {
    this.dispatchEvent(
      new CustomEvent("search-prev", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleSearchNext() {
    this.dispatchEvent(
      new CustomEvent("search-next", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleViewModeChange(mode) {
    this.dispatchEvent(
      new CustomEvent("view-mode-change", {
        detail: { mode },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleBackToSearch() {
    this.dispatchEvent(
      new CustomEvent("back-to-search", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _forwardEvent(e) {
    this.dispatchEvent(new CustomEvent(e.type, { detail: e.detail, bubbles: true, composed: true }));
  }
}

customElements.define("as-header", AsHeader);

export { AsHeader };

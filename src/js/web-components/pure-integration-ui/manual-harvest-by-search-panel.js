import { LitElement, html, css } from "lit";
import { when } from "lit/directives/when.js";

import "@material/web/textfield/outlined-text-field.js";
import "@material/web/button/filled-button.js";
import "@material/web/progress/linear-progress.js";
import "@material/web/checkbox/checkbox.js";
import "@material/web/switch/switch.js";
import "@material/web/dialog/dialog.js";
import "@material/web/button/text-button.js";

import { searchIcon, playIcon } from "../utils/icons.js";
import { repeat } from "lit/directives/repeat.js";

class SearchResultsTable extends LitElement {
  static properties = {
    searchResults: { type: Array },
    areAllSelected: { type: Boolean },
    areSomeSelected: { type: Boolean },
  };

  static styles = css`
    .search-results-table {
      border: 1px solid var(--md-sys-color-outline);
      border-radius: 12px;
      overflow: hidden;
    }
    .table-header,
    .table-row {
      display: grid;
      grid-template-columns: 48px 3fr 1.2fr 1fr;
      gap: 20px;
      align-items: center;
      padding: 12px 20px;
    }

    @media (max-width: 1200px) {
      .table-header,
      .table-row {
        grid-template-columns: 48px 2.5fr 1fr 1fr;
        gap: 16px;
        padding: 8px 16px;
      }
    }

    @media (max-width: 1024px) {
      .table-header,
      .table-row {
        grid-template-columns: 40px 2fr 0.8fr 0.8fr;
        gap: 12px;
        padding: 6px 12px;
      }
    }
    .table-header {
      background: var(--md-sys-color-surface-1);
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant);
      border-bottom: 1px solid var(--md-sys-color-outline);
      padding: 12px 16px;
      font-size: 14px;
    }
    .table-header md-checkbox {
      margin-left: 0;
    }
    .table-row {
      cursor: pointer;
      transition: background-color 0.15s ease-in-out;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
    .table-row:last-child {
      border-bottom: none;
    }
    .table-row:hover {
      background-color: var(--md-sys-color-surface-container-hover);
    }
    .table-row md-checkbox {
      margin-left: 0;
    }
    .record-title {
      font-weight: 500;
    }
    .record-collection {
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .record-meta {
      font-family: monospace;
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .record-id {
      font-family: monospace;
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .no-results {
      padding: 24px;
      text-align: center;
      color: var(--md-sys-color-on-surface-variant);
    }
  `;

  _toggleAll(e) {
    // Pass the IDs of currently filtered records so main component can update only those
    const filteredRecordIds = this.searchResults.map(record => record.id);
    this.dispatchEvent(
      new CustomEvent("toggle-select-all-results", {
        detail: {
          checked: e.target.checked,
          recordIds: filteredRecordIds
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _toggleRecord(index) {
    // Get the actual record from filtered results to pass its ID
    const record = this.searchResults[index];
    this.dispatchEvent(
      new CustomEvent("toggle-record-selection", {
        detail: { recordId: record.id, index },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (!this.searchResults || this.searchResults.length === 0) {
      return html`
        <div class="no-results">
          No records found. Try a different search term.
        </div>
      `;
    }

    return html`
      <div class="search-results-table">
        <div class="table-header">
          <md-checkbox
            aria-label="Select all results"
            ?checked=${this.areAllSelected}
            ?indeterminate=${this.areSomeSelected}
            @change=${this._toggleAll}
          ></md-checkbox>
          <div>RECORD</div>
          <div>ID</div>
          <div>MODIFIED</div>
        </div>
        ${repeat(
          this.searchResults,
          (r) => r.id,
          (record, index) => html`
            <div class="table-row" @click=${() => this._toggleRecord(index)}>
              <md-checkbox
                ?checked=${record.selected}
                aria-labelledby="title-${record.id}-${index}"
              ></md-checkbox>
              <div>
                <div class="record-title" id="title-${record.id}-${index}">
                  ${record.title}
                </div>
                <div class="record-collection">${record.collection}</div>
              </div>
              <div class="record-id" title="${record.id}">${record.id}</div>
              <div class="record-meta">${record.modified}</div>
            </div>
          `
        )}
      </div>
    `;
  }
}
customElements.define("search-results-table", SearchResultsTable);

class ManualHarvestBySearchPanel extends LitElement {
  static properties = {
    manualSearchQuery: { type: Object },
    isManualSearching: { type: Boolean },
    manualSearchResults: { type: Array },
    isManualHarvesting: { type: Boolean },
    showFilterWarning: { type: Boolean, state: true },
    warningMessage: { type: String, state: true },
    filteredResults: { type: Array, state: true },
  };

  constructor() {
    super();
    this.showFilterWarning = false;
    this.warningMessage = '';
    this.filteredResults = [];
  }

  // Computed properties based on search results
  get selectedManualRecords() {
    return (this.filteredResults || []).filter((r) => r.selected);
  }

  get areAllSelected() {
    return (
      this.filteredResults &&
      this.filteredResults.length > 0 &&
      this.filteredResults.every((r) => r.selected)
    );
  }

  get areSomeSelected() {
    const selectedCount = this.selectedManualRecords.length;
    return (
      this.filteredResults &&
      selectedCount > 0 &&
      selectedCount < this.filteredResults.length
    );
  }

  _applyFilters() {
    if (!this.manualSearchResults || this.manualSearchResults.length === 0) {
      this.filteredResults = [];
      return;
    }

    this.filteredResults = this.manualSearchResults;
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has('manualSearchResults')) {
      this._applyFilters();
    }
  }

  static styles = css`
    .form-section {
      margin-bottom: 16px;
    }
    .form-section h3 {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 500;
      color: var(--md-sys-color-primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .form-section p {
      margin: 0 0 16px;
      color: var(--md-sys-color-on-surface-variant);
      max-width: 65ch;
    }
    .search-input-row {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }
    .search-input-row md-filled-button {
      margin: auto;
    }
    .search-results-container {
      margin-top: 4px;
      border-top: 1px solid var(--md-sys-color-outline-variant);
      padding-top: 4px;
    }
    .results-header {
      margin: 0 0 8px;
      font-size: 16px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
    }
    .selection-summary-bar {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      padding: 12px 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 24px;
      animation: slide-in 0.3s ease-out;
    }
    @keyframes slide-in {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .selection-summary-bar span {
      font-weight: 500;
    }
    md-filled-button span {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .search-hint {
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
      margin-top: 8px;
    }
    .filters-section {
      background: var(--md-sys-color-surface-container-low);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 2px;
    }
    .filters-header {
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      margin-bottom: 8px;
      font-size: 14px;
    }
    .filters-row {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    .filter-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .filter-item label {
      font-size: 14px;
      color: var(--md-sys-color-on-surface);
    }
    .results-container {
      max-height: none;
      overflow-y: visible;
      border-radius: 12px;
    }
    .selection-summary-bar {
      position: sticky;
      bottom: 0;
      z-index: 10;
    }
  `;

  _dispatch(eventName, detail = {}) {
    this.dispatchEvent(
      new CustomEvent(eventName, { detail, bubbles: true, composed: true })
    );
  }

  _handleSearchInput(e) {
    this._dispatch("update-manual-search-query", { query: { searchString: e.target.value } });
  }

  _handleKeyPress(e) {
    if (
      e.key === "Enter" &&
      this.manualSearchQuery?.searchString?.trim() &&
      !this.isManualSearching
    ) {
      this._runSearch();
    }
  }

  _runSearch() {
    if (!this.manualSearchQuery?.searchString?.trim()) return;
    this._dispatch("run-manual-search");
  }

  _runHarvest() {
    this._dispatch("run-harvest-selected-records");
  }


  _closeWarningDialog() {
    this.showFilterWarning = false;
  }

  render() {
    const selectedCount = this.selectedManualRecords.length;
    const hasResults = this.manualSearchResults && this.manualSearchResults.length > 0;
    const hasFilteredResults = this.filteredResults && this.filteredResults.length > 0;

    return html`
      <div class="form-section">
        <div class="search-input-row">
          <md-outlined-text-field
            label="Search by keyword, title, or ID"
            .value=${this.manualSearchQuery?.searchString || ""}
            @input=${this._handleSearchInput}
            @keypress=${this._handleKeyPress}
            style="flex-grow: 1;"
            ?disabled=${this.isManualSearching}
          ></md-outlined-text-field>
          <md-filled-button
            @click=${this._runSearch}
            ?disabled=${!this.manualSearchQuery?.searchString?.trim() ||
            this.isManualSearching}
          >
            <span>
              ${searchIcon}
              ${this.isManualSearching ? "Searching..." : "Search"}
            </span>
          </md-filled-button>
        </div>

      </div>


      ${when(
        this.isManualSearching,
        () => html`
          <md-linear-progress indeterminate></md-linear-progress>
          <p
            style="text-align: center; color: var(--md-sys-color-on-surface-variant); margin: 16px 0;"
          >
            Searching database...
          </p>
        `
      )}
      ${when(
        hasFilteredResults && !this.isManualSearching,
        () => html`
          <div class="search-results-container">
            <h4 class="results-header">
              ${hasResults && hasFilteredResults 
                ? `Showing ${this.filteredResults.length} filtered records`
                : `Found ${this.filteredResults.length} record${this.filteredResults.length === 1 ? "" : "s"}`
              }
            </h4>
            <div class="results-container">
              <search-results-table
                .searchResults=${this.filteredResults}
                .areAllSelected=${this.areAllSelected}
                .areSomeSelected=${this.areSomeSelected}
                @toggle-select-all-results=${(e) => {
                  this._dispatch("toggle-select-all", e.detail);
                }}
                @toggle-record-selection=${(e) => {
                  this._dispatch("toggle-record-selection", e.detail);
                }}
              ></search-results-table>
            </div>
          </div>
        `
      )}
      ${when(
        selectedCount > 0,
        () => html`
          <div class="selection-summary-bar">
            <span>
              ${selectedCount} record${selectedCount === 1 ? "" : "s"} selected
            </span>
            <md-filled-button
              @click=${this._runHarvest}
              ?disabled=${this.isManualHarvesting}
            >
              <span>
                ${playIcon}
                ${this.isManualHarvesting
                  ? "Harvesting..."
                  : "Harvest Selected"}
              </span>
            </md-filled-button>
          </div>
        `
      )}

      <!-- Filter Warning Dialog -->
      ${when(
        this.showFilterWarning,
        () => html`
          <md-dialog open @closed=${this._closeWarningDialog}>
            <div slot="headline">Filter Warning</div>
            <div slot="content">${this.warningMessage}</div>
            <div slot="actions">
              <md-text-button @click=${this._closeWarningDialog}>
                Got it
              </md-text-button>
            </div>
          </md-dialog>
        `
      )}
    `;
  }
}

customElements.define(
  "manual-harvest-by-search-panel",
  ManualHarvestBySearchPanel
);
export { ManualHarvestBySearchPanel };

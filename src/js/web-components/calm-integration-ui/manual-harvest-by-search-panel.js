import { LitElement, html, css } from "lit";
import { when } from "lit/directives/when.js";

import "@material/web/textfield/outlined-text-field.js";
import "@material/web/button/filled-button.js";
import "@material/web/progress/linear-progress.js";
import "@material/web/checkbox/checkbox.js";

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
      grid-template-columns: 48px 2.5fr 1fr 1fr;
      gap: 16px;
      align-items: center;
      padding: 8px 16px;
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
      justify-self: flex-start;
    }

    .no-results {
      padding: 24px;
      text-align: center;
      color: var(--md-sys-color-on-surface-variant);
    }

    @media (max-width: 1024px) {
      .table-header,
      .table-row {
        grid-template-columns: 48px 2fr 1fr 1fr;
      }
    }

    @media (max-width: 720px) {
      .table-header {
        display: none;
      }

      .table-row {
        grid-template-columns: 40px 1fr;
        grid-template-rows: auto auto auto;
        gap: 8px 12px;
        padding: 12px 16px;
      }

      .table-row md-checkbox {
        grid-row: 1 / span 3;
        align-self: flex-start;
      }

      .table-row > div:nth-of-type(1) {
        grid-column: 2;
      }

      .table-row > div:nth-of-type(2),
      .table-row > div:nth-of-type(3) {
        grid-column: 2;
        display: inline-flex;
        gap: 6px;
        font-size: 13px;
        color: var(--md-sys-color-on-surface-variant);
      }

      .table-row > div:nth-of-type(2)::before {
        content: "ID:";
        font-weight: 600;
        color: var(--md-sys-color-on-surface);
      }

      .table-row > div:nth-of-type(3)::before {
        content: "Modified:";
        font-weight: 600;
        color: var(--md-sys-color-on-surface);
      }
    }
  `;

  _toggleAll(e) {
    this.dispatchEvent(
      new CustomEvent("toggle-select-all-results", {
        detail: { checked: e.target.checked },
        bubbles: true,
        composed: true,
      })
    );
  }

  _toggleRecord(index) {
    this.dispatchEvent(
      new CustomEvent("toggle-record-selection", {
        detail: { index },
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
              <div class="record-meta">${record.id}</div>
              <div class="record-meta">${record.modified}</div>
            </div>
          `
        )}
      </div>
    `;
  }
}
customElements.define("calm-search-results-table", SearchResultsTable);

class ManualHarvestBySearchPanel extends LitElement {
  static properties = {
    manualSearchTerm: { type: String },
    isManualSearching: { type: Boolean },
    manualSearchResults: { type: Array },
    isManualHarvesting: { type: Boolean },
  };

  // Computed properties based on search results
  get selectedManualRecords() {
    return (this.manualSearchResults || []).filter((r) => r.selected);
  }

  get areAllSelected() {
    return (
      this.manualSearchResults &&
      this.manualSearchResults.length > 0 &&
      this.manualSearchResults.every((r) => r.selected)
    );
  }

  get areSomeSelected() {
    const selectedCount = this.selectedManualRecords.length;
    return (
      this.manualSearchResults &&
      selectedCount > 0 &&
      selectedCount < this.manualSearchResults.length
    );
  }

  static styles = css`
    .form-section {
      margin-bottom: 32px;
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
      flex-wrap: wrap;
    }

    .search-input-row md-filled-button {
      flex-shrink: 0;
    }

    .search-results-container {
      margin-top: 24px;
      border-top: 1px solid var(--md-sys-color-outline-variant);
      padding-top: 24px;
    }

    .results-header {
      margin: 0 0 16px;
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
      flex-wrap: wrap;
      gap: 12px;
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

    @media (max-width: 600px) {
      .search-input-row {
        flex-direction: column;
        align-items: stretch;
      }

      .search-input-row md-filled-button {
        width: 100%;
      }

      .selection-summary-bar {
        flex-direction: column;
        align-items: flex-start;
      }

      .selection-summary-bar md-filled-button {
        width: 100%;
      }
    }
  `;

  _dispatch(eventName, detail = {}) {
    this.dispatchEvent(
      new CustomEvent(eventName, { detail, bubbles: true, composed: true })
    );
  }

  _handleSearchInput(e) {
    this._dispatch("update-manual-search-term", { value: e.target.value });
  }

  _handleKeyPress(e) {
    if (
      e.key === "Enter" &&
      this.manualSearchTerm.trim() &&
      !this.isManualSearching
    ) {
      this._runSearch();
    }
  }

  _runSearch() {
    if (!this.manualSearchTerm.trim()) return;
    this._dispatch("run-manual-search");
  }

  _runHarvest() {
    this._dispatch("run-harvest-selected-records");
  }

  render() {
    const selectedCount = this.selectedManualRecords.length;
    const hasResults =
      this.manualSearchResults && this.manualSearchResults.length > 0;

    return html`
      <div class="form-section">
        <h3><span>${searchIcon}</span>Find and Select Records</h3>
        <p>
          Search for records in your CALM database using keywords, titles, or
          IDs. Then select the records you wish to harvest into Soteria+.
        </p>

        <div class="search-input-row">
          <md-outlined-text-field
            label="Search by keyword, title, or ID"
            .value=${this.manualSearchTerm}
            @input=${this._handleSearchInput}
            @keypress=${this._handleKeyPress}
            style="flex-grow: 1;"
            ?disabled=${this.isManualSearching}
          ></md-outlined-text-field>
          <md-filled-button
            @click=${this._runSearch}
            ?disabled=${!this.manualSearchTerm.trim() || this.isManualSearching}
          >
            <span>
              ${searchIcon}
              ${this.isManualSearching ? "Searching..." : "Search"}
            </span>
          </md-filled-button>
        </div>

        ${this.manualSearchTerm.trim()
          ? html`
              <div class="search-hint">
                Press Enter or click Search to find records matching
                "${this.manualSearchTerm}"
              </div>
            `
          : ""}
      </div>

      ${when(
        this.isManualSearching,
        () => html`
          <md-linear-progress indeterminate></md-linear-progress>
          <p
            style="text-align: center; color: var(--md-sys-color-on-surface-variant); margin: 16px 0;"
          >
            Searching CALM database...
          </p>
        `
      )}
      ${when(
        hasResults && !this.isManualSearching,
        () => html`
          <div class="search-results-container">
            <h4 class="results-header">
              Found ${this.manualSearchResults.length}
              record${this.manualSearchResults.length === 1 ? "" : "s"}
            </h4>
            <calm-search-results-table
              .searchResults=${this.manualSearchResults}
              .areAllSelected=${this.areAllSelected}
              .areSomeSelected=${this.areSomeSelected}
              @toggle-select-all-results=${(e) => {
                this._dispatch("toggle-select-all", e.detail);
              }}
              @toggle-record-selection=${(e) => {
                this._dispatch("toggle-record-selection", e.detail);
              }}
            ></calm-search-results-table>
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
    `;
  }
}

customElements.define(
  "calm-manual-harvest-by-search-panel",
  ManualHarvestBySearchPanel
);
export { ManualHarvestBySearchPanel };

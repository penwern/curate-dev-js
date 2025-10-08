// manual-harvest-tab-content.js

import { LitElement, html, css } from "lit";
import { when } from "lit/directives/when.js";
import "./manual-harvest-by-ids-panel.js";
import "./manual-harvest-by-search-panel.js"; // Assuming this file also defines SearchResultsTable or it's imported there
import "@material/web/button/filled-tonal-button.js";
import { textboxIcon, searchIcon } from "../utils/icons.js";

class ManualHarvestTabContent extends LitElement {
  static properties = {
    manualHarvestMode: { type: String }, // 'ids' or 'search'
    manualHarvestIds: { type: String },
    manualSearchTerm: { type: String },
    isManualSearching: { type: Boolean },
    manualSearchResults: { type: Array },
    isManualHarvesting: { type: Boolean },
  };

  constructor() {
    super();
    // Initialize the flag for the re-entrancy guard
    this._isProcessingToggleRelay = false;
  }

  static styles = css`
    .mode-toggle-group {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .mode-toggle-group md-filled-tonal-button {
      flex: 1;
      min-width: 220px;
    }

    @media (max-width: 600px) {
      .mode-toggle-group {
        flex-direction: column;
        align-items: stretch;
      }

      .mode-toggle-group md-filled-tonal-button {
        width: 100%;
      }
    }

    md-filled-tonal-button span {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `;

  _setMode(mode) {
    this.dispatchEvent(
      new CustomEvent("set-manual-harvest-mode", {
        detail: { mode },
        bubbles: true,
        composed: true,
      })
    );
  }

  _relayEvent(e) {
    let shouldDispatch = true;

    if (e.type === "toggle-record-selection") {
      if (this._isProcessingToggleRelay) {
        // If already processing, block this re-entrant call and don't dispatch
        shouldDispatch = false;
      } else {
        // This is the first valid processing for this interaction
        this._isProcessingToggleRelay = true;
      }
    }

    if (shouldDispatch) {
      this.dispatchEvent(
        new CustomEvent(e.type, {
          detail: e.detail,
          bubbles: true,
          composed: true,
        })
      );
    }

    // If this was a 'toggle-record-selection' event that was actually processed (dispatched),
    // schedule the flag to be reset.
    if (e.type === "toggle-record-selection" && shouldDispatch) {
      requestAnimationFrame(() => {
        this._isProcessingToggleRelay = false;
      });
    }
  }

  render() {
    return html`
      <div class="mode-toggle-group">
        <md-filled-tonal-button
          @click=${() => this._setMode("ids")}
          ?disabled=${this.manualHarvestMode === "ids"}
        >
          <span>${textboxIcon} Enter IDs Directly</span>
        </md-filled-tonal-button>
        <md-filled-tonal-button
          @click=${() => this._setMode("search")}
          ?disabled=${this.manualHarvestMode === "search"}
        >
          <span>${searchIcon} Search & Select</span>
        </md-filled-tonal-button>
      </div>

      ${when(
        this.manualHarvestMode === "ids",
        () => html`
          <calm-manual-harvest-by-ids-panel
            .manualHarvestIds=${this.manualHarvestIds}
            .isManualHarvesting=${this.isManualHarvesting}
            @update-manual-ids=${this._relayEvent}
            @run-harvest-ids=${this._relayEvent}
          ></calm-manual-harvest-by-ids-panel>
        `,
        () => html`
          <calm-manual-harvest-by-search-panel
            .manualSearchTerm=${this.manualSearchTerm}
            .isManualSearching=${this.isManualSearching}
            .manualSearchResults=${this.manualSearchResults}
            .isManualHarvesting=${this.isManualHarvesting}
            @update-manual-search-term=${this._relayEvent}
            @run-manual-search=${this._relayEvent}
            @toggle-select-all=${this._relayEvent}
            @toggle-record-selection=${this._relayEvent}
            @run-harvest-selected-records=${this._relayEvent}
          ></calm-manual-harvest-by-search-panel>
        `
      )}
    `;
  }
}
customElements.define("calm-manual-harvest-tab-content", ManualHarvestTabContent);
export default ManualHarvestTabContent;

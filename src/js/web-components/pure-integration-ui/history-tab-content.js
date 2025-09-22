// history-tab-content.js

import { LitElement, html, css } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { when } from "lit/directives/when.js";

import "@material/web/button/text-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/button/filled-button.js";
import "@material/web/switch/switch.js";
import "@material/web/select/outlined-select.js";
import "@material/web/select/select-option.js";
import "@material/web/progress/circular-progress.js";
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/progress/circular-progress.js";

import {
  checkCircleIcon,
  alertCircleIcon,
  chevronRightIcon,
  chevronDownIcon,
} from "../utils/icons.js";

class HarvestHistoryItemDetails extends LitElement {
  static properties = {
    harvest: { type: Object },
  };

  static styles = css`
    .history-details-grid {
      grid-column: 1 / -1;
      padding: 16px 0 0 0;
      margin-top: 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant);
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 8px 16px;
      font-size: 14px;
    }
    .history-details-grid dt {
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant);
    }
    .history-details-grid dd {
      margin: 0;
      color: var(--md-sys-color-on-surface);
    }
    .history-details-grid dd.failed {
      color: var(--md-sys-color-error);
    }
  `;

  render() {
    return html`
      <dl class="history-details-grid">
        <dt>Harvest ID</dt>
        <dd>${this.harvest.id}</dd>
        <dt>Source</dt>
        <dd>${this.harvest.source}</dd>
        <dt>Status</dt>
        <dd class="${this.harvest.status}">${this.harvest.status}</dd>
        <dt>Records Attempted</dt>
        <dd>${this.harvest.records_attempted || 0}</dd>
        <dt>Records Successful</dt>
        <dd>${this.harvest.records_successful || 0}</dd>
        <dt>Records Failed</dt>
        <dd>${this.harvest.records_failed || 0}</dd>
        ${when(
          this.harvest.records_cached !== undefined,
          () => html`
            <dt>Records Cached</dt>
            <dd>${this.harvest.records_cached || 0}</dd>
          `
        )}
        ${when(
          !this.harvest.success,
          () => html`
            <dt>Error Detail</dt>
            <dd class="failed">${this.harvest.error}</dd>
          `
        )}
      </dl>
    `;
  }
}
customElements.define(
  "harvest-history-item-details",
  HarvestHistoryItemDetails
);

class HarvestHistoryItem extends LitElement {
  static properties = {
    harvest: { type: Object },
    isExpanded: { type: Boolean },
  };

  static styles = css`
    /* Styles from original harvest item */
    .harvest-item {
      background: var(--md-sys-color-surface-1);
      border-radius: 12px;
      padding: 16px;
      display: grid;
      grid-template-columns: auto 1fr auto;
      grid-template-rows: auto;
      gap: 16px;
      align-items: center;
      transition: background-color 0.2s ease-in-out;
    }
    .harvest-status {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    .harvest-status.completed {
      background: var(--md-sys-color-tertiary-container);
      color: var(--md-sys-color-on-tertiary-container);
    }
    .harvest-status.failed {
      background: var(--md-sys-color-error-container);
      color: var(--md-sys-color-on-error-container);
    }
    .harvest-details h4 {
      margin: 0 0 4px;
      font-size: 16px;
      font-weight: 500;
    }
    .harvest-meta {
      display: flex;
      gap: 16px;
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
    }
    harvest-history-item-details {
      grid-column: 1 / -1;
    }
  `;

  _toggleExpansion() {
    this.dispatchEvent(
      new CustomEvent("toggle-item-expansion", {
        detail: { id: this.harvest.id },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="harvest-item">
        <div class="harvest-status ${this.harvest.status}">
          ${this.harvest.success ? checkCircleIcon : alertCircleIcon}
        </div>
        <div class="harvest-details">
          <h4>${this.harvest.date}</h4>
          <div class="harvest-meta">
            <span>
              ${this.harvest.success
                ? `${this.harvest.records_successful || this.harvest.records || 0} successful`
                : `Error: ${this.harvest.error}`}${this.harvest.records_cached > 0 
                  ? `, ${this.harvest.records_cached} cached`
                  : ''}
            </span>
            <span>Duration: ${this.harvest.duration}</span>
          </div>
        </div>
        <md-icon-button @click=${this._toggleExpansion}>
          ${this.isExpanded ? chevronDownIcon : chevronRightIcon}
        </md-icon-button>
        ${when(
          this.isExpanded,
          () =>
            html`<harvest-history-item-details
              .harvest=${this.harvest}
            ></harvest-history-item-details>`
        )}
      </div>
    `;
  }
}
customElements.define("harvest-history-item", HarvestHistoryItem);

class HistoryTabContent extends LitElement {
  static properties = {
    recentHarvests: { type: Array },
    expandedHistoryId: { type: Number },
    isLoading: { type: Boolean },
  };

  static styles = css`
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .history-header h3 {
      margin: 0;
      font-size: 18px;
      color: var(--md-sys-color-on-surface);
    }
    .harvest-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      height: calc(100vh - 480px);
      overflow-y: auto;
      padding-right: 8px;
    }
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .empty-state h4 {
      margin: 0 0 8px;
      color: var(--md-sys-color-on-surface);
    }
    .loading-state {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 48px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .refresh-button {
      --md-outlined-button-icon-size: 18px;
    }
  `;

  _handleToggleExpansion(e) {
    this.dispatchEvent(
      new CustomEvent("toggle-history-expansion", {
        detail: e.detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleRefresh() {
    this.dispatchEvent(
      new CustomEvent("refresh-history", {
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (this.isLoading) {
      return html`
        <div class="loading-state">
          <md-circular-progress indeterminate></md-circular-progress>
          <span style="margin-left: 16px;">Loading harvest history...</span>
        </div>
      `;
    }

    if (!this.recentHarvests || this.recentHarvests.length === 0) {
      return html`
        <div class="history-header">
          <h3>Recent Harvests</h3>
          <md-outlined-button
            class="refresh-button"
            @click=${this._handleRefresh}
          >
            <md-icon slot="icon">refresh</md-icon>
            Refresh
          </md-outlined-button>
        </div>
        <div class="empty-state">
          <h4>No harvest history found</h4>
          <p>
            Run your first harvest using the Manual Harvest tab to see results
            here.
          </p>
        </div>
      `;
    }

    return html`
      <div class="history-header">
        <h3>Recent Harvests (${this.recentHarvests.length})</h3>
        <md-outlined-button
          class="refresh-button"
          @click=${this._handleRefresh}
        >
          <md-icon slot="icon">refresh</md-icon>
          Refresh
        </md-outlined-button>
      </div>

      <div class="harvest-list">
        ${repeat(
          this.recentHarvests,
          (h) => h.id,
          (harvest) => html`
            <harvest-history-item
              .harvest=${harvest}
              .isExpanded=${this.expandedHistoryId === harvest.id}
              @toggle-item-expansion=${this._handleToggleExpansion}
            ></harvest-history-item>
          `
        )}
      </div>
    `;
  }
}

customElements.define("history-tab-content", HistoryTabContent);
export { HistoryTabContent };

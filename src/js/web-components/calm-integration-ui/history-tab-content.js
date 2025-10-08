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
        <dt>Attempted</dt>
        <dd>${this.harvest.attempted ?? 0}</dd>
        <dt>Successful</dt>
        <dd>${this.harvest.successful ?? 0}</dd>
        <dt>Failed</dt>
        <dd class="${(this.harvest.failed ?? 0) > 0 ? 'failed' : ''}">${
          this.harvest.failed ?? 0
        }</dd>
        <dt>Duration</dt>
        <dd>${this.harvest.duration}</dd>
        ${when(
          this.harvest.summary,
          () => html`
            <dt>Summary</dt>
            <dd>${this.harvest.summary}</dd>
          `
        )}
        ${when(
          !this.harvest.success && this.harvest.error,
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
  "calm-harvest-history-item-details",
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
      flex-wrap: wrap;
    }
    @media (max-width: 720px) {
      .harvest-item {
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto;
        gap: 12px;
        align-items: flex-start;
      }

      .harvest-status {
        width: 40px;
        height: 40px;
      }

      .harvest-item md-icon-button {
        grid-column: 2;
        justify-self: end;
      }
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
              <span>${this.harvest.source}</span>
              <span>
                Attempted: ${this.harvest.attempted ?? 0} •
                Success: ${this.harvest.successful ?? 0} •
                Failed: ${this.harvest.failed ?? 0}
              </span>
              <span>Duration: ${this.harvest.duration}</span>
              ${when(
                this.harvest.summary,
                () => html`<span>Summary: ${this.harvest.summary}</span>`
              )}
            </div>
        </div>
        <md-icon-button @click=${this._toggleExpansion}>
          ${this.isExpanded ? chevronDownIcon : chevronRightIcon}
        </md-icon-button>
        ${when(
          this.isExpanded,
          () =>
            html`<calm-harvest-history-item-details
              .harvest=${this.harvest}
            ></calm-harvest-history-item-details>`
        )}
      </div>
    `;
  }
}
customElements.define("calm-harvest-history-item", HarvestHistoryItem);

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
      gap: 12px;
      flex-wrap: wrap;
    }
    .history-header h3 {
      margin: 0;
      font-size: 18px;
      color: var(--md-sys-color-on-surface);
    }
    @media (max-width: 600px) {
      .history-header {
        flex-direction: column;
        align-items: stretch;
      }

      .history-header md-outlined-button {
        width: 100%;
      }
    }
    .harvest-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
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
            <calm-harvest-history-item
              .harvest=${harvest}
              .isExpanded=${this.expandedHistoryId === harvest.id}
              @toggle-item-expansion=${this._handleToggleExpansion}
            ></calm-harvest-history-item>
          `
        )}
      </div>
    `;
  }
}

customElements.define("calm-history-tab-content", HistoryTabContent);
export { HistoryTabContent };

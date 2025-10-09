import { LitElement, html, css } from "lit";
import { when } from "lit/directives/when.js";

import "@material/web/textfield/outlined-text-field.js";
import "@material/web/button/filled-button.js";
import "@material/web/progress/linear-progress.js";
import "@material/web/checkbox/checkbox.js";

import { playIcon, textboxIcon } from "../utils/icons.js";

class ManualHarvestByIdsPanel extends LitElement {
  static properties = {
    manualHarvestIds: { type: String },
    isManualHarvesting: { type: Boolean },
  };

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
    .input-hint {
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
      margin-top: 8px;
    }
    .button-group {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 24px;
      justify-content: flex-end;
    }

    @media (max-width: 600px) {
      .button-group {
        justify-content: flex-start;
      }

      .button-group md-outlined-button,
      .button-group md-filled-button {
        width: 100%;
      }
    }
    md-filled-button span {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ids-textarea {
      width: 100%;
      min-height: 120px;
    }
    .preview-section {
      margin-top: 16px;
      padding: 12px;
      background: var(--md-sys-color-surface-container);
      border-radius: 8px;
      border: 1px solid var(--md-sys-color-outline-variant);
    }
    .preview-header {
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      margin-bottom: 8px;
    }
    .preview-count {
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
    }
  `;

  get parsedIds() {
    return this.manualHarvestIds
      .split("\n")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  }

  get hasValidIds() {
    return this.parsedIds.length > 0;
  }

  _handleInput(e) {
    this.dispatchEvent(
      new CustomEvent("update-manual-ids", {
        detail: { value: e.target.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  _startHarvest() {
    if (!this.hasValidIds) return;

    this.dispatchEvent(
      new CustomEvent("run-harvest-ids", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _clearIds() {
    this.dispatchEvent(
      new CustomEvent("update-manual-ids", {
        detail: { value: "" },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    const idCount = this.parsedIds.length;

    return html`
      <div class="form-section">
        <h3><span>${textboxIcon}</span>Harvest by Identifier</h3>
        <p>
          Enter the unique CALM record identifiers you want to harvest, one per
          line.
        </p>

        <md-outlined-text-field
          type="textarea"
          rows="6"
          label="Record Identifiers (one per line)"
          .value=${this.manualHarvestIds}
          @input=${this._handleInput}
          class="ids-textarea"
          ?disabled=${this.isManualHarvesting}
        ></md-outlined-text-field>

        <div class="input-hint">Example: REC/001/A, DOC/452, PHO/199/B</div>

        ${when(
          idCount > 0,
          () => html`
            <div class="preview-section">
              <div class="preview-header">Ready to harvest:</div>
              <div class="preview-count">
                ${idCount} record${idCount === 1 ? "" : "s"} will be processed
              </div>
            </div>
          `
        )}
      </div>

      <div class="button-group">
        ${when(
          this.manualHarvestIds.trim(),
          () => html`
            <md-outlined-button
              @click=${this._clearIds}
              ?disabled=${this.isManualHarvesting}
            >
              Clear
            </md-outlined-button>
          `
        )}

        <md-filled-button
          @click=${this._startHarvest}
          ?disabled=${!this.hasValidIds || this.isManualHarvesting}
        >
          <span>
            ${playIcon}
            ${this.isManualHarvesting
              ? "Harvesting..."
              : `Harvest ${idCount > 0 ? idCount : ""} Record${
                  idCount === 1 ? "" : "s"
                }`}
          </span>
        </md-filled-button>
      </div>
    `;
  }
}

customElements.define("calm-manual-harvest-by-ids-panel", ManualHarvestByIdsPanel);
export { ManualHarvestByIdsPanel };

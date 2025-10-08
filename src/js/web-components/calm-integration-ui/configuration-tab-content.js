// configuration-tab-content.js

import { LitElement, html, css } from "lit";
import { repeat } from "lit/directives/repeat.js";

import "@material/web/button/text-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/button/filled-button.js";
import "@material/web/select/outlined-select.js";
import "@material/web/select/select-option.js";
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/iconbutton/icon-button.js";

import {
  helpCircleIcon,
  plusIcon,
  powerPlugIcon,
  restartIcon,
  saveIcon,
  deleteIcon,
} from "../utils/icons.js";

class QueryFilterRow extends LitElement {
  static properties = {
    filter: { type: Object },
    index: { type: Number },
  };

  static styles = css`
    .filter-row {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
      gap: 12px;
      align-items: center;
      margin-bottom: 12px;
    }

    md-outlined-select,
    md-outlined-text-field {
      width: 100%;
    }

    .filter-row md-icon-button,
    .remove-placeholder {
      justify-self: flex-start;
    }

    .remove-placeholder {
      width: 40px;
      height: 40px;
    }

    @media (max-width: 960px) {
      .filter-row {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .filter-row md-icon-button,
      .remove-placeholder {
        grid-column: 2;
        justify-self: flex-end;
      }
    }

    @media (max-width: 600px) {
      .filter-row {
        grid-template-columns: minmax(0, 1fr);
      }

      .filter-row md-icon-button,
      .remove-placeholder {
        grid-column: 1;
        justify-self: flex-start;
      }
    }
  `;

  _updateFilter(e, property) {
    let value = e.target.value;
    let additionalUpdates = {};

    // If changing the field, reset condition to appropriate default
    if (property === "field") {
      const isDateField = ["modified_date", "created_date"].includes(value);
      const currentCondition = this.filter.condition;

      // Check if current condition is valid for the new field type
      const dateConditions = ["since", "before", "on"];
      const textConditions = ["contains", "equals", "starts_with"];

      if (isDateField && !dateConditions.includes(currentCondition)) {
        // Reset to default date condition
        additionalUpdates.condition = "since";
      } else if (!isDateField && !textConditions.includes(currentCondition)) {
        // Reset to default text condition
        additionalUpdates.condition = "contains";
      }
    }

    this.dispatchEvent(
      new CustomEvent("update-filter-row", {
        detail: {
          index: this.index,
          property,
          value,
          additionalUpdates,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _removeFilter() {
    this.dispatchEvent(
      new CustomEvent("remove-filter-row", {
        detail: { index: this.index },
        bubbles: true,
        composed: true,
      })
    );
  }

  // Add this method to handle updates after the component re-renders
  updated(changedProperties) {
    super.updated(changedProperties);

    // If the filter object changed, make sure the select elements reflect the current values
    if (changedProperties.has("filter")) {
      // Use setTimeout to ensure the DOM is fully updated
      setTimeout(() => {
        const conditionSelect = this.shadowRoot.querySelector(
          'md-outlined-select[label="Condition"]'
        );
        const fieldSelect = this.shadowRoot.querySelector(
          'md-outlined-select[label="Field"]'
        );
        const valueField = this.shadowRoot.querySelector(
          'md-outlined-text-field[label="Value"]'
        );

        if (
          conditionSelect &&
          this.filter.condition &&
          conditionSelect.value !== this.filter.condition
        ) {
          conditionSelect.value = this.filter.condition;
        }

        if (
          fieldSelect &&
          this.filter.field &&
          fieldSelect.value !== this.filter.field
        ) {
          fieldSelect.value = this.filter.field;
        }

        if (
          valueField &&
          this.filter.value !== undefined &&
          valueField.value !== this.filter.value
        ) {
          valueField.value = this.filter.value;
        }
      }, 10);
    }
  }

  // Add firstUpdated to handle initial render
  firstUpdated() {
    // Ensure select elements are properly initialized on first render
    setTimeout(() => {
      const conditionSelect = this.shadowRoot.querySelector(
        'md-outlined-select[label="Condition"]'
      );
      const fieldSelect = this.shadowRoot.querySelector(
        'md-outlined-select[label="Field"]'
      );

      if (conditionSelect && this.filter.condition) {
        conditionSelect.value = this.filter.condition;
      }

      if (fieldSelect && this.filter.field) {
        fieldSelect.value = this.filter.field;
      }
    }, 50);
  }

  render() {
    const showDateHelp = ["modified_date", "created_date"].includes(
      this.filter.field
    );

    return html`
      <div class="filter-row">
        <md-outlined-select
          label="Field"
          .value=${this.filter.field}
          @change=${(e) => this._updateFilter(e, "field")}
        >
          <md-select-option value="modified_date">
            <div slot="headline">Modified Date</div>
          </md-select-option>
          <md-select-option value="created_date">
            <div slot="headline">Created Date</div>
          </md-select-option>
          <md-select-option value="title">
            <div slot="headline">Title</div>
          </md-select-option>
          <md-select-option value="description">
            <div slot="headline">Description</div>
          </md-select-option>
          <md-select-option value="reference">
            <div slot="headline">Reference Number</div>
          </md-select-option>
        </md-outlined-select>

        <md-outlined-select
          label="Condition"
          .value=${this.filter.condition}
          @change=${(e) => this._updateFilter(e, "condition")}
        >
          ${showDateHelp
            ? html`
                <md-select-option value="since">
                  <div slot="headline">Is After</div>
                </md-select-option>
                <md-select-option value="before">
                  <div slot="headline">Is Before</div>
                </md-select-option>
                <md-select-option value="on">
                  <div slot="headline">Is On</div>
                </md-select-option>
              `
            : html`
                <md-select-option value="contains">
                  <div slot="headline">Contains</div>
                </md-select-option>
                <md-select-option value="equals">
                  <div slot="headline">Equals</div>
                </md-select-option>
                <md-select-option value="starts_with">
                  <div slot="headline">Starts With</div>
                </md-select-option>
              `}
        </md-outlined-select>

        <md-outlined-text-field
          label="Value"
          .value=${this.filter.value || ""}
          @input=${(e) => this._updateFilter(e, "value")}
        ></md-outlined-text-field>

        ${this.index > 0
          ? html`
              <md-icon-button
                @click=${this._removeFilter}
                title="Remove filter"
              >
                ${deleteIcon}
              </md-icon-button>
            `
          : html`<div class="remove-placeholder"></div>`}
      </div>
    `;
  }
}
customElements.define("query-filter-row", QueryFilterRow);

class ConfigurationTabContent extends LitElement {
  static properties = {
    queryFilters: { type: Array },
    isLoading: { type: Boolean },
    hasConfig: { type: Boolean }, // New property to track if config exists
  };

  constructor() {
    super();
    // Initialize with default values to prevent undefined errors
    this.queryFilters = [];
    this.isLoading = false;
    this.hasConfig = true; // Default to true, will be set to false when API returns no_config
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
    .query-builder-group {
      background: var(--md-sys-color-surface-1);
      border-radius: 8px;
      padding: 16px;
      border-left: 3px solid var(--md-sys-color-primary);
    }
    .criteria-hint {
      background: var(--md-sys-color-surface-container);
      border-radius: 6px;
      padding: 8px 12px;
      margin-top: 16px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .button-group {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 24px;
      justify-content: flex-end;
      align-items: center;
      row-gap: 16px;
    }
    .schedule-info {
      background: var(--md-sys-color-surface-container);
      border-radius: 8px;
      padding: 12px 16px;
      margin-top: 16px;
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
    }
    .status-indicator.enabled {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }
    .status-indicator.disabled {
      background: var(--md-sys-color-error-container);
      color: var(--md-sys-color-on-error-container);
    }
    md-text-button span,
    md-outlined-button span,
    md-filled-button span {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .validation-message {
      color: var(--md-sys-color-error);
      font-size: 14px;
      margin-right: auto;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .no-config-banner {
      background: var(--md-sys-color-tertiary-container);
      color: var(--md-sys-color-on-tertiary-container);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      border-left: 4px solid var(--md-sys-color-tertiary);
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .no-config-banner .icon {
      font-size: 24px;
      margin-top: 2px;
    }
    .no-config-banner .content {
      flex: 1;
    }
    .no-config-banner h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
    }
    .no-config-banner p {
      margin: 0 0 12px 0;
      font-size: 14px;
      line-height: 1.4;
    }
    .no-config-banner .action {
      margin-top: 8px;
    }
    .disabled-overlay {
      position: relative;
    }
    .disabled-overlay::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--md-sys-color-surface);
      opacity: 0.7;
      border-radius: 8px;
      pointer-events: none;
    }
    .disabled-overlay > * {
      opacity: 0.4;
    }

    @media (max-width: 720px) {
      .form-section p {
        max-width: 100%;
      }

      .button-group {
        justify-content: flex-start;
      }

      .button-group md-outlined-button,
      .button-group md-filled-button {
        width: 100%;
      }

      .validation-message {
        width: 100%;
        margin-right: 0;
      }
    }
  `;

  _dispatch(eventName, detail = {}) {
    this.dispatchEvent(
      new CustomEvent(eventName, { detail, bubbles: true, composed: true })
    );
  }

  _handleUpdateQueryFilter(e) {
    const { index, property, value, additionalUpdates } = e.detail;

    // Create a deep copy to avoid reference issues
    const newFilters = this.queryFilters.map((filter, i) => {
      if (i === index) {
        return {
          ...filter,
          [property]: value,
          // Apply any additional updates (like condition reset)
          ...(additionalUpdates || {}),
        };
      }
      return { ...filter }; // Create copy of other filters too
    });

    this.queryFilters = newFilters;

    // Also dispatch to parent with the updated filters
    this._dispatch("update-query-filter", {
      index,
      property,
      value,
      additionalUpdates,
      allFilters: newFilters,
    });
  }

  _hasDateFields() {
    // Add safety check to ensure queryFilters is an array
    if (!Array.isArray(this.queryFilters)) {
      return false;
    }
    return this.queryFilters.some((filter) =>
      ["modified_date", "created_date"].includes(filter.field)
    );
  }

  _hasEmptyValues() {
    // Add safety check for queryFilters
    const safeQueryFilters = Array.isArray(this.queryFilters)
      ? this.queryFilters
      : [];

    return safeQueryFilters.some(
      (filter) =>
        !filter.field ||
        !filter.condition ||
        !filter.value ||
        filter.value.toString().trim() === ""
    );
  }

  _getValidationMessage() {
    if (this._hasEmptyValues()) {
      return "Please fill in all criteria fields before saving.";
    }
    return null;
  }

  _handleGetStarted() {
    // Add a default filter to get the user started
    this._dispatch("add-query-filter");
  }

  render() {
    // Add safety check for queryFilters
    const safeQueryFilters = Array.isArray(this.queryFilters)
      ? this.queryFilters
      : [];

    const hasEmptyValues = this._hasEmptyValues();
    const validationMessage = this._getValidationMessage();

    return html`
      ${!this.hasConfig
        ? html`
            <div class="no-config-banner">
              <div class="icon">⚙️</div>
              <div class="content">
                <h4>No Automated Harvest Configuration Found</h4>
                <p>
                  Automated harvesting is not currently set up. You need to
                  create harvest criteria and save your configuration before the
                  system can automatically harvest records from CALM into
                  Soteria+.
                </p>
                <p>
                  <strong>What happens next:</strong> Once you set up your
                  criteria and save the configuration, the system will run daily
                  harvests based on your rules.
                </p>
                <div class="action">
                  <md-filled-button @click=${this._handleGetStarted}>
                    <span>${plusIcon} Get Started - Add First Criteria</span>
                  </md-filled-button>
                </div>
              </div>
            </div>
          `
        : ""}

      <div class="form-section">
        <h3>
          Automated Harvest Criteria
          <md-icon-button
            @click=${() => this._dispatch("open-variables-dialog")}
            title="View available date variables"
          >
            ${helpCircleIcon}
          </md-icon-button>
        </h3>
        <p>
          Define the rules for automatically harvesting records from CALM into
          Soteria+. The system will run a harvest based on these criteria daily.
        </p>

        <div
          class="query-builder-group ${!this.hasConfig
            ? "disabled-overlay"
            : ""}"
        >
          ${repeat(
            safeQueryFilters,
            (f, i) => i,
            (filter, index) => html`
              <query-filter-row
                .filter=${filter}
                .index=${index}
                @update-filter-row=${(e) => this._handleUpdateQueryFilter(e)}
                @remove-filter-row=${(e) =>
                  this._dispatch("remove-query-filter", e.detail)}
              ></query-filter-row>
            `
          )}
          <md-text-button
            @click=${() => this._dispatch("add-query-filter")}
            ?disabled=${!this.hasConfig && safeQueryFilters.length === 0}
          >
            <span>${plusIcon} Add Criteria</span>
          </md-text-button>

          ${this._hasDateFields()
            ? html`
                <div class="criteria-hint">
                  💡 Click the help icon above to see available date variables
                  (LAST_HARVEST, TODAY, etc.)
                </div>
              `
            : ""}
        </div>
      </div>

      

      <div class="button-group">
        ${validationMessage
          ? html`
              <div class="validation-message">⚠️ ${validationMessage}</div>
            `
          : ""}

        <md-outlined-button
          @click=${() => this._dispatch("reset-configuration")}
          ?disabled=${this.isLoading || !this.hasConfig}
        >
          <span>${restartIcon} Reset to Defaults</span>
        </md-outlined-button>
        <md-filled-button
          @click=${() => this._dispatch("save-configuration")}
          ?disabled=${this.isLoading || hasEmptyValues}
        >
          <span
            >${saveIcon}
            ${this.isLoading ? "Saving..." : "Save Configuration"}</span
          >
        </md-filled-button>
      </div>
    `;
  }
}

customElements.define("configuration-tab-content", ConfigurationTabContent);
export default ConfigurationTabContent;

import { LitElement, html, css, nothing } from "lit";
import { map } from "lit/directives/map.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/button/text-button.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/radio/radio.js";
import "@material/web/icon/icon.js";
import "../../utils/penwern-spinner.js";
import {
  chevronLeftIcon,
  chevronRightIcon,
  documentIcon,
  hierarchyIcon,
  pinIcon,
  checkCircleIcon,
  alertCircleIcon,
} from "../../utils/icons.js";
import { highlightText } from "../utils/search-helpers.js";

/**
 * Detail panel component showing selected record information and actions.
 */
class AsDetailPanel extends LitElement {
  static properties = {
    node: { type: Object },
    breadcrumbs: { type: Array },
    selectedRecordIds: { type: Array },
    detailLevelMode: { type: String },
    perFileMode: { type: String },
    createFoldersLoading: { type: Boolean },
    createFoldersFeedback: { type: Object },
    searchQuery: { type: String },
    isSearchResult: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      overflow-y: auto;
      background: var(--md-sys-color-surface-1);
      padding: 8px;
    }

    :host::-webkit-scrollbar {
      width: 8px;
    }

    :host::-webkit-scrollbar-thumb {
      background: var(--md-sys-color-outline-variant);
      border-radius: 4px;
    }

    .detail-section {
      background: var(--md-sys-color-surface);
      border: 1px solid var(--md-sys-color-outline-variant-50, rgba(0, 0, 0, 0.08));
      border-radius: 12px;
      padding: 16px;
      margin: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .detail-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 14px 0;
      font-size: 12px;
      font-weight: 600;
      color: var(--md-sys-color-primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-section h3 md-icon,
    .detail-section h3 .section-icon {
      --md-icon-size: 18px;
    }

    .detail-section h3 .section-icon svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    .selection-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 12px 0;
    }

    .selection-summary {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface);
      font-weight: 500;
    }

    .selection-carousel {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .selection-pips {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .selection-pip {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: transparent;
      padding: 0;
      cursor: pointer;
    }

    .selection-pip.active {
      background: var(--md-sys-color-primary);
      border-color: var(--md-sys-color-primary);
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }

    .info-grid {
      display: grid;
      gap: 14px;
    }

    .info-row {
      display: grid;
      gap: 2px;
    }

    .info-label {
      font-size: 11px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

	    .info-value {
	      font-size: 14px;
	      font-weight: 500;
	      color: var(--md-sys-color-on-surface);
	      line-height: 1.4;
	      display: flex;
	      align-items: center;
	      gap: 6px;
	    }

	    .info-value-text {
	      flex: 1;
	      min-width: 0;
	    }

    .info-value md-icon,
    .info-value .value-icon {
      --md-icon-size: 16px;
      color: var(--md-sys-color-on-surface-variant);
    }

    .info-value .value-icon svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }

    .breadcrumb {
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.5;
    }

    .breadcrumb-item:last-child {
      color: var(--md-sys-color-on-surface);
      font-weight: 500;
    }

    .type-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .type-badge.collection {
      background: var(--md-sys-color-tertiary-container);
      color: var(--md-sys-color-on-tertiary-container);
    }

    .type-badge.series {
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
    }

    .type-badge.box,
    .type-badge.folder {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }

    .type-badge.item {
      background: var(--md-sys-color-surface-3);
      color: var(--md-sys-color-on-surface-variant);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge .status-icon {
      --md-icon-size: 16px;
    }

    .status-badge .status-icon svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }

    .status-badge.success {
      background: rgba(0, 109, 67, 0.16);
      color: #004d2a;
    }

    .status-badge.warning {
      background: rgba(126, 87, 0, 0.16);
      color: #604200;
    }

    .status-badge.error {
      background: var(--md-sys-color-error-container);
      color: var(--md-sys-color-on-error-container);
    }

	    .actions {
	      display: flex;
	      flex-direction: column;
	      gap: 12px;
	    }

	    .create-folders-button {
	      min-width: 140px;
	      justify-content: center;
	    }

	    .create-folders-spinner {
	      display: inline-flex;
	      align-items: center;
	      justify-content: center;
	      min-height: 20px;
	    }

	    .action-feedback {
	      display: flex;
	      align-items: center;
	      gap: 8px;
	      padding: 10px 12px;
	      border-radius: 10px;
	      border: 1px solid var(--md-sys-color-outline-variant);
	      background: var(--md-sys-color-surface-1);
	      font-size: 13px;
	      line-height: 1.35;
	      margin-top: 12px;
	    }

	    .action-feedback.success {
	      border-color: rgba(0, 109, 67, 0.25);
	      background: rgba(0, 109, 67, 0.10);
	      color: #004d2a;
	    }

	    .action-feedback.error {
	      border-color: rgba(179, 38, 30, 0.25);
	      background: rgba(179, 38, 30, 0.10);
	      color: #5f110b;
	    }

	    .action-feedback .feedback-icon {
	      display: inline-flex;
	      align-items: center;
	      justify-content: center;
	      color: inherit;
	    }

	    .action-feedback .feedback-icon svg {
	      width: 18px;
	      height: 18px;
	      fill: currentColor;
	    }

	    .action-settings {
	      display: flex;
	      flex-direction: column;
	      gap: 16px;
	    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .radio-group-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant);
      letter-spacing: 0.05em;
    }

    .radio-options {
      display: inline-flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }

    .radio-option {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--md-sys-color-on-surface);
    }

    .radio-option md-radio[disabled] {
      opacity: 0.5;
    }

    .multi-action-note {
      font-size: 12px;
      margin-bottom: 6px;
      color: var(--md-sys-color-on-surface-variant);
    }

    .search-highlight {
      background: var(--md-sys-color-tertiary-container);
      color: var(--md-sys-color-on-tertiary-container);
      border-radius: 4px;
      padding: 0 2px;
      font-weight: 600;
    }

    .empty-state {
      display: grid;
      place-items: center;
      height: 100%;
      text-align: center;
      color: var(--md-sys-color-on-surface-variant);
      padding: 24px;
    }

    .empty-state .empty-icon {
      --md-icon-size: 40px;
      margin-bottom: 12px;
      opacity: 0.7;
    }

    .empty-state .empty-icon svg {
      width: 40px;
      height: 40px;
      fill: currentColor;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
    }
  `;

  constructor() {
    super();
    this.node = null;
    this.breadcrumbs = [];
    this.selectedRecordIds = [];
    this.detailLevelMode = "per-file";
    this.perFileMode = "components";
    this.createFoldersLoading = false;
    this.createFoldersFeedback = null;
    this.searchQuery = "";
    this.isSearchResult = false;
  }

  _getCurrentSelectionIndex() {
    const selected = Array.isArray(this.selectedRecordIds)
      ? this.selectedRecordIds
      : [];
    if (!selected.length) return -1;

    const node = this.node || {};
    const candidates = [
      node.uri,
      node.id,
      node.logicalId,
      node.record_uri,
      node.ref,
    ].filter(
      (value) => value != null && `${value}`.trim() !== ""
    );
    if (!candidates.length) return -1;

    const directIndex = selected.findIndex((id) => candidates.includes(id));
    if (directIndex !== -1) {
      return directIndex;
    }

    // Fallback: selection IDs are sometimes URIs while the node ID is a numeric/string identifier.
    // If any selected URI ends with `/<candidate>`, treat it as a match.
    const candidateStrings = candidates.map((value) => `${value}`.trim());
    return selected.findIndex((id) => {
      if (id == null) return false;
      const idString = `${id}`.trim();
      if (!idString) return false;
      return candidateStrings.some((candidate) =>
        idString.endsWith(`/${candidate}`)
      );
    });
  }

  render() {
    if (!this.node) {
      return this._renderEmptyState();
    }

    const hasMultipleSelection = this.selectedRecordIds?.length > 1;
    const isPerFile = this.detailLevelMode === "per-file";

    // Determine which content to highlight based on search
    const titleContent = this.searchQuery
      ? highlightText(this.node.title, this.searchQuery)
      : this.node.title;
    const identifierContent = this.searchQuery
      ? highlightText(this.node.code || "N/A", this.searchQuery)
      : this.node.code || "N/A";
    const locationContent =
      this.node.location && this.searchQuery
        ? highlightText(this.node.location, this.searchQuery)
        : this.node.location;

    return html`
      ${this._renderSelectionSummary()}

      <div class="detail-section">
        <h3>
          <span class="section-icon">${documentIcon}</span>
          ${this.isSearchResult ? "Search Result" : "Record Details"}
        </h3>
        <div class="info-grid">
	          <div class="info-row">
	            <div class="info-label">Title</div>
	            <div class="info-value">
	              <span class="info-value-text">${titleContent}</span>
	            </div>
	          </div>
          <div class="info-row">
            <div class="info-label">Status</div>
            <div class="info-value">
              ${this._renderStatusBadge(this.node.status, this.node.statusType)}
            </div>
          </div>
	          <div class="info-row">
	            <div class="info-label">Identifier</div>
	            <div class="info-value">
	              <span class="info-value-text">${identifierContent}</span>
	            </div>
	          </div>
          <div class="info-row">
            <div class="info-label">Type</div>
            <div class="info-value">
              <span class="type-badge ${this.node.type}">${this.node.type}</span>
            </div>
          </div>
	          ${this.node.location
	            ? html`
	                <div class="info-row">
	                  <div class="info-label">Location</div>
	                  <div class="info-value">
	                    <span class="value-icon">${pinIcon}</span>
	                    <span class="info-value-text">${locationContent}</span>
	                  </div>
	                </div>
	              `
	            : nothing}
          ${this.node.extent
            ? html`
                <div class="info-row">
                  <div class="info-label">Extent</div>
                  <div class="info-value">${this.node.extent}</div>
                </div>
              `
            : nothing}
          ${this.node.updated
            ? html`
                <div class="info-row">
                  <div class="info-label">Last Updated</div>
                  <div class="info-value">${this.node.updated}</div>
                </div>
              `
            : nothing}
        </div>
      </div>

      ${this.breadcrumbs?.length
        ? html`
            <div class="detail-section">
              <h3>
                <span class="section-icon">${hierarchyIcon}</span>
                Hierarchy
              </h3>
              <div class="breadcrumb">
                ${map(
                  this.breadcrumbs,
                  (crumb) => html`<span class="breadcrumb-item">${crumb}</span> `
                )}
              </div>
            </div>
          `
        : nothing}

      <div class="detail-section">
        <h3>Quick Actions</h3>
        ${hasMultipleSelection
          ? html`<div class="multi-action-note">
              Applies to all ${this.selectedRecordIds.length} selected records.
            </div>`
          : nothing}
        <div class="actions">
          <div class="action-settings">
            <div class="radio-group">
              <div class="radio-group-label">File Detail Level</div>
              <div class="radio-options">
                ${this._renderDetailLevelOption("per-file", "Per file")}
                ${this._renderDetailLevelOption("per-aip", "Per AIP")}
              </div>
            </div>
            <div class="radio-group">
              <div class="radio-group-label">Per file handling</div>
              <div class="radio-options">
                ${this._renderPerFileOption("components", "As components", !isPerFile)}
                ${this._renderPerFileOption("records", "As records", !isPerFile)}
              </div>
            </div>
          </div>
          <div class="actions">
            <md-filled-button
              class="create-folders-button"
              ?disabled=${this.createFoldersLoading}
              @click=${() => this._handleAction("create-folders")}
            >
              ${this.createFoldersLoading
                ? html`<span class="create-folders-spinner"
                    ><penwern-spinner size="20"></penwern-spinner
                  ></span>`
                : "Create folders"}
            </md-filled-button>
            <md-outlined-button @click=${() => this._handleAction("open-archivesspace")}>
              Open in ArchivesSpace
            </md-outlined-button>
          </div>
          ${this.createFoldersFeedback?.message
            ? html`
                <div class="action-feedback ${this.createFoldersFeedback.type || "info"}">
                  <span class="feedback-icon">
                    ${this.createFoldersFeedback.type === "success"
                      ? checkCircleIcon
                      : this.createFoldersFeedback.type === "error"
                      ? alertCircleIcon
                      : pinIcon}
                  </span>
                  <span>${this.createFoldersFeedback.message}</span>
                </div>
              `
            : nothing}
        </div>
      </div>
    `;
  }

  _renderEmptyState() {
    return html`
      <div class="empty-state">
        <span class="empty-icon">${documentIcon}</span>
        <p><strong>Select an item</strong></p>
        <p>Choose an item from the tree to see its details.</p>
      </div>
    `;
  }

  _renderSelectionSummary() {
    if (!this.selectedRecordIds?.length) return nothing;

    const activeIndex = this._getCurrentSelectionIndex();
    const safeIndex = activeIndex === -1 ? 0 : activeIndex;
    const disablePrev = safeIndex <= 0;
    const disableNext = safeIndex >= this.selectedRecordIds.length - 1;

    const MAX_VISIBLE_PIPS = 5;
    let startIndex = 0;
    let endIndex = this.selectedRecordIds.length;

    if (this.selectedRecordIds.length > MAX_VISIBLE_PIPS) {
      const halfWindow = Math.floor(MAX_VISIBLE_PIPS / 2);
      startIndex = Math.max(0, safeIndex - halfWindow);
      endIndex = startIndex + MAX_VISIBLE_PIPS;

      if (endIndex > this.selectedRecordIds.length) {
        endIndex = this.selectedRecordIds.length;
        startIndex = endIndex - MAX_VISIBLE_PIPS;
      }
    }

    return html`
      <div class="selection-toolbar">
        <div class="selection-summary">
          <span>${this.selectedRecordIds.length} selected</span>
          <md-text-button @click=${this._handleClearSelection}>Clear</md-text-button>
        </div>
        ${this.selectedRecordIds.length > 1
          ? html`
              <div class="selection-carousel">
                <md-icon-button
                  ?disabled=${disablePrev}
                  @click=${this._handlePrevSelection}
                >
                  ${chevronLeftIcon}
                </md-icon-button>
                <div class="selection-pips">
                  ${map(
                    this.selectedRecordIds.slice(startIndex, endIndex),
                    (id, idx) => {
                      const globalIndex = startIndex + idx;
                      return html`
                        <button
                          type="button"
                          class="selection-pip ${globalIndex === safeIndex ? "active" : ""}"
                          @click=${() => this._handleNavigateSelection(globalIndex)}
                        >
                          <span class="visually-hidden">Selected record ${globalIndex + 1}</span>
                        </button>
                      `;
                    }
                  )}
                </div>
                <md-icon-button
                  ?disabled=${disableNext}
                  @click=${this._handleNextSelection}
                >
                  ${chevronRightIcon}
                </md-icon-button>
              </div>
            `
          : nothing}
      </div>
    `;
  }

  _renderStatusBadge(status, statusType) {
    const iconMap = {
      success: checkCircleIcon,
      warning: alertCircleIcon,
      error: alertCircleIcon,
    };
    const statusIcon = iconMap[statusType];

    return html`
      <span class="status-badge ${statusType || "neutral"}">
        ${statusIcon
          ? html`<span class="status-icon">${statusIcon}</span>`
          : nothing}
        ${status || "Available"}
      </span>
    `;
  }

  _renderDetailLevelOption(value, label) {
    return html`
      <label class="radio-option">
        <md-radio
          name="detail-level"
          value=${value}
          ?checked=${this.detailLevelMode === value}
          @change=${this._handleDetailLevelChange}
        ></md-radio>
        <span>${label}</span>
      </label>
    `;
  }

  _renderPerFileOption(value, label, disabled = false) {
    return html`
      <label class="radio-option">
        <md-radio
          name="per-file-mode"
          value=${value}
          ?checked=${this.perFileMode === value}
          ?disabled=${disabled}
          @change=${this._handlePerFileModeChange}
        ></md-radio>
        <span>${label}</span>
      </label>
    `;
  }

  _handleClearSelection() {
    this.dispatchEvent(
      new CustomEvent("clear-selection", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _handlePrevSelection() {
    const currentIndex = this._getCurrentSelectionIndex();
    if (currentIndex > 0) {
      this._handleNavigateSelection(currentIndex - 1);
    }
  }

  _handleNextSelection() {
    const currentIndex = this._getCurrentSelectionIndex();
    if (currentIndex < this.selectedRecordIds.length - 1) {
      this._handleNavigateSelection(currentIndex + 1);
    }
  }

  _handleNavigateSelection(index) {
    this.dispatchEvent(
      new CustomEvent("navigate-selection", {
        detail: { index },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleDetailLevelChange(e) {
    const value = e.target?.value;
    if (!value) return;
    this.dispatchEvent(
      new CustomEvent("detail-level-change", {
        detail: { value },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handlePerFileModeChange(e) {
    const value = e.target?.value;
    if (!value) return;
    this.dispatchEvent(
      new CustomEvent("per-file-mode-change", {
        detail: { value },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleAction(action) {
    this.dispatchEvent(
      new CustomEvent("action-click", {
        detail: { action },
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("as-detail-panel", AsDetailPanel);

export { AsDetailPanel };

import { LitElement, html, css, nothing } from "lit";
import { map } from "lit/directives/map.js";
import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/checkbox/checkbox.js";
import "@material/web/icon/icon.js";
import "./as-pagination.js";
import {
  databaseIcon,
  layersIcon,
  documentIcon,
  folderIcon,
} from "../../utils/icons.js";
import { highlightText } from "../utils/search-helpers.js";

/**
 * Flat list view for search results and filtered records.
 */
class AsFlatList extends LitElement {
  static properties = {
    items: { type: Array },
    selectedIndex: { type: Number },
    selectedRecordIds: { type: Array },
    searchQuery: { type: String },
    currentPage: { type: Number },
    totalPages: { type: Number },
    totalItems: { type: Number },
    itemsPerPage: { type: Number },
  };

  static styles = css`
    :host {
      display: block;
    }

    .flat-records-wrapper {
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 12px;
      overflow: hidden;
    }

    .flat-records-list {
      --md-list-container-color: var(--md-sys-color-surface);
      padding-top: 0;
    }

    .flat-records-list md-list-item {
      --md-list-item-label-text-font: "Roboto", sans-serif;
      --md-list-item-supporting-text-font: "Roboto", sans-serif;
      border-bottom: 1px solid var(--md-sys-color-outline-variant-50, rgba(0, 0, 0, 0.08));
      cursor: pointer;
      --md-list-item-hover-state-layer-color: var(--md-sys-color-primary);
      --md-list-item-hover-state-layer-opacity: 0.12;
      --md-list-item-focus-state-layer-color: var(--md-sys-color-primary);
      --md-list-item-focus-state-layer-opacity: 0.16;
      --md-list-item-pressed-state-layer-color: var(--md-sys-color-primary);
      --md-list-item-pressed-state-layer-opacity: 0.14;
      --md-list-item-active-indicator-color: var(--md-sys-color-primary);
      --md-list-item-active-indicator-height: 3px;
      --md-list-item-container-shape: 8px;
    }

    .flat-records-list md-list-item[selected] {
      background: var(--md-sys-color-surface-1);
      box-shadow: inset 3px 0 0 var(--md-sys-color-primary);
    }

    .flat-records-list md-list-item:last-of-type {
      border-bottom: none;
    }

    .flat-records-item-start {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 60px;
    }

    .flat-records-item-start .type-icon {
      color: var(--md-sys-color-primary);
    }

    .flat-records-item-start .type-icon svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }

    .node-select-checkbox {
      --md-checkbox-state-layer-shape: 8px;
      --md-checkbox-selected-focus-icon-color: var(--md-sys-color-on-primary);
      --md-checkbox-selected-focus-container-color: var(--md-sys-color-primary);
      --md-checkbox-selected-hover-container-color: var(--md-sys-color-primary);
      --md-checkbox-selected-pressed-container-color: var(--md-sys-color-primary);
    }

    .search-highlight {
      background: var(--md-sys-color-tertiary-container);
      color: var(--md-sys-color-on-tertiary-container);
      border-radius: 4px;
      padding: 0 2px;
      font-weight: 600;
    }
  `;

  constructor() {
    super();
    this.items = [];
    this.selectedIndex = -1;
    this.selectedRecordIds = [];
    this.searchQuery = "";
    this.currentPage = 1;
    this.totalPages = 1;
    this.totalItems = 0;
    this.itemsPerPage = 20;
  }

  render() {
    if (!this.items || this.items.length === 0) {
      return nothing;
    }

    return html`
      <div class="flat-records-wrapper">
        <md-list class="flat-records-list">
          ${map(this.items, (item, index) => this._renderListItem(item, index))}
        </md-list>
        ${this.totalPages > 1
          ? html`
              <as-pagination
                .currentPage=${this.currentPage}
                .totalPages=${this.totalPages}
                .totalItems=${this.totalItems}
                .itemsPerPage=${this.itemsPerPage}
                @page-change=${this._handlePageChange}
              ></as-pagination>
            `
          : nothing}
      </div>
    `;
  }

  _renderListItem(item, index) {
    const isSelected = this.selectedIndex === index;
    const nodeId = item.uri || item.node?.id || item.id;
    const isMultiSelected = this.selectedRecordIds?.includes(nodeId);
    const title = item.title || item.node?.title || "(Untitled)";
    const type = item.level || item.node?.type || "item";
    const ancestors = Array.isArray(item.ancestors)
      ? item.ancestors
      : item.path
      ? item.path.slice(0, -1)
      : [];
    const pathLabel = ancestors.join(" / ") || type;

    return html`
      <md-list-item
        type="button"
        class="flat-records-item"
        data-search-index=${index}
        ?selected=${isSelected}
        @click=${() => this._handleItemSelect(index)}
      >
        <div slot="start" class="flat-records-item-start">
          <md-checkbox
            class="node-select-checkbox"
            aria-label="Select ${title}"
            .checked=${isMultiSelected}
            @click=${(e) => this._handleRecordToggle(e, nodeId)}
          ></md-checkbox>
          <span class="type-icon">${this._getTypeIcon(type)}</span>
        </div>
        <div slot="headline">
          ${this.searchQuery
            ? highlightText(title, this.searchQuery)
            : title}
        </div>
        <div slot="supporting-text">${pathLabel}</div>
        ${item.extent || item.node?.extent
          ? html`<div slot="trailing-supporting-text">
              ${item.extent || item.node?.extent}
            </div>`
          : nothing}
      </md-list-item>
    `;
  }

  _getTypeIcon(type) {
    switch (type) {
      case "collection":
        return databaseIcon;
      case "series":
        return layersIcon;
      case "file":
        return documentIcon;
      case "box":
      case "folder":
        return folderIcon;
      case "item":
      default:
        return documentIcon;
    }
  }

  _handleItemSelect(index) {
    this.dispatchEvent(
      new CustomEvent("item-select", {
        detail: { index },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleRecordToggle(e, nodeId) {
    e.stopPropagation();
    e.preventDefault();
    this.dispatchEvent(
      new CustomEvent("record-toggle", {
        detail: { nodeId },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handlePageChange(e) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("page-change", {
        detail: e.detail,
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("as-flat-list", AsFlatList);

export { AsFlatList };

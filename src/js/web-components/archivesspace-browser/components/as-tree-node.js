import { LitElement, html, css, nothing } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";
import "@material/web/checkbox/checkbox.js";
import "../../utils/penwern-spinner.js";
import {
  chevronRightIcon,
  chevronDownIcon,
  databaseIcon,
  layersIcon,
  documentIcon,
  folderIcon,
  pinIcon,
  checkCircleIcon,
  alertCircleIcon,
  expandAllIcon,
  collapseAllIcon,
} from "../../utils/icons.js";
import { highlightText } from "../utils/search-helpers.js";

/**
 * Single tree node row component.
 */
class AsTreeNode extends LitElement {
  static properties = {
    node: { type: Object },
    depth: { type: Number },
    isExpanded: { type: Boolean },
    isSelected: { type: Boolean },
    isMultiSelected: { type: Boolean },
    isSearchMatch: { type: Boolean },
    searchQuery: { type: String },
    isLoading: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .tree-node {
      display: flex;
      flex-direction: column;
      width: calc(100% + 11px);
      box-sizing: border-box;
      padding: var(--node-vertical-padding, 8px) 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.15s ease;
      border-left: 3px solid transparent;
      margin-left: -11px;
      margin-bottom: 6px;
    }

    .tree-node:hover {
      background: var(--md-sys-color-surface-1);
    }

    .tree-node.selected {
      background: var(--md-sys-color-surface-1);
      border-left: 3px solid var(--md-sys-color-primary);
    }

    .tree-node.multi-selected:not(.selected) {
      background: var(--md-sys-color-surface-2);
      border-left: 3px solid var(--md-sys-color-secondary);
    }

    .tree-node.search-match .node-title {
      color: var(--md-sys-color-primary);
      font-weight: 600;
    }

    .node-row-1 {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .node-indent {
      display: flex;
      align-items: center;
      padding-left: calc(var(--depth, 0) * var(--indent-size, 24px));
    }

    .node-indent md-icon-button {
      width: 28px;
      height: 28px;
      --md-icon-button-icon-size: 20px;
    }

    .leaf-spacer {
      width: 28px;
    }

    .node-select-checkbox {
      --md-checkbox-state-layer-shape: 8px;
      --md-checkbox-selected-focus-icon-color: var(--md-sys-color-on-primary);
      --md-checkbox-selected-focus-container-color: var(--md-sys-color-primary);
      --md-checkbox-selected-hover-container-color: var(--md-sys-color-primary);
      --md-checkbox-selected-pressed-container-color: var(--md-sys-color-primary);
      margin: 0 6px;
    }

    .type-icon {
      color: var(--md-sys-color-primary);
      --md-icon-size: 20px;
      margin-left: 4px;
    }

    .type-icon svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }

    .node-title {
      flex: 1;
      min-width: 0;
      font-size: 14px;
      line-height: 1.4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-left: 6px;
      color: var(--md-sys-color-on-surface);
      font-weight: 500;
    }

    .tree-node.selected .node-title {
      color: var(--md-sys-color-primary);
      font-weight: 600;
    }

    .type-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      flex-shrink: 0;
      margin-left: 8px;
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

    .type-badge.file {
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
    }

    .type-badge.item {
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface-variant);
    }

    .node-row-2 {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
      padding-left: calc(var(--depth, 0) * var(--indent-size, 24px) + 28px + 20px + 10px);
      margin-top: 6px;
    }

    .node-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
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

    .status-badge md-icon,
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

    .meta-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
    }

    .meta-chip md-icon,
    .meta-chip .chip-icon {
      --md-icon-size: 14px;
    }

    .meta-chip .chip-icon svg {
      width: 14px;
      height: 14px;
      fill: currentColor;
    }

    .node-branch-controls {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .tree-node:hover .node-branch-controls,
    .tree-node.selected .node-branch-controls,
    .tree-node:focus-within .node-branch-controls {
      opacity: 1;
    }

    .branch-control {
      --md-icon-button-icon-size: 18px;
      --md-icon-button-container-color: transparent;
      --md-icon-button-hover-state-layer-opacity: 0.12;
      --md-icon-button-focus-state-layer-opacity: 0.12;
      color: var(--md-sys-color-primary);
      width: 32px;
      height: 32px;
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
    this.node = null;
    this.depth = 0;
    this.isExpanded = false;
    this.isSelected = false;
    this.isMultiSelected = false;
    this.isSearchMatch = false;
    this.searchQuery = "";
    this.isLoading = false;
  }

  render() {
    if (!this.node) return nothing;

    const hasKnownChildren =
      Array.isArray(this.node.children) && this.node.children.length > 0;
    const isExpandable = this.node.has_children || hasKnownChildren;
    const indentStyles = styleMap({ "--depth": this.depth });

    const nodeClasses = ["tree-node"];
    if (this.isSelected) nodeClasses.push("selected");
    if (this.isMultiSelected) nodeClasses.push("multi-selected");
    if (this.isSearchMatch) nodeClasses.push("search-match");

    const displayTitle =
      this.searchQuery.trim().length > 0
        ? highlightText(this.node.title, this.searchQuery)
        : this.node.title;

    return html`
      <div
        class="${nodeClasses.join(" ")}"
        style=${indentStyles}
        @click=${this._handleSelect}
      >
        <div class="node-row-1">
          <div class="node-indent">
            ${isExpandable
              ? html`
                  <md-icon-button @click=${this._handleToggleExpand}>
                    ${this.isExpanded ? chevronDownIcon : chevronRightIcon}
                  </md-icon-button>
                `
              : html`<span class="leaf-spacer"></span>`}
          </div>
          <md-checkbox
            class="node-select-checkbox"
            aria-label="Select ${this.node.title}"
            .checked=${this.isMultiSelected}
            @change=${this._handleToggleCheckbox}
          ></md-checkbox>
          <span class="type-icon">${this._getTypeIcon(this.node.type)}</span>
          <span class="node-title" title=${this.node.title || ""}>${displayTitle}</span>
          <span class="type-badge ${this.node.type}">${this.node.type}</span>
        </div>
        <div class="node-row-2">
          <div class="node-meta">
            ${this._renderStatusBadge(this.node.status, this.node.statusType)}
            ${this.node.extent
              ? html`<div class="meta-chip">${this.node.extent}</div>`
              : nothing}
            ${this.node.location
              ? html`<div class="meta-chip">
                  <span class="chip-icon">${pinIcon}</span>
                  ${this.searchQuery.trim().length > 0
                    ? highlightText(this.node.location, this.searchQuery)
                    : this.node.location}
                </div>`
              : nothing}
          </div>
          ${hasKnownChildren
            ? html`
                <div class="node-branch-controls">
                  <md-icon-button
                    class="branch-control"
                    aria-label="Expand entire branch"
                    title="Expand branch"
                    @click=${this._handleExpandBranch}
                  >
                    ${expandAllIcon}
                  </md-icon-button>
                  <md-icon-button
                    class="branch-control"
                    aria-label="Collapse entire branch"
                    title="Collapse branch"
                    @click=${this._handleCollapseBranch}
                  >
                    ${collapseAllIcon}
                  </md-icon-button>
                </div>
              `
            : nothing}
          ${this.isLoading
            ? html`<penwern-spinner size="32"></penwern-spinner>`
            : nothing}
        </div>
      </div>
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

  _handleSelect(e) {
    // Ignore clicks on the checkbox or its children
    if (e.target.closest('md-checkbox')) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("node-select", {
        detail: { nodeId: this.node.id },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleToggleExpand(e) {
    e.stopPropagation();
    if (this.isExpanded) {
      this.dispatchEvent(
        new CustomEvent("node-collapse", {
          detail: { nodeId: this.node.id },
          bubbles: true,
          composed: true,
        })
      );
    } else {
      this.dispatchEvent(
        new CustomEvent("node-expand", {
          detail: { nodeId: this.node.id, node: this.node },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  _handleToggleCheckbox(e) {
    e.stopPropagation();
    e.preventDefault();

    this.dispatchEvent(
      new CustomEvent("record-toggle", {
        detail: { nodeId: this.node.id },
        bubbles: true,
        composed: true,
      })
    );

    console.log('[TreeNode] record-toggle event dispatched');
  }

  _handleExpandBranch(e) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("expand-branch", {
        detail: { node: this.node },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleCollapseBranch(e) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("collapse-branch", {
        detail: { node: this.node },
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("as-tree-node", AsTreeNode);

export { AsTreeNode };

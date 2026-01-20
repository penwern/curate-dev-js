import { LitElement, html, css, nothing } from "lit";
import "@lit-labs/virtualizer";
import "./as-tree-node.js";

/**
 * Tree view container component with virtualized rendering.
 */
class AsTreeView extends LitElement {
  static properties = {
    rows: { type: Array },
    expandedNodes: { type: Object },
    selectedNodeId: { type: String },
    selectedRecordIds: { type: Array },
    searchQuery: { type: String },
    searchResultIds: { type: Object },
    childrenLoadingForId: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }

    lit-virtualizer {
      height: 100%;
      width: 100%;
    }
  `;

  constructor() {
    super();
    this.rows = [];
    this.expandedNodes = new Set();
    this.selectedNodeId = null;
    this.selectedRecordIds = [];
    this.searchQuery = "";
    this.searchResultIds = new Set();
    this.childrenLoadingForId = null;
  }

  render() {
    if (!this.rows || this.rows.length === 0) {
      return nothing;
    }

    return html`
      <lit-virtualizer
        .items=${this.rows}
        .renderItem=${(row) => this._renderTreeRow(row)}
        @scroll=${this._handleScroll}
      ></lit-virtualizer>
    `;
  }

  _renderTreeRow(row) {
    const { node, depth } = row;
    const isExpanded = this.expandedNodes?.has(node.id);
    const isSelected = this.selectedNodeId === node.id;
    const isMultiSelected = this.selectedRecordIds?.includes(node.id);
    const isSearchMatch = this.searchResultIds?.has(node.id);
    const isLoading = this.childrenLoadingForId === node.id;

    return html`
      <as-tree-node
        .node=${node}
        .depth=${depth}
        .isExpanded=${isExpanded}
        .isSelected=${isSelected}
        .isMultiSelected=${isMultiSelected}
        .isSearchMatch=${isSearchMatch}
        .searchQuery=${this.searchQuery}
        .isLoading=${isLoading}
        @node-select=${this._handleNodeSelect}
        @node-expand=${this._handleNodeExpand}
        @node-collapse=${this._handleNodeCollapse}
        @record-toggle=${this._handleRecordToggle}
        @expand-branch=${this._handleExpandBranch}
        @collapse-branch=${this._handleCollapseBranch}
      ></as-tree-node>
    `;
  }

  _handleScroll(e) {
    const target = e.currentTarget;
    if (!target) return;
    const remaining = target.scrollHeight - target.scrollTop - target.clientHeight;
    const threshold = 200;
    if (remaining <= threshold) {
      this.dispatchEvent(
        new CustomEvent("scroll-near-end", {
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  _handleNodeSelect(e) {
    this.dispatchEvent(
      new CustomEvent("node-select", {
        detail: e.detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleNodeExpand(e) {
    this.dispatchEvent(
      new CustomEvent("node-expand", {
        detail: e.detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleNodeCollapse(e) {
    this.dispatchEvent(
      new CustomEvent("node-collapse", {
        detail: e.detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleRecordToggle(e) {
    console.log('[TreeView] _handleRecordToggle - re-dispatching event', e.detail);
    e.stopPropagation(); // Stop the original event from bubbling further
    this.dispatchEvent(
      new CustomEvent("record-toggle", {
        detail: e.detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleExpandBranch(e) {
    this.dispatchEvent(
      new CustomEvent("expand-branch", {
        detail: e.detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleCollapseBranch(e) {
    this.dispatchEvent(
      new CustomEvent("collapse-branch", {
        detail: e.detail,
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("as-tree-view", AsTreeView);

export { AsTreeView };

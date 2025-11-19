import { LitElement, html, css, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import '@lit-labs/virtualizer';
import './email-list-item.js';
import { sortEmails } from '../utils/search.js';
import {
  searchIcon,
  sortIcon,
  chevronUpIcon,
  chevronDownIcon,
  chevronRightIcon,
  closeIcon,
  folderIcon
} from "../../utils/icons.js";

export class EmailList extends LitElement {
  static properties = {
    emails: { type: Array },
    threads: { type: Object },
    selectedId: { type: String },
    folderTree: { type: Array },
    selectedFolderPath: { type: String },
    searchQuery: { type: String, state: true },
    sortBy: { type: String, state: true },
    sortDirection: { type: String, state: true },
    collapsedThreads: { type: Set, state: true },
    expandedFolders: { type: Set, state: true },
    folderPanelOpen: { type: Boolean, state: true }
  };

  constructor() {
    super();
    this.emails = [];
    this.threads = {};
    this.selectedId = null;
    this.folderTree = [];
    this.selectedFolderPath = null;
    this.searchQuery = '';
    this.sortBy = 'date';
    this.sortDirection = 'desc';
    this.collapsedThreads = new Set();
    this.expandedFolders = new Set();
    this.folderPanelOpen = false;
    this._searchCache = new Map();
    this._renderGroupItem = this._renderGroupItem.bind(this);
    this._groupKey = this._groupKey.bind(this);
    this._folderEmailIndex = new Map();
    this._folderLabelIndex = new Map();
    this._hasUserFolderToggle = false;
    this._boundHandleGlobalPointer = (event) => this._handleGlobalPointer(event);
    this._boundHandleGlobalKeydown = (event) => this._handleGlobalKeydown(event);
    this._overflowTarget = null;
  }

  connectedCallback() {
    super.connectedCallback();
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', this._boundHandleGlobalPointer);
      window.addEventListener('keydown', this._boundHandleGlobalKeydown);
    }
  }

  disconnectedCallback() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointerdown', this._boundHandleGlobalPointer);
      window.removeEventListener('keydown', this._boundHandleGlobalKeydown);
    }
    this._setOverflowAllowance(false);
    super.disconnectedCallback();
  }

  updated(changedProperties) {
    if (changedProperties.has('emails')) {
      this._rebuildSearchCache();
    }

    if (changedProperties.has('folderTree')) {
      this._rebuildFolderIndex();
    }
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: transparent;
    }

    .search-bar .icon,
    .search-clear .icon,
    .sort-select .icon,
    .sort-direction-btn .icon,
    .thread-header .chevron {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .search-bar .icon svg,
    .search-clear .icon svg,
    .sort-select .icon svg,
    .sort-direction-btn .icon svg,
    .thread-header .chevron svg {
      width: 100% !important;
      height: 100% !important;
    }

    .list-header {
      padding: 16px 18px;
      background: var(--md-sys-color-surface-1);
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
    }

    .list-summary {
      margin: 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.4;
    }

    .summary-highlight {
      color: var(--md-sys-color-primary);
      font-weight: 500;
    }

    .folder-filter {
      position: relative;
    }

    .folder-filter-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      border-radius: 14px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      padding: 8px 14px;
      cursor: pointer;
      min-width: 160px;
      transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
    }

    .folder-filter-btn .icon {
      width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: inherit;
    }

    .folder-filter-btn .icon svg {
      width: 100% !important;
      height: 100% !important;
      fill: currentColor;
    }

    .folder-filter-btn .text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.2;
    }

    .folder-filter-btn .title {
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant);
    }

    .folder-filter-btn .subtitle {
      font-size: 13px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }

    .folder-filter-btn:hover,
    .folder-filter-btn:focus-visible {
      border-color: var(--md-sys-color-primary);
      color: var(--md-sys-color-primary);
      box-shadow: 0 4px 16px color-mix(in srgb, var(--md-sys-color-primary) 20%, transparent);
      outline: none;
    }

    .folder-filter-btn.is-active {
      border-color: var(--md-sys-color-primary);
      background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
      color: var(--md-sys-color-primary);
    }

    .folder-panel-popover {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      z-index: 904;
      width: min(360px, calc(100vw - 48px));
    }

    .folder-panel {
      border-radius: 14px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface);
      padding: 14px 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 18px 36px rgba(12, 18, 32, 0.22);
      z-index: 904;
    }

    .folder-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .folder-panel-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .folder-panel-title {
      margin: 0;
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant);
      font-weight: 600;
    }

    .folder-panel-caption {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface);
    }

    .clear-folder-btn {
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 999px;
      background: transparent;
      color: var(--md-sys-color-on-surface-variant);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 6px 14px;
      cursor: pointer;
      transition: border-color 0.2s ease, color 0.2s ease;
    }

    .clear-folder-btn:hover,
    .clear-folder-btn:focus-visible {
      border-color: var(--md-sys-color-primary);
      color: var(--md-sys-color-primary);
      outline: none;
    }

    .folder-panel-close {
      border: none;
      background: transparent;
      color: var(--md-sys-color-on-surface-variant);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease;
    }

    .folder-panel-close:hover,
    .folder-panel-close:focus-visible {
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface);
      outline: none;
    }

    .folder-panel-close .icon svg {
      width: 18px !important;
      height: 18px !important;
      fill: currentColor;
    }

    .folder-tree {
      max-height: 220px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-right: 4px;
    }

    .folder-node {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .folder-row {
      display: grid;
      grid-template-columns: 28px minmax(0, 1fr);
      gap: 4px;
      align-items: center;
    }

    .folder-toggle {
      border: none;
      background: transparent;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease;
    }

    .folder-toggle:hover,
    .folder-toggle:focus-visible {
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface);
      outline: none;
    }

    .folder-toggle .icon svg {
      width: 16px !important;
      height: 16px !important;
    }

    .folder-toggle.spacer {
      pointer-events: none;
    }

    .folder-label {
      border: none;
      background: transparent;
      border-radius: 12px;
      padding: 6px 10px;
      padding-left: calc(10px + var(--folder-indent, 0px));
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      cursor: pointer;
      color: var(--md-sys-color-on-surface);
      transition: background 0.2s ease, color 0.2s ease;
      text-align: left;
    }

    .folder-label:hover,
    .folder-label:focus-visible {
      background: var(--md-sys-color-surface-variant);
      outline: none;
    }

    .folder-label.is-selected {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      font-weight: 600;
    }

    .folder-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
    }

    .folder-count {
      font-size: 12px;
      font-weight: 600;
      border-radius: 999px;
      padding: 2px 8px;
      background: color-mix(in srgb, currentColor 15%, transparent);
      color: inherit;
    }

    .folder-children {
      margin-left: 14px;
      padding-left: 6px;
      border-left: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent);
    }

    @media (max-width: 640px) {
      .folder-panel {
        max-height: 320px;
      }
      .folder-panel-popover {
        left: 0;
        right: auto;
      }
    }

    .list-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
    }

    .search-bar {
      position: relative;
      flex: 1 0 240px;
      min-width: 200px;
      max-width: 100%;
    }

    .search-bar .icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      color: var(--md-sys-color-on-surface-variant);
      opacity: 0.7;
      pointer-events: none;
    }

    .search-bar input {
      width: 100%;
      padding: 10px 40px 10px 44px;
      border-radius: 999px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      font-size: 13px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .search-bar input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary);
      box-shadow: 0 0 0 2px var(--md-sys-color-primary);
    }

    .search-bar input::placeholder {
      color: var(--md-sys-color-on-surface-variant);
      opacity: 0.65;
    }

    .search-bar input::-webkit-search-decoration,
    .search-bar input::-webkit-search-cancel-button,
    .search-bar input::-webkit-search-results-button,
    .search-bar input::-webkit-search-results-decoration {
      display: none;
    }

    .search-bar input::-ms-clear {
      display: none;
      width: 0;
      height: 0;
    }

    .search-clear {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      border: none;
      background: transparent;
      color: var(--md-sys-color-on-surface-variant);
      width: 28px;
      height: 28px;
      padding: 0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: color 0.2s ease, background 0.2s ease;
    }

    .search-clear:hover {
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface);
    }

    .search-clear:focus-visible {
      outline: 2px solid var(--md-sys-color-primary);
      outline-offset: 2px;
    }

    .search-clear .icon {
      position: static;
      transform: none;
      width: 16px;
      height: 16px;
      color: currentColor;
    }

    .sort-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px 4px 12px;
      border-radius: 999px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface);
    }

    .sort-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--md-sys-color-on-surface-variant);
    }

    .sort-select {
      position: relative;
      display: flex;
      align-items: center;
    }

    .sort-select select {
      appearance: none;
      border: none;
      background: transparent;
      color: var(--md-sys-color-on-surface);
      font-size: 13px;
      font-weight: 500;
      padding: 4px 24px 4px 8px;
      cursor: pointer;
    }

    .sort-select select:focus {
      outline: none;
    }

    .sort-select .icon {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      color: var(--md-sys-color-on-surface-variant);
      opacity: 0.7;
      pointer-events: none;
    }

    .sort-direction-btn {
      border: none;
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface);
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease;
    }

    .sort-direction-btn:hover {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
    }

    .sort-direction-btn .icon {
      width: 16px;
      height: 16px;
      color: currentColor;
    }

    .list-body {
      flex: 1;
      padding: 16px 20px 24px 20px;
      display: flex;
      flex-direction: column;
      background: var(--md-sys-color-surface);
      min-height: 0;
    }

    .list-body-scroll {
      flex: 1;
      min-height: 0;
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .list-virtualizer {
      height: 100%;
      width: 100%;
      display: block;
      overflow: auto;
      overscroll-behavior: contain;
    }

    .list-item-wrapper {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      margin-bottom: 12px;
    }

    .list-item-wrapper:last-of-type {
      margin-bottom: 0;
    }

    .list-item-wrapper email-list-item,
    .list-item-wrapper .thread-group {
      display: block;
      width: 100%;
    }

    .no-results {
      margin-top: 48px;
      text-align: center;
      color: var(--md-sys-color-on-surface-variant);
      font-size: 14px;
    }

    .thread-group {
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 14px;
      background: var(--md-sys-color-surface-1);
      box-sizing: border-box;
      width: 100%;
      overflow: hidden;
    }

    .thread-header {
      width: 100%;
      border: none;
      background: transparent;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      color: inherit;
      text-align: left;
      transition: background 0.2s ease;
      border-radius: 14px;
    }

    .thread-header:hover {
      background: var(--md-sys-color-surface-2);
    }

    .thread-header:focus-visible {
      outline: 2px solid var(--md-sys-color-primary);
      outline-offset: 2px;
      border-radius: 12px;
    }

    .thread-header .chevron {
      width: 18px;
      height: 18px;
      color: var(--md-sys-color-on-surface-variant);
      flex-shrink: 0;
    }

    .thread-header-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .thread-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .thread-meta {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
      letter-spacing: 0.02em;
    }

    .thread-count {
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      font-size: 12px;
      font-weight: 600;
    }

    .thread-collection {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px 10px 12px 10px;
      background: var(--md-sys-color-surface);
      border-radius: 0 0 14px 14px;
      box-sizing: border-box;
      width: 100%;
    }

    @media (max-width: 900px) {
      .list-header {
        padding: 14px 16px;
      }

      .list-toolbar {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }

      .search-bar {
        flex: 1 0 auto;
        min-width: 0;
        width: 100%;
      }

      .sort-controls {
        width: 100%;
        justify-content: space-between;
      }
    }

    @media (max-width: 768px) {
      .list-body {
        padding: 12px 16px 20px 16px;
      }
    }
  `;

  _clearSearch() {
    this.searchQuery = '';
  }

  _rebuildSearchCache() {
    this._searchCache = new Map();
    if (!Array.isArray(this.emails)) {
      return;
    }
    for (const email of this.emails) {
      this._createSearchEntry(email);
    }
  }

  _createSearchEntry(email) {
    if (!email || !email.id) {
      return '';
    }

    const values = [];
    const pushValue = (value) => {
      if (typeof value === 'string' && value.length > 0) {
        values.push(value.toLowerCase());
      }
    };

    const pushParticipant = (participant) => {
      if (!participant) {
        return;
      }
      pushValue(participant.name);
      pushValue(participant.email);
    };

    pushValue(email.subject);
    pushValue(email.snippet);
    pushParticipant(email.from);

    if (Array.isArray(email.to)) {
      email.to.forEach(pushParticipant);
    }
    if (Array.isArray(email.cc)) {
      email.cc.forEach(pushParticipant);
    }
    if (Array.isArray(email.bcc)) {
      email.bcc.forEach(pushParticipant);
    }

    const combined = values.join(' ');
    this._searchCache.set(email.id, combined);
    return combined;
  }

  _filterEmails(emails, query) {
    if (!Array.isArray(emails) || !query || !query.trim()) {
      return emails;
    }

    const needle = query.trim().toLowerCase();
    const cache = this._searchCache;

    return emails.filter((email) => {
      if (!email || !email.id) {
        return false;
      }
      const haystack = cache.get(email.id) ?? this._createSearchEntry(email);
      return haystack.includes(needle);
    });
  }

  _pluralize(word, count) {
    return count === 1 ? word : `${word}s`;
  }

  _applyFolderFilter(emails) {
    if (!Array.isArray(emails) || !this.selectedFolderPath) {
      return emails;
    }
    const allowedSet = this._folderEmailIndex.get(this.selectedFolderPath);
    if (!allowedSet) {
      return emails;
    }
    return emails.filter((email) => allowedSet.has(email.id));
  }

  _rebuildFolderIndex() {
    this._folderEmailIndex = new Map();
    this._folderLabelIndex = new Map();
    const validPaths = new Set();

    const traverse = (node) => {
      if (!node || !node.path) {
        return;
      }
      validPaths.add(node.path);
      const emailIds = Array.isArray(node.emailIds) ? node.emailIds.filter(Boolean) : [];
      this._folderEmailIndex.set(node.path, new Set(emailIds));
      const breadcrumbs = Array.isArray(node.breadcrumbs) && node.breadcrumbs.length
        ? node.breadcrumbs
        : node.path.split('/').filter(Boolean);
      this._folderLabelIndex.set(node.path, {
        short: node.name || breadcrumbs[breadcrumbs.length - 1] || node.path,
        full: breadcrumbs.length ? breadcrumbs.join(' › ') : (node.name || node.path)
      });
      if (Array.isArray(node.children) && node.children.length) {
        node.children.forEach(traverse);
      }
    };

    const roots = Array.isArray(this.folderTree) ? this.folderTree : [];
    roots.forEach(traverse);

    const cleanedExpanded = new Set(
      [...this.expandedFolders].filter((path) => validPaths.has(path))
    );

    if (this.selectedFolderPath && !validPaths.has(this.selectedFolderPath)) {
      this.selectedFolderPath = null;
    }

    if (!this._hasUserFolderToggle && cleanedExpanded.size === 0 && roots.length > 0) {
      roots.forEach((node) => cleanedExpanded.add(node.path));
    }

    this.expandedFolders = cleanedExpanded;
    if (roots.length === 0) {
      this.folderPanelOpen = false;
      this._setOverflowAllowance(false);
    }
  }

  _setOverflowAllowance(enable) {
    let target = this._overflowTarget;
    if (!target) {
      target = this.closest('.email-list-pane');
      if (!target) {
        return;
      }
      this._overflowTarget = target;
    }
    target.classList.toggle('allow-overflow', Boolean(enable));
  }

  _toggleFolder(path, event) {
    event?.stopPropagation?.();
    const updated = new Set(this.expandedFolders);
    if (updated.has(path)) {
      updated.delete(path);
    } else {
      updated.add(path);
    }
    this.expandedFolders = updated;
    this._hasUserFolderToggle = true;
  }

  _selectFolder(path) {
    this._hideFolderPanel();
    this.dispatchEvent(new CustomEvent('folder-selected', {
      detail: {
        folderPath: path,
        emailIds: path && this._folderEmailIndex.get(path)
          ? Array.from(this._folderEmailIndex.get(path))
          : null
      },
      bubbles: true,
      composed: true
    }));
  }

  _clearFolderSelection() {
    this._hideFolderPanel();
    this.dispatchEvent(new CustomEvent('folder-selected', {
      detail: {
        folderPath: null,
        emailIds: null
      },
      bubbles: true,
      composed: true
    }));
  }

  _renderFolderNode(node, depth = 0) {
    if (!node) {
      return nothing;
    }
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const isExpanded = this.expandedFolders.has(node.path);
    const isSelected = this.selectedFolderPath === node.path;
    const indentValue = `${depth * 14}px`;

    return html`
      <div
        class="folder-node"
        role="treeitem"
        aria-level=${depth + 1}
        aria-expanded=${hasChildren ? String(isExpanded) : nothing}
      >
        <div class="folder-row">
          ${hasChildren ? html`
            <button
              class="folder-toggle"
              type="button"
              aria-label="${isExpanded ? 'Collapse' : 'Expand'} ${node.name}"
              @click=${(event) => this._toggleFolder(node.path, event)}
            >
              <span class="icon">${isExpanded ? chevronDownIcon : chevronRightIcon}</span>
            </button>
          ` : html`<span class="folder-toggle spacer"></span>`}
          <button
            class=${`folder-label ${isSelected ? 'is-selected' : ''}`}
            type="button"
            style=${styleMap({ '--folder-indent': indentValue })}
            title=${this._folderLabelIndex.get(node.path)?.full || node.name}
            @click=${() => this._selectFolder(node.path)}
          >
            <span class="folder-name">${node.name}</span>
            <span class="folder-count">${node.emailCount ?? 0}</span>
          </button>
        </div>
        ${hasChildren && isExpanded ? html`
          <div class="folder-children" role="group">
            ${node.children.map((child) => this._renderFolderNode(child, depth + 1))}
          </div>
        ` : ''}
      </div>
    `;
  }

  _renderFolderSection() {
    const hasFolders = Array.isArray(this.folderTree) && this.folderTree.length > 0;
    if (!hasFolders) {
      return nothing;
    }
    const selectedLabel = this.selectedFolderPath
      ? (this._folderLabelIndex.get(this.selectedFolderPath)?.full || this.selectedFolderPath)
      : null;

    return html`
      <div class="folder-panel">
        <div class="folder-panel-header">
          <div>
            <p class="folder-panel-title">Folders</p>
            <p class="folder-panel-caption">
              ${selectedLabel ? `Viewing ${selectedLabel}` : 'Browse folders captured from the PST archive'}
            </p>
          </div>
          <div class="folder-panel-actions">
            ${this.selectedFolderPath ? html`
              <button
                class="clear-folder-btn"
                type="button"
                @click=${this._clearFolderSelection}
              >
                Show all
              </button>
            ` : nothing}
            <button
              class="folder-panel-close"
              type="button"
              aria-label="Close folder picker"
              @click=${this._hideFolderPanel}
            >
              <span class="icon">${closeIcon}</span>
            </button>
          </div>
        </div>
        <div class="folder-tree" role="tree" aria-label="Email folders">
          ${this.folderTree.map((node) => this._renderFolderNode(node))}
        </div>
      </div>
    `;
  }


  _toggleFolderPanel() {
    if (!Array.isArray(this.folderTree) || this.folderTree.length === 0) {
      this.folderPanelOpen = false;
      return;
    }
    const nextState = !this.folderPanelOpen;
    this.folderPanelOpen = nextState;
    this._setOverflowAllowance(nextState);
  }

  _hideFolderPanel() {
    if (this.folderPanelOpen) {
      this.folderPanelOpen = false;
      this._setOverflowAllowance(false);
    }
  }

  _handleGlobalPointer(event) {
    if (!this.folderPanelOpen) {
      return;
    }
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const root = this.renderRoot?.querySelector('.folder-filter');
    if (root && path.includes(root)) {
      return;
    }
    this._hideFolderPanel();
  }

  _handleGlobalKeydown(event) {
    if (event.key === 'Escape' && this.folderPanelOpen) {
      this._hideFolderPanel();
    }
  }

  _groupEmailsByThread(filteredEmails) {
    const groups = [];
    const processed = new Set();

    for (const email of filteredEmails) {
      if (processed.has(email.id)) {
        continue;
      }

      if (email.threadId && this.threads[email.threadId]) {
        const source = this.threads[email.threadId];
        const memberIds = Array.isArray(source) ? source : (source?.emailIds || []);
        const threadEmails = memberIds
          .map(id => filteredEmails.find(candidate => candidate.id === id))
          .filter(Boolean);

        if (threadEmails.length > 0) {
          groups.push({
            type: 'thread',
            threadId: email.threadId,
            emails: threadEmails,
            collapsed: this.collapsedThreads.has(email.threadId)
          });
          threadEmails.forEach(entry => processed.add(entry.id));
          continue;
        }
      }

      groups.push({
        type: 'single',
        email
      });
      processed.add(email.id);
    }

    return groups;
  }

  _groupKey(group) {
    if (!group) {
      return '';
    }
    if (group.type === 'single') {
      return `single-${group.email?.id ?? ''}`;
    }
    return `thread-${group.threadId ?? ''}`;
  }

  _renderGroupItem(group) {
    if (!group) {
      return html``;
    }

    if (group.type === 'single') {
      const email = group.email;
      return html`
        <div class="list-item-wrapper">
          <email-list-item
            role="listitem"
            .email=${email}
            .selected=${email?.id === this.selectedId}
            .threadCount=${1}
            .isInThread=${false}
            .threadIndex=${0}
            @email-selected=${this._handleSelection}
          ></email-list-item>
        </div>
      `;
    }

    const visibleEmails = group.collapsed ? [group.emails[0]] : group.emails;
    const primarySubject = group.emails[0]?.subject || 'Conversation';

    return html`
      <div class="list-item-wrapper">
        <div class="thread-group" role="group" aria-label="Thread with ${group.emails.length} messages">
          <button
            class="thread-header"
            type="button"
            @click=${() => this._toggleThread(group.threadId)}
            aria-expanded=${String(!group.collapsed)}
          >
            <span class="chevron">${group.collapsed ? chevronRightIcon : chevronDownIcon}</span>
            <div class="thread-header-content">
              <span class="thread-title">${primarySubject}</span>
              <span class="thread-meta">${group.emails.length} ${this._pluralize('message', group.emails.length)}</span>
            </div>
            <span class="thread-count">${group.emails.length}</span>
          </button>

          <div class="thread-collection">
            ${visibleEmails.map((email, index) => html`
              <email-list-item
                role="listitem"
                .email=${email}
                .selected=${email.id === this.selectedId}
                .threadCount=${group.emails.length}
                .isInThread=${true}
                .threadIndex=${index}
                .isCollapsedPreview=${group.collapsed}
                @email-selected=${this._handleSelection}
              ></email-list-item>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  _toggleThread(threadId) {
    const updated = new Set(this.collapsedThreads);
    if (updated.has(threadId)) {
      updated.delete(threadId);
    } else {
      updated.add(threadId);
    }
    this.collapsedThreads = updated;
  }

  _handleSelection(event) {
    this.dispatchEvent(new CustomEvent('email-selected', {
      detail: event.detail,
      bubbles: true,
      composed: true
    }));
  }

  _toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  }

  render() {
    const folderScoped = this._applyFolderFilter(this.emails);
    const filtered = this._filterEmails(folderScoped, this.searchQuery);
    const sorted = sortEmails(filtered, this.sortBy, this.sortDirection);
    const grouped = this._groupEmailsByThread(sorted);
    const visibleCount = sorted.length;
    const totalCount = folderScoped.length;
    const folderLabel = this.selectedFolderPath
      ? (this._folderLabelIndex.get(this.selectedFolderPath)?.full || this.selectedFolderPath)
      : null;
    const hasFolders = Array.isArray(this.folderTree) && this.folderTree.length > 0;
    const folderButtonClasses = classMap({
      'folder-filter-btn': true,
      'is-active': this.folderPanelOpen || Boolean(folderLabel)
    });

    return html`
      <div class="list-header">
        <p class="list-summary">
          Showing ${visibleCount} of ${totalCount} ${this._pluralize('message', totalCount)}
          ${folderLabel ? html`<span class="summary-highlight">in ${folderLabel}</span>` : ''}
          ${this.searchQuery ? html`<span class="summary-highlight">matching "${this.searchQuery}"</span>` : ''}
        </p>
        <div class="list-toolbar">
          <div class="search-bar">
            <span class="icon">${searchIcon}</span>
            <input
              type="search"
              placeholder="Search senders, subjects, or content"
              .value=${this.searchQuery}
              @input=${(event) => this.searchQuery = event.target.value}
            />
            ${this.searchQuery ? html`
              <button class="search-clear" type="button" @click=${this._clearSearch} aria-label="Clear search">
                <span class="icon">${closeIcon}</span>
              </button>
            ` : ''}
          </div>

              ${hasFolders ? html`
                <div class="folder-filter">
                  <button
                    class=${folderButtonClasses}
                    type="button"
                aria-haspopup="dialog"
                aria-expanded=${String(this.folderPanelOpen)}
                @click=${this._toggleFolderPanel}
                  >
                    <span class="icon">${folderIcon}</span>
                    <span class="text">
                      <span class="title">Folders</span>
                      <span class="subtitle">${folderLabel || 'All mail'}</span>
                    </span>
                  </button>
                  ${this.folderPanelOpen ? html`
                    <div
                      class="folder-panel-popover"
                      role="dialog"
                      aria-label="Choose folder"
                    >
                      ${this._renderFolderSection()}
                    </div>
                  ` : nothing}
                </div>
              ` : nothing}

          <div class="sort-controls">
            <span class="sort-label">Sort</span>
            <div class="sort-select">
              <select @change=${(event) => this.sortBy = event.target.value} .value=${this.sortBy}>
                <option value="date">Date</option>
                <option value="from">From</option>
                <option value="subject">Subject</option>
              </select>
              <span class="icon">${sortIcon}</span>
            </div>
            <button
              class="sort-direction-btn"
              type="button"
              @click=${this._toggleSortDirection}
              title="${this.sortDirection === 'asc' ? 'Ascending' : 'Descending'}"
              aria-label="Toggle sort direction"
            >
              <span class="icon">
                ${this.sortDirection === 'asc' ? chevronUpIcon : chevronDownIcon}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div class="list-body">
        <div class="list-body-scroll">
          ${grouped.length === 0 ? html`
            <div class="no-results">
              ${this.searchQuery ? 'No emails match your search' : 'There are no emails to display yet.'}
            </div>
          ` : html`
            <lit-virtualizer
              class="list-virtualizer"
              scroller
              style=${styleMap({ height: '100%' })}
              role="list"
              layout="vertical"
              .items=${grouped}
              .renderItem=${this._renderGroupItem}
              .keyFunction=${this._groupKey}
            ></lit-virtualizer>
          `}
        </div>
      </div>
    `;
  }
}

customElements.define('email-list', EmailList);

import { LitElement, html, css } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import '@material/web/progress/circular-progress.js';
import { getManifest, getEmailBody, setArchiveBasePath } from '../data/dataService.js';
import './email-list.js';
import './email-detail.js';
import { chevronLeftIcon, chevronRightIcon } from '../../utils/icons.js';

export class EmailViewer extends LitElement {
  static properties = {
    emails: { type: Array, state: true },
    threads: { type: Object, state: true },
    folderTree: { type: Array, state: true },
    selectedEmailId: { type: String, state: true },
    selectedEmail: { type: Object, state: true },
    emailBody: { type: Object, state: true },
    threadEmails: { type: Array, state: true },
    threadBodies: { type: Object, state: true },
    loading: { type: Boolean, state: true },
    listWidth: { type: Number, state: true },
    isMobile: { type: Boolean, state: true },
    mobileView: { type: String, state: true },
    archivePath: { type: String, attribute: 'archive-path' },
    archiveMode: { type: String, attribute: 'archive-mode' },
    archiveWorkspace: { type: String, attribute: 'archive-workspace' },
    manifestError: { type: Object, state: true },
    messageLoading: { type: Boolean, state: true },
    listCollapsed: { type: Boolean, state: true },
    selectedFolderPath: { type: String, state: true }
  };

  constructor() {
    super();
    this.emails = [];
    this.threads = {};
    this.folderTree = [];
    this.selectedEmailId = null;
    this.selectedEmail = null;
    this.emailBody = null;
    this.threadEmails = null;
    this.threadBodies = null;
    this.loading = true;
    this.listWidth = 32;
    this.isMobile = false;
    this.mobileView = 'list';
    this.archivePath = undefined;
    this.archiveMode = 'auto';
    this.archiveWorkspace = undefined;
    this.manifestError = null;
    this.messageLoading = false;
    this.listCollapsed = false;
    this.selectedFolderPath = null;
    this._initialArchivePreference = this._detectArchivePreference();
    this._currentArchivePath = undefined;
    this._currentArchiveMode = undefined;
    this._currentArchiveWorkspace = undefined;
    this._hasInitialArchiveLoad = false;
    this._minListWidth = 24;
    this._maxListWidth = 55;
    this._previousListWidth = this.listWidth;
    this._onViewportChange = this._onViewportChange.bind(this);
    this._handlePointerMove = this._handlePointerMove.bind(this);
    this._stopResize = this._stopResize.bind(this);
    this._handleResizeObserverError = this._handleResizeObserverError.bind(this);
    this._pstFolderIndex = new Map();
  }

  connectedCallback() {
    super.connectedCallback();
    if (typeof window !== 'undefined') {
      try {
        this._mediaQuery = window.matchMedia('(max-width: 768px)');
        if (this._mediaQuery.addEventListener) {
          this._mediaQuery.addEventListener('change', this._onViewportChange);
        } else if (this._mediaQuery.addListener) {
          this._mediaQuery.addListener(this._onViewportChange);
        }
        this._onViewportChange(this._mediaQuery);
      } catch (error) {
        console.warn('Media query listener unavailable:', error);
      }
    }

    if ((this.archivePath === undefined || this.archivePath === null || this.archivePath === '') && this._initialArchivePreference) {
      this.archivePath = this._initialArchivePreference;
    }

    window.addEventListener('error', this._handleResizeObserverError, { capture: true });
  }

  disconnectedCallback() {
    if (this._mediaQuery) {
      if (this._mediaQuery.removeEventListener) {
        this._mediaQuery.removeEventListener('change', this._onViewportChange);
      } else if (this._mediaQuery.removeListener) {
        this._mediaQuery.removeListener(this._onViewportChange);
      }
    }
    window.removeEventListener('pointermove', this._handlePointerMove);
    window.removeEventListener('pointerup', this._stopResize);
    window.removeEventListener('error', this._handleResizeObserverError, { capture: true });
    super.disconnectedCallback();
  }

  firstUpdated() {
    this._refreshManifest();
  }

  updated(changedProperties) {
    if (changedProperties.has('archivePath')) {
      const previous = changedProperties.get('archivePath');
      const current = this.archivePath ?? '';
      if (current !== (previous ?? '')) {
        if (previous !== undefined || this._hasInitialArchiveLoad) {
          this._refreshManifest();
        }
      }
    }

    if (changedProperties.has('archiveMode') || changedProperties.has('archiveWorkspace')) {
      const modeChanged = changedProperties.has('archiveMode');
      const workspaceChanged = changedProperties.has('archiveWorkspace');
      const previousMode = changedProperties.get('archiveMode');
      const previousWorkspace = changedProperties.get('archiveWorkspace');

      const hasMeaningfulChange =
        (modeChanged && (previousMode ?? '') !== (this.archiveMode ?? '')) ||
        (workspaceChanged && (previousWorkspace ?? '') !== (this.archiveWorkspace ?? ''));

      if (hasMeaningfulChange && this._currentArchivePath !== undefined) {
        this._refreshManifest();
      }
    }
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
      min-height: 0;
      color: var(--md-sys-color-on-surface);
    }

    .viewer-page {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      background: transparent;
    }

    .viewer-shell {
      display: flex;
      align-items: stretch;
      flex: 1;
      height: 100%;
      width: min(1400px, 100%);
      margin: 0 auto;
      gap: 12px;
      box-sizing: border-box;
      min-height: 0;
    }

    .pane {
      display: flex;
      flex-direction: column;
      background: var(--md-sys-color-surface-2);
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 12px;
      overflow: hidden;
      min-height: 0;
      backdrop-filter: blur(22px);
    }

    .pane.allow-overflow {
      overflow: visible;
    }

    .pane > email-list,
    .pane > email-detail {
      flex: 1;
      min-height: 0;
    }

    .list-shell {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .list-shell > email-list {
      flex: 1;
      min-height: 0;
    }

    .email-list-pane {
      min-width: 280px;
      max-width: 520px;
      transition: flex-basis 0.2s ease;
    }

    .email-list-pane.allow-overflow {
      overflow: visible;
      position: relative;
      z-index: 5;
    }

    .email-list-pane.is-collapsed {
      flex: 0 0 36px;
      min-width: 36px;
      max-width: 36px;
      padding: 2px;
      align-items: center;
      justify-content: center;
      gap: 0;
      background: var(--md-sys-color-surface);
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 12px;
    }

    .email-list-pane.is-collapsed .expand-toggle {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
      gap: 4px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-size: 9px;
      font-weight: 600;
      transition: transform 0.2s ease, color 0.2s ease;
    }

    .email-list-pane.is-collapsed .expand-toggle:hover {
      transform: translateY(-1px);
      color: var(--md-sys-color-primary);
    }

    .email-list-pane.is-collapsed .expand-toggle:focus-visible {
      outline: 2px solid var(--md-sys-color-primary);
      outline-offset: 2px;
      color: var(--md-sys-color-primary);
    }

    .email-list-pane.is-collapsed .expand-toggle .icon {
      width: 14px;
      height: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .email-list-pane.is-collapsed .expand-toggle .icon svg {
      width: 100% !important;
      height: 100% !important;
    }

    .email-list-pane.is-collapsed .expand-toggle .label {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      letter-spacing: 0.14em;
    }

    .email-detail-pane {
      flex: 1;
      position: relative;
    }

    .message-loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.06);
      backdrop-filter: blur(2px);
      z-index: 2;
      pointer-events: all;
    }

    .message-loading-overlay md-circular-progress {
      --md-circular-progress-size: 40px;
    }

    .pane-divider {
      width: 10px;
      flex-shrink: 0;
      align-self: stretch;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: col-resize;
      margin: 0;
      background: var(--md-sys-color-surface-1);
      border-radius: 10px;
      border: 1px solid var(--md-sys-color-outline-variant);
      transition: background 0.2s ease;
      position: relative;
    }

    .pane-divider:hover {
      background: var(--md-sys-color-surface-2);
    }

    .collapse-handle {
      position: absolute;
      top: 50%;
      right: 50%;
      transform: translate(50%, -50%);
      border: none;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
      padding: 0;
      transition: color 0.2s ease, transform 0.2s ease;
    }

    .collapse-handle:hover {
      color: var(--md-sys-color-primary);
      transform: translate(50%, -50%) scale(1.08);
    }

    .collapse-handle:focus-visible {
      outline: 2px solid var(--md-sys-color-primary);
      outline-offset: 2px;
      color: var(--md-sys-color-primary);
    }

    .collapse-handle .icon {
      width: 16px;
      height: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .collapse-handle .icon svg {
      width: 100% !important;
      height: 100% !important;
    }

    .divider-grip {
      width: 6px;
      height: 28px;
      border-radius: 2px;
      background: var(--md-sys-color-outline-variant);
    }

    .loading-state {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 16px;
      color: var(--md-sys-color-on-surface-variant);
      width: 100%;
    }

    .error-state {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px;
    }

    .error-card {
      max-width: 420px;
      width: 100%;
      border-radius: 16px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface-1);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-sizing: border-box;
    }

    .error-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }

    .error-message {
      margin: 0;
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.6;
      word-break: break-word;
    }

    .retry-btn {
      align-self: flex-start;
      appearance: none;
      border: none;
      border-radius: 999px;
      padding: 10px 24px;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      background: var(--md-sys-color-secondary);
      color: var(--md-sys-color-on-secondary);
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .retry-btn:hover {
      opacity: 0.92;
    }

    .retry-btn:focus-visible {
      outline: 2px solid var(--md-sys-color-on-secondary);
      outline-offset: 2px;
    }

    .pane.is-hidden {
      display: none;
    }

    .pane-divider.is-hidden {
      display: none;
    }

    .mobile-controls {
      display: none;
    }

    @media (max-width: 768px) {
      .viewer-page {
        height: auto;
        min-height: 100%;
      }

      .viewer-shell {
        flex-direction: column;
        gap: 12px;
      }

      .pane {
        width: 100%;
        max-width: none;
        border-radius: 12px;
        border: 1px solid var(--md-sys-color-outline-variant);
      }

      .pane-divider {
        display: none;
      }

      .email-list-pane.is-collapsed {
        flex: 0 0 auto;
        min-width: 0;
        width: 100%;
        max-width: none;
      }

      .email-list-pane.is-collapsed .expand-toggle {
        flex-direction: row;
        gap: 4px;
        padding: 8px 12px;
      }

      .email-list-pane.is-collapsed .expand-toggle .label {
        writing-mode: horizontal-tb;
        transform: none;
        letter-spacing: 0.08em;
      }

      .mobile-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: var(--md-sys-color-surface-1);
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
      }

      .mobile-back {
        appearance: none;
        border: none;
        border-radius: 999px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 500;
        background: var(--md-sys-color-primary);
        color: var(--md-sys-color-on-primary);
        cursor: pointer;
        transition: opacity 0.2s ease;
      }

      .mobile-back:hover {
        opacity: 0.92;
      }

      .mobile-back:focus-visible {
        outline: 2px solid var(--md-sys-color-on-primary);
        outline-offset: 2px;
      }

      .mobile-title {
        flex: 1;
        text-align: center;
        font-size: 14px;
        font-weight: 600;
        color: var(--md-sys-color-on-surface);
      }
    }
  `;

  _detectArchivePreference() {
    if (typeof window === 'undefined') {
      return '';
    }
    const params = new URLSearchParams(window.location.search);
    const queryPath = params.get('archive');
    const globalPath = window.__CURATE_ARCHIVE_BASE ?? window.__CURATE_ARCHIVE_PATH ?? '';
    return (queryPath || globalPath || '').toString();
  }

  _isCurateEnvironment() {
    return typeof window !== 'undefined' &&
      typeof window.Curate !== 'undefined' &&
      typeof window.pydio !== 'undefined' &&
      Boolean(window.pydio?.ApiClient);
  }

  _extractWorkspaceSlug(workspace) {
    if (!workspace) {
      return null;
    }
    if (typeof workspace === 'string') {
      return workspace;
    }
    const candidateKeys = ['slug', 'id', 'uuid', 'workspaceSlug', 'WorkspaceSlug', 'name'];
    for (const key of candidateKeys) {
      if (workspace[key]) {
        return workspace[key];
      }
    }
    if (typeof workspace.getSlug === 'function') {
      return workspace.getSlug();
    }
    if (typeof workspace.getId === 'function') {
      return workspace.getId();
    }
    return null;
  }

  _resolveArchiveMode() {
    const mode = (this.archiveMode || '').toLowerCase();
    if (mode === 'curate') {
      return 'curate';
    }
    if (mode === 'http' || mode === 'local') {
      return 'http';
    }
    return this._isCurateEnvironment() ? 'curate' : 'http';
  }

  _resolveArchiveWorkspace() {
    if (this.archiveWorkspace && this.archiveWorkspace.trim()) {
      return this.archiveWorkspace.trim();
    }
    if (!this._isCurateEnvironment()) {
      return null;
    }
    try {
      const workspace = window.Curate?.workspaces?.getOpenWorkspace?.();
      return this._extractWorkspaceSlug(workspace);
    } catch (error) {
      console.warn('Unable to detect Curate workspace automatically:', error);
      return null;
    }
  }

  _applyArchivePath() {
    const path = (this.archivePath ?? '').toString().trim();
    const mode = this._resolveArchiveMode();
    const workspace = this._resolveArchiveWorkspace();
    const workspaceKey = workspace ?? null;
    if (
      this._currentArchivePath === path &&
      this._currentArchiveMode === mode &&
      this._currentArchiveWorkspace === workspaceKey
    ) {
      return;
    }
    setArchiveBasePath({
      mode,
      basePath: path,
      workspace: workspace ?? undefined
    });
    this._currentArchivePath = path;
    this._currentArchiveMode = mode;
    this._currentArchiveWorkspace = workspaceKey;
  }

  async _refreshManifest() {
    this._applyArchivePath();
    this.messageLoading = false;
    this.loading = true;
    this.manifestError = null;
    this.emails = [];
    this.threads = {};
    this.folderTree = [];
    this.selectedEmailId = null;
    this.selectedEmail = null;
    this.emailBody = null;
    this.threadEmails = null;
    this.threadBodies = null;
    this.selectedFolderPath = null;
    this._pstFolderIndex = new Map();

    try {
      await this._loadManifest();
      this._hasInitialArchiveLoad = true;
    } catch (error) {
      console.error('Failed to load email manifest:', error);
      this.manifestError = error instanceof Error ? error : new Error(String(error));
    } finally {
      this.loading = false;
    }
  }

  _retryLoad() {
    this._refreshManifest();
  }

  _onViewportChange(event) {
    const matches = typeof event.matches === 'boolean' ? event.matches : event.currentTarget?.matches;
    if (matches === undefined) {
      return;
    }
    this.isMobile = matches;
    if (matches) {
      this.mobileView = this.selectedEmailId ? 'detail' : 'list';
      this.listCollapsed = false;
    } else {
      this.mobileView = 'list';
    }
  }

  _clampListWidth(value) {
    return Math.min(this._maxListWidth, Math.max(this._minListWidth, value));
  }

  _startResize(event) {
    if (this.isMobile || this.listCollapsed) {
      return;
    }
    if (event.target && event.target.closest('button.collapse-handle')) {
      return;
    }
    this.isDragging = true;
    const container = this.renderRoot?.querySelector('.viewer-shell');
    if (container) {
      this._containerRect = container.getBoundingClientRect();
    }
    this._dividerPointerId = event.pointerId;
    event.preventDefault();
    event.currentTarget?.setPointerCapture?.(event.pointerId);
    window.addEventListener('pointermove', this._handlePointerMove);
    window.addEventListener('pointerup', this._stopResize);
  }

  _handlePointerMove(event) {
    if (!this.isDragging || !this._containerRect) {
      return;
    }
    const relativeX = event.clientX - this._containerRect.left;
    const percentage = (relativeX / this._containerRect.width) * 100;
    this.listWidth = Math.round(this._clampListWidth(percentage) * 10) / 10;
  }

  _stopResize() {
    if (!this.isDragging) {
      return;
    }
    this.isDragging = false;
    if (this._dividerPointerId !== undefined) {
      const divider = this.renderRoot?.querySelector('.pane-divider');
      divider?.releasePointerCapture?.(this._dividerPointerId);
      this._dividerPointerId = undefined;
    }
    window.removeEventListener('pointermove', this._handlePointerMove);
    window.removeEventListener('pointerup', this._stopResize);
    this._containerRect = null;
  }

  _handleDividerKeydown(event) {
    if (this.isMobile) {
      return;
    }
    switch (event.key) {
      case 'ArrowLeft':
        this.listWidth = this._clampListWidth(this.listWidth - 2);
        event.preventDefault();
        break;
      case 'ArrowRight':
        this.listWidth = this._clampListWidth(this.listWidth + 2);
        event.preventDefault();
        break;
      case 'Home':
        this.listWidth = this._minListWidth;
        event.preventDefault();
        break;
      case 'End':
        this.listWidth = this._maxListWidth;
        event.preventDefault();
        break;
      default:
        break;
    }
  }

  async _loadManifest() {
    const manifest = await getManifest();
    const folderStructure = this._buildPstFolderStructure(manifest?.pstFolders || {});
    this._pstFolderIndex = folderStructure.index;
    this.folderTree = folderStructure.tree;

    this.emails = Array.isArray(manifest.emails)
      ? this._decorateEmails(manifest.emails, this._pstFolderIndex)
      : [];
    this.threads = manifest.threads ?? {};
    this.selectedFolderPath = null;
  }

  _buildPstFolderStructure(rawFolders) {
    if (!rawFolders || typeof rawFolders !== 'object') {
      return { tree: [], index: new Map() };
    }

    const folderEntries = Object.entries(rawFolders).filter(([key, value]) => value && (value.path || key));
    if (folderEntries.length === 0) {
      return { tree: [], index: new Map() };
    }

    const nodeMap = new Map();
    const index = new Map();

    const ensureNode = (fullPath, preferredName = null) => {
      if (!fullPath) {
        return null;
      }
      const path = fullPath.replace(/^\/+|\/+$/g, '');
      if (!path) {
        return null;
      }

      if (nodeMap.has(path)) {
        const existing = nodeMap.get(path);
        if (preferredName && !existing._hasExplicitName) {
          existing.name = preferredName;
          existing._hasExplicitName = true;
        }
        return existing;
      }

      const segments = path.split('/').filter(Boolean);
      const name = preferredName || segments[segments.length - 1] || path;
      const parentPath = segments.length > 1 ? segments.slice(0, -1).join('/') : null;

      const node = {
        path,
        name,
        parentPath,
        children: [],
        emailIds: [],
        _selfEmailIds: [],
        breadcrumbs: segments
      };
      nodeMap.set(path, node);
      index.set(path, {
        path,
        name,
        breadcrumbs: segments
      });

      if (parentPath) {
        const parent = ensureNode(parentPath);
        if (parent && !parent.children.find((child) => child.path === path)) {
          parent.children = [...parent.children, node];
        }
      }

      return node;
    };

    for (const [key, folder] of folderEntries) {
      const path = folder.path || key;
      const node = ensureNode(path, folder.name);
      if (!node) {
        continue;
      }
      node._selfEmailIds = Array.isArray(folder.emailIds)
        ? folder.emailIds.filter(Boolean)
        : [];
      node._hasExplicitName = Boolean(folder.name);
      index.set(node.path, {
        path: node.path,
        name: folder.name || node.name,
        breadcrumbs: node.breadcrumbs
      });
    }

    const aggregate = (node) => {
      const combined = new Set(node._selfEmailIds);
      node.children = node.children
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
        .map((child) => {
          const childSet = aggregate(child);
          child.emailIds = Array.from(childSet);
          child.emailCount = child.emailIds.length;
          childSet.forEach((id) => combined.add(id));
          return child;
        });
      node.emailIds = Array.from(combined);
      node.emailCount = node.emailIds.length;
      return combined;
    };

    const roots = [...nodeMap.values()].filter((node) => !node.parentPath);
    roots.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    roots.forEach((root) => {
      const aggregateSet = aggregate(root);
      root.emailIds = Array.from(aggregateSet);
      root.emailCount = aggregateSet.size;
    });

    return { tree: roots, index };
  }

  _decorateEmails(emails, folderIndex) {
    if (!Array.isArray(emails)) {
      return [];
    }
    const map = folderIndex ?? new Map();
    return emails.map((email) => {
      if (!email || !email.pstFolder) {
        return email;
      }
      const folderMeta = map.get(email.pstFolder);
      const breadcrumbs = folderMeta?.breadcrumbs?.length
        ? folderMeta.breadcrumbs
        : email.pstFolder.split('/').filter(Boolean);
      const displayLabel = folderMeta?.name || breadcrumbs[breadcrumbs.length - 1] || email.pstFolder;
      const breadcrumbLabel = breadcrumbs.length > 1
        ? breadcrumbs.join(' › ')
        : displayLabel;
      return {
        ...email,
        pstFolderDisplay: displayLabel,
        pstFolderBreadcrumb: breadcrumbLabel
      };
    });
  }

  _getThreadForEmail(emailId) {
    if (!emailId) {
      return null;
    }
    for (const [threadId, emailIds] of Object.entries(this.threads)) {
      if (emailIds.includes(emailId)) {
        return emailIds;
      }
    }
    return null;
  }

  async _handleEmailSelected(event) {
    const emailId = event.detail;
    if (!emailId) {
      this.selectedEmailId = null;
      this.selectedEmail = null;
      this.emailBody = null;
      this.threadEmails = null;
      this.threadBodies = null;
      this.messageLoading = false;
      return;
    }

    this.messageLoading = true;
    this.selectedEmailId = emailId;
    this.selectedEmail = this.emails.find((email) => email.id === emailId);

    const threadEmailIds = this._getThreadForEmail(emailId);
    try {
      if (threadEmailIds && threadEmailIds.length > 1) {
        const threadEmails = threadEmailIds
          .map((id) => this.emails.find((current) => current.id === id))
          .filter((email) => email);

        const threadBodies = {};
        for (const email of threadEmails) {
          try {
            threadBodies[email.id] = await getEmailBody(email.id);
          } catch (error) {
            console.error(`Failed to load email body for ${email.id}:`, error);
            threadBodies[email.id] = { html: '', text: 'Failed to load email content' };
          }
        }

        this.threadEmails = threadEmails;
        this.threadBodies = threadBodies;
        this.emailBody = threadBodies[emailId];
      } else {
        this.threadEmails = null;
        this.threadBodies = null;
        try {
          this.emailBody = await getEmailBody(emailId);
        } catch (error) {
          console.error('Failed to load email body:', error);
          this.emailBody = {
            html: '',
            text: 'Failed to load email content'
          };
        }
      }
    } finally {
      this.messageLoading = false;
    }

    if (this.isMobile) {
      this.mobileView = 'detail';
    }
  }

  _handleFolderSelected(event) {
    const detail = event?.detail || {};
    const nextPath = detail.folderPath || null;
    this.selectedFolderPath = nextPath;

    if (!nextPath) {
      return;
    }

    const allowedIds = Array.isArray(detail.emailIds)
      ? new Set(detail.emailIds)
      : null;

    if (this.selectedEmailId && allowedIds && !allowedIds.has(this.selectedEmailId)) {
      this.selectedEmailId = null;
      this.selectedEmail = null;
      this.emailBody = null;
      this.threadEmails = null;
      this.threadBodies = null;
      this.messageLoading = false;
      if (this.isMobile) {
        this.mobileView = 'list';
      }
    }
  }

  _handleBackToList() {
    this.mobileView = 'list';
  }

  _collapseList() {
    if (this.listCollapsed) {
      return;
    }
    this._previousListWidth = this.listWidth;
    this.listCollapsed = true;
  }

  _expandList() {
    if (!this.listCollapsed) {
      return;
    }
    this.listCollapsed = false;
    if (typeof this._previousListWidth === 'number') {
      this.listWidth = Math.min(this._maxListWidth, Math.max(this._minListWidth, this._previousListWidth || this.listWidth));
    }
  }

  _handleResizeObserverError(event) {
    const message = event?.message || event?.error?.message || '';
    if (typeof message === 'string' && message.includes('ResizeObserver loop completed')) {
      event.stopImmediatePropagation?.();
      event.preventDefault?.();
    }
  }

  render() {
    const listPaneClasses = classMap({
      pane: true,
      'email-list-pane': true,
      'is-hidden': this.isMobile && this.mobileView === 'detail',
      'is-collapsed': this.listCollapsed
    });

    const detailPaneClasses = classMap({
      pane: true,
      'email-detail-pane': true,
      'is-hidden': this.isMobile && this.mobileView !== 'detail'
    });

    const listPaneStyles = {};
    if (!this.isMobile) {
      if (this.listCollapsed) {
        listPaneStyles.flexBasis = '36px';
        listPaneStyles.minWidth = '36px';
        listPaneStyles.maxWidth = '36px';
      } else {
        listPaneStyles.flexBasis = `${this.listWidth}%`;
        delete listPaneStyles.minWidth;
        delete listPaneStyles.maxWidth;
      }
    }

    return html`
      <div class="viewer-page">
        ${this.loading && !this.manifestError ? html`
          <div class="viewer-shell">
            <div class="loading-state">Loading emails...</div>
          </div>
        ` : ''}

        ${!this.loading && this.manifestError ? html`
          <div class="error-state">
            <div class="error-card">
              <h2 class="error-title">Unable to load archive</h2>
              <p class="error-message">${this.manifestError.message || 'An unexpected error occurred while reading the archive.'}</p>
              <button class="retry-btn" type="button" @click=${this._retryLoad}>Retry</button>
            </div>
          </div>
        ` : ''}

        ${!this.loading && !this.manifestError ? html`
          <div class="viewer-shell">
            <section class=${listPaneClasses} style=${styleMap(listPaneStyles)}>
              ${this.listCollapsed ? html`
                <button
                  class="expand-toggle"
                  type="button"
                  @click=${this._expandList}
                  aria-label="Expand email list" aria-expanded="false"
                  title="Expand email list"
                >
                  <span class="icon">${chevronRightIcon}</span>
                  <span class="label">Emails</span>
                </button>
              ` : html`
                <div class="list-shell">
                  <email-list
                    .emails=${this.emails}
                    .threads=${this.threads}
                    .selectedId=${this.selectedEmailId}
                    .folderTree=${this.folderTree}
                    .selectedFolderPath=${this.selectedFolderPath}
                    @email-selected=${this._handleEmailSelected}
                    @folder-selected=${this._handleFolderSelected}
                  ></email-list>
                </div>
              `}
            </section>

            <div
              class=${classMap({
                'pane-divider': true,
                'is-hidden': this.isMobile || this.listCollapsed
              })}
              role="separator"
              aria-label="Resize email list"
              aria-orientation="vertical"
              aria-valuemin=${this._minListWidth}
              aria-valuemax=${this._maxListWidth}
              aria-valuenow=${Math.round(this.listWidth)}
              tabindex="0"
              @pointerdown=${this._startResize}
              @keydown=${this._handleDividerKeydown}
            >
              <span class="divider-grip" aria-hidden="true"></span>
              ${!this.listCollapsed ? html`
                <button
                  class="collapse-handle"
                  type="button"
                  aria-label="Collapse email list" aria-expanded="true"
                  title="Collapse email list"
                  @click=${this._collapseList}
                >
                  <span class="icon">${chevronLeftIcon}</span>
                </button>
              ` : ''}
            </div>

            <section class=${detailPaneClasses}>
              ${this.messageLoading ? html`
                <div class="message-loading-overlay" aria-live="polite" aria-busy="true">
                  <md-circular-progress indeterminate></md-circular-progress>
                </div>
              ` : ''}
              ${this.isMobile ? html`
                <div class="mobile-controls">
                  <button class="mobile-back" @click=${this._handleBackToList}>Back</button>
                  <div class="mobile-title">${this.selectedEmail?.subject || 'Email details'}</div>
                </div>
              ` : ''}
              <email-detail
                .email=${this.selectedEmail}
                .emailBody=${this.emailBody}
                .threadEmails=${this.threadEmails}
                .threadBodies=${this.threadBodies}
                .selectedEmailId=${this.selectedEmailId}
              ></email-detail>
            </section>
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('email-viewer', EmailViewer);

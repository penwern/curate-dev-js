import { LitElement, html, css, nothing } from "lit";
import { map } from "lit/directives/map.js";
import debounce from "lodash-es/debounce";

// Import child components
import "./components/as-header.js";
import "./components/as-breadcrumb.js";
import "./components/as-browse-tabs.js";
import "./components/as-filter-summary.js";
import "./components/as-tree-view.js";
import "./components/as-flat-list.js";
import "./components/as-detail-panel.js";
import "./components/as-card.js";
import "./components/as-empty-state.js";
import "./components/as-pagination.js";
import "../utils/penwern-spinner.js";

// Import utilities
import {
  flattenTree,
  findNode,
  findNodeByLogicalId,
  getBreadcrumbs,
  collectNodeAndDescendants,
  getVisibleTreeRows,
} from "./utils/tree-helpers.js";
import {
  matchesCollectionSearch,
  matchesRepositorySearch,
  getNodeMatchMetadata,
} from "./utils/search-helpers.js";

// Import API client
import {
  fetchResourceTreeRoot,
  fetchResourceTreeChildren,
  searchGlobal,
  searchResource,
  fetchResourcePaths,
  fetchRepositories,
  fetchRepositoryResources,
  createCurateFolders,
} from "./api-client.js";

// Import icons
import { databaseIcon, layersIcon, pinIcon } from "../utils/icons.js";

/**
 * Main ArchivesSpace Browser component.
 * Orchestrates all child components and manages application state.
 */
class ArchivespaceBrowser extends LitElement {
  static properties = {
    // Navigation state
    currentView: { state: true },
    activeBrowseTab: { state: true },
    selectedRepository: { state: true },
    selectedCollection: { state: true },

    // Pagination
    currentPage: { state: true },
    itemsPerPage: { state: true },

    // Search and filter
    searchQuery: { type: String },
    collectionFilter: { type: String },
    browseSearchField: { state: true },
    treeSearchField: { state: true },
    searchFieldMenuOpen: { state: true },
    filterMenuOpen: { state: true },
    selectedLevels: { state: true },
    selectedStatuses: { state: true },
    searchScope: { state: true },
    advancedFilters: { state: true },

    // Tree state
    expandedNodes: { state: true },
    selectedNodeId: { type: String },
    selectedRecordIds: { state: true },
    recordViewMode: { state: true },
    searchResults: { state: true },
    searchTotalHits: { state: true },
    searchPageSize: { state: true },
    searchCurrentPage: { state: true },
    activeSearchIndex: { state: true },
    searchResultIds: { state: true },
    searchMatchMetadata: { state: true },

    // Loading states
    repositoriesLoading: { state: true },
    collectionsLoading: { state: true },
    treeLoading: { state: true },
    treeSearchLoading: { state: true },
    childrenLoadingForId: { state: true },

    // Action panel state
    detailLevelMode: { state: true },
    perFileMode: { state: true },
    preserveStructure: { state: true },
    createFoldersLoading: { state: true },
    createFoldersFeedback: { state: true },

    // Data
    repositories: { state: true },
    collections: { state: true },
    archiveData: { state: true },
    resourceId: { type: String },
    repositoryId: { type: String },
    apiHost: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      --panel-padding: 16px;
      --header-height: 64px;
      --tabs-height: 48px;
      --breadcrumb-height: 48px;
      --detail-panel-width: 360px;
      --indent-size: 24px;
      --node-vertical-padding: 8px;
      --header-control-height: 36px;
    }

    :host([fill]) {
      height: 100%;
      min-height: 0;
    }

    .container {
      display: flex;
      flex-direction: column;
      height: 600px;
      max-height: 80vh;
      background: var(--md-sys-color-surface);
      border-radius: 16px;
      overflow: hidden;
      font-family: "Roboto", sans-serif;
    }

    :host([fill]) .container {
      height: 100%;
      max-height: 100%;
      min-height: 0;
    }

    .content {
      display: grid;
      grid-template-columns: 1fr var(--detail-panel-width);
      flex: 1;
      overflow: hidden;
      min-height: 0;
    }

    .content.single-panel {
      grid-template-columns: 1fr;
    }

    .main-panel {
      overflow-y: auto;
      padding: var(--panel-padding);
      min-height: 0;
    }

    .main-panel.with-border {
      border-right: 1px solid var(--md-sys-color-outline-variant);
    }

    .main-panel::-webkit-scrollbar {
      width: 8px;
    }

    .main-panel::-webkit-scrollbar-thumb {
      background: var(--md-sys-color-outline-variant);
      border-radius: 4px;
    }

    .loading-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 220px;
    }

    .tree-loading-panel {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 0;
    }

    .collection-grid {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }

    .detail-panel {
      overflow-y: auto;
      background: var(--md-sys-color-surface-1);
      padding: 8px;
      min-height: 0;
    }

    .detail-panel::-webkit-scrollbar {
      width: 8px;
    }

    .detail-panel::-webkit-scrollbar-thumb {
      background: var(--md-sys-color-outline-variant);
      border-radius: 4px;
    }

    @media (max-width: 800px) {
      :host {
        --detail-panel-width: 0px;
      }

      .content {
        grid-template-columns: 1fr;
      }

      .detail-panel {
        display: none;
      }

      .main-panel.with-border {
        border-right: none;
      }

      .collection-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 500px) {
      :host {
        --panel-padding: 12px;
        --header-control-height: 32px;
      }
    }
  `;

  constructor() {
    super();

    // Navigation state
    this.currentView = "browse";
    this.activeBrowseTab = "repository";
    this.selectedRepository = null;
    this.selectedCollection = null;

    // Pagination
    this.currentPage = 1;
    this.itemsPerPage = 12;

    // Search and filter
    this.searchQuery = "";
    this.collectionFilter = "";
    this.browseSearchField = "all";
    this.treeSearchField = "all";
    this.searchFieldMenuOpen = false;
    this.filterMenuOpen = false;
    this.selectedLevels = [];
    this.selectedStatuses = [];
    this.searchScope = "collection";
    this.advancedFilters = [];

    // Tree state
    this.expandedNodes = new Set();
    this.selectedNodeId = null;
    this.selectedRecordIds = [];
    this.recordViewMode = "tree";
    this.searchResults = [];
    this.searchTotalHits = 0;
    this.searchPageSize = 20;
    this.searchCurrentPage = 1;
    this.activeSearchIndex = -1;
    this.searchResultIds = new Set();
    this.searchMatchMetadata = new Map();

    // Loading states
    this.repositoriesLoading = false;
    this.collectionsLoading = false;
    this.treeLoading = false;
    this.treeSearchLoading = false;
    this.childrenLoadingForId = null;

    // Action panel state
    this.detailLevelMode = "per-file";
    this.perFileMode = "components";
    this.preserveStructure = false;
    this.createFoldersLoading = false;
    this.createFoldersFeedback = null;

    // Data
    this.repositories = [];
    this.collections = [];
    this.archiveData = [];

    // API configuration
    this.apiHost = window.origin + "/api/archivesspace";
    this.curateBasePath = "";
    this.curateParentPath = "/quarantine";

    // Internal state
    this._visibleTreeRows = [];
    this._boundDocumentClick = this._handleDocumentClick.bind(this);
    this._collectionsLoadedRepositoryIds = new Set();
    this._pendingLoadAllCollections = false;
    this._createFoldersFeedbackTimeout = null;

    // Debounced search handlers
    const searchDebounceMs = 700;
    this._debouncedTreeSearch = debounce((value) => {
      if (this.currentView !== "tree" && !this._isGlobalSearchContext()) return;
      const raw = value ?? "";
      const query = raw.trim();
      this.searchQuery = raw;

      if (!query) {
        if (this._hasActiveFilters()) {
          this._applyFiltersOnly();
        } else {
          this._clearTreeSearchState();
          this.recordViewMode = "tree";
          this.searchCurrentPage = 1;
          this.activeSearchIndex = -1;
        }
        return;
      }

      this.recordViewMode = "flat";
      this.searchCurrentPage = 1;
      this.activeSearchIndex = -1;

      if (this._isGlobalSearchContext()) {
        this._loadGlobalSearchPage(1);
      } else if (this.resourceId) {
        this._loadSearchPage(1);
      } else {
        this._updateTreeSearchLocal(query);
      }
    }, searchDebounceMs);

    this._debouncedCollectionSearch = debounce(() => {
      if (this.currentView !== "browse" && this.currentView !== "collections") return;
      this.currentPage = 1;
      if (
        (this.currentView === "browse" && this.activeBrowseTab === "collections") ||
        this.currentView === "collections"
      ) {
        this._ensureAllCollectionsLoaded();
      }
    }, searchDebounceMs);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._boundDocumentClick);
    this._loadRepositoriesFromApi();
    if (this.resourceId && this.repositoryId) {
      this._loadRootTreeFromApi();
    }
  }

  disconnectedCallback() {
    this._debouncedTreeSearch?.cancel?.();
    this._debouncedCollectionSearch?.cancel?.();
    if (this._createFoldersFeedbackTimeout) {
      clearTimeout(this._createFoldersFeedbackTimeout);
      this._createFoldersFeedbackTimeout = null;
    }
    document.removeEventListener("click", this._boundDocumentClick);
    super.disconnectedCallback();
  }

  render() {
    return html`
      <div class="container">
        ${this._renderHeader()}
        ${this._renderBreadcrumb()}
        ${this.currentView === "tree" ? this._renderFilterSummary() : nothing}
        ${this.currentView === "browse" ? this._renderBrowseTabs() : nothing}
        ${this._renderMainContent()}
      </div>
    `;
  }

  // ===================
  // RENDER METHODS
  // ===================

  _renderHeader() {
    const isTreeView = this.currentView === "tree";
    const isGlobalSearch = this._isGlobalSearchContext();
    const isSearchContext = isTreeView || isGlobalSearch;
    const showSearchNavigation =
      ((isTreeView && this.recordViewMode === "flat") || isGlobalSearch) &&
      this.searchResults?.length > 0;
    const hasActiveSearchOrFilters =
      this.searchQuery.trim().length > 0 || this._hasActiveFilters();
    const showBackToSearch =
      isTreeView &&
      this.recordViewMode === "tree" &&
      this.searchResults?.length > 0 &&
      hasActiveSearchOrFilters;

    const searchTotal = this.searchTotalHits || this.searchResults?.length || 0;
    const pageSize = this.searchPageSize || 20;
    const page = this.searchCurrentPage || 1;
    const indexInPage = this.activeSearchIndex >= 0 ? this.activeSearchIndex : 0;
    const searchCurrent =
      searchTotal > 0 && this.activeSearchIndex >= 0
        ? (page - 1) * pageSize + indexInPage + 1
        : 0;

    const selectedNode = this.selectedNodeId
      ? findNodeByLogicalId(this.archiveData, this.selectedNodeId)
      : null;

    return html`
      <as-header
        .title=${"ArchivesSpace Browser"}
        .searchQuery=${isSearchContext ? this.searchQuery : this.collectionFilter}
        .searchLabel=${this._getSearchLabel()}
        .searchFieldOptions=${this._getSearchFieldOptions()}
        .activeSearchField=${isSearchContext ? this.treeSearchField : this.browseSearchField}
        .searchFieldMenuOpen=${this.searchFieldMenuOpen}
        .filterMenuOpen=${this.filterMenuOpen}
        .isTreeView=${isTreeView}
        .showFilters=${isTreeView || isGlobalSearch}
        .showNavigation=${showSearchNavigation}
        .showViewToggle=${isTreeView}
        .showBackToSearch=${showBackToSearch}
        .searchTotal=${searchTotal}
        .searchCurrent=${searchCurrent}
        .recordViewMode=${this.recordViewMode}
        .selectedLevels=${this.selectedLevels}
        .selectedStatuses=${this.selectedStatuses}
        .searchScope=${this.searchScope}
        .advancedFilters=${this.advancedFilters}
        .hasSelection=${Boolean(this.selectedNodeId)}
        .selectedNodeTitle=${selectedNode?.title || ""}
        @search-input=${this._handleSearchInput}
        @search-clear=${this._handleSearchClear}
        @search-field-toggle=${this._handleSearchFieldToggle}
        @search-field-change=${this._handleSearchFieldChange}
        @filter-toggle=${this._handleFilterToggle}
        @filter-close=${this._handleFilterClose}
        @toggle-level=${this._handleToggleLevel}
        @toggle-status=${this._handleToggleStatus}
        @scope-change=${this._handleScopeChange}
        @add-advanced=${this._handleAddAdvanced}
        @remove-advanced=${this._handleRemoveAdvanced}
        @clear-all=${this._handleClearAllFilters}
        @search-prev=${this._handleSearchPrev}
        @search-next=${this._handleSearchNext}
        @view-mode-change=${this._handleViewModeChange}
        @back-to-search=${this._handleBackToSearch}
      ></as-header>
    `;
  }

  _renderBreadcrumb() {
    const crumbs = this._getBreadcrumbPath();
    if (crumbs.length === 0) return nothing;

    return html`
      <as-breadcrumb
        .crumbs=${crumbs}
        @navigate=${this._handleBreadcrumbNavigate}
      ></as-breadcrumb>
    `;
  }

  _renderFilterSummary() {
    if (!this._hasActiveFilters()) return nothing;

    const selectedNode = this.selectedNodeId
      ? findNodeByLogicalId(this.archiveData, this.selectedNodeId)
      : null;

    return html`
      <as-filter-summary
        .selectedLevels=${this.selectedLevels}
        .selectedStatuses=${this.selectedStatuses}
        .searchScope=${this.searchScope}
        .advancedFilters=${this.advancedFilters}
        .selectedNodeTitle=${selectedNode?.title || ""}
        @remove-level=${this._handleRemoveLevel}
        @remove-status=${this._handleRemoveStatus}
        @remove-scope=${this._handleRemoveScope}
        @remove-advanced=${this._handleRemoveAdvanced}
        @clear-all=${this._handleClearAllFilters}
      ></as-filter-summary>
    `;
  }

  _renderBrowseTabs() {
    return html`
      <as-browse-tabs
        .activeTab=${this.activeBrowseTab}
        @tab-change=${this._handleTabChange}
      ></as-browse-tabs>
    `;
  }

  _renderMainContent() {
    if (this.currentView === "browse") {
      return this._renderBrowseView();
    } else if (this.currentView === "collections") {
      return this._renderCollectionsView();
    } else if (this.currentView === "tree") {
      return this._renderTreeView();
    }
    return nothing;
  }

  _renderBrowseView() {
    if (this.activeBrowseTab === "repository") {
      return this._renderRepositoryList();
    } else if (this.activeBrowseTab === "collections") {
      return this._renderAllCollections();
    } else if (this.activeBrowseTab === "search") {
      return this._renderGlobalSearchView();
    }
    return html`
      <div class="content single-panel">
        <div class="main-panel">
          <as-empty-state
            title="${this.activeBrowseTab} view"
            message="This browse view is coming soon."
          ></as-empty-state>
        </div>
      </div>
    `;
  }

  _renderRepositoryList() {
    const query = this.collectionFilter.trim().toLowerCase();
    const filtered = this.repositories.filter((repo) =>
      query ? matchesRepositorySearch(repo, query, this.browseSearchField) : true
    );

    if (this.repositoriesLoading && !this.repositories.length) {
      return html`
        <div class="content single-panel">
          <div class="main-panel loading-panel">
            <penwern-spinner size="72"></penwern-spinner>
          </div>
        </div>
      `;
    }

    if (filtered.length === 0) {
      return html`
        <div class="content single-panel">
          <div class="main-panel">
            <as-empty-state
              title="No repositories found"
              message="Try adjusting your search."
            ></as-empty-state>
          </div>
        </div>
      `;
    }

    const { items: paginatedItems, totalPages } = this._paginate(filtered);

    return html`
      <div class="content single-panel">
        <div class="main-panel">
          <div class="collection-grid">
            ${map(
              paginatedItems,
              (repo) => html`
                <as-card
                  .cardTitle=${repo.name}
                  .code=${repo.code}
                  .icon=${databaseIcon}
                  .meta=${[
                    { icon: pinIcon, label: repo.location },
                  ]}
                  .query=${this.collectionFilter}
                  @card-click=${() => this._selectRepository(repo)}
                ></as-card>
              `
            )}
          </div>
          ${totalPages > 1
            ? html`
                <as-pagination
                  .currentPage=${this.currentPage}
                  .totalPages=${totalPages}
                  .totalItems=${filtered.length}
                  .itemsPerPage=${this.itemsPerPage}
                  @page-change=${this._handlePageChange}
                ></as-pagination>
              `
            : nothing}
        </div>
      </div>
    `;
  }

  _renderCollectionsView() {
    const filtered = this._getFilteredCollections();

    if (this.collectionsLoading && !this.collections.length) {
      return html`
        <div class="content single-panel">
          <div class="main-panel loading-panel">
            <penwern-spinner size="72"></penwern-spinner>
          </div>
        </div>
      `;
    }

    if (filtered.length === 0) {
      return html`
        <div class="content single-panel">
          <div class="main-panel">
            <as-empty-state
              title="No collections found"
              message="Try adjusting your search."
            ></as-empty-state>
          </div>
        </div>
      `;
    }

    const { items: paginatedItems, totalPages } = this._paginate(filtered);

    return html`
      <div class="content single-panel">
        <div class="main-panel">
          <div class="collection-grid">
            ${map(
              paginatedItems,
              (coll) => html`
                <as-card
                  .cardTitle=${coll.title}
                  .code=${coll.code}
                  .icon=${layersIcon}
                  .meta=${[
                    { label: coll.extent },
                    { label: coll.dateRange },
                  ].filter((m) => m.label)}
                  .query=${this.collectionFilter}
                  @card-click=${() => this._selectCollection(coll)}
                ></as-card>
              `
            )}
          </div>
          ${totalPages > 1
            ? html`
                <as-pagination
                  .currentPage=${this.currentPage}
                  .totalPages=${totalPages}
                  .totalItems=${filtered.length}
                  .itemsPerPage=${this.itemsPerPage}
                  @page-change=${this._handlePageChange}
                ></as-pagination>
              `
            : nothing}
        </div>
      </div>
    `;
  }

  _renderAllCollections() {
    return this._renderCollectionsView();
  }

  _renderGlobalSearchView() {
    const hasQueryOrFilters =
      this.searchQuery.trim().length > 0 || this._hasActiveFilters();

    if (this.treeSearchLoading) {
      return html`
        <div class="content single-panel">
          <div class="main-panel loading-panel">
            <penwern-spinner size="72"></penwern-spinner>
          </div>
        </div>
      `;
    }

    if (!hasQueryOrFilters) {
      return html`
        <div class="content single-panel">
          <div class="main-panel">
            <as-empty-state
              title="Search records"
              message=${this.resourceId
                ? "Enter a term to search across this collection's records."
                : "Select a collection first, then enter a term to search its records."}
            ></as-empty-state>
          </div>
        </div>
      `;
    }

    return html`
      <div class="content single-panel">
        <div class="main-panel">
          ${this._renderFlatSearchResults()}
        </div>
      </div>
    `;
  }

  _renderTreeView() {
    const treeData = this._getFilteredTreeData();
    const selectedNode = findNode(this.archiveData, this.selectedNodeId);
    const breadcrumbs = getBreadcrumbs(this.archiveData, this.selectedNodeId);

    let mainPanelContent = null;
    let detailPanelContent = null;

    if (this.recordViewMode === "tree") {
      if (this.treeLoading && (!treeData || treeData.length === 0)) {
        mainPanelContent = html`
          <div class="tree-loading-panel">
            <penwern-spinner size="72"></penwern-spinner>
          </div>
        `;
      } else if (!treeData || treeData.length === 0) {
        mainPanelContent = html`
          <as-empty-state
            title="No records match filters"
            message="Adjust search filters or clear them to see more of the tree."
          ></as-empty-state>
        `;
      } else {
        const rows = getVisibleTreeRows(treeData, this.expandedNodes);
        this._visibleTreeRows = rows;
        mainPanelContent = html`
          <as-tree-view
            .rows=${rows}
            .expandedNodes=${this.expandedNodes}
            .selectedNodeId=${this.selectedNodeId}
            .selectedRecordIds=${this.selectedRecordIds}
            .searchQuery=${this.searchQuery}
            .searchResultIds=${this.searchResultIds}
            .childrenLoadingForId=${this.childrenLoadingForId}
            @node-select=${this._handleNodeSelect}
            @node-expand=${this._handleNodeExpand}
            @node-collapse=${this._handleNodeCollapse}
            @record-toggle=${this._handleRecordToggle}
            @expand-branch=${this._handleExpandBranch}
            @collapse-branch=${this._handleCollapseBranch}
            @scroll-near-end=${this._handleScrollNearEnd}
          ></as-tree-view>
        `;
      }
    } else {
      const isActivelyFiltering =
        this.searchQuery.trim().length > 0 || this._hasActiveFilters();

      if (this.treeSearchLoading) {
        mainPanelContent = html`
          <div class="tree-loading-panel">
            <penwern-spinner size="72"></penwern-spinner>
          </div>
        `;
      } else if (this.searchResults?.length) {
        mainPanelContent = this._renderFlatSearchResults();
      } else if (isActivelyFiltering) {
        mainPanelContent = html`
          <as-empty-state
            title="No results found"
            message="Try adjusting your search or filter criteria."
          ></as-empty-state>
        `;
      } else {
        const flatRecords = flattenTree(treeData);
        mainPanelContent = html`
          <as-flat-list
            .items=${flatRecords}
            .selectedIndex=${-1}
            .selectedRecordIds=${this.selectedRecordIds}
            .searchQuery=${this.searchQuery}
            @item-select=${this._handleFlatItemSelect}
            @record-toggle=${this._handleRecordToggle}
          ></as-flat-list>
        `;
      }
    }

    // Determine detail panel content
    if (
      this.recordViewMode === "flat" &&
      this.searchResults?.length &&
      this.activeSearchIndex >= 0
    ) {
      const result = this.searchResults[this.activeSearchIndex];
      const nodeFromTree = result?.uri
        ? findNode(this.archiveData, result.uri)
        : null;
      if (nodeFromTree) {
        const crumbs = getBreadcrumbs(this.archiveData, nodeFromTree.id);
        detailPanelContent = html`
          <as-detail-panel
            .node=${nodeFromTree}
            .breadcrumbs=${crumbs}
            .selectedRecordIds=${this.selectedRecordIds}
            .detailLevelMode=${this.detailLevelMode}
            .perFileMode=${this.perFileMode}
            .preserveStructure=${this.preserveStructure}
            .createFoldersLoading=${this.createFoldersLoading}
            .createFoldersFeedback=${this.createFoldersFeedback}
            .searchQuery=${this.searchQuery}
            @detail-level-change=${this._handleDetailLevelChange}
            @per-file-mode-change=${this._handlePerFileModeChange}
            @preserve-structure-change=${this._handlePreserveStructureChange}
            @clear-selection=${this._handleClearSelection}
            @navigate-selection=${this._handleNavigateSelection}
            @action-click=${this._handleActionClick}
          ></as-detail-panel>
        `;
      } else if (result) {
        detailPanelContent = html`
          <as-detail-panel
            .node=${{
              title: result.title || "(Untitled)",
              type: result.level || "item",
              id: result.uri,
            }}
            .breadcrumbs=${result.ancestors || []}
            .selectedRecordIds=${this.selectedRecordIds}
            .isSearchResult=${true}
            .createFoldersLoading=${this.createFoldersLoading}
            .createFoldersFeedback=${this.createFoldersFeedback}
            @clear-selection=${this._handleClearSelection}
            @navigate-selection=${this._handleNavigateSelection}
          ></as-detail-panel>
        `;
      }
    } else if (selectedNode) {
      detailPanelContent = html`
        <as-detail-panel
          .node=${selectedNode}
          .breadcrumbs=${breadcrumbs}
          .selectedRecordIds=${this.selectedRecordIds}
          .detailLevelMode=${this.detailLevelMode}
          .perFileMode=${this.perFileMode}
          .preserveStructure=${this.preserveStructure}
          .createFoldersLoading=${this.createFoldersLoading}
          .createFoldersFeedback=${this.createFoldersFeedback}
          .searchQuery=${this.searchQuery}
          @detail-level-change=${this._handleDetailLevelChange}
          @per-file-mode-change=${this._handlePerFileModeChange}
          @preserve-structure-change=${this._handlePreserveStructureChange}
          @clear-selection=${this._handleClearSelection}
          @navigate-selection=${this._handleNavigateSelection}
          @action-click=${this._handleActionClick}
        ></as-detail-panel>
      `;
    } else {
      detailPanelContent = html`<as-detail-panel></as-detail-panel>`;
    }

    return html`
      <div class="content">
        <div class="main-panel with-border">${mainPanelContent}</div>
        <div class="detail-panel">${detailPanelContent}</div>
      </div>
    `;
  }

  _renderFlatSearchResults() {
    const results = this.searchResults || [];
    if (!results.length) {
      return html`
        <as-empty-state
          title="No matching records"
          message="Try a different search term or adjust filters."
        ></as-empty-state>
      `;
    }

    const totalPages = Math.ceil(this.searchTotalHits / this.searchPageSize);

    return html`
      <as-flat-list
        .items=${results}
        .selectedIndex=${this.activeSearchIndex}
        .selectedRecordIds=${this.selectedRecordIds}
        .searchQuery=${this.searchQuery}
        .currentPage=${this.searchCurrentPage}
        .totalPages=${totalPages}
        .totalItems=${this.searchTotalHits}
        .itemsPerPage=${this.searchPageSize}
        @item-select=${this._handleSearchResultSelect}
        @record-toggle=${this._handleRecordToggle}
        @page-change=${this._handleSearchPageChange}
      ></as-flat-list>
    `;
  }

  // ===================
  // EVENT HANDLERS
  // ===================

  _handleDocumentClick(event) {
    const path = event.composedPath ? event.composedPath() : [];
    const clickedSearchField = path.some(
      (node) =>
        node?.tagName?.toLowerCase() === "as-search-field-selector" ||
        node?.dataset?.popover === "search-field"
    );
    if (!clickedSearchField && this.searchFieldMenuOpen) {
      this.searchFieldMenuOpen = false;
    }
    const clickedFilter = path.some(
      (node) =>
        node?.tagName?.toLowerCase() === "as-filter-popover" ||
        node?.dataset?.popover === "filter"
    );
    if (!clickedFilter && this.filterMenuOpen) {
      this.filterMenuOpen = false;
    }
  }

  _handleSearchInput(e) {
    const value = e.detail?.value ?? "";
    if (this.currentView === "tree" || this._isGlobalSearchContext()) {
      this._debouncedTreeSearch?.(value);
    } else {
      this.collectionFilter = value;
      this._debouncedCollectionSearch?.();
    }
  }

  _handleSearchClear() {
    this._debouncedTreeSearch?.cancel?.();
    this._debouncedCollectionSearch?.cancel?.();
    this.searchQuery = "";
    this.collectionFilter = "";

    if (this.currentView === "tree") {
      if (this._hasActiveFilters()) {
        this._applyFiltersOnly();
      } else {
        this.searchResults = [];
        this.searchTotalHits = 0;
        this.searchCurrentPage = 1;
        this.activeSearchIndex = -1;
        this.recordViewMode = "tree";
      }
    } else if (this._isGlobalSearchContext()) {
      this._clearTreeSearchState();
    } else {
      this.currentPage = 1;
    }
  }

  _handleSearchFieldToggle() {
    this.searchFieldMenuOpen = !this.searchFieldMenuOpen;
    if (this.searchFieldMenuOpen) {
      this.filterMenuOpen = false;
    }
  }

  _handleSearchFieldChange(e) {
    const value = e.detail?.value;
    if (this.currentView === "tree" || this._isGlobalSearchContext()) {
      this.treeSearchField = value;
      if (this.searchQuery.trim().length > 0) {
        this._reapplySearchWithFilters();
      }
    } else {
      this.browseSearchField = value;
    }
    this.searchFieldMenuOpen = false;
  }

  _handleFilterToggle() {
    this.filterMenuOpen = !this.filterMenuOpen;
    if (this.filterMenuOpen) {
      this.searchFieldMenuOpen = false;
    }
  }

  _handleFilterClose() {
    this.filterMenuOpen = false;
  }

  _handleToggleLevel(e) {
    const level = e.detail?.level;
    if (this.selectedLevels.includes(level)) {
      this.selectedLevels = this.selectedLevels.filter((l) => l !== level);
    } else {
      this.selectedLevels = [...this.selectedLevels, level];
    }
    this._reapplySearchWithFilters();
  }

  _handleToggleStatus(e) {
    const status = e.detail?.status;
    if (this.selectedStatuses.includes(status)) {
      this.selectedStatuses = this.selectedStatuses.filter((s) => s !== status);
    } else {
      this.selectedStatuses = [...this.selectedStatuses, status];
    }
    this._reapplySearchWithFilters();
  }

  _handleScopeChange(e) {
    const value = e.detail?.value;
    this.searchScope = value === "subtree" ? "subtree" : "collection";
    this._reapplySearchWithFilters();
  }

  _handleAddAdvanced(e) {
    const value = e.detail?.value;
    if (value && !this.advancedFilters.includes(value)) {
      this.advancedFilters = [...this.advancedFilters, value];
      this._reapplySearchWithFilters();
    }
  }

  _handleRemoveAdvanced(e) {
    const index = e.detail?.index;
    this.advancedFilters = this.advancedFilters.filter((_, i) => i !== index);
    this._reapplySearchWithFilters();
  }

  _handleRemoveLevel(e) {
    const level = e.detail?.level;
    this.selectedLevels = this.selectedLevels.filter((l) => l !== level);
    this._reapplySearchWithFilters();
  }

  _handleRemoveStatus(e) {
    const status = e.detail?.status;
    this.selectedStatuses = this.selectedStatuses.filter((s) => s !== status);
    this._reapplySearchWithFilters();
  }

  _handleRemoveScope() {
    this.searchScope = "collection";
    this._reapplySearchWithFilters();
  }

  _handleClearAllFilters() {
    this.selectedLevels = [];
    this.selectedStatuses = [];
    this.searchScope = "collection";
    this.advancedFilters = [];

    if (!this.searchQuery || !this.searchQuery.trim()) {
      this._clearTreeSearchState();
      this.recordViewMode = "tree";
    } else {
      this._reapplySearchWithFilters();
    }
  }

  _handleSearchPrev() {
    const total = this.searchTotalHits || this.searchResults?.length || 0;
    if (!total) return;
    const pageSize = this.searchPageSize || 20;
    const page = this.searchCurrentPage || 1;
    const indexInPage = this.activeSearchIndex >= 0 ? this.activeSearchIndex : 0;
    const globalIndex = (page - 1) * pageSize + indexInPage;
    if (globalIndex <= 0) return;

    if (indexInPage > 0) {
      this._selectSearchResult(indexInPage - 1);
      return;
    }

    const prevPage = page - 1;
    if (prevPage < 1) return;
    this._loadSearchPage(prevPage).then(() => {
      const lastIndex = (this.searchResults?.length || 1) - 1;
      this._selectSearchResult(lastIndex);
    });
  }

  _handleSearchNext() {
    const total = this.searchTotalHits || this.searchResults?.length || 0;
    if (!total) return;
    const pageSize = this.searchPageSize || 20;
    const page = this.searchCurrentPage || 1;
    const indexInPage = this.activeSearchIndex >= 0 ? this.activeSearchIndex : -1;
    const globalIndex = (page - 1) * pageSize + indexInPage;
    if (globalIndex + 1 >= total) return;

    const resultsLength = this.searchResults?.length || 0;
    if (indexInPage + 1 < resultsLength) {
      this._selectSearchResult(indexInPage + 1);
      return;
    }

    const nextPage = page + 1;
    this._loadSearchPage(nextPage).then(() => {
      if (this.searchResults?.length) {
        this._selectSearchResult(0);
      }
    });
  }

  _handleViewModeChange(e) {
    const mode = e.detail?.mode;
    if (mode === this.recordViewMode) return;
    this.recordViewMode = mode;
    const hasActiveSearch = this.searchQuery.trim().length > 0 || this._hasActiveFilters();
    if (mode === "tree" && !hasActiveSearch) {
      this._clearTreeSearchState();
    } else if (mode === "tree" && this.searchQuery.trim().length > 0) {
      if (this.searchResults.length > 0) {
        const targetIndex = this.activeSearchIndex >= 0 ? this.activeSearchIndex : 0;
        this._focusSearchResult(targetIndex);
      }
    } else if (mode === "flat") {
      // When switching to flat mode, load all records via search API if no active search
      if (!hasActiveSearch && this.resourceId) {
        this._loadSearchPage(1);
      }
    }
  }

  _handleBackToSearch() {
    this.recordViewMode = "flat";
  }

  _handleTabChange(e) {
    this.activeBrowseTab = e.detail?.tab || "repository";
    this.collectionFilter = "";
    this.currentPage = 1;
    if (this.activeBrowseTab === "collections") {
      this._ensureAllCollectionsLoaded();
    }
  }

  _handlePageChange(e) {
    this.currentPage = e.detail?.page || 1;
  }

  _handleSearchPageChange(e) {
    const page = e.detail?.page;
    if (this._isGlobalSearchContext()) {
      this._loadGlobalSearchPage(page);
    } else {
      this._loadSearchPage(page);
    }
  }

  _handleBreadcrumbNavigate(e) {
    const index = e.detail?.index;
    this._navigateToCrumb(index);
  }

  _handleNodeSelect(e) {
    this.selectedNodeId = e.detail?.nodeId;
  }

  _handleNodeExpand(e) {
    const nodeId = e.detail?.nodeId;
    const node = e.detail?.node;
    const newExpanded = new Set(this.expandedNodes);
    newExpanded.add(nodeId);
    this.expandedNodes = newExpanded;
    if (node && node.has_children && !node.childrenLoaded) {
      this._loadChildrenFromApi(node);
    }
  }

  _handleNodeCollapse(e) {
    const nodeId = e.detail?.nodeId;
    const newExpanded = new Set(this.expandedNodes);
    newExpanded.delete(nodeId);
    this.expandedNodes = newExpanded;
  }

  _handleRecordToggle(e) {
    console.log('[ArchivespaceBrowser] _handleRecordToggle called', {
      nodeId: e.detail?.nodeId,
      currentSelectedRecordIds: this.selectedRecordIds
    });

    const nodeId = e.detail?.nodeId;
    if (!nodeId) return;
    const alreadySelected = this.selectedRecordIds.includes(nodeId);
    if (alreadySelected) {
      const index = this.selectedRecordIds.indexOf(nodeId);
      const updated = this.selectedRecordIds.filter((id) => id !== nodeId);
      this.selectedRecordIds = updated;
      console.log('[ArchivespaceBrowser] Removed from selection, new list:', updated);
      if (this.selectedNodeId === nodeId && updated.length > 0) {
        const fallbackIndex = Math.min(index, updated.length - 1);
        this.selectedNodeId = updated[fallbackIndex];
      }
    } else {
      this.selectedRecordIds = [...this.selectedRecordIds, nodeId];
      this.selectedNodeId = nodeId;
      console.log('[ArchivespaceBrowser] Added to selection, new list:', this.selectedRecordIds);
    }
  }

  _handleExpandBranch(e) {
    const node = e.detail?.node;
    if (!node) return;
    const newExpanded = new Set(this.expandedNodes);
    for (const id of collectNodeAndDescendants(node)) {
      newExpanded.add(id);
    }
    this.expandedNodes = newExpanded;
    if (node.has_children && !node.childrenLoaded) {
      this._loadChildrenFromApi(node);
    }
  }

  _handleCollapseBranch(e) {
    const node = e.detail?.node;
    if (!node) return;
    const newExpanded = new Set(this.expandedNodes);
    for (const id of collectNodeAndDescendants(node)) {
      newExpanded.delete(id);
    }
    this.expandedNodes = newExpanded;
  }

  _handleScrollNearEnd() {
    this._maybeLoadMoreTreeChildren();
  }

  _handleSearchResultSelect(e) {
    const index = e.detail?.index;
    this._selectSearchResult(index);
  }

  _handleFlatItemSelect(e) {
    const index = e.detail?.index;
    const flatRecords = flattenTree(this._getFilteredTreeData());
    if (index >= 0 && index < flatRecords.length) {
      this.selectedNodeId = flatRecords[index].node.id;
    }
  }

  _handleDetailLevelChange(e) {
    this.detailLevelMode = e.detail?.value || "per-file";
    if (this.detailLevelMode !== "per-file") {
      this.preserveStructure = false;
    }
  }

  _handlePerFileModeChange(e) {
    if (this.detailLevelMode !== "per-file") return;
    this.perFileMode = e.detail?.value || "components";
    if (this.perFileMode !== "components") {
      this.preserveStructure = false;
    }
  }

  _handlePreserveStructureChange(e) {
    const value = Boolean(e.detail?.value);
    this.preserveStructure = value;
  }

  _handleClearSelection() {
    this.selectedRecordIds = [];
  }

  _handleNavigateSelection(e) {
    const index = e.detail?.index;
    const targetId = this.selectedRecordIds[index];
    if (targetId) {
      this.selectedNodeId = targetId;
      if (this.recordViewMode === "flat") {
        if (Array.isArray(this.searchResults) && this.searchResults.length) {
          const nextIndex = this.searchResults.findIndex(
            (result) =>
              result?.uri === targetId ||
              result?.id === targetId ||
              result?.node?.id === targetId
          );
          if (nextIndex !== -1) {
            this.activeSearchIndex = nextIndex;
          }
        } else {
          const flatRecords = flattenTree(this._getFilteredTreeData());
          const nextIndex = flatRecords.findIndex(
            (record) =>
              record?.node?.id === targetId || record?.node?.uri === targetId
          );
          if (nextIndex !== -1) {
            this.selectedNodeId = flatRecords[nextIndex].node.id;
          }
        }
      }
    }
  }

  _setCreateFoldersFeedback(type, message) {
    if (this._createFoldersFeedbackTimeout) {
      clearTimeout(this._createFoldersFeedbackTimeout);
      this._createFoldersFeedbackTimeout = null;
    }

    this.createFoldersFeedback = message
      ? { type: type || "info", message: String(message) }
      : null;

    if (this.createFoldersFeedback) {
      this._createFoldersFeedbackTimeout = setTimeout(() => {
        this.createFoldersFeedback = null;
        this._createFoldersFeedbackTimeout = null;
      }, 4500);
    }
  }

  _handleActionClick(e) {
    const action = e.detail?.action;
    if (action === "open-archivesspace") {
      const uri = this.selectedNodeId;
      if (uri) {
        window.open(`${this.apiHost}${uri}`, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (action !== "create-folders") return;
    if (this.createFoldersLoading) return;

    const selectedIds = Array.isArray(this.selectedRecordIds) ? this.selectedRecordIds : [];
    if (!selectedIds.length) {
      this._setCreateFoldersFeedback("error", "Select one or more records first.");
      return;
    }

    const detailLevel = (this.detailLevelMode || "per-file").replace(/-/g, "_");
    const perFileMode =
      detailLevel === "per_file"
        ? this.perFileMode === "records"
          ? "as_records"
          : "as_components"
        : null;
    const shouldPreserveStructure =
      detailLevel === "per_file" && perFileMode === "as_components";

    const folders = selectedIds
      .map((id) => {
        const node = findNode(this.archiveData, id) || findNodeByLogicalId(this.archiveData, id);
        const searchHit = Array.isArray(this.searchResults)
          ? this.searchResults.find((res) => res?.uri === id)
          : null;
        const uri = node?.uri || id;
        const name = node?.title || searchHit?.title || "(Untitled)";
        if (!uri) return null;
        const folder = {
          name,
          uri,
          detail_level: detailLevel,
        };
        if (perFileMode) {
          folder.per_file_mode = perFileMode;
        }
        if (shouldPreserveStructure) {
          folder.preserve_structure = Boolean(this.preserveStructure);
        }
        return folder;
      })
      .filter(Boolean);

    if (!folders.length) {
      this._setCreateFoldersFeedback("error", "No valid record URIs to create folders for.");
      return;
    }

    this.createFoldersLoading = true;
    this._setCreateFoldersFeedback(null, null);

    (async () => {
      try {
        const res = await createCurateFolders(
          this.apiHost,
          this.curateBasePath,
          this.curateParentPath,
          folders
        );
        const created = res?.folders || [];
        const count = Array.isArray(created) ? created.length : 0;
        this._setCreateFoldersFeedback(
          "success",
          `Created ${count} folder${count === 1 ? "" : "s"} in Curate.`
        );
      } catch (err) {
        console.error(err);
        this._setCreateFoldersFeedback(
          "error",
          err?.message || "Failed to create folders."
        );
      } finally {
        this.createFoldersLoading = false;
      }
    })();
  }

  // ===================
  // HELPER METHODS
  // ===================

  _isGlobalSearchContext() {
    return this.currentView === "browse" && this.activeBrowseTab === "search";
  }

  _hasActiveFilters() {
    return (
      this.selectedLevels.length > 0 ||
      this.selectedStatuses.length > 0 ||
      this.searchScope !== "collection" ||
      this.advancedFilters.length > 0
    );
  }

  _getSearchLabel() {
    if (this.currentView === "tree") {
      return "Search this collection";
    } else if (this._isGlobalSearchContext()) {
      return "Search archives";
    } else if (this.currentView === "collections") {
      return "Filter collections";
    }
    return "Search";
  }

  _getSearchFieldOptions() {
    if (this.currentView === "tree" || this._isGlobalSearchContext()) {
      return [
        { value: "all", label: "All fields", description: "Title, identifier, status, location" },
        { value: "title", label: "Title" },
        { value: "identifier", label: "Identifier / Code" },
        { value: "status", label: "Status" },
        { value: "location", label: "Location" },
      ];
    }

    if (this.currentView === "browse" && this.activeBrowseTab === "repository") {
      return [
        { value: "all", label: "All fields", description: "Name, code, location" },
        { value: "name", label: "Repository name" },
        { value: "code", label: "Code" },
        { value: "location", label: "Location" },
      ];
    }

    return [
      { value: "all", label: "All fields", description: "Title, identifier, subjects" },
      { value: "title", label: "Title" },
      { value: "identifier", label: "Identifier / Call number" },
      { value: "subject", label: "Subjects" },
      { value: "date", label: "Date range" },
    ];
  }

  _getBreadcrumbPath() {
    const crumbs = [];

    if (this.currentView === "browse") {
      crumbs.push({ label: "Browse", action: "browse" });
    } else if (this.currentView === "collections") {
      crumbs.push({ label: "Browse", action: "browse" });
      if (this.selectedRepository) {
        crumbs.push({ label: this.selectedRepository.name, action: "repository" });
      } else {
        crumbs.push({ label: "All Collections", action: "collections" });
      }
    } else if (this.currentView === "tree" && this.selectedCollection) {
      crumbs.push({ label: "Browse", action: "browse" });
      crumbs.push({ label: "Collections", action: "collections" });
      crumbs.push({ label: this.selectedCollection.title, action: "collection" });
    }

    return crumbs;
  }

  _getFilteredTreeData() {
    if (this.searchScope === "subtree" && this.selectedNodeId) {
      const scopedRoot = findNodeByLogicalId(this.archiveData, this.selectedNodeId);
      if (scopedRoot) {
        return [scopedRoot];
      }
    }
    return this.archiveData;
  }

  _getFilteredCollections() {
    let filtered = this.collections;

    if (this.selectedRepository) {
      filtered = filtered.filter(
        (coll) => coll.repositoryId === this.selectedRepository.id
      );
    }

    const query = this.collectionFilter.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((coll) =>
        matchesCollectionSearch(coll, query, this.browseSearchField)
      );
    }

    return filtered;
  }

  _paginate(items) {
    const totalPages = Math.ceil(items.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);

    return { items: paginatedItems, totalPages };
  }

  _navigateToCrumb(index) {
    const crumbs = this._getBreadcrumbPath();
    if (index === 0) {
      this.currentView = "browse";
      this.selectedRepository = null;
      this.selectedCollection = null;
      this.searchQuery = "";
      this.collectionFilter = "";
      this._clearTreeSearchState();
      this.selectedRecordIds = [];
    } else if (index === 1 && crumbs.length > 2) {
      this.currentView = "collections";
      this.selectedCollection = null;
      this.searchQuery = "";
      this._clearTreeSearchState();
      this.selectedRecordIds = [];
      this._ensureAllCollectionsLoaded();
    }
  }

  _selectRepository(repo) {
    this.selectedRepository = repo;
    this.currentView = "collections";
    this.collectionFilter = "";
    this.currentPage = 1;
    this._ensureCollectionsForRepository(repo);
  }

  _selectCollection(collection) {
    this.selectedCollection = collection;
    if (collection.resourceId) {
      this.resourceId = collection.resourceId;
    }
    if (collection.repositoryId) {
      this.repositoryId = collection.repositoryId;
    }
    this.currentView = "tree";
    this.recordViewMode = "tree";
    this.searchQuery = "";
    this.currentPage = 1;
    this.expandedNodes = new Set();
    this.selectedNodeId = null;
    this.selectedRecordIds = [];
    this.archiveData = [];
    this._clearTreeSearchState();
    this.selectedLevels = [];
    this.selectedStatuses = [];
    this.searchScope = "collection";
    this.advancedFilters = [];
    this.filterMenuOpen = false;
    this._loadRootTreeFromApi();
  }

  _selectSearchResult(index) {
    if (
      !Array.isArray(this.searchResults) ||
      index < 0 ||
      index >= this.searchResults.length
    ) {
      return;
    }
    this.activeSearchIndex = index;
    const result = this.searchResults[index];
    this._ensureSearchNodeForDetail(result);
  }

  _clearTreeSearchState() {
    this.searchResults = [];
    this.activeSearchIndex = -1;
    this.searchResultIds = new Set();
    this.searchMatchMetadata = new Map();
    this.searchTotalHits = 0;
    this.searchPageSize = 0;
  }

  _reapplySearchWithFilters() {
    if (this.searchQuery && this.searchQuery.trim()) {
      if (this._isGlobalSearchContext()) {
        this._loadGlobalSearchPage(1);
      } else if (this.resourceId) {
        this._loadSearchPage(1);
      } else {
        this._updateTreeSearchLocal(this.searchQuery.trim().toLowerCase());
      }
    } else if (this._hasActiveFilters()) {
      this._applyFiltersOnly();
    } else {
      this._clearTreeSearchState();
      this.recordViewMode = "tree";
    }
  }

  _updateTreeSearchLocal(query) {
    // Local in-memory search for when no backend resource is available
    const scope = this._getFilteredTreeData();
    const results = [];
    const searchNodes = (nodes, path = [], idPath = []) => {
      for (const node of nodes) {
        const newPath = [...path, node.title];
        const newIdPath = [...idPath, node.id];
        const matchMetadata = getNodeMatchMetadata(node, query, this.treeSearchField);
        const matches = Object.values(matchMetadata).some(Boolean);
        if (matches) {
          results.push({
            node,
            path: newPath,
            idPath: newIdPath,
            matches: matchMetadata,
            uri: node.id,
            title: node.title,
            level: node.type,
            ancestors: newPath.slice(0, -1),
          });
        }
        if (node.children) {
          searchNodes(node.children, newPath, newIdPath);
        }
      }
    };
    searchNodes(scope);

    this.searchResults = results;
    this.searchResultIds = new Set(results.map((res) => res.node?.id || res.uri));
    this.searchTotalHits = results.length;
    this.searchPageSize = results.length;
    this.searchCurrentPage = 1;
    this.recordViewMode = "flat";

    const matchMetadata = new Map();
    for (const result of results) {
      if (result?.node?.id) {
        matchMetadata.set(result.node.id, result.matches);
      }
    }
    this.searchMatchMetadata = matchMetadata;

    if (results.length > 0) {
      this.activeSearchIndex = 0;
    } else {
      this.activeSearchIndex = -1;
    }
  }

  async _focusSearchResult(index) {
    if (!this.searchResults?.length || index < 0 || index >= this.searchResults.length) {
      return;
    }
    this.activeSearchIndex = index;
    const result = this.searchResults[index];
    if (result?.uri) {
      await this._ensureSearchNodeForDetail(result);
      const node = findNodeByLogicalId(this.archiveData, result.uri);
      if (node) {
        // Expand ancestors and scroll to node
        const expanded = new Set(this.expandedNodes);
        expanded.add(node.id);
        this.expandedNodes = expanded;
        this.selectedNodeId = node.id;
      }
    }
  }

  _maybeLoadMoreTreeChildren() {
    if (!Array.isArray(this._visibleTreeRows) || !this._visibleTreeRows.length) return;
    const rows = this._visibleTreeRows;
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      if (!row || !row.parentId) continue;
      const parentNode = findNode(this.archiveData, row.parentId);
      if (!parentNode || parentNode.allChildrenLoaded) continue;
      const offsetsLoaded = parentNode.childrenOffsetsLoaded || new Set();
      const nextOffset =
        typeof parentNode.nextWaypointOffset === "number"
          ? parentNode.nextWaypointOffset
          : offsetsLoaded.size;
      if (offsetsLoaded.has(nextOffset)) continue;
      this._loadChildrenFromApi(parentNode, nextOffset);
      break;
    }
  }

  // ===================
  // API METHODS
  // ===================

  async _loadRepositoriesFromApi() {
    this.repositoriesLoading = true;
    this.repositories = [];
    try {
      const response = await fetchRepositories(this.apiHost);
      const repositories = response?.repositories || response || [];
      if (!Array.isArray(repositories) || !repositories.length) return;
      this.repositories = repositories.map((repo) => ({
        id: repo.id,
        name: repo.display_string || repo.name || repo.code || `Repository ${repo.id}`,
        code: repo.code,
        collectionCount: Number.isFinite(repo.collection_count) ? repo.collection_count : 0,
        location: repo.country || "",
      }));
    } catch (err) {
      console.error("Failed to load repositories", err);
    } finally {
      this.repositoriesLoading = false;
      this._ensureAllCollectionsLoaded();
    }
  }

  _ensureAllCollectionsLoaded() {
    const wantsAllCollections =
      this._pendingLoadAllCollections ||
      (this.currentView === "browse" && this.activeBrowseTab === "collections") ||
      (this.currentView === "collections" && !this.selectedRepository);

    if (!wantsAllCollections) return;
    if (this.collectionsLoading && !this._pendingLoadAllCollections) return;

    if (this.repositoriesLoading || !this.repositories?.length) {
      this._pendingLoadAllCollections = true;
      if (
        (this.currentView === "browse" && this.activeBrowseTab === "collections") ||
        (this.currentView === "collections" && !this.selectedRepository)
      ) {
        this.collectionsLoading = true;
      }
      if (!this.repositoriesLoading && !this.repositories?.length) {
        this.collectionsLoading = false;
        this._pendingLoadAllCollections = false;
      }
      return;
    }

    this._pendingLoadAllCollections = false;
    this._loadAllCollectionsFromApi();
  }

  async _loadAllCollectionsFromApi() {
    if (!this.repositories?.length) return;
    this.collectionsLoading = true;
    try {
      for (const repo of this.repositories) {
        await this._ensureCollectionsForRepository(repo);
      }
    } finally {
      this.collectionsLoading = false;
    }
  }

  async _ensureCollectionsForRepository(repo) {
    if (!repo?.id) return;
    if (this._collectionsLoadedRepositoryIds?.has(repo.id)) return;
    const shouldToggleLoading = !this.collectionsLoading;
    if (shouldToggleLoading) {
      this.collectionsLoading = true;
    }
    try {
      await this._loadResourcesForRepository(repo);
      this._collectionsLoadedRepositoryIds.add(repo.id);
    } catch (err) {
      console.error("Failed to load repository collections", err);
    } finally {
      if (shouldToggleLoading) {
        this.collectionsLoading = false;
      }
    }
  }

  async _loadResourcesForRepository(repo) {
    if (!repo || !repo.id) return;
    const results = await this._fetchAllRepositoryResources(repo.id);
    if (!Array.isArray(results)) return;
    const mapped = results.map((res) => ({
      id: res.id,
      resourceId: res.id,
      repositoryId: res.repository_id,
      title: res.title,
      code: res.identifier,
      extent: "",
      dateRange: "",
      subjects: [],
    }));
    this._upsertCollections(mapped);
    this._updateRepositoryCollectionCount(repo.id, mapped.length);
  }

  async _fetchAllRepositoryResources(repositoryId) {
    const pageSize = 200;
    let page = 1;
    const allResults = [];

    while (true) {
      const response = await fetchRepositoryResources(
        this.apiHost,
        repositoryId,
        page,
        pageSize
      );
      const results = response?.results || [];
      if (!Array.isArray(results) || results.length === 0) break;

      allResults.push(...results);

      const totalPages =
        response?.total_pages ?? response?.last_page ?? response?.pages ?? null;
      if (typeof totalPages === "number" && page >= totalPages) break;

      if (results.length < pageSize) break;

      page += 1;
      if (page > 250) break;
    }

    return allResults;
  }

  _upsertCollections(incoming) {
    if (!Array.isArray(incoming) || incoming.length === 0) return;

    const keyFor = (coll) => `${coll.repositoryId}:${coll.resourceId}`;
    const mapByKey = new Map((this.collections || []).map((c) => [keyFor(c), c]));
    for (const coll of incoming) {
      if (!coll) continue;
      mapByKey.set(keyFor(coll), coll);
    }
    this.collections = Array.from(mapByKey.values());
  }

  _updateRepositoryCollectionCount(repositoryId, count) {
    if (!repositoryId) return;
    if (!Array.isArray(this.repositories) || !this.repositories.length) return;
    this.repositories = this.repositories.map((repo) =>
      repo.id === repositoryId
        ? { ...repo, collectionCount: Number.isFinite(count) ? count : repo.collectionCount }
        : repo
    );
  }

  async _loadRootTreeFromApi() {
    if (!this.resourceId) return;
    this.treeLoading = true;
    try {
      const { root, children } = await fetchResourceTreeRoot(
        this.apiHost,
        this.resourceId,
        this.repositoryId
      );
      const rootNode = this._normalizeApiTreeNode(root);
      const childNodes = (children || []).map((c) => this._normalizeApiTreeNode(c));
      rootNode.children = childNodes;
      rootNode.childrenLoaded = true;
      rootNode.childrenOffsetsLoaded = new Set([0]);
      rootNode.nextWaypointOffset = 1;
      rootNode.allChildrenLoaded = false;
      this.archiveData = [rootNode];
      const defaultExpanded = this.archiveData.length ? [this.archiveData[0].id] : [];
      this.expandedNodes = new Set(defaultExpanded);
      this.selectedNodeId = defaultExpanded[0] || null;
    } catch (err) {
      console.error("Failed to load tree root", err);
    } finally {
      this.treeLoading = false;
    }
  }

  async _loadChildrenFromApi(parentNode, offset = 0, showSpinner = true) {
    if (!this.resourceId || !parentNode || !parentNode.uri) return;
    let existingOffsets = parentNode.childrenOffsetsLoaded || new Set();
    if (existingOffsets.has(offset)) {
      return;
    }
    existingOffsets.add(offset);
    parentNode.childrenOffsetsLoaded = existingOffsets;

    if (showSpinner) {
      this.childrenLoadingForId = parentNode.id;
    }
    try {
      const { children } = await fetchResourceTreeChildren(
        this.apiHost,
        this.resourceId,
        this.repositoryId,
        parentNode.uri,
        offset
      );
      const normalized = (children || []).map((c) => this._normalizeApiTreeNode(c));
      parentNode.children = [...(parentNode.children || []), ...normalized];
      parentNode.childrenLoaded = true;
      parentNode.nextWaypointOffset = offset + 1;
      if (!normalized.length) {
        parentNode.allChildrenLoaded = true;
      }
      this.archiveData = [...this.archiveData];
    } catch (err) {
      console.error("Failed to load children", err);
    } finally {
      if (showSpinner && this.childrenLoadingForId === parentNode.id) {
        this.childrenLoadingForId = null;
      }
    }
  }

  async _loadSearchPage(page) {
    if (!this.resourceId) return;
    const rawQuery = (this.searchQuery || "").trim() || "*";
    const pageSize = this.searchPageSize || 20;
    this.treeSearchLoading = true;
    try {
      const searchOptions = this._buildBackendSearchOptions();
      const response = await searchResource(
        this.apiHost,
        this.resourceId,
        this.repositoryId,
        rawQuery,
        page,
        pageSize,
        searchOptions
      );
      const results = response?.results || [];
      const totalHits =
        typeof response?.total_hits === "number" ? response.total_hits : results.length;

      this.searchResults = results;
      this.searchTotalHits = totalHits;
      this.searchPageSize = pageSize;
      this.searchCurrentPage = page;
      this.activeSearchIndex = results.length ? 0 : -1;
      this.searchResultIds = new Set(results.map((res) => res.uri));
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      this.treeSearchLoading = false;
    }
  }

  async _loadGlobalSearchPage(page) {
    const rawQuery = (this.searchQuery || "").trim() || "*";
    const pageSize = this.searchPageSize || 20;
    this.treeSearchLoading = true;
    try {
      const searchOptions = this._buildBackendSearchOptions();
      const repoId = this.selectedRepository?.id;
      const response = await searchGlobal(
        this.apiHost,
        repoId,
        rawQuery,
        page,
        pageSize,
        searchOptions
      );
      const results = response?.results || [];
      const totalHits =
        typeof response?.total_hits === "number" ? response.total_hits : results.length;

      this.searchResults = results;
      this.searchTotalHits = totalHits;
      this.searchPageSize = pageSize;
      this.searchCurrentPage = page;
      this.activeSearchIndex = results.length ? 0 : -1;
      this.searchResultIds = new Set(results.map((res) => res.uri));
    } catch (err) {
      console.error("Global search failed", err);
    } finally {
      this.treeSearchLoading = false;
    }
  }

  async _applyFiltersOnly() {
    this.treeSearchLoading = true;
    this.recordViewMode = "flat";

    try {
      const searchOptions = this._buildBackendSearchOptions();

      let response;
      if (this._isGlobalSearchContext()) {
        const repoId = this.selectedRepository?.id;
        response = await searchGlobal(this.apiHost, repoId, "*", 1, 20, searchOptions);
      } else {
        if (!this.resourceId) return;
        response = await searchResource(
          this.apiHost,
          this.resourceId,
          this.repositoryId,
          "*",
          1,
          20,
          searchOptions
        );
      }

      const results = response?.results || [];
      const totalHits =
        typeof response?.total_hits === "number" ? response.total_hits : results.length;

      this.searchResults = results;
      this.searchTotalHits = totalHits;
      this.searchPageSize = 20;
      this.searchCurrentPage = 1;
      this.activeSearchIndex = results.length ? 0 : -1;
      this.searchResultIds = new Set(results.map((res) => res.uri));
      this.searchMatchMetadata = new Map();
    } catch (err) {
      console.error("Filter-only search failed", err);
      this._clearTreeSearchState();
    } finally {
      this.treeSearchLoading = false;
    }
  }

  async _ensureSearchNodeForDetail(result) {
    if (!result || !this.resourceId || !result.uri) return;
    const existing = findNode(this.archiveData, result.uri);
    if (existing) return;
    try {
      const pathResponse = await fetchResourcePaths(
        this.apiHost,
        this.resourceId,
        this.repositoryId,
        [result.uri]
      );
      const paths = pathResponse?.paths || [];
      const steps = paths[0] || [];
      await this._ensurePathLoaded(steps);
    } catch (err) {
      console.error("Failed to ensure search node for detail", err);
    }
  }

  async _ensurePathLoaded(steps) {
    if (!Array.isArray(steps) || !steps.length) return;
    for (const step of steps) {
      if (!step || !step.node_uri) continue;
      if (typeof step.waypoint_offset === "number") {
        const parentNode = findNode(this.archiveData, step.node_uri);
        if (parentNode) {
          await this._loadChildrenFromApi(parentNode, step.waypoint_offset, false);
        }
      }
      const nodeId = step.node_uri;
      const expanded = new Set(this.expandedNodes);
      expanded.add(nodeId);
      this.expandedNodes = expanded;
    }
  }

  _buildBackendSearchOptions() {
    const options = {};

    if (this.selectedLevels?.length > 0) {
      options.levels = [...this.selectedLevels];
    }

    const filterTerms = [];

    if (this.selectedStatuses?.length > 0) {
      this.selectedStatuses.forEach((status) => {
        switch (status) {
          case "success":
            filterTerms.push("status_type:success");
            break;
          case "warning":
            filterTerms.push("status_type:warning");
            break;
          case "error":
            filterTerms.push("status_type:error");
            break;
        }
      });
    }

    if (this.advancedFilters?.length > 0) {
      filterTerms.push(...this.advancedFilters);
    }

    if (this.searchScope === "subtree" && this.selectedNodeId) {
      const node = findNodeByLogicalId(this.archiveData, this.selectedNodeId);
      const uri = node?.uri || this.selectedNodeId;
      if (uri) {
        options.ancestorUris = [uri];
      }
    }

    if (filterTerms.length > 0) {
      options.filterTerms = filterTerms;
    }

    return options;
  }

  _normalizeApiTreeNode(node) {
    if (!node) return node;
    const rawStatusType = node.statusType || node.status_type || null;
    let statusType = null;
    let status = node.status;

    if (rawStatusType) {
      const normalized = String(rawStatusType).toLowerCase();
      if (normalized.includes("restrict")) {
        statusType = "error";
        status = status || "Restricted";
      } else if (normalized.includes("warn") || normalized.includes("attention")) {
        statusType = "warning";
        status = status || "Needs attention";
      } else {
        statusType = "success";
        status = status || "Available";
      }
    }

    return {
      ...node,
      id: node.uri || node.id,
      type: node.level || node.type || "item",
      statusType,
      status,
      has_children: Boolean(node.has_children),
      childrenOffsetsLoaded: new Set(),
      nextWaypointOffset: 0,
      allChildrenLoaded: false,
    };
  }
}

customElements.define("archivesspace-browser", ArchivespaceBrowser);

export { ArchivespaceBrowser };

// metadata-mapping-tab-content.js

import { LitElement, html, css } from "lit";
import { map } from "lit/directives/map.js";
import { when } from "lit/directives/when.js";
import { cloneDeep, isEqual } from "lodash-es";

// Material Web Components
import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/button/text-button.js";
import "@material/web/dialog/dialog.js";
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/icon/icon.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/divider/divider.js";
import "@material/web/progress/circular-progress.js";
import "@material/web/chips/chip-set.js";
import "@material/web/chips/filter-chip.js";
import "@material/web/tabs/tabs.js";
import "@material/web/tabs/secondary-tab.js";
import "@material/web/select/outlined-select.js";

// Icons
import {
  checkCircleIcon,
  checkboxBlankCircleIcon,
  lockIcon,
  searchIcon,
  blockIcon,
  cachedIcon,
  plusIcon,
  deleteIcon,
  pencilIcon,
  playIcon,
} from "../utils/icons.js";

class MetadataMappingTabContent extends LitElement {
  static properties = {
    // From parent
    discoveredFields: { type: Array },
    availableCurateTargets: { type: Array },
    fieldMappings: { type: Object },
    cachedRecordsCount: { type: Number },
    apiService: { type: Object },

    // Internal state
    _activeSubTab: { type: Number, state: true },
    _temporaryFieldMappings: { type: Object, state: true },
    _hasPendingChanges: { type: Boolean, state: true },

    // Whitelist management
    _whitelistData: { type: Object, state: true },
    _isLoadingWhitelist: { type: Boolean, state: true },
    _showAddFieldDialog: { type: Boolean, state: true },
    _newFieldName: { type: String, state: true },
    _newFieldDescription: { type: String, state: true },

    // Discovered fields queue
    _discoveredQueue: { type: Array, state: true },
    _isLoadingQueue: { type: Boolean, state: true },
    _selectedQueueFields: { type: Set, state: true },

    // Discovered fields filtering and pagination
    _discoveredSearchTerm: { type: String, state: true },
    _discoveredCurrentPage: { type: Number, state: true },
    _discoveredPageSize: { type: Number, state: true },
    _discoveredSortBy: { type: String, state: true },
    _discoveredSortDirection: { type: String, state: true },

    // Field mapping dialog
    _showMappingDialog: { type: Boolean, state: true },
    _currentFieldToMap: { type: Object, state: true },
    _currentDialogMappingValue: { type: String, state: true },
    _curateTargetSearchTerm: { type: String, state: true },
    _currentDialogAction: { type: String, state: true },

    // Field discovery state
    _isDiscoveringFields: { type: Boolean, state: true },
    _discoveryMessage: { type: String, state: true },

    // Cached records state
    _isProcessingCached: { type: Boolean, state: true },
    _processingMessage: { type: String, state: true },
  };

  constructor() {
    super();
    this.discoveredFields = [];
    this.availableCurateTargets = [];
    this.fieldMappings = {};
    this.cachedRecordsCount = 0;
    this.apiService = null;

    // Sub-tab management
    this._activeSubTab = 0; // 0: Whitelist, 1: Discovered Queue, 2: Field Mapping

    // Field mapping state
    this._temporaryFieldMappings = {};
    this._hasPendingChanges = false;

    // Whitelist state
    this._whitelistData = null;
    this._isLoadingWhitelist = false;
    this._showAddFieldDialog = false;
    this._newFieldName = "";
    this._newFieldDescription = "";

    // Discovered queue state
    this._discoveredQueue = [];
    this._isLoadingQueue = false;
    this._selectedQueueFields = new Set();

    // Discovered fields UI state
    this._discoveredSearchTerm = "";
    this._discoveredCurrentPage = 0;
    this._discoveredPageSize = 50; // Show 50 fields per page
    this._discoveredSortBy = "occurrence_count"; // Sort by frequency by default
    this._discoveredSortDirection = "desc";

    // Mapping dialog state
    this._showMappingDialog = false;
    this._currentFieldToMap = null;
    this._currentDialogMappingValue = "";
    this._selectedCurateFields = new Set(); // For multi-selection
    this._curateTargetSearchTerm = "";
    this._currentDialogAction = "mapped";

    // Processing state
    this._isDiscoveringFields = false;
    this._discoveryMessage = "";
    this._isProcessingCached = false;
    this._processingMessage = "";
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._loadInitialData();
  }

  async _loadInitialData() {
    await Promise.all([this._loadWhitelistData(), this._loadDiscoveredQueue()]);
  }

  willUpdate(changedProperties) {
    if (changedProperties.has("fieldMappings")) {
      const oldParentMappings = changedProperties.get("fieldMappings");
      if (
        !this._hasPendingChanges ||
        isEqual(this._temporaryFieldMappings, oldParentMappings)
      ) {
        this._temporaryFieldMappings = cloneDeep(this.fieldMappings);
        this._hasPendingChanges = false;
      }
    }
  }

  // === WHITELIST MANAGEMENT ===

  async _loadWhitelistData() {
    if (!this.apiService) return;

    try {
      this._isLoadingWhitelist = true;
      this._whitelistData = await this.apiService.getWhitelist();
    } catch (error) {
      this._showError(`Failed to load whitelist: ${error.message}`);
    } finally {
      this._isLoadingWhitelist = false;
    }
  }

  _openAddFieldDialog() {
    this._newFieldName = "";
    this._newFieldDescription = "";
    this._showAddFieldDialog = true;
  }

  _closeAddFieldDialog() {
    this._showAddFieldDialog = false;
  }

  async _addFieldToWhitelist() {
    if (!this._newFieldName.trim()) return;

    try {
      await this.apiService.addWhitelistFields(
        [this._newFieldName.trim()],
        this._newFieldDescription.trim() || null
      );

      await this._loadWhitelistData();
      this._closeAddFieldDialog();
      this._showSuccess("Field added to whitelist");
    } catch (error) {
      this._showError(`Failed to add field: ${error.message}`);
    }
  }

  async _removeFieldFromWhitelist(fieldName) {
    try {
      await this.apiService.removeWhitelistField(fieldName);
      await this._loadWhitelistData();
      this._showSuccess("Field removed from whitelist");
    } catch (error) {
      this._showError(`Failed to remove field: ${error.message}`);
    }
  }

  async _resetWhitelist() {
    if (
      !confirm(
        "Reset whitelist to default fields? This will remove all custom fields."
      )
    ) {
      return;
    }

    try {
      await this.apiService.resetWhitelist();
      await this._loadWhitelistData();
      this._showSuccess("Whitelist reset to defaults");
    } catch (error) {
      this._showError(`Failed to reset whitelist: ${error.message}`);
    }
  }

  // === DISCOVERED FIELDS QUEUE ===

  async _loadDiscoveredQueue() {
    if (!this.apiService) return;

    try {
      this._isLoadingQueue = true;
      const response = await this.apiService.getDiscoveredFieldsQueue();
      this._discoveredQueue = response.fields || [];
    } catch (error) {
      this._showError(`Failed to load discovered fields: ${error.message}`);
    } finally {
      this._isLoadingQueue = false;
    }
  }

  _toggleQueueFieldSelection(fieldName) {
    const newSelection = new Set(this._selectedQueueFields);
    if (newSelection.has(fieldName)) {
      newSelection.delete(fieldName);
    } else {
      newSelection.add(fieldName);
    }
    this._selectedQueueFields = newSelection;
  }

  _selectAllQueueFields() {
    this._selectedQueueFields = new Set(
      this._discoveredQueue.map((f) => f.field_name)
    );
  }

  _clearQueueSelection() {
    this._selectedQueueFields = new Set();
  }

  async _reviewQueueField(discoveredId, action, addToWhitelist = false) {
    try {
      await this.apiService.reviewDiscoveredField(
        discoveredId,
        action,
        addToWhitelist
      );
      await this._loadDiscoveredQueue();
      if (addToWhitelist) {
        await this._loadWhitelistData();
      }
    } catch (error) {
      this._showError(`Failed to review field: ${error.message}`);
    }
  }

  async _bulkReviewQueueFields(action, addToWhitelist = false) {
    if (this._selectedQueueFields.size === 0) return;

    const fieldNames = Array.from(this._selectedQueueFields);

    try {
      await this.apiService.bulkReviewDiscoveredFields(
        fieldNames,
        action,
        addToWhitelist
      );
      await this._loadDiscoveredQueue();
      if (addToWhitelist) {
        await this._loadWhitelistData();
      }
      this._clearQueueSelection();
      this._showSuccess(`${fieldNames.length} fields ${action}`);
    } catch (error) {
      this._showError(`Failed to bulk review fields: ${error.message}`);
    }
  }

  // === FIELD DISCOVERY SEARCH ===

  get _filteredAndSortedDiscoveredFields() {
    let filtered = this._discoveredQueue;

    // Apply search filter
    if (this._discoveredSearchTerm.trim()) {
      const searchTerm = this._discoveredSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (field) =>
          field.field_name.toLowerCase().includes(searchTerm) ||
          (field.sample_value &&
            field.sample_value.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (this._discoveredSortBy) {
        case "field_name":
          aValue = a.field_name.toLowerCase();
          bValue = b.field_name.toLowerCase();
          break;
        case "occurrence_count":
          aValue = a.occurrence_count;
          bValue = b.occurrence_count;
          break;
        case "first_seen_date":
          aValue = new Date(a.first_seen_date);
          bValue = new Date(b.first_seen_date);
          break;
        default:
          return 0;
      }

      if (aValue < bValue)
        return this._discoveredSortDirection === "asc" ? -1 : 1;
      if (aValue > bValue)
        return this._discoveredSortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }

  get _paginatedDiscoveredFields() {
    const filtered = this._filteredAndSortedDiscoveredFields;
    const startIndex = this._discoveredCurrentPage * this._discoveredPageSize;
    const endIndex = startIndex + this._discoveredPageSize;

    return {
      fields: filtered.slice(startIndex, endIndex),
      totalCount: filtered.length,
      totalPages: Math.ceil(filtered.length / this._discoveredPageSize),
      currentPage: this._discoveredCurrentPage,
      hasNextPage: endIndex < filtered.length,
      hasPrevPage: this._discoveredCurrentPage > 0,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, filtered.length),
    };
  }

  _handleDiscoveredSearchInput(e) {
    this._discoveredSearchTerm = e.target.value;
    this._discoveredCurrentPage = 0; // Reset to first page when searching
  }

  _handleDiscoveredSortChange(sortBy) {
    if (this._discoveredSortBy === sortBy) {
      // Toggle direction if same field
      this._discoveredSortDirection =
        this._discoveredSortDirection === "asc" ? "desc" : "asc";
    } else {
      this._discoveredSortBy = sortBy;
      this._discoveredSortDirection =
        sortBy === "occurrence_count" ? "desc" : "asc";
    }
  }

  _handleDiscoveredPageChange(newPage) {
    this._discoveredCurrentPage = Math.max(
      0,
      Math.min(newPage, this._paginatedDiscoveredFields.totalPages - 1)
    );
  }

  _handleDiscoveredPageSizeChange(e) {
    this._discoveredPageSize = parseInt(e.target.value);
    this._discoveredCurrentPage = 0; // Reset to first page
  }

  // === FIELD DISCOVERY ===

  async _handleDiscoverFields() {
    if (!this.apiService) {
      this._showError("API service not available");
      return;
    }

    try {
      this._isDiscoveringFields = true;
      this._discoveryMessage = "Sampling records to discover fields...";

      const result = await this.apiService.discoverFields(50);

      if (result.status === "success") {
        // Use the new response fields for accurate messaging
        const newCount = result.new_discovered_count || 0;
        const totalCount = result.total_discovered_count || 0;
        const recordsCount = result.records_sampled || 0;

        if (newCount > 0) {
          this._discoveryMessage = `Discovered ${newCount} new atomic fields from ${recordsCount} records (${totalCount} total in queue)`;
        } else {
          this._discoveryMessage = `No new fields discovered from ${recordsCount} records (${totalCount} total in queue)`;
        }

        // Trigger refresh of mapping data
        this.dispatchEvent(
          new CustomEvent("refresh-mapping-data", {
            bubbles: true,
            composed: true,
          })
        );

        // Also refresh discovered queue to show new fields
        await this._loadDiscoveredQueue();

        // Clear message after 5 seconds (longer since message is more informative)
        setTimeout(() => {
          this._discoveryMessage = "";
        }, 5000);
      } else if (result.status === "no_records") {
        this._discoveryMessage =
          result.message || "No records found to process";
      } else {
        this._discoveryMessage = result.message || "Field discovery completed";
      }
    } catch (error) {
      console.error("Field discovery failed:", error);
      this._discoveryMessage = `Discovery failed: ${error.message}`;
    } finally {
      this._isDiscoveringFields = false;
    }
  }

  // === CACHED RECORDS PROCESSING ===

  async _handleProcessCachedRecords() {
    if (!this.apiService) {
      this._showError("API service not available");
      return;
    }

    try {
      this._isProcessingCached = true;
      this._processingMessage = "Processing cached records...";

      const result = await this.apiService.processCachedRecords();

      if (result.status === "success") {
        this._processingMessage = `Processed ${result.processed_count} cached records (${result.remaining_count} remaining)`;

        // Trigger refresh of cached records count
        this.dispatchEvent(
          new CustomEvent("refresh-cached-count", {
            bubbles: true,
            composed: true,
          })
        );

        // Clear message after 3 seconds
        setTimeout(() => {
          this._processingMessage = "";
        }, 3000);
      } else {
        this._processingMessage =
          result.message || "No cached records to process";
      }
    } catch (error) {
      console.error("Processing cached records failed:", error);
      this._processingMessage = `Processing failed: ${error.message}`;
    } finally {
      this._isProcessingCached = false;
    }
  }

  // === FIELD MAPPING (same as CALM version) ===

  _getFieldMappingInfo(fieldId) {
    const mappings = this._temporaryFieldMappings[fieldId];
    if (!mappings || !Array.isArray(mappings) || mappings.length === 0) {
      return { action: "unmapped", mappings: [] };
    }

    // If there's at least one rejected mapping, consider the field rejected
    const hasRejected = mappings.some(m => m.action === "rejected");
    if (hasRejected) {
      return { action: "rejected", mappings };
    }

    // If there are any mapped entries, consider it mapped
    const hasMapped = mappings.some(m => m.action === "mapped" && m.curate_field);
    if (hasMapped) {
      return { action: "mapped", mappings };
    }

    return { action: "unmapped", mappings };
  }

  _getCurateFieldDisplayInfo(value, type = "full") {
    if (!value) return type === "short" ? "N/A" : "Not Mapped";
    const target = this.availableCurateTargets.find((t) => t.value === value);
    if (!target) return value;
    if (type === "short") return target.value;
    return `${target.group}: ${target.label}`;
  }

  _openMappingDialog(field) {
    this._currentFieldToMap = field;
    this._currentDialogAction = "mapped";
    this._currentDialogMappingValue = "";
    this._selectedCurateFields = new Set();
    this._showMappingDialog = true;
    this._curateTargetSearchTerm = "";
  }

  _closeMappingDialog() {
    this._showMappingDialog = false;
    this._currentFieldToMap = null;
    this._currentDialogMappingValue = "";
    this._selectedCurateFields = new Set();
    this._currentDialogAction = "mapped";
  }

  _handleDialogActionChange(action) {
    this._currentDialogAction = action;
    if (action !== "mapped") {
      this._currentDialogMappingValue = "";
    }
  }

  _handleDialogCurateTargetSelect(targetValue) {
    // Toggle selection for multi-select
    const newSelection = new Set(this._selectedCurateFields);
    if (newSelection.has(targetValue)) {
      newSelection.delete(targetValue);
    } else {
      newSelection.add(targetValue);
    }
    this._selectedCurateFields = newSelection;
    this._currentDialogAction = "mapped";
    this.requestUpdate();
  }

  _clearCurateFieldSelection() {
    this._selectedCurateFields = new Set();
    this.requestUpdate();
  }

  async _saveMappingFromDialog() {
    if (!this._currentFieldToMap) return;
    const fieldId = this._currentFieldToMap.id;

    if (!this.apiService) {
      this._showError("API service not available");
      return;
    }

    try {
      if (this._currentDialogAction === "mapped" && this._selectedCurateFields.size > 0) {
        // Create multiple mappings for selected fields
        const mappingPromises = Array.from(this._selectedCurateFields).map(curateField =>
          this.apiService.addMetadataMapping(fieldId, curateField, "mapped")
        );

        await Promise.all(mappingPromises);

        const count = this._selectedCurateFields.size;
        this._showSuccess(`Added ${count} mapping${count > 1 ? 's' : ''} for ${fieldId}`);
      } else if (this._currentDialogAction === "rejected") {
        await this.apiService.addMetadataMapping(
          fieldId,
          null,
          "rejected"
        );
        this._showSuccess(`Marked field as rejected: ${fieldId}`);
      }

      // Refresh the mapping data to show the new mappings
      this.dispatchEvent(
        new CustomEvent("refresh-mapping-data", {
          bubbles: true,
          composed: true,
        })
      );

      this._closeMappingDialog();
    } catch (error) {
      this._showError(`Failed to save mapping: ${error.message}`);
    }
  }

  async _deleteMappingById(mappingId, event) {
    if (event) event.stopPropagation();

    if (!this.apiService) {
      this._showError("API service not available");
      return;
    }

    try {
      await this.apiService.deleteMetadataMapping(mappingId);
      this._showSuccess("Mapping deleted");

      // Refresh the mapping data
      this.dispatchEvent(
        new CustomEvent("refresh-mapping-data", {
          bubbles: true,
          composed: true,
        })
      );
    } catch (error) {
      this._showError(`Failed to delete mapping: ${error.message}`);
    }
  }

  // Check if a curate target is already mapped to the current field being edited
  _isCurateTargetUsedByCurrentField(curateTargetValue, currentEditingFieldId, mappingsSource) {
    if (!currentEditingFieldId || !mappingsSource) return false;

    const currentFieldMappings = mappingsSource[currentEditingFieldId];
    if (!Array.isArray(currentFieldMappings)) return false;

    return currentFieldMappings.some(mapping =>
      mapping.action === "mapped" && mapping.curate_field === curateTargetValue
    );
  }

  get _processedAvailableCurateTargetsForDialog() {
    const searchTerm = (this._curateTargetSearchTerm || "").toLowerCase();
    const currentEditingFieldId = this._currentFieldToMap
      ? this._currentFieldToMap.id
      : null;

    return this.availableCurateTargets
      .map((target) => ({
        ...target,
        isAlreadyMapped: this._isCurateTargetUsedByCurrentField(
          target.value,
          currentEditingFieldId,
          this.fieldMappings
        ),
      }))
      .filter((target) => {
        // Filter out already mapped fields to prevent duplicates
        if (target.isAlreadyMapped) return false;

        // Apply search filter
        return (
          target.label.toLowerCase().includes(searchTerm) ||
          target.group.toLowerCase().includes(searchTerm) ||
          target.value.toLowerCase().includes(searchTerm)
        );
      });
  }

  // These methods are no longer needed since we use individual API calls
  // but kept for backward compatibility
  _handleSaveChangesToParent() {
    // No longer used - mappings are saved individually
  }

  _handleRevertLocalChanges() {
    // No longer used - no local changes to revert
  }

  // === UTILITY METHODS ===

  _showError(message) {
    this.dispatchEvent(
      new CustomEvent("show-error", {
        detail: { message },
        bubbles: true,
        composed: true,
      })
    );
  }

  _showSuccess(message) {
    this.dispatchEvent(
      new CustomEvent("show-success", {
        detail: { message },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleSubTabChange(e) {
    this._activeSubTab = e.target.activeTabIndex;

    // Refresh data when switching to Field Mapping tab
    if (this._activeSubTab === 2) {
      this.dispatchEvent(
        new CustomEvent("refresh-mapping-data", {
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  _selectAllVisibleQueueFields() {
    const visibleFields = this._paginatedDiscoveredFields.fields;
    const newSelection = new Set(this._selectedQueueFields);

    visibleFields.forEach((field) => {
      newSelection.add(field.field_name);
    });

    this._selectedQueueFields = newSelection;
  }

  static styles = css`
    :host {
      display: block;
      padding-top: 8px;
    }

    .sub-tabs {
      margin-bottom: 16px;
    }

    .action-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      padding: 12px;
      background-color: var(--md-sys-color-surface-container-low);
      border-radius: 12px;
      align-items: center;
      flex-wrap: wrap;
    }

    .action-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-message {
      font-size: 0.875rem;
      color: var(--md-sys-color-on-surface-variant);
      margin-left: 8px;
    }

    .cached-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .whitelist-stats {
      display: flex;
      gap: 12px;
      padding: 12px;
      background-color: var(--md-sys-color-surface-container-low);
      border-radius: 12px;
      margin-bottom: 12px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 500;
      color: var(--md-sys-color-primary);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--md-sys-color-on-surface-variant);
    }

    .field-list {
      padding: 0.5em;
      border-radius: 12px;
      margin-bottom: 16px;
      height: 390px;
      overflow-y: auto;
    }

    .field-list md-list-item {
      --md-list-item-container-color: var(--md-sys-color-surface-container-low);
      border-radius: 12px;
      border: 1px solid var(--md-sys-color-outline-variant);
      margin-bottom: 12px;
    }

    .field-list md-list-item.rejected {
      --md-list-item-container-color: var(--md-sys-color-error-container);
      opacity: 0.7;
    }

    .queue-selection-bar {
      display: flex;
      gap: 6px;
      margin-bottom: 12px;
      padding: 8px;
      background-color: var(--md-sys-color-surface-container-low);
      border-radius: 8px;
      align-items: center;
    }

    .selection-count {
      margin-left: auto;
      color: var(--md-sys-color-on-surface-variant);
      font-size: 0.875rem;
    }

    .checkbox-list md-list-item {
      cursor: pointer;
    }

    .checkbox-list md-list-item[selected] {
      background-color: var(--md-sys-color-secondary-container);
    }

    .summary-bar {
      padding: 6px 12px;
      background-color: var(--md-sys-color-surface-container-low);
      border-radius: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .summary-bar span {
      color: var(--md-sys-color-on-surface-variant);
    }

    .summary-bar strong {
      color: var(--md-sys-color-on-surface);
    }

    .summary-bar em {
      font-style: italic;
      color: var(--md-sys-color-primary);
      margin-left: 8px;
    }

    .tab-actions-footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid var(--md-sys-color-outline-variant);
      display: flex;
      justify-content: flex-end;
      gap: 6px;
    }

    .dialog-content {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      height: 60vh;
      max-height: 500px;
    }

    .dialog-content > p {
      flex-shrink: 0;
      margin: 0 0 16px 0;
      padding: 0;
      color: var(--md-sys-color-on-surface-variant);
    }

    .action-chips {
      margin-bottom: 16px;
      flex-shrink: 0;
    }

    .curate-targets-list {
      flex-grow: 1;
      flex-shrink: 1;
      min-height: 200px;
      overflow-y: auto;
      border: 1px solid var(--md-sys-color-outline);
      border-radius: 4px;
    }

    .curate-targets-list md-list-item[selected] {
      background-color: var(--md-sys-color-secondary-container);
    }

    .curate-targets-list md-list-item[disabled] {
      opacity: 0.5;
      pointer-events: none;
    }

    .loading-overlay {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }

    .discovered-controls-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      padding: 12px;
      background-color: var(--md-sys-color-surface-container-low);
      border-radius: 12px;
      align-items: center;
      flex-wrap: wrap;
    }

    .sort-controls {
      display: flex;
      gap: 8px;
    }

    .sort-controls md-outlined-button[selected] {
      background-color: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
    }

    .discovered-results-info {
      padding: 8px 16px;
      background-color: var(--md-sys-color-surface-container-low);
      border-radius: 8px;
      margin-bottom: 12px;
      font-size: 0.875rem;
      color: var(--md-sys-color-on-surface-variant);
    }

    .field-stats {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.875rem;
    }

    .sample-value {
      color: var(--md-sys-color-outline);
      font-style: italic;
    }

    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px;
      border-top: 1px solid var(--md-sys-color-outline-variant);
      margin-top: 12px;
    }

    .page-info {
      font-size: 0.875rem;
      color: var(--md-sys-color-on-surface-variant);
      margin: 0 16px;
      min-width: 120px;
      text-align: center;
    }

    /* Improve the field list for better performance with many items */
    .discovered-fields-list {
      height: 340px;
      overflow-y: auto;
      scroll-behavior: smooth;
    }

    .field-list md-list-item {
      /* Add some spacing for better readability */
      margin-bottom: 4px;
    }

    /* Multiple mappings display */
    .multiple-mappings {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 8px;
    }

    .mapping-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      border-radius: 16px;
      padding: 8px 12px;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      border: 1px solid var(--md-sys-color-outline-variant);
    }

    .mapping-item:hover {
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .mapped-to-value {
      flex: 1;
      font-weight: 500;
      margin-right: 8px;
    }

    .mapping-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .mapping-details {
      margin-bottom: 4px;
    }

    .mapping-details.mapped {
      border-left: 3px solid var(--md-sys-color-primary);
      padding-left: 8px;
    }

    .mapping-details.rejected {
      border-left: 3px solid var(--md-sys-color-error);
      padding-left: 8px;
    }

    .mapped-to-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--md-sys-color-on-surface-variant);
      font-weight: 500;
      margin-bottom: 4px;
      display: block;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .discovered-controls-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .discovered-controls-bar md-outlined-text-field {
        max-width: none;
      }

      .sort-controls {
        justify-content: center;
      }

      .pagination-bar {
        flex-wrap: wrap;
        gap: 4px;
      }
    }
  `;

  _renderWhitelistTab() {
    if (this._isLoadingWhitelist) {
      return html`
        <div class="loading-overlay">
          <md-circular-progress indeterminate></md-circular-progress>
        </div>
      `;
    }

    if (!this._whitelistData) {
      return html`<div>Failed to load whitelist data</div>`;
    }

    return html`
      <div class="whitelist-stats">
        <div class="stat-item">
          <div class="stat-value">${this._whitelistData.total_fields}</div>
          <div class="stat-label">Total Fields</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${this._whitelistData.default_fields}</div>
          <div class="stat-label">Default</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${this._whitelistData.custom_fields}</div>
          <div class="stat-label">Custom</div>
        </div>
      </div>

      <div class="action-bar">
        <md-filled-button @click=${this._openAddFieldDialog}>
          ${plusIcon} Add Field
        </md-filled-button>
        <md-outlined-button @click=${this._resetWhitelist}>
          Reset to Defaults
        </md-outlined-button>
      </div>

      <md-list class="field-list">
        ${map(
          this._whitelistData.fields,
          (field) => html`
            <md-list-item>
              <span slot="headline">${field.field_name}</span>
              <span slot="supporting-text">
                ${field.description || "No description"}
                ${field.is_default ? " (Default field)" : " (Custom field)"}
              </span>
              <div slot="end">
                ${when(
                  !field.is_default,
                  () => html`
                    <md-icon-button
                      @click=${() =>
                        this._removeFieldFromWhitelist(field.field_name)}
                    >
                      ${deleteIcon}
                    </md-icon-button>
                  `
                )}
              </div>
            </md-list-item>
          `
        )}
      </md-list>
    `;
  }

  _renderDiscoveredQueueTab() {
    if (this._isLoadingQueue) {
      return html`
        <div class="loading-overlay">
          <md-circular-progress indeterminate></md-circular-progress>
        </div>
      `;
    }

    const pagination = this._paginatedDiscoveredFields;

    return html`
      <!-- Search and Controls Bar -->
      <div class="discovered-controls-bar">
        <md-outlined-text-field
          label="Search fields..."
          .value=${this._discoveredSearchTerm}
          @input=${this._handleDiscoveredSearchInput}
          style="flex: 1; max-width: 400px;"
        >
          <span slot="leading-icon">${searchIcon}</span>
        </md-outlined-text-field>

        <md-outlined-select
          @change=${this._handleDiscoveredPageSizeChange}
          .value=${this._discoveredPageSize}
          label="Items per page"
        >
          <md-select-option value="25">
            <div slot="headline">25 per page</div>
          </md-select-option>
          <md-select-option value="50">
            <div slot="headline">50 per page</div>
          </md-select-option>
          <md-select-option value="100">
            <div slot="headline">100 per page</div>
          </md-select-option>
          <md-select-option value="200">
            <div slot="headline">200 per page</div>
          </md-select-option>
        </md-outlined-select>

        <div class="sort-controls">
          <md-outlined-button
            @click=${() => this._handleDiscoveredSortChange("field_name")}
            ?selected=${this._discoveredSortBy === "field_name"}
          >
            Name
            ${this._discoveredSortBy === "field_name"
              ? this._discoveredSortDirection === "asc"
                ? "↑"
                : "↓"
              : ""}
          </md-outlined-button>
          <md-outlined-button
            @click=${() => this._handleDiscoveredSortChange("occurrence_count")}
            ?selected=${this._discoveredSortBy === "occurrence_count"}
          >
            Count
            ${this._discoveredSortBy === "occurrence_count"
              ? this._discoveredSortDirection === "asc"
                ? "↑"
                : "↓"
              : ""}
          </md-outlined-button>
        </div>
      </div>

      <!-- Results Info -->
      <div class="discovered-results-info">
        <span>
          Showing ${pagination.startIndex}-${pagination.endIndex} of
          ${pagination.totalCount} fields
          ${this._discoveredSearchTerm
            ? `(filtered from ${this._discoveredQueue.length} total)`
            : ""}
        </span>
      </div>

      <!-- Selection Bar -->
      ${when(
        pagination.fields.length > 0,
        () => html`
          <div class="queue-selection-bar">
            <md-text-button @click=${this._selectAllVisibleQueueFields}>
              Select Visible (${pagination.fields.length})
            </md-text-button>
            <md-text-button @click=${this._clearQueueSelection}>
              Clear Selection
            </md-text-button>

            ${when(
              this._selectedQueueFields.size > 0,
              () => html`
                <md-filled-button
                  @click=${() =>
                    this._bulkReviewQueueFields("whitelisted", true)}
                >
                  ${checkCircleIcon} Whitelist Selected
                  (${this._selectedQueueFields.size})
                </md-filled-button>
                <md-outlined-button
                  @click=${() => this._bulkReviewQueueFields("ignored", false)}
                >
                  ${blockIcon} Ignore Selected
                  (${this._selectedQueueFields.size})
                </md-outlined-button>
              `
            )}
          </div>
        `
      )}

      <!-- Fields List -->
      <md-list class="field-list checkbox-list discovered-fields-list">
        ${pagination.fields.length === 0
          ? html`
              <md-list-item noninteractive>
                <span slot="headline">
                  ${this._discoveredSearchTerm
                    ? "No fields match your search"
                    : "No discovered fields waiting for review"}
                </span>
                <span slot="supporting-text">
                  ${this._discoveredSearchTerm
                    ? "Try a different search term or clear the search"
                    : "Run field discovery to find new fields that aren't whitelisted"}
                </span>
              </md-list-item>
            `
          : map(
              pagination.fields,
              (field) => html`
                <md-list-item
                  @click=${() =>
                    this._toggleQueueFieldSelection(field.field_name)}
                  ?selected=${this._selectedQueueFields.has(field.field_name)}
                >
                  <span slot="headline">${field.field_name}</span>
                  <span slot="supporting-text">
                    <span class="field-stats">
                      Seen ${field.occurrence_count} times
                      ${field.sample_value
                        ? html`
                            <span class="sample-value">
                              • Example:
                              "${field.sample_value.length > 50
                                ? field.sample_value.substring(0, 50) + "..."
                                : field.sample_value}"</span
                            >
                          `
                        : ""}
                    </span>
                  </span>
                  <div slot="end" @click=${(e) => e.stopPropagation()}>
                    <md-icon-button
                      @click=${() =>
                        this._reviewQueueField(
                          field.discovered_id,
                          "whitelisted",
                          true
                        )}
                      title="Add to whitelist"
                    >
                      ${checkCircleIcon}
                    </md-icon-button>
                    <md-icon-button
                      @click=${() =>
                        this._reviewQueueField(
                          field.discovered_id,
                          "ignored",
                          false
                        )}
                      title="Ignore this field"
                    >
                      ${blockIcon}
                    </md-icon-button>
                  </div>
                </md-list-item>
              `
            )}
      </md-list>

      <!-- Pagination -->
      ${when(
        pagination.totalPages > 1,
        () => html`
          <div class="pagination-bar">
            <md-icon-button
              @click=${() => this._handleDiscoveredPageChange(0)}
              ?disabled=${!pagination.hasPrevPage}
              title="First page"
            >
              ⟨⟨
            </md-icon-button>
            <md-icon-button
              @click=${() =>
                this._handleDiscoveredPageChange(pagination.currentPage - 1)}
              ?disabled=${!pagination.hasPrevPage}
              title="Previous page"
            >
              ⟨
            </md-icon-button>

            <span class="page-info">
              Page ${pagination.currentPage + 1} of ${pagination.totalPages}
            </span>

            <md-icon-button
              @click=${() =>
                this._handleDiscoveredPageChange(pagination.currentPage + 1)}
              ?disabled=${!pagination.hasNextPage}
              title="Next page"
            >
              ⟩
            </md-icon-button>
            <md-icon-button
              @click=${() =>
                this._handleDiscoveredPageChange(pagination.totalPages - 1)}
              ?disabled=${!pagination.hasNextPage}
              title="Last page"
            >
              ⟩⟩
            </md-icon-button>
          </div>
        `
      )}
    `;
  }

  _renderFieldMappingTab() {
    // Count fields by their mapping status
    let mappedCount = 0;
    let rejectedCount = 0;

    Object.values(this.fieldMappings).forEach(mappings => {
      if (!Array.isArray(mappings) || mappings.length === 0) return;

      const hasMapped = mappings.some(m => m.action === "mapped" && m.curate_field);
      const hasRejected = mappings.some(m => m.action === "rejected");

      if (hasRejected) {
        rejectedCount++;
      } else if (hasMapped) {
        mappedCount++;
      }
    });

    const totalFields = this.discoveredFields.length;

    return html`
      <!-- Summary Bar -->
      <div class="summary-bar">
        <span>
          <strong>${mappedCount}</strong> mapped,
          <strong>${rejectedCount}</strong> rejected,
          <strong>${totalFields - mappedCount - rejectedCount}</strong> unmapped
          of <strong>${totalFields}</strong> whitelisted fields
          ${when(
            this._hasPendingChanges,
            () => html`<em>(unsaved changes)</em>`
          )}
        </span>
      </div>

      <!-- Action Bar with Discovery and Cached Records -->
      <div class="action-bar">
        <div class="action-section">
          <md-filled-button
            @click=${this._handleDiscoverFields}
            ?disabled=${this._isDiscoveringFields}
          >
            <span style="display: flex; align-items: center; gap: 8px;">
              ${searchIcon}${this._isDiscoveringFields
                ? "Discovering..."
                : "Discover Fields"}
            </span>
          </md-filled-button>
          ${when(
            this._isDiscoveringFields,
            () =>
              html`<md-circular-progress indeterminate></md-circular-progress>`
          )}
          ${when(
            this._discoveryMessage,
            () =>
              html`<span class="action-message"
                >${this._discoveryMessage}</span
              >`
          )}
        </div>

        ${when(
          this.cachedRecordsCount > 0,
          () => html`
            <div class="action-section">
              <md-outlined-button
                @click=${this._handleProcessCachedRecords}
                ?disabled=${this._isProcessingCached}
              >
                <span style="display: flex; align-items: center; gap: 8px;">
                  ${cachedIcon}${this._isProcessingCached
                    ? "Processing..."
                    : "Process Cached Records"}
                </span>
              </md-outlined-button>
              <span class="cached-badge">
                <span style="display: flex; align-items: center; gap: 8px;">
                  ${this.cachedRecordsCount} records waiting to be processed
                </span>
              </span>
              ${when(
                this._isProcessingCached,
                () =>
                  html`<md-circular-progress
                    indeterminate
                  ></md-circular-progress>`
              )}
              ${when(
                this._processingMessage,
                () =>
                  html`<span class="action-message"
                    >${this._processingMessage}</span
                  >`
              )}
            </div>
          `
        )}
      </div>

      <!-- Mapping List -->
      <md-list class="field-list" style="height: 360px; max-height: none;">
        ${map(this.discoveredFields, (field) => {
          const mappingInfo = this._getFieldMappingInfo(field.id);
          const { action, mappings } = mappingInfo;

          return html`
            <md-list-item
              lines="three"
              class=${action === "rejected" ? "rejected" : ""}
            >
              <div
                slot="start"
                class="list-item-start-icon ${action === "mapped"
                  ? "mapped-icon-color"
                  : action === "rejected"
                  ? "rejected-icon-color"
                  : ""}"
              >
                <md-icon
                  title="${action === "mapped"
                    ? "Mapped"
                    : action === "rejected"
                    ? "Rejected"
                    : "Not Mapped"}"
                >
                  ${action === "mapped"
                    ? checkCircleIcon
                    : action === "rejected"
                    ? blockIcon
                    : checkboxBlankCircleIcon}
                </md-icon>
              </div>

              <span slot="headline">${field.name}</span>

              <div slot="supporting-text" class="supporting-text-wrapper">
                <div class="mapping-details ${action}">
                  ${action === "mapped" && mappings.length > 0
                    ? html`
                        <span class="mapped-to-label">Mapped to ${mappings.filter(m => m.action === "mapped" && m.curate_field).length} field${mappings.filter(m => m.action === "mapped" && m.curate_field).length > 1 ? 's' : ''}:</span>
                        <div class="multiple-mappings">
                          ${mappings
                            .filter(m => m.action === "mapped" && m.curate_field)
                            .map(mapping => html`
                              <div class="mapping-item">
                                <span class="mapped-to-value">
                                  ${this._getCurateFieldDisplayInfo(mapping.curate_field, "full")}
                                </span>
                                <md-icon-button
                                  title="Remove this mapping"
                                  @click=${(e) => this._deleteMappingById(mapping.mapping_id, e)}
                                  style="--md-icon-button-size: 32px; margin-left: 4px;"
                                >
                                  ${deleteIcon}
                                </md-icon-button>
                              </div>
                            `)}
                        </div>
                      `
                    : action === "rejected"
                    ? html`
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span>Rejected - will not be included in harvest</span>
                          ${mappings
                            .filter(m => m.action === "rejected")
                            .map(mapping => html`
                              <md-icon-button
                                title="Remove rejection"
                                @click=${(e) => this._deleteMappingById(mapping.mapping_id, e)}
                                style="--md-icon-button-size: 32px;"
                              >
                                ${deleteIcon}
                              </md-icon-button>
                            `)}
                        </div>
                      `
                    : html`<span style="color: var(--md-sys-color-on-surface-variant); font-style: italic;">No mappings configured</span>`}
                </div>
                ${when(
                  field.preview,
                  () => html`
                    <div class="preview-details">
                      <span class="preview-label">Example:</span>
                      <span class="preview-value">
                        ${field.preview.substring(0, 70)}${field.preview
                          .length > 70
                          ? "..."
                          : ""}
                      </span>
                    </div>
                  `
                )}
              </div>

              <div slot="end" class="mapping-actions">
                <md-filled-button
                  tonal
                  @click=${(e) => {
                    e.stopPropagation();
                    this._openMappingDialog(field);
                  }}
                >
                  ${action === "unmapped" ? "Set Mapping" : "Modify Mapping"}
                </md-filled-button>
              </div>
            </md-list-item>
          `;
        })}
      </md-list>

      <!-- No action footer needed - mappings are saved individually -->
    `;
  }

  render() {
    return html`
      <!-- Sub-tabs for different functionality -->
      <md-tabs
        class="sub-tabs"
        @change=${this._handleSubTabChange}
        .activeTabIndex=${this._activeSubTab}
      >
        <md-secondary-tab>Whitelist Management</md-secondary-tab>
        <md-secondary-tab
          >Discovered Fields (${this._discoveredQueue.length})</md-secondary-tab
        >
        <md-secondary-tab>Field Mapping</md-secondary-tab>
      </md-tabs>

      <!-- Tab Content -->
      ${when(this._activeSubTab === 0, () => this._renderWhitelistTab())}
      ${when(this._activeSubTab === 1, () => this._renderDiscoveredQueueTab())}
      ${when(this._activeSubTab === 2, () => this._renderFieldMappingTab())}

      <!-- Add Field Dialog -->
      ${when(
        this._showAddFieldDialog,
        () => html`
          <md-dialog open @closed=${this._closeAddFieldDialog}>
            <div slot="headline">Add Field to Whitelist</div>
            <div slot="content">
              <md-outlined-text-field
                label="Field Name"
                .value=${this._newFieldName}
                @input=${(e) => (this._newFieldName = e.target.value)}
                style="width: 100%; margin-bottom: 16px;"
              ></md-outlined-text-field>
              <md-outlined-text-field
                label="Description (optional)"
                .value=${this._newFieldDescription}
                @input=${(e) => (this._newFieldDescription = e.target.value)}
                style="width: 100%;"
              ></md-outlined-text-field>
            </div>
            <div slot="actions">
              <md-text-button @click=${this._closeAddFieldDialog}>
                Cancel
              </md-text-button>
              <md-filled-button
                @click=${this._addFieldToWhitelist}
                ?disabled=${!this._newFieldName.trim()}
              >
                Add Field
              </md-filled-button>
            </div>
          </md-dialog>
        `
      )}

      <!-- Enhanced Mapping Dialog -->
      ${when(
        this._showMappingDialog && this._currentFieldToMap,
        () => html`
          <md-dialog open @closed=${this._closeMappingDialog}>
            <div slot="headline">
              Configure Field:
              <strong>${this._currentFieldToMap.name}</strong>
            </div>
            <div slot="content" class="dialog-content">
              ${when(
                this._currentFieldToMap.preview,
                () => html`
                  <p>
                    Sample value:
                    <em>"${this._currentFieldToMap.preview}"</em>
                  </p>
                `
              )}

              <!-- Three-State Action Selection -->
              <div class="action-chips">
                <md-chip-set>
                  <md-filter-chip
                    label="Map to Curate Field"
                    ?selected=${this._currentDialogAction === "mapped"}
                    @click=${() => this._handleDialogActionChange("mapped")}
                  >
                  </md-filter-chip>
                  <md-filter-chip
                    label="Reject (Skip)"
                    ?selected=${this._currentDialogAction === "rejected"}
                    @click=${() => this._handleDialogActionChange("rejected")}
                  >
                  </md-filter-chip>
                  <md-filter-chip
                    label="Leave Unmapped"
                    ?selected=${this._currentDialogAction === "unmapped"}
                    @click=${() => this._handleDialogActionChange("unmapped")}
                  >
                  </md-filter-chip>
                </md-chip-set>
              </div>

              ${when(
                this._currentDialogAction === "mapped",
                () => html`
                  <md-outlined-text-field
                    label="Search Curate Target Fields"
                    .value=${this._curateTargetSearchTerm}
                    @input=${(e) =>
                      (this._curateTargetSearchTerm = e.target.value)}
                    style="margin-bottom: 12px; flex-shrink: 0;"
                  >
                    <span slot="leading-icon">${searchIcon}</span>
                  </md-outlined-text-field>

                  <!-- Selection controls -->
                  <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center; flex-shrink: 0;">
                    <md-text-button @click=${(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      this._clearCurateFieldSelection();
                    }}>
                      Clear Selection
                    </md-text-button>
                    <span style="margin-left: auto; font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant);">
                      ${this._selectedCurateFields.size} selected
                    </span>
                  </div>

                  ${when(
                    this._selectedCurateFields.size > 0,
                    () => html`
                      <div style="background: var(--md-sys-color-surface-container-low); padding: 8px; border-radius: 8px; margin-bottom: 12px; flex-shrink: 0;">
                        <div style="font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 4px;">Selected fields:</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                          ${Array.from(this._selectedCurateFields).map(fieldValue => {
                            const target = this.availableCurateTargets.find(t => t.value === fieldValue);
                            return html`
                              <md-filter-chip
                                label="${target ? target.label : fieldValue}"
                                removable
                                @remove=${() => {
                                  const newSelection = new Set(this._selectedCurateFields);
                                  newSelection.delete(fieldValue);
                                  this._selectedCurateFields = newSelection;
                                }}
                              ></md-filter-chip>
                            `;
                          })}
                        </div>
                      </div>
                    `
                  )}

                  <div class="curate-targets-list">
                    <md-list>
                      ${map(
                        this._processedAvailableCurateTargetsForDialog,
                        (target) => html`
                          <md-list-item
                            @click=${(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              this._handleDialogCurateTargetSelect(target.value);
                            }}
                            type="button"
                            ?selected=${this._selectedCurateFields.has(target.value)}
                          >
                            <span slot="headline">${target.label}</span>
                            <span slot="supporting-text">
                              ${target.group} (${target.value})
                            </span>
                            <div slot="end">
                              ${this._selectedCurateFields.has(target.value) ? checkCircleIcon : ''}
                            </div>
                          </md-list-item>
                        `
                      )}
                      ${when(
                        this._processedAvailableCurateTargetsForDialog
                          .length === 0,
                        () => html`
                          <md-list-item noninteractive>
                            <span slot="headline"
                              >No matching Curate fields found.</span
                            >
                          </md-list-item>
                        `
                      )}
                    </md-list>
                  </div>
                `
              )}
              ${when(
                this._currentDialogAction === "rejected",
                () => html`
                  <p style="color: var(--md-sys-color-error);">
                    This field will be excluded from all future ingestion.
                    Records with only rejected/unmapped fields will be cached
                    until you provide mappings.
                  </p>
                `
              )}
              ${when(
                this._currentDialogAction === "unmapped",
                () => html`
                  <p style="color: var(--md-sys-color-on-surface-variant);">
                    This field will remain unmapped. Records containing unmapped
                    fields will be cached until you provide mappings for all
                    fields.
                  </p>
                `
              )}
            </div>

            <div slot="actions">
              <md-text-button @click=${this._closeMappingDialog}
                >Cancel</md-text-button
              >
              <md-filled-button
                @click=${this._saveMappingFromDialog}
                ?disabled=${this._currentDialogAction === "mapped" &&
                this._selectedCurateFields.size === 0}
              >
                ${this._currentDialogAction === "mapped"
                  ? this._selectedCurateFields.size > 1
                    ? `Add ${this._selectedCurateFields.size} Mappings`
                    : this._selectedCurateFields.size === 1
                    ? "Add Mapping"
                    : "Select Fields"
                  : this._currentDialogAction === "rejected"
                  ? "Mark as Rejected"
                  : "Leave Unmapped"}
              </md-filled-button>
            </div>
          </md-dialog>
        `
      )}
    `;
  }
}

customElements.define(
  "metadata-mapping-tab-content",
  MetadataMappingTabContent
);
export { MetadataMappingTabContent };

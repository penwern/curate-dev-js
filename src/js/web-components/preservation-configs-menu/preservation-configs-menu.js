import { LitElement, html, css, svg } from "lit";
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/textfield/filled-text-field.js";
import "@material/web/select/filled-select.js";
import "@material/web/select/select-option.js";
import "@material/web/switch/switch.js";
import "@material/web/slider/slider.js";
import "@material/web/divider/divider.js";
import "@material/web/iconbutton/icon-button.js";
import { mdiStar, mdiStarOutline, mdiDelete, mdiCog } from "@mdi/js";
import { PreservationConfigAPI } from "./api-client.js";

const icon = (path, slot = "") => svg`
  <svg slot=${slot} viewBox="0 0 24 24" style="width:24px;height:24px;fill:currentColor;">
    <path d="${path}"></path>
  </svg>
`;

class PreservationConfigManager extends LitElement {
  static properties = {
    configName: { state: true },
    configDescription: { state: true },
    normalize: { state: true },
    imageNormalizationTiff: { state: true },
    dipEnabled: { state: true },
    processType: { state: true },
    compressAip: { state: true },
    compressionAlgorithm: { state: true },
    compressionLevel: { state: true },
    genTransferStructReport: { state: true },
    documentEmptyDirectories: { state: true },
    extractPackages: { state: true },
    deletePackagesAfterExtraction: { state: true },
    savedConfigs: { state: true },
    isEditMode: { state: true },
    editConfigId: { state: true },
    isLoading: { state: true },
    saveInProgress: { state: true },
  };

  static styles = css`
    :host {
      display: block;
      padding: 32px;
      max-width: 1400px;
      margin: 0 auto;
      font-family: "Roboto", "Segoe UI", system-ui, sans-serif;
      min-height: 100vh;
    }

    .header {
      font-size: 36px;
      font-weight: 400;
      margin-bottom: 40px;
      color: var(--md-sys-color-on-surface, #1d1b20);
      text-align: center;
      letter-spacing: -0.5px;
    }

    .main-container {
      width: 100%;
    }

    .panels-wrapper {
      display: flex;
      gap: 32px;
    }

    .form-section {
      flex: 1;
    }

    .saved-configs-section {
      flex: 1;
    }

    @media (max-width: 1100px) {
      .panels-wrapper {
        flex-direction: column;
      }
    }

    .form-section,
    .saved-configs-section {
      background: var(--md-sys-color-secondary-container);
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.04);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      position: relative;
      overflow: hidden;
    }

    .form-section::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(
        90deg,
        var(--md-sys-color-primary, #6750a4),
        var(--md-sys-color-tertiary, #7d5260)
      );
    }

    .saved-configs-section::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(
        90deg,
        var(--md-sys-color-secondary, #625b71),
        var(--md-sys-color-tertiary, #7d5260)
      );
    }

    .section-title {
      font-size: 28px;
      font-weight: 500;
      margin-bottom: 32px;
      color: var(--md-sys-color-on-surface, #1d1b20);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-title svg {
      width: 32px;
      height: 32px;
      fill: var(--md-sys-color-primary, #6750a4);
    }

    .category {
      margin-bottom: 32px;
      background: var(--md-sys-color-surface-1);
      border-radius: 16px;
      padding: 24px;
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .category-header {
      font-size: 20px;
      font-weight: 500;
      margin-bottom: 20px;
      color: var(--md-sys-color-primary, #6750a4);
      padding-bottom: 12px;
      border-bottom: 2px solid var(--md-sys-color-primary-container, #eaddff);
      position: relative;
    }

    .category-header::after {
      content: "";
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 60px;
      height: 2px;
      background: var(--md-sys-color-primary, #6750a4);
    }

    .form-field {
      margin-bottom: 20px;
    }

    .toggle-field {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      padding: 16px;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .toggle-field:hover {
      background: var(--md-sys-color-primary-container, #eaddff);
    }

    .toggle-field label {
      font-size: 16px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface, #1d1b20);
      cursor: pointer;
    }

    .suboptions {
      margin-left: 16px;
      padding: 16px;
      border-left: 3px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 0 8px 8px 0;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      opacity: 0.4;
      transition: all 0.3s ease;
      transform: translateX(-8px);
    }

    .suboptions.enabled {
      opacity: 1;
      transform: translateX(0);
      background: var(--md-sys-color-primary-container, #eaddff);
      border-left-color: var(--md-sys-color-primary, #6750a4);
    }

    .info-panel {
      background: linear-gradient(
        135deg,
        var(--md-sys-color-tertiary-container, #ffd8e4),
        var(--md-sys-color-primary-container, #eaddff)
      );
      color: var(--md-sys-color-on-tertiary-container, #31111d);
      padding: 20px;
      border-radius: 16px;
      margin: 20px 0;
      font-size: 14px;
      line-height: 1.5;
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .slider-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      border-radius: 12px;
    }

    .slider-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .slider-value {
      font-weight: 600;
      color: var(--md-sys-color-primary, #6750a4);
      background: var(--md-sys-color-primary-container, #eaddff);
      padding: 4px 12px;
      border-radius: 8px;
      min-width: 32px;
      text-align: center;
    }

    .form-actions {
      display: flex;
      gap: 16px;
      margin-top: 32px;
      flex-wrap: wrap;
      justify-content: flex-end;
      padding-top: 20px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
    }

    .config-item {
      background: var(--md-sys-color-surface, #fefbff);
      border: 2px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 16px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      animation: slideIn 0.4s ease-out forwards;
      opacity: 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
      position: relative;
      overflow: hidden;
    }

    .config-item::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(
        90deg,
        var(--md-sys-color-secondary, #625b71),
        var(--md-sys-color-tertiary, #7d5260)
      );
      opacity: 0.7;
    }

    .config-item:hover {
      background: var(--md-sys-color-secondary-container, #e8def8);
      border-color: var(--md-sys-color-secondary, #625b71);
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .config-item:hover::before {
      opacity: 1;
    }

    .config-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      gap: 16px;
    }

    .config-name {
      font-size: 18px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1d1b20);
      line-height: 1.3;
    }

    .config-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-shrink: 0;
    }

    .config-details {
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      line-height: 1.5;
    }

    .config-description {
      margin-bottom: 8px;
      font-weight: 400;
    }

    .config-user {
      font-size: 13px;
      color: var(--md-sys-color-outline, #79747e);
      font-style: italic;
    }

    .no-configs {
      text-align: center;
      padding: 64px 32px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      border-radius: 20px;
      font-size: 16px;
      border: 2px dashed var(--md-sys-color-outline-variant, #c7c5d0);
    }

    .scroll-container {
      max-height: 700px;
      overflow-y: auto;
      padding-right: 8px;
      margin-right: -8px;
    }

    .scroll-container::-webkit-scrollbar {
      width: 8px;
    }

    .scroll-container::-webkit-scrollbar-track {
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      border-radius: 4px;
    }

    .scroll-container::-webkit-scrollbar-thumb {
      background: var(--md-sys-color-outline, #79747e);
      border-radius: 4px;
    }

    .scroll-container::-webkit-scrollbar-thumb:hover {
      background: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .loading {
      text-align: center;
      padding: 32px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .error {
      background: var(--md-sys-color-error-container, #ffdad6);
      color: var(--md-sys-color-on-error-container, #410002);
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 16px;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .spinner {
      animation: spin 1s linear infinite;
      width: 24px;
      height: 24px;
      border: 2px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-top: 2px solid var(--md-sys-color-primary, #6750a4);
      border-radius: 50%;
      display: inline-block;
      margin-right: 8px;
    }

    md-filled-text-field,
    md-filled-select {
      width: 100%;
      margin-bottom: 8px;
      --md-filled-text-field-container-shape: 12px;
      --md-filled-select-text-field-container-shape: 12px;
    }

    md-switch {
      --md-switch-selected-track-color: var(--md-sys-color-primary, #6750a4);
      --md-switch-selected-handle-color: var(
        --md-sys-color-on-primary,
        #ffffff
      );
      --md-switch-track-shape: 16px;
      --md-switch-handle-shape: 16px;
    }

    md-slider {
      width: 100%;
      --md-slider-active-track-color: var(--md-sys-color-primary, #6750a4);
      --md-slider-handle-color: var(--md-sys-color-primary, #6750a4);
    }

    md-filled-button {
      --md-filled-button-container-color: var(--md-sys-color-primary, #6750a4);
      --md-filled-button-label-text-color: var(
        --md-sys-color-on-primary,
        #ffffff
      );
      --md-filled-button-container-shape: 12px;
      padding: 0 24px;
      height: 48px;
    }

    md-outlined-button {
      --md-outlined-button-outline-color: var(--md-sys-color-outline, #79747e);
      --md-outlined-button-label-text-color: var(
        --md-sys-color-primary,
        #6750a4
      );
      --md-outlined-button-container-shape: 12px;
      padding: 0 24px;
      height: 48px;
    }

    md-icon-button {
      --md-icon-button-icon-size: 20px;
    }

    .starred {
      --md-icon-button-icon-color: var(--md-sys-color-primary, #6750a4);
    }

    .delete-btn {
      --md-outlined-button-outline-color: var(--md-sys-color-error, #ba1a1a);
      --md-outlined-button-label-text-color: var(--md-sys-color-error, #ba1a1a);
      padding: 0 16px;
      height: 36px;
      font-size: 13px;
    }

    .delete-btn:hover {
      --md-outlined-button-outline-color: var(--md-sys-color-error, #ba1a1a);
      --md-outlined-button-container-color: var(
        --md-sys-color-error-container,
        #ffdad6
      );
    }
  `;

  constructor() {
    super();
    this.configName = "";
    this.configDescription = "";
    this.normalize = false;
    this.imageNormalizationTiff = "TIFF";
    this.dipEnabled = false;
    this.processType = "standard";
    this.compressAip = false;
    this.compressionAlgorithm = "tar";
    this.compressionLevel = 1;
    this.genTransferStructReport = false;
    this.documentEmptyDirectories = false;
    this.extractPackages = false;
    this.deletePackagesAfterExtraction = false;
    this.savedConfigs = [];
    this.isEditMode = false;
    this.editConfigId = null;
    this.isLoading = false;
    this.saveInProgress = false;

    // Initialize the API client
    this.api = new PreservationConfigAPI();

    // Load configs on initialization
    this.loadConfigs();
  }

  async loadConfigs() {
    this.isLoading = true;
    try {
      const configs = await this.api.getConfigs();
      this.savedConfigs = configs || [];
    } catch (error) {
      console.error("Failed to load configs:", error);
      // Fall back to cached configs from session storage
      this.savedConfigs = this.api.getConfigsFromStorage();
    } finally {
      this.isLoading = false;
    }
  }

  clearForm() {
    this.configName = "";
    this.configDescription = "";
    this.normalize = false;
    this.imageNormalizationTiff = "TIFF";
    this.dipEnabled = false;
    this.processType = "standard";
    this.compressAip = false;
    this.compressionAlgorithm = "tar";
    this.compressionLevel = 1;
    this.genTransferStructReport = false;
    this.documentEmptyDirectories = false;
    this.extractPackages = false;
    this.deletePackagesAfterExtraction = false;
    this.isEditMode = false;
    this.editConfigId = null;
  }

  async saveConfig() {
    if (!this.configName || this.configName.trim().length < 3) {
      alert("Please enter a config name with at least 3 characters");
      return;
    }

    this.saveInProgress = true;

    try {
      const config = {
        name: this.configName,
        description: this.configDescription,
        normalize: this.normalize ? 1 : 0,
        image_normalization_tiff:
          this.imageNormalizationTiff === "TIFF" ? 1 : 0,
        dip_enabled: this.dipEnabled ? 1 : 0,
        process_type: this.processType.toLowerCase(),
        compress_aip: this.compressAip ? 1 : 0,
        compression_algorithm: this.compressionAlgorithm.toLowerCase(),
        compression_level: this.compressionLevel,
        gen_transfer_struct_report: this.genTransferStructReport ? 1 : 0,
        document_empty_directories: this.documentEmptyDirectories ? 1 : 0,
        extract_packages: this.extractPackages ? 1 : 0,
        delete_packages_after_extraction: this.deletePackagesAfterExtraction
          ? 1
          : 0,
        user: pydio?.user?.id || "current-user", // Use actual user if available
      };

      // Add ID if editing existing config
      if (this.isEditMode && this.editConfigId) {
        config.id = this.editConfigId;
      }

      // Save using API
      await this.api.saveConfig(config);

      // Reload configs to get the updated list
      await this.loadConfigs();

      // Clear the form
      this.clearForm();
    } catch (error) {
      console.error("Failed to save config:", error);
      // Error modal is already shown by the API client
    } finally {
      this.saveInProgress = false;
    }
  }

  loadConfig(config) {
    this.configName = config.name || "";
    this.configDescription = config.description || "";
    this.normalize = !!config.normalize;
    this.imageNormalizationTiff =
      config.image_normalization_tiff === 1 ? "TIFF" : "JPEG2000";
    this.dipEnabled = !!config.dip_enabled;
    this.processType = config.process_type || "standard";
    this.compressAip = !!config.compress_aip;
    this.compressionAlgorithm = config.compression_algorithm || "tar";
    this.compressionLevel = config.compression_level || 1;
    this.genTransferStructReport = !!config.gen_transfer_struct_report;
    this.documentEmptyDirectories = !!config.document_empty_directories;
    this.extractPackages = !!config.extract_packages;
    this.deletePackagesAfterExtraction =
      !!config.delete_packages_after_extraction;
    this.isEditMode = true;
    this.editConfigId = config.id;
  }

  async deleteConfig(configId) {
    if (
      !confirm(
        "Deleting a config is permanent and cannot be reverted, do you wish to continue?"
      )
    ) {
      return;
    }

    try {
      await this.api.deleteConfig(configId);
      // Reload configs after successful deletion
      await this.loadConfigs();
    } catch (error) {
      console.error("Failed to delete config:", error);
      // Error modal is already shown by the API client
    }
  }

  toggleBookmark(configId) {
    const bookmarkData = JSON.parse(
      localStorage.getItem(configId.toString()) || "{}"
    );
    const newBookmarkState = !bookmarkData.bookmarked;

    localStorage.setItem(
      configId.toString(),
      JSON.stringify({
        bookmarked: newBookmarkState,
      })
    );

    this.requestUpdate();
  }

  isBookmarked(configId) {
    const bookmarkData = JSON.parse(
      localStorage.getItem(configId.toString()) || "{}"
    );
    return bookmarkData.bookmarked || false;
  }

  openAtomConfig() {
    alert("AtoM Configuration would open here");
  }

  get canSave() {
    return (
      this.configName &&
      this.configName.trim().length >= 3 &&
      !this.saveInProgress
    );
  }

  get saveButtonText() {
    if (this.saveInProgress) return "Saving...";
    if (!this.configName) return "Save Config";
    if (this.configName.trim().length < 3)
      return "Add a name 3 characters or longer";
    return this.isEditMode ? "Update Config" : "Save Config";
  }

  render() {
    return html`
      <div class="main-container">
        <div class="panels-wrapper">
          <!-- Form Section -->
          <div class="form-section">
            <div class="section-title">
              ${icon(mdiCog)} Create or Edit Configs
            </div>

            <!-- Details Category -->
            <div class="category">
              <div class="category-header">Details</div>

              <div class="form-field">
                <md-filled-text-field
                  label="Config Name"
                  .value=${this.configName}
                  @input=${(e) => (this.configName = e.target.value)}
                  required
                >
                </md-filled-text-field>
              </div>

              <div class="form-field">
                <md-filled-text-field
                  label="Config Description"
                  .value=${this.configDescription}
                  @input=${(e) => (this.configDescription = e.target.value)}
                >
                </md-filled-text-field>
              </div>
            </div>

            <!-- Normalisation Category -->
            <div class="category">
              <div class="category-header">Normalisation</div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.normalize}
                  @change=${(e) => (this.normalize = e.target.selected)}
                >
                </md-switch>
                <label>Normalise Objects</label>
              </div>

              <div class="suboptions ${this.normalize ? "enabled" : ""}">
                <div class="form-field">
                  <md-filled-select
                    label="Image Normalisation Format"
                    .value=${this.imageNormalizationTiff}
                    @change=${(e) =>
                      (this.imageNormalizationTiff = e.target.value)}
                    ?disabled=${!this.normalize}
                  >
                    <md-select-option value="TIFF">
                      <div slot="headline">TIFF</div>
                    </md-select-option>
                    <md-select-option value="JPEG2000">
                      <div slot="headline">JPEG2000</div>
                    </md-select-option>
                  </md-filled-select>
                </div>
              </div>
            </div>

            <!-- Dissemination Category -->
            <div class="category">
              <div class="category-header">Dissemination</div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.dipEnabled}
                  @change=${(e) => (this.dipEnabled = e.target.selected)}
                >
                </md-switch>
                <label>Create Dissemination Package</label>
              </div>

              <div class="suboptions ${this.dipEnabled ? "enabled" : ""}">
                <div class="info-panel">
                  Create dissemination packages from AIPs generated by this
                  config. Created DIPs will automatically be connected to the
                  linked description of the source data. For this option to
                  work, you must configure a connected AtoM instance.
                </div>
                <md-filled-button
                  @click=${this.openAtomConfig}
                  ?disabled=${!this.dipEnabled}
                >
                  Go to AtoM Configuration
                </md-filled-button>
              </div>
            </div>

            <!-- Packaging and Compression Category -->
            <div class="category">
              <div class="category-header">Packaging and Compression</div>

              <div class="form-field">
                <md-filled-select
                  label="AIP Packaging Type"
                  .value=${this.processType}
                  @change=${(e) => (this.processType = e.target.value)}
                >
                  <md-select-option value="standard">
                    <div slot="headline">standard</div>
                  </md-select-option>
                  <md-select-option value="eark">
                    <div slot="headline">eark</div>
                  </md-select-option>
                </md-filled-select>
              </div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.compressAip}
                  @change=${(e) => (this.compressAip = e.target.selected)}
                >
                </md-switch>
                <label>Compress AIPs</label>
              </div>

              <div class="suboptions ${this.compressAip ? "enabled" : ""}">
                <div class="info-panel">
                  Compressing AIPs will make their contents unsearchable and
                  prevent descriptive metadata from being reassociated with
                  output objects. You can compress your AIPs for distribution or
                  deep-storage while conserving the uncompressed AIP by
                  right-clicking an AIP in a workspace.
                </div>

                <div class="form-field">
                  <md-filled-select
                    label="Compression Algorithm"
                    .value=${this.compressionAlgorithm}
                    @change=${(e) =>
                      (this.compressionAlgorithm = e.target.value)}
                    ?disabled=${!this.compressAip}
                  >
                    <md-select-option value="tar">
                      <div slot="headline">tar</div>
                    </md-select-option>
                    <md-select-option value="tar_bzip2">
                      <div slot="headline">tar_bzip2</div>
                    </md-select-option>
                    <md-select-option value="tar_gzip">
                      <div slot="headline">tar_gzip</div>
                    </md-select-option>
                    <md-select-option value="s7_copy">
                      <div slot="headline">s7_copy</div>
                    </md-select-option>
                    <md-select-option value="s7_bzip2">
                      <div slot="headline">s7_bzip2</div>
                    </md-select-option>
                    <md-select-option value="s7_lzma">
                      <div slot="headline">s7_lzma</div>
                    </md-select-option>
                  </md-filled-select>
                </div>

                <div class="form-field">
                  <div class="slider-container">
                    <div class="slider-label">
                      <span>Compression Level</span>
                      <span class="slider-value">${this.compressionLevel}</span>
                    </div>
                    <md-slider
                      min="1"
                      max="9"
                      step="1"
                      .value=${this.compressionLevel}
                      @input=${(e) =>
                        (this.compressionLevel = parseInt(e.target.value))}
                      ?disabled=${!this.compressAip}
                      labeled
                    >
                    </md-slider>
                  </div>
                </div>
              </div>
            </div>

            <!-- Transfer Options Category -->
            <div class="category">
              <div class="category-header">Transfer Options</div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.genTransferStructReport}
                  @change=${(e) =>
                    (this.genTransferStructReport = e.target.selected)}
                >
                </md-switch>
                <label>Generate Transfer Structure Report</label>
              </div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.documentEmptyDirectories}
                  @change=${(e) =>
                    (this.documentEmptyDirectories = e.target.selected)}
                >
                </md-switch>
                <label>Document Empty Directories</label>
              </div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.extractPackages}
                  @change=${(e) => (this.extractPackages = e.target.selected)}
                >
                </md-switch>
                <label>Extract Packages</label>
              </div>

              <div class="suboptions ${this.extractPackages ? "enabled" : ""}">
                <div class="toggle-field">
                  <md-switch
                    ?selected=${this.deletePackagesAfterExtraction}
                    @change=${(e) =>
                      (this.deletePackagesAfterExtraction = e.target.selected)}
                    ?disabled=${!this.extractPackages}
                  >
                  </md-switch>
                  <label>Delete Packages After Extraction</label>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <md-filled-button
                @click=${this.saveConfig}
                ?disabled=${!this.canSave}
              >
                ${this.saveInProgress ? html`<div class="spinner"></div>` : ""}
                ${this.saveButtonText}
              </md-filled-button>
              <md-outlined-button @click=${this.clearForm}>
                Clear Form
              </md-outlined-button>
            </div>
          </div>

          <!-- Saved Configs Section -->
          <div class="saved-configs-section">
            <div class="section-title">${icon(mdiStar)} Saved Configs</div>

            <div class="scroll-container">
              ${this.isLoading
                ? html`<div class="loading">
                    <div class="spinner"></div>
                    Loading configurations...
                  </div>`
                : this.savedConfigs.length === 0
                ? html`<div class="no-configs">
                    No Saved Preservation Configs Found
                  </div>`
                : this.savedConfigs.map(
                    (config, index) => html`
                      <div
                        class="config-item"
                        style="animation-delay: ${index * 0.1}s"
                        @click=${() => this.loadConfig(config)}
                      >
                        <div class="config-header">
                          <div class="config-name">${config.name}</div>
                          <div class="config-actions">
                            <md-icon-button
                              class="${this.isBookmarked(config.id)
                                ? "starred"
                                : ""}"
                              @click=${(e) => {
                                e.stopPropagation();
                                this.toggleBookmark(config.id);
                              }}
                            >
                              ${this.isBookmarked(config.id)
                                ? icon(mdiStar)
                                : icon(mdiStarOutline)}
                            </md-icon-button>
                            <md-outlined-button
                              class="delete-btn"
                              @click=${(e) => {
                                e.stopPropagation();
                                this.deleteConfig(config.id);
                              }}
                            >
                              Delete
                            </md-outlined-button>
                          </div>
                        </div>
                        <div class="config-details">
                          <div class="config-description">
                            <strong>Description:</strong>
                            ${config.description || "No description"}
                          </div>
                          <div><strong>User:</strong> ${config.user}</div>
                        </div>
                      </div>
                    `
                  )}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("preservation-config-manager", PreservationConfigManager);

export default PreservationConfigManager;

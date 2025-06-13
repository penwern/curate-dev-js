import { LitElement, html } from "lit";
import { when } from "lit/directives/when.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/select/outlined-select.js";
import "@material/web/select/select-option.js";
import "@material/web/switch/switch.js";
import "@material/web/slider/slider.js";
import "@material/web/divider/divider.js";
import "@material/web/iconbutton/icon-button.js";
import { mdiStar, mdiStarOutline, mdiDelete, mdiCog } from "@mdi/js";
import { PreservationConfigAPI } from "./api-client.js";
import { icon } from "../utils/icons.js";
import {styles} from "./styles.js";   


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

  static styles = styles;

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
                <md-outlined-text-field
                  label="Config Name"
                  .value=${this.configName}
                  @input=${(e) => (this.configName = e.target.value)}
                  required
                >
                </md-outlined-text-field>
              </div>

              <div class="form-field">
                <md-outlined-text-field
                  label="Config Description"
                  .value=${this.configDescription}
                  @input=${(e) => (this.configDescription = e.target.value)}
                >
                </md-outlined-text-field>
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
                  <md-outlined-select
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
                  </md-outlined-select>
                </div>
              </div>
            </div>

            <!-- Dissemination Category !!commented out for now since we just auto generate DIPs when AtoM slug is connected, keeping in because
            it's likely users will want want to generate DIPs on their own in the future -->
            <!--<div class="category">
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
            </div> -->

            <!-- Packaging and Compression Category -->
            <div class="category">
              <div class="category-header">Packaging and Compression</div>

              <div class="form-field">
                <md-outlined-select
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
                </md-outlined-select>
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
                  <md-outlined-select
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
                  </md-outlined-select>
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
                            ${when(config.user !== "System" && config.name !== "Default", ()=>{
                                return html`<md-outlined-button
                              class="delete-btn"
                              @click=${(e) => {
                                e.stopPropagation();
                                this.deleteConfig(config.id);
                              }}
                            >
                              Delete
                            </md-outlined-button>`
                            })}
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

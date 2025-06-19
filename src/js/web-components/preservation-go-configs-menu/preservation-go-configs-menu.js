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

class PreservationGoConfigManager extends LitElement {
  static properties = {
    configName: { state: true },
    configDescription: { state: true },
    AssignUuidsToDirectories: { state: true },
    ExamineContents: { state: true },
    GenerateTransferStructureReport: { state: true },
    DocumentEmptyDirectories: { state: true },
    ExtractPackages: { state: true },
    DeletePackagesAfterExtraction: { state: true },
    IdentifyTransfer: { state: true },
    IdentifySubmissionAndMetadata: { state: true },
    IdentifyBeforeNormalization: { state: true },
    Normalize: { state: true },
    TranscribeFiles: { state: true },
    PerformPolicyChecksOnOriginals: { state: true },
    PerformPolicyChecksOnPreservationDerivatives: { state: true },
    PerformPolicyChecksOnAccessDerivatives: { state: true },
    ThumbnailMode: { state: true },
    CompressAip: { state: true },
    AipCompressionLevel: { state: true },
    AipCompressionAlgorithm: { state: true },
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
    this.AssignUuidsToDirectories = true;
    this.ExamineContents = false;
    this.GenerateTransferStructureReport = true;
    this.DocumentEmptyDirectories = true;
    this.ExtractPackages = true;
    this.DeletePackagesAfterExtraction = false;
    this.IdentifyTransfer = true;
    this.IdentifySubmissionAndMetadata = true;
    this.IdentifyBeforeNormalization = true;
    this.Normalize = true;
    this.TranscribeFiles = true;
    this.PerformPolicyChecksOnOriginals = true;
    this.PerformPolicyChecksOnPreservationDerivatives = true;
    this.PerformPolicyChecksOnAccessDerivatives = true;
    this.ThumbnailMode = 1; // GENERATE
    this.CompressAip = false;
    this.AipCompressionLevel = 1;
    this.AipCompressionAlgorithm = "ZIP";
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
    this.AssignUuidsToDirectories = true;
    this.ExamineContents = false;
    this.GenerateTransferStructureReport = true;
    this.DocumentEmptyDirectories = true;
    this.ExtractPackages = true;
    this.DeletePackagesAfterExtraction = false;
    this.IdentifyTransfer = true;
    this.IdentifySubmissionAndMetadata = true;
    this.IdentifyBeforeNormalization = true;
    this.Normalize = true;
    this.TranscribeFiles = true;
    this.PerformPolicyChecksOnOriginals = true;
    this.PerformPolicyChecksOnPreservationDerivatives = true;
    this.PerformPolicyChecksOnAccessDerivatives = true;
    this.ThumbnailMode = 1;
    this.CompressAip = false;
    this.AipCompressionLevel = 1;
    this.AipCompressionAlgorithm = "ZIP";
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
        compress_aip: this.CompressAip,
        aip_compression_level: this.AipCompressionLevel,
        aip_compression_algorithm: this.AipCompressionAlgorithm,
        a3m_config: {
          assign_uuids_to_directories: this.AssignUuidsToDirectories,
          examine_contents: this.ExamineContents,
          generate_transfer_structure_report: this.GenerateTransferStructureReport,
          document_empty_directories: this.DocumentEmptyDirectories,
          extract_packages: this.ExtractPackages,
          delete_packages_after_extraction: this.DeletePackagesAfterExtraction,
          identify_transfer: this.IdentifyTransfer,
          identify_submission_and_metadata: this.IdentifySubmissionAndMetadata,
          identify_before_normalization: this.IdentifyBeforeNormalization,
          normalize: this.Normalize,
          transcribe_files: this.TranscribeFiles,
          perform_policy_checks_on_originals: this.PerformPolicyChecksOnOriginals,
          perform_policy_checks_on_preservation_derivatives: this.PerformPolicyChecksOnPreservationDerivatives,
          perform_policy_checks_on_access_derivatives: this.PerformPolicyChecksOnAccessDerivatives,
          thumbnail_mode: this.ThumbnailMode,
        },
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
    
    // Handle a3m
    const a3mConfig = config.a3m_config || {};
    
    this.AssignUuidsToDirectories = a3mConfig.assign_uuids_to_directories !== undefined ? !!a3mConfig.assign_uuids_to_directories : true;
    this.ExamineContents = a3mConfig.examine_contents !== undefined ? !!a3mConfig.examine_contents : false;
    this.GenerateTransferStructureReport = a3mConfig.generate_transfer_structure_report !== undefined ? !!a3mConfig.generate_transfer_structure_report : true;
    this.DocumentEmptyDirectories = a3mConfig.document_empty_directories !== undefined ? !!a3mConfig.document_empty_directories : true;
    this.ExtractPackages = a3mConfig.extract_packages !== undefined ? !!a3mConfig.extract_packages : true;
    this.DeletePackagesAfterExtraction = a3mConfig.delete_packages_after_extraction !== undefined ? !!a3mConfig.delete_packages_after_extraction : false;
    this.IdentifyTransfer = a3mConfig.identify_transfer !== undefined ? !!a3mConfig.identify_transfer : true;
    this.IdentifySubmissionAndMetadata = a3mConfig.identify_submission_and_metadata !== undefined ? !!a3mConfig.identify_submission_and_metadata : true;
    this.IdentifyBeforeNormalization = a3mConfig.identify_before_normalization !== undefined ? !!a3mConfig.identify_before_normalization : true;
    this.Normalize = a3mConfig.normalize !== undefined ? !!a3mConfig.normalize : true;
    this.TranscribeFiles = a3mConfig.transcribe_files !== undefined ? !!a3mConfig.transcribe_files : true;
    this.PerformPolicyChecksOnOriginals = a3mConfig.perform_policy_checks_on_originals !== undefined ? !!a3mConfig.perform_policy_checks_on_originals : true;
    this.PerformPolicyChecksOnPreservationDerivatives = a3mConfig.perform_policy_checks_on_preservation_derivatives !== undefined ? !!a3mConfig.perform_policy_checks_on_preservation_derivatives : true;
    this.PerformPolicyChecksOnAccessDerivatives = a3mConfig.perform_policy_checks_on_access_derivatives !== undefined ? !!a3mConfig.perform_policy_checks_on_access_derivatives : true;
    this.ThumbnailMode = config.a3m_config?.thumbnail_mode !== undefined ? config.a3m_config.thumbnail_mode : 1;
    
    // Handle root-level properties
    this.CompressAip = config.compress_aip !== undefined ? !!config.compress_aip : false;
    this.AipCompressionLevel = config.aip_compression_level !== undefined ? config.aip_compression_level : 1;
    this.AipCompressionAlgorithm = config.aip_compression_algorithm || "ZIP";
    
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

  getThumbnailModeText(mode) {
    switch (mode) {
      case 1:
        return "Generate";
      case 2:
        return "Generate (Non-default)";
      case 3:
        return "Do Not Generate";
      default:
        return "Generate";
    }
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

            <!-- Directory and Transfer Processing -->
            <div class="category">
              <div class="category-header">Directory and Transfer Processing</div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.AssignUuidsToDirectories}
                  @change=${(e) => (this.AssignUuidsToDirectories = e.target.selected)}
                >
                </md-switch>
                <label>Assign UUIDs to Directories</label>
              </div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.ExamineContents}
                  @change=${(e) => (this.ExamineContents = e.target.selected)}
                >
                </md-switch>
                <label>Examine Contents</label>
              </div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.GenerateTransferStructureReport}
                  @change=${(e) => (this.GenerateTransferStructureReport = e.target.selected)}
                >
                </md-switch>
                <label>Generate Transfer Structure Report</label>
              </div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.DocumentEmptyDirectories}
                  @change=${(e) => (this.DocumentEmptyDirectories = e.target.selected)}
                >
                </md-switch>
                <label>Document Empty Directories</label>
              </div>
            </div>

            <!-- Package Extraction -->
            <div class="category">
              <div class="category-header">Package Extraction</div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.ExtractPackages}
                  @change=${(e) => (this.ExtractPackages = e.target.selected)}
                >
                </md-switch>
                <label>Extract Packages</label>
              </div>

              <div class="suboptions ${this.ExtractPackages ? "enabled" : ""}">
                <div class="toggle-field">
                  <md-switch
                    ?selected=${this.DeletePackagesAfterExtraction}
                    @change=${(e) => (this.DeletePackagesAfterExtraction = e.target.selected)}
                    ?disabled=${!this.ExtractPackages}
                  >
                  </md-switch>
                  <label>Delete Packages After Extraction</label>
                </div>
              </div>
            </div>

            <!-- Identification -->
            <div class="category">
              <div class="category-header">Identification</div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.IdentifyTransfer}
                  @change=${(e) => (this.IdentifyTransfer = e.target.selected)}
                >
                </md-switch>
                <label>Identify Transfer</label>
              </div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.IdentifySubmissionAndMetadata}
                  @change=${(e) => (this.IdentifySubmissionAndMetadata = e.target.selected)}
                >
                </md-switch>
                <label>Identify Submission and Metadata</label>
              </div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.IdentifyBeforeNormalization}
                  @change=${(e) => (this.IdentifyBeforeNormalization = e.target.selected)}
                >
                </md-switch>
                <label>Identify Before Normalization</label>
              </div>
            </div>

            <!-- Normalization -->
            <div class="category">
              <div class="category-header">Normalization</div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.Normalize}
                  @change=${(e) => (this.Normalize = e.target.selected)}
                >
                </md-switch>
                <label>Normalize Files</label>
              </div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.TranscribeFiles}
                  @change=${(e) => (this.TranscribeFiles = e.target.selected)}
                >
                </md-switch>
                <label>Transcribe Files</label>
              </div>
            </div>

            <!-- Policy Checks -->
            <div class="category">
              <div class="category-header">Policy Checks</div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.PerformPolicyChecksOnOriginals}
                  @change=${(e) => (this.PerformPolicyChecksOnOriginals = e.target.selected)}
                >
                </md-switch>
                <label>Perform Policy Checks on Originals</label>
              </div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.PerformPolicyChecksOnPreservationDerivatives}
                  @change=${(e) => (this.PerformPolicyChecksOnPreservationDerivatives = e.target.selected)}
                >
                </md-switch>
                <label>Perform Policy Checks on Preservation Derivatives</label>
              </div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.PerformPolicyChecksOnAccessDerivatives}
                  @change=${(e) => (this.PerformPolicyChecksOnAccessDerivatives = e.target.selected)}
                >
                </md-switch>
                <label>Perform Policy Checks on Access Derivatives</label>
              </div>
            </div>

            <!-- Thumbnail Generation -->
            <div class="category">
              <div class="category-header">Thumbnail Generation</div>

              <div class="form-field">
                <md-outlined-select
                  label="Thumbnail Mode"
                  .value=${this.ThumbnailMode}
                  @change=${(e) => (this.ThumbnailMode = parseInt(e.target.value))}
                >
                  <md-select-option value="1">
                    <div slot="headline">Generate</div>
                  </md-select-option>
                  <md-select-option value="2">
                    <div slot="headline">Generate (Non-default)</div>
                  </md-select-option>
                  <md-select-option value="3">
                    <div slot="headline">Do Not Generate</div>
                  </md-select-option>
                </md-outlined-select>
              </div>
            </div>

            <!-- AIP Compression -->
            <div class="category">
              <div class="category-header">AIP Compression</div>

              <div class="toggle-field">
                <md-switch
                  ?selected=${this.CompressAip}
                  @change=${(e) => (this.CompressAip = e.target.selected)}
                >
                </md-switch>
                <label>Compress AIP</label>
              </div>

              <div class="suboptions ${this.CompressAip ? "enabled" : ""}">
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
                    .value=${this.AipCompressionAlgorithm}
                    @change=${(e) => (this.AipCompressionAlgorithm = e.target.value)}
                    ?disabled=${!this.CompressAip}
                  >
                    <md-select-option value="ZIP">
                      <div slot="headline">ZIP</div>
                    </md-select-option>
                  </md-outlined-select>
                </div>

                <div class="form-field">
                  <div class="info-panel">
                    <em>Compression level options coming soon</em>
                  </div>
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
                          <div><strong>Normalize:</strong> ${config.a3m_config?.normalize ? "Yes" : "No"}</div>
                          <div><strong>Compress AIP:</strong> ${config.compress_aip ? "Yes" : "No"}</div>
                          <!-- <div><strong>Thumbnail Mode:</strong> ${this.getThumbnailModeText(config.a3m_config?.thumbnail_mode)}</div> -->
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

customElements.define("preservation-go-config-manager", PreservationGoConfigManager);

export default PreservationGoConfigManager;

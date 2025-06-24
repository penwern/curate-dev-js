import { LitElement, html } from "lit";
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/select/outlined-select.js";
import "@material/web/select/select-option.js";
import "@material/web/switch/switch.js";
import "@material/web/slider/slider.js";
import "@material/web/divider/divider.js";
import "@material/web/iconbutton/icon-button.js";
import { PreservationConfigAPI } from "./api-client.js";
import { styles } from "./styles.js";
import { preservationGoConfigUI } from "./ui-component.js";

const defaultConfigId = 1;

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
    loadError: { state: true },
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
    this.loadError = false;

    // Initialize the API client
    this.api = new PreservationConfigAPI();

    // Load configs on initialization
    this.loadConfigs();
  }

  async loadConfigs() {
    this.isLoading = true;
    this.loadError = false;
    try {
      const configs = await this.api.getConfigs();
      this.savedConfigs = configs || [];
    } catch (error) {
      console.error("Failed to load preservation go configs:", error);
      this.savedConfigs = [];
      this.loadError = true;
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
      if (window.curateDebug) {
        console.log("Save requested with values:", {
          configName: this.configName,
          configDescription: this.configDescription,
          CompressAip: this.CompressAip,
          Normalize: this.Normalize
        });
      }

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
        }
      };

      // Add ID if editing existing config
      if (this.isEditMode && this.editConfigId) {
        config.id = this.editConfigId;
      }

      if (window.curateDebug) {
        console.log("Saving config:", config);
      }

      // Save using API
      await this.api.saveConfig(config);

      // Reload configs to get the updated list
      await this.loadConfigs();

      // Clear the form
      this.clearForm();
    } catch (error) {
      console.error("Failed to save preservation go config:", error);
      // Error modal is already shown by the API client
    } finally {
      this.saveInProgress = false;
    }
  }

  loadConfig(config) {
    if (window.curateDebug) {
      console.log("Load requested with values:", config);
    }

    this.configName = config.name || "";
    this.configDescription = config.description || "";

    // Handle a3m - support both camelCase and snake_case property names
    const a3mConfig = config.a3m_config || {};

    // Helper function to get value from either camelCase or snake_case
    const getValue = (camelCase, snakeCase, defaultValue) => {
      if (a3mConfig[camelCase] !== undefined) return !!a3mConfig[camelCase];
      if (a3mConfig[snakeCase] !== undefined) return !!a3mConfig[snakeCase];
      return defaultValue;
    };

    this.AssignUuidsToDirectories = getValue('assignUuidsToDirectories', 'assign_uuids_to_directories', true);
    this.ExamineContents = getValue('examineContents', 'examine_contents', false);
    this.GenerateTransferStructureReport = getValue('generateTransferStructureReport', 'generate_transfer_structure_report', true);
    this.DocumentEmptyDirectories = getValue('documentEmptyDirectories', 'document_empty_directories', true);
    this.ExtractPackages = getValue('extractPackages', 'extract_packages', true);
    this.DeletePackagesAfterExtraction = getValue('deletePackagesAfterExtraction', 'delete_packages_after_extraction', false);
    this.IdentifyTransfer = getValue('identifyTransfer', 'identify_transfer', true);
    this.IdentifySubmissionAndMetadata = getValue('identifySubmissionAndMetadata', 'identify_submission_and_metadata', true);
    this.IdentifyBeforeNormalization = getValue('identifyBeforeNormalization', 'identify_before_normalization', true);
    this.Normalize = getValue('normalize', 'normalize', true);
    this.TranscribeFiles = getValue('transcribeFiles', 'transcribe_files', true);
    this.PerformPolicyChecksOnOriginals = getValue('performPolicyChecksOnOriginals', 'perform_policy_checks_on_originals', true);
    this.PerformPolicyChecksOnPreservationDerivatives = getValue('performPolicyChecksOnPreservationDerivatives', 'perform_policy_checks_on_preservation_derivatives', true);
    this.PerformPolicyChecksOnAccessDerivatives = getValue('performPolicyChecksOnAccessDerivatives', 'perform_policy_checks_on_access_derivatives', true);

    // Handle thumbnail mode - support both camelCase and snake_case
    this.ThumbnailMode = a3mConfig.thumbnailMode !== undefined ? a3mConfig.thumbnailMode :
      (a3mConfig.thumbnail_mode !== undefined ? a3mConfig.thumbnail_mode : 1);

    // Handle root-level properties
    this.CompressAip = config.compress_aip !== undefined ? !!config.compress_aip : false;
    this.AipCompressionLevel = config.aip_compression_level !== undefined ? config.aip_compression_level : 1;
    this.AipCompressionAlgorithm = config.aip_compression_algorithm || "ZIP";

    this.isEditMode = true;
    this.editConfigId = config.id;

    if (window.curateDebug) {
      console.log("Config loaded with values:", {
        configName: this.configName,
        configDescription: this.configDescription,
        CompressAip: this.CompressAip,
        Normalize: this.Normalize
      });
    }
  }

  async deleteConfig(configId) {
    // Prevent deletion of the default config (id: 1)
    if (configId === defaultConfigId) {
      alert("Cannot delete the default config. This is a system configuration that must be preserved.");
      return;
    }

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
      console.error("Failed to delete preservation go config:", error);
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
    if (window.curateDebug) {
      console.log("Rendering Preservation Go Configs Menu");
    }
    return preservationGoConfigUI(this);
  }
}

customElements.define("preservation-go-config-manager", PreservationGoConfigManager);

export default PreservationGoConfigManager;

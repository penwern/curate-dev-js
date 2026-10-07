import { LitElement } from "lit";
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/button/text-button.js";
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/switch/switch.js";
import "@material/web/iconbutton/icon-button.js";
import { PreservationConfigAPI, isDefaultConfigId } from "./api-client.js";
import {
  FALLBACK_DEFAULTS,
  valuesFromConfig,
  configPayload,
  differences,
  validateName,
} from "./settings.js";
import { styles } from "./styles.js";
import { preservationGoConfigUI } from "./ui-component.js";

class PreservationGoConfigManager extends LitElement {
  static properties = {
    configs: { state: true },
    isLoading: { state: true },
    loadError: { state: true },
    selectedId: { state: true },
    mode: { state: true }, // "view" | "edit" | "create"
    draft: { state: true },
    baseName: { state: true },
    baseValues: { state: true },
    nameTouched: { state: true },
    advancedOpen: { state: true },
    saveInProgress: { state: true },
  };

  static styles = styles;

  constructor() {
    super();
    this.configs = [];
    this.isLoading = false;
    this.loadError = false;
    this.selectedId = null;
    this.mode = "view";
    this.draft = null;
    this.baseName = "";
    this.baseValues = FALLBACK_DEFAULTS;
    this.nameTouched = false;
    this.advancedOpen = false;
    this.saveInProgress = false;
    this.initialDraft = "";

    this.api = new PreservationConfigAPI();

    this.loadConfigs();
  }

  // ---- Data ----

  async loadConfigs(selectId) {
    this.isLoading = true;
    this.loadError = false;
    try {
      const configs = await this.api.getConfigs();
      this.configs = Array.isArray(configs) ? configs : [];
    } catch (error) {
      console.error("Failed to load preservation go configs:", error);
      this.configs = [];
      this.loadError = true;
    } finally {
      this.isLoading = false;
    }

    const wanted = selectId ?? this.selectedId;
    const found = this.configs.find((c) => String(c.id) === String(wanted));
    this.selectedId = (found || this.defaultConfig || this.configs[0] || {}).id ?? null;
  }

  get defaultConfig() {
    return this.configs.find((c) => isDefaultConfigId(c.id)) || null;
  }

  get defaultValues() {
    return this.defaultConfig ? valuesFromConfig(this.defaultConfig) : FALLBACK_DEFAULTS;
  }

  get defaultName() {
    return this.defaultConfig?.name || "the default settings";
  }

  // The default config first, then the rest alphabetically
  get otherConfigs() {
    return this.configs
      .filter((c) => !isDefaultConfigId(c.id))
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "en-GB", { sensitivity: "base" }));
  }

  get selectedConfig() {
    return this.configs.find((c) => String(c.id) === String(this.selectedId)) || null;
  }

  // ---- Pins (stored per config id, shared with the right-click menu) ----

  isPinned(configId) {
    // The default config is always in the right-click menu, as "Preserve"
    if (isDefaultConfigId(configId)) return false;
    try {
      return !!JSON.parse(localStorage.getItem(String(configId)) || "{}").bookmarked;
    } catch (_error) {
      return false;
    }
  }

  togglePin(config) {
    try {
      const key = String(config.id);
      const stored = JSON.parse(localStorage.getItem(key) || "{}");
      localStorage.setItem(
        key,
        JSON.stringify({ ...stored, name: config.name, bookmarked: !stored.bookmarked }),
      );
    } catch (error) {
      console.error("Could not update the right-click menu pin:", error);
    }
    this.requestUpdate();
  }

  clearPin(configId) {
    try {
      localStorage.removeItem(String(configId));
    } catch (_error) {
      // Storage unavailable: nothing to clear
    }
  }

  // ---- Editing state ----

  get isEditing() {
    return this.mode === "edit" || this.mode === "create";
  }

  get isDirty() {
    return this.isEditing && JSON.stringify(this.draft) !== this.initialDraft;
  }

  get changeCount() {
    return this.draft ? differences(this.draft.values, this.baseValues).length : 0;
  }

  get nameError() {
    if (!this.draft) return "";
    return validateName(
      this.draft.name,
      this.configs,
      this.mode === "edit" ? this.selectedId : null,
    );
  }

  get canSave() {
    if (!this.isEditing || this.saveInProgress || this.nameError) return false;
    return this.mode === "create" || this.isDirty;
  }

  beginEditing(mode, draft, baseName, baseValues) {
    this.mode = mode;
    this.draft = draft;
    this.initialDraft = JSON.stringify(draft);
    this.baseName = baseName;
    this.baseValues = baseValues;
    this.nameTouched = false;
    this.advancedOpen = false;
  }

  startEdit() {
    const config = this.selectedConfig;
    if (!config || isDefaultConfigId(config.id)) return;
    this.beginEditing(
      "edit",
      {
        name: config.name || "",
        description: config.description || "",
        values: valuesFromConfig(config),
      },
      this.defaultName,
      this.defaultValues,
    );
  }

  // Start a new config from the default's values, or from the selected config when duplicating
  startCreate(duplicate = false) {
    this.confirmDiscard(() => {
      const source = duplicate ? this.selectedConfig : this.defaultConfig;
      this.beginEditing(
        "create",
        {
          name: duplicate && source ? `Copy of ${source.name}` : "",
          description: "",
          values: source ? valuesFromConfig(source) : { ...FALLBACK_DEFAULTS },
        },
        source?.name || this.defaultName,
        source ? valuesFromConfig(source) : FALLBACK_DEFAULTS,
      );
    });
  }

  leaveEditing() {
    this.mode = "view";
    this.draft = null;
    this.initialDraft = "";
  }

  cancelEditing() {
    this.confirmDiscard(() => this.leaveEditing());
  }

  selectConfig(configId) {
    if (String(configId) === String(this.selectedId) && this.mode !== "create") return;
    this.confirmDiscard(() => {
      this.leaveEditing();
      this.selectedId = configId;
    });
  }

  confirmDiscard(proceed) {
    if (!this.isDirty) {
      proceed();
      return;
    }
    Curate.ui.modals
      .curatePopup(
        {
          title: "Discard your changes?",
          message: "You have unsaved changes to this config. They will be lost if you continue.",
          type: "warning",
          buttonType: "okCancel",
        },
        { onOk: proceed },
      )
      .fire();
  }

  setDetail(field, value) {
    this.draft = { ...this.draft, [field]: value };
  }

  setValue(key, value) {
    this.draft = { ...this.draft, values: { ...this.draft.values, [key]: value } };
  }

  resetValue(key) {
    this.setValue(key, this.defaultValues[key]);
  }

  toggleAdvanced() {
    this.advancedOpen = !this.advancedOpen;
  }

  // ---- Save and delete ----

  async saveConfig() {
    if (!this.canSave) return;
    this.saveInProgress = true;

    try {
      const payload = configPayload(this.draft.values, this.draft);
      let savedId = this.selectedId;

      if (this.mode === "edit") {
        await this.api.saveConfig({ ...payload, id: this.selectedId });
      } else {
        const created = await this.api.saveConfig(payload);
        savedId = created?.id;
      }

      this.leaveEditing();
      await this.loadConfigs(savedId);
      if (savedId === undefined) {
        // The create response carried no id, so look the new config up by name
        const match = this.configs.find((c) => c.name === payload.name);
        if (match) this.selectedId = match.id;
      }
    } catch (error) {
      console.error("Failed to save preservation go config:", error);
      // Error modal is already shown by the API client
    } finally {
      this.saveInProgress = false;
    }
  }

  deleteConfig(config) {
    if (isDefaultConfigId(config.id)) {
      Curate.ui.modals
        .curatePopup({
          title: "Cannot Delete Default Config",
          message:
            "Cannot delete the default config. This is a system configuration that must be preserved.",
          type: "error",
        })
        .fire();
      return;
    }

    Curate.ui.modals
      .curatePopup(
        {
          title: "Confirm Deletion",
          message:
            "Deleting a config is permanent and cannot be reverted, do you wish to continue?",
          type: "warning",
          buttonType: "okCancel",
        },
        {
          onOk: async () => {
            try {
              await this.api.deleteConfig(config.id);
              // A later config could be given the same id, so do not leave its pin behind
              this.clearPin(config.id);
              this.selectedId = this.defaultConfig?.id ?? null;
              await this.loadConfigs();
            } catch (error) {
              console.error("Failed to delete preservation go config:", error);
              // Error modal is already shown by the API client
            }
          },
        },
      )
      .fire();
  }

  render() {
    return preservationGoConfigUI(this);
  }
}

customElements.define("preservation-go-config-manager", PreservationGoConfigManager);

export default PreservationGoConfigManager;

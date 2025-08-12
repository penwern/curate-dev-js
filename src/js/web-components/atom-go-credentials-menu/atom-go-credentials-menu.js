import { LitElement } from "lit";
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/divider/divider.js";
import "@material/web/iconbutton/icon-button.js";
import { AtomConfigAPI } from "./api-client.js";
import { styles } from "./styles.js";
import { atomGoConfigUI } from "./ui-component.js";

class AtomGoCredentialsManager extends LitElement {
  static properties = {
    host: { state: true },
    apikey: { state: true },
    loginemail: { state: true },
    loginpassword: { state: true },
    rsynctarget: { state: true },
    rsynccommand: { state: true },
    currentConfig: { state: true },
    isLoading: { state: true },
    saveInProgress: { state: true },
    loadError: { state: true },
  };

  static styles = styles;

  constructor() {
    super();
    this.host = "";
    this.apikey = "";
    this.loginemail = "";
    this.loginpassword = "";
    this.rsynctarget = "";
    this.rsynccommand = "";
    this.currentConfig = null;
    this.isLoading = false;
    this.saveInProgress = false;
    this.loadError = false;

    // Initialize the API client
    this.api = new AtomConfigAPI();

    // Load current config on initialization
    this.loadConfig();
  }

  async loadConfig() {
    this.isLoading = true;
    this.loadError = false;
    try {
      const config = await this.api.getConfigs();
      // The API returns the single config object directly
      this.currentConfig = config;
      
      if (this.currentConfig) {
        this.host = this.currentConfig.host || "";
        this.apikey = this.currentConfig.apikey || "";
        this.loginemail = this.currentConfig.loginemail || "";
        this.loginpassword = this.currentConfig.loginpassword || "";
        this.rsynctarget = this.currentConfig.rsynctarget || "";
        this.rsynccommand = this.currentConfig.rsynccommand || "";
      }
    } catch (error) {
      console.error("Failed to load atom config:", error);
      this.currentConfig = null;
      this.loadError = true;
    } finally {
      this.isLoading = false;
    }
  }

  clearForm() {
    this.host = "";
    this.apikey = "";
    this.loginemail = "";
    this.loginpassword = "";
    this.rsynctarget = "";
    this.rsynccommand = "";
  }

  async saveConfig() {
    if (!this.host || !this.apikey || !this.loginemail || !this.loginpassword || !this.rsynctarget) {
      Curate.ui.modals.curatePopup({
        title: "Missing Required Fields",
        message: "Please fill in all required fields",
        type: "warning"
      }).fire();
      return;
    }

    this.saveInProgress = true;

    try {
      if (window.curateDebug) {
        console.log("Save requested with values:", {
          host: this.host,
          loginemail: this.loginemail
        });
      }

      const config = {
        host: this.host,
        apikey: this.apikey,
        loginemail: this.loginemail,
        loginpassword: this.loginpassword,
        rsynctarget: this.rsynctarget,
        rsynccommand: this.rsynccommand
      };

      if (window.curateDebug) {
        console.log("Saving atom config:", config);
      }

      // Save using API - pass whether we have an existing config
      const hasExisting = this.currentConfig !== null;
      const savedConfig = await this.api.saveConfig(config, hasExisting);
      
      // Update current config with the saved result
      this.currentConfig = savedConfig;
    } catch (error) {
      console.error("Failed to save atom config:", error);
      // Error modal is already shown by the API client
    } finally {
      this.saveInProgress = false;
    }
  }


  get canSave() {
    return (
      this.host &&
      this.apikey &&
      this.loginemail &&
      this.loginpassword &&
      this.rsynctarget &&
      !this.saveInProgress
    );
  }

  get saveButtonText() {
    if (this.saveInProgress) return "Saving...";
    if (!this.host || !this.apikey || !this.loginemail || !this.loginpassword || !this.rsynctarget)
      return "Fill in all required fields";
    return this.currentConfig ? "Update Configuration" : "Save Configuration";
  }

  render() {
    if (window.curateDebug) {
      console.log("Rendering Atom Go Credentials Menu");
    }
    return atomGoConfigUI(this);
  }
}

customElements.define("atom-go-credentials-manager", AtomGoCredentialsManager);

export default AtomGoCredentialsManager;
import { LitElement, html, css } from "lit";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";
import "@material/web/progress/circular-progress.js";

export class WarcViewerModal extends LitElement {
  static properties = {
    fileUrl: { type: String },
    startingUrl: { type: String },
    isLoading: { type: Boolean },
    errorMessage: { type: String },
  };

  static styles = css`
    .warc-viewer {
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--md-sys-color-surface);
    }

    .viewer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface-container);
      flex-shrink: 0;
    }

    .viewer-header h3 {
      margin: 0;
      font-size: 1.125rem;
      color: var(--md-sys-color-on-surface);
      font-weight: 500;
    }

    .viewer-content {
      flex: 1;
      position: relative;
      overflow: hidden;
      min-height: 0; /* Important for flexbox */
    }

    .loading-state {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: var(--md-sys-color-on-surface-variant);
    }

    .loading-state md-circular-progress {
      margin-bottom: 16px;
      --md-circular-progress-size: 48px;
    }

    .error-state {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: var(--md-sys-color-error);
      background: var(--md-sys-color-error-container);
      padding: 24px;
      border-radius: 12px;
      max-width: 400px;
    }

    .error-state h4 {
      margin: 0 0 8px 0;
      color: var(--md-sys-color-on-error-container);
    }

    .error-state p {
      margin: 0;
      color: var(--md-sys-color-on-error-container);
    }

    replay-web-page {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
  `;

  constructor() {
    super();
    this.fileUrl = "";
    this.startingUrl = "";
    this.isLoading = true;
    this.errorMessage = "";
  }

  render() {
    return html`
      <div class="warc-viewer">
        <div class="viewer-header">
          <h3>Web-Archive Viewer</h3>
        </div>

        <div class="viewer-content">
          ${this.errorMessage
            ? html`
                <div class="error-state">
                  <h4>Error Loading Archive</h4>
                  <p>${this.errorMessage}</p>
                </div>
              `
            : this.isLoading
            ? html`
                <div class="loading-state">
                  <md-circular-progress indeterminate></md-circular-progress>
                  <p>Loading archive viewer...</p>
                </div>
              `
            : ""}

          <replay-web-page
            source=${this.fileUrl}
            url=${this.startingUrl}
            embed="default"
            replayBase="/workers/"
            style=${this.isLoading || this.errorMessage
              ? "display: none;"
              : "display: block;"}
          >
          </replay-web-page>
        </div>
      </div>
    `;
  }

  firstUpdated() {
    this.loadReplayWebPage();
  }

  async loadReplayWebPage() {
    console.log("=== Loading ReplayWeb.page ===");
    console.log("File URL:", this.fileUrl);
    console.log("Starting URL:", this.startingUrl);

    if (window.replayWebPageLoaded) {
      console.log("ReplayWeb.page already loaded");
      this.isLoading = false;
      return;
    }

    try {
      // Load the bundled replaywebpage UI from the copied file
      const script = document.createElement("script");
      script.src = "/replaywebpage-ui.js";

      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      console.log("✅ ReplayWeb.page UI loaded");

      try {
        await customElements.whenDefined("replay-web-page");
        console.log("✅ replay-web-page element defined");

        window.replayWebPageLoaded = true;
        this.isLoading = false;
        this.requestUpdate();

        console.log(
          "ReplayWeb.page ready - letting it handle service worker automatically"
        );
      } catch (error) {
        console.error("❌ Element definition failed:", error);
        this.showError("Failed to initialize archive viewer");
      }
    } catch (error) {
      console.error("❌ loadReplayWebPage error:", error);
      this.showError("Error loading archive viewer");
    }
  }

  showError(message) {
    this.isLoading = false;
    this.errorMessage = message;
  }

  handleClose() {
    this.dispatchEvent(new CustomEvent("close"));
  }

  setArchiveInfo(fileUrl, startingUrl = "") {
    this.fileUrl = fileUrl;
    this.startingUrl = startingUrl;
    console.log("Archive info set:", { fileUrl, startingUrl });
  }
}

customElements.define("warc-viewer-modal", WarcViewerModal);

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
          <md-icon-button @click=${this.handleClose}>
            <md-icon>close</md-icon>
          </md-icon-button>
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
            replayBase="./replay/"
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
    console.log("=== ReplayWeb.page Loading Debug ===");
    console.log("File URL:", this.fileUrl);
    console.log("Starting URL:", this.startingUrl);
    console.log("Current location:", window.location.href);

    if (window.replayWebPageLoaded) {
      console.log("ReplayWeb.page already loaded, skipping script load");
      this.isLoading = false;
      return;
    }

    try {
      console.log("Creating script element...");
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/replaywebpage@2.3.12/ui.js";

      script.onload = async () => {
        console.log("✅ ReplayWeb.page script loaded successfully");
        console.log(
          "Available custom elements:",
          Object.keys(window.customElements._registry || {})
        );

        try {
          console.log("Waiting for replay-web-page element definition...");
          await customElements.whenDefined("replay-web-page");
          console.log("✅ replay-web-page element defined");

          // Check if element exists in DOM
          const replayElement =
            this.shadowRoot.querySelector("replay-web-page");
          console.log("Replay element in DOM:", replayElement);

          window.replayWebPageLoaded = true;
          this.isLoading = false;

          // Force update to show the element
          this.requestUpdate();

          // Additional check after render
          setTimeout(() => {
            const replayElementAfter =
              this.shadowRoot.querySelector("replay-web-page");
            console.log("Replay element after render:", replayElementAfter);
            console.log(
              "Element attributes:",
              replayElementAfter?.getAttributeNames()
            );
          }, 1000);
        } catch (error) {
          console.error("❌ Error waiting for custom elements:", error);
          this.showError("Failed to initialize archive viewer");
        }
      };

      script.onerror = (error) => {
        console.error("❌ Error loading ReplayWeb.page script:", error);
        this.showError("Failed to load archive viewer from CDN");
      };

      console.log("Appending script to head...");
      document.head.appendChild(script);
    } catch (error) {
      console.error("❌ Error in loadReplayWebPage:", error);
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

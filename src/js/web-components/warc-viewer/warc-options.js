import { LitElement, html, css } from "lit";
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/button/text-button.js";
import "@material/web/button/filled-button.js";
import { Curate } from "../../core/CurateFunctions/CurateFunctions";

export class WarcOptionsModal extends LitElement {
  static properties = {
    fileUrl: { type: String },
    fileName: { type: String },
    startingUrl: { type: String },
    closeSelf: { type: Function },
  };

  static styles = css`
    .warc-options {
      padding: 24px;
      max-width: 500px;
    }
    .file-info h3 {
      margin: 0 0 8px 0;
      font-size: 1.25rem;
      color: var(--md-sys-color-on-surface);
      font-weight: 500;
    }
    .filename {
      color: var(--md-sys-color-on-surface-variant);
      margin: 0 0 24px 0;
      font-size: 0.875rem;
    }
    .form-field {
      margin-bottom: 24px;
    }
    md-outlined-text-field {
      width: 100%;
    }
    .actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 32px;
    }
    .archive-icon {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding: 8px 12px;
      background: var(--md-sys-color-custom-archive-colorContainer);
      color: var(--md-sys-color-custom-archive-onColorContainer);
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
    }
  `;

  constructor() {
    super();
    this.fileUrl = "";
    this.fileName = "";
    this.startingUrl = "";
  }

  render() {
    return html`
      <div class="warc-options">
        <div class="file-info">
          <h3>Preview</h3>
          <p class="filename">${this.fileName}</p>
        </div>
        <div class="form-field">
          <md-outlined-text-field
            label="Starting URL (optional)"
            type="url"
            .value=${this.startingUrl}
            @input=${this.handleUrlInput}
            supporting-text="For WARC files, entering a specific URL helps with loading"
            placeholder="https://example.com/page"
          >
          </md-outlined-text-field>
        </div>
        <div class="actions">
          <md-filled-button @click=${this.handleOpenViewer}>
            Open Viewer
          </md-filled-button>
        </div>
      </div>
    `;
  }

  handleUrlInput(e) {
    this.startingUrl = e.target.value;
  }

  handleCancel() {
    this.dispatchEvent(new CustomEvent("cancel"));
  }

  handleOpenViewer() {
    console.log("Opening viewer with:", {
      fileUrl: this.fileUrl,
      startingUrl: this.startingUrl,
    });

    // Close the current modal
    this.closeSelf();

    // Create the viewer modal using the callback approach
    const viewerModal = Curate.ui.modals.curatePopup(
      {
        title: "Preview Web-Archive",
      },
      {
        afterLoaded: (container) => {
          // Find the main content container and update it with the web component
          const mainContent = container.querySelector(
            ".config-main-options-container"
          );
          if (mainContent) {
            // Clear existing content
            mainContent.innerHTML = `<script src="https://cdn.jsdelivr.net/npm/replaywebpage@2.3.12/ui.js"></script>
<replay-web-page 
  source="${this.fileUrl}" 
  replayBase="/workers/" 
  embed="default"
  style="width: 800px; height: 600px;">
</replay-web-page>`;

            // Create the warc-viewer-modal web component
            /**const warcViewer = document.createElement("warc-viewer-modal");
            warcViewer.fileUrl = this.fileUrl;
            warcViewer.startingUrl = this.startingUrl;

            // If the viewer component also needs a close method, pass it
            warcViewer.closeSelf = viewerModal.close;

            mainContent.appendChild(warcViewer);**/
          }
        },
      }
    );

    // Fire the viewer modal
    viewerModal.fire();
  }

  setFileInfo(fileUrl, fileName) {
    this.fileUrl = fileUrl;
    this.fileName = fileName;
  }
}

customElements.define("warc-options-modal", WarcOptionsModal);

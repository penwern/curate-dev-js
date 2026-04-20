import { LitElement, html, css } from "lit";
import "@material/web/select/outlined-select.js";
import "@material/web/select/select-option.js";

class WorkspaceFilter extends LitElement {
  static properties = {
    workspaces: { type: Array },
    selected: { type: String },
    loading: { type: Boolean },
    disabled: { type: Boolean },
  };

  static styles = css`
    :host {
      display: inline-block;
    }

    md-outlined-select {
      --md-outlined-select-text-field-outline-color: var(--md-sys-color-outline-variant);
      --md-outlined-select-text-field-focus-outline-color: var(--md-sys-color-primary);
      --md-outlined-select-text-field-container-shape: 8px;
      --md-outlined-select-text-field-container-padding-vertical: 4px;
      --md-outlined-field-top-space: 6px;
      --md-outlined-field-bottom-space: 6px;
      --md-menu-container-color: var(--md-sys-color-surface-variant);
      min-width: 200px;
      font-size: 13px;
    }
  `;

  constructor() {
    super();
    this.workspaces = [];
    this.selected = "";
    this.loading = false;
    this.disabled = false;
  }

  _handleChange(e) {
    this.selected = e.target.value;
    this.dispatchEvent(
      new CustomEvent("workspace-changed", {
        detail: { slug: this.selected },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <md-outlined-select
        label="Workspace"
        .value=${this.selected}
        @change=${this._handleChange}
        ?disabled=${this.loading || this.disabled}
      >
        <md-select-option value="">
          <div slot="headline">All Workspaces</div>
        </md-select-option>
        ${this.workspaces.map(
          (ws) => html`
            <md-select-option value=${ws.Slug ?? ws.UUID ?? ""}>
              <div slot="headline">${ws.Label ?? ws.Slug ?? "Unnamed"}</div>
            </md-select-option>
          `,
        )}
      </md-outlined-select>
    `;
  }
}

customElements.define("workspace-filter", WorkspaceFilter);

import { LitElement, html, css } from 'lit';
import { downloadIcon, chevronDownIcon } from '../../utils/icons.js';
import '../../utils/penwern-spinner.js';

/**
 * A button that opens a dropdown of export format options.
 *
 * @property {Array<{value: string, label: string}>} formats  - Format choices
 * @property {boolean} loading  - Shows spinner and disables button
 * @property {string}  label    - Button text (default: "Export")
 *
 * @fires export-format-selected  - detail: { format: string }
 */
class ExportButton extends LitElement {
  static properties = {
    formats: { type: Array },
    loading: { type: Boolean },
    label: { type: String },
    _open: { state: true },
  };

  static styles = css`
    :host {
      position: relative;
      display: inline-block;
      font-family: "DM Sans", "Roboto", sans-serif;
    }

    .export-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 13px;
      border-radius: 10px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface-variant);
      font-family: inherit;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
      user-select: none;
    }

    .export-btn:hover:not(:disabled) {
      background: var(--md-sys-color-hover-background);
      border-color: var(--md-sys-color-primary);
      color: var(--md-sys-color-primary);
    }

    .export-btn:disabled {
      opacity: 0.5;
      cursor: default;
    }

    .export-btn svg {
      width: 16px !important;
      height: 16px !important;
      fill: currentColor;
      flex-shrink: 0;
    }

    .chevron-wrap svg {
      width: 14px !important;
      height: 14px !important;
      transition: transform 0.15s ease;
    }

    .export-btn.open .chevron-wrap svg {
      transform: rotate(180deg);
    }

    .dropdown {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      min-width: 160px;
      background: var(--md-sys-color-surface);
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      z-index: 200;
      overflow: hidden;
      animation: dropIn 0.12s ease-out;
    }

    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 10px 14px;
      border: none;
      background: transparent;
      font-family: inherit;
      font-size: 13px;
      font-weight: 400;
      color: var(--md-sys-color-on-surface);
      cursor: pointer;
      text-align: left;
      transition: background 0.1s ease;
    }

    .dropdown-item:hover {
      background: var(--md-sys-color-hover-background);
    }

    .dropdown-item + .dropdown-item {
      border-top: 1px solid var(--md-sys-color-outline-variant-50);
    }
  `;

  constructor() {
    super();
    this.formats = [];
    this.loading = false;
    this.label = 'Export';
    this._open = false;
    this._onDocumentClick = this._onDocumentClick.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._onDocumentClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onDocumentClick);
  }

  _onDocumentClick(e) {
    if (!this.contains(e.target)) {
      this._open = false;
    }
  }

  _toggle(e) {
    if (this.loading) return;
    e.stopPropagation();
    this._open = !this._open;
  }

  _select(format) {
    this._open = false;
    this.dispatchEvent(new CustomEvent('export-format-selected', {
      detail: { format },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    return html`
      <button
        class="export-btn ${this._open ? 'open' : ''}"
        ?disabled=${this.loading}
        @click=${this._toggle}
        title=${this.loading ? 'Exporting…' : 'Export data'}
      >
        ${this.loading
          ? html`<penwern-spinner size="16"></penwern-spinner>`
          : downloadIcon}
        ${this.label}
        <span class="chevron-wrap">${chevronDownIcon}</span>
      </button>
      ${this._open ? html`
        <div class="dropdown">
          ${this.formats.map((f) => html`
            <button class="dropdown-item" @click=${() => this._select(f.value)}>
              ${f.label}
            </button>
          `)}
        </div>
      ` : ''}
    `;
  }
}

customElements.define('export-button', ExportButton);

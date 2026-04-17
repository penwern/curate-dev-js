import { LitElement, html, css } from "lit";
import "@material/web/textfield/outlined-text-field.js";

class DateRangeFilter extends LitElement {
  static properties = {
    fromDate: { type: String },
    toDate: { type: String },
  };

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .field-wrap {
      position: relative;
    }

    md-outlined-text-field {
      --md-outlined-text-field-container-shape: 8px;
      --md-outlined-text-field-outline-color: var(--md-sys-color-outline-variant);
      --md-outlined-text-field-focus-outline-color: var(--md-sys-color-primary);
      width: 150px;
      font-size: 13px;
    }

    .separator {
      color: var(--md-sys-color-outline);
      font-size: 13px;
      padding: 0 2px;
    }
  `;

  constructor() {
    super();
    this.fromDate = "";
    this.toDate = "";
  }

  _handleFrom(e) {
    this.fromDate = e.target.value;
    this._emit();
  }

  _handleTo(e) {
    this.toDate = e.target.value;
    this._emit();
  }

  _emit() {
    const from = this.fromDate ? Math.floor(new Date(this.fromDate).getTime() / 1000) : null;
    const to = this.toDate ? Math.floor(new Date(this.toDate + "T23:59:59").getTime() / 1000) : null;
    this.dispatchEvent(
      new CustomEvent("date-range-changed", {
        detail: { from, to },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="field-wrap">
        <md-outlined-text-field
          type="date"
          label="From"
          .value=${this.fromDate}
          @change=${this._handleFrom}
        ></md-outlined-text-field>
      </div>
      <span class="separator">—</span>
      <div class="field-wrap">
        <md-outlined-text-field
          type="date"
          label="To"
          .value=${this.toDate}
          @change=${this._handleTo}
        ></md-outlined-text-field>
      </div>
    `;
  }
}

customElements.define("date-range-filter", DateRangeFilter);

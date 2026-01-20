import { LitElement, html, css } from "lit";
import { searchIcon } from "../../utils/icons.js";

/**
 * Empty state display component.
 * Shows a message when there's no content to display.
 */
class AsEmptyState extends LitElement {
  static properties = {
    title: { type: String },
    message: { type: String },
    icon: { type: Object },
  };

  static styles = css`
    :host {
      display: block;
    }

    .empty-state {
      display: grid;
      place-items: center;
      height: 100%;
      text-align: center;
      color: var(--md-sys-color-on-surface-variant);
      padding: 24px;
    }

    .empty-state md-icon,
    .empty-state .icon-container {
      --md-icon-size: 40px;
      margin-bottom: 12px;
      opacity: 0.7;
    }

    .empty-state .icon-container svg {
      width: 40px;
      height: 40px;
      fill: currentColor;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
    }

    .empty-state p strong {
      display: block;
      margin-bottom: 4px;
    }
  `;

  constructor() {
    super();
    this.title = "";
    this.message = "";
    this.icon = null;
  }

  render() {
    const iconContent = this.icon || searchIcon;

    return html`
      <div class="empty-state">
        <div class="icon-container">${iconContent}</div>
        <p>
          <strong>${this.title}</strong>
          ${this.message}
        </p>
      </div>
    `;
  }
}

customElements.define("as-empty-state", AsEmptyState);

export { AsEmptyState };

import { LitElement, html, css } from "lit";

class StatCard extends LitElement {
  static properties = {
    label: { type: String },
    value: { type: String },
    subtitle: { type: String },
    trend: { type: String },
    trendDirection: { type: String },
    loading: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
    }

    .card {
      background: var(--md-sys-color-surface);
      border: 1px solid var(--md-sys-color-outline-variant-50);
      border-radius: var(--md-sys-color-card-border-radius);
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: box-shadow 0.2s ease, transform 0.15s ease;
      position: relative;
      overflow: hidden;
    }

    .card:hover {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }

    .card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--stat-accent, var(--md-sys-color-primary));
      opacity: 0.8;
    }

    .label {
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--md-sys-color-on-surface-variant);
    }

    .value-row {
      display: flex;
      align-items: baseline;
      gap: 10px;
    }

    .value {
      font-size: 32px;
      font-weight: 300;
      color: var(--md-sys-color-on-surface);
      line-height: 1.1;
      letter-spacing: -0.5px;
    }

    .trend {
      font-size: 12px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }

    .trend.up {
      color: var(--md-sys-color-custom-xls-color);
      background: var(--md-sys-color-custom-xls-colorContainer);
    }

    .trend.down {
      color: var(--md-sys-color-error);
      background: var(--md-sys-color-error-container);
    }

    .trend.neutral {
      color: var(--md-sys-color-on-surface-variant);
      background: var(--md-sys-color-surface-variant);
    }

    .subtitle {
      font-size: 13px;
      color: var(--md-sys-color-outline);
      margin-top: 2px;
    }

    .loading-shimmer {
      background: linear-gradient(
        90deg,
        var(--md-sys-color-surface-variant) 25%,
        var(--md-sys-color-surface) 50%,
        var(--md-sys-color-surface-variant) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    .loading-value {
      width: 80px;
      height: 36px;
    }

    .loading-subtitle {
      width: 120px;
      height: 14px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .icon-slot {
      position: absolute;
      top: 16px;
      right: 16px;
      color: var(--stat-accent, var(--md-sys-color-primary));
      opacity: 0.15;
    }

    .icon-slot svg {
      width: 40px;
      height: 40px;
    }
  `;

  constructor() {
    super();
    this.label = "";
    this.value = "";
    this.subtitle = "";
    this.trend = "";
    this.trendDirection = "neutral";
    this.loading = false;
  }

  render() {
    return html`
      <div class="card">
        <div class="icon-slot">
          <slot name="icon"></slot>
        </div>
        <div class="label">${this.label}</div>
        ${this.loading
          ? html`
              <div class="loading-shimmer loading-value"></div>
              <div class="loading-shimmer loading-subtitle"></div>
            `
          : html`
              <div class="value-row">
                <span class="value">${this.value}</span>
                ${this.trend
                  ? html`<span class="trend ${this.trendDirection}">${this.trend}</span>`
                  : ""}
              </div>
              ${this.subtitle ? html`<div class="subtitle">${this.subtitle}</div>` : ""}
            `}
      </div>
    `;
  }
}

customElements.define("stat-card", StatCard);

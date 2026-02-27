import { LitElement, html, css } from "lit";
import Chart from "chart.js/auto";
import "../../utils/penwern-spinner.js";

class ChartCard extends LitElement {
  static properties = {
    heading: { type: String },
    type: { type: String },
    data: { type: Object },
    options: { type: Object },
    loading: { type: Boolean },
    height: { type: Number },
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
      gap: 12px;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .heading {
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      letter-spacing: 0.1px;
    }

    .chart-container {
      position: relative;
      width: 100%;
    }

    canvas {
      width: 100% !important;
    }

    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--md-sys-color-outline);
      font-size: 13px;
      font-style: italic;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .actions ::slotted(*) {
      font-size: 12px;
    }
  `;

  constructor() {
    super();
    this.heading = "";
    this.type = "bar";
    this.data = null;
    this.options = {};
    this.loading = false;
    this.height = 280;
    this._chart = null;
  }

  _defaultOptions() {
    const style = getComputedStyle(document.documentElement);
    const gridColor = "rgba(192, 199, 205, 0.3)";
    const textColor = style.getPropertyValue("--md-sys-color-on-surface-variant").trim() || "#41484d";

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400, easing: "easeOutQuart" },
      plugins: {
        legend: {
          display: this.type === "doughnut" || this.type === "pie",
          position: "bottom",
          labels: {
            color: textColor,
            font: { family: "Roboto", size: 12 },
            padding: 16,
            boxWidth: 12,
            boxHeight: 12,
          },
        },
        tooltip: {
          backgroundColor: "rgba(25, 28, 30, 0.92)",
          titleFont: { family: "Roboto", size: 13, weight: "500" },
          bodyFont: { family: "Roboto", size: 12 },
          padding: 10,
          cornerRadius: 8,
          displayColors: true,
          boxPadding: 4,
        },
      },
      scales: this.type === "doughnut" || this.type === "pie" ? {} : {
        x: {
          grid: { color: gridColor, drawBorder: false },
          ticks: { color: textColor, font: { family: "Roboto", size: 11 } },
        },
        y: {
          grid: { color: gridColor, drawBorder: false },
          ticks: { color: textColor, font: { family: "Roboto", size: 11 } },
          beginAtZero: true,
        },
      },
    };
  }

  updated(changedProps) {
    if (changedProps.has("data") || changedProps.has("type") || changedProps.has("options") || changedProps.has("loading")) {
      this._updateChart();
    }
  }

  _updateChart() {
    if (!this.data) return;
    const canvas = this.shadowRoot.querySelector("canvas");
    if (!canvas) return;

    if (this._chart && this._chart.canvas !== canvas) {
      this._chart.destroy();
      this._chart = null;
    }

    const mergedOptions = this._deepMerge(this._defaultOptions(), this.options || {});

    if (this._chart) {
      this._chart.data = this.data;
      this._chart.options = mergedOptions;
      this._chart.update("none");
    } else {
      this._chart = new Chart(canvas.getContext("2d"), {
        type: this.type,
        data: this.data,
        options: mergedOptions,
      });
    }
  }

  _deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }
  }

  render() {
    const isEmpty = !this.loading && (!this.data || !this.data.datasets?.length);

    return html`
      <div class="card">
        <div class="header">
          <span class="heading">${this.heading}</span>
          <div class="actions">
            <slot name="actions"></slot>
          </div>
        </div>
        <div class="chart-container" style="height:${this.height}px">
          ${this.loading
            ? html`<div class="loading-container" style="height:${this.height}px"><penwern-spinner size="56"></penwern-spinner></div>`
            : isEmpty
              ? html`<div class="empty-state" style="height:${this.height}px">No data available</div>`
              : html`<canvas></canvas>`}
        </div>
      </div>
    `;
  }
}

customElements.define("chart-card", ChartCard);

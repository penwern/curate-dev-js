class PenwernSpinner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["size", "color", "variant", "mode", "value"];
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === "value" && this.mode === "determinate") {
      this._updateProgress();
    } else {
      this._render();
    }
  }

  get size() {
    return this.getAttribute("size") || null;
  }

  set size(val) {
    if (val != null) this.setAttribute("size", String(val));
    else this.removeAttribute("size");
  }

  get color() {
    return this.getAttribute("color") || null;
  }

  set color(val) {
    if (val != null) this.setAttribute("color", String(val));
    else this.removeAttribute("color");
  }

  get variant() {
    return this.getAttribute("variant") || "full";
  }

  set variant(val) {
    if (val != null) this.setAttribute("variant", String(val));
    else this.removeAttribute("variant");
  }

  get mode() {
    return this.getAttribute("mode") || "indeterminate";
  }

  set mode(val) {
    if (val != null) this.setAttribute("mode", String(val));
    else this.removeAttribute("mode");
  }

  get value() {
    const val = parseFloat(this.getAttribute("value")) || 0;
    return Math.max(0, Math.min(100, val));
  }

  set value(val) {
    const clamped = Math.max(0, Math.min(100, parseFloat(val) || 0));
    this.setAttribute("value", String(clamped));
  }

  _updateProgress() {
    const fillPath = this.shadowRoot && this.shadowRoot.querySelector(".fill-centerline");
    if (!fillPath) return;
    const totalLength = 470;
    const progress = this.value / 100;
    const dashoffset = totalLength * (1 - progress);
    fillPath.style.strokeDashoffset = String(dashoffset);

    const svg = this.shadowRoot.querySelector("svg");
    if (svg) {
      svg.setAttribute("aria-valuenow", String(this.value));
    }
  }

  _render() {
    const size = Number(this.size) || 100;
    const color = this.color || "#e4fbf2";
    const variant = this.variant;
    const mode = this.mode;
    const value = this.value;

    const isDeterminate = mode === "determinate";
    const isSnake = variant === "snake" && !isDeterminate;

    const totalLength = 470;
    let dasharray;
    let dashoffsetStart;
    let duration;
    let easing;
    let fillAnimation;

    if (isDeterminate) {
      dasharray = `${totalLength} ${totalLength}`;
      const progress = value / 100;
      dashoffsetStart = totalLength * (1 - progress);
      fillAnimation = "none";
    } else {
      dasharray = isSnake ? "150 320" : "470 470";
      dashoffsetStart = isSnake ? "470" : "940";
      duration = isSnake ? "1.5s" : "2.4s";
      easing = isSnake
        ? "cubic-bezier(0.05, 0, 1, 1)"
        : "cubic-bezier(0.4, 0, 0.6, 1)";
      fillAnimation = `fillIn ${duration} ${easing} infinite`;
    }

    const ariaAttrs = isDeterminate
      ? `role="progressbar" aria-label="Loading" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100"`
        : `role="progressbar" aria-label="Loading"`;

    const spinnerAnim = isDeterminate
      ? ""
      : "animation: spinBouncePop 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;";

    const mainShapeAnim = isDeterminate
      ? ""
      : `animation:
            drawInOut 3s ease-in-out infinite,
            subtleGlow 3s ease-in-out infinite;`;

    const dotShapeAnim = isDeterminate
      ? ""
      : `animation:
            drawInOutDot 3s ease-in-out infinite,
            subtleGlow 3s ease-in-out infinite;`;

    const determinateExtra =
      isDeterminate &&
      `
      :host([value="100"]) .spinner {
        animation: completeGlow 0.6s ease-out forwards;
      }

      @keyframes completeGlow {
        0% { filter: drop-shadow(0 0 0px rgba(74, 222, 128, 0)); }
        50% { filter: drop-shadow(0 0 8px rgba(74, 222, 128, 0.5)) drop-shadow(0 0 16px rgba(34, 211, 238, 0.3)); }
        100% { filter: drop-shadow(0 0 4px rgba(74, 222, 128, 0.25)); }
      }
    `;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          line-height: 0;
          --penwern-spinner-size: ${size}px;
          --penwern-spinner-color: ${color};
        }

        .spinner {
          width: var(--penwern-spinner-size);
          height: calc(var(--penwern-spinner-size) * 0.8);
          transform-origin: center;
          ${spinnerAnim}
        }

        .main-shape {
          fill: none;
          stroke: #047857; /* darker green outline */
          opacity: 0.5;
          stroke-width: 3;
          stroke-dasharray: 900;
          stroke-dashoffset: ${isDeterminate ? "0" : "900"};
          ${mainShapeAnim}
        }

        .fill-centerline {
          fill: none;
          stroke: url(#grad-${this._uid});
          stroke-width: 60;
          stroke-linecap: butt;
          stroke-dasharray: ${dasharray};
          stroke-dashoffset: ${dashoffsetStart};
          ${isDeterminate ? "transition: stroke-dashoffset 0.3s ease-out;" : ""}
          animation: ${fillAnimation};
        }

        .dot-shape {
          fill: none;
          stroke: #047857; /* darker green square */
          opacity: 0.5;
          stroke-width: 3;
          stroke-dasharray: 200;
          stroke-dashoffset: ${isDeterminate ? "0" : "200"};
          ${dotShapeAnim}
        }

        ${determinateExtra || ""}

        @keyframes drawInOut {
          0% { stroke-dashoffset: 900; }
          40% { stroke-dashoffset: 0; }
          60% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -900; }
        }

        @keyframes drawInOutDot {
          0% { stroke-dashoffset: 200; }
          40% { stroke-dashoffset: 0; }
          60% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -200; }
        }

        @keyframes fillIn {
          0% { stroke-dashoffset: ${dashoffsetStart}; }
          100% { stroke-dashoffset: 0; }
        }

        @keyframes spinBouncePop {
          0%, 50% { transform: scale(1) rotate(0deg); }
          60% { transform: scale(1.04) rotate(3deg); }
          68% { transform: scale(0.99) rotate(-2deg); }
          76% { transform: scale(1.01) rotate(1deg); }
          85%, 100% { transform: scale(1) rotate(0deg); }
        }

        @keyframes subtleGlow {
          0%, 45% { filter: drop-shadow(0 0 0px rgba(74, 222, 128, 0)); }
          65% { filter: drop-shadow(0 0 3px rgba(74, 222, 128, 0.25)) drop-shadow(0 0 6px rgba(34, 211, 238, 0.15)); }
          85%, 100% { filter: drop-shadow(0 0 0px rgba(74, 222, 128, 0)); }
        }
      </style>

      <svg
        class="spinner"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-15 -15 240 200"
        ${ariaAttrs}
      >
        <defs>
          <linearGradient id="grad-${this._uid}" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="var(--penwern-spinner-color)"/>
            <stop offset="40%" stop-color="var(--penwern-spinner-color)"/>
          </linearGradient>
          <clipPath id="clip-${this._uid}">
            <path d="M 0.952 94.7214 C 0.961762 93.0698 0.952397 91.4046 0.952397 89.7268 L 0.952397 80.9294 C 0.952397 36.6223 36.6223 0.952397 80.9294 0.952397 L 130.737 0.952367 C 175.044 0.952367 210.714 36.6222 210.714 80.9294 L 210.714 89.7268 C 210.714 134.034 175.044 169.704 130.737 169.704 C 113.522 169.704 93.6613 169.729 76.4468 169.687 C 76.4953 153.086 76.4258 136.483 76.4537 119.882 L 127.489 119.882 C 147.093 119.882 162.876 104.471 162.876 85.3281 C 162.876 66.1856 147.093 50.7747 127.489 50.7747 L 84.1778 50.7747 C 64.5732 50.7747 49.5 66.1856 49.5 85.3281 C 49.5 88.5866 49.4934 91.6474 49.5 94.7214 L 0.952 94.7214 Z"/>
            <path d="M 0.73293728 119.67944 H 51.151265 v 50.28277 H 0.73293728 Z"/>
          </clipPath>
        </defs>
        <g>
          <g clip-path="url(#clip-${this._uid})">
            <path
              class="fill-centerline"
              d="m 25.088951,170.42432 c 0,0 0.146462,-70.989958 0.146462,-85.078427 0,-32.956319 27.563565,-59.487941 61.801715,-59.487941 v -3e-5 h 37.980142 c 34.23815,0 61.80171,26.531622 61.80171,59.487941 0,32.956317 -27.56356,59.487947 -61.80171,59.487947 H 87.037128 c -3.054099,0 -6.660351,0.001 -10.572555,0.003"
            />
          </g>
          <path
            class="main-shape"
            d="M 0.952 94.7214 C 0.961762 93.0698 0.952397 91.4046 0.952397 89.7268 L 0.952397 80.9294 C 0.952397 36.6223 36.6223 0.952397 80.9294 0.952397 L 130.737 0.952367 C 175.044 0.952367 210.714 36.6222 210.714 80.9294 L 210.714 89.7268 C 210.714 134.034 175.044 169.704 130.737 169.704 C 113.522 169.704 93.6613 169.729 76.4468 169.687 C 76.4953 153.086 76.4258 136.483 76.4537 119.882 L 127.489 119.882 C 147.093 119.882 162.876 104.471 162.876 85.3281 C 162.876 66.1856 147.093 50.7747 127.489 50.7747 L 84.1778 50.7747 C 64.5732 50.7747 49.5 66.1856 49.5 85.3281 C 49.5 88.5866 49.4934 91.6474 49.5 94.7214 L 0.952 94.7214 Z"
          />
          <path
            class="dot-shape"
            d="M 0.73293728 119.67944 H 51.151265 v 50.28277 H 0.73293728 Z"
          />
        </g>
      </svg>
    `;

    if (isDeterminate) {
      this._updateProgress();
    }
  }

  get _uid() {
    if (!this.__uid) {
      this.__uid = Math.random().toString(36).substr(2, 9);
    }
    return this.__uid;
  }
}

customElements.define("penwern-spinner", PenwernSpinner);

import { LitElement, html, css } from "lit";

/**
 * Read-only AtoM configuration view for deployment-managed deployments.
 * Shows the AtoM endpoint and a masked API key. Never renders SSH/rsync
 * credentials, the password, or any editable input. Data comes from the
 * pre-masked GET /api/v1/atom-configs/public endpoint, so the real key
 * never reaches the browser.
 */
class AtomConfigReadonly extends LitElement {
  static properties = {
    host: { state: true },
    apiKeyLast4: { state: true },
    configured: { state: true },
    isLoading: { state: true },
    loadError: { state: true },
  };

  static styles = css`
    :host {
      display: block;
      max-width: 32em;
      min-width: 24em;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: #333;
    }
    .panel {
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 8px;
      border-left: 4px solid #ff6600;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 1em;
      font-size: 15px;
    }
    .label {
      font-weight: 500;
    }
    .value {
      color: #555;
      font-family: monospace;
      word-break: break-all;
      text-align: right;
    }
    .note {
      margin-top: 8px;
      font-size: 13px;
      color: #777;
    }
    .status {
      padding: 16px;
      font-size: 14px;
      color: #777;
      text-align: center;
    }
  `;

  constructor() {
    super();
    this.host = "";
    this.apiKeyLast4 = "";
    this.configured = false;
    this.isLoading = true;
    this.loadError = false;
    this.loadConfig();
  }

  async loadConfig() {
    this.isLoading = true;
    this.loadError = false;
    try {
      const token = await PydioApi._PydioRestClient.getOrUpdateJwt();
      const response = await fetch(`${window.location.origin}/api/v1/atom-configs/public`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      this.host = data.host || "";
      this.apiKeyLast4 = data.apiKeyLast4 || "";
      this.configured = Boolean(data.configured);
    } catch (error) {
      console.error("Failed to load read-only atom config:", error);
      this.loadError = true;
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    if (this.isLoading) {
      return html`<div class="status">Loading AtoM configuration…</div>`;
    }
    if (this.loadError) {
      return html`<div class="status">
        Unable to load AtoM configuration. Please contact support.
      </div>`;
    }
    if (!this.configured) {
      return html`<div class="status">
        AtoM is not yet configured for this site. Penwern manages this configuration — please
        contact support.
      </div>`;
    }
    const maskedKey = this.apiKeyLast4 ? `${"•".repeat(8)}${this.apiKeyLast4}` : "Not set";
    return html`
      <div class="panel">
        <div class="row">
          <span class="label">AtoM endpoint</span>
          <span class="value">${this.host}</span>
        </div>
        <div class="row">
          <span class="label">API key</span>
          <span class="value">${maskedKey}</span>
        </div>
        <div class="note">
          AtoM is configured and managed by Penwern. To change these settings, please contact
          support.
        </div>
      </div>
    `;
  }
}

customElements.define("atom-config-readonly", AtomConfigReadonly);

export default AtomConfigReadonly;

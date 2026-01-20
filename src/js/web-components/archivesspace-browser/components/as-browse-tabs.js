import { LitElement, html, css } from "lit";
import "@material/web/tabs/tabs.js";
import "@material/web/tabs/primary-tab.js";

/**
 * Browse tabs component for switching between repository, collections, and search views.
 */
class AsBrowseTabs extends LitElement {
  static properties = {
    activeTab: { type: String },
  };

  static styles = css`
    :host {
      display: block;
    }

    .browse-tabs {
      padding: 0 var(--panel-padding, 16px);
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface);
    }

    md-tabs {
      --md-primary-tab-container-height: 48px;
    }

    @media (max-width: 500px) {
      .browse-tabs {
        padding: 0 8px;
      }
    }
  `;

  constructor() {
    super();
    this.activeTab = "repository";
  }

  render() {
    return html`
      <div class="browse-tabs">
        <md-tabs @change=${this._handleTabChange}>
          <md-primary-tab ?active=${this.activeTab === "repository"}>
            Repository
          </md-primary-tab>
          <md-primary-tab ?active=${this.activeTab === "collections"}>
            Collections
          </md-primary-tab>
          <md-primary-tab ?active=${this.activeTab === "search"}>
            Search
          </md-primary-tab>
        </md-tabs>
      </div>
    `;
  }

  _handleTabChange(e) {
    const tabs = ["repository", "collections", "search"];
    const newTab = tabs[e.target.activeTabIndex] || "repository";
    this.dispatchEvent(
      new CustomEvent("tab-change", {
        detail: { tab: newTab },
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("as-browse-tabs", AsBrowseTabs);

export { AsBrowseTabs };

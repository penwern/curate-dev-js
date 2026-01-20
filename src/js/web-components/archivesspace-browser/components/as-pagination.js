import { LitElement, html, css, nothing } from "lit";
import { map } from "lit/directives/map.js";
import "@material/web/button/text-button.js";
import "@material/web/icon/icon.js";
import { chevronLeftIcon, chevronRightIcon } from "../../utils/icons.js";

/**
 * Pagination component for navigating through paged content.
 */
class AsPagination extends LitElement {
  static properties = {
    currentPage: { type: Number },
    totalPages: { type: Number },
    totalItems: { type: Number },
    itemsPerPage: { type: Number },
  };

  static styles = css`
    :host {
      display: block;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
      margin-top: 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant);
    }

    .pagination-info {
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant);
      margin: 0 8px;
    }

    .pagination md-text-button {
      --md-text-button-container-height: 36px;
    }

    .pagination-pages {
      display: flex;
      gap: 4px;
    }

    .page-button {
      min-width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .page-button:hover {
      background: var(--md-sys-color-surface-1);
      border-color: var(--md-sys-color-primary);
    }

    .page-button.active {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border-color: var(--md-sys-color-primary);
    }

    .page-button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .ellipsis {
      padding: 0 4px;
      color: var(--md-sys-color-on-surface-variant);
    }
  `;

  constructor() {
    super();
    this.currentPage = 1;
    this.totalPages = 1;
    this.totalItems = 0;
    this.itemsPerPage = 12;
  }

  render() {
    if (this.totalPages <= 1) return nothing;

    const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);

    // Calculate page range to show
    const maxPagesToShow = 7;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return html`
      <div class="pagination">
        <md-text-button
          ?disabled=${this.currentPage === 1}
          @click=${() => this._handlePageChange(this.currentPage - 1)}
        >
          <md-icon slot="icon">${chevronLeftIcon}</md-icon>
          Previous
        </md-text-button>

        <div class="pagination-pages">
          ${startPage > 1
            ? html`
                <button class="page-button" @click=${() => this._handlePageChange(1)}>1</button>
                ${startPage > 2 ? html`<span class="ellipsis">...</span>` : nothing}
              `
            : nothing}

          ${map(
            pages,
            (page) => html`
              <button
                class="page-button ${page === this.currentPage ? "active" : ""}"
                @click=${() => this._handlePageChange(page)}
              >
                ${page}
              </button>
            `
          )}

          ${endPage < this.totalPages
            ? html`
                ${endPage < this.totalPages - 1 ? html`<span class="ellipsis">...</span>` : nothing}
                <button class="page-button" @click=${() => this._handlePageChange(this.totalPages)}>
                  ${this.totalPages}
                </button>
              `
            : nothing}
        </div>

        <span class="pagination-info">${startItem}-${endItem} of ${this.totalItems}</span>

        <md-text-button
          ?disabled=${this.currentPage === this.totalPages}
          @click=${() => this._handlePageChange(this.currentPage + 1)}
        >
          Next
          <md-icon slot="icon">${chevronRightIcon}</md-icon>
        </md-text-button>
      </div>
    `;
  }

  _handlePageChange(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.dispatchEvent(
      new CustomEvent("page-change", {
        detail: { page },
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("as-pagination", AsPagination);

export { AsPagination };

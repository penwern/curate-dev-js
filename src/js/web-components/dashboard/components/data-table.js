import { LitElement, html, css } from "lit";
import "@material/web/iconbutton/icon-button.js";
import { chevronLeftIcon, chevronRightIcon } from "../../utils/icons.js";

class DataTable extends LitElement {
  static properties = {
    columns: { type: Array },
    rows: { type: Array },
    pageSize: { type: Number },
    page: { type: Number },
    totalRows: { type: Number },
    serverPaginated: { type: Boolean },
    sortable: { type: Boolean },
    sortField: { type: String },
    sortDesc: { type: Boolean },
    loading: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
    }

    .table-card {
      background: var(--md-sys-color-surface);
      border: 1px solid var(--md-sys-color-outline-variant-50);
      border-radius: var(--md-sys-color-card-border-radius);
      overflow: hidden;
    }

    .table-scroll {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    thead {
      background: var(--md-sys-color-surface-variant);
    }

    th {
      text-align: left;
      padding: 10px 16px;
      font-weight: 500;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--md-sys-color-on-surface-variant);
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
      position: relative;
    }

    th:hover {
      background: var(--md-sys-color-hover-background);
    }

    th .sort-indicator {
      display: inline-block;
      width: 16px;
      height: 16px;
      vertical-align: middle;
      margin-left: 4px;
      opacity: 0.6;
    }

    th .sort-indicator.active {
      opacity: 1;
      color: var(--md-sys-color-primary);
    }

    td {
      padding: 10px 16px;
      color: var(--md-sys-color-on-surface);
      border-top: 1px solid var(--md-sys-color-outline-variant-50);
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    tr:hover td {
      background: var(--md-sys-color-hover-background);
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant-50);
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
    }

    .page-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    md-icon-button {
      --md-icon-button-icon-size: 18px;
    }

    .empty-row td {
      text-align: center;
      padding: 32px 16px;
      color: var(--md-sys-color-outline);
      font-style: italic;
    }

    .empty-row:hover td {
      background: none;
    }

    .loading-row td {
      height: 40px;
      background: linear-gradient(
        90deg,
        var(--md-sys-color-surface-variant) 25%,
        var(--md-sys-color-surface) 50%,
        var(--md-sys-color-surface-variant) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;

  constructor() {
    super();
    this.columns = [];
    this.rows = [];
    this.pageSize = 25;
    this.page = 0;
    this.totalRows = 0;
    this.serverPaginated = false;
    this.sortable = true;
    this.sortField = "";
    this.sortDesc = false;
    this.loading = false;
  }

  get _totalPages() {
    const total = this.totalRows || this.rows.length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  get _displayRows() {
    if (this.serverPaginated || this.totalRows > 0) return this.rows;
    const start = this.page * this.pageSize;
    return this.rows.slice(start, start + this.pageSize);
  }

  _handleSort(field) {
    if (this.sortField === field) {
      this.sortDesc = !this.sortDesc;
    } else {
      this.sortField = field;
      this.sortDesc = false;
    }
    this.dispatchEvent(
      new CustomEvent("sort-changed", {
        detail: { field: this.sortField, desc: this.sortDesc },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _prevPage() {
    if (this.page > 0) {
      this.page--;
      this._emitPage();
    }
  }

  _nextPage() {
    if (this.serverPaginated || this.page < this._totalPages - 1) {
      this.page++;
      this._emitPage();
    }
  }

  _emitPage() {
    this.dispatchEvent(
      new CustomEvent("page-changed", {
        detail: { page: this.page, offset: this.page * this.pageSize },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    const startRow = this.page * this.pageSize + 1;
    const endRow = Math.min(startRow + this.pageSize - 1, this.totalRows || this.rows.length);
    const total = this.totalRows || this.rows.length;

    return html`
      <div class="table-card">
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                ${this.columns.map(
                  (col) => html`
                    <th @click=${this.sortable ? () => this._handleSort(col.field) : null}
                        style=${this.sortable ? "" : "cursor: default"}>
                      ${col.label}
                      ${this.sortable
                        ? this.sortField === col.field
                          ? html`<span class="sort-indicator active">${this.sortDesc ? "▼" : "▲"}</span>`
                          : html`<span class="sort-indicator"></span>`
                        : ""}
                    </th>
                  `,
                )}
              </tr>
            </thead>
            <tbody>
              ${this.loading
                ? Array.from({ length: 5 }).map(
                    () => html`
                      <tr class="loading-row">
                        ${this.columns.map(() => html`<td></td>`)}
                      </tr>
                    `,
                  )
                : this._displayRows.length === 0
                  ? html`
                      <tr class="empty-row">
                        <td colspan=${this.columns.length}>No data to display</td>
                      </tr>
                    `
                  : this._displayRows.map(
                      (row) => html`
                        <tr>
                          ${this.columns.map(
                            (col) => html`
                              <td title=${col.format ? col.format(row[col.field], row) : row[col.field] ?? ""}>
                                ${col.format ? col.format(row[col.field], row) : row[col.field] ?? ""}
                              </td>
                            `,
                          )}
                        </tr>
                      `,
                    )}
            </tbody>
          </table>
        </div>
        ${this.serverPaginated
          ? html`
              <div class="footer">
                <span>Page ${this.page + 1}</span>
                <div class="page-info">
                  <md-icon-button ?disabled=${this.page === 0} @click=${this._prevPage}>
                    ${chevronLeftIcon}
                  </md-icon-button>
                  <md-icon-button ?disabled=${this.rows.length < this.pageSize} @click=${this._nextPage}>
                    ${chevronRightIcon}
                  </md-icon-button>
                </div>
              </div>
            `
          : total > 0
          ? html`
              <div class="footer">
                <span>${startRow}–${endRow} of ${total.toLocaleString()}</span>
                <div class="page-info">
                  <md-icon-button ?disabled=${this.page === 0} @click=${this._prevPage}>
                    ${chevronLeftIcon}
                  </md-icon-button>
                  <span>Page ${this.page + 1} of ${this._totalPages}</span>
                  <md-icon-button ?disabled=${this.page >= this._totalPages - 1} @click=${this._nextPage}>
                    ${chevronRightIcon}
                  </md-icon-button>
                </div>
              </div>
            `
          : ""}
      </div>
    `;
  }
}

customElements.define("data-table", DataTable);

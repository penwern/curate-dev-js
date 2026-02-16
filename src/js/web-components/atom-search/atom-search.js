import { LitElement, html, nothing } from "lit";
import { map } from "lit/directives/map.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/select/outlined-select.js";
import "@material/web/select/select-option.js";
import "@material/web/iconbutton/icon-button.js";
import {
  mdiMagnify,
  mdiPlus,
  mdiClose,
  mdiHelpCircleOutline,
  mdiAlertCircleOutline,
  mdiLinkVariant,
  mdiChevronLeft,
  mdiChevronRight,
  mdiChevronDown,
  mdiDatabaseImport,
  mdiFileDocumentOutline,
} from "@mdi/js";
import { icon } from "../utils/icons.js";
import { AtomSearchAPI } from "./api-client.js";
import { styles } from "./styles.js";

const SEARCH_FIELDS = [
  { value: "", label: "Any field" },
  { value: "title", label: "Title" },
  { value: "archivalHistory", label: "Archival history" },
  { value: "scopeAndContent", label: "Scope and content" },
  { value: "extentAndMedium", label: "Extent and medium" },
  { value: "subject", label: "Subject access points" },
  { value: "name", label: "Name access points" },
  { value: "place", label: "Place access points" },
  { value: "genre", label: "Genre access points" },
  { value: "identifier", label: "Identifier" },
  { value: "referenceCode", label: "Reference code" },
  { value: "digitalObjectTranscript", label: "Digital object text" },
  { value: "creator", label: "Creator" },
  { value: "findingAidTranscript", label: "Finding aid text" },
  {
    value: "allExceptFindingAidTranscript",
    label: "All except finding aid text",
  },
];

const OPERATORS = [
  { value: "and", label: "AND" },
  { value: "or", label: "OR" },
  { value: "not", label: "NOT" },
];

class AtoMSearchInterface extends LitElement {
  static properties = {
    node: { state: true },
    criteria: { state: true },
    results: { state: true },
    totalResults: { state: true },
    currentPage: { state: true },
    isLoading: { state: true },
    error: { state: true },
    atomUrl: { state: true },
    infoExpanded: { state: true },
    hasSearched: { state: true },
  };

  static styles = styles;

  constructor() {
    super();
    this.node = null;
    this.criteria = [{ id: 0, query: "", field: "", operator: "" }];
    this.results = [];
    this.totalResults = 0;
    this.currentPage = 1;
    this.resultsPerPage = 10;
    this.isLoading = false;
    this.error = null;
    this.atomUrl = null;
    this.infoExpanded = localStorage.getItem("atomSearchInfoOpen") !== "false";
    this.hasSearched = false;
    this._criterionCounter = 1;
    this.api = new AtomSearchAPI();
    this._initAtomUrl();
  }

  async _initAtomUrl() {
    try {
      this.atomUrl = await this.api.getAtomUrl();
    } catch (e) {
      console.error("Failed to load AtoM URL:", e);
    }
  }

  setNode(node) {
    this.node = node;
  }

  // ── Criteria Management ──

  _addCriterion() {
    this.criteria = [
      ...this.criteria,
      { id: this._criterionCounter++, query: "", field: "", operator: "and" },
    ];
  }

  _removeCriterion(id) {
    if (this.criteria.length <= 1) return;
    this.criteria = this.criteria.filter((c) => c.id !== id);
  }

  _updateCriterion(id, field, value) {
    this.criteria = this.criteria.map((c) =>
      c.id === id ? { ...c, [field]: value } : c
    );
  }

  // ── Search ──

  async _performSearch(page = 1) {
    this.isLoading = true;
    this.error = null;
    this.currentPage = page;
    this.hasSearched = true;

    try {
      const data = await this.api.search(
        this.criteria,
        page,
        this.resultsPerPage
      );
      this.results = data.results;
      this.totalResults = data.total;
    } catch (e) {
      console.error("Search error:", e);
      this.error = `Search failed: ${e.message}`;
      this.results = [];
      this.totalResults = 0;
    } finally {
      this.isLoading = false;
    }
  }

  _handleSearchKeydown(e) {
    if (e.key === "Enter") {
      this._performSearch();
    }
  }

  // ── Result Linking ──

  async _handleLink(slug) {
    if (!this.node) {
      console.error("No node set for linking");
      return;
    }

    try {
      await this.api.linkDescription(
        this.node._metadata.get("uuid"),
        slug
      );
      this.dispatchEvent(
        new CustomEvent("description-linked", { detail: slug })
      );
      this.remove();
    } catch (e) {
      console.error("Link error:", e);
      this.error = `Failed to link description: ${e.message}`;
    }
  }

  // ── Info Toggle ──

  _toggleInfo() {
    this.infoExpanded = !this.infoExpanded;
    localStorage.setItem("atomSearchInfoOpen", String(this.infoExpanded));
  }

  // ── Pagination Helpers ──

  get _totalPages() {
    return Math.ceil(this.totalResults / this.resultsPerPage);
  }

  get _rangeStart() {
    return (this.currentPage - 1) * this.resultsPerPage + 1;
  }

  get _rangeEnd() {
    return Math.min(this.currentPage * this.resultsPerPage, this.totalResults);
  }

  _getPageRange() {
    const total = this._totalPages;
    const current = this.currentPage;
    const delta = 2;
    const pages = [];

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        pages.push(i);
      }
    }

    const withEllipsis = [];
    let prev = null;
    for (const p of pages) {
      if (prev !== null && p - prev > 1) {
        withEllipsis.push(null);
      }
      withEllipsis.push(p);
      prev = p;
    }
    return withEllipsis;
  }

  // ── SVG Helpers ──

  _svg(path) {
    return icon(path);
  }

  // ── Render ──

  render() {
    return html`
      ${this._renderInfoSection()}
      <div class="search-panel">
        ${this._renderPanelHeader()} ${this._renderCriteria()}
        ${this._renderActions()} ${this._renderError()}
        ${this._renderLoading()} ${this._renderResults()}
        ${this._renderPagination()}
      </div>
    `;
  }

  _renderInfoSection() {
    return html`
      <div class="info-section">
        <div class="info-header" @click=${this._toggleInfo}>
          ${this._svg(mdiHelpCircleOutline)}
          <span>How to search AtoM descriptions</span>
          <div class="info-chevron ${this.infoExpanded ? "expanded" : ""}">
            ${this._svg(mdiChevronDown)}
          </div>
        </div>
        <div class="info-body ${this.infoExpanded ? "open" : ""}">
          <p>
            Search for archival descriptions in your AtoM instance using one or
            more search criteria. Combine criteria with
            <span class="info-highlight">AND</span>,
            <span class="info-highlight">OR</span>, or
            <span class="info-highlight">NOT</span> operators.
          </p>
          <p>
            Once you find the right description, click
            <span class="info-highlight">Link</span> to associate it with
            your selected item in Curate.
          </p>
          <p>
            Only the <span class="info-highlight">top-level</span> linked
            description is used when building your dissemination package. AtoM
            automatically associates child-level items as descendants.
          </p>
        </div>
      </div>
    `;
  }

  _renderPanelHeader() {
    return html`
      <div class="panel-title">
        ${this._svg(mdiDatabaseImport)} Search Descriptions
      </div>
    `;
  }

  _renderCriteria() {
    return html`
      <div class="criteria-list">
        ${map(
          this.criteria,
          (criterion, index) => html`
            <div
              class="criterion-row"
              style="animation-delay: ${index * 0.05}s"
            >
              <div class="criterion-number">${index + 1}</div>

              ${index > 0
                ? html`
                    <div class="operator-select">
                      <md-outlined-select
                        label="Operator"
                        .value=${criterion.operator}
                        @change=${(e) =>
                          this._updateCriterion(
                            criterion.id,
                            "operator",
                            e.target.value
                          )}
                      >
                        ${map(
                          OPERATORS,
                          (op) => html`
                            <md-select-option
                              value=${op.value}
                              ?selected=${criterion.operator === op.value}
                            >
                              <div slot="headline">${op.label}</div>
                            </md-select-option>
                          `
                        )}
                      </md-outlined-select>
                    </div>
                  `
                : nothing}

              <div class="query-field">
                <md-outlined-text-field
                  label="Search query"
                  placeholder="Enter search terms..."
                  .value=${criterion.query}
                  @input=${(e) =>
                    this._updateCriterion(
                      criterion.id,
                      "query",
                      e.target.value
                    )}
                  @keydown=${this._handleSearchKeydown}
                ></md-outlined-text-field>
              </div>

              <div class="field-select">
                <md-outlined-select
                  label="Search field"
                  .value=${criterion.field}
                  @change=${(e) =>
                    this._updateCriterion(
                      criterion.id,
                      "field",
                      e.target.value
                    )}
                >
                  ${map(
                    SEARCH_FIELDS,
                    (f) => html`
                      <md-select-option
                        value=${f.value}
                        ?selected=${criterion.field === f.value}
                      >
                        <div slot="headline">${f.label}</div>
                      </md-select-option>
                    `
                  )}
                </md-outlined-select>
              </div>

              ${this.criteria.length > 1
                ? html`
                    <md-icon-button
                      class="remove-btn"
                      title="Remove criterion"
                      @click=${() => this._removeCriterion(criterion.id)}
                    >
                      ${this._svg(mdiClose)}
                    </md-icon-button>
                  `
                : nothing}
            </div>
          `
        )}
      </div>
    `;
  }

  _renderActions() {
    return html`
      <div class="actions-row">
        <md-filled-button @click=${() => this._performSearch()}>
          ${this._svg(mdiMagnify)} Search
        </md-filled-button>
        <md-outlined-button @click=${this._addCriterion}>
          ${this._svg(mdiPlus)} Add Criterion
        </md-outlined-button>
      </div>
    `;
  }

  _renderError() {
    if (!this.error) return nothing;
    return html`
      <div class="error-banner">
        ${this._svg(mdiAlertCircleOutline)}
        <span>${this.error}</span>
      </div>
    `;
  }

  _renderLoading() {
    if (!this.isLoading) return nothing;
    return html`
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <span>Searching AtoM...</span>
      </div>
    `;
  }

  _renderResults() {
    if (this.isLoading) return nothing;
    if (!this.hasSearched) return nothing;

    if (this.results.length === 0 && !this.error) {
      return html`
        <div class="results-section">
          <div class="no-results">
            ${this._svg(mdiFileDocumentOutline)}
            <div>No descriptions found</div>
            <div class="no-results-text">
              Try adjusting your search criteria or broadening your query.
            </div>
          </div>
        </div>
      `;
    }

    if (this.results.length === 0) return nothing;

    return html`
      <div class="results-section">
        <div class="results-header">
          <div class="results-title">
            ${this._svg(mdiFileDocumentOutline)} Results
          </div>
          <div class="results-count">${this.totalResults} found</div>
        </div>
        <div class="results-list">
          ${map(
            this.results,
            (result, index) => html`
              <div
                class="result-card"
                style="animation-delay: ${index * 0.06}s"
              >
                <div class="result-content">
                  <div class="result-title">${result.title}</div>
                  <div class="result-meta">
                    ${result.reference_code
                      ? html`<span class="result-tag tag-ref-code"
                          >${result.reference_code}</span
                        >`
                      : nothing}
                    ${result.level_of_description
                      ? html`<span class="result-tag tag-level"
                          >${result.level_of_description}</span
                        >`
                      : nothing}
                  </div>
                  ${this.atomUrl
                    ? html`
                        <a
                          class="result-url"
                          href="${this.atomUrl}/${result.slug}"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          ${this.atomUrl}/${result.slug}
                        </a>
                      `
                    : nothing}
                  <div class="result-actions">
                    <md-filled-button
                      @click=${() => this._handleLink(result.slug)}
                    >
                      ${this._svg(mdiLinkVariant)} Link to this description
                    </md-filled-button>
                  </div>
                </div>
                ${result.thumbnail_url
                  ? html`
                      <img
                        class="result-thumbnail"
                        src="${result.thumbnail_url.replace(
                          /^http:\/\/[^/]+/,
                          this.atomUrl
                        )}"
                        alt="Thumbnail for ${result.title}"
                        loading="lazy"
                      />
                    `
                  : nothing}
              </div>
            `
          )}
        </div>
      </div>
    `;
  }

  _renderPagination() {
    if (this.isLoading || this._totalPages <= 1) return nothing;

    const pages = this._getPageRange();

    return html`
      <div class="pagination-container">
        <div class="pagination-info">
          Showing ${this._rangeStart} – ${this._rangeEnd} of
          ${this.totalResults}
        </div>
        <div class="pagination-controls">
          <button
            class="page-btn"
            title="First page"
            ?disabled=${this.currentPage === 1}
            @click=${() => this._performSearch(1)}
          >
            &laquo;
          </button>
          <button
            class="page-btn"
            title="Previous page"
            ?disabled=${this.currentPage === 1}
            @click=${() => this._performSearch(this.currentPage - 1)}
          >
            ${this._svg(mdiChevronLeft)}
          </button>

          ${map(pages, (p) =>
            p === null
              ? html`<span class="page-ellipsis">...</span>`
              : html`
                  <button
                    class="page-btn ${p === this.currentPage ? "active" : ""}"
                    @click=${() => this._performSearch(p)}
                  >
                    ${p}
                  </button>
                `
          )}

          <button
            class="page-btn"
            title="Next page"
            ?disabled=${this.currentPage === this._totalPages}
            @click=${() => this._performSearch(this.currentPage + 1)}
          >
            ${this._svg(mdiChevronRight)}
          </button>
          <button
            class="page-btn"
            title="Last page"
            ?disabled=${this.currentPage === this._totalPages}
            @click=${() => this._performSearch(this._totalPages)}
          >
            &raquo;
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define("atom-search-interface", AtoMSearchInterface);

export default AtoMSearchInterface;

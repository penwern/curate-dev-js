import { css } from "lit";

export const fprStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    font: inherit;
    color: inherit;
  }
  * {
    box-sizing: border-box;
  }
  h2 {
    font-size: 18px;
    font-weight: 500;
    margin: 0 0 8px;
  }
  h3 {
    font-size: 15px;
    margin: 0 0 6px;
  }
  p {
    line-height: 1.5;
    margin: 8px 0;
  }
  .format-row {
    font: inherit;
    color: inherit;
    background: var(--md-sys-color-surface, #fffbfe);
    border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    border-radius: 4px;
  }
  .format-row {
    cursor: pointer;
  }
  .format-row:hover {
    background: var(--md-sys-color-surface-variant, transparent);
  }
  :focus-visible {
    outline: 2px solid var(--md-sys-color-primary, #6750a4);
    outline-offset: 2px;
  }
  .filters {
    flex: none;
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 12px 0 16px;
  }
  .refresh {
    flex: none;
  }
  .search {
    flex: 1;
    min-width: 180px;
  }
  md-outlined-select {
    min-width: 150px;
    flex: 0 1 auto;
    --md-outlined-select-text-field-container-padding-vertical: 8px;
    /* Match the dropdown theme overrides used by workspace-filter and atom-search. */
    --md-menu-container-color: var(--md-sys-color-surface-variant);
    --md-outlined-select-text-field-outline-color: var(--md-sys-color-outline-variant);
    --md-outlined-select-text-field-hover-outline-color: var(--md-sys-color-outline);
    --md-outlined-select-text-field-focus-outline-color: var(--md-sys-color-primary);
    --md-outlined-select-text-field-input-text-color: var(--md-sys-color-on-surface);
    --md-outlined-select-text-field-label-text-color: var(--md-sys-color-on-surface-variant);
    --md-outlined-select-text-field-hover-label-text-color: var(--md-sys-color-on-surface);
    --md-outlined-select-text-field-focus-label-text-color: var(--md-sys-color-primary);
    --md-outlined-select-text-field-trailing-icon-color: var(--md-sys-color-on-surface-variant);
    --md-outlined-select-text-field-hover-trailing-icon-color: var(--md-sys-color-on-surface);
    --md-outlined-select-text-field-focus-trailing-icon-color: var(--md-sys-color-primary);
  }
  md-select-option {
    --md-menu-item-label-text-color: var(--md-sys-color-on-surface-variant);
    --md-menu-item-selected-container-color: var(--md-sys-color-secondary-container);
    --md-menu-item-selected-label-text-color: var(--md-sys-color-on-secondary-container);
  }
  md-outlined-text-field {
    --md-outlined-text-field-outline-color: var(--md-sys-color-outline-variant);
    --md-outlined-text-field-hover-outline-color: var(--md-sys-color-outline);
    --md-outlined-text-field-focus-outline-color: var(--md-sys-color-primary);
    --md-outlined-text-field-input-text-color: var(--md-sys-color-on-surface);
    --md-outlined-text-field-label-text-color: var(--md-sys-color-on-surface-variant);
    --md-outlined-text-field-focus-label-text-color: var(--md-sys-color-primary);
  }
  md-outlined-text-field,
  md-outlined-select {
    --md-outlined-text-field-top-space: 8px;
    --md-outlined-text-field-bottom-space: 8px;
    --md-outlined-field-top-space: 8px;
    --md-outlined-field-bottom-space: 8px;
    --md-outlined-text-field-container-shape: 12px;
    --md-outlined-select-text-field-container-shape: 12px;
  }
  .browser {
    display: grid;
    grid-template-columns: 270px minmax(0, 1fr);
    gap: 16px;
    flex: 1 1 0;
    min-height: 0;
  }
  .format-list {
    display: flex;
    flex-direction: column;
    min-height: 0;
    border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    border-radius: 16px;
    overflow: hidden;
    background: var(--md-sys-color-surface, #fffbfe);
  }
  .rows {
    overscroll-behavior: contain;
    min-height: 0;
    overflow-y: auto;
    flex: 1;
    padding: 8px;
  }
  .format-row {
    display: block;
    width: 100%;
    text-align: left;
    border: 0;
    border-radius: 12px;
    padding: 10px 12px;
    margin-bottom: 4px;
    font-size: 14px;
    overflow-wrap: anywhere;
  }
  .format-row span {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: var(--md-sys-color-on-surface-variant, #49454f);
  }
  .format-list > .format-row {
    width: calc(100% - 16px);
    margin: 8px;
  }
  .format-row.selected {
    background: var(--md-sys-color-secondary-container, #e8def8);
    color: var(--md-sys-color-on-secondary-container, #1d192b);
  }
  .result-count {
    font-size: 12px;
    margin: 8px 12px;
  }
  .pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px;
    font-size: 12px;
  }
  .detail {
    overscroll-behavior: contain;
    min-height: 0;
    padding: 24px;
    overflow-y: auto;
    min-width: 0;
    border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    border-radius: 16px;
    background: var(--md-sys-color-surface, #fffbfe);
  }
  .format-identifier {
    color: var(--md-sys-color-on-surface-variant, #49454f);
    font-size: 13px;
  }
  .actions {
    margin-top: 24px;
  }
  .action-group {
    margin-top: 16px;
    border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    border-radius: 8px;
    overflow: hidden;
  }
  .action-group h3 {
    color: var(--md-sys-color-on-surface-variant, inherit);
    background: var(--md-sys-color-surface-variant, transparent);
    font-weight: 500;
    margin: 0;
    padding: 12px 16px;
    border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  }
  md-list {
    padding: 0;
    --md-list-container-color: transparent;
  }
  .action-item {
    --md-list-item-label-text-color: var(--md-sys-color-on-surface);
    --md-list-item-supporting-text-color: var(--md-sys-color-on-surface-variant);
    --md-list-item-top-space: 12px;
    --md-list-item-bottom-space: 12px;
    --md-list-item-leading-space: 16px;
    --md-list-item-trailing-space: 12px;
    --md-list-item-supporting-text-size: 13px;
  }
  .action-technical {
    padding: 0 16px 12px;
  }
  .rule-state {
    display: block;
  }
  .format-header {
    padding-bottom: 16px;
  }
  .rule-state,
  .selection-note {
    font-size: 13px;
    color: var(--md-sys-color-on-surface-variant, #49454f);
  }
  .notice {
    border-left: 3px solid var(--md-sys-color-primary, #6750a4);
    padding-left: 10px;
  }
  details {
    margin: 12px 0;
  }
  summary {
    cursor: pointer;
    overflow-wrap: anywhere;
    line-height: 1.5;
  }
  dl {
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr);
    gap: 8px 12px;
    font-size: 13px;
  }
  dt {
    color: var(--md-sys-color-on-surface-variant, #49454f);
  }
  dd {
    margin: 0;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
  pre {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    padding: 12px;
    background: var(--md-sys-color-surface-variant, transparent);
    font-size: 12px;
  }
  .inspection-footer {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  }
  .rule-visibility {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px 16px;
  }
  .rule-visibility p {
    margin: 0;
    font-size: 14px;
  }
  .rule-visibility span {
    display: block;
    font-size: 13px;
    color: var(--md-sys-color-on-surface-variant, inherit);
  }
  .inspection-footer > .selection-note {
    margin: 12px 0 16px;
  }
  .registry-record {
    font-size: 13px;
    margin: 0;
    border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    border-radius: 8px;
    overflow: hidden;
  }
  .registry-record > summary {
    padding: 12px 16px;
    background: var(--md-sys-color-surface-variant, transparent);
    color: var(--md-sys-color-on-surface-variant, inherit);
    font-size: 14px;
  }
  .registry-record[open] > summary {
    border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  }
  .registry-record-content {
    padding: 8px 16px 16px;
  }
  @media (max-width: 750px) {
    .filters {
      flex-wrap: wrap;
    }
    .search {
      flex-basis: 100%;
    }
    .browser {
      grid-template-columns: 200px minmax(0, 1fr);
    }
    .detail {
      padding: 12px;
    }
    dl {
      grid-template-columns: 1fr;
      gap: 4px;
    }
    dd {
      margin-bottom: 6px;
    }
  }
  @media (max-width: 500px) {
    .browser {
      grid-template-columns: 1fr;
      grid-template-rows: minmax(0, 1fr) minmax(0, 2fr);
    }
  }
`;

import { css } from "lit";

export const styles = css`
  :host {
    display: block;
    font-family: "Roboto", "Segoe UI", system-ui, sans-serif;
    color: var(--md-sys-color-on-surface, #e2e2e5);
    min-width: 60vw;
  }

  /* ── Info Accordion ── */

  .info-section {
    margin-bottom: 20px;
    border-radius: var(--md-sys-color-card-border-radius, 12px);
    overflow: hidden;
    border: 1px solid var(--md-sys-color-outline-variant, #41484d);
    background: var(--md-sys-color-surface-1);
  }

  .info-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    cursor: pointer;
    user-select: none;
    color: var(--md-sys-color-secondary, #b6c9d8);
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.02em;
    transition: background 0.2s ease;
  }

  .info-header:hover {
    background: var(--md-sys-color-hover-background, rgba(255, 255, 255, 0.06));
  }

  .info-header svg {
    width: 20px;
    height: 20px;
    fill: var(--md-sys-color-secondary, #b6c9d8);
    flex-shrink: 0;
  }

  .info-chevron {
    margin-left: auto;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .info-chevron.expanded {
    transform: rotate(180deg);
  }

  .info-body {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
      padding 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 0 20px;
  }

  .info-body.open {
    max-height: 400px;
    padding: 0 20px 20px;
  }

  .info-body p {
    margin: 0 0 8px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant, #c1c7ce);
  }

  .info-body p:last-child {
    margin-bottom: 0;
  }

  .info-highlight {
    color: var(--md-sys-color-primary, #85cfff);
    font-weight: 500;
  }

  /* ── Search Panel ── */

  .search-panel {
    background: var(--md-sys-color-surface-2);
    border: 1px solid var(--md-sys-color-outline-variant, #41484d);
    border-radius: var(--md-sys-color-paper-border-radius, 20px);
    padding: 28px;
    position: relative;
    overflow: hidden;
  }

  .search-panel::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      var(--md-sys-color-primary, #85cfff),
      var(--md-sys-color-tertiary, #cdc0e9)
    );
    opacity: 0.8;
  }

  .panel-title {
    font-size: 18px;
    font-weight: 400;
    color: var(--md-sys-color-on-surface, #e2e2e5);
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 10px;
    letter-spacing: 0.01em;
  }

  .panel-title svg {
    width: 22px;
    height: 22px;
    fill: var(--md-sys-color-primary, #85cfff);
  }

  /* ── Criteria ── */

  .criteria-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .criterion-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 16px;
    background: var(--md-sys-color-surface-3);
    border-radius: var(--md-sys-color-card-border-radius, 12px);
    border: 1px solid var(--md-sys-color-outline-variant, #41484d);
    animation: criterionEnter 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    opacity: 0;
    transform: translateY(8px);
  }

  @keyframes criterionEnter {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .criterion-row .operator-select {
    flex: 0 0 100px;
  }

  .criterion-row .query-field {
    flex: 1;
    min-width: 0;
  }

  .criterion-row .field-select {
    flex: 0 0 220px;
  }

  .criterion-row .remove-btn {
    flex-shrink: 0;
    align-self: center;
    --md-icon-button-icon-color: var(--md-sys-color-error, #ffb4ab);
  }

  .criterion-row .remove-btn:hover {
    --md-icon-button-icon-color: var(--md-sys-color-on-error-container, #ffb4ab);
    background: var(--md-sys-color-error-container, #93000a);
    border-radius: 50%;
  }

  .criterion-number {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--md-sys-color-primary-container, #004c6c);
    color: var(--md-sys-color-on-primary-container, #c7e7ff);
    font-size: 12px;
    font-weight: 600;
    align-self: center;
  }

  /* ── Material Web Overrides ── */

  md-outlined-text-field {
    width: 100%;
    --md-outlined-text-field-container-shape: 10px;
    --md-outlined-text-field-outline-color: var(
      --md-sys-color-outline-variant,
      #41484d
    );
    --md-outlined-text-field-focus-outline-color: var(
      --md-sys-color-primary,
      #85cfff
    );
    --md-outlined-text-field-hover-outline-color: var(
      --md-sys-color-outline,
      #8b9198
    );
    --md-outlined-text-field-input-text-color: var(
      --md-sys-color-on-surface,
      #e2e2e5
    );
    --md-outlined-text-field-label-text-color: var(
      --md-sys-color-on-surface-variant,
      #c1c7ce
    );
    --md-outlined-text-field-focus-label-text-color: var(
      --md-sys-color-primary,
      #85cfff
    );
  }

  md-outlined-select {
    --md-outlined-select-text-field-container-shape: 10px;
    --md-outlined-select-text-field-outline-color: var(
      --md-sys-color-outline-variant,
      #41484d
    );
    --md-outlined-select-text-field-focus-outline-color: var(
      --md-sys-color-primary,
      #85cfff
    );
    --md-outlined-select-text-field-hover-outline-color: var(
      --md-sys-color-outline,
      #8b9198
    );
    --md-outlined-select-text-field-input-text-color: var(
      --md-sys-color-on-surface,
      #e2e2e5
    );
    --md-outlined-select-text-field-label-text-color: var(
      --md-sys-color-on-surface-variant,
      #c1c7ce
    );
    --md-outlined-select-text-field-focus-label-text-color: var(
      --md-sys-color-primary,
      #85cfff
    );
    --md-menu-container-color: var(--md-sys-color-surface-variant, #41484d);
  }

  .operator-select md-outlined-select,
  .field-select md-outlined-select {
    width: 100%;
  }

  /* ── Action Buttons ── */

  .actions-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  md-filled-button,
  md-outlined-button {
    --md-filled-button-container-shape: 12px;
    --md-outlined-button-container-shape: 12px;
    font-weight: 500;
  }

  md-filled-button svg,
  md-outlined-button svg {
    width: 18px;
    height: 18px;
    vertical-align: middle;
    position: relative;
    top: -1px;
  }

  md-filled-button {
    --md-filled-button-container-color: var(--md-sys-color-primary, #85cfff);
    --md-filled-button-label-text-color: var(
      --md-sys-color-on-primary,
      #00344c
    );
    --md-filled-button-hover-state-layer-color: var(
      --md-sys-color-on-primary,
      #00344c
    );
  }

  md-outlined-button {
    --md-outlined-button-outline-color: var(
      --md-sys-color-outline-variant,
      #41484d
    );
    --md-outlined-button-label-text-color: var(
      --md-sys-color-primary,
      #85cfff
    );
    --md-outlined-button-hover-outline-color: var(
      --md-sys-color-primary,
      #85cfff
    );
  }

  /* ── Loading ── */

  .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 40px 20px;
    color: var(--md-sys-color-on-surface-variant, #c1c7ce);
    font-size: 14px;
  }

  .loading-spinner {
    width: 28px;
    height: 28px;
    border: 3px solid var(--md-sys-color-outline-variant, #41484d);
    border-top-color: var(--md-sys-color-primary, #85cfff);
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ── Error ── */

  .error-banner {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 20px;
    margin-top: 20px;
    background: var(--md-sys-color-error-container, #93000a);
    color: var(--md-sys-color-on-error-container, #ffb4ab);
    border-radius: var(--md-sys-color-card-border-radius, 12px);
    font-size: 14px;
    line-height: 1.5;
    animation: fadeSlideIn 0.3s ease forwards;
  }

  .error-banner svg {
    width: 20px;
    height: 20px;
    fill: var(--md-sys-color-error, #ffb4ab);
    flex-shrink: 0;
    margin-top: 1px;
  }

  /* ── Results ── */

  .results-section {
    margin-top: 24px;
  }

  .results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--md-sys-color-outline-variant, #41484d);
  }

  .results-title {
    font-size: 16px;
    font-weight: 400;
    color: var(--md-sys-color-on-surface, #e2e2e5);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .results-count {
    font-size: 13px;
    color: var(--md-sys-color-on-surface-variant, #c1c7ce);
    background: var(--md-sys-color-surface-variant, #41484d);
    padding: 4px 12px;
    border-radius: 20px;
  }

  .results-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 500px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .results-list::-webkit-scrollbar {
    width: 6px;
  }

  .results-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .results-list::-webkit-scrollbar-thumb {
    background: var(--md-sys-color-outline-variant, #41484d);
    border-radius: 3px;
  }

  .results-list::-webkit-scrollbar-thumb:hover {
    background: var(--md-sys-color-outline, #8b9198);
  }

  .result-card {
    display: flex;
    gap: 16px;
    padding: 20px;
    background: var(--md-sys-color-surface-1);
    border: 1px solid var(--md-sys-color-outline-variant, #41484d);
    border-radius: var(--md-sys-color-card-border-radius, 12px);
    transition: border-color 0.2s ease, background 0.2s ease,
      transform 0.2s ease, box-shadow 0.2s ease;
    cursor: default;
    animation: resultEnter 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    opacity: 0;
    transform: translateY(12px);
  }

  .result-card:hover {
    border-color: var(--md-sys-color-primary-container, #004c6c);
    background: var(--md-sys-color-surface-3);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  }

  @keyframes resultEnter {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .result-content {
    flex: 1;
    min-width: 0;
  }

  .result-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--md-sys-color-on-surface, #e2e2e5);
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .result-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }

  .result-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    font-size: 12px;
    border-radius: 6px;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  .tag-ref-code {
    background: var(--md-sys-color-primary-container, #004c6c);
    color: var(--md-sys-color-on-primary-container, #c7e7ff);
  }

  .tag-level {
    background: var(--md-sys-color-tertiary-container, #4b4263);
    color: var(--md-sys-color-on-tertiary-container, #e8ddff);
  }

  .result-url {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--md-sys-color-primary, #85cfff);
    text-decoration: none;
    margin-bottom: 14px;
    word-break: break-all;
    transition: color 0.15s ease;
  }

  .result-url:hover {
    color: var(--md-sys-color-on-primary-container, #c7e7ff);
    text-decoration: underline;
  }

  .result-url svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
    flex-shrink: 0;
  }

  .result-actions {
    margin-top: 4px;
  }

  .result-actions md-filled-button {
    --md-filled-button-container-color: var(
      --md-sys-color-primary-container,
      #004c6c
    );
    --md-filled-button-label-text-color: var(
      --md-sys-color-on-primary-container,
      #c7e7ff
    );
    --md-filled-button-container-shape: 10px;
    height: 36px;
    font-size: 13px;
  }

  .result-actions md-filled-button:hover {
    --md-filled-button-container-color: var(
      --md-sys-color-primary,
      #85cfff
    );
    --md-filled-button-label-text-color: var(
      --md-sys-color-on-primary,
      #00344c
    );
  }

  .result-thumbnail {
    width: 100px;
    height: 100px;
    border-radius: 8px;
    object-fit: cover;
    border: 1px solid var(--md-sys-color-outline-variant, #41484d);
    flex-shrink: 0;
    align-self: center;
    background: var(--md-sys-color-surface-variant, #41484d);
  }

  .no-results {
    text-align: center;
    padding: 40px 20px;
    color: var(--md-sys-color-on-surface-variant, #c1c7ce);
    font-size: 14px;
  }

  .no-results svg {
    width: 48px;
    height: 48px;
    fill: var(--md-sys-color-outline-variant, #41484d);
    margin-bottom: 12px;
  }

  .no-results-text {
    margin-top: 8px;
    font-size: 13px;
    color: var(--md-sys-color-outline, #8b9198);
  }

  /* ── Pagination ── */

  .pagination-container {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--md-sys-color-outline-variant, #41484d);
  }

  .pagination-info {
    text-align: center;
    font-size: 13px;
    color: var(--md-sys-color-on-surface-variant, #c1c7ce);
    margin-bottom: 12px;
  }

  .pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  .page-btn {
    min-width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--md-sys-color-outline-variant, #41484d);
    background: transparent;
    color: var(--md-sys-color-on-surface-variant, #c1c7ce);
    font-size: 13px;
    font-weight: 500;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0 6px;
    font-family: inherit;
  }

  .page-btn:hover:not(:disabled):not(.active) {
    background: var(--md-sys-color-hover-background, rgba(255, 255, 255, 0.06));
    border-color: var(--md-sys-color-outline, #8b9198);
    color: var(--md-sys-color-on-surface, #e2e2e5);
  }

  .page-btn.active {
    background: var(--md-sys-color-primary, #85cfff);
    color: var(--md-sys-color-on-primary, #00344c);
    border-color: var(--md-sys-color-primary, #85cfff);
    font-weight: 600;
  }

  .page-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .page-btn svg {
    width: 18px;
    height: 18px;
    fill: currentColor;
  }

  .page-ellipsis {
    min-width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--md-sys-color-outline, #8b9198);
    font-size: 14px;
    letter-spacing: 2px;
  }

  /* ── Utility ── */

  @keyframes fadeSlideIn {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;

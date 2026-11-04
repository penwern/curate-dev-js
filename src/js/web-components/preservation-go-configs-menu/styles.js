import { css } from "lit";

export const styles = css`
  :host {
    display: block;
    /* The popup is at most 70% of the viewport wide and sizes itself to its content */
    width: min(70vw, 1200px);
    max-width: 100%;
    box-sizing: border-box;
    font-family: "Roboto", "Segoe UI", system-ui, sans-serif;
    color: var(--md-sys-color-on-surface, #1d1b20);
    --md-ref-typeface-brand: "Roboto", "Segoe UI", system-ui, sans-serif;
    --md-ref-typeface-plain: "Roboto", "Segoe UI", system-ui, sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  .layout {
    display: flex;
    gap: 16px;
    height: min(calc(85vh - 190px), 720px);
    min-height: 440px;
  }

  /* Left pane */

  .list-pane {
    flex: 0 0 270px;
    width: 270px;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--md-sys-color-surface, #fffbfe);
    border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    border-radius: 16px;
    overflow: hidden;
  }

  .config-list {
    flex: 1;
    min-height: 0;
    margin: 0;
    padding: 8px;
    list-style: none;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .config-row {
    all: unset;
    box-sizing: border-box;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 12px;
    cursor: pointer;
    color: var(--md-sys-color-on-surface, #1d1b20);
  }

  .config-row:hover {
    background: color-mix(in srgb, var(--md-sys-color-on-surface, #1d1b20) 8%, transparent);
  }

  .config-row:focus-visible {
    outline: 2px solid var(--md-sys-color-primary, #6750a4);
    outline-offset: -2px;
  }

  .config-row.selected {
    background: var(--md-sys-color-secondary-container, #e8def8);
    color: var(--md-sys-color-on-secondary-container, #1d192b);
  }

  .row-top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 6px;
    min-width: 0;
  }

  .row-name {
    min-width: 0;
    font-size: 15px;
    font-weight: 500;
    overflow-wrap: anywhere;
  }

  .row-lock,
  .row-pin {
    display: inline-flex;
    flex: none;
    color: var(--md-sys-color-on-surface-variant, #49454f);
  }

  .row-lock svg,
  .row-pin svg {
    width: 16px !important;
    height: 16px !important;
  }

  .row-pin {
    margin-left: auto;
    color: var(--md-sys-color-primary, #6750a4);
  }

  .row-sub {
    font-size: 12px;
    line-height: 1.4;
    color: var(--md-sys-color-on-surface-variant, #49454f);
  }

  .row-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .chip {
    display: inline-block;
    max-width: 100%;
    padding: 2px 8px;
    border-radius: 8px;
    font-size: 11px;
    line-height: 1.5;
    font-weight: 500;
    white-space: nowrap;
    background: var(--md-sys-color-surface-variant, #e7e0ec);
    color: var(--md-sys-color-on-surface-variant, #49454f);
  }

  .config-row.selected .chip:not(.chip-primary):not(.chip-muted) {
    background: color-mix(
      in srgb,
      var(--md-sys-color-on-secondary-container, #1d192b) 12%,
      transparent
    );
    color: var(--md-sys-color-on-secondary-container, #1d192b);
  }

  .chip-primary {
    flex: none;
    background: var(--md-sys-color-primary-container, #eaddff);
    color: var(--md-sys-color-on-primary-container, #21005d);
  }

  .chip-muted {
    background: transparent;
    border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  }

  .list-footer {
    flex: none;
    padding: 12px;
    border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  }

  .new-btn {
    width: 100%;
  }

  /* Right pane */

  .pane {
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
    container-type: inline-size;
    background: var(--md-sys-color-surface, #fffbfe);
    border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    border-radius: 16px;
    overflow: hidden;
  }

  .pane-inner {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .pane-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .pane-head {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .pane-title {
    flex: 1;
    min-width: 0;
    margin: 0;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    font-size: 22px;
    font-weight: 500;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  .pane-desc {
    margin: -6px 0 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--md-sys-color-on-surface-variant, #49454f);
    overflow-wrap: anywhere;
  }

  .muted {
    font-style: italic;
    color: var(--md-sys-color-outline, #79747e);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .delete-btn {
    flex: none;
    margin: -6px -8px 0 0;
    --md-icon-button-icon-color: var(--md-sys-color-error, #b3261e);
  }

  .pin-info {
    margin: 0;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.5;
    background: var(--md-sys-color-secondary-container, #e8def8);
    color: var(--md-sys-color-on-secondary-container, #1d192b);
  }

  .pin-info svg {
    flex: none;
    width: 18px !important;
    height: 18px !important;
    margin-top: 1px;
  }

  .meta {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--md-sys-color-on-surface-variant, #49454f);
  }

  /* View: summary */

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 10px;
  }

  .tile {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  }

  .tile.differs,
  .card.differs,
  .adv-row.differs {
    border-color: var(--md-sys-color-tertiary, #7d5260);
    background: var(--md-sys-color-tertiary-container, #ffd8e4);
    background: color-mix(
      in srgb,
      var(--md-sys-color-tertiary-container, #ffd8e4) 45%,
      var(--md-sys-color-surface, #fffbfe)
    );
  }

  .tile-label {
    font-size: 12px;
    color: var(--md-sys-color-on-surface-variant, #49454f);
  }

  .tile-value {
    font-size: 15px;
    font-weight: 500;
  }

  .tile-default {
    font-size: 12px;
    color: var(--md-sys-color-on-surface-variant, #49454f);
  }

  .adv-summary {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    font-size: 14px;
  }

  .adv-summary-title {
    font-weight: 500;
  }

  .adv-summary-list {
    margin: 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 13px;
    color: var(--md-sys-color-on-surface-variant, #49454f);
  }

  .adv-summary-list strong {
    color: var(--md-sys-color-on-surface, #1d1b20);
    font-weight: 500;
  }

  .empty {
    margin: 0;
    padding: 32px 0;
    text-align: center;
    color: var(--md-sys-color-on-surface-variant, #49454f);
  }

  /* Edit */

  .field {
    width: 100%;
    --md-outlined-text-field-container-shape: 12px;
  }

  .base-line {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--md-sys-color-on-surface-variant, #49454f);
  }

  .base-line svg {
    flex: none;
    width: 18px !important;
    height: 18px !important;
  }

  .base-line strong {
    color: var(--md-sys-color-on-surface, #1d1b20);
    font-weight: 500;
  }

  .section-title {
    margin: 6px 0 -4px;
    font-size: 16px;
    font-weight: 500;
  }

  .essentials-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  @container (max-width: 600px) {
    .essentials-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px;
    border-radius: 14px;
    border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  }

  .card-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .card-label {
    font-size: 15px;
    font-weight: 500;
  }

  .card-desc,
  .card-hint {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
  }

  .card-desc {
    color: var(--md-sys-color-on-surface, #1d1b20);
  }

  .card-hint {
    color: var(--md-sys-color-on-surface-variant, #49454f);
    font-style: italic;
  }

  .card .segmented {
    margin-top: auto;
  }

  .link {
    all: unset;
    flex: none;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    color: var(--md-sys-color-primary, #6750a4);
    text-decoration: underline;
  }

  .link:focus-visible {
    outline: 2px solid var(--md-sys-color-primary, #6750a4);
    outline-offset: 2px;
    border-radius: 2px;
  }

  .segmented {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 4px;
    border-radius: 12px;
    border: 1px solid var(--md-sys-color-outline, #79747e);
    background: var(--md-sys-color-surface, #fffbfe);
  }

  .seg {
    all: unset;
    box-sizing: border-box;
    flex: 1 1 auto;
    padding: 7px 12px;
    border-radius: 8px;
    text-align: center;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    color: var(--md-sys-color-on-surface, #1d1b20);
  }

  .seg:hover {
    background: color-mix(in srgb, var(--md-sys-color-on-surface, #1d1b20) 8%, transparent);
  }

  .seg.checked {
    background: var(--md-sys-color-secondary-container, #e8def8);
    color: var(--md-sys-color-on-secondary-container, #1d192b);
    box-shadow: inset 0 0 0 1.5px var(--md-sys-color-primary, #6750a4);
  }

  .seg:focus-visible {
    outline: 2px solid var(--md-sys-color-primary, #6750a4);
    outline-offset: 1px;
  }

  .warning-note {
    margin: 0;
    padding: 8px 10px;
    border-radius: 10px;
    font-size: 12px;
    line-height: 1.45;
    background: var(--md-sys-color-error-container, #f9dedc);
    color: var(--md-sys-color-on-error-container, #410e0b);
  }

  .adv-toggle {
    all: unset;
    box-sizing: border-box;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    cursor: pointer;
  }

  .adv-toggle:hover {
    background: color-mix(in srgb, var(--md-sys-color-on-surface, #1d1b20) 6%, transparent);
  }

  .adv-toggle:focus-visible {
    outline: 2px solid var(--md-sys-color-primary, #6750a4);
    outline-offset: 2px;
  }

  .adv-title {
    font-size: 15px;
    font-weight: 500;
  }

  .adv-count {
    margin-left: auto;
    font-size: 12px;
    color: var(--md-sys-color-on-surface-variant, #49454f);
  }

  .adv-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .adv-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 14px;
    border-radius: 12px;
    border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  }

  .adv-row.disabled .adv-text {
    opacity: 0.6;
  }

  .adv-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .adv-label {
    font-size: 14px;
    font-weight: 500;
  }

  .adv-desc {
    font-size: 12px;
    line-height: 1.45;
    color: var(--md-sys-color-on-surface-variant, #49454f);
  }

  .adv-note {
    font-size: 12px;
    font-style: italic;
    color: var(--md-sys-color-on-surface-variant, #49454f);
  }

  .adv-text .link {
    margin-top: 2px;
  }

  md-switch {
    flex: none;
  }

  .pane-footer {
    flex: none;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 12px 24px;
    border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    background: var(--md-sys-color-surface, #fffbfe);
  }

  /* Shared */

  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    margin-right: 6px;
    vertical-align: middle;
    border: 2px solid var(--md-sys-color-outline-variant, #cac4d0);
    border-top-color: var(--md-sys-color-primary, #6750a4);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 700px) {
    .layout {
      flex-direction: column;
      height: auto;
    }

    .list-pane {
      flex: none;
      width: auto;
      max-height: 240px;
    }

    .pane {
      min-height: 480px;
    }
  }
`;

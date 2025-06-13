import { css } from "lit";

export const styles = css`
    :host {
      display: block;
      padding: 32px;
      padding-top: 0;
      max-width: 1400px;
      margin: 0 auto;
      font-family: "Roboto", "Segoe UI", system-ui, sans-serif;
      min-height: 100vh;
    }

    .header {
      font-size: 36px;
      font-weight: 400;
      margin-bottom: 40px;
      color: var(--md-sys-color-on-surface, #1d1b20);
      text-align: center;
      letter-spacing: -0.5px;
    }

    .main-container {
      width: 100%;
    }

    .panels-wrapper {
      display: flex;
      gap: 32px;
    }

    .form-section {
      flex: 1;
    }

    .saved-configs-section {
      flex: 1;
    }

    @media (max-width: 1100px) {
      .panels-wrapper {
        flex-direction: column;
      }
    }

    .form-section,
    .saved-configs-section {
      background: var(--md-sys-color-secondary-container);
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.04);
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      position: relative;
      overflow: hidden;
    }

    .form-section::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(
        90deg,
        var(--md-sys-color-primary, #6750a4),
        var(--md-sys-color-tertiary, #7d5260)
      );
    }

    .saved-configs-section::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(
        90deg,
        var(--md-sys-color-secondary, #625b71),
        var(--md-sys-color-tertiary, #7d5260)
      );
    }

    .section-title {
      font-size: 22px;
      margin-bottom: 32px;
      color: var(--md-sys-color-on-surface, #1d1b20);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-title svg {
      width: 32px;
      height: 32px;
      fill: var(--md-sys-color-primary, #6750a4);
    }

    .category {
      margin-bottom: 32px;
      background: var(--md-sys-color-surface-1);
      border-radius: 16px;
      padding: 24px;
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .category-header {
      font-size: 20px;
      font-weight: 500;
      margin-bottom: 20px;
      color: var(--md-sys-color-primary, #6750a4);
      padding-bottom: 12px;
      border-bottom: 2px solid var(--md-sys-color-primary-container, #eaddff);
      position: relative;
    }

    .category-header::after {
      content: "";
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 60px;
      height: 2px;
      background: var(--md-sys-color-primary, #6750a4);
    }

    .form-field {
      margin-bottom: 20px;
      padding-top: 16px;
      width: 100%;
      max-width: 100%;
      overflow: hidden;
    }

    .toggle-field {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      padding: 16px;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .toggle-field:hover {
      background: var(--md-sys-color-primary-container, #eaddff);
    }

    .toggle-field label {
      font-size: 16px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface, #1d1b20);
      cursor: pointer;
    }

    .suboptions {
      margin-left: 16px;
      padding: 16px;
      border-left: 3px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 0 8px 8px 0;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      opacity: 0.4;
      transition: all 0.3s ease;
      transform: translateX(-8px);
    }

    .suboptions.enabled {
      opacity: 1;
      transform: translateX(0);
      background: var(--md-sys-color-primary-container, #eaddff);
      border-left-color: var(--md-sys-color-primary, #6750a4);
    }

    .info-panel {
      background: linear-gradient(
        135deg,
        var(--md-sys-color-tertiary-container, #ffd8e4),
        var(--md-sys-color-primary-container, #eaddff)
      );
      color: var(--md-sys-color-on-tertiary-container, #31111d);
      padding: 20px;
      border-radius: 16px;
      margin: 20px 0;
      font-size: 14px;
      line-height: 1.5;
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .slider-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      border-radius: 12px;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }

    .slider-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .slider-value {
      font-weight: 600;
      color: var(--md-sys-color-primary, #6750a4);
      background: var(--md-sys-color-primary-container, #eaddff);
      padding: 4px 12px;
      border-radius: 8px;
      min-width: 32px;
      text-align: center;
    }

    .slider-container md-slider {
      width: 100%;
      min-width: 0;
    }

    .form-actions {
      display: flex;
      gap: 16px;
      margin-top: 32px;
      flex-wrap: wrap;
      justify-content: flex-end;
      padding-top: 20px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
    }

    .config-item {
      background: var(--md-sys-color-surface, #fefbff);
      border: 2px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 16px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      animation: slideIn 0.4s ease-out forwards;
      opacity: 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
      position: relative;
      overflow: hidden;
    }

    .config-item::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(
        90deg,
        var(--md-sys-color-secondary, #625b71),
        var(--md-sys-color-tertiary, #7d5260)
      );
      opacity: 0.7;
    }

    .config-item:hover {
      background: var(--md-sys-color-secondary-container, #e8def8);
      border-color: var(--md-sys-color-secondary, #625b71);
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .config-item:hover::before {
      opacity: 1;
    }

    .config-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      gap: 16px;
    }

    .config-name {
      font-size: 18px;
      color: var(--md-sys-color-on-surface, #1d1b20);
      line-height: 1.3;
    }

    .config-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-shrink: 0;
    }

    .config-details {
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      line-height: 1.5;
    }

    .config-description {
      margin-bottom: 8px;
      font-weight: 400;
    }

    .config-user {
      font-size: 13px;
      color: var(--md-sys-color-outline, #79747e);
      font-style: italic;
    }

    .no-configs {
      text-align: center;
      padding: 64px 32px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      border-radius: 20px;
      font-size: 16px;
      border: 2px dashed var(--md-sys-color-outline-variant, #c7c5d0);
    }

    .scroll-container {
      max-height: 700px;
      overflow-y: auto;
      padding-right: 8px;
      margin-right: -8px;
    }

    .scroll-container::-webkit-scrollbar {
      width: 8px;
    }

    .scroll-container::-webkit-scrollbar-track {
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      border-radius: 4px;
    }

    .scroll-container::-webkit-scrollbar-thumb {
      background: var(--md-sys-color-outline, #79747e);
      border-radius: 4px;
    }

    .scroll-container::-webkit-scrollbar-thumb:hover {
      background: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .loading {
      text-align: center;
      padding: 32px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .error {
      background: var(--md-sys-color-error-container, #ffdad6);
      color: var(--md-sys-color-on-error-container, #410002);
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 16px;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .spinner {
      animation: spin 1s linear infinite;
      width: 24px;
      height: 24px;
      border: 2px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-top: 2px solid var(--md-sys-color-primary, #6750a4);
      border-radius: 50%;
      display: inline-block;
      margin-right: 8px;
    }

    md-outlined-text-field,
    md-outlined-select {
      width: 100%;
      max-width: 100%;
      margin-bottom: 8px;
      --md-outlined-text-field-container-shape: 12px;
      --md-outlined-select-text-field-container-shape: 12px;
    }

    .form-field md-outlined-select {
  width: 100%;
  min-width: 0; /* This is important - allows shrinking below content width */
}

    md-switch {
      --md-switch-selected-track-color: var(--md-sys-color-primary, #6750a4);
      --md-switch-selected-handle-color: var(
        --md-sys-color-on-primary,
        #ffffff
      );
      --md-switch-track-shape: 16px;
      --md-switch-handle-shape: 16px;
    }

    md-slider {
      width: 100%;
      --md-slider-active-track-color: var(--md-sys-color-primary, #6750a4);
      --md-slider-handle-color: var(--md-sys-color-primary, #6750a4);
    }

    md-filled-button {
      --md-filled-button-container-color: var(--md-sys-color-primary, #6750a4);
      --md-filled-button-label-text-color: var(
        --md-sys-color-on-primary,
        #ffffff
      );
      --md-filled-button-container-shape: 12px;
      padding: 0 24px;
      height: 48px;
    }

    md-outlined-button {
      --md-outlined-button-outline-color: var(--md-sys-color-outline, #79747e);
      --md-outlined-button-label-text-color: var(
        --md-sys-color-primary,
        #6750a4
      );
      --md-outlined-button-container-shape: 12px;
      padding: 0 24px;
      height: 48px;
    }

    md-icon-button {
      --md-icon-button-icon-size: 20px;
    }

    .starred {
      --md-icon-button-icon-color: var(--md-sys-color-primary, #6750a4);
    }

    .delete-btn {
      --md-outlined-button-outline-color: var(--md-sys-color-error, #ba1a1a);
      --md-outlined-button-label-text-color: var(--md-sys-color-error, #ba1a1a);
      padding: 0 16px;
      height: 36px;
      font-size: 13px;
    }

    .delete-btn:hover {
      --md-outlined-button-outline-color: var(--md-sys-color-error, #ba1a1a);
      --md-outlined-button-container-color: var(
        --md-sys-color-error-container,
        #ffdad6
      );
    }`;
import { Curate } from '../../core/CurateFunctions/CurateFunctions.js';

/**
 * Pure Integration Route
 * Provides the Pure Integration interface for managing Pure integration settings
 */
export function registerPureIntegrationRoute() {
  Curate.router.addRoute('/pure-integration', (container) => {
    // Create container with proper styling for the Pure UI
    container.style.cssText = `
      padding: 20px;
      background: var(--md-sys-color-surface-variant, #fdfcff);
      min-height: 100%;
      height: 100%;
      width: 100%;
      overflow: auto;
      position: relative;
      z-index: 1;
      overscroll-behavior: auto;
      -webkit-overflow-scrolling: touch;
    `;

    // Create the Pure Integration UI component
    const pureUI = document.createElement('pure-integration-interface');
    pureUI.style.cssText = `
      display: block;
      width: 100%;
    `;

    // Assemble the page
    container.appendChild(pureUI);

    // Return cleanup function to remove the component
    return () => {
      if (pureUI && pureUI.parentNode) {
        pureUI.remove();
      }
    };
  }, {
    title: 'Pure Integration',
    showHeader: true
  });
}
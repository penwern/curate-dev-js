import { Curate } from '../../core/CurateFunctions/CurateFunctions.js';

/**
 * Calm Integration Route
 * Provides the calm Integration interface for managing calm integration settings
 */
export function registerCalmIntegrationRoute() {
  Curate.router.addRoute('/calm-integration', async (container) => {
    // Wait for the custom element to be defined before creating it
    await customElements.whenDefined('calm-integration-interface');

    // Create container with proper styling for the calm UI
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

    // Create the calm Integration UI component
    const calmUI = document.createElement('calm-integration-interface');
    calmUI.style.cssText = `
      display: block;
      width: 100%;
    `;

    container.appendChild(calmUI);

    // Return cleanup function
    return () => {
      if (calmUI && calmUI.parentNode) {
        calmUI.remove();
      }
    };
  }, {
    title: 'Calm Integration',
    showHeader: true
  });
}
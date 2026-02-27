import { Curate } from '../../core/CurateFunctions/CurateFunctions.js';

/**
 * Dashboard Route
 */
export function registerDashboardRoute() {
  Curate.router.addRoute('/dashboard', async (container) => {
    container.style.cssText = `
      background: var(--md-sys-color-surface-variant, #fdfcff);
      height: 100%;
      width: 100%;
      overflow: hidden;
      position: relative;
      z-index: 1;
    `;

    await customElements.whenDefined('admin-dashboard');

    const element = document.createElement('admin-dashboard');
    element.style.cssText = `
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    `;

    container.appendChild(element);

    return () => {
      if (element && element.parentNode) {
        element.remove();
      }
    };
  }, {
    title: `${pydio?.appTitle} Dashboard`,
    showHeader: true
  });
}

export function openDashboard(params = {}, overrides = {}) {
  Curate.router.open('/dashboard', params, overrides);
}

import { Curate } from '../core/CurateFunctions/CurateFunctions.js';

/**
 * Initialize the Curate Router with default configuration
 */
function initializeRouter() {
  // Initialize the router with default settings
  Curate.router.initialize({
    containerSelector: '.desktop-container',
    routePrefix: '/custom',
    showHeader: true,
    escapeClosesPage: true
  });

  // Listen for route restoration events from RouteProtection module
  window.addEventListener('curate-route-restored', (event) => {
    // Give the router a moment to be fully initialized
    setTimeout(() => {
      Curate.router.checkRoute();
    }, 100);
  });

  console.log('Curate Router initialized successfully');
}

export { initializeRouter };
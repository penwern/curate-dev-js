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

  console.log('Curate Router initialized successfully');
}

export { initializeRouter };
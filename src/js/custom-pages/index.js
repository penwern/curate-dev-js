/**
 * Custom Pages Entry Point
 *
 * This module initializes the Curate Router and loads all custom page routes
 * for Pydio Cells Enterprise.
 */

import { initializeRouter } from './router-init.js';
import { registerAllRoutes } from './routes/index.js';
import { Curate } from '../core/CurateFunctions/CurateFunctions.js';

/**
 * Initialize all custom pages functionality
 */
function initCustomPages() {
  try {
    // Initialize the router system
    initializeRouter();

    // Register all routes
    registerAllRoutes();

    // Force route check now that routes are registered
    Curate.router.checkRoute();

    console.log('Custom Pages: Initialization complete');

  } catch (error) {
    console.error('Custom Pages: Initialization failed:', error);
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCustomPages);
} else {
  // DOM is already ready
  initCustomPages();
}

// Export for manual initialization if needed
export { initCustomPages };
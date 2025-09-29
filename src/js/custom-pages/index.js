/**
 * Custom Pages Entry Point
 *
 * This module initializes the Curate Router and sets up demo custom pages
 * to showcase the routing functionality within Pydio Cells Enterprise.
 */

import { initializeRouter, registerDemoRoutes } from './router-init.js';

/**
 * Initialize all custom pages functionality
 */
function initCustomPages() {
  try {
    // Initialize the router system
    initializeRouter();

    // Register demo route
    registerDemoRoutes();

    console.log('Custom Pages: Initialization complete');
    console.log('Custom Pages: Demo route available at /custom/demo');

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
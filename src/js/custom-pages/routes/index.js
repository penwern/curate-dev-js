/**
 * Route Registry
 * Central location for loading all custom page routes
 */

// Import route registration functions
import { registerPureIntegrationRoute } from "./pure-integration.js";
import { registerCalmIntegrationRoute } from "./calm-integration.js";
import { registerEmailViewerRoute } from "./email-viewer.js";
import { registerWarcViewerRoute } from "./warc-viewer.js";
import { registerPdfViewerRoute } from "./pdf-viewer.js";
import { registerDemoRoutes } from "./demo-routes.js";
import { registerDashboardRoute } from "./dashboard.js";

/**
 * Register all production routes
 * Add new route imports and registrations here
 */
export function registerAllRoutes() {
  // Production routes
  registerPureIntegrationRoute();
  registerCalmIntegrationRoute();
  registerEmailViewerRoute();
  registerWarcViewerRoute();
  registerPdfViewerRoute();
  registerDashboardRoute();

  // Demo routes (optional - could be conditionally loaded)
  registerDemoRoutes();

  console.log("All custom routes have been registered");
}

/**
 * Register only production routes (excluding demos)
 */
export function registerProductionRoutes() {
  registerPureIntegrationRoute();
  registerCalmIntegrationRoute();
  registerEmailViewerRoute();
  registerWarcViewerRoute();
  registerPdfViewerRoute();
  registerDashboardRoute();

  console.log("Production routes have been registered");
}

/**
 * Register only demo routes
 */
export function registerDemoRoutesOnly() {
  registerDemoRoutes();

  console.log("Demo routes have been registered");
}

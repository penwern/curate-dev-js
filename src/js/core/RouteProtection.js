/**
 * Early Route Protection
 *
 * This module MUST be imported first to protect custom routes from Pydio's
 * homepage redirect before any other code runs.
 *
 * The issue: When a custom homepage is set in Pydio, it redirects any unrecognized
 * URL (including our custom routes) to the custom homepage on page load.
 *
 * The solution: Intercept the history API immediately on script load to block
 * Pydio from redirecting away from /custom/* routes.
 */

(function() {
  'use strict';

  const initialPath = window.location.pathname;

  // Only set up protection if we're on a custom route
  if (!initialPath.startsWith('/custom')) {
    return;
  }

  sessionStorage.setItem('curate_protected_route', initialPath);

  // Store original history methods before anyone can override them
  const originalReplaceState = history.replaceState.bind(history);
  const originalPushState = history.pushState.bind(history);

  // Override history.replaceState to block Pydio redirects
  history.replaceState = function(state, title, url) {
    const currentPath = window.location.pathname;
    const protectedRoute = sessionStorage.getItem('curate_protected_route');

    // Block redirects away from custom routes
    if (protectedRoute && currentPath.startsWith('/custom') && url && !url.startsWith('/custom')) {
      return;
    }

    return originalReplaceState(state, title, url);
  };

  // Override history.pushState to block Pydio navigation
  history.pushState = function(state, title, url) {
    const currentPath = window.location.pathname;
    const protectedRoute = sessionStorage.getItem('curate_protected_route');

    // Block navigation away from custom routes
    if (protectedRoute && currentPath.startsWith('/custom') && url && !url.startsWith('/custom')) {
      return;
    }

    return originalPushState(state, title, url);
  };

  // Monitor URL changes and restore if Pydio manages to redirect anyway
  let monitorCount = 0;
  const maxMonitorChecks = 50; // Monitor for 5 seconds

  const urlMonitor = setInterval(() => {
    monitorCount++;
    const currentPath = window.location.pathname;
    const protectedRoute = sessionStorage.getItem('curate_protected_route');

    if (!protectedRoute) {
      clearInterval(urlMonitor);
      return;
    }

    // If we've been redirected away from the custom route, restore it
    if (currentPath !== protectedRoute && !currentPath.startsWith('/custom')) {
      originalReplaceState(null, '', protectedRoute);

      // Trigger a custom event that the router can listen for
      window.dispatchEvent(new CustomEvent('curate-route-restored', {
        detail: { path: protectedRoute }
      }));

      sessionStorage.removeItem('curate_protected_route');
      clearInterval(urlMonitor);
      return;
    }

    // If we've successfully stayed on the custom route for 2 seconds, clear protection
    if (currentPath === protectedRoute && monitorCount > 20) {
      sessionStorage.removeItem('curate_protected_route');
      clearInterval(urlMonitor);
      return;
    }

    // Timeout after 5 seconds
    if (monitorCount >= maxMonitorChecks) {
      sessionStorage.removeItem('curate_protected_route');
      clearInterval(urlMonitor);
    }
  }, 100);

})();

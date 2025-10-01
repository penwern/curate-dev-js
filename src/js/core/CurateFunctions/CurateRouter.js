import { createFocusTrap } from 'focus-trap';

/**
 * Custom Page Router for Pydio Cells Enterprise
 *
 * A routing system for creating full-page custom UIs within Pydio Cells Enterprise
 * that coexist with the existing React application without modification to Pydio's codebase.
 *
 * @namespace CurateRouter
 */
const CurateRouter = (function () {
  let routes = new Map();
  let currentPage = null;
  let originalContent = null;
  let routePrefix = '/custom';
  let focusTrap = null;
  let isInitialized = false;
  let lastNonCustomUrl = '/'; // Track last non-custom URL for close button
  let configuration = {
    routePrefix: '/custom',
    showHeader: true,
    escapeClosesPage: true
  };

  /**
   * Initialize the router with configuration options
   *
   * @param {Object} config - Configuration options
   * @param {string} [config.containerSelector='.desktop-container'] - CSS selector for target container
   * @param {string} [config.routePrefix='/custom'] - URL prefix for custom routes
   * @param {boolean} [config.showHeader=true] - Whether to show header by default
   * @param {boolean} [config.escapeClosesPage=true] - Whether Escape key closes pages
   *
   * @example
   * // Initialize with default settings
   * Curate.router.initialize();
   *
   * @example
   * // Initialize with custom settings
   * Curate.router.initialize({
   *   containerSelector: '#my-container',
   *   routePrefix: '/my-app',
   *   showHeader: false
   * });
   */
  function initialize(config = {}) {
    if (isInitialized) {
      console.warn('CurateRouter: Already initialized');
      return;
    }

    configuration = { ...configuration, ...config };
    routePrefix = configuration.routePrefix;

    bindHistoryEvents();
    isInitialized = true;

    // Check current route after a short delay to allow routes to be registered
    setTimeout(() => checkCurrentRoute(), 100);
  }

  function bindHistoryEvents() {
    window.addEventListener('popstate', handlePopState);

    if (configuration.escapeClosesPage) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    // Also listen for URL changes that don't trigger popstate (like Pydio navigation)
    let lastUrl = window.location.href;
    const urlChangeListener = () => {
      const currentUrl = window.location.href;
      if (lastUrl !== currentUrl) {
        lastUrl = currentUrl;
        // URL changed, check if we need to close custom page
        requestAnimationFrame(() => {
          checkCurrentRoute();
        });
      }
    };

    // Check for URL changes more frequently and also use multiple detection methods
    setInterval(urlChangeListener, 50); // More frequent checking

    // Also override pushState and replaceState to catch programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(urlChangeListener, 10);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(urlChangeListener, 10);
    };

    // Listen for window resize to reposition custom pages
    window.addEventListener('resize', () => {
      if (currentPage && currentPage.container && currentPage.container.element) {
        repositionCurrentPage();
      }
    });
  }

  function handlePopState(event) {
    // Use requestAnimationFrame to ensure the URL has fully updated and DOM is ready
    requestAnimationFrame(() => {
      checkCurrentRoute();
    });
  }

  function handleEscapeKey(event) {
    if (event.key === 'Escape' && currentPage) {
      back();
    }
  }

  function checkCurrentRoute() {
    const path = window.location.pathname;

    if (path.startsWith(routePrefix)) {
      // Check if user is logged in before rendering custom routes
      if (typeof pydio !== 'undefined' && (!pydio.user || pydio.user === null)) {
        // User is not logged in, don't render custom page
        if (currentPage) {
          closePage();
        }
        return;
      }

      const routePath = path.substring(routePrefix.length) || '/';

      // Check if we're already on this route - prevent duplicate navigation
      if (currentPage) {
        const currentRoutePath = window.location.pathname.substring(routePrefix.length) || '/';
        if (currentRoutePath === routePath) {
          return;
        }
      }

      const match = findMatchingRoute(routePath);

      if (match) {
        navigateToRoute(match.route, match.params, false);
      } else {
        showErrorPage(`Route not found: ${routePath}`);
      }
    } else {
      // Track non-custom URLs for the close button
      lastNonCustomUrl = path;

      if (currentPage) {
        // We're navigating away from custom routes
        closePage();
      }
    }
  }

  function findMatchingRoute(path) {
    for (let [pattern, route] of routes) {
      const params = matchRoute(pattern, path);
      if (params !== null) {
        return { route, params };
      }
    }
    return null;
  }

  function matchRoute(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) {
        const paramName = patternPart.substring(1);
        params[paramName] = decodeURIComponent(pathPart);
      } else if (patternPart !== pathPart) {
        return null;
      }
    }

    return params;
  }

  /**
   * Register a new route with the router
   *
   * @param {string} path - Route path pattern (supports parameters like /settings/:tab)
   * @param {Function} handler - Route handler function
   * @param {Object} [options] - Route options
   * @param {string} [options.title='Custom Page'] - Page title for header
   * @param {boolean} [options.showHeader=true] - Whether to show navigation header
   *
   * @example
   * // Simple route
   * Curate.router.addRoute('/dashboard', (container, context) => {
   *   container.innerHTML = '<h1>Dashboard</h1>';
   * });
   *
   * @example
   * // Route with parameters
   * Curate.router.addRoute('/user/:id', (container, { params }) => {
   *   container.innerHTML = `<h1>User ${params.id}</h1>`;
   * }, { title: 'User Profile' });
   *
   * @example
   * // Route with cleanup function
   * Curate.router.addRoute('/settings', (container, { navigate, close }) => {
   *   const interval = setInterval(() => console.log('tick'), 1000);
   *   container.innerHTML = '<div>Settings content</div>';
   *
   *   // Return cleanup function
   *   return () => clearInterval(interval);
   * });
   */
  function addRoute(path, handler, options = {}) {
    if (!path || typeof handler !== 'function') {
      throw new Error('CurateRouter: Invalid route parameters');
    }

    const route = {
      handler,
      options: {
        title: options.title || 'Custom Page',
        showHeader: options.showHeader !== false,
        ...options
      }
    };

    routes.set(path, route);

    // If this is the first route being added and we're on a custom URL, check if it matches
    if (routes.size === 1 && window.location.pathname.startsWith(routePrefix)) {
      setTimeout(() => checkCurrentRoute(), 10);
    }
  }

  /**
   * Navigate to a specific route
   *
   * @param {string} path - The route path to navigate to
   * @param {boolean} [updateHistory=true] - Whether to update browser history
   *
   * @example
   * // Navigate to dashboard
   * Curate.router.navigate('/dashboard');
   *
   * @example
   * // Navigate with parameters
   * Curate.router.navigate('/user/123');
   *
   * @example
   * // Navigate without updating history (internal navigation)
   * Curate.router.navigate('/settings', false);
   */
  function navigate(path, updateHistory = true) {
    if (!isInitialized) {
      throw new Error('CurateRouter: Not initialized. Call initialize() first.');
    }

    const fullPath = routePrefix + (path.startsWith('/') ? path : '/' + path);

    if (updateHistory) {
      window.history.pushState(null, '', fullPath);
    }

    checkCurrentRoute();
  }

  function navigateToRoute(route, params, updateHistory = true) {
    try {
      if (currentPage) {
        closePage();
      }

      captureOriginalState();
      const container = createPageContainer(route.options);
      const navigationUtils = createNavigationUtils();

      currentPage = {
        route,
        params,
        container,
        cleanup: null
      };

      const query = new URLSearchParams(window.location.search);
      const queryObj = Object.fromEntries(query.entries());

      const handlerContext = {
        params,
        query: queryObj,
        navigate: navigationUtils.navigate,
        close: navigationUtils.close,
        back: navigationUtils.back
      };

      Promise.resolve(route.handler(container.content, handlerContext))
        .then(cleanup => {
          if (currentPage && typeof cleanup === 'function') {
            currentPage.cleanup = cleanup;
          }
          // Re-ensure positioning after route handler runs (in case it modified styles)
          repositionCurrentPage();
          setupFocusManagement(container.element);
        })
        .catch(error => {
          console.error('CurateRouter: Route handler error:', error);
          showErrorPage('An error occurred while loading this page.');
        });

    } catch (error) {
      console.error('CurateRouter: Navigation error:', error);
      showErrorPage('Failed to navigate to page.');
    }
  }

  function createPageContainer(options) {
    const pageElement = document.createElement('div');
    pageElement.className = 'curate-router-page';
    pageElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--md-sys-color-surface-variant);
      z-index: 1000;
      display: flex;
      flex-direction: column;
    `;

    let contentElement;

    if (options.showHeader) {
      const header = createPageHeader(options.title);
      pageElement.appendChild(header);

      contentElement = document.createElement('div');
      contentElement.className = 'curate-router-content';
      contentElement.style.cssText = `
        flex: 1;
        overflow: auto;
        padding: 20px;
        overscroll-behavior: auto;
        -webkit-overflow-scrolling: touch;
      `;
      pageElement.appendChild(contentElement);
    } else {
      contentElement = pageElement;
    }

    // Wait for desktop-container to be ready and positioned
    const positionPage = () => {
      const desktopContainer = document.querySelector('.desktop-container');

      if (desktopContainer) {
        // Get the exact position and size of desktop-container
        const rect = desktopContainer.getBoundingClientRect();

        // Check if desktop-container has been positioned (not still at 0,0 with no size)
        if (rect.width > 0 && rect.height > 0) {
          // Position custom page fixed to match desktop-container exactly
          pageElement.style.position = 'fixed';
          pageElement.style.top = rect.top + 'px';
          pageElement.style.left = rect.left + 'px';
          pageElement.style.width = rect.width + 'px';
          pageElement.style.height = rect.height + 'px';
          pageElement.style.zIndex = '901'; // High z-index to appear above page content
          pageElement.style.pointerEvents = 'auto';

          // Prevent scroll events from bubbling to prevent Pydio UI scrolling
          pageElement.addEventListener('wheel', (e) => {
            e.stopPropagation();
          }, { passive: false });

          document.body.appendChild(pageElement);
          return true; // Success
        }
      }
      return false; // Not ready yet
    };

    // Try to position immediately
    if (!positionPage()) {
      // If not ready, wait a bit and try again
      let attempts = 0;
      const checkReady = () => {
        attempts++;
        if (positionPage()) {
          // Success!
          return;
        } else if (attempts < 20) {
          // Try again after a short delay
          setTimeout(checkReady, 100);
        } else {
          // Give up and use fallback
          console.warn('CurateRouter: Could not position over .desktop-container, using body fallback');
          pageElement.style.position = 'fixed';
          pageElement.style.top = '0';
          pageElement.style.left = '0';
          pageElement.style.right = '0';
          pageElement.style.bottom = '0';
          pageElement.style.zIndex = '900';

          // Prevent scroll events from bubbling to prevent Pydio UI scrolling
          pageElement.addEventListener('wheel', (e) => {
            e.stopPropagation();
          }, { passive: false });

          document.body.appendChild(pageElement);
        }
      };
      setTimeout(checkReady, 100);
    }

    return {
      element: pageElement,
      content: contentElement
    };
  }

  function createPageHeader(title) {
    const header = document.createElement('div');
    header.className = 'curate-router-header';
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--md-sys-color-outline, #c4c7c5);
      background: var(--md-sys-color-surface-variant, #fdfcff);
    `;

    const titleElement = document.createElement('h1');
    titleElement.textContent = title;
    titleElement.style.cssText = `
      margin: 0;
      color: var(--md-sys-color-on-background, #1d1b20);
      font-size: 28px;
      font-weight: 400;
    `;

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '✕ Close';
    closeButton.addEventListener('click', closeAndReturnToUnderlying);
    closeButton.style.cssText = `
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 13px;
      cursor: pointer;
      transition: opacity 0.2s;
    `;

    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.opacity = '0.8';
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.opacity = '1';
    });

    header.appendChild(titleElement);
    header.appendChild(closeButton);

    return header;
  }

  /**
   * Close the custom page and return to the underlying Pydio URL
   */
  function closeAndReturnToUnderlying() {
    if (currentPage) {
      // Navigate to the last non-custom URL (or fallback to base path)
      const targetUrl = lastNonCustomUrl || '/';
      window.history.pushState(null, '', targetUrl);
      closePage();
    }
  }

  function createNavigationUtils() {
    return {
      navigate: (path) => navigate(path),
      close: () => back(),
      back: () => back()
    };
  }

  function captureOriginalState() {
    if (!originalContent) {
      originalContent = {
        activeElement: document.activeElement
      };
    }
  }

  function restoreOriginalContent() {
    if (originalContent && originalContent.activeElement &&
        typeof originalContent.activeElement.focus === 'function') {
      try {
        originalContent.activeElement.focus();
      } catch (e) {
        console.warn('CurateRouter: Could not restore focus');
      }
    }
  }

  function setupFocusManagement(element) {
    try {
      focusTrap = createFocusTrap(element, {
        initialFocus: element,
        escapeDeactivates: false,
        clickOutsideDeactivates: false,
        returnFocusOnDeactivate: false,
        allowOutsideClick: true  // Allow clicks outside the trap (like sidebar)
      });
      focusTrap.activate();
    } catch (error) {
      console.warn('CurateRouter: Focus trap setup failed:', error);
    }
  }

  function teardownFocusManagement() {
    if (focusTrap) {
      focusTrap.deactivate();
      focusTrap = null;
    }
  }

  function closePage() {
    if (!currentPage) return;

    teardownFocusManagement();

    if (currentPage.cleanup && typeof currentPage.cleanup === 'function') {
      try {
        currentPage.cleanup();
      } catch (error) {
        console.error('CurateRouter: Error in cleanup function:', error);
      }
    }

    if (currentPage.container && currentPage.container.element && currentPage.container.element.parentNode) {
      currentPage.container.element.remove();
    }

    restoreOriginalContent();
    currentPage = null;
    originalContent = null;
  }

  /**
   * Navigate back to the previous page using browser history
   *
   * @example
   * // Go back to previous page
   * Curate.router.back();
   */
  function back() {
    if (currentPage) {
      window.history.back();
    }
  }

  function showErrorPage(message) {
    const errorRoute = {
      handler: (container) => {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <h2 style="color: #d32f2f; margin-bottom: 16px;">Page Error</h2>
            <p style="margin-bottom: 24px;">${message}</p>
            <button onclick="Curate.router.back()"
                    style="background: #1976d2; color: white; border: none;
                           padding: 12px 24px; border-radius: 4px; cursor: pointer;">
              Go Back
            </button>
          </div>
        `;
      },
      options: { title: 'Error', showHeader: true }
    };

    navigateToRoute(errorRoute, {}, false);
  }

  /**
   * Get information about the currently active page
   *
   * @returns {Object|null} Current page information or null if no page is active
   * @returns {string} returns.path - Current URL path
   * @returns {Object} returns.params - Route parameters
   * @returns {string} returns.title - Page title
   *
   * @example
   * const currentPage = Curate.router.getCurrentPage();
   * if (currentPage) {
   *   console.log('Current page:', currentPage.title);
   *   console.log('URL path:', currentPage.path);
   *   console.log('Parameters:', currentPage.params);
   * }
   */
  function getCurrentPage() {
    return currentPage ? {
      path: window.location.pathname,
      params: currentPage.params,
      title: currentPage.route.options.title
    } : null;
  }

  /**
   * Check if a custom page is currently active
   *
   * @returns {boolean} True if a custom page is active, false otherwise
   *
   * @example
   * if (Curate.router.isActive()) {
   *   console.log('Custom page is currently active');
   * }
   */
  function isActive() {
    return currentPage !== null;
  }

  /**
   * Check if a given path is a valid registered route
   *
   * @param {string} path - The path to check (can be full path or just route path)
   * @returns {boolean} True if the path matches a registered route, false otherwise
   *
   * @example
   * // Check if current URL is a valid custom route
   * if (Curate.router.isValidRoute(window.location.pathname)) {
   *   console.log('Current URL is a valid custom route');
   * }
   *
   * @example
   * // Check a specific route
   * if (Curate.router.isValidRoute('/custom/pure-integration')) {
   *   console.log('Pure integration route exists');
   * }
   */
  function isValidRoute(path) {
    if (!path) return false;

    // If path includes the route prefix, extract just the route part
    let routePath = path;
    if (path.startsWith(routePrefix)) {
      routePath = path.substring(routePrefix.length) || '/';
    } else if (!path.startsWith('/')) {
      routePath = '/' + path;
    }

    // Check if this route matches any registered routes
    const match = findMatchingRoute(routePath);
    return match !== null;
  }

  /**
   * Manually check and navigate to current URL route
   * Useful for handling page refreshes or manual URL entry
   *
   * @example
   * // Force route checking after all routes are registered
   * Curate.router.checkRoute();
   */
  function checkRoute() {
    checkCurrentRoute();
  }

  function repositionCurrentPage() {
    if (!currentPage || !currentPage.container || !currentPage.container.element) return;

    const desktopContainer = document.querySelector('.desktop-container');
    if (desktopContainer) {
      const rect = desktopContainer.getBoundingClientRect();

      if (rect.width > 0 && rect.height > 0) {
        const pageElement = currentPage.container.element;
        // Reapply critical positioning styles that might have been overridden
        pageElement.style.position = 'fixed';
        pageElement.style.top = rect.top + 'px';
        pageElement.style.left = rect.left + 'px';
        pageElement.style.width = rect.width + 'px';
        pageElement.style.height = rect.height + 'px';
        pageElement.style.zIndex = '901';
        pageElement.style.pointerEvents = 'auto';
      }
    }
  }

  return {
    initialize,
    addRoute,
    navigate,
    back,
    getCurrentPage,
    isActive,
    isValidRoute,
    checkRoute
  };
})();

export default CurateRouter;
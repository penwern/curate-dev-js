import { Curate } from '../../core/CurateFunctions/CurateFunctions.js';

/**
 * [Route Name] Route Template
 *
 * This is a template for creating new custom page routes.
 * Replace [Route Name], [route-path], and [custom-element-name] with your actual values.
 *
 * @example
 * // 1. Copy this file and rename it to your route name (e.g., my-feature.js)
 * // 2. Replace all [placeholders] with your actual values
 * // 3. Import and register in routes/index.js
 */

/**
 * Register the [Route Name] route
 */
export function register[RouteName]Route() {
  Curate.router.addRoute('/[route-path]', async (container) => {
    // Configure container styling
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

    // IMPORTANT: Wait for custom element to be defined before creating it
    // This prevents race conditions on page refresh where the component
    // registration may not have completed yet
    await customElements.whenDefined('[custom-element-name]');

    // Create your custom element
    const element = document.createElement('[custom-element-name]');
    element.style.cssText = `
      display: block;
      width: 100%;
    `;

    // Optional: Set properties on your element
    // element.someProp = 'value';

    // Add element to container
    container.appendChild(element);

    // Return cleanup function to properly dispose of the component
    return () => {
      if (element && element.parentNode) {
        element.remove();
      }
    };
  }, {
    title: '[Route Display Title]',
    showHeader: true  // Set to false if your component has its own header
  });
}

/**
 * ADVANCED: Route with parameters
 *
 * @example
 * // Route pattern: '/users/:userId/posts/:postId'
 * export function registerUserPostRoute() {
 *   Curate.router.addRoute('/users/:userId/posts/:postId', async (container, context) => {
 *     const { userId, postId } = context.params;  // Access route parameters
 *     const { tab } = context.query;              // Access query parameters (?tab=comments)
 *
 *     await customElements.whenDefined('user-post-viewer');
 *     const viewer = document.createElement('user-post-viewer');
 *     viewer.userId = userId;
 *     viewer.postId = postId;
 *     viewer.activeTab = tab || 'overview';
 *
 *     container.appendChild(viewer);
 *
 *     return () => viewer.remove();
 *   }, {
 *     title: 'User Post',
 *     showHeader: true
 *   });
 * }
 */

/**
 * ADVANCED: Route with manual header (when showHeader: false)
 *
 * @example
 * export function registerCustomHeaderRoute() {
 *   Curate.router.addRoute('/custom-header', async (container, context) => {
 *     container.style.cssText = `
 *       padding: 20px;
 *       background: var(--md-sys-color-surface-variant, #fdfcff);
 *       min-height: 100%;
 *       height: 100%;
 *       width: 100%;
 *       overflow: auto;
 *     `;
 *
 *     // Create custom header
 *     const header = document.createElement('div');
 *     header.style.cssText = `
 *       display: flex;
 *       justify-content: space-between;
 *       align-items: center;
 *       margin-bottom: 20px;
 *       padding-bottom: 16px;
 *       border-bottom: 1px solid var(--md-sys-color-outline, #c4c7c5);
 *     `;
 *
 *     const title = document.createElement('h1');
 *     title.textContent = 'Custom Header Title';
 *     title.style.cssText = `
 *       margin: 0;
 *       color: var(--md-sys-color-on-background, #1d1b20);
 *       font-size: 28px;
 *       font-weight: 400;
 *     `;
 *
 *     header.appendChild(title);
 *     container.appendChild(header);
 *
 *     // Add your component
 *     await customElements.whenDefined('my-component');
 *     const component = document.createElement('my-component');
 *     container.appendChild(component);
 *
 *     return () => component.remove();
 *   }, {
 *     title: 'Custom Page',
 *     showHeader: false
 *   });
 * }
 */

/**
 * CHECKLIST for creating a new route:
 *
 * □ Copy and rename this file to your route name
 * □ Replace all [placeholders] with your actual values
 * □ Ensure your custom element is registered before this route is loaded
 * □ Always use async route handler if using custom elements
 * □ Always await customElements.whenDefined() before createElement()
 * □ Import your route registration function in routes/index.js
 * □ Call your registration function in registerAllRoutes()
 * □ Test page refresh with dev tools closed to verify no race condition
 */

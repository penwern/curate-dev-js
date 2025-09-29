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

/**
 * Register simple demo route
 */
function registerDemoRoutes() {
  // Simple demo page
  Curate.router.addRoute('/demo', (container, { close }) => {
    container.innerHTML = `
      <div style="padding: 60px; max-width: 500px; margin: 0 auto; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <h1 style="margin: 0 0 20px 0; font-size: 32px; font-weight: 300;">🚀 Curate Router</h1>
          <p style="margin: 0 0 30px 0; font-size: 18px; opacity: 0.9;">
            Custom page routing for Pydio Cells Enterprise
          </p>
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <p style="margin: 0; font-size: 14px;">
              ✅ Browser history integration<br>
              ✅ Focus management & accessibility<br>
              ✅ Clean Pydio integration
            </p>
          </div>
          <button id="close-demo" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 12px 30px; border-radius: 6px; cursor: pointer; font-size: 16px; transition: all 0.2s;">
            Close Demo
          </button>
        </div>
      </div>
    `;

    // Style the button on hover
    const closeBtn = container.querySelector('#close-demo');
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,0.3)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255,255,255,0.2)';
    closeBtn.onclick = close;
  }, { title: 'Curate Router Demo' });

  console.log('Demo route registered: /custom/demo');

  // Force route check now that routes are registered
  Curate.router.checkRoute();
}

export { initializeRouter, registerDemoRoutes };
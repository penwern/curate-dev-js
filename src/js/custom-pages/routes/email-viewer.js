import { Curate } from '../../core/CurateFunctions/CurateFunctions.js';

/**
 * Email Viewer Route
 * Renders the email viewer components inside the custom page container.
 */
export function registerEmailViewerRoute() {
  Curate.router.addRoute('/render-email', async (container, { params } = {}) => {
    const {
      archiveWorkspace = 'personal',
      archivePath = '/test.mbox',
      archiveMode = 'curate'
    } = params || {};

    // Wait for the custom element to be defined before creating it
    await customElements.whenDefined('email-viewer');

    // Create container with compact styling for the custom page content
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      flex: 1;
      padding: 12px;
      gap: 12px;
      background: transparent;
      box-sizing: border-box;
      min-height: 0;
      height: 100%;
      width: 100%;
      overflow: auto;
      overscroll-behavior: auto;
      -webkit-overflow-scrolling: touch;
    `;

    // Create the email viewer component
    const emailUi = document.createElement('email-viewer');
    emailUi.archiveMode = archiveMode;
    emailUi.archiveWorkspace = archiveWorkspace;
    emailUi.archivePath = archivePath;
    emailUi.style.cssText = `
      display: block;
      width: 100%;
      flex: 1;
      min-height: 0;
      height: 100%;
    `;

    container.appendChild(emailUi);

    // Return cleanup function
    return () => {
      if (emailUi && emailUi.parentNode) {
        emailUi.remove();
      }
    };
  }, {
    title: 'Email Viewer',
    showHeader: true,
    allowUrlAccess: false
  });
}

export function openEmailViewerPage(params = {}, overrides = {}) {
  Curate.router.open('/render-email', params, overrides);
}

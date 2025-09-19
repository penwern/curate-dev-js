/**
 * UploadInterceptor System Initialization
 *
 * This file initializes the upload interceptor system and registers plugins.
 * Import this file to activate the upload interception system.
 */

import UploadInterceptor from './UploadInterceptor.js';
import ChecksumValidationPlugin from './plugins/ChecksumValidation/ChecksumValidation.js';
import UploadVolumeChecker from './plugins/UploadVolumeChecker/UploadVolumeChecker.js';

// Initialize the upload interceptor system when DOM loads
window.addEventListener("load", () => {
  console.log('UploadInterceptor: Initializing upload interception system');

  // Register plugins
  UploadInterceptor.register(ChecksumValidationPlugin);
  UploadInterceptor.register(UploadVolumeChecker);

  console.log('UploadInterceptor: System initialized with plugins:', UploadInterceptor.getRegisteredPlugins());
});

export default UploadInterceptor;
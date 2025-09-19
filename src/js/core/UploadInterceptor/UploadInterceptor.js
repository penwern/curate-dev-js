/**
 * UploadInterceptor - Orchestrates upload interception and plugin system
 *
 * This class manages the monkey patching of Pydio's upload system and
 * provides a plugin architecture for extending upload functionality.
 */
class UploadInterceptor {
  constructor() {
    this.plugins = new Map();
    this.isPatched = false;
    this.originalUploadPresigned = null;
  }

  /**
   * Register a plugin with the upload interceptor
   * @param {Object} plugin - Plugin object with name and hooks
   * @param {string} plugin.name - Unique plugin name
   * @param {Object} plugin.hooks - Event hooks object
   * @param {Function} [plugin.hooks.beforeUpload] - Called before upload starts
   * @param {Function} [plugin.hooks.onUploadComplete] - Called when upload completes
   * @param {Function} [plugin.hooks.onUploadError] - Called when upload errors
   * @param {Function} [plugin.hooks.onStatusChange] - Called when upload status changes
   */
  register(plugin) {
    if (!plugin.name) {
      throw new Error('Plugin must have a name');
    }

    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin '${plugin.name}' is already registered. Overwriting.`);
    }

    this.plugins.set(plugin.name, plugin);
    console.log(`UploadInterceptor: Registered plugin '${plugin.name}'`);

    // If we haven't patched yet, patch now that we have plugins
    if (!this.isPatched) {
      this.patchUploadSystem();
    }
  }

  /**
   * Unregister a plugin
   * @param {string} pluginName - Name of plugin to remove
   */
  unregister(pluginName) {
    if (this.plugins.delete(pluginName)) {
      console.log(`UploadInterceptor: Unregistered plugin '${pluginName}'`);
    }
  }

  /**
   * Get list of registered plugin names
   * @returns {string[]} Array of plugin names
   */
  getRegisteredPlugins() {
    return Array.from(this.plugins.keys());
  }

  /**
   * Monkey patch the Pydio upload system
   */
  patchUploadSystem() {
    if (this.isPatched) {
      console.warn('UploadInterceptor: Upload system already patched');
      return;
    }

    this.isPatched = true; // Set immediately to prevent double calls

    // Wait for UploaderModel to be available
    this.waitForUploaderModel().then(() => {
      this.applyUploadPatch();
    });
  }

  /**
   * Wait for UploaderModel to be defined in the global scope
   * @returns {Promise<void>}
   */
  async waitForUploaderModel() {
    while (typeof UploaderModel === "undefined" || !UploaderModel.UploadItem) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Apply the actual upload system patch
   */
  applyUploadPatch() {
    // Store the original uploadPresigned function
    this.originalUploadPresigned = UploaderModel.UploadItem.prototype.uploadPresigned;

    // Override the uploadPresigned method
    UploaderModel.UploadItem.prototype.uploadPresigned = this.createPatchedUploadMethod();

    console.log('UploadInterceptor: Successfully patched upload system');
  }

  /**
   * Create the patched upload method
   * @returns {Function} Patched upload method
   */
  createPatchedUploadMethod() {
    const self = this;

    return function() {
      // 'this' refers to the UploaderModel.UploadItem instance
      const uploadItem = this;

      // Call beforeUpload hooks first to allow blocking
      const shouldProceed = self.callPluginHooks('beforeUpload', uploadItem);

      // If any plugin returned false, block the upload
      if (shouldProceed === false) {
        console.log('UploadInterceptor: Upload blocked by plugin for:', uploadItem._label);
        return Promise.reject(new Error('Upload blocked by volume checker'));
      }

      // Execute the original upload logic
      const originalPromise = self.originalUploadPresigned.apply(uploadItem, arguments);

      // Create observer to watch for upload status changes
      const observer = (status) => {
        // Call onStatusChange hooks
        self.callPluginHooks('onStatusChange', uploadItem, status);

        // Handle upload completion
        if (status === "loaded") {
          // Remove observer to prevent multiple calls
          self.removeObserver(uploadItem, observer);

          // Call onUploadComplete hooks
          self.callPluginHooks('onUploadComplete', uploadItem);
        } else if (status === "error") {
          // Remove observer
          self.removeObserver(uploadItem, observer);

          // Call onUploadError hooks
          self.callPluginHooks('onUploadError', uploadItem);
        }
      };

      // Add observer to the upload item
      self.addObserver(uploadItem, observer);

      return originalPromise;
    };
  }

  /**
   * Call a specific hook on all registered plugins
   * @param {string} hookName - Name of hook to call
   * @param {...any} args - Arguments to pass to hook
   * @returns {any} For beforeUpload, returns false if any plugin blocks, otherwise undefined
   */
  callPluginHooks(hookName, ...args) {
    for (const [pluginName, plugin] of this.plugins) {
      try {
        if (plugin.hooks && typeof plugin.hooks[hookName] === 'function') {
          const result = plugin.hooks[hookName].call(plugin, ...args);

          // For beforeUpload hook, if any plugin returns false, block the upload
          if (hookName === 'beforeUpload' && result === false) {
            console.log(`UploadInterceptor: Plugin '${pluginName}' blocked upload`);
            return false;
          }
        }
      } catch (error) {
        console.error(`UploadInterceptor: Error in plugin '${pluginName}' hook '${hookName}':`, error);

        // For beforeUpload, treat errors as blocking
        if (hookName === 'beforeUpload') {
          console.log(`UploadInterceptor: Plugin '${pluginName}' error treated as block`);
          return false;
        }
      }
    }
  }

  /**
   * Add observer to upload item
   * @param {Object} uploadItem - Upload item instance
   * @param {Function} observer - Observer function
   */
  addObserver(uploadItem, observer) {
    if (!uploadItem._observers) uploadItem._observers = {};
    if (!uploadItem._observers.status) uploadItem._observers.status = [];

    if (!uploadItem._observers.status.includes(observer)) {
      uploadItem._observers.status.push(observer);
    }
  }

  /**
   * Remove observer from upload item
   * @param {Object} uploadItem - Upload item instance
   * @param {Function} observer - Observer function to remove
   */
  removeObserver(uploadItem, observer) {
    if (uploadItem._observers && uploadItem._observers.status) {
      const index = uploadItem._observers.status.indexOf(observer);
      if (index > -1) {
        uploadItem._observers.status.splice(index, 1);
      }
    }
  }

  /**
   * Restore the original upload system (for testing/cleanup)
   */
  unpatch() {
    if (this.isPatched && this.originalUploadPresigned) {
      UploaderModel.UploadItem.prototype.uploadPresigned = this.originalUploadPresigned;
      this.isPatched = false;
      console.log('UploadInterceptor: Unpatched upload system');
    }
  }
}

// Create singleton instance
const uploadInterceptor = new UploadInterceptor();

export default uploadInterceptor;
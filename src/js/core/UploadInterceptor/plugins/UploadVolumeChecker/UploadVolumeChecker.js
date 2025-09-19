import CurateUi from '../../../CurateFunctions/CurateUi.js';

/**
 * UploadVolumeChecker Plugin
 *
 * Monitors and restricts upload volume based on configurable thresholds.
 * Provides warnings and blocks uploads that exceed specified limits.
 */

export default {
  name: 'UploadVolumeChecker',

  // Configuration (can be made configurable later)
  config: {
    maxFileCount: 100,         // Maximum number of files in a single upload (lowered for testing)
    warningFileCount: 50,      // Show warning at this threshold
    maxTotalSize: 10 * 1024 * 1024 * 1024, // 10GB max total size
    warningTotalSize: 5 * 1024 * 1024 * 1024,  // 5GB warning threshold
    blockUploads: true,        // For experimentation - blocks uploads above threshold
  },

  // Track current upload session
  currentUploadSession: {
    fileCount: 0,
    totalSize: 0,
    files: [],
    isBlocked: false,
  },

  hooks: {
    beforeUpload: function(uploadItem) {
      // 'this' refers to the plugin object due to .call() in UploadInterceptor
      const config = this.config;
      const session = this.currentUploadSession;

      console.log('UploadVolumeChecker: Checking upload volume for:', uploadItem._label);

      // If this is the first file in a new session, reset counters
      if (session.fileCount === 0) {
        session.files = [];
        session.totalSize = 0;
        session.isBlocked = false;
        console.log('UploadVolumeChecker: Starting new upload session');
      }

      // Add current file to session tracking
      session.fileCount++;
      session.totalSize += uploadItem._file.size;
      session.files.push({
        name: uploadItem._label,
        size: uploadItem._file.size,
        path: uploadItem._file.webkitRelativePath || uploadItem._label
      });

      console.log(`UploadVolumeChecker: Session stats - Files: ${session.fileCount}, Total Size: ${(session.totalSize / 1024 / 1024).toFixed(2)}MB`);

      // Check thresholds
      const exceedsMaxFiles = session.fileCount > config.maxFileCount;
      const exceedsWarningFiles = session.fileCount > config.warningFileCount;
      const exceedsMaxSize = session.totalSize > config.maxTotalSize;
      const exceedsWarningSize = session.totalSize > config.warningTotalSize;

      // Determine action needed
      if (exceedsMaxFiles || exceedsMaxSize) {
        // Block upload
        session.isBlocked = true;
        this.showBlockingModal(session, config);
        return false; // Block the upload
      } else if (exceedsWarningFiles || exceedsWarningSize) {
        // Show warning but allow upload
        this.showWarningModal(session, config);
      }

      return true; // Allow upload to proceed
    },

    onUploadComplete: (uploadItem) => {
      console.log('UploadVolumeChecker: Upload completed for:', uploadItem._label);
      // Note: We don't reset session here as multiple files might be uploading concurrently
    },

    onUploadError: (uploadItem) => {
      console.log('UploadVolumeChecker: Upload failed for:', uploadItem._label);
      // Could implement error tracking here
    }
  },

  // Show blocking modal when limits are exceeded
  showBlockingModal: function(session, config) {
    const fileCountIssue = session.fileCount > config.maxFileCount;
    const sizeIssue = session.totalSize > config.maxTotalSize;

    let message = 'Upload blocked due to volume limits:\n\n';

    if (fileCountIssue) {
      message += `• File count: ${session.fileCount} files (limit: ${config.maxFileCount})\n`;
    }

    if (sizeIssue) {
      const sizeMB = (session.totalSize / 1024 / 1024).toFixed(2);
      const limitMB = (config.maxTotalSize / 1024 / 1024).toFixed(2);
      message += `• Total size: ${sizeMB}MB (limit: ${limitMB}MB)\n`;
    }

    message += '\nPlease reduce the number of files or total size and try again.';

    const popup = new CurateUi.modals.curatePopup(
      {
        title: 'Upload Volume Limit Exceeded',
        message: message,
        type: 'error',
        buttonType: 'close'
      },
      {
        afterLoaded: () => {
          console.log('UploadVolumeChecker: Blocking modal displayed');
        },
        afterClosed: () => {
          console.log('UploadVolumeChecker: Blocking modal closed');
          // Reset session after user acknowledges
          this.resetSession();
        }
      }
    );

    popup.fire();
  },

  // Show warning modal when approaching limits
  showWarningModal: function(session, config) {
    const fileCountWarning = session.fileCount > config.warningFileCount;
    const sizeWarning = session.totalSize > config.warningTotalSize;

    let message = 'Upload volume warning:\n\n';

    if (fileCountWarning) {
      message += `• File count: ${session.fileCount} files (warning threshold: ${config.warningFileCount})\n`;
    }

    if (sizeWarning) {
      const sizeMB = (session.totalSize / 1024 / 1024).toFixed(2);
      const warnMB = (config.warningTotalSize / 1024 / 1024).toFixed(2);
      message += `• Total size: ${sizeMB}MB (warning threshold: ${warnMB}MB)\n`;
    }

    message += '\nConsider breaking this into smaller uploads for better performance.';

    const popup = new CurateUi.modals.curatePopup(
      {
        title: 'Large Upload Volume Detected',
        message: message,
        type: 'warning',
        buttonType: 'close'
      },
      {
        afterLoaded: () => {
          console.log('UploadVolumeChecker: Warning modal displayed');
        },
        afterClosed: () => {
          console.log('UploadVolumeChecker: Warning modal closed');
        }
      }
    );

    popup.fire();
  },

  // Reset the current upload session
  resetSession: function() {
    this.currentUploadSession = {
      fileCount: 0,
      totalSize: 0,
      files: [],
      isBlocked: false,
    };
    console.log('UploadVolumeChecker: Session reset');
  },

  // Get current session statistics
  getSessionStats: function() {
    return {
      ...this.currentUploadSession,
      totalSizeMB: (this.currentUploadSession.totalSize / 1024 / 1024).toFixed(2)
    };
  }
};
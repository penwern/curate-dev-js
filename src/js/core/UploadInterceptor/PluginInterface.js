/**
 * Plugin Interface Documentation
 *
 * This file documents the expected structure for UploadInterceptor plugins.
 * Plugins should export an object with the following structure:
 */

/**
 * Example plugin structure:
 *
 * export default {
 *   name: 'ExamplePlugin',
 *
 *   hooks: {
 *     // Called before upload starts
 *     beforeUpload: (uploadItem) => {
 *       console.log('Upload starting for:', uploadItem._label);
 *     },
 *
 *     // Called when upload status changes
 *     onStatusChange: (uploadItem, status) => {
 *       console.log('Upload status changed to:', status);
 *     },
 *
 *     // Called when upload completes successfully
 *     onUploadComplete: (uploadItem) => {
 *       console.log('Upload completed for:', uploadItem._label);
 *     },
 *
 *     // Called when upload encounters an error
 *     onUploadError: (uploadItem) => {
 *       console.error('Upload failed for:', uploadItem._label);
 *     }
 *   }
 * };
 */

/**
 * Available uploadItem properties (from UploaderModel.UploadItem):
 * - _file: The File object being uploaded
 * - _label: Display name of the file
 * - _targetNode: Destination node information
 * - _observers: Observer system for status changes
 * - Plus other Pydio-specific properties
 */

/**
 * Hook execution order:
 * 1. beforeUpload - Called immediately when upload starts
 * 2. onStatusChange - Called for each status change during upload
 * 3. onUploadComplete OR onUploadError - Called when upload finishes
 */

export default {
  // This file is for documentation only
  // Actual plugins should be in the plugins/ directory
};
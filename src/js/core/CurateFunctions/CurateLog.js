/**
 * CurateLog - Conditional logging utility
 *
 * Provides debug logging that can be toggled via window.curateDebug flag.
 * Supports all console methods with proper argument handling.
 */

const CurateLog = {
  /**
   * Log message (only when window.curateDebug is true)
   * @param {...any} args - Arguments to pass to console.log
   */
  log(...args) {
    if (window.curateDebug) {
      console.log(...args);
    }
  },

  /**
   * Log warning (only when window.curateDebug is true)
   * @param {...any} args - Arguments to pass to console.warn
   */
  warn(...args) {
    if (window.curateDebug) {
      console.warn(...args);
    }
  },

  /**
   * Log error (only when window.curateDebug is true)
   * @param {...any} args - Arguments to pass to console.error
   */
  error(...args) {
    if (window.curateDebug) {
      console.error(...args);
    }
  },

  /**
   * Log info (only when window.curateDebug is true)
   * @param {...any} args - Arguments to pass to console.info
   */
  info(...args) {
    if (window.curateDebug) {
      console.info(...args);
    }
  },

  /**
   * Log debug (only when window.curateDebug is true)
   * @param {...any} args - Arguments to pass to console.debug
   */
  debug(...args) {
    if (window.curateDebug) {
      console.debug(...args);
    }
  },

  /**
   * Check if debug mode is enabled
   * @returns {boolean} True if debug logging is enabled
   */
  isEnabled() {
    return !!window.curateDebug;
  }
};

export default CurateLog;

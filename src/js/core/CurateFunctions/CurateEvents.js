class EventDelegator {
  constructor() {
    this.handlers = new Map(); // eventType -> Map(handlerId -> {selector, callback, options})
    this.nextHandlerId = 1;
    this.documentListeners = new Set(); // Track which event types we're listening for
  }

  /**
   * Add a delegated event listener
   * @param {string} selector - CSS selector to match elements
   * @param {string} type - Event type (e.g., 'click', 'mousedown')
   * @param {Function} callback - Event handler function
   * @param {Object|boolean} options - Event listener options
   * @returns {number} Handler ID for removal
   */
  addEventListener(selector, type, callback, options = {}) {
    if (typeof selector !== "string" || !selector.trim()) {
      throw new Error("Selector must be a non-empty string");
    }
    if (typeof type !== "string" || !type.trim()) {
      throw new Error("Event type must be a non-empty string");
    }
    if (typeof callback !== "function") {
      throw new Error("Callback must be a function");
    }

    const handlerId = this.nextHandlerId++;

    // Normalize options (handle boolean for useCapture)
    const normalizedOptions =
      typeof options === "boolean" ? { capture: options } : { ...options };

    // Ensure we have a document listener for this event type
    this._ensureDocumentListener(type, normalizedOptions.capture);

    // Store the handler
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Map());
    }

    this.handlers.get(type).set(handlerId, {
      selector,
      callback,
      options: normalizedOptions,
    });

    return handlerId;
  }

  /**
   * Remove a delegated event listener
   * @param {number} handlerId - Handler ID returned by addEventListener
   * @returns {boolean} True if handler was found and removed
   */
  removeEventListener(handlerId) {
    for (const [eventType, handlersMap] of this.handlers) {
      if (handlersMap.has(handlerId)) {
        handlersMap.delete(handlerId);

        // Clean up empty maps and document listeners if no handlers remain
        if (handlersMap.size === 0) {
          this.handlers.delete(eventType);
          this._cleanupDocumentListener(eventType);
        }

        return true;
      }
    }
    return false;
  }

  /**
   * Remove all handlers for a specific selector and event type
   * @param {string} selector - CSS selector
   * @param {string} type - Event type
   * @returns {number} Number of handlers removed
   */
  removeEventListeners(selector, type) {
    if (!this.handlers.has(type)) return 0;

    const handlersMap = this.handlers.get(type);
    let removed = 0;

    for (const [handlerId, handler] of handlersMap) {
      if (handler.selector === selector) {
        handlersMap.delete(handlerId);
        removed++;
      }
    }

    // Clean up if no handlers remain
    if (handlersMap.size === 0) {
      this.handlers.delete(type);
      this._cleanupDocumentListener(type);
    }

    return removed;
  }

  /**
   * Remove all handlers
   */
  removeAllEventListeners() {
    // Clean up all document listeners
    for (const eventType of this.documentListeners) {
      document.removeEventListener(
        eventType,
        this._getDocumentHandler(eventType),
        true
      );
      document.removeEventListener(
        eventType,
        this._getDocumentHandler(eventType),
        false
      );
    }

    this.handlers.clear();
    this.documentListeners.clear();
  }

  /**
   * Get count of active handlers
   * @returns {number} Total number of active handlers
   */
  getHandlerCount() {
    let count = 0;
    for (const handlersMap of this.handlers.values()) {
      count += handlersMap.size;
    }
    return count;
  }

  /**
   * Ensure document listener exists for event type
   * @private
   */
  _ensureDocumentListener(eventType, useCapture = false) {
    const listenerKey = `${eventType}-${useCapture}`;

    if (!this.documentListeners.has(listenerKey)) {
      const handler = this._createDocumentHandler(eventType);
      document.addEventListener(eventType, handler, useCapture);
      this.documentListeners.add(listenerKey);

      // Store handler reference for cleanup
      this[`_${listenerKey}Handler`] = handler;
    }
  }

  /**
   * Create document-level event handler
   * @private
   */
  _createDocumentHandler(eventType) {
    return (event) => {
      const handlersMap = this.handlers.get(eventType);
      if (!handlersMap) return;

      for (const { selector, callback, options } of handlersMap.values()) {
        let targetElement = null;

        // Check if event target matches selector
        if (event.target.matches && event.target.matches(selector)) {
          targetElement = event.target;
        }
        // Check if any parent matches selector (event delegation)
        else if (event.target.closest) {
          targetElement = event.target.closest(selector);
        }

        if (targetElement) {
          try {
            // Handle once option
            if (options.once) {
              // Find and remove this specific handler
              for (const [handlerId, handler] of handlersMap) {
                if (
                  handler.selector === selector &&
                  handler.callback === callback
                ) {
                  this.removeEventListener(handlerId);
                  break;
                }
              }
            }

            // Call the callback with the matched element as context
            callback.call(targetElement, event);
          } catch (error) {
            console.error("Error in delegated event handler:", error);
          }
        }
      }
    };
  }

  /**
   * Clean up document listener if no handlers remain
   * @private
   */
  _cleanupDocumentListener(eventType) {
    const captureKey = `${eventType}-true`;
    const bubbleKey = `${eventType}-false`;

    // Check if we still need listeners for this event type
    const stillHasHandlers =
      this.handlers.has(eventType) && this.handlers.get(eventType).size > 0;

    if (!stillHasHandlers) {
      if (this.documentListeners.has(captureKey)) {
        document.removeEventListener(
          eventType,
          this[`_${captureKey}Handler`],
          true
        );
        this.documentListeners.delete(captureKey);
        delete this[`_${captureKey}Handler`];
      }

      if (this.documentListeners.has(bubbleKey)) {
        document.removeEventListener(
          eventType,
          this[`_${bubbleKey}Handler`],
          false
        );
        this.documentListeners.delete(bubbleKey);
        delete this[`_${bubbleKey}Handler`];
      }
    }
  }

  /**
   * Get document handler reference
   * @private
   */
  _getDocumentHandler(eventType) {
    return this[`_${eventType}Handler`];
  }
}

// Create and export singleton instance
const eventDelegator = new EventDelegator();

export default eventDelegator;

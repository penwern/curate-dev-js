const DEFAULT_DOCK_ICON_CLASS = "mdi-window-restore";
const MODAL_MOTION_CLASS = "curate-modal-motion";
const MODAL_MOTION_PANEL_CLASS = "curate-modal-motion-panel";
const MODAL_MOTION_ACTIVE_CLASS = "curate-modal-motion-active";
const MODAL_MOTION_EXITING_CLASS = "curate-modal-motion-exit";
const MODAL_VIEW_TRANSITION_PANEL = "curate-modal-panel";
const MODAL_STYLE_ID = "curate-modal-enhancements";
const MODAL_STYLE_CONTENT = `
.config-modal-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
}
.config-modal-content .action-buttons {
  justify-content: flex-start !important;
  gap: 1em;
  width: 100%;
}
.config-modal-action-button {
  flex: 1 1 0;
  width: auto !important;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.6em;
  border-radius: 0.5em;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}
.config-modal-action-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--md-sys-color-outline);
}
.config-modal-minimize-button {
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-background);
}
.config-modal-minimize-button:hover,
.config-modal-minimize-button:focus {
  background-color: var(--md-sys-color-secondary);
  color: var(--md-sys-color-on-secondary);
}
.config-modal-dock {
  position: fixed;
  right: 1.5em;
  bottom: 1.5em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  z-index: 1490;
}
.config-modal-dock-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  border: none;
  border-radius: 999px;
  padding: 0.35em 0.85em;
  box-shadow: 0px 4px 12px var(--md-sys-color-shadow);
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-background);
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}
.config-modal-dock-item:hover {
  background: var(--md-sys-color-primary);
  transform: translateY(-2px);
}
.config-modal-dock-item:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--md-sys-color-outline);
}
.config-modal-dock-item-label {
  font-size: 0.85rem;
  white-space: nowrap;
}
.config-modal-dock-item .mdi {
  font-size: 1.1rem;
  line-height: 1;
}
.config-modal-dock-item .mdi,
.config-modal-dock-item-label {
  color: inherit;
}
.config-modal-dock-item-badge {
  min-width: 1.4em;
  height: 1.4em;
  border-radius: 999px;
  background: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  padding: 0 0.35em;
  font-weight: 600;
}
.config-modal-container.${MODAL_MOTION_CLASS} {
  opacity: 0;
  background-color: rgba(12, 15, 28, 0.35);
  backdrop-filter: blur(0px) saturate(110%);
  -webkit-backdrop-filter: blur(0px) saturate(110%);
  transition:
    opacity 220ms ease,
    background-color 320ms ease,
    backdrop-filter 320ms ease,
    -webkit-backdrop-filter 320ms ease;
}
.config-modal-container.${MODAL_MOTION_CLASS}.${MODAL_MOTION_ACTIVE_CLASS} {
  opacity: 1;
  background-color: rgba(12, 15, 28, 0.6);
  backdrop-filter: blur(8px) saturate(145%);
  -webkit-backdrop-filter: blur(8px) saturate(145%);
}
.config-modal-container.${MODAL_MOTION_CLASS}.${MODAL_MOTION_EXITING_CLASS} {
  opacity: 0;
  background-color: rgba(12, 15, 28, 0.25);
  backdrop-filter: blur(0px) saturate(110%);
  -webkit-backdrop-filter: blur(0px) saturate(110%);
}
.config-modal-content.${MODAL_MOTION_PANEL_CLASS} {
  opacity: 0;
  transform: translate3d(0, 18px, 0) scale(0.975);
  filter: saturate(92%);
  box-shadow: 0px 12px 34px rgba(9, 9, 16, 0.22),
    0px 5px 18px rgba(9, 9, 16, 0.16);
  isolation: isolate;
  will-change: transform, opacity, filter;
  view-transition-name: ${MODAL_VIEW_TRANSITION_PANEL};
  transition:
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 220ms ease,
    filter 260ms ease,
    box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1);
}
.config-modal-content.${MODAL_MOTION_PANEL_CLASS}.${MODAL_MOTION_ACTIVE_CLASS} {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
  filter: saturate(100%);
  box-shadow: 0px 24px 65px rgba(9, 9, 16, 0.35),
    0px 16px 32px rgba(9, 9, 16, 0.3);
}
.config-modal-content.${MODAL_MOTION_PANEL_CLASS}.${MODAL_MOTION_EXITING_CLASS} {
  opacity: 0;
  transform: translate3d(0, 10px, 0) scale(0.985);
  filter: saturate(86%);
  box-shadow: 0px 10px 28px rgba(9, 9, 16, 0.18),
    0px 4px 16px rgba(9, 9, 16, 0.16);
}
::view-transition-old(${MODAL_VIEW_TRANSITION_PANEL}) {
  animation: curate-modal-panel-out 260ms cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
}
::view-transition-new(${MODAL_VIEW_TRANSITION_PANEL}) {
  animation: curate-modal-panel-in 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
@keyframes curate-modal-panel-in {
  from {
    opacity: 0;
    transform: translate3d(0, 24px, 0) scale(0.95);
    filter: saturate(0.88);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
    filter: saturate(1);
  }
}
@keyframes curate-modal-panel-out {
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
    filter: saturate(1);
  }
  to {
    opacity: 0;
    transform: translate3d(0, 16px, 0) scale(0.97);
    filter: saturate(0.85);
  }
}
@media (prefers-reduced-motion: reduce) {
  .config-modal-container.${MODAL_MOTION_CLASS},
  .config-modal-content.${MODAL_MOTION_PANEL_CLASS} {
    transition: none !important;
    animation: none !important;
  }
}
`;

function ensureModalEnhancementStyles() {
  if (typeof document === "undefined") {
    return;
  }
  if (document.getElementById(MODAL_STYLE_ID)) {
    return;
  }

  const styleTag = document.createElement("style");
  styleTag.id = MODAL_STYLE_ID;
  styleTag.textContent = MODAL_STYLE_CONTENT;
  document.head.appendChild(styleTag);
}

/**
 * Internal manager that keeps track of minimized modals and renders the dock UI.
 */
const CurateModalDock = (() => {
  let dockElement = null;
  const entries = new Map();
  function normalizeIconClass(iconClass) {
    if (typeof iconClass !== "string") {
      return DEFAULT_DOCK_ICON_CLASS;
    }
    const trimmed = iconClass.trim();
    return trimmed.length ? trimmed : DEFAULT_DOCK_ICON_CLASS;
  }

  function applyDockIcon(iconElement, iconClass) {
    const resolved = normalizeIconClass(iconClass);
    iconElement.className = "";
    iconElement.classList.add("mdi");
    resolved.split(/\s+/).forEach((cls) => {
      if (!cls || cls === "mdi") {
        return;
      }
      if (cls.startsWith("mdi-")) {
        iconElement.classList.add(cls);
      } else {
        iconElement.classList.add(`mdi-${cls}`);
      }
    });
    return resolved;
  }

  function ensureDock() {
    if (!dockElement) {
      dockElement = document.createElement("div");
      dockElement.classList.add("config-modal-dock");
      document.body.appendChild(dockElement);
    }
  }

  function destroyDockIfEmpty() {
    if (dockElement && entries.size === 0) {
      dockElement.remove();
      dockElement = null;
    }
  }

  function createDockEntry(id, labelText, iconClass, onRestore, ariaLabel) {
    ensureDock();
    const displayLabel =
      typeof labelText === "string" ? labelText.trim() : "";
    let accessibleLabel =
      typeof ariaLabel === "string" && ariaLabel.trim()
        ? ariaLabel.trim()
        : displayLabel || "Modal";

    let entry = entries.get(id);
    if (entry) {
      entry.updateLabel(displayLabel, accessibleLabel);
      entry.updateIcon(iconClass);
      return entry;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("config-modal-dock-item");
    button.setAttribute("aria-expanded", "false");
    button.title = accessibleLabel;
    button.setAttribute("aria-label", accessibleLabel);

    const iconElem = document.createElement("i");
    iconElem.setAttribute("aria-hidden", "true");
    const resolvedIcon = applyDockIcon(iconElem, iconClass);

    const labelSpan = document.createElement("span");
    labelSpan.classList.add("config-modal-dock-item-label");
    labelSpan.textContent = displayLabel;
    labelSpan.hidden = !displayLabel;

    const badgeSpan = document.createElement("span");
    badgeSpan.classList.add("config-modal-dock-item-badge");
    badgeSpan.setAttribute("aria-hidden", "true");
    badgeSpan.hidden = true;

    button.appendChild(iconElem);
    button.appendChild(labelSpan);
    button.appendChild(badgeSpan);
    button.addEventListener("click", () => {
      button.setAttribute("aria-expanded", "true");
      onRestore();
    });

    dockElement.appendChild(button);

    entry = {
      id,
      button,
      labelSpan,
      badgeSpan,
      iconElem,
      iconClass: resolvedIcon,
      accessibleLabel,
      updateLabel(newLabel, newAriaLabel) {
        const nextLabel =
          typeof newLabel === "string" ? newLabel.trim() : "";
        labelSpan.textContent = nextLabel;
        labelSpan.hidden = !nextLabel;

        if (typeof newAriaLabel === "string" && newAriaLabel.trim()) {
          this.accessibleLabel = newAriaLabel.trim();
        } else if (nextLabel) {
          this.accessibleLabel = nextLabel;
        }

        button.title = this.accessibleLabel;
        button.setAttribute("aria-label", this.accessibleLabel);
      },
      updateIcon(newIconClass) {
        this.iconClass = applyDockIcon(iconElem, newIconClass);
      },
      updateBadge(count) {
        if (typeof count === "number" && count > 0) {
          badgeSpan.hidden = false;
          badgeSpan.textContent = `${count}`;
        } else {
          badgeSpan.hidden = true;
          badgeSpan.textContent = "";
        }
      },
      setExpanded(isExpanded) {
        button.setAttribute("aria-expanded", isExpanded ? "true" : "false");
      },
      remove() {
        button.remove();
        entries.delete(id);
        destroyDockIfEmpty();
      },
    };

    entries.set(id, entry);
    return entry;
  }

  return {
    attach(id, label, iconClass, onRestore, ariaLabel) {
      ensureModalEnhancementStyles();
      return createDockEntry(id, label, iconClass, onRestore, ariaLabel);
    },
    detach(id) {
      const entry = entries.get(id);
      if (entry) {
        entry.remove();
      }
    },
    updateBadge(id, count) {
      const entry = entries.get(id);
      if (entry) {
        entry.updateBadge(count);
      }
    },
    updateLabel(id, label, ariaLabel) {
      const entry = entries.get(id);
      if (entry) {
        entry.updateLabel(label, ariaLabel);
      }
    },
    updateIcon(id, iconClass) {
      const entry = entries.get(id);
      if (entry) {
        entry.updateIcon(iconClass);
      }
    },
  };
})();

const CurateUi = {
  modals: {
    /**
     * Creates a Curate popup with customizable action buttons and base styling.
     * The popup initialization and behavior are managed by the provided props and callbacks.
     * The `afterLoaded` callback is triggered after the popup is rendered in the DOM,
     * and the `afterClosed` callback is triggered after the popup is removed from the DOM.
     *
     * @usage
     * const myPopup = new Curate.ui.modals.curatePopup(props, callbacks);
     * myPopup.fire(); // Show the popup
     * myPopup.close(); // Programmatically close the popup
     *
     * @param {Object} props - An object containing popup parameters.
     * @param {string} [props.title] - The title of the popup.
     * @param {string} [props.message] - The main message of the popup.
     * @param {string} [props.type] - The type of the popup ('warning', 'error', 'success', or 'info').
     * @param {string} [props.content] - Additional HTML content for the popup.
     * @param {string} [props.buttonType='close'] - The type of buttons to display ('close' or 'okCancel').
     * @param {boolean} [props.minimizable=false] - Enables minimize controls and dock integration.
     * @param {string} [props.minimizeLabel] - Optional label for the minimized dock button (defaults to title).
     * @param {string} [props.minimizeButtonText='Minimize'] - Optional label for the minimize action button.
     * @param {string} [props.minimizeAriaLabel] - Optional accessible label for the minimized dock button.
     * @param {string} [props.minimizeIcon='mdi-window-restore'] - Material Design icon class used in the dock pill.
     * @param {number} [props.badgeCount=0] - Optional initial badge count for the minimized dock button.
     * @param {string} [props.id] - Optional identifier used to keep the dock entry stable across modal instances.
     * @param {Object} callbacks - An object containing callback functions for popup events.
     * @property {Function} callbacks.afterLoaded - Callback function that fires after the popup is spawned in the DOM.
     * @property {Function} callbacks.afterClosed - Callback function that fires after the popup is removed from the DOM.
     * @property {Function} [callbacks.onOk] - Callback function that fires when the OK button is clicked (only for 'okCancel' buttonType).
     * @property {Function} [callbacks.onCancel] - Callback function that fires when the Cancel button is clicked (only for 'okCancel' buttonType).
     * @property {Function} [callbacks.afterMinimized] - Callback that fires after the modal is minimized.
     * @property {Function} [callbacks.afterRestored] - Callback that fires after the modal is restored.
     * @function fire - Initiates the popup in the DOM.
     * @function close - Programmatically closes and cleans up the popup.
     * @function minimize - Minimizes the popup (only available when minimizable=true).
     * @function restore - Restores a minimized popup.
     * @function updateBadge - Updates the badge number displayed on the dock button.
     * @function updateMinimizeLabel - Updates the visible/accessible label used for the minimized dock button.
     * @function updateDockIcon - Updates the icon used by the minimized dock button.
     */
    curatePopup: function (props, callbacks) {
      // Extracting props
      const title = props.title;
      const message = props.message;
      const type = props.type;
      const content = props.content;
      const buttonType = props.buttonType || "close";
      const minimizable = Boolean(props.minimizable);
      let dockLabelText =
        typeof props.minimizeLabel === "string"
          ? props.minimizeLabel.trim()
          : "";
      let dockAriaLabel =
        typeof props.minimizeAriaLabel === "string" &&
        props.minimizeAriaLabel.trim()
          ? props.minimizeAriaLabel.trim()
          : dockLabelText || title || "Modal";
      let dockIconClass = props.minimizeIcon || DEFAULT_DOCK_ICON_CLASS;
      const minimizeButtonText = props.minimizeButtonText || "Minimize";
      const modalId =
        props.id ||
        `curate-modal-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;
      const initialBadge = Number(props.badgeCount);
      let badgeCount = Number.isFinite(initialBadge) ? initialBadge : 0;

      // Extracting callbacks or defaulting to empty functions
      const afterLoaded = callbacks?.afterLoaded || function () {};
      const afterClosed = callbacks?.afterClosed || function () {};
      const onOk = callbacks?.onOk || function () {};
      const onCancel = callbacks?.onCancel || function () {};
      const afterMinimized = callbacks?.afterMinimized || function () {};
      const afterRestored = callbacks?.afterRestored || function () {};

      // Define type-specific styles and icons
      const typeStyles = {
        warning: { color: "#FFA500", icon: "mdi-alert" },
        error: { color: "#FF0000", icon: "mdi-alert-circle" },
        success: { color: "#008000", icon: "mdi-check-circle" },
        info: { color: "#0000FF", icon: "mdi-information" },
      };

      // Store references for cleanup
      let container = null;
      let escapePopupHandler = null;
      let dockEntry = null;
      let contentNode = null;
      let escapeHandlerBound = false;
      let isClosing = false;
      const prefersReducedMotion = (() => {
        if (
          typeof window === "undefined" ||
          typeof window.matchMedia !== "function"
        ) {
          return false;
        }
        try {
          return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        } catch (error) {
          return false;
        }
      })();
      const canRunMotion = !prefersReducedMotion;
      const nextFrame =
        typeof window !== "undefined" &&
        typeof window.requestAnimationFrame === "function"
          ? window.requestAnimationFrame.bind(window)
          : (cb) => setTimeout(cb, 16);
      const supportsViewTransitions =
        typeof document !== "undefined" &&
        typeof document.startViewTransition === "function";

      // Define fire method
      function fire() {
        // Prevent multiple instances
        if (container) {
          restore();
          return;
        }

        ensureModalEnhancementStyles();

        // Create the container element
        container = document.createElement("div");
        container.classList.add("config-modal-container");
        container.classList.add(MODAL_MOTION_CLASS);
        container.style.display = "flex";

        // Add event listener to close the popup when the user clicks outside of it
        container.addEventListener(
          "click",
          function (e) {
            clickAway(e, container);
          },
          { once: true }
        );

        // Add event listener to close the popup when the user presses the Escape key
        escapePopupHandler = (e) => {
          if (e.key === "Escape") {
            closePopup();
          }
        };
        document.addEventListener("keyup", escapePopupHandler);
        escapeHandlerBound = true;

        // Create the content element
        const contentDiv = document.createElement("div");
        contentDiv.classList.add("config-modal-content");
        contentDiv.classList.add(MODAL_MOTION_PANEL_CLASS);
        contentDiv.setAttribute("tabindex", "-1");
        contentNode = contentDiv;

        // Create the title element
        const titleElem = document.createElement("div");
        titleElem.classList.add("config-popup-title");
        if (type) {
          const iconElem = document.createElement("i");
          iconElem.classList.add("mdi", typeStyles[type].icon);
          iconElem.style.color = typeStyles[type].color;
          iconElem.style.fontSize = "24px";
          iconElem.style.marginRight = "10px";
          titleElem.appendChild(iconElem);
        }
        const titleText = document.createTextNode(title || "");
        titleElem.appendChild(titleText);

        const header = document.createElement("div");
        header.classList.add("config-modal-header");
        header.appendChild(titleElem);

        if (type) {
          contentDiv.style.borderTop = `4px solid ${typeStyles[type].color}`;
        }

        // Create the main body container
        const mainContent = document.createElement("div");
        mainContent.classList.add("config-main-options-container");
        mainContent.style.width = "100%";
        if (message) {
          const messageElem = document.createElement("div");
          messageElem.classList.add("config-popup-message");
          messageElem.textContent = message;
          mainContent.appendChild(messageElem);
        }

        if (content) {
          const contentElem = document.createElement("div");
          contentElem.innerHTML = content;
          mainContent.appendChild(contentElem);
        }

        // Create the action buttons container
        const actionButtons = document.createElement("div");
        actionButtons.classList.add("action-buttons");

        if (minimizable) {
          const minimizeActionButton = document.createElement("button");
          minimizeActionButton.type = "button";
          minimizeActionButton.classList.add(
            "config-modal-action-button",
            "config-modal-minimize-button"
          );
          minimizeActionButton.textContent = minimizeButtonText;
          minimizeActionButton.setAttribute("aria-label", "Minimize modal");
          minimizeActionButton.addEventListener("click", () => {
            minimize();
          });
          actionButtons.appendChild(minimizeActionButton);
        }

        // Create buttons based on buttonType
        if (buttonType === "okCancel") {
          const okButton = document.createElement("button");
          okButton.classList.add(
            "config-modal-action-button",
            "config-modal-ok-button"
          );
          okButton.textContent = "OK";
          okButton.addEventListener("click", () => {
            onOk();
            closePopup();
          });

          const cancelButton = document.createElement("button");
          cancelButton.classList.add(
            "config-modal-action-button",
            "config-modal-cancel-button"
          );
          cancelButton.textContent = "Cancel";
          cancelButton.addEventListener("click", () => {
            onCancel();
            closePopup();
          });

          actionButtons.appendChild(okButton);
          actionButtons.appendChild(cancelButton);
        } else {
          // Default to 'close' button
          const closeButton = document.createElement("button");
          closeButton.classList.add(
            "config-modal-action-button",
            "config-modal-close-button"
          );
          closeButton.textContent = "Close";
          closeButton.addEventListener("click", () => {
            closePopup();
          });

          actionButtons.appendChild(closeButton);
        }

        // Append elements to their respective parents
        contentDiv.appendChild(header);
        contentDiv.appendChild(mainContent);
        contentDiv.appendChild(actionButtons);
        container.appendChild(contentDiv);

        // Append the container to the document body
        document.body.appendChild(container);
        playEnterMotion();

        // Add keystroke event listener
        container.addEventListener("keyup", function (e) {
          e.stopPropagation();
        });

        // Call afterLoaded callback with the created popup
        afterLoaded(container);
        if (minimizable && badgeCount > 0) {
          updateBadge(badgeCount);
        }
      }

      // Define close method for external cleanup
      function close() {
        if (container) {
          closePopup();
        }
      }

      function closePopup() {
        if (!container || isClosing) {
          return;
        }

        isClosing = true;
        const currentContainer = container;
        const currentContent = contentNode;

        const finalizeClose = () => {
          if (currentContainer && currentContainer.parentNode) {
            currentContainer.remove();
          }

          if (escapePopupHandler && escapeHandlerBound) {
            document.removeEventListener("keyup", escapePopupHandler);
            escapeHandlerBound = false;
            escapePopupHandler = null;
          }

          if (dockEntry) {
            dockEntry.remove();
            dockEntry = null;
          }

          container = null;
          contentNode = null;
          isClosing = false;

          afterClosed();
        };

        const shouldAnimateClose =
          canRunMotion &&
          currentContainer?.isConnected &&
          currentContainer.style.display !== "none" &&
          currentContainer.classList.contains(MODAL_MOTION_CLASS);

        if (shouldAnimateClose) {
          animateCloseTransition(currentContainer, currentContent, finalizeClose);
          return;
        }

        finalizeClose();
      }

      function clickAway(e, containerElement) {
        if (e.target === containerElement) {
          closePopup();
        } else {
          // Reattach the listener if the click wasn't on the container
          if (containerElement && containerElement.parentNode) {
            containerElement.addEventListener(
              "click",
              function (e) {
                clickAway(e, containerElement);
              },
              { once: true }
            );
          }
        }
      }

      function minimize() {
        if (!container) {
          return;
        }

        container.style.display = "none";
        if (!dockEntry) {
          dockEntry = CurateModalDock.attach(
            modalId,
            dockLabelText,
            dockIconClass,
            restore,
            dockAriaLabel
          );
        } else {
          CurateModalDock.updateLabel(modalId, dockLabelText, dockAriaLabel);
          CurateModalDock.updateIcon(modalId, dockIconClass);
        }
        dockEntry.setExpanded(false);
        if (escapePopupHandler && escapeHandlerBound) {
          document.removeEventListener("keyup", escapePopupHandler);
          escapeHandlerBound = false;
        }
        CurateModalDock.updateBadge(modalId, badgeCount);
        afterMinimized(container);
      }

      function restore() {
        if (!container) {
          return;
        }

        container.style.display = "flex";
        playEnterMotion();
        contentNode?.focus();
        if (escapePopupHandler && !escapeHandlerBound) {
          document.addEventListener("keyup", escapePopupHandler);
          escapeHandlerBound = true;
        }
        if (dockEntry) {
          CurateModalDock.detach(modalId);
          dockEntry = null;
        }
        afterRestored(container);
      }

      function updateBadge(count) {
        if (!minimizable) {
          return;
        }

        const parsedCount = Number(count);
        if (Number.isFinite(parsedCount)) {
          badgeCount = parsedCount;
          CurateModalDock.updateBadge(modalId, badgeCount);
        }
      }

      function updateDockLabel(label, ariaLabel) {
        if (!minimizable) {
          return;
        }

        if (label !== undefined) {
          if (label === null) {
            dockLabelText = "";
          } else if (typeof label === "string") {
            dockLabelText = label.trim();
          }
        }

        if (ariaLabel !== undefined) {
          if (typeof ariaLabel === "string" && ariaLabel.trim()) {
            dockAriaLabel = ariaLabel.trim();
          } else {
            dockAriaLabel = title || "Modal";
          }
        } else if (label !== undefined && dockLabelText) {
          dockAriaLabel = dockLabelText;
        }

        CurateModalDock.updateLabel(modalId, dockLabelText, dockAriaLabel);
      }

      function updateDockIcon(iconClass) {
        if (!minimizable) {
          return;
        }
        if (typeof iconClass !== "string" || !iconClass.trim()) {
          dockIconClass = DEFAULT_DOCK_ICON_CLASS;
        } else {
          dockIconClass = iconClass;
        }
        CurateModalDock.updateIcon(modalId, dockIconClass);
      }

      function runViewTransition(mutator) {
        if (!supportsViewTransitions) {
          mutator();
          return null;
        }
        try {
          const transition = document.startViewTransition(() => {
            mutator();
          });
          transition.finished.catch(() => {});
          return transition;
        } catch (error) {
          mutator();
          return null;
        }
      }

      function forceMotionRestState(node) {
        if (!node) {
          return;
        }
        try {
          void node.offsetWidth;
        } catch (error) {
          /* no-op */
        }
      }

      function playEnterMotion() {
        if (!container) {
          return;
        }

        container.classList.add(MODAL_MOTION_CLASS);
        container.classList.remove(MODAL_MOTION_EXITING_CLASS);
        if (contentNode) {
          contentNode.classList.add(MODAL_MOTION_PANEL_CLASS);
          contentNode.classList.remove(MODAL_MOTION_EXITING_CLASS);
        }

        if (!canRunMotion) {
          container.classList.add(MODAL_MOTION_ACTIVE_CLASS);
          contentNode?.classList.add(MODAL_MOTION_ACTIVE_CLASS);
          return;
        }

        container.classList.remove(MODAL_MOTION_ACTIVE_CLASS);
        contentNode?.classList.remove(MODAL_MOTION_ACTIVE_CLASS);
        forceMotionRestState(container);
        forceMotionRestState(contentNode);

        nextFrame(() => {
          if (!container) {
            return;
          }
          runViewTransition(() => {
            container.classList.add(MODAL_MOTION_ACTIVE_CLASS);
            contentNode?.classList.add(MODAL_MOTION_ACTIVE_CLASS);
          });
        });
      }

      function animateCloseTransition(containerElement, contentElement, done) {
        if (!containerElement) {
          done();
          return;
        }

        const applyExitState = () => {
          containerElement.classList.remove(MODAL_MOTION_ACTIVE_CLASS);
          contentElement?.classList.remove(MODAL_MOTION_ACTIVE_CLASS);
          containerElement.classList.add(MODAL_MOTION_EXITING_CLASS);
          contentElement?.classList.add(MODAL_MOTION_EXITING_CLASS);
        };

        applyExitState();

        waitForMotionEnd(
          [contentElement, containerElement],
          () => {
            containerElement.classList.remove(MODAL_MOTION_EXITING_CLASS);
            contentElement?.classList.remove(MODAL_MOTION_EXITING_CLASS);
            done();
          },
          500
        );
      }

      function waitForMotionEnd(elements, callback, fallbackMs = 450) {
        const validElements = elements.filter(
          (el) => el && typeof el.addEventListener === "function"
        );

        if (!validElements.length) {
          callback();
          return;
        }

        let finished = false;
        const completed = new Set();

        let timerId = null;

        const cleanup = () => {
          if (finished) {
            return;
          }
          finished = true;
          validElements.forEach((el) => {
            el.removeEventListener("transitionend", onEnd);
            el.removeEventListener("animationend", onEnd);
          });
          if (timerId !== null) {
            clearTimeout(timerId);
          }
          callback();
        };

        const onEnd = (event) => {
          if (finished) {
            return;
          }
          completed.add(event.currentTarget);
          if (completed.size === validElements.length) {
            cleanup();
          }
        };

        timerId = setTimeout(cleanup, fallbackMs);

        validElements.forEach((el) => {
          el.addEventListener("transitionend", onEnd);
          el.addEventListener("animationend", onEnd);
        });
      }

      // Return an object with the fire and close methods
      return {
        fire: fire,
        close: close,
        minimize: minimize,
        restore: restore,
        updateBadge: updateBadge,
        updateMinimizeLabel: updateDockLabel,
        updateDockIcon: updateDockIcon,
        id: modalId,
      };
    },
  },
};
export default CurateUi;












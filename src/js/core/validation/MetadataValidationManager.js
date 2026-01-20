import eventDelegator from "../CurateFunctions/CurateEvents.js";

const PYDIO_METADATA_ID_RE = /^undefined-undefined-(.+)-\d+$/;

function extractFieldNameFromId(id) {
  if (typeof id !== "string") return null;
  const match = id.match(PYDIO_METADATA_ID_RE);
  return match ? match[1] : null;
}

function extractFieldNameFromEventTarget(target) {
  const direct = extractFieldNameFromId(target?.id);
  if (direct) return direct;
  const owner = target?.closest?.('[id^="undefined-undefined-"]');
  return extractFieldNameFromId(owner?.id);
}

function findOwnerMetadataElement(node) {
  if (!node) return null;
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = /** @type {Element} */ (node);
    if (typeof el.id === "string" && el.id.startsWith("undefined-undefined-")) {
      return el;
    }
    return el.closest?.('[id^="undefined-undefined-"]') ?? null;
  }
  if (node.nodeType === Node.TEXT_NODE) {
    return node.parentElement?.closest?.('[id^="undefined-undefined-"]') ?? null;
  }
  return null;
}

function getSelectedNodeUuid() {
  try {
    const selected = window?.pydio?._dataModel?._selectedNodes;
    if (!selected || !selected.length) return null;
    const meta = selected[0]?._metadata;
    if (!meta || typeof meta[Symbol.iterator] !== "function") return null;
    const obj = Object.fromEntries(meta);
    return typeof obj.uuid === "string" ? obj.uuid : null;
  } catch {
    return null;
  }
}

function isFilled(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  return String(value).trim().length > 0;
}

function readElementValue(element) {
  if (!element) return "";
  const tag = element.tagName;

  if (tag === "SELECT") return element.value ?? "";
  if (tag === "TEXTAREA") return element.value ?? "";

  if (tag === "INPUT") {
    if (element.type === "checkbox") return Boolean(element.checked);
    if (element.type === "radio") return element.checked ? element.value : "";
    return element.value ?? "";
  }

  return element.value ?? "";
}

function readMaterialDropdownValue(container) {
  if (!container) return "";

  const candidates = Array.from(container.querySelectorAll("div"))
    .filter((div) => div.children.length === 0)
    .map((div) => {
      const text = (div.textContent || "").trim();
      const style = (div.getAttribute("style") || "").toLowerCase();
      const parentStyle = (div.parentElement?.getAttribute?.("style") || "").toLowerCase();
      if (!text) return null;

      let score = 0;
      if (style.includes("text-overflow") || style.includes("white-space")) score += 3;
      if (parentStyle.includes("text-overflow") || parentStyle.includes("white-space")) score += 2;
      if (text.length >= 2) score += 1;
      score += Math.min(text.length, 40) / 40;

      return { text, score };
    })
    .filter(Boolean);

  if (candidates.length === 0) return "";
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].text;
}

function ensureValidationStyles() {
  const styleId = "curate-metadata-validation-styles";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .curate-validation-error {
      color: var(--md-sys-color-on-error-container);
      font-size: 12px;
      margin-top: 4px;
      font-family: Roboto, sans-serif;
    }
    .curate-validation-save-indicator {
      margin-right: 10px;
      font-size: 12px;
      font-family: Roboto, sans-serif;
      color: var(--md-sys-color-on-error-container);
      white-space: nowrap;
      align-self: center;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      text-decoration: underline;
      display: inline-flex;
      align-items: center;
    }
    .curate-validation-save-indicator:focus {
      outline: none;
      box-shadow: 0 0 0 2px var(--md-sys-color-outline);
      border-radius: 4px;
    }
  `;
  document.head.appendChild(style);
}

function findInputContainer(element) {
  return (
    element.closest('div[style*="height: 52px"]') ||
    element.closest('div[style*="height:52px"]') ||
    element.parentElement
  );
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

class MetadataValidationManager {
  constructor({
    delegator = eventDelegator,
    selector = '[id^="undefined-undefined-"]',
    debounceMs = 50,
  } = {}) {
    this.validators = [];
    this.errors = new Map(); // key -> message, key = `${validatorId}:${fieldName}`
    this._delegator = delegator;
    this._selector = selector;
    this._debounceMs = debounceMs;
    this._handlerIds = [];
    this._timer = null;
    this._mutationObserver = null;
    this._lastObservedValues = new Map();
    this._touchedFields = new Set();
    this._cachedValues = new Map();
    this._contextKey = null;
    this._saveIndicatorEl = null;
    this._saveButtonEl = null;
    this._lastSaveButtonSearchAt = 0;
  }

  clearValidationErrors() {
    if (typeof document === "undefined") {
      this.errors.clear();
      return;
    }

    // Remove inline error elements we injected.
    document
      .querySelectorAll(".curate-validation-error")
      .forEach((el) => el.remove());

    // Clear aria flags and described-by references to our error ids.
    document
      .querySelectorAll('[aria-describedby*="curate-validation-error-"]')
      .forEach((el) => {
        el.removeAttribute("aria-invalid");
        const describedBy = el.getAttribute("aria-describedby");
        if (!describedBy) return;
        const next = describedBy
          .split(/\s+/)
          .filter((id) => id && !id.startsWith("curate-validation-error-"))
          .join(" ");
        if (next) el.setAttribute("aria-describedby", next);
        else el.removeAttribute("aria-describedby");
      });

    this.errors.clear();
    this._updateSaveIndicator();
  }

  _ensureContext() {
    const nextKey = getSelectedNodeUuid() || "unknown";
    if (this._contextKey === null) {
      this._contextKey = nextKey;
      return;
    }
    if (this._contextKey !== nextKey) {
      this.clearValidationErrors();
      this._contextKey = nextKey;
      this._lastObservedValues.clear();
      this._touchedFields.clear();
      this._cachedValues.clear();
      this._updateSaveIndicator();
    }
  }

  registerValidator(validator) {
    if (!validator || typeof validator !== "object") {
      throw new Error("Validator must be an object");
    }
    if (!validator.id || typeof validator.id !== "string") {
      throw new Error("Validator must have a string id");
    }
    if (!validator.watchFields || !(validator.watchFields instanceof Set)) {
      throw new Error("Validator must have a watchFields Set");
    }
    if (
      !validator.validatedFields ||
      !(validator.validatedFields instanceof Set)
    ) {
      throw new Error("Validator must have a validatedFields Set");
    }
    if (typeof validator.validate !== "function") {
      throw new Error("Validator must have a validate(data) function");
    }

    this.validators.push(validator);
  }

  attach() {
    if (typeof document === "undefined") return;
    ensureValidationStyles();
    this._updateSaveIndicator();

    const handler = (event) => {
      this._ensureContext();

      const fieldName = extractFieldNameFromEventTarget(event?.target);
      if (!fieldName) return;

      const shouldWatch = this.validators.some((v) => v.watchFields.has(fieldName));
      if (!shouldWatch) return;

      this._touchedFields.add(fieldName);
      this._scheduleValidation();
    };

    this._handlerIds.push(
      this._delegator.addEventListener(this._selector, "input", handler)
    );
    this._handlerIds.push(
      this._delegator.addEventListener(this._selector, "change", handler)
    );
    this._handlerIds.push(
      this._delegator.addEventListener(this._selector, "click", handler)
    );

    if (!this._mutationObserver && typeof MutationObserver !== "undefined") {
      this._mutationObserver = new MutationObserver((mutations) => {
        this._ensureContext();

        for (const mutation of mutations) {
          const owner = findOwnerMetadataElement(mutation.target);
          if (!owner) continue;

          const fieldName = extractFieldNameFromId(owner.id);
          if (!fieldName) continue;

          const shouldWatch = this.validators.some((v) => v.watchFields.has(fieldName));
          if (!shouldWatch) continue;

          let value = "";
          if (owner.matches("input,select,textarea")) {
            value = readElementValue(owner);
          } else {
            value = readMaterialDropdownValue(owner);
          }

          const prev = this._lastObservedValues.get(fieldName);
          if (prev === value) continue;
          this._lastObservedValues.set(fieldName, value);
          this._cachedValues.set(fieldName, value);

          this._scheduleValidation();
          break;
        }
      });

      const root = document.body || document.documentElement;
      if (root) {
        this._mutationObserver.observe(root, {
          subtree: true,
          childList: true,
          characterData: true,
        });
      }
    }
  }

  detach() {
    this.clearValidationErrors();
    this._handlerIds.forEach((id) => this._delegator.removeEventListener(id));
    this._handlerIds = [];
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    if (this._mutationObserver) {
      this._mutationObserver.disconnect();
      this._mutationObserver = null;
    }
    if (this._saveIndicatorEl) {
      this._saveIndicatorEl.remove();
      this._saveIndicatorEl = null;
    }
    this._saveButtonEl = null;
    this._lastSaveButtonSearchAt = 0;
    this._lastObservedValues.clear();
    this._touchedFields.clear();
    this._cachedValues.clear();
    this._contextKey = null;
  }

  hasErrors() {
    return this.errors.size > 0;
  }

  getErrors() {
    return Array.from(this.errors.entries()).map(([key, message]) => {
      const [validatorId, field] = key.split(":");
      return { validatorId, field, message };
    });
  }

  _scheduleValidation() {
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this._timer = null;
      this.validateAll();
    }, this._debounceMs);
  }

  _collectFieldElementsAndValues() {
    const values = {};
    const elementsByField = new Map();

    document
      .querySelectorAll(this._selector)
      .forEach((element) => {
        const fieldName = extractFieldNameFromId(element.id);
        if (!fieldName) return;

        let value = "";
        if (element.matches("input,select,textarea")) {
          value = readElementValue(element);
        } else {
          value = readMaterialDropdownValue(element);
        }

        this._cachedValues.set(fieldName, value);
        const existing = values[fieldName];

        if (existing === undefined) {
          values[fieldName] = value;
        } else if (!isFilled(existing) && isFilled(value)) {
          values[fieldName] = value;
        }

        if (!elementsByField.has(fieldName)) {
          elementsByField.set(fieldName, element);
        }
      });

    return { values, elementsByField };
  }

  validateAll() {
    if (typeof document === "undefined") return;
    this._ensureContext();

    const { values, elementsByField } = this._collectFieldElementsAndValues();
    const mergedValues = {
      ...Object.fromEntries(this._cachedValues),
      ...values,
    };

    const presentFields = new Set(elementsByField.keys());

    for (const validator of this.validators) {
      const hasAnyKnownField = Array.from(validator.watchFields).some(
        (f) => presentFields.has(f) || this._cachedValues.has(f)
      );

      if (!hasAnyKnownField) {
        for (const key of Array.from(this.errors.keys())) {
          if (key.startsWith(`${validator.id}:`)) this.errors.delete(key);
        }
        continue;
      }

      if (typeof validator.shouldValidate === "function") {
        let active = false;
        try {
          active = Boolean(
            validator.shouldValidate({
              values: mergedValues,
              presentFields,
              touchedFields: this._touchedFields,
              cachedValues: this._cachedValues,
            })
          );
        } catch (error) {
          console.error(`[CurateValidation] shouldValidate failed for ${validator.id}:`, error);
          active = false;
        }

        if (!active) {
          for (const fieldName of validator.validatedFields) {
            this._clearError({
              validatorId: validator.id,
              fieldName,
              element: elementsByField.get(fieldName) ?? null,
            });
            this.errors.delete(`${validator.id}:${fieldName}`);
          }
          continue;
        }
      }

      let result;
      try {
        result = validator.validate(mergedValues);
      } catch (error) {
        console.error(`Validation failed for ${validator.id}:`, error);
        continue;
      }

      for (const fieldName of validator.validatedFields) {
        const key = `${validator.id}:${fieldName}`;
        const message = validator.getFirstError?.(fieldName, result) ?? null;

        if (message) {
          this._showError({
            validatorId: validator.id,
            fieldName,
            message,
            element: elementsByField.get(fieldName) ?? null,
          });
          this.errors.set(key, message);
        } else {
          this._clearError({
            validatorId: validator.id,
            fieldName,
            element: elementsByField.get(fieldName) ?? null,
          });
          this.errors.delete(key);
        }
      }
    }

    this._updateSaveIndicator();
  }

  _getSaveButtonText() {
    return window?.pydio?.MessageHash?.["meta.user.15"] || null;
  }

  _findSaveButton() {
    const saveText = this._getSaveButtonText();
    if (!saveText) return null;

    const needle = String(saveText).trim();
    if (!needle) return null;

    if (
      this._saveButtonEl &&
      document.contains(this._saveButtonEl) &&
      (this._saveButtonEl.textContent || "").trim() === needle
    ) {
      return this._saveButtonEl;
    }

    const now = Date.now();
    if (now - this._lastSaveButtonSearchAt < 250) {
      return null;
    }
    this._lastSaveButtonSearchAt = now;

    for (const button of document.querySelectorAll("button")) {
      const text = (button.textContent || "").trim();
      if (text === needle) {
        this._saveButtonEl = button;
        return button;
      }
    }
    return null;
  }

  _ensureSaveIndicatorElement(button) {
    if (this._saveIndicatorEl && document.contains(this._saveIndicatorEl)) {
      if (this._saveIndicatorEl.nextElementSibling !== button) {
        // If the button moved, reinsert the indicator before it.
        button.insertAdjacentElement("beforebegin", this._saveIndicatorEl);
      }
      return this._saveIndicatorEl;
    }

    const el = document.createElement("button");
    el.type = "button";
    el.className = "curate-validation-save-indicator";
    el.style.display = "none";
    button.insertAdjacentElement("beforebegin", el);
    el.addEventListener("click", () => this.showValidationErrorsModal());
    this._saveIndicatorEl = el;
    return el;
  }

  _updateSaveIndicator() {
    const button = this._findSaveButton();
    if (!button) {
      if (this._saveIndicatorEl) {
        this._saveIndicatorEl.remove();
        this._saveIndicatorEl = null;
      }
      return;
    }

    const indicator = this._ensureSaveIndicatorElement(button);
    const errorCount = this.getErrors().length;
    if (errorCount > 0) {
      indicator.textContent =
        errorCount === 1 ? "Validation error" : `Validation errors (${errorCount})`;
      indicator.style.display = "inline-flex";
    } else {
      indicator.textContent = "";
      indicator.style.display = "none";
    }
  }

  showValidationErrorsModal() {
    const errors = this.getErrors();
    if (errors.length === 0) return;

    const listHtml = `<ul style="margin: 8px 0 0; padding-left: 18px;">${errors
      .map(
        (e) =>
          `<li style="margin: 0 0 6px 0; line-height: 1.35;">` +
          `<div style="font-weight: 600;">${escapeHtml(e.field)}</div>` +
          `<div style="margin-top: 2px;">${escapeHtml(e.message)}</div>` +
          `</li>`
      )
      .join("")}</ul>`;

    const popupFactory = window?.Curate?.ui?.modals?.curatePopup;
    if (typeof popupFactory === "function") {
      const popup = popupFactory(
        {
          title: "Validation errors",
          type: "error",
          message: "",
          content: `<div style="width: 100%;">${listHtml}</div>`,
          buttonType: "close",
          minimizable: false,
          id: "curate-metadata-validation-errors",
        },
        {}
      );
      popup.fire();
      return;
    }

    window.alert?.(errors.map((e) => `${e.field}: ${e.message}`).join("\n"));
  }

  _errorElementId(validatorId, fieldName) {
    return `curate-validation-error-${validatorId}-${fieldName}`;
  }

  _showError({ validatorId, fieldName, message, element }) {
    if (!element) return;

    element.setAttribute("aria-invalid", "true");

    const errorId = this._errorElementId(validatorId, fieldName);
    let errorEl = document.getElementById(errorId);
    if (!errorEl) {
      errorEl = document.createElement("div");
      errorEl.id = errorId;
      errorEl.className = "curate-validation-error";
      errorEl.dataset.validator = validatorId;
      errorEl.dataset.field = fieldName;

      const container = findInputContainer(element);
      if (container?.parentElement) {
        container.parentElement.insertBefore(errorEl, container.nextSibling);
      }
    }

    errorEl.textContent = message;

    const describedBy = element.getAttribute("aria-describedby");
    if (!describedBy) {
      element.setAttribute("aria-describedby", errorId);
    } else if (!describedBy.split(/\s+/).includes(errorId)) {
      element.setAttribute("aria-describedby", `${describedBy} ${errorId}`);
    }
  }

  _clearError({ validatorId, fieldName, element }) {
    const errorId = this._errorElementId(validatorId, fieldName);
    const errorEl = document.getElementById(errorId);
    if (errorEl) errorEl.remove();

    if (!element) return;

    element.removeAttribute("aria-invalid");

    const describedBy = element.getAttribute("aria-describedby");
    if (describedBy) {
      const next = describedBy
        .split(/\s+/)
        .filter((id) => id && id !== errorId)
        .join(" ");
      if (next) element.setAttribute("aria-describedby", next);
      else element.removeAttribute("aria-describedby");
    }
  }
}

export default MetadataValidationManager;

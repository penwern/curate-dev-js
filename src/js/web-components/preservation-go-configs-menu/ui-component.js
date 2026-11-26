import { html, nothing } from "lit";
import {
  mdiLock,
  mdiPin,
  mdiPinOff,
  mdiPencil,
  mdiContentCopy,
  mdiDeleteOutline,
  mdiPlus,
  mdiChevronRight,
  mdiChevronDown,
  mdiSourceBranch,
} from "@mdi/js";
import { icon } from "../utils/icons.js";
import { isDefaultConfigId } from "./api-client.js";
import {
  ESSENTIALS,
  ADVANCED,
  differences,
  diffChips,
  summaryText,
  getSetting,
  valuesFromConfig,
} from "./settings.js";

const MAX_LIST_CHIPS = 3;

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const formatDate = (raw) => {
  const date = raw ? new Date(raw) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const chip = (text, extra = "") => html`<span class="chip ${extra}">${text}</span>`;

// ---- Left pane: the list of configs ----

const listItem = (component, config) => {
  const isDefault = isDefaultConfigId(config.id);
  const selected =
    component.mode !== "create" && String(config.id) === String(component.selectedId);
  const defaults = component.defaultValues;

  let sub;
  if (isDefault) {
    sub = html`<span class="row-sub">Used by Preserve and automatic curation</span>`;
  } else {
    const chips = diffChips(valuesFromConfig(config), defaults);
    const extra = chips.length - MAX_LIST_CHIPS;
    sub = chips.length
      ? html`<span class="row-chips">
          ${chips.slice(0, MAX_LIST_CHIPS).map((text) => chip(text))}
          ${extra > 0 ? chip(`+${extra} more`, "chip-muted") : nothing}
        </span>`
      : html`<span class="row-sub">Same as default</span>`;
  }

  return html`
    <li>
      <button
        type="button"
        class="config-row ${selected ? "selected" : ""}"
        aria-current=${selected ? "true" : "false"}
        @click=${() => component.selectConfig(config.id)}
      >
        <span class="row-top">
          ${isDefault ? html`<span class="row-lock">${icon(mdiLock)}</span>` : nothing}
          <span class="row-name">${config.name}</span>
          ${isDefault ? chip("Default", "chip-primary") : nothing}
          ${
            component.isPinned(config.id)
              ? html`<span class="row-pin" title="Shown in the right-click menu">
                  ${icon(mdiPin)}
                </span>`
              : nothing
          }
        </span>
        ${sub}
      </button>
    </li>
  `;
};

const listPane = (component) => html`
  <nav class="list-pane" aria-label="Preservation configs">
    <ul class="config-list">
      ${component.defaultConfig ? listItem(component, component.defaultConfig) : nothing}
      ${component.otherConfigs.map((config) => listItem(component, config))}
    </ul>
    <div class="list-footer">
      ${
        component.mode === "create"
          ? html`<md-filled-button class="new-btn" @click=${() => component.startCreate()}>
              ${icon(mdiPlus, "icon")} New config
            </md-filled-button>`
          : html`<md-outlined-button class="new-btn" @click=${() => component.startCreate()}>
              ${icon(mdiPlus, "icon")} New config
            </md-outlined-button>`
      }
    </div>
  </nav>
`;

// ---- Controls ----

const onSegmentKey = (e, setting, value, onChange) => {
  const steps = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
  const step = steps[e.key];
  if (!step) return;
  e.preventDefault();
  const count = setting.options.length;
  const current = Math.max(
    0,
    setting.options.findIndex((o) => o.value === value),
  );
  const next = (current + step + count) % count;
  onChange(setting.options[next].value);
  e.currentTarget.querySelectorAll('[role="radio"]')[next].focus();
};

const segmented = (setting, value, onChange) => html`
  <div
    class="segmented"
    role="radiogroup"
    aria-label=${setting.label}
    @keydown=${(e) => onSegmentKey(e, setting, value, onChange)}
  >
    ${setting.options.map((option) => {
      const checked = option.value === value;
      return html`
        <button
          type="button"
          role="radio"
          class="seg ${checked ? "checked" : ""}"
          aria-checked=${checked ? "true" : "false"}
          tabindex=${checked ? "0" : "-1"}
          @click=${() => onChange(option.value)}
        >
          ${option.label}
        </button>
      `;
    })}
  </div>
`;

const resetLink = (component, key) => html`
  <button type="button" class="link" @click=${() => component.resetValue(key)}>
    Reset to default
  </button>
`;

const essentialCard = (component, setting) => {
  const { values } = component.draft;
  const differs = values[setting.key] !== component.defaultValues[setting.key];
  const showWarning = setting.warning && values[setting.key] === true;

  return html`
    <div class="card ${differs ? "differs" : ""}">
      <div class="card-head">
        <span class="card-label">${setting.label}</span>
        ${differs ? resetLink(component, setting.key) : nothing}
      </div>
      <p class="card-desc">${setting.description}</p>
      <p class="card-hint">${setting.hint}</p>
      ${segmented(setting, values[setting.key], (v) => component.setValue(setting.key, v))}
      ${showWarning ? html`<p class="warning-note" role="note">${setting.warning}</p>` : nothing}
    </div>
  `;
};

const advancedRow = (component, setting) => {
  const { values } = component.draft;
  const disabled = !!setting.needsNormalise && !values.normalize;
  const differs = !disabled && values[setting.key] !== component.defaultValues[setting.key];

  return html`
    <div class="adv-row ${differs ? "differs" : ""} ${disabled ? "disabled" : ""}">
      <div class="adv-text">
        <span class="adv-label">${setting.label}</span>
        <span class="adv-desc">${setting.description}</span>
        ${disabled ? html`<span class="adv-note">Only applies when Normalise is on</span>` : nothing}
        ${differs ? resetLink(component, setting.key) : nothing}
      </div>
      <md-switch
        aria-label=${setting.label}
        .selected=${!!values[setting.key]}
        ?disabled=${disabled}
        @change=${(e) => component.setValue(setting.key, e.target.selected)}
      ></md-switch>
    </div>
  `;
};

// ---- Right pane: edit and create ----

const editor = (component) => {
  const { draft } = component;
  const changed = component.changeCount;
  const advancedChanged = differences(draft.values, component.defaultValues).filter(
    (key) => getSetting(key).group === "advanced",
  ).length;
  const showNameError =
    !!component.nameError && (component.nameTouched || draft.name.trim().length > 0);

  return html`
    <div class="pane-scroll">
      <h2 class="pane-title">
        ${component.mode === "create" ? "New config" : `Edit ${component.selectedConfig?.name}`}
      </h2>

      <md-outlined-text-field
        class="field"
        label="Name"
        required
        .value=${draft.name}
        .error=${showNameError}
        .errorText=${showNameError ? component.nameError : ""}
        @input=${(e) => component.setDetail("name", e.target.value)}
        @blur=${() => (component.nameTouched = true)}
      ></md-outlined-text-field>
      <md-outlined-text-field
        class="field"
        type="textarea"
        rows="2"
        label="What is it for? (optional)"
        .value=${draft.description}
        @input=${(e) => component.setDetail("description", e.target.value)}
      ></md-outlined-text-field>

      <p class="base-line">
        ${icon(mdiSourceBranch)}
        <span>
          Starting from <strong>${component.baseName}</strong>, ${plural(changed, "change")}
        </span>
      </p>

      <h3 class="section-title">Essentials</h3>
      <div class="essentials-grid">
        ${ESSENTIALS.map((setting) => essentialCard(component, setting))}
      </div>

      <button
        type="button"
        class="adv-toggle"
        aria-expanded=${component.advancedOpen ? "true" : "false"}
        @click=${() => component.toggleAdvanced()}
      >
        ${icon(component.advancedOpen ? mdiChevronDown : mdiChevronRight)}
        <span class="adv-title">Advanced A3M settings</span>
        <span class="adv-count">
          ${ADVANCED.length} settings,
          ${advancedChanged ? `${advancedChanged} changed` : "all as default"}
        </span>
      </button>
      ${
        component.advancedOpen
          ? html`<div class="adv-list">
              ${ADVANCED.map((setting) => advancedRow(component, setting))}
            </div>`
          : nothing
      }
    </div>

    <footer class="pane-footer">
      <md-outlined-button @click=${() => component.cancelEditing()}>Cancel</md-outlined-button>
      <md-filled-button ?disabled=${!component.canSave} @click=${() => component.saveConfig()}>
        ${component.saveInProgress ? html`<span class="spinner"></span>` : nothing} Save
      </md-filled-button>
    </footer>
  `;
};

// ---- Right pane: view ----

const summaryTile = (setting, values, defaults, isDefault) => {
  const differs = !isDefault && values[setting.key] !== defaults[setting.key];
  return html`
    <div class="tile ${differs ? "differs" : ""}">
      <span class="tile-label">${setting.label}</span>
      <span class="tile-value">${summaryText(setting.key, values)}</span>
      ${
        differs
          ? html`<span class="tile-default">Default: ${summaryText(setting.key, defaults)}</span>`
          : nothing
      }
    </div>
  `;
};

const advancedSummary = (values, defaults, isDefault) => {
  if (isDefault) {
    return html`
      <div class="adv-summary">
        <span class="adv-summary-title">Advanced settings</span>
        <ul class="adv-summary-list">
          ${ADVANCED.map(
            (s) => html`<li>${s.label}: <strong>${summaryText(s.key, values)}</strong></li>`,
          )}
        </ul>
      </div>
    `;
  }
  const changed = differences(values, defaults).filter(
    (key) => getSetting(key).group === "advanced",
  );
  return html`
    <div class="adv-summary">
      <span class="adv-summary-title">
        Advanced settings: ${changed.length ? `${changed.length} changed` : "all as default"}
      </span>
      ${
        changed.length
          ? html`<ul class="adv-summary-list">
              ${changed.map(
                (key) =>
                  html`<li>
                    ${getSetting(key).label}: <strong>${summaryText(key, values)}</strong>
                  </li>`,
              )}
            </ul>`
          : nothing
      }
    </div>
  `;
};

const viewer = (component) => {
  const config = component.selectedConfig;
  if (!config) {
    return html`
      <div class="pane-scroll">
        <p class="empty">No preservation configs found. Create one with New config.</p>
      </div>
    `;
  }

  const isDefault = isDefaultConfigId(config.id);
  const pinned = component.isPinned(config.id);
  const values = valuesFromConfig(config);
  const created = formatDate(config.created_at);
  const changedOn = formatDate(config.updated_at);
  const meta = [created && `Created ${created}`, changedOn && `last changed ${changedOn}`]
    .filter(Boolean)
    .join(", ");

  return html`
    <div class="pane-scroll">
      <div class="pane-head">
        <h2 class="pane-title">
          ${config.name} ${isDefault ? chip("Default", "chip-primary") : nothing}
        </h2>
        ${
          isDefault
            ? nothing
            : html`<md-icon-button
                class="delete-btn"
                title="Delete config"
                aria-label="Delete config"
                @click=${() => component.deleteConfig(config)}
              >
                ${icon(mdiDeleteOutline)}
              </md-icon-button>`
        }
      </div>
      <p class="pane-desc ${config.description ? "" : "muted"}">
        ${config.description || "No description"}
      </p>

      <div class="actions">
        ${
          isDefault
            ? nothing
            : html`<md-filled-button @click=${() => component.startEdit()}>
                ${icon(mdiPencil, "icon")} Edit
              </md-filled-button>`
        }
        <md-outlined-button @click=${() => component.startCreate(true)}>
          ${icon(mdiContentCopy, "icon")} Duplicate
        </md-outlined-button>
        ${
          isDefault
            ? nothing
            : html`<md-outlined-button @click=${() => component.togglePin(config)}>
                ${icon(pinned ? mdiPinOff : mdiPin, "icon")}
                ${pinned ? "Remove from right-click menu" : "Show in right-click menu"}
              </md-outlined-button>`
        }
      </div>

      ${
        pinned
          ? html`<p class="pin-info">
              ${icon(mdiPin)} Shown in the right-click menu, so it can be run without opening
              Preservation Configs.
            </p>`
          : nothing
      }

      <div class="summary-grid">
        ${ESSENTIALS.map((s) => summaryTile(s, values, component.defaultValues, isDefault))}
      </div>
      ${advancedSummary(values, component.defaultValues, isDefault)}
      ${meta ? html`<p class="meta">${meta}</p>` : nothing}
    </div>
  `;
};

const rightPane = (component) => {
  let body;
  if (component.isLoading && !component.configs.length) {
    body = html`<div class="pane-scroll">
      <p class="empty"><span class="spinner"></span> Loading configurations...</p>
    </div>`;
  } else if (component.loadError) {
    body = html`<div class="pane-scroll">
      <p class="empty">
        Failed to load preservation configs. Please check your connection and try again.
      </p>
      <md-outlined-button @click=${() => component.loadConfigs()}>Try again</md-outlined-button>
    </div>`;
  } else {
    body = component.isEditing ? editor(component) : viewer(component);
  }
  return html`<section class="pane"><div class="pane-inner">${body}</div></section>`;
};

export const preservationGoConfigUI = (component) => html`
  <div class="layout">${listPane(component)} ${rightPane(component)}</div>
`;

import { LitElement, html, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";
import "@material/web/button/outlined-button.js";
import "@material/web/button/text-button.js";
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/select/outlined-select.js";
import "@material/web/select/select-option.js";
import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/divider/divider.js";
import {
  indexRegistry,
  filterEntries,
  ruleStatus,
  purposeLabel,
  fprErrorMessage,
  visibleRules,
} from "./fpr-model.js";
import { fprStyles } from "./fpr-styles.js";

const PAGE_SIZE = 50;
const ruleCount = (rules) => `${rules.length} rule${rules.length === 1 ? "" : "s"}`;
const field = (label, value) =>
  html`<dt>${label}</dt>
    <dd>${value ?? "Not specified"}</dd>`;

class FPRViewer extends LitElement {
  static properties = {
    active: { type: Boolean },
    api: { attribute: false },
    index: { state: true },
    loading: { state: true },
    error: { state: true },
    query: { state: true },
    purpose: { state: true },
    status: { state: true },
    page: { state: true },
    selected: { state: true },
    commandBodies: { state: true },
    expandedRules: { state: true },
  };
  static styles = fprStyles;

  constructor() {
    super();
    this.active = false;
    this.loading = false;
    this.error = "";
    this.query = "";
    this.purpose = "";
    this.status = "current";
    this.page = 0;
    this.selected = "defaults";
    this.commandBodies = "unknown";
    this.expandedRules = new Set();
  }

  updated(changes) {
    if (["page", "query", "purpose", "status"].some((key) => changes.has(key))) {
      this.renderRoot.querySelector(".rows")?.scrollTo({ top: 0 });
    }
    if (changes.has("selected") || changes.has("purpose")) {
      this.renderRoot.querySelector(".detail")?.scrollTo({ top: 0 });
    }
    if (
      (changes.has("active") || changes.has("api")) &&
      this.active &&
      this.api &&
      !this.index &&
      !this.loading &&
      !this.error
    )
      this.load();
  }

  async load() {
    if (this.loading) return;
    this.loading = true;
    this.error = "";
    try {
      const response = await this.api.getFPR();
      const next = indexRegistry(response.registry);
      this.index = next;
      this.page = 0;
      this.commandBodies = response.commandBodies;
      if (this.selected !== "defaults" && !next.versions.has(this.selected))
        this.selected = "defaults";
    } catch (error) {
      // Discard stale snapshots rather than presenting them as the current engine.
      this.index = null;
      this.error = fprErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  setFilter(key, value) {
    this[key] = value;
    this.page = 0;
  }

  commandDetails(commandId, label = "Command", visited = new Set()) {
    if (!commandId) return nothing;
    const command = this.index.commands.get(commandId);
    if (!command) return html`<p>${label}: reference unavailable (${commandId})</p>`;
    if (visited.has(commandId))
      return html`<p>${label}: ${command.description} (already shown)</p>`;
    const nextVisited = new Set([...visited, commandId]);
    const tool = this.index.tools.get(command.tool);
    const output = this.index.versions.get(command.output_format);
    return html`<details class="command">
      <summary>${label}: ${command.description || command.uuid}</summary>
      <dl>
        ${field("Tool", tool ? `${tool.description} ${tool.version}` : command.tool || "Not specified")}
        ${field("Tool enabled (metadata)", tool ? String(tool.enabled) : undefined)}
        ${field("Command enabled (metadata)", String(command.enabled))}
        ${field("Usage", command.command_usage)} ${field("Script type", command.script_type)}
        ${field("Output format", output ? `${output.description}${output.pronom_id ? ` (${output.pronom_id})` : ""}` : command.output_format)}
        ${field("Output location", command.output_location)}
        ${field("Replaces command", command.replaces)} ${field("Command ID", command.uuid)}
        ${field("Source position", command.source_index)}
      </dl>
      ${
        this.commandBodies === "omitted"
          ? html`<p>Command body hidden by deployment policy.</p>`
          : command.command
            ? html`<pre><code>${command.command}</code></pre>`
            : html`<p>
                ${this.commandBodies === "included" ? "Command body is empty." : "Command body is empty; disclosure policy was not reported."}
              </p>`
      }
      ${this.commandDetails(command.verification_command, "Verification command", nextVisited)}
      ${this.commandDetails(command.event_detail_command, "Event detail command", nextVisited)}
    </details>`;
  }

  ruleDetails(rule) {
    const command = this.index.commands.get(rule.command);
    const tool = this.index.tools.get(command?.tool);
    const output = this.index.versions.get(command?.output_format);
    const outputName =
      output && output.description !== "Unknown file format"
        ? `${output.description}${output.pronom_id ? ` (${output.pronom_id})` : ""}`
        : "";
    const copy = [
      "preservation",
      "access",
      "thumbnail",
      "default_access",
      "default_thumbnail",
    ].includes(rule.purpose);
    const headline = !command
      ? "Action details unavailable"
      : copy
        ? outputName || "Output format not specified"
        : rule.purpose === "characterization"
          ? `Extract metadata${outputName ? ` as ${outputName}` : ""}`
          : rule.purpose === "validation"
            ? "Validate file format"
            : rule.purpose === "transcription"
              ? "Extract text"
              : command.description || purposeLabel(rule.purpose);
    const expanded = this.expandedRules.has(rule.uuid);
    return html`<md-list-item class="action-item" type="text">
        <div slot="headline">${headline}</div>
        <div slot="supporting-text">
          ${tool ? `${tool.description}${tool.version ? ` · ${tool.version}` : ""}` : "Tool not specified"}
          ${!rule.selected_by_registry ? html`<span class="rule-state">${!rule.loaded ? "Unavailable" : !rule.enabled ? "Disabled" : this.index.replacedRules.has(rule.uuid) ? "Superseded" : "Not current"}</span>` : nothing}
        </div>
        <div slot="end" class="action-disclosure">
          <md-text-button
            aria-label=${`${expanded ? "Hide" : "Show"} technical details: ${headline}${tool ? `, ${tool.description}` : ""}`}
            aria-expanded=${String(expanded)}
            aria-controls=${`rule-${rule.uuid}`}
            @click=${() => {
              const next = new Set(this.expandedRules);
              if (expanded) next.delete(rule.uuid);
              else next.add(rule.uuid);
              this.expandedRules = next;
            }}
            >Details</md-text-button
          >
        </div>
      </md-list-item>
      ${
        expanded
          ? html`<div class="action-technical" id=${`rule-${rule.uuid}`}>
              <dl>
                ${field("Registry description", command?.description)}
                ${field("Output format", outputName || "Not specified in this rule")}
                ${field("Registry selection", ruleStatus(rule, this.index))}
                ${field("Rule ID", rule.uuid)}${field("Source position", rule.source_index)}
                ${field("Enabled", String(rule.enabled))}${field("Loaded", String(rule.loaded))}
                ${field("Replaces rule", rule.replaces)}${field("Last modified", rule.lastmodified)}
              </dl>
              ${this.commandDetails(rule.command)}
            </div>`
          : nothing
      }`;
  }

  detailPane() {
    const defaults = this.selected === "defaults";
    const entry = this.index.entries.find((item) => item.version.uuid === this.selected);
    if (!defaults && !entry) return html`<p>Select a format to inspect its rules.</p>`;
    const allRules = defaults ? this.index.defaults : entry.rules;
    const rules = visibleRules(allRules, this.purpose, this.status === "with-rules");
    const hiddenCount = visibleRules(allRules, this.purpose, true).length - rules.length;
    // Purpose groups and rules within them retain their first occurrence order.
    const groups = new Map();
    for (const rule of rules) {
      if (!groups.has(rule.purpose)) groups.set(rule.purpose, []);
      groups.get(rule.purpose).push(rule);
    }
    return html`
      <header class="format-header">
        <h2>${defaults ? "Default rules" : entry.name}</h2>
        ${
          defaults
            ? html`<p>
                These fallback actions may be used when a format-specific action is unavailable or
                fails. Their use depends on the preservation workflow.
              </p>`
            : html` <p class="format-identifier">
                  ${entry.version.pronom_id || "No PRONOM identifier"}
                </p>
                ${!entry.version.active ? html`<p class="notice">This version is disabled or replaced.</p>` : nothing}
                <p>
                  ${entry.format?.description || entry.name}${entry.version.version ? ` · Version ${entry.version.version}` : ""}
                </p>
                <details>
                  <summary>Technical format details</summary>
                  <dl>
                    ${field("Format", entry.format?.description)}${field("Group", entry.group?.description)}
                    ${field("Version", entry.version.version)}${field("Version ID", entry.version.uuid)}
                    ${field("Source position", entry.version.source_index)}${field("Replaces version", entry.version.replaces)}
                    ${field("Access format", String(entry.version.access_format))}
                    ${field("Preservation format", String(entry.version.preservation_format))}
                    ${field("Active version", String(entry.version.active))}
                    ${field("Used for this PRONOM identifier", String(entry.version.resolves_pronom_id))}
                  </dl>
                </details>`
        }
      </header>
      <md-divider></md-divider>
      <section
        class="actions"
        aria-label=${defaults ? "Fallback actions" : "Actions for this format"}
      >
        <h2>${defaults ? "Fallback actions" : "Actions for this format"}</h2>
        ${
          rules.length
            ? repeat(
                [...groups],
                ([purpose]) => purpose,
                ([purpose, actions]) =>
                  html`<section class="action-group" aria-label=${purposeLabel(purpose)}>
                    <h3>${purposeLabel(purpose)}</h3>
                    <md-list
                      >${repeat(
                        actions,
                        (rule) => rule.uuid,
                        (rule, position) => html`
                          ${position ? html`<md-divider></md-divider>` : nothing}
                          ${this.ruleDetails(rule)}
                        `,
                      )}</md-list
                    >
                  </section>`,
              )
            : html`<p>
                No current rules${this.purpose ? " for this purpose" : ""} are shown for this
                version. Workflow defaults may still apply.
              </p>`
        }
      </section>
      ${this.inspectionFooter(hiddenCount)}
    `;
  }

  inspectionFooter(hiddenCount) {
    const registry = this.index.registry;
    return html`<footer class="inspection-footer" aria-label="Registry context">
      ${
        hiddenCount
          ? html`<div class="rule-visibility">
              <p>
                ${hiddenCount} other rule${hiddenCount === 1 ? "" : "s"} hidden
                <span>Disabled, superseded or unavailable</span>
              </p>
              <md-text-button @click=${() => this.setFilter("status", "with-rules")}
                >Show all rules</md-text-button
              >
            </div>`
          : nothing
      }
      <p class="selection-note">
        Your preservation settings and workflow determine which registered actions run.
      </p>
      <details class="registry-record">
        <summary>Technical registry details</summary>
        <div class="registry-record-content">
          <dl>
            ${field("Source SHA-256", registry.source_sha256)}${field("A3M version", registry.a3m_version)}${field("Instance", registry.instance_id || "Not supplied")}${field("Schema version", registry.schema_version)}${field("Command bodies", this.commandBodies)}
          </dl>
          <h3>Loader diagnostics</h3>
          ${registry.diagnostics.length ? registry.diagnostics.map((item) => html`<p>${item.record_id}: ${item.message}</p>`) : html`<p>No loader diagnostics.</p>`}
        </div>
      </details>
    </footer>`;
  }

  render() {
    if (!this.active) return nothing;
    if (this.loading) return html`<p role="status">Loading format policy registry…</p>`;
    if (this.error)
      return html`<div role="alert">
        <p>${this.error}</p>
        <md-outlined-button @click=${() => this.load()}>Try again</md-outlined-button>
      </div>`;
    if (!this.index) return nothing;
    const entries = filterEntries(this.index, this.query, this.purpose, this.status);
    const pages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
    const purposes = [...new Set(this.index.registry.rules.map((rule) => rule.purpose))];
    return html`
      <div class="filters">
        <md-outlined-text-field
          class="search"
          label="Search formats, PUIDs or tools"
          type="search"
          .value=${this.query}
          @input=${(e) => this.setFilter("query", e.target.value)}
        ></md-outlined-text-field>
        <md-outlined-select
          label="Purpose"
          .value=${this.purpose}
          @change=${(e) => this.setFilter("purpose", e.target.value)}
        >
          <md-select-option value="" ?selected=${this.purpose === ""}
            ><div slot="headline">All purposes</div></md-select-option
          >
          ${purposes.map((purpose) => html`<md-select-option value=${purpose} ?selected=${this.purpose === purpose}><div slot="headline">${purposeLabel(purpose)}</div></md-select-option>`)}
        </md-outlined-select>
        <md-outlined-select
          label="Show"
          .value=${this.status}
          @change=${(e) => this.setFilter("status", e.target.value)}
        >
          ${[
            ["current", "Current rules"],
            ["with-rules", "All rules"],
            ["all", "All formats"],
          ].map(
            ([value, label]) =>
              html`<md-select-option value=${value} ?selected=${this.status === value}
                ><div slot="headline">${label}</div></md-select-option
              >`,
          )}
        </md-outlined-select>
        <md-text-button class="refresh" @click=${() => this.load()}>Refresh</md-text-button>
      </div>
      <div class="browser">
        <nav aria-label="FPR formats" class="format-list">
          <button
            class="format-row ${this.selected === "defaults" ? "selected" : ""}"
            aria-current=${this.selected === "defaults" ? "true" : "false"}
            @click=${() => {
              this.selected = "defaults";
            }}
          >
            Default rules
            <span
              >${ruleCount(visibleRules(this.index.defaults, this.purpose, this.status === "with-rules"))}</span
            >
          </button>
          <p class="result-count" role="status">
            ${entries.length} format version${entries.length === 1 ? "" : "s"}
          </p>
          <div class="rows">
            ${repeat(
              entries.slice(this.page * PAGE_SIZE, (this.page + 1) * PAGE_SIZE),
              (entry) => entry.version.uuid,
              (entry) =>
                html` <button
                  class="format-row ${this.selected === entry.version.uuid ? "selected" : ""}"
                  aria-current=${this.selected === entry.version.uuid ? "true" : "false"}
                  @click=${() => {
                    this.selected = entry.version.uuid;
                  }}
                >
                  ${entry.name}<span
                    >${entry.version.pronom_id || "No PRONOM identifier"} ·
                    ${ruleCount(visibleRules(entry.rules, this.purpose, this.status === "with-rules"))}${entry.version.active ? "" : " · Inactive"}</span
                  >
                </button>`,
            )}
          </div>
          ${!entries.length ? html`<p class="result-count">No formats match these filters.</p>` : nothing}
          <div class="pagination">
            <md-text-button
              aria-label="Previous formats page"
              ?disabled=${this.page === 0}
              @click=${() => {
                this.page--;
              }}
            >
              Previous</md-text-button
            ><span>${this.page + 1} / ${pages}</span
            ><md-text-button
              aria-label="Next formats page"
              ?disabled=${this.page + 1 >= pages}
              @click=${() => {
                this.page++;
              }}
            >
              Next
            </md-text-button>
          </div>
        </nav>
        <section class="detail" aria-label="Format rules">${this.detailPane()}</section>
      </div>
    `;
  }
}

customElements.define("curate-fpr-viewer", FPRViewer);
export default FPRViewer;

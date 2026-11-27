import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  indexRegistry,
  filterEntries,
  ruleStatus,
  fprErrorMessage,
  visibleRules,
} from "./fpr-model.js";

const fixture = JSON.parse(
  readFileSync(new URL("../../../../preview/fpr-registry.json", import.meta.url)),
);

test("real registry: source provenance and policy projection", () => {
  const source = new URL(
    "../../../../../a3m/a3m/fpr/migrations/initial-data.json",
    import.meta.url,
  );
  if (existsSync(source)) {
    assert.equal(
      fixture.source_sha256,
      createHash("sha256").update(readFileSync(source)).digest("hex"),
      "Regenerate the FPR preview fixture",
    );
  }
  assert.ok(fixture.rules.length > 800);
  assert.ok(fixture.commands.every((command) => command.command === ""));
  assert.ok(fixture.versions.some((version) => !Object.hasOwn(version, "version")));
});

test("defaults are separated by purpose without reordering registry rules", () => {
  const index = indexRegistry(fixture);
  assert.ok(index.defaults.length > 0);
  assert.deepEqual(
    index.defaults,
    fixture.rules.filter((rule) => rule.purpose.startsWith("default_")),
  );
  for (const entry of index.entries) {
    assert.deepEqual(
      entry.rules,
      fixture.rules.filter(
        (rule) => rule.format === entry.version.uuid && !rule.purpose.startsWith("default_"),
      ),
    );
  }
});

test("search can combine PUID, purpose and tool; selection uses exported flags", () => {
  const index = indexRegistry(fixture);
  const matches = filterEntries(index, "fmt/353", "preservation", "selected");
  assert.ok(matches.length > 0);
  assert.ok(matches.every((entry) => entry.rules.some((rule) => rule.selected_by_registry)));
  const entry = matches[0];
  const command = index.commands.get(
    entry.rules.find((rule) => rule.purpose === "preservation").command,
  );
  const tool = index.tools.get(command.tool);
  assert.ok(
    filterEntries(index, `fmt/353 ${tool.description}`, "preservation", "with-rules").length > 0,
  );
  assert.equal(filterEntries(index, "not-a-real-format-xyz", "", "all").length, 0);
  assert.ok(filterEntries(index, "", "", "inactive").every((item) => !item.version.active));
});

test("disabled replacements remain visible and explain the hidden original", () => {
  const registry = {
    schema_version: 1,
    groups: [],
    formats: [],
    versions: [],
    tools: [],
    commands: [],
    diagnostics: [],
    rules: [
      {
        uuid: "old",
        purpose: "preservation",
        format: "format",
        enabled: true,
        loaded: true,
        selected_by_registry: false,
      },
      {
        uuid: "new",
        purpose: "preservation",
        format: "format",
        replaces: "old",
        enabled: false,
        loaded: true,
        selected_by_registry: false,
      },
    ],
  };
  const index = indexRegistry(registry);
  assert.match(ruleStatus(registry.rules[0], index), /disabled replacement/);
  assert.equal(ruleStatus(registry.rules[1], index), "Disabled");
  assert.equal(index.rulesByVersion.get("format").length, 2);
});

test("unsupported schema fails instead of showing an empty registry", () => {
  assert.throws(() => indexRegistry({ schema_version: 2 }), /Unsupported/);
  assert.throws(() => indexRegistry({ schema_version: 1 }), /Incomplete/);
  assert.match(fprErrorMessage({ code: "fpr_not_configured" }), /not been configured/);
  assert.match(fprErrorMessage({ status: 401 }), /Sign in/);
});

test("dropped replacements do not mark a selected original as superseded", () => {
  const registry = {
    schema_version: 1,
    groups: [],
    formats: [],
    versions: [],
    tools: [],
    commands: [],
    diagnostics: [],
    rules: [
      {
        uuid: "original",
        format: "version",
        purpose: "preservation",
        loaded: true,
        enabled: true,
        selected_by_registry: true,
      },
      {
        uuid: "dropped",
        format: "version",
        purpose: "preservation",
        replaces: "original",
        loaded: false,
        enabled: false,
        selected_by_registry: false,
      },
    ],
  };
  const index = indexRegistry(registry);
  assert.equal(ruleStatus(registry.rules[0], index), "Selected by registry");
  assert.match(ruleStatus(registry.rules[1], index), /Not loaded/);
  assert.deepEqual(visibleRules(registry.rules, "preservation"), [registry.rules[0]]);
});

test("API failures and browser timeouts have specific safe explanations", () => {
  for (const [code, expected] of [
    ["fpr_not_configured", /not been configured/],
    ["fpr_not_supported", /does not support/],
    ["fpr_unavailable", /temporarily unavailable/],
    ["fpr_timeout", /too long/],
    ["fpr_schema_unsupported", /not supported/],
    ["fpr_upstream_error", /engine could not provide/],
    ["fpr_encoding_error", /could not encode/],
  ])
    assert.match(fprErrorMessage({ code, message: "private engine details" }), expected);
  assert.match(fprErrorMessage({ name: "TimeoutError" }), /too long/);
  assert.doesNotMatch(
    fprErrorMessage({ code: "unexpected", message: "private engine details" }),
    /private/,
  );
});

test("purpose and selected filters must match the same rule", () => {
  const index = indexRegistry({
    schema_version: 1,
    groups: [],
    formats: [],
    versions: [{ uuid: "version", active: true }],
    tools: [],
    commands: [],
    diagnostics: [],
    rules: [
      { uuid: "preserve", format: "version", purpose: "preservation", selected_by_registry: false },
      { uuid: "access", format: "version", purpose: "access", selected_by_registry: true },
    ],
  });
  assert.equal(filterEntries(index, "", "preservation", "selected").length, 0);
  assert.equal(filterEntries(index, "", "access", "selected").length, 1);
});

test("archivist view uses exported current rules and retains history on request", () => {
  const index = indexRegistry(fixture);
  const defaults = visibleRules(index.defaults, "", false);
  assert.deepEqual(
    defaults,
    fixture.rules.filter(
      (rule) => rule.purpose.startsWith("default_") && rule.selected_by_registry,
    ),
  );
  assert.ok(visibleRules(index.defaults, "", true).length > defaults.length);
  const entries = filterEntries(index, "", "preservation", "current");
  assert.ok(entries.length > 0);
  assert.ok(
    entries.every(
      (entry) => entry.version.active && visibleRules(entry.rules, "preservation").length > 0,
    ),
  );
  assert.ok(
    visibleRules(index.defaults, "default_thumbnail").every(
      (rule) => rule.purpose === "default_thumbnail" && rule.selected_by_registry,
    ),
  );
});

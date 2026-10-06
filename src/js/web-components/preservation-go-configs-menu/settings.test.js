import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SETTINGS,
  FALLBACK_DEFAULTS,
  valuesFromConfig,
  configPayload,
  differences,
  diffChips,
  summaryText,
  validateName,
} from "./settings.js";

const BOOLEAN_KEYS = [
  "assign_uuids_to_directories",
  "examine_contents",
  "generate_transfer_structure_report",
  "document_empty_directories",
  "extract_packages",
  "delete_packages_after_extraction",
  "identify_transfer",
  "identify_submission_and_metadata",
  "identify_before_normalization",
  "normalize",
  "transcribe_files",
  "perform_policy_checks_on_originals",
  "perform_policy_checks_on_preservation_derivatives",
  "perform_policy_checks_on_access_derivatives",
];

const snakeConfig = (a3m = {}, root = {}) => ({
  id: 2,
  name: "Test",
  description: "",
  compress_aip: false,
  a3m_config: {
    assign_uuids_to_directories: true,
    examine_contents: false,
    generate_transfer_structure_report: true,
    document_empty_directories: true,
    extract_packages: true,
    delete_packages_after_extraction: false,
    identify_transfer: true,
    identify_submission_and_metadata: true,
    identify_before_normalization: true,
    normalize: true,
    transcribe_files: true,
    perform_policy_checks_on_originals: true,
    perform_policy_checks_on_preservation_derivatives: true,
    perform_policy_checks_on_access_derivatives: true,
    thumbnail_mode: 1,
    ...a3m,
  },
  ...root,
});

test("SETTINGS: five essentials first, then ten advanced, unique keys", () => {
  const groups = SETTINGS.map((s) => s.group);
  assert.deepEqual(groups.slice(0, 5), Array(5).fill("essential"));
  assert.deepEqual(groups.slice(5), Array(10).fill("advanced"));
  assert.equal(new Set(SETTINGS.map((s) => s.key)).size, SETTINGS.length);
  for (const s of SETTINGS) {
    assert.ok(s.label && s.description, `${s.key} has copy`);
    assert.ok(s.options.length >= 2, `${s.key} has options`);
    for (const o of s.options) assert.ok(o.chip, `${s.key} option ${o.value} has a chip`);
  }
});

test("SETTINGS: only the three normalisation dependants need normalise", () => {
  const needs = SETTINGS.filter((s) => s.needsNormalise).map((s) => s.key);
  assert.deepEqual(needs, [
    "identify_before_normalization",
    "perform_policy_checks_on_preservation_derivatives",
    "perform_policy_checks_on_access_derivatives",
  ]);
});

test("FALLBACK_DEFAULTS: matches the seeded default", () => {
  assert.deepEqual(valuesFromConfig(snakeConfig()), FALLBACK_DEFAULTS);
  assert.equal(FALLBACK_DEFAULTS.examine_contents, false);
  assert.equal(FALLBACK_DEFAULTS.packages, "extract_keep");
});

test("valuesFromConfig: reads snake_case a3m_config", () => {
  const v = valuesFromConfig(
    snakeConfig({ normalize: false, thumbnail_mode: 3 }, { compress_aip: true }),
  );
  assert.equal(v.normalize, false);
  assert.equal(v.thumbnail_mode, 3);
  assert.equal(v.compress_aip, true);
});

test("valuesFromConfig: reads camelCase a3m_config", () => {
  const v = valuesFromConfig({
    a3m_config: {
      examineContents: true,
      performPolicyChecksOnPreservationDerivatives: false,
      identifySubmissionAndMetadata: false,
      thumbnailMode: 2,
      extractPackages: false,
    },
  });
  assert.equal(v.examine_contents, true);
  assert.equal(v.perform_policy_checks_on_preservation_derivatives, false);
  assert.equal(v.identify_submission_and_metadata, false);
  assert.equal(v.thumbnail_mode, 2);
  assert.equal(v.packages, "leave");
});

test("valuesFromConfig: missing keys fall back, bad thumbnail mode falls back", () => {
  assert.deepEqual(valuesFromConfig({}), FALLBACK_DEFAULTS);
  assert.deepEqual(valuesFromConfig(null), FALLBACK_DEFAULTS);
  assert.equal(valuesFromConfig({ a3m_config: { thumbnail_mode: 9 } }).thumbnail_mode, 1);
  assert.equal(valuesFromConfig({ a3m_config: { thumbnail_mode: "3" } }).thumbnail_mode, 3);
});

test("valuesFromConfig: packages mapping from extract and delete", () => {
  const pick = (extract, del) =>
    valuesFromConfig(
      snakeConfig({ extract_packages: extract, delete_packages_after_extraction: del }),
    ).packages;
  assert.equal(pick(false, false), "leave");
  assert.equal(pick(true, false), "extract_keep");
  assert.equal(pick(true, true), "extract_delete");
  // delete is meaningless without extract, so it reads as "leave"
  assert.equal(pick(false, true), "leave");
});

test("configPayload: packages mapping on write", () => {
  const out = (packages) =>
    configPayload({ ...FALLBACK_DEFAULTS, packages }, { name: "n", description: "" }).a3m_config;
  assert.deepEqual(
    [out("leave").extract_packages, out("leave").delete_packages_after_extraction],
    [false, false],
  );
  assert.deepEqual(
    [out("extract_keep").extract_packages, out("extract_keep").delete_packages_after_extraction],
    [true, false],
  );
  assert.deepEqual(
    [
      out("extract_delete").extract_packages,
      out("extract_delete").delete_packages_after_extraction,
    ],
    [true, true],
  );
});

test("configPayload: all 14 booleans and thumbnail_mode, compress_aip at root", () => {
  const payload = configPayload(
    { ...FALLBACK_DEFAULTS, compress_aip: true, thumbnail_mode: 2 },
    { name: "My config", description: "Notes" },
  );
  assert.equal(payload.name, "My config");
  assert.equal(payload.description, "Notes");
  assert.equal(payload.compress_aip, true);
  assert.deepEqual(
    Object.keys(payload.a3m_config).sort(),
    [...BOOLEAN_KEYS, "thumbnail_mode"].sort(),
  );
  for (const k of BOOLEAN_KEYS) assert.equal(typeof payload.a3m_config[k], "boolean", k);
  assert.equal(payload.a3m_config.thumbnail_mode, 2);
  assert.equal("compress_aip" in payload.a3m_config, false);
});

test("configPayload: never sends compression or dip fields", () => {
  const payload = configPayload(FALLBACK_DEFAULTS, { name: "n", description: "d" });
  assert.deepEqual(Object.keys(payload).sort(), [
    "a3m_config",
    "compress_aip",
    "description",
    "name",
  ]);
  const text = JSON.stringify(payload);
  assert.equal(text.includes("aip_compression"), false);
  assert.equal(text.includes("generate_dip"), false);
});

test("configPayload round-trips through valuesFromConfig", () => {
  const values = {
    ...FALLBACK_DEFAULTS,
    normalize: false,
    packages: "extract_delete",
    thumbnail_mode: 3,
    compress_aip: true,
    examine_contents: true,
  };
  const back = valuesFromConfig(configPayload(values, { name: "n", description: "" }));
  assert.deepEqual(back, values);
});

test("differences: none against an identical default", () => {
  assert.deepEqual(differences(FALLBACK_DEFAULTS, FALLBACK_DEFAULTS), []);
  assert.deepEqual(diffChips(FALLBACK_DEFAULTS, FALLBACK_DEFAULTS), []);
});

test("differences: ordered with essentials first", () => {
  const values = {
    ...FALLBACK_DEFAULTS,
    examine_contents: true,
    compress_aip: true,
    normalize: false,
    identify_transfer: false,
  };
  assert.deepEqual(differences(values, FALLBACK_DEFAULTS), [
    "normalize",
    "compress_aip",
    "examine_contents",
    "identify_transfer",
  ]);
});

test("diffChips: describes the config's own value, one per difference", () => {
  const values = {
    ...FALLBACK_DEFAULTS,
    normalize: false,
    thumbnail_mode: 3,
    packages: "extract_delete",
    compress_aip: true,
    examine_contents: true,
  };
  assert.deepEqual(diffChips(values, FALLBACK_DEFAULTS), [
    "No normalisation",
    "No thumbnails",
    "Deletes packages",
    "Compressed",
    "Scans contents",
  ]);
});

test("diffChips: remaining choice and boolean chips", () => {
  const chips = (patch) => diffChips({ ...FALLBACK_DEFAULTS, ...patch }, FALLBACK_DEFAULTS);
  assert.deepEqual(chips({ transcribe_files: false }), ["No OCR"]);
  assert.deepEqual(chips({ thumbnail_mode: 2 }), ["Format-specific thumbnails"]);
  assert.deepEqual(chips({ packages: "leave" }), ["Packages not extracted"]);
  assert.deepEqual(chips({ assign_uuids_to_directories: false }), ["No folder UUIDs"]);
});

test("differences: compares against a non-fallback default", () => {
  const def = { ...FALLBACK_DEFAULTS, normalize: false, compress_aip: true };
  assert.deepEqual(differences(def, def), []);
  assert.deepEqual(diffChips(FALLBACK_DEFAULTS, def), ["Normalises", "Not compressed"]);
});

test("summaryText: booleans", () => {
  assert.equal(summaryText("normalize", { normalize: true }), "On");
  assert.equal(summaryText("transcribe_files", { transcribe_files: false }), "Off");
  assert.equal(summaryText("examine_contents", { examine_contents: true }), "On");
  assert.equal(summaryText("compress_aip", { compress_aip: true }), "Compressed");
  assert.equal(summaryText("compress_aip", { compress_aip: false }), "Not compressed");
});

test("summaryText: each thumbnail and packages choice", () => {
  assert.equal(summaryText("thumbnail_mode", { thumbnail_mode: 1 }), "Generate");
  assert.equal(summaryText("thumbnail_mode", { thumbnail_mode: 2 }), "Format-specific only");
  assert.equal(summaryText("thumbnail_mode", { thumbnail_mode: 3 }), "None");
  assert.equal(summaryText("packages", { packages: "leave" }), "Leave as they are");
  assert.equal(summaryText("packages", { packages: "extract_keep" }), "Extract, keep original");
  assert.equal(summaryText("packages", { packages: "extract_delete" }), "Extract, delete original");
});

test("validateName: length, trimming and case-insensitive uniqueness", () => {
  const configs = [
    { id: 1, name: "Default Configuration" },
    { id: 2, name: "Born digital" },
  ];
  assert.match(validateName("", configs, null), /at least 3/);
  assert.match(validateName("  ab ", configs, null), /at least 3/);
  assert.match(validateName("born DIGITAL ", configs, null), /already/);
  assert.equal(validateName("born digital", configs, 2), "");
  assert.equal(validateName("Scans", configs, null), "");
});

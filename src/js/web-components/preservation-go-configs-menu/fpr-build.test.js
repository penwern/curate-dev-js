import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const configuration = require("../../../../webpack.config.js");
const previewValue = (env, mode) =>
  configuration(env, { mode }).plugins.find(
    (plugin) => plugin.definitions?.["process.env.FPR_PREVIEW_REGISTRY"] !== undefined,
  ).definitions["process.env.FPR_PREVIEW_REGISTRY"];

test("production cannot embed the FPR snapshot even with the preview flag", () => {
  for (const flag of [true, "true", false, undefined])
    assert.equal(previewValue({ fprPreview: flag }, "production"), "null");
  assert.equal(previewValue({}, "development"), "null");
});

test("snapshot mode requires an explicit development flag and omits scripts", () => {
  const registry = JSON.parse(previewValue({ fprPreview: true }, "development"));
  assert.equal(registry.schema_version, 1);
  assert.ok(registry.commands.length > 0);
  assert.ok(registry.commands.every((command) => command.command === ""));
  assert.deepEqual(JSON.parse(previewValue({ fprPreview: "true" }, "development")), registry);
});

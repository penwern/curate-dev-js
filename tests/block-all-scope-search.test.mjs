import assert from "node:assert/strict";
import { test } from "node:test";
import { isAllScopeSearch } from "../src/js/core/BlockAllScopeSearch.js";

const body = (Query) => JSON.stringify({ Query, Size: 10 });

test("all-scope searches are blocked", () => {
  assert.equal(isAllScopeSearch(body({ FileName: "*" })), true);
  assert.equal(isAllScopeSearch(body({ FileName: "x", PathPrefix: [] })), true);
});

test("scoped searches are allowed", () => {
  assert.equal(isAllScopeSearch(body({ PathPrefix: ["personal-files"] })), false);
  assert.equal(isAllScopeSearch(body({ UUIDs: ["abc"] })), false);
  assert.equal(isAllScopeSearch(body({ Paths: ["/a"] })), false);
});

test("non-JSON or query-less bodies are allowed", () => {
  assert.equal(isAllScopeSearch("not json"), false);
  assert.equal(isAllScopeSearch(undefined), false);
  assert.equal(isAllScopeSearch("{}"), false);
});

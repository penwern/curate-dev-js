const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

// client.js is an ES module with no imports; drop the export keywords and hand
// the functions under test back through the context.
const source =
  fs
    .readFileSync(path.join(__dirname, "../src/js/web-components/dashboard/client.js"), "utf8")
    .replace(/^export /gm, "") +
  "\n;__out.getStorageReports = getStorageReports;" +
  "\n__out.fetchStorageReportBlob = fetchStorageReportBlob;" +
  "\n__out.currentUserIsAdmin = currentUserIsAdmin;";

function setup({ status = 200, body = {}, user } = {}) {
  const calls = [];
  const out = {};
  const fetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: "status",
      json: async () => body,
      blob: async () => "BLOB",
    };
  };
  vm.runInNewContext(source, {
    __out: out,
    fetch,
    window: { pydio: user ? { user } : undefined },
    PydioApi: { _PydioRestClient: { getOrUpdateJwt: async () => "jwt-token" } },
    sessionStorage: {
      getItem: () => null,
      setItem() {},
      removeItem() {},
      key: () => null,
      length: 0,
    },
    console: { warn() {}, error() {}, log() {} },
    URLSearchParams,
    Date,
    Map,
    Promise,
  });
  return { ...out, calls };
}

test("getStorageReports sends the bearer token to /reports", async () => {
  const c = setup({ body: { reports: [{ period: "2026-10" }] } });
  const res = await c.getStorageReports("https://h/api/dashboard/storage");
  assert.equal(res.reports[0].period, "2026-10");
  assert.equal(c.calls[0].url, "https://h/api/dashboard/storage/reports");
  assert.equal(c.calls[0].options.headers.Authorization, "Bearer jwt-token");
});

test("getStorageReports treats 404 as not set up", async () => {
  const c = setup({ status: 404 });
  const res = await c.getStorageReports("https://h/s");
  assert.equal(res.notSetUp, true);
  assert.equal(res.reports.length, 0);
});

test("getStorageReports throws on other errors", async () => {
  const c = setup({ status: 403 });
  await assert.rejects(c.getStorageReports("https://h/s"), /Storage API 403/);
});

test("fetchStorageReportBlob fetches one month's file with the token", async () => {
  const c = setup();
  assert.equal(await c.fetchStorageReportBlob("https://h/s", "2026-10", "pdf"), "BLOB");
  assert.equal(c.calls[0].url, "https://h/s/reports/2026-10.pdf");
  assert.equal(c.calls[0].options.headers.Authorization, "Bearer jwt-token");
  assert.equal(c.calls[0].options.headers.Accept, "application/pdf");
});

test("fetchStorageReportBlob refuses names that are not a report", async () => {
  const c = setup();
  for (const [period, ext] of [
    ["2026-13", "pdf"],
    ["../x", "pdf"],
    ["2026-10", "exe"],
  ]) {
    await assert.rejects(c.fetchStorageReportBlob("https://h/s", period, ext), /Not a report/);
  }
  assert.equal(c.calls.length, 0);
});

test("currentUserIsAdmin is true only for the admin profile", () => {
  assert.equal(setup({ user: { isAdmin: true } }).currentUserIsAdmin(), true);
  assert.equal(
    setup({
      user: { isAdmin: false, idmUser: { Roles: [{ Label: "SuperUser" }] } },
    }).currentUserIsAdmin(),
    false,
  );
  assert.equal(setup().currentUserIsAdmin(), false);
});

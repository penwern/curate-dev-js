const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const source = fs.readFileSync(
  path.join(__dirname, "../src/js/core/CustomPreservationConfigs.js"),
  "utf8",
);

function setup({ status = 202, user = {}, curateOnWindow = false } = {}) {
  const fetches = [];
  const messages = [];
  const sandbox = {
    window: { location: { origin: "https://curate.test" }, addEventListener() {} },
    fetch: async (url, opts) => {
      fetches.push({ url, opts });
      return { ok: status >= 200 && status < 300, status, json: async () => ({}) };
    },
    console: { info() {}, error() {}, log() {} },
    PydioApi: { _PydioRestClient: { getOrUpdateJwt: async () => "tok" } },
    Curate: { workspaces: { getOpenWorkspace: () => "personal-files" } },
    pydio: {
      user,
      _dataModel: { _selectedNodes: [{ _path: "/a.pdf" }, { _path: "/b.pdf" }] },
      displayMessage: (type, msg) => messages.push([type, msg]),
    },
  };
  if (curateOnWindow) {
    sandbox.window.Curate = sandbox.Curate;
  }
  vm.runInNewContext(source, sandbox);
  return { ctx: sandbox, fetches, messages };
}

const withHook = { querySelector: () => ({}) };
const noHook = { querySelector: () => null };

test("hook present: hook URL and body unchanged", async () => {
  const { ctx, fetches } = setup();
  ctx.syncPreserveHook(withHook);
  await ctx.submitPreservationRequest(1);
  assert.equal(fetches[0].url, "https://curate.test/a/scheduler/hooks/preserve");
  assert.deepEqual(JSON.parse(fetches[0].opts.body), {
    Paths: ["personal-files/a.pdf", "personal-files/b.pdf"],
    JobParameters: { ConfigId: "1" },
  });
});

test("no decision before login: hook assumed present", async () => {
  const { ctx, fetches } = setup({ user: null });
  ctx.syncPreserveHook(noHook);
  await ctx.submitPreservationRequest("1");
  assert.equal(fetches[0].url, "https://curate.test/a/scheduler/hooks/preserve");
});

test("exposes Curate.preservation.submit for the vanitizer button", () => {
  const { ctx } = setup({ curateOnWindow: true });
  assert.equal(ctx.window.Curate.preservation.submit, ctx.submitPreservationRequest);
});

test("no hook: posts paths and configId to /curate/preserve with bearer", async () => {
  const { ctx, fetches, messages } = setup({ status: 202 });
  ctx.syncPreserveHook(noHook);
  await ctx.submitPreservationRequest("1");
  assert.equal(fetches[0].url, "https://curate.test/curate/preserve");
  assert.equal(fetches[0].opts.headers.authorization, "Bearer tok");
  assert.deepEqual(JSON.parse(fetches[0].opts.body), {
    paths: ["personal-files/a.pdf", "personal-files/b.pdf"],
    configId: "1",
  });
  assert.equal(messages[0][0], "SUCCESS");
});

for (const [status, fragment] of [
  [401, "sign in"],
  [403, "personal-files/a.pdf"],
  [500, "500"],
]) {
  test(`no hook: HTTP ${status} shows an error toast`, async () => {
    const { ctx, messages } = setup({ status });
    ctx.syncPreserveHook(noHook);
    await ctx.submitPreservationRequest("1");
    assert.equal(messages[0][0], "ERROR");
    assert.ok(messages[0][1].includes(fragment), messages[0][1]);
  });
}

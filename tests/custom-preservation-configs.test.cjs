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
  const registered = [];
  class Action {
    constructor(...args) {
      this.args = args;
    }
  }
  const sandbox = {
    window: { location: { origin: "https://curate.test" }, addEventListener() {} },
    fetch: async (url, opts) => {
      fetches.push({ url, opts });
      return { ok: status >= 200 && status < 300, status, json: async () => ({}) };
    },
    console: { info() {}, error() {}, log() {} },
    PydioCore: { Action },
    PydioApi: { _PydioRestClient: { getOrUpdateJwt: async () => "tok" } },
    Curate: { workspaces: { getOpenWorkspace: () => "personal-files" } },
    pydio: {
      user,
      _dataModel: { _selectedNodes: [{ _path: "/a.pdf" }, { _path: "/b.pdf" }] },
      getController: () => ({
        updateGuiActions: (m) => registered.push(m),
      }),
      displayMessage: (type, msg) => messages.push([type, msg]),
    },
  };
  if (curateOnWindow) {
    sandbox.window.Curate = sandbox.Curate;
  }
  vm.runInNewContext(source, sandbox);
  return { ctx: sandbox, fetches, messages, registered };
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

test("hook present: no right-click action registered", () => {
  const { ctx, registered } = setup();
  ctx.syncPreserveHook(withHook);
  assert.equal(registered.length, 0);
});

test("no hook: right-click-only Preserve action registered", () => {
  const { ctx, registered } = setup();
  ctx.syncPreserveHook(noHook);
  const [props, gui, selection, rights] = registered[0].get("preserve").args;
  assert.equal(props.name, "preserve");
  assert.equal(typeof props.callback, "function");
  assert.equal(gui.contextMenu, true);
  assert.equal(gui.actionBar, false);
  assert.equal(selection.unique, false);
  assert.equal(rights.write, true);
});

test("no decision before login: hook assumed present", async () => {
  const { ctx, fetches, registered } = setup({ user: null });
  ctx.syncPreserveHook(noHook);
  assert.equal(registered.length, 0);
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

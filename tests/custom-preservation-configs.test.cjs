const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const source = fs.readFileSync(
  path.join(__dirname, "../src/js/core/CustomPreservationConfigs.js"),
  "utf8",
);

function setup({ status = 202, user = {} } = {}) {
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
  vm.runInNewContext(source, sandbox);
  return { ctx: sandbox, fetches, messages, registered };
}

const withHook = { querySelector: () => ({}) };
const noHook = { querySelector: () => null };

test("hook present: nothing registered, hook URL and body unchanged", async () => {
  const { ctx, fetches, registered } = setup();
  ctx.syncPreserveAction(withHook);
  await ctx.submitPreservationRequest(1);
  assert.equal(registered.length, 0);
  assert.equal(fetches[0].url, "https://curate.test/a/scheduler/hooks/preserve");
  assert.deepEqual(JSON.parse(fetches[0].opts.body), {
    Paths: ["personal-files/a.pdf", "personal-files/b.pdf"],
    JobParameters: { ConfigId: "1" },
  });
});

test("no hook: action registered once with real booleans", () => {
  const { ctx, registered } = setup();
  ctx.syncPreserveAction(noHook);
  ctx.syncPreserveAction(noHook);
  assert.equal(registered.length, 1);
  const action = registered[0].get("preserve");
  const [props, gui, selection, rights] = action.args;
  assert.equal(props.name, "preserve");
  assert.equal(typeof props.callback, "function");
  assert.equal(gui.contextMenu, true);
  assert.equal(gui.dir, false);
  assert.equal(selection.unique, false);
  assert.equal(rights.userLogged, true);
});

test("no decision before login", () => {
  const { ctx, registered } = setup({ user: null });
  ctx.syncPreserveAction(noHook);
  assert.equal(registered.length, 0);
});

test("no hook: posts paths and configId to /curate/preserve with bearer", async () => {
  const { ctx, fetches, messages } = setup({ status: 202 });
  ctx.syncPreserveAction(noHook);
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
    ctx.syncPreserveAction(noHook);
    await ctx.submitPreservationRequest("1");
    assert.equal(messages[0][0], "ERROR");
    assert.ok(messages[0][1].includes(fragment), messages[0][1]);
  });
}

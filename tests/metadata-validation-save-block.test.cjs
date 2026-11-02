const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const source = fs
  .readFileSync(
    path.join(__dirname, "../src/js/core/validation/MetadataValidationManager.js"),
    "utf8",
  )
  .replace(/^import .*;\r?\n/gm, "")
  .replace(
    "export default MetadataValidationManager;",
    "globalThis.Manager = MetadataValidationManager;",
  );

function setup() {
  const attrs = new Map();
  const classes = new Set();
  const saveButton = {
    textContent: "Save",
    setAttribute: (k, v) => attrs.set(k, v),
    removeAttribute: (k) => attrs.delete(k),
    classList: { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) },
    contains: (t) => t === saveButton || t === saveButton.child,
    child: {},
    insertAdjacentElement() {},
  };
  const listeners = [];
  const document = {
    addEventListener: (type, fn, capture) => listeners.push({ type, fn, capture }),
    removeEventListener: (type, fn) => {
      const i = listeners.findIndex((l) => l.fn === fn && l.type === type);
      if (i >= 0) listeners.splice(i, 1);
    },
    contains: () => true,
    getElementById: () => null,
    querySelectorAll: (sel) => (sel === "button" ? [saveButton] : []),
    createElement: () => ({
      style: {},
      addEventListener() {},
      remove() {},
      get nextElementSibling() {
        return saveButton;
      },
    }),
    head: { appendChild() {} },
  };
  const ctx = {
    document,
    window: { pydio: { MessageHash: { "meta.user.15": "Save" } } },
    Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 },
    console,
    globalThis: null,
  };
  ctx.globalThis = ctx;
  vm.runInNewContext(source, ctx);
  const delegator = { addEventListener: () => 1, removeEventListener() {} };
  const manager = new ctx.Manager({ delegator });
  let modals = 0;
  manager.showValidationErrorsModal = () => modals++;
  manager.attach();
  const click = (target) => {
    const ev = {
      target,
      prevented: false,
      stopped: false,
      preventDefault() {
        this.prevented = true;
      },
      stopImmediatePropagation() {
        this.stopped = true;
      },
    };
    listeners.filter((l) => l.type === "click" && l.capture).forEach((l) => l.fn(ev));
    return ev;
  };
  return { manager, saveButton, attrs, classes, listeners, click, modals: () => modals };
}

test("Save click is blocked and opens the modal while errors exist", () => {
  const t = setup();
  t.manager.errors.set("aspace:date_label", "Date label is required");
  t.manager._updateSaveIndicator();
  assert.equal(t.attrs.get("aria-disabled"), "true");
  assert.ok(t.classes.has("curate-validation-save-blocked"));
  const ev = t.click(t.saveButton.child);
  assert.ok(ev.prevented && ev.stopped);
  assert.equal(t.modals(), 1);
});

test("Save click passes through when there are no errors, and after errors clear", () => {
  const t = setup();
  let ev = t.click(t.saveButton);
  assert.ok(!ev.prevented && !ev.stopped);
  t.manager.errors.set("aspace:date_label", "x");
  t.manager._updateSaveIndicator();
  t.manager.errors.clear();
  t.manager._updateSaveIndicator();
  assert.equal(t.attrs.has("aria-disabled"), false);
  ev = t.click(t.saveButton);
  assert.ok(!ev.prevented);
  assert.equal(t.modals(), 0);
});

test("Clicks outside the Save button are never blocked", () => {
  const t = setup();
  t.manager.errors.set("aspace:date_label", "x");
  const ev = t.click({});
  assert.ok(!ev.prevented);
});

test("detach removes the listener", () => {
  const t = setup();
  t.manager.detach();
  assert.equal(t.listeners.length, 0);
});

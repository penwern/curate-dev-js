const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const source = fs
  .readFileSync(path.join(__dirname, "../src/js/core/UploadLimits/UploadLimiter.js"), "utf8")
  .replace(/^import .*;\r?\n/gm, "");

function setup(limit = 1000) {
  const handlers = new Map();
  const uploads = [];
  const popups = [];
  const targetNode = { path: "/destination" };
  const store = {
    pushSession() {},
    handleDropEventResults(...args) {
      uploads.push(args);
    },
  };
  vm.runInNewContext(source, {
    maxUploadFiles: limit,
    eventDelegator: {
      addEventListener(_selector, event, handler) {
        handlers.set(event, handler);
      },
    },
    CurateUi: {
      modals: {
        curatePopup: class {
          constructor(options) {
            popups.push(options);
          }
          fire() {}
        },
      },
    },
    window: { UploaderModel: { Store: { getInstance: () => store } } },
    pydio: { observe() {}, getContextHolder: () => ({ getContextNode: () => targetNode }) },
    console: { error() {} },
    setTimeout() {},
  });
  return { drop: handlers.get("drop"), uploads, popups, targetNode };
}

function fileEntry(name) {
  return { isFile: true, isDirectory: false, fullPath: "/" + name };
}

function directory(batches) {
  return {
    isFile: false,
    isDirectory: true,
    createReader() {
      let batch = 0;
      return {
        readEntries(resolve) {
          queueMicrotask(() => resolve(batches[batch++] || []));
        },
      };
    },
  };
}

function dropEvent(entries) {
  let readable = true;
  const event = {
    dataTransfer: {
      types: ["Files"],
      files: [],
      items: entries.map((entry) => ({
        kind: "file",
        webkitGetAsEntry: () => (readable ? entry : null),
        getAsFile: () => null,
      })),
    },
    preventDefault() {},
    stopPropagation() {},
    stopImmediatePropagation() {},
  };
  return {
    event,
    expire() {
      readable = false;
      event.dataTransfer.items.length = 0;
      event.dataTransfer.files.length = 0;
    },
  };
}

test("directory entries survive the drop payload expiring during traversal", async () => {
  const app = setup();
  const roots = [directory([[fileEntry("a")]]), directory([[fileEntry("b")]])];
  const payload = dropEvent(roots);
  const pending = app.drop(payload.event);
  payload.expire();
  await pending;
  assert.equal(app.uploads.length, 1);
  const [items, , targetNode] = app.uploads[0];
  assert.equal(items.length, 2);
  assert.equal(items[0].webkitGetAsEntry(), roots[0]);
  assert.equal(items[1].webkitGetAsEntry(), roots[1]);
  assert.equal(targetNode, app.targetNode);
});

test("limits include subsequent directory batches and nested files", async () => {
  const app = setup(100);
  const firstBatch = Array.from({ length: 100 }, (_, i) => fileEntry(String(i)));
  const root = directory([firstBatch, [directory([[fileEntry("nested")]])]]);
  await app.drop(dropEvent([root]).event);
  assert.equal(app.uploads.length, 0);
  assert.match(app.popups[0].message, /101 more/);
});

test("empty directories are handed to Pydio without consuming the file limit", async () => {
  const app = setup(1);
  await app.drop(dropEvent([directory([]), fileEntry("a")]).event);
  assert.equal(app.uploads[0][0].length, 2);
  assert.equal(app.popups.length, 0);
});

test("plain file fallback survives the drop payload expiring", async () => {
  const app = setup();
  const payload = dropEvent([]);
  const file = { name: "a.txt", size: 10 };
  payload.event.dataTransfer.files.push(file);
  const pending = app.drop(payload.event);
  payload.expire();
  await pending;
  assert.equal(app.uploads[0][1][0], file);
});

test("file items without entry support use captured File objects", async () => {
  const app = setup();
  const payload = dropEvent([]);
  const file = { name: "a.txt", size: 10 };
  payload.event.dataTransfer.items.push({ kind: "file", getAsFile: () => file });
  await app.drop(payload.event);
  const entry = app.uploads[0][0][0].webkitGetAsEntry();
  assert.equal(entry.isFile, true);
  entry.file((capturedFile) => assert.equal(capturedFile, file));
});

test("directory read errors settle the handler and report the failure", async () => {
  const app = setup();
  const root = {
    isDirectory: true,
    createReader: () => ({
      readEntries(_resolve, reject) {
        queueMicrotask(() => reject(new Error("unreadable directory")));
      },
    }),
  };
  await app.drop(dropEvent([root]).event);
  assert.equal(app.uploads.length, 0);
  assert.equal(app.popups[0].title, "Unable to Read Upload");
});

test("non-file drops continue through the normal event flow", async () => {
  const app = setup();
  await app.drop({ dataTransfer: { types: ["text/plain"], items: [], files: [] } });
  assert.equal(app.uploads.length, 0);
  assert.equal(app.popups.length, 0);
});

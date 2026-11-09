const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const source = fs
  .readFileSync(
    path.join(__dirname, "../src/js/web-components/archivesspace-browser/archivesspace-browser.js"),
    "utf8",
  )
  .replace(/^import[\s\S]*?;\r?\n/gm, "")
  .replace("export { ArchivespaceBrowser };", "globalThis.Browser = ArchivespaceBrowser;");

function setup({ identities = {}, failUri } = {}) {
  const requests = [];
  const lookups = [];
  const ctx = {
    LitElement: class {},
    css: () => "",
    customElements: { define() {} },
    debounce: (fn) => fn,
    window: { origin: "https://curate.test" },
    Curate: { workspaces: { getOpenWorkspace: () => "archive" } },
    console: { error() {} },
    findNode: (nodes, id) => nodes.find((node) => node.uri === id),
    findNodeByLogicalId: () => null,
    fetchRecordIdentity: async (_host, uri) => {
      lookups.push(uri);
      if (uri === failUri) throw new Error("Identifier lookup failed");
      return identities[uri] || { title: "Letters", cuid: "MS-123-4" };
    },
    createCurateFolders: async (_host, _base, parent, folders) => {
      requests.push({ parent, folders: JSON.parse(JSON.stringify(folders)) });
      return { folders: folders.map((folder) => ({ name: folder.name, uuid: "new-folder" })) };
    },
  };
  vm.runInNewContext(source, ctx);
  const browser = new ctx.Browser();
  browser._setCreateFoldersFeedback = (type, message) => {
    browser.createFoldersFeedback = { type, message };
  };
  browser.selectedRecordIds = ["/repositories/2/archival_objects/9"];
  browser.archiveData = [{ uri: browser.selectedRecordIds[0], title: "Tree title" }];
  const create = async () => {
    browser._handleActionClick({ detail: { action: "create-folders" } });
    for (let i = 0; i < 20 && browser.createFoldersLoading; i++) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    assert.equal(browser.createFoldersLoading, false);
  };
  return { browser, requests, lookups, create };
}

test("linked folders use the target CUID by default", async () => {
  const t = setup();
  assert.equal(t.browser.includeTitleInFolderName, false);
  await t.create();
  assert.equal(t.requests[0].folders[0].name, "MS-123-4");
  assert.equal(t.requests[0].folders[0].uri, t.browser.selectedRecordIds[0]);
  assert.equal(t.requests[0].folders[0].detail_level, "per_file");
  assert.equal(t.requests[0].folders[0].per_file_mode, "as_components");
});

test("the toggle includes CUID and the current record title", async () => {
  const t = setup();
  t.browser._handleIncludeTitleChange({ detail: { value: true } });
  await t.create();
  assert.equal(t.requests[0].folders[0].name, "MS-123-4 - Letters");
});

test("each selected search-only record uses its own CUID", async () => {
  const a = "/repositories/2/archival_objects/9";
  const b = "/repositories/2/archival_objects/10";
  const t = setup({
    identities: {
      [a]: { title: "Same title", cuid: "A" },
      [b]: { title: "Same title", cuid: "B" },
    },
  });
  t.browser.archiveData = [];
  t.browser.selectedRecordIds = [a, b];
  t.browser.searchResults = [
    { uri: a, title: "Same title" },
    { uri: b, title: "Same title" },
  ];
  await t.create();
  assert.deepEqual(
    t.requests[0].folders.map((folder) => folder.name),
    ["A", "B"],
  );
});

test("records without a CUID fall back to their title in both modes", async () => {
  const uri = "/repositories/2/resources/3";
  const t = setup({ identities: { [uri]: { title: "Collection", cuid: null } } });
  t.browser.selectedRecordIds = [uri];
  await t.create();
  t.browser.includeTitleInFolderName = true;
  await t.create();
  assert.deepEqual(
    t.requests.map((request) => request.folders[0].name),
    ["Collection", "Collection"],
  );
});

test("an explicit archival object folder name takes precedence", async () => {
  const t = setup();
  t.browser.containerType = "archival_object";
  t.browser.folderName = " Custom folder ";
  t.browser.includeTitleInFolderName = true;
  await t.create();
  assert.equal(t.requests[0].folders[0].name, "Custom folder");
  assert.equal(t.lookups.length, 0);
});

test("unnamed archival object folders also use CUID", async () => {
  const t = setup();
  t.browser.containerType = "archival_object";
  await t.create();
  assert.equal(t.requests[0].folders[0].name, "MS-123-4");
});

test("lookup failure prevents the whole batch from being created", async () => {
  const uri = "/repositories/2/archival_objects/10";
  const t = setup({ failUri: uri });
  t.browser.selectedRecordIds.push(uri);
  await t.create();
  assert.equal(t.requests.length, 0);
  assert.equal(t.browser.createFoldersFeedback.type, "error");
  assert.match(t.browser.createFoldersFeedback.message, /Identifier lookup failed/);
});

test("slashes in CUIDs and titles remain within a single folder name", async () => {
  const uri = "/repositories/2/archival_objects/9";
  const t = setup({ identities: { [uri]: { title: "Letters / papers", cuid: "MS/123/4" } } });
  t.browser.includeTitleInFolderName = true;
  await t.create();
  assert.equal(t.requests[0].folders[0].name, "MS-123-4 - Letters - papers");
});

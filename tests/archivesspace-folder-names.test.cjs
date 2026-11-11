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

function setup({ identities = {}, failUri, lookup } = {}) {
  const requests = [];
  const lookups = [];
  const ctx = {
    TextEncoder,
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
      if (lookup) return lookup(uri);
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
  assert.equal(t.requests[0].folders[0].description_title, "Letters");
  assert.equal(t.requests[0].folders[0].uri, t.browser.selectedRecordIds[0]);
  assert.equal(t.requests[0].folders[0].detail_level, "per_file");
  assert.equal(t.requests[0].folders[0].per_file_mode, "as_components");
});

test("the toggle includes CUID and the current record title", async () => {
  const t = setup();
  t.browser._handleIncludeTitleChange({ detail: { value: true } });
  await t.create();
  assert.equal(t.requests[0].folders[0].name, "MS-123-4 - Letters");
  assert.equal(t.requests[0].folders[0].description_title, "Letters");
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
  assert.equal(t.requests[0].folders[0].description_title, "Custom folder");
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

test("missing record title falls back to the tree's date-only display title", async () => {
  const uri = "/repositories/2/archival_objects/9";
  const t = setup({ identities: { [uri]: { title: null, cuid: null } } });
  t.browser.archiveData[0].title = "1900-1910";
  await t.create();
  assert.equal(t.requests[0].folders[0].name, "1900-1910");
  assert.equal(t.requests[0].folders[0].description_title, "1900-1910");
});

test("identifier lookups have at most five concurrent requests", async () => {
  let active = 0;
  let peak = 0;
  const t = setup({
    lookup: async (uri) => {
      peak = Math.max(peak, ++active);
      await new Promise((resolve) => setImmediate(resolve));
      active--;
      return { title: "Letters", cuid: uri.split("/").pop() };
    },
  });
  t.browser.selectedRecordIds = Array.from(
    { length: 16 },
    (_, i) => `/repositories/2/archival_objects/${i + 1}`,
  );
  await t.create();
  assert.equal(peak, 5);
  assert.equal(active, 0);
  assert.equal(t.requests[0].folders.length, 16);
});

test("lookup failure drains in-flight requests without starting the remaining queue", async () => {
  const t = setup({
    lookup: async () => {
      throw new Error("Lookup failed");
    },
  });
  t.browser.selectedRecordIds = Array.from(
    { length: 20 },
    (_, i) => `/repositories/2/archival_objects/${i + 1}`,
  );
  await t.create();
  assert.equal(t.lookups.length, 5);
  assert.equal(t.requests.length, 0);
});

test("identifier errors include target URI and backend detail", async () => {
  const apiSource = fs
    .readFileSync(
      path.join(__dirname, "../src/js/web-components/archivesspace-browser/api-client.js"),
      "utf8",
    )
    .replace(/export /g, "");
  const ctx = {
    window: { CURATE_API_TOKEN: "token" },
    URLSearchParams,
    fetch: async () => ({
      ok: false,
      status: 503,
      json: async () => ({ detail: "ArchivesSpace unavailable" }),
    }),
  };
  vm.runInNewContext(apiSource, ctx);
  await assert.rejects(
    ctx.fetchRecordIdentity("/api/archivesspace", "/repositories/2/archival_objects/9"),
    /\/repositories\/2\/archival_objects\/9: 503 - ArchivesSpace unavailable/,
  );
});

test("generated names clean backslashes, control characters and repeated whitespace", async () => {
  const uri = "/repositories/2/archival_objects/9";
  const title = " Letters\\papers\n\t  1900\u0000\u007f1901 ";
  const t = setup({ identities: { [uri]: { title, cuid: null } } });
  await t.create();
  assert.equal(t.requests[0].folders[0].name, "Letters-papers 1900 1901");
  assert.equal(t.requests[0].folders[0].description_title, title);
});

test("long combined names fit 255 UTF-8 bytes without splitting a character", async () => {
  const uri = "/repositories/2/archival_objects/9";
  const title = "é😀".repeat(100);
  const t = setup({ identities: { [uri]: { title, cuid: "MS-1" } } });
  t.browser.includeTitleInFolderName = true;
  await t.create();
  const folder = t.requests[0].folders[0];
  assert.ok(folder.name.startsWith("MS-1 - "));
  assert.ok(Buffer.byteLength(folder.name, "utf8") <= 255);
  assert.equal(Buffer.from(folder.name).toString("utf8"), folder.name);
  assert.equal(folder.description_title, title);
});

test("ASCII titles are shortened at the byte limit", async () => {
  const uri = "/repositories/2/archival_objects/9";
  const t = setup({ identities: { [uri]: { title: "a".repeat(300), cuid: null } } });
  await t.create();
  assert.equal(t.requests[0].folders[0].name, "a".repeat(255));
});

for (const [body, expected] of [
  [
    JSON.stringify({ detail: "Folder 'MS-1' is already linked to another record" }),
    "Folder 'MS-1' is already linked to another record",
  ],
  ["Upstream unavailable", "Upstream unavailable"],
]) {
  test(`folder creation errors show readable detail: ${expected}`, async () => {
    const apiSource = fs
      .readFileSync(
        path.join(__dirname, "../src/js/web-components/archivesspace-browser/api-client.js"),
        "utf8",
      )
      .replace(/export /g, "");
    const ctx = {
      window: { CURATE_API_TOKEN: "token" },
      fetch: async () => ({ ok: false, status: 409, text: async () => body }),
    };
    vm.runInNewContext(apiSource, ctx);
    await assert.rejects(ctx.createCurateFolders("", "/curate", "/archive", []), (error) => {
      assert.equal(error.message, `Failed to create folders: 409 - ${expected}`);
      return true;
    });
  });
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { PreservationConfigAPI } from "./api-client.js";

test("FPR fetch uses Cells authentication and retains the disclosure header", async (t) => {
  const original = {
    window: globalThis.window,
    PydioApi: globalThis.PydioApi,
    fetch: globalThis.fetch,
  };
  t.after(() => Object.assign(globalThis, original));
  globalThis.window = { location: { origin: "https://curate.example" } };
  globalThis.PydioApi = { _PydioRestClient: { getOrUpdateJwt: async () => "jwt" } };
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://curate.example/api/v1/fpr");
    assert.equal(options.headers.Authorization, "Bearer jwt");
    assert.equal(options.cache, "no-store");
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ schema_version: 1 }, { headers: { "X-FPR-Command-Bodies": "omitted" } });
  };
  const api = new PreservationConfigAPI();
  assert.deepEqual(await api.getFPR(), {
    registry: { schema_version: 1 },
    commandBodies: "omitted",
  });
  globalThis.fetch = async () => Response.json({ code: "fpr_not_supported" }, { status: 501 });
  await assert.rejects(
    api.getFPR(),
    (error) => error.code === "fpr_not_supported" && error.status === 501,
  );
});

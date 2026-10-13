# FPR viewer preview

The preview uses the real Penwern registry exported from A3M commit `020693f`.
`fpr-registry.json` has the API's canonical snake_case protobuf JSON shape,
with command bodies omitted, matching the default API disclosure policy.
The source hash still identifies the complete loaded source JSON.

With the sibling `../a3m` checkout and its `.venv-fpr` environment installed:

```powershell
npm run fixture:fpr
npm run preview:fpr
```

Open http://localhost:6901. No Curate or Cells instance is needed. The response
selector exercises API error states; configuration writes return 405.
Open http://localhost:6901/?modal to test with the actual Curate popup and
shared modal stylesheet, including viewport sizing and scroll containment.
The production bundle uses authenticated `GET /api/v1/fpr` on the Curate
origin and does not import the preview adapter or fixture.

Set `A3M_PYTHON` to use another Python environment with the sibling A3M
installed. Regenerate the fixture whenever A3M's registry or proto changes.
The model tests compare its source hash with the sibling source when present,
so local registry changes cannot silently leave the preview stale.

To inspect the viewer inside a real Curate Preservation Configs popup using
the locally served bundle before deploying the new backend:

```powershell
npm run serve -- --env fprPreview=true
```

Load `http://localhost:6900/main.js` as your development bundle, open
Preservation Configs, then select Format policy registry. This explicit
development flag embeds the local Penwern snapshot in the bundle. It requires
no cross-origin API request from Curate. The viewer has no preview banner;
this command serves fixture data, not the deployment's live registry.
Production builds always use the authenticated deployment API, regardless
of this flag. Ordinary `npm run serve` also uses the deployment API.

const { execFileSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const a3m = path.resolve(__dirname, "../../a3m");
const python =
  process.env.A3M_PYTHON ||
  path.join(
    a3m,
    process.platform === "win32" ? ".venv-fpr/Scripts/python.exe" : ".venv-fpr/bin/python",
  );
const registry = JSON.parse(
  execFileSync(python, ["-m", "a3m.fpr"], {
    cwd: a3m,
    maxBuffer: 8 * 1024 * 1024,
    encoding: "utf8",
  }),
);
const hash = createHash("sha256")
  .update(fs.readFileSync(path.join(a3m, "a3m/fpr/migrations/initial-data.json")))
  .digest("hex");
if (registry.source_sha256 !== hash) throw new Error("Exporter/source hash mismatch.");
for (const command of registry.commands) command.command = "";
fs.writeFileSync(path.join(__dirname, "fpr-registry.json"), JSON.stringify(registry) + "\n");
console.log(`Wrote Penwern registry ${hash}, command bodies omitted.`);

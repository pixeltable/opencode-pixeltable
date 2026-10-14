import assert from "node:assert/strict"
import { Host } from "@opencode/plugin/host"
import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { pathToFileURL } from "node:url"

import plugin, { packageRoot } from "../src/index.ts"

test("OpenCode v2 discovers the plugin from a local checkout directory", async () => {
  const entrypoints = Host.resolve({ directory: packageRoot })
  assert.equal(entrypoints.server, pathToFileURL(join(packageRoot, "index.ts")).href)
  assert.ok(entrypoints.server)
  const loaded = await Host.load(entrypoints.server)
  assert.ok(loaded && typeof loaded === "object" && "default" in loaded)
  assert.equal(loaded.default, plugin)
})

test("the npm package loads without development dependencies and includes the skill", async () => {
  const directory = mkdtempSync(join(tmpdir(), "opencode-pixeltable-package-"))
  try {
    const packed = JSON.parse(
      execFileSync("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", directory], {
        cwd: packageRoot,
        encoding: "utf8",
      }),
    ) as Array<{ filename: string }>
    assert.ok(packed[0])
    execFileSync("tar", ["-xzf", join(directory, packed[0].filename), "-C", directory])
    const extracted = join(directory, "package")
    const entrypoints = Host.resolve({ directory: extracted })
    assert.ok(entrypoints.server)
    const loaded = await Host.load(entrypoints.server)
    assert.ok(loaded && typeof loaded === "object" && "default" in loaded)
    assert.ok(loaded.default && typeof loaded.default === "object" && "id" in loaded.default)
    assert.equal(loaded.default.id, plugin.id)
    assert.ok("server" in loaded.default && typeof loaded.default.server === "function")
    assert.ok("setup" in loaded.default && typeof loaded.default.setup === "function")
    assert.ok("skillFile" in loaded && typeof loaded.skillFile === "string")
    assert.match(readFileSync(loaded.skillFile, "utf8"), /name: pixeltable/)
    assert.equal(existsSync(join(extracted, "node_modules")), false)
    for (const reference of ["anti-patterns.md", "cli.md", "core-api.md", "providers.md", "workflows.md"]) {
      assert.ok(existsSync(join(extracted, "skills", "pixeltable", "references", reference)))
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

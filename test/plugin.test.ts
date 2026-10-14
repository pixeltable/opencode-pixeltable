import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import plugin, { skillFile, skillsDirectory, v1McpServer, v2McpServer } from "../src/index.ts"
import { parseSkillMarkdown } from "../src/skill-markdown.ts"

const projectDirectory = "/work/app"

test("v1 MCP config launches the maintained Pixeltable server", () => {
  const server = v1McpServer(projectDirectory, {})
  assert.deepEqual(server.command, ["uvx", "mcp-server-pixeltable-developer"])
  assert.equal(server.type, "local")
  assert.equal(server.enabled, true)
  assert.equal(server.timeout, 120_000)
  assert.equal(server.environment?.PIXELTABLE_MCP_PROJECT_ROOT, projectDirectory)
  assert.equal(server.environment?.PXT_PORT, "22090")
  assert.equal(server.environment?.PIXELTABLE_HOME, undefined)
  assert.equal(server.environment?.PIXELTABLE_MCP_ENABLE_UNSAFE, undefined)
})

test("environment overrides are passed through and unsafe mode is not enabled", () => {
  const server = v1McpServer(projectDirectory, {
    PIXELTABLE_MCP_PROJECT_ROOT: "/apps/demo",
    PIXELTABLE_HOME: "/catalogs/demo",
    PXT_PORT: "22111",
    PIXELTABLE_MCP_ENABLE_UNSAFE: "1",
  })
  assert.equal(server.environment?.PIXELTABLE_MCP_PROJECT_ROOT, "/apps/demo")
  assert.equal(server.environment?.PIXELTABLE_HOME, "/catalogs/demo")
  assert.equal(server.environment?.PXT_PORT, "22111")
  assert.equal(server.environment?.PIXELTABLE_MCP_ENABLE_UNSAFE, undefined)
})

test("v2 MCP config uses the servers object shape", () => {
  const server = v2McpServer(projectDirectory, {})
  assert.equal(server.type, "local")
  assert.deepEqual(server.command, ["uvx", "mcp-server-pixeltable-developer"])
  assert.equal(server.timeout.startup, 120_000)
  assert.equal("enabled" in server, false)
  assert.equal("disabled" in server, false)
})

test("vendored skill matches the OpenCode skill contract", () => {
  const raw = readFileSync(skillFile, "utf8")
  const skill = parseSkillMarkdown(raw)
  assert.equal(skill.name, "pixeltable")
  assert.match(skill.description, /^Build multimodal AI apps with Pixeltable\./)
  assert.ok(skill.description.length <= 1024)
  assert.match(skill.body, /^## STOP/)
  for (const reference of ["anti-patterns.md", "cli.md", "core-api.md", "providers.md", "workflows.md"]) {
    assert.equal(existsSync(join(skillsDirectory, "pixeltable", "references", reference)), true)
  }
})

test("v1 config hook registers MCP and the skill directory once", async () => {
  const hooks = await plugin.server({ directory: projectDirectory } as Parameters<typeof plugin.server>[0])
  const config: {
    mcp?: Record<string, unknown>
    skills?: { paths?: string[] }
  } = {
    mcp: {
      pixeltable: { type: "local", command: ["custom"] },
    },
    skills: { paths: [skillsDirectory] },
  }
  await hooks.config?.(config as Parameters<NonNullable<typeof hooks.config>>[0])
  assert.deepEqual(config.mcp?.pixeltable, { type: "local", command: ["custom"] })
  assert.deepEqual(config.skills?.paths, [skillsDirectory])

  const empty: { mcp?: Record<string, { command?: string[] }>; skills?: { paths?: string[] } } = {}
  await hooks.config?.(empty as Parameters<NonNullable<typeof hooks.config>>[0])
  assert.deepEqual(empty.mcp?.pixeltable?.command, ["uvx", "mcp-server-pixeltable-developer"])
  assert.deepEqual(empty.skills?.paths, [skillsDirectory])
})

type McpEditor = {
  list: () => readonly unknown[]
  get: (name: string) => unknown
  set: (name: string, config: unknown) => void
  update: () => void
  remove: () => void
}

type SkillEditor = {
  list: () => readonly unknown[]
  get: (id: string) => { id?: string } | undefined
  add: (skill: { id?: string; description?: string; content?: string }) => void
  update: () => void
  remove: () => void
}

test("v2 setup registers MCP and the skill unless the user already did", async () => {
  const added: Array<{ id?: string; description?: string; content?: string }> = []
  const servers = new Map<string, unknown>()
  const skills = new Map<string, { id?: string }>()

  await plugin.setup({
    location: { directory: projectDirectory },
    mcp: {
      async transform(editor: (value: McpEditor) => void) {
        editor({
          list: () => [],
          get: (name: string) => servers.get(name),
          set: (name: string, config: unknown) => servers.set(name, config),
          update: () => {},
          remove: () => {},
        })
      },
    },
    skill: {
      async transform(editor: (value: SkillEditor) => void) {
        editor({
          list: () => [],
          get: (id: string) => skills.get(id),
          add: (skill: { id?: string; description?: string; content?: string }) => {
            added.push(skill)
            if (skill.id) skills.set(skill.id, skill)
          },
          update: () => {},
          remove: () => {},
        })
      },
    },
  } as unknown as Parameters<typeof plugin.setup>[0])

  assert.equal(servers.has("pixeltable"), true)
  assert.equal(added.length, 1)
  assert.equal(added[0]?.id, "pixeltable")
  assert.match(added[0]?.description ?? "", /Pixeltable/)
  assert.match(added[0]?.content ?? "", /pxt schema update/)

  const before = added.length
  await plugin.setup({
    location: { directory: projectDirectory },
    mcp: {
      async transform(editor: (value: McpEditor) => void) {
        editor({
          list: () => [],
          get: (name: string) => servers.get(name),
          set: (name: string, config: unknown) => servers.set(name, config),
          update: () => {},
          remove: () => {},
        })
      },
    },
    skill: {
      async transform(editor: (value: SkillEditor) => void) {
        editor({
          list: () => [],
          get: (id: string) => skills.get(id),
          add: (skill: { id?: string }) => {
            added.push(skill)
          },
          update: () => {},
          remove: () => {},
        })
      },
    },
  } as unknown as Parameters<typeof plugin.setup>[0])
  assert.equal(added.length, before)
})

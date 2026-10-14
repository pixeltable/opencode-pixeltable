import type { Plugin as V1Plugin } from "@opencode-ai/plugin"
import type { Mcp, Plugin, Skill } from "@opencode/plugin"
import { readFileSync } from "node:fs"

import { PIXELTABLE_MCP_NAME, v1McpServer, v2McpServer } from "./mcp-server.ts"
import { skillFile, skillsDirectory } from "./paths.ts"
import { parseSkillMarkdown } from "./skill-markdown.ts"

export { PIXELTABLE_MCP_COMMAND, PIXELTABLE_MCP_NAME, v1McpServer, v2McpServer } from "./mcp-server.ts"
export { packageRoot, skillFile, skillsDirectory } from "./paths.ts"
export { parseSkillMarkdown } from "./skill-markdown.ts"

type ConfigWithSkills = {
  skills?: {
    paths?: string[]
  }
}

const server: V1Plugin = async (input) => {
  return {
    config: async (config) => {
      config.mcp ??= {}
      if (!config.mcp[PIXELTABLE_MCP_NAME]) {
        config.mcp[PIXELTABLE_MCP_NAME] = v1McpServer(input.directory)
      }

      const withSkills = config as typeof config & ConfigWithSkills
      withSkills.skills ??= {}
      withSkills.skills.paths ??= []
      if (!withSkills.skills.paths.includes(skillsDirectory)) {
        withSkills.skills.paths.push(skillsDirectory)
      }
    },
  }
}

export default {
  id: "pixeltable",
  server,
  async setup(ctx) {
    await ctx.mcp.transform((editor) => {
      if (editor.get(PIXELTABLE_MCP_NAME)) return
      editor.set(PIXELTABLE_MCP_NAME, v2McpServer(ctx.location.directory) as Mcp.ServerConfig)
    })

    const skill = parseSkillMarkdown(readFileSync(skillFile, "utf8"))
    await ctx.skill.transform((editor) => {
      if (editor.get(skill.name)) return
      editor.add({
        id: skill.name as Skill.ID,
        name: skill.name as Skill.Name,
        description: skill.description,
        path: skillFile as Skill.Info["path"],
        content: skill.body,
      })
    })
  },
} satisfies Plugin.Plugin & { server: V1Plugin }

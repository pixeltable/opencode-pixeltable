import type { McpLocalConfig } from "@opencode-ai/sdk"

/**
 * Launch command from the maintained server README and PyPI package
 * `mcp-server-pixeltable-developer`. The repository
 * pixeltable/pixeltable-mcp-server redirects here.
 */
export const PIXELTABLE_MCP_COMMAND = ["uvx", "mcp-server-pixeltable-developer"] as const

/** OpenCode MCP name. Prompts can refer to this server as `pixeltable`. */
export const PIXELTABLE_MCP_NAME = "pixeltable"

/**
 * The official Claude plugin pins the server's `pxt` daemon to 22090 so it
 * does not restart the daemon a terminal `pxt` uses on the default port 22089.
 */
export const DEFAULT_PXT_PORT = "22090"

/**
 * OpenCode v1 waits 5s for tools by default, and v2 waits 30s for startup.
 * The server's own command timeout is 120s (`command_timeout_seconds` in
 * mcp-server-pixeltable-developer). Match that so a cold `uvx` install can
 * finish initializing.
 */
export const MCP_STARTUP_TIMEOUT_MS = 120_000

export function pixeltableEnvironment(
  projectDirectory: string,
  env: NodeJS.ProcessEnv = process.env,
): Record<string, string> {
  const environment: Record<string, string> = {
    PIXELTABLE_MCP_PROJECT_ROOT: env.PIXELTABLE_MCP_PROJECT_ROOT || projectDirectory,
    PXT_PORT: env.PXT_PORT || DEFAULT_PXT_PORT,
  }
  if (env.PIXELTABLE_HOME) environment.PIXELTABLE_HOME = env.PIXELTABLE_HOME
  return environment
}

/** OpenCode v1 local MCP object (`mcp.<name>`). */
export function v1McpServer(projectDirectory: string, env?: NodeJS.ProcessEnv): McpLocalConfig {
  return {
    type: "local",
    command: [...PIXELTABLE_MCP_COMMAND],
    environment: pixeltableEnvironment(projectDirectory, env),
    enabled: true,
    timeout: MCP_STARTUP_TIMEOUT_MS,
  }
}

/**
 * OpenCode v2 local MCP object (`mcp.servers.<name>`).
 * `timeout.startup` is milliseconds. `disabled` is omitted so the server connects.
 */
export function v2McpServer(projectDirectory: string, env?: NodeJS.ProcessEnv) {
  return {
    type: "local" as const,
    command: [...PIXELTABLE_MCP_COMMAND],
    environment: pixeltableEnvironment(projectDirectory, env),
    timeout: {
      startup: MCP_STARTUP_TIMEOUT_MS,
    },
  }
}

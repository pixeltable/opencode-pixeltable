# opencode-pixeltable

OpenCode can build Pixeltable applications: multimodal tables, computed columns, and search over video, audio, images, and documents. This package registers the [Pixeltable developer MCP server](https://github.com/pixeltable/mcp-server-pixeltable-developer) and the [Pixeltable skill](https://github.com/pixeltable/pixeltable-skill).

The old [pixeltable/pixeltable-mcp-server](https://github.com/pixeltable/pixeltable-mcp-server) repository now points at that maintained server. Its run command is:

```bash
uvx mcp-server-pixeltable-developer
```

`uvx mcp-server-pixeltable-developer --version` prints `mcp-server-pixeltable-developer 0.2.1`.

## Install

Install [uv](https://docs.astral.sh/uv/getting-started/installation/) first. This package is ready to publish and is not on npm.

OpenCode v2 loads a local checkout. Clone it, then add the absolute path:

```bash
git clone https://github.com/pixeltable/opencode-pixeltable.git
```

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["/absolute/path/to/opencode-pixeltable"]
}
```

OpenCode 1.18.29 and later load the same package by name once it is published:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-pixeltable"]
}
```

Restart OpenCode. The plugin starts `uvx mcp-server-pixeltable-developer` as a local MCP server named `pixeltable`, unless `opencode.json` already defines that name. It sets `PIXELTABLE_MCP_PROJECT_ROOT` to the OpenCode project directory and `PXT_PORT` to `22090` (the port the [official Claude plugin](https://github.com/pixeltable/mcp-server-pixeltable-developer/blob/main/plugin/.claude-plugin/plugin.json) uses, so this server does not restart the `pxt` daemon on port 22089). `PIXELTABLE_HOME` is left unset unless you exported it; the server then uses `~/.pixeltable`. The startup timeout is 120 seconds, matching the server's command timeout. A `pixeltable` entry you already wrote is left as-is.

The skill is `skills/pixeltable/SKILL.md`, copied from [pixeltable-skill](https://github.com/pixeltable/pixeltable-skill) `c471dbb262b6bc135e903fefd36c6f354101c6b8` (skill 2.12.0). The directory is named `pixeltable` so it matches the frontmatter `name`. On v1 the plugin adds that directory to `skills.paths`. On v2 it registers the skill through `ctx.skill.transform`.

## Example prompts

```text
Use the pixeltable skill. Index the videos in ./videos and let me search them.
```

```text
Use the pixeltable skill. Build a RAG table over the PDFs in ./docs.
```

```text
Use the pixeltable skill. Keep this agent's notes in a Pixeltable table so a later session can search them.
```

Refer to the server by its config name when you want a specific tool call: `use pixeltable`.

## Zero-install

Skip the plugin and wire the same server plus the skill yourself.

**OpenCode v1** (`mcp` names sit directly under `mcp`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "pixeltable": {
      "type": "local",
      "command": ["uvx", "mcp-server-pixeltable-developer"],
      "enabled": true,
      "timeout": 120000,
      "environment": {
        "PIXELTABLE_MCP_PROJECT_ROOT": "/absolute/path/to/app",
        "PIXELTABLE_HOME": "/absolute/path/to/.pixeltable",
        "PXT_PORT": "22090"
      }
    }
  }
}
```

**OpenCode v2** (names sit under `mcp.servers`; there is no `enabled` field):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "pixeltable": {
        "type": "local",
        "command": ["uvx", "mcp-server-pixeltable-developer"],
        "timeout": { "startup": 120000 },
        "environment": {
          "PIXELTABLE_MCP_PROJECT_ROOT": "/absolute/path/to/app",
          "PIXELTABLE_HOME": "/absolute/path/to/.pixeltable",
          "PXT_PORT": "22090"
        }
      }
    }
  }
}
```

`PIXELTABLE_MCP_PROJECT_ROOT` must be a directory that already exists. The server reads `PIXELTABLE_HOME` as the catalog (`~/.pixeltable` when the variable is unset). Both values stay fixed for the life of the process.

Copy the skill into an OpenCode skills directory. From a checkout of this repo:

```bash
mkdir -p .opencode/skills
cp -R skills/pixeltable .opencode/skills/pixeltable
```

The global location is `~/.config/opencode/skills/pixeltable/SKILL.md`. OpenCode also reads `.claude/skills/` and `.agents/skills/`.

## Requirements

- Python 3.11 or newer. Current Pixeltable 0.7.16 requires `>=3.11`.
- `pip install pixeltable` for the `pxt` CLI in your project. The skill's HTTP serving workflow uses `pip install 'pixeltable[serve]'`. The MCP server depends on `pixeltable[serve]>=0.7.10,<0.8` inside the `uvx` environment.
- [uv](https://docs.astral.sh/uv/getting-started/installation/), which provides `uvx`.

The server does not enable unsafe tools. Set `PIXELTABLE_MCP_ENABLE_UNSAFE=1` in the environment you use to launch OpenCode only when you want arbitrary Python, package installs, and the browser canvas.

On OpenCode v2, MCP tools go through Code Mode unless that server sets `"codemode": false`.

## OpenCode ecosystem

[ecosystem.mdx](https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/ecosystem.mdx) adds projects by pull request. The page does not require an npm release, and the table links GitHub repositories. The plugin install path `"plugin": ["opencode-pixeltable"]` does require a published package, because OpenCode installs that name from npm. A directory listing can link this repository before publish. A row that tells people to install the npm name should wait until this package is published. This repository does not publish to npm.

## Development

```bash
npm ci
npm run typecheck
npm run build
npm test
```

The package entry OpenCode loads is `index.ts`, which forwards to `src/index.ts`. The root entry also lets OpenCode v2 discover a local checkout directory. `npm run build` typechecks an emit to `dist/` and does not change that entry.

## Links

- [Pixeltable docs](https://docs.pixeltable.com/)
- [Pixeltable developer MCP server](https://github.com/pixeltable/mcp-server-pixeltable-developer)
- [mcp-server-pixeltable-developer on PyPI](https://pypi.org/project/mcp-server-pixeltable-developer/)
- [pixeltable-mcp-server (moved)](https://github.com/pixeltable/pixeltable-mcp-server)
- [Pixeltable skill](https://github.com/pixeltable/pixeltable-skill)
- [OpenCode plugins](https://opencode.ai/docs/plugins)
- [OpenCode MCP servers](https://opencode.ai/docs/mcp-servers)
- [OpenCode skills](https://opencode.ai/docs/skills)
- [OpenCode v2 plugins](https://opencode.ai/v2/docs/build/plugins)
- [OpenCode v2 MCP servers](https://opencode.ai/v2/docs/mcp-servers)
- [OpenCode ecosystem](https://opencode.ai/docs/ecosystem)

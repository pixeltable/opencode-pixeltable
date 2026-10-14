import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/** Package root whether this file is loaded from `src/` or compiled to `dist/`. */
export const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)))

/** Parent directory OpenCode scans recursively for SKILL.md via skills.paths. */
export const skillsDirectory = join(packageRoot, "skills")

export const skillFile = join(skillsDirectory, "pixeltable", "SKILL.md")

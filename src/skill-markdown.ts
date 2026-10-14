export type ParsedSkill = {
  name: string
  description: string
  body: string
}

/**
 * Read the Agent Skills frontmatter OpenCode requires (`name`, `description`)
 * and the markdown body. Supports a folded `description: >` block, which is
 * what pixeltable-skill ships. No YAML dependency.
 */
export function parseSkillMarkdown(raw: string): ParsedSkill {
  const fence = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  const frontmatter = fence?.[1]
  if (!fence || frontmatter === undefined) {
    throw new Error("Pixeltable SKILL.md is missing YAML frontmatter")
  }

  const name = frontmatter.match(/^name:\s*(\S+)\s*$/m)?.[1]
  if (!name) throw new Error("Pixeltable SKILL.md frontmatter has no name")

  const description = readDescription(frontmatter)
  if (!description) throw new Error("Pixeltable SKILL.md frontmatter has no description")

  return {
    name,
    description,
    body: raw.slice(fence[0].length).trim(),
  }
}

function readDescription(frontmatter: string): string {
  const lines = frontmatter.split(/\r?\n/)
  const index = lines.findIndex((line) => line.startsWith("description:"))
  if (index < 0) return ""

  const header = lines[index] ?? ""
  const inline = header.slice("description:".length).trim()
  if (inline !== "" && inline !== ">" && inline !== ">-" && inline !== "|" && inline !== "|-") {
    return inline.replace(/^["']|["']$/g, "")
  }

  const folded = inline.startsWith(">")
  const collected: string[] = []
  for (const line of lines.slice(index + 1)) {
    if (line.trim() === "") {
      collected.push("")
      continue
    }
    if (!/^\s/.test(line)) break
    collected.push(line.trim())
  }

  if (!folded) return collected.join("\n").trim()

  const paragraphs: string[] = []
  let current: string[] = []
  for (const line of collected) {
    if (line === "") {
      if (current.length > 0) paragraphs.push(current.join(" "))
      current = []
      continue
    }
    current.push(line)
  }
  if (current.length > 0) paragraphs.push(current.join(" "))
  return paragraphs.join("\n").trim()
}

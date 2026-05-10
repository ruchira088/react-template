#!/usr/bin/env node
import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs"
import { join, relative } from "node:path"
import { createInterface } from "node:readline/promises"
import { stdin, stdout } from "node:process"

const ROOT = join(import.meta.dirname, "..")

const SKIP_DIRS = new Set([
  "node_modules",
  "build",
  "coverage",
  "test-results",
  ".react-router",
  ".git",
  "dist",
  "cdk.out"
])

const TOKENS = [
  {
    key: "__PROJECT_NAME__",
    prompt: "Project name (kebab-case, e.g. my-app)",
    validate: (value) => /^[a-z][a-z0-9-]*[a-z0-9]$/.test(value) || "Use lowercase letters, digits, and hyphens (must start with a letter)."
  },
  {
    key: "__PROJECT_TITLE__",
    prompt: "Project title (display name, e.g. My App)",
    default: (answers) => toTitleCase(answers.__PROJECT_NAME__)
  },
  {
    key: "__PROJECT_DESCRIPTION__",
    prompt: "One-line description for meta tags",
    default: (answers) => `${answers.__PROJECT_TITLE__} — built from the react-template`
  },
  {
    key: "__SUBDOMAIN__",
    prompt: "Subdomain under ruchij.com (production becomes <subdomain>.ruchij.com)",
    default: (answers) => answers.__PROJECT_NAME__,
    validate: (value) => /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(value) || "Use lowercase letters, digits, dots, hyphens."
  },
  {
    key: "__API_HOSTNAME_PROD__",
    prompt: "Production API hostname (no protocol)",
    default: (answers) => `api.${answers.__SUBDOMAIN__}.ruchij.com`
  },
  {
    key: "__API_HOSTNAME_STAGING__",
    prompt: "Staging API hostname (no protocol)",
    default: (answers) => `api.staging.${answers.__SUBDOMAIN__}.ruchij.com`
  },
  {
    key: "__STACK_NAME__",
    prompt: "CDK stack name (PascalCase)",
    default: (answers) => `${toPascalCase(answers.__PROJECT_NAME__)}FrontEndStack`
  },
  {
    key: "__GHCR_NAMESPACE__",
    prompt: "GitHub container registry namespace",
    default: () => "ruchira088"
  },
  {
    key: "__AWS_ACCOUNT__",
    prompt: "AWS account ID",
    default: () => "365562660444",
    validate: (value) => /^\d{12}$/.test(value) || "AWS account IDs are 12 digits."
  },
  {
    key: "__AWS_REGION__",
    prompt: "AWS region",
    default: () => "ap-southeast-2"
  }
]

const main = async () => {
  console.log("react-template init\n")
  const answers = await collectAnswers()
  console.log("\nApplying...")
  const fileCount = applyTokens(answers)
  console.log(`Replaced tokens in ${fileCount} files.`)
  console.log("\nNext:")
  console.log("  1. npm install                              (regenerate package-lock)")
  console.log("  2. Replace placeholder Sentry DSNs in app/services/Sentry.ts")
  console.log("  3. Replace app/images/small-logo.svg + public/favicon.ico with your assets")
  console.log("  4. rm scripts/init-project.mjs              (it's done its job)")
  console.log("  5. git init && git commit && push to GitHub")
}

const toTitleCase = (kebab) =>
  kebab.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")

const toPascalCase = (kebab) =>
  kebab.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("")

const collectAnswers = async () => {
  if (stdin.isTTY) {
    return collectInteractive()
  }
  return collectFromPipedStdin()
}

const collectInteractive = async () => {
  const rl = createInterface({ input: stdin, output: stdout })
  const answers = {}

  try {
    for (const token of TOKENS) {
      const fallback = token.default ? token.default(answers) : null
      const promptText = fallback
        ? `${token.prompt} [${fallback}]: `
        : `${token.prompt}: `

      while (true) {
        const raw = (await rl.question(promptText)).trim()
        const value = raw.length === 0 ? fallback : raw

        if (!value) {
          console.log("  Required.")
          continue
        }
        if (token.validate) {
          const result = token.validate(value)
          if (result !== true) {
            console.log(`  ${result}`)
            continue
          }
        }
        answers[token.key] = value
        break
      }
    }
  } finally {
    rl.close()
  }

  return answers
}

const collectFromPipedStdin = async () => {
  const chunks = []
  for await (const chunk of stdin) chunks.push(chunk)
  const lines = Buffer.concat(chunks).toString("utf8").split("\n")

  const answers = {}
  let lineIndex = 0
  for (const token of TOKENS) {
    const fallback = token.default ? token.default(answers) : null
    const raw = (lines[lineIndex++] ?? "").trim()
    const value = raw.length === 0 ? fallback : raw

    if (!value) {
      throw new Error(`No value provided for ${token.key} (line ${lineIndex})`)
    }
    if (token.validate) {
      const result = token.validate(value)
      if (result !== true) {
        throw new Error(`${token.key}: ${result}`)
      }
    }
    answers[token.key] = value
    console.log(`  ${token.key} = ${value}`)
  }
  return answers
}

const applyTokens = (answers) => {
  let count = 0
  walk(ROOT, (path) => {
    if (path === join(ROOT, "scripts", "init-project.mjs")) return
    if (!isLikelyText(path)) return

    const original = readFileSync(path, "utf8")
    let updated = original
    for (const [token, replacement] of Object.entries(answers)) {
      updated = updated.split(token).join(replacement)
    }
    if (updated !== original) {
      writeFileSync(path, updated)
      count++
      console.log(`  - ${relative(ROOT, path)}`)
    }
  })
  return count
}

const walk = (dir, visitor) => {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const stats = statSync(full)
    if (stats.isDirectory()) {
      walk(full, visitor)
    } else if (stats.isFile()) {
      visitor(full)
    }
  }
}

const TEXT_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".md", ".yml", ".yaml",
  ".scss", ".css", ".html", ".svg", ".sh", ".txt", ".env"
])
const TEXT_FILENAMES = new Set([
  "Dockerfile", ".gitignore", ".dockerignore", ".nvmrc", ".npmignore"
])

const isLikelyText = (path) => {
  const filename = path.split("/").pop()
  if (TEXT_FILENAMES.has(filename)) return true
  const dot = filename.lastIndexOf(".")
  if (dot === -1) return false
  return TEXT_EXTENSIONS.has(filename.slice(dot).toLowerCase())
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

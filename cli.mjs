#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import { execFileSync } from "child_process"
import { fileURLToPath } from "url"

const args = process.argv.slice(2)

if (args.includes("--run")) {
  // Start the actual MCP server
  const serverPath = join(fileURLToPath(import.meta.url), "..", "server.mjs")
  execFileSync("node", [serverPath], { stdio: "inherit" })
  process.exit(0)
}

const claudeDir = join(homedir(), ".claude")
const settingsPath = join(claudeDir, "settings.json")

let settings = {}
if (existsSync(settingsPath)) {
  settings = JSON.parse(readFileSync(settingsPath, "utf-8"))
}

if (!settings.mcpServers) {
  settings.mcpServers = {}
}

if (args.includes("--uninstall")) {
  if (!settings.mcpServers["local-mcp"]) {
    console.log("✓ local-mcp is not configured in Claude Code")
    process.exit(0)
  }

  delete settings.mcpServers["local-mcp"]
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n")

  console.log("✓ Removed local-mcp server from Claude Code")
  console.log(`  Config: ${settingsPath}`)
  console.log("")
  console.log("  Restart Claude Code to apply changes.")
  process.exit(0)
}

// Default: install into Claude Code settings
if (settings.mcpServers["local-mcp"]) {
  console.log("✓ local-mcp is already configured in Claude Code")
  process.exit(0)
}

settings.mcpServers["local-mcp"] = {
  command: "npx",
  args: ["@uiid/local-mcp-server", "--run"],
}

mkdirSync(claudeDir, { recursive: true })
writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n")

console.log("✓ Installed local-mcp server into Claude Code")
console.log(`  Config: ${settingsPath}`)
console.log("")
console.log("  Restart Claude Code to activate the server.")

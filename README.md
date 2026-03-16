# @uiid/local-mcp-server

A local MCP server that exposes agent markdown files as tools. Agents are prompt documents that define how an AI assistant should handle specific tasks (code review, PR creation, ticket grooming, etc.).

## Tools

| Tool | Description |
|------|-------------|
| `list_agents` | List all available agents |
| `read_agent` | Read the full content of a specific agent by name |

## Setup

Clone the repo and install dependencies:

```bash
git clone https://github.com/uiid-systems/local-mcp-server.git
cd local-mcp-server
npm install
```

Add to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "local-mcp": {
      "command": "node",
      "args": ["/path/to/local-mcp-server/server.mjs"]
    }
  }
}
```

Restart Claude Code to activate.

## Agents directory

By default the server reads `.md` files from the `agents/` directory next to `server.mjs`.

Override this with the `AGENTS_DIR` environment variable:

```json
{
  "mcpServers": {
    "local-mcp": {
      "command": "node",
      "args": ["/path/to/local-mcp-server/server.mjs"],
      "env": {
        "AGENTS_DIR": "~/.claude/agents"
      }
    }
  }
}
```

Tilde (`~`) is expanded to the user's home directory.

## Adding agents

Create a markdown file in the agents directory:

```
agents/
  code-review.md
  pull-request.md
  task-breakdown.md
  ticket-groomer.md
```

Each file is a self-contained prompt document. The filename (without `.md`) is the agent name used with `read_agent`.

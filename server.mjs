import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { readFileSync, readdirSync, existsSync } from "fs"
import { join, resolve, basename } from "path"
import { homedir } from "os"

const __dirname = new URL(".", import.meta.url).pathname
const pkg = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf-8"))

const AGENTS_DIR = resolve(
  __dirname,
  process.env.AGENTS_DIR || "agents"
).replace(/^~(?=\/|$)/, homedir())

const server = new Server(
  { name: "local-mcp", version: pkg.version },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_agents",
      description: "List all available agents in the agents directory",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "read_agent",
      description:
        "Read and return the full content of a specific agent markdown file",
      inputSchema: {
        type: "object",
        properties: {
          agent_name: {
            type: "string",
            description:
              'The name of the agent file (without .md extension). E.g., "ticket-groomer"',
          },
        },
        required: ["agent_name"],
      },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  if (name === "list_agents") {
    if (!existsSync(AGENTS_DIR)) {
      return {
        content: [
          { type: "text", text: `Agents directory not found at ${AGENTS_DIR}` },
        ],
        isError: true,
      }
    }

    const agents = readdirSync(AGENTS_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(".md", ""))

    if (agents.length === 0) {
      return {
        content: [
          { type: "text", text: `No agents found in ${AGENTS_DIR}` },
        ],
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Available agents:\n${agents.map((a) => `- ${a}`).join("\n")}`,
        },
      ],
    }
  }

  if (name === "read_agent") {
    const agentName = args?.agent_name
    if (typeof agentName !== "string" || !agentName.trim()) {
      return {
        content: [{ type: "text", text: "Error: agent_name is required." }],
        isError: true,
      }
    }

    // Sanitize: use only the basename to prevent path traversal
    const safe = basename(agentName)
    const filePath = join(AGENTS_DIR, `${safe}.md`)

    // Double-check resolved path is inside AGENTS_DIR
    if (!resolve(filePath).startsWith(resolve(AGENTS_DIR))) {
      return {
        content: [{ type: "text", text: "Error: invalid agent name." }],
        isError: true,
      }
    }

    if (!existsSync(filePath)) {
      return {
        content: [
          {
            type: "text",
            text: `Error: Agent "${safe}" not found. Use list_agents to see available agents.`,
          },
        ],
        isError: true,
      }
    }

    const content = readFileSync(filePath, "utf-8")
    return { content: [{ type: "text", text: content }] }
  }

  return {
    content: [{ type: "text", text: "Unknown tool" }],
    isError: true,
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
console.error("Local MCP server running on stdio")

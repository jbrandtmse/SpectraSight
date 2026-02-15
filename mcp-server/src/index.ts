#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getConfig } from "./config.js";
import { ApiClient } from "./api-client.js";
import { registerTicketTools } from "./tools/tickets.js";
import { registerCommentTools } from "./tools/comments.js";

async function main(): Promise<void> {
  const config = getConfig();
  const apiClient = new ApiClient(config);

  const server = new McpServer({
    name: "spectrasight-mcp",
    version: "0.1.0",
  });

  registerTicketTools(server, apiClient);
  registerCommentTools(server, apiClient);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[spectrasight-mcp] Server started on stdio transport");
}

main().catch((err) => {
  console.error("[spectrasight-mcp] Fatal error:", err);
  process.exit(1);
});

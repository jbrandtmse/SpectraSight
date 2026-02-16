#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getConfig } from "./config.js";
import { ApiClient } from "./api-client.js";
import { registerTicketTools } from "./tools/tickets.js";
import { registerCommentTools } from "./tools/comments.js";
import { registerCodeReferenceTools } from "./tools/code-references.js";
import { registerActivityTools } from "./tools/activity.js";
import { registerConnectionTools } from "./tools/connection.js";
import { registerProjectTools } from "./tools/projects.js";

async function main(): Promise<void> {
  const config = getConfig();
  const apiClient = new ApiClient(config);

  const server = new McpServer({
    name: "spectrasight-mcp",
    version: "0.1.0",
  });

  registerTicketTools(server, apiClient);
  registerCommentTools(server, apiClient);
  registerCodeReferenceTools(server, apiClient);
  registerActivityTools(server, apiClient);
  registerProjectTools(server, apiClient);
  registerConnectionTools(server, apiClient, config);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[spectrasight-mcp] Server started on stdio transport");

  // Non-blocking startup connection validation (after transport is connected
  // so MCP client doesn't time out if the API is slow/unreachable)
  try {
    await apiClient.get("/tickets", { page: "1", pageSize: "1" });
    console.error(`[spectrasight-mcp] Connected to ${config.baseUrl} — ready`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[spectrasight-mcp] Warning: Could not connect to ${config.baseUrl} — ${message}. Tools will attempt to connect on first use.`);
  }
}

main().catch((err) => {
  console.error("[spectrasight-mcp] Fatal error:", err);
  process.exit(1);
});

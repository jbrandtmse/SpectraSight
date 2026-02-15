import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiClient } from "../api-client.js";
import { formatError } from "../errors.js";
import { Config } from "../config.js";

/** Total number of tools registered by the MCP server (update when adding/removing tools) */
const TOOL_COUNT = 7;

export function registerConnectionTools(server: McpServer, apiClient: ApiClient, config: Config): void {
  server.tool(
    "test_connection",
    "Test the connection to SpectraSight API and verify credentials",
    {},
    async () => {
      try {
        const result = await apiClient.get("/tickets", { page: "1", pageSize: "1" }) as {
          total?: number;
        };
        const total = result?.total ?? 0;
        return {
          content: [{
            type: "text",
            text: `Connected to SpectraSight API at ${config.baseUrl} — ${total} tickets found. All ${TOOL_COUNT} tools available.`,
          }],
        };
      } catch (err) {
        return formatError(err);
      }
    }
  );
}

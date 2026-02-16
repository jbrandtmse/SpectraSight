import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";
import { formatError } from "../errors.js";
import { TICKET_ID_PATTERN } from "../types.js";

const ListActivitySchema = {
  ticket_id: z.string().regex(TICKET_ID_PATTERN, "Ticket ID must match format SS-{number} (e.g., SS-42)").describe("Ticket ID (e.g., SS-42)"),
};

export function registerActivityTools(server: McpServer, apiClient: ApiClient): void {
  server.tool(
    "list_activity",
    "Get the activity timeline for a ticket",
    ListActivitySchema,
    async (params) => {
      try {
        const data = await apiClient.get(`/tickets/${params.ticket_id}/activity`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (err) {
        return formatError(err);
      }
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";
import { formatError } from "../errors.js";
import { TICKET_ID_PATTERN } from "../types.js";

const AddCommentSchema = {
  ticket_id: z.string().regex(TICKET_ID_PATTERN, "Ticket ID must match format SS-{number} (e.g., SS-42)").describe("Ticket ID to comment on (e.g., SS-42)"),
  body: z.string().describe("Comment text"),
};

export function registerCommentTools(server: McpServer, apiClient: ApiClient): void {
  server.tool(
    "add_comment",
    "Add a comment to a ticket",
    AddCommentSchema,
    async (params) => {
      try {
        const data = await apiClient.post(`/tickets/${params.ticket_id}/comments`, {
          body: params.body,
          actorType: "agent",
        });
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (err) {
        return formatError(err);
      }
    }
  );
}

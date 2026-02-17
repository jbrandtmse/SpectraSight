import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";
import { Config } from "../config.js";
import { formatError } from "../errors.js";
import { TICKET_ID_PATTERN } from "../types.js";
import { resolveUser } from "../user-identity.js";

const AddCommentSchema = {
  ticket_id: z.string().regex(TICKET_ID_PATTERN, "Ticket ID must match format SS-{number} (e.g., SS-42)").describe("Ticket ID to comment on (e.g., SS-42)"),
  body: z.string().describe("Comment text"),
  user: z.string().optional().describe("Display name of the mapped user to act as. Validated against active user mappings. If omitted, defaults to the display name mapped to the IRIS authentication username."),
};

export function registerCommentTools(server: McpServer, apiClient: ApiClient, config: Config): void {
  server.tool(
    "add_comment",
    "Add a comment to a ticket",
    AddCommentSchema,
    async (params) => {
      try {
        const identity = await resolveUser(apiClient, config, params.user);

        const data = await apiClient.post(`/tickets/${params.ticket_id}/comments`, {
          body: params.body,
          actorName: identity.actorName,
          actorType: identity.actorType,
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

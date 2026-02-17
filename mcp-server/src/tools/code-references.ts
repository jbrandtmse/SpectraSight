import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";
import { Config } from "../config.js";
import { formatError } from "../errors.js";
import { TICKET_ID_PATTERN } from "../types.js";
import { resolveUser } from "../user-identity.js";

const AddCodeReferenceSchema = {
  ticket_id: z.string().regex(TICKET_ID_PATTERN, "Ticket ID must match format SS-{number} (e.g., SS-42)").describe("Ticket ID (e.g., SS-42)"),
  class_name: z.string().describe("ObjectScript class name (e.g., SpectraSight.Model.Ticket)"),
  method_name: z.string().optional().describe("Method name within the class"),
  user: z.string().optional().describe("Display name of the mapped user to act as. Validated against active user mappings. If omitted, defaults to the display name mapped to the IRIS authentication username."),
};

const RemoveCodeReferenceSchema = {
  ticket_id: z.string().regex(TICKET_ID_PATTERN, "Ticket ID must match format SS-{number} (e.g., SS-42)").describe("Ticket ID (e.g., SS-42)"),
  reference_id: z.number().describe("Code reference ID to remove"),
  user: z.string().optional().describe("Display name of the mapped user to act as. Validated against active user mappings. If omitted, defaults to the display name mapped to the IRIS authentication username."),
};

export function registerCodeReferenceTools(server: McpServer, apiClient: ApiClient, config: Config): void {
  server.tool(
    "add_code_reference",
    "Add an ObjectScript code reference to a ticket",
    AddCodeReferenceSchema,
    async (params) => {
      try {
        const identity = await resolveUser(apiClient, config, params.user);

        const body: Record<string, unknown> = {
          className: params.class_name,
          actorName: identity.actorName,
          actorType: identity.actorType,
        };
        if (params.method_name !== undefined) body.methodName = params.method_name;

        const data = await apiClient.post(`/tickets/${params.ticket_id}/code-references`, body);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (err) {
        return formatError(err);
      }
    }
  );

  server.tool(
    "remove_code_reference",
    "Remove a code reference from a ticket",
    RemoveCodeReferenceSchema,
    async (params) => {
      try {
        const identity = await resolveUser(apiClient, config, params.user);

        await apiClient.del(
          `/tickets/${params.ticket_id}/code-references/${params.reference_id}`,
          { actorName: identity.actorName, actorType: identity.actorType }
        );
        return {
          content: [{ type: "text", text: `Code reference ${params.reference_id} removed from ticket ${params.ticket_id}` }],
        };
      } catch (err) {
        return formatError(err);
      }
    }
  );
}

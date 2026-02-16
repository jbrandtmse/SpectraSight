import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";
import { formatError } from "../errors.js";

const CreateProjectSchema = {
  name: z.string().min(1).max(255).describe("Project name (required)"),
  prefix: z.string().min(2).max(10).regex(/^[A-Z]{2,10}$/, "Prefix must be 2-10 uppercase letters (e.g., DATA)").describe("Unique 2-10 character uppercase prefix (e.g., DATA)"),
  owner: z.string().optional().describe("Project owner"),
};

export function registerProjectTools(server: McpServer, apiClient: ApiClient): void {
  server.tool(
    "list_projects",
    "List all projects in SpectraSight",
    {},
    async () => {
      try {
        const data = await apiClient.get("/projects");
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (err) {
        return formatError(err);
      }
    }
  );

  server.tool(
    "create_project",
    "Create a new project in SpectraSight",
    CreateProjectSchema,
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          name: params.name,
          prefix: params.prefix,
        };
        if (params.owner !== undefined) body.owner = params.owner;

        const data = await apiClient.post("/projects", body);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (err) {
        return formatError(err);
      }
    }
  );
}

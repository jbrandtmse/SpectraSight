import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";
import { registerActivityTools } from "../../tools/activity.js";
import { ApiClient } from "../../api-client.js";

type ToolHandler = (params: Record<string, unknown>) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

interface ToolRegistration {
  name: string;
  description: string;
  schema: Record<string, z.ZodType>;
  handler: ToolHandler;
}

function createMockServer(): { tool: ReturnType<typeof vi.fn>; tools: Map<string, ToolRegistration> } {
  const tools = new Map<string, ToolRegistration>();
  const toolFn = vi.fn((name: string, description: string, schema: Record<string, z.ZodType>, handler: ToolHandler) => {
    tools.set(name, { name, description, schema, handler });
  });
  return { tool: toolFn, tools };
}

function createMockApiClient() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
  } as unknown as ApiClient;
}

describe("activity tools", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;
  let tools: Map<string, ToolRegistration>;

  beforeEach(() => {
    mockServer = createMockServer();
    mockApiClient = createMockApiClient();
    registerActivityTools(mockServer as unknown as Parameters<typeof registerActivityTools>[0], mockApiClient);
    tools = mockServer.tools;
  });

  it("registers list_activity tool", () => {
    expect(tools.has("list_activity")).toBe(true);
  });

  describe("list_activity", () => {
    it("calls GET with correct path", async () => {
      const activities = [
        { id: 1, type: "statusChange", fromStatus: "Open", toStatus: "In Progress" },
        { id: 2, type: "comment", body: "Working on it" },
      ];
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(activities);

      const handler = tools.get("list_activity")!.handler;
      const result = await handler({ ticket_id: "SS-10" });

      expect(mockApiClient.get).toHaveBeenCalledWith("/tickets/SS-10/activity");
      expect(result.content).toHaveLength(1);

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].type).toBe("statusChange");
      expect(parsed[1].type).toBe("comment");
    });

    it("returns empty array when no activity exists", async () => {
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const handler = tools.get("list_activity")!.handler;
      const result = await handler({ ticket_id: "SS-10" });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveLength(0);
    });
  });

  describe("Zod schema validation", () => {
    it("rejects invalid ticket_id format", () => {
      const schema = tools.get("list_activity")!.schema;
      const ticketIdSchema = schema.ticket_id as z.ZodString;
      const result = ticketIdSchema.safeParse("invalid");
      expect(result.success).toBe(false);
    });

    it("accepts valid ticket_id format", () => {
      const schema = tools.get("list_activity")!.schema;
      const ticketIdSchema = schema.ticket_id as z.ZodString;
      const result = ticketIdSchema.safeParse("SS-42");
      expect(result.success).toBe(true);
    });
  });

  describe("error handling", () => {
    it("returns formatted error when API call fails", async () => {
      const { ApiError } = await import("../../api-client.js");
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new ApiError("NOT_FOUND", "Ticket SS-999 not found", 404)
      );

      const handler = tools.get("list_activity")!.handler;
      const result = await handler({ ticket_id: "SS-999" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("NOT_FOUND");
    });
  });
});

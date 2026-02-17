import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";
import { registerCommentTools } from "../../tools/comments.js";
import { ApiClient } from "../../api-client.js";
import { Config } from "../../config.js";
import { clearUserCache } from "../../user-identity.js";

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

const mockConfig: Config = {
  baseUrl: "http://localhost:52773",
  username: "_SYSTEM",
  password: "SYS",
};

const activeUsers = [
  { id: 1, irisUsername: "_SYSTEM", displayName: "Spectra", isActive: true },
  { id: 2, irisUsername: "jdoe", displayName: "Joe", isActive: true },
];

describe("comment tools", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;
  let tools: Map<string, ToolRegistration>;

  beforeEach(() => {
    clearUserCache();
    mockServer = createMockServer();
    mockApiClient = createMockApiClient();
    // Mock GET /users for resolveUser
    (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(activeUsers);
    registerCommentTools(mockServer as unknown as Parameters<typeof registerCommentTools>[0], mockApiClient, mockConfig);
    tools = mockServer.tools;
  });

  it("registers add_comment tool", () => {
    expect(tools.has("add_comment")).toBe(true);
  });

  describe("add_comment", () => {
    it("calls POST with body, resolved actorName and actorType", async () => {
      const createdComment = {
        id: "1",
        ticketId: "SS-10",
        body: "This is a comment",
        actorName: "Spectra",
        actorType: "agent",
        createdAt: "2026-02-15T00:00:00Z",
      };
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(createdComment);

      const handler = tools.get("add_comment")!.handler;
      await handler({
        ticket_id: "SS-10",
        body: "This is a comment",
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/tickets/SS-10/comments", {
        body: "This is a comment",
        actorName: "Spectra",
        actorType: "agent",
      });
    });

    it("uses specified user as actorName", async () => {
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "2" });

      const handler = tools.get("add_comment")!.handler;
      await handler({
        ticket_id: "SS-10",
        body: "Comment from Joe",
        user: "Joe",
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/tickets/SS-10/comments", {
        body: "Comment from Joe",
        actorName: "Joe",
        actorType: "agent",
      });
    });

    it("returns comment data as JSON content", async () => {
      const createdComment = {
        id: "1",
        ticketId: "SS-10",
        body: "Test comment",
        actorName: "Spectra",
        actorType: "agent",
        createdAt: "2026-02-15T00:00:00Z",
      };
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(createdComment);

      const handler = tools.get("add_comment")!.handler;
      const result = await handler({
        ticket_id: "SS-10",
        body: "Test comment",
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe("1");
      expect(parsed.body).toBe("Test comment");
      expect(parsed.actorType).toBe("agent");
    });
  });

  describe("Zod schema validation", () => {
    it("rejects invalid ticket_id format", () => {
      const schema = tools.get("add_comment")!.schema;
      const ticketIdSchema = schema.ticket_id as z.ZodString;
      const result = ticketIdSchema.safeParse("invalid");
      expect(result.success).toBe(false);
    });

    it("accepts valid ticket_id format", () => {
      const schema = tools.get("add_comment")!.schema;
      const ticketIdSchema = schema.ticket_id as z.ZodString;
      const result = ticketIdSchema.safeParse("SS-42");
      expect(result.success).toBe(true);
    });
  });

  describe("error handling", () => {
    it("returns formatted error when API call fails", async () => {
      const { ApiError } = await import("../../api-client.js");
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(
        new ApiError("NOT_FOUND", "Ticket SS-999 not found", 404)
      );

      const handler = tools.get("add_comment")!.handler;
      const result = await handler({
        ticket_id: "SS-999",
        body: "Comment on nonexistent ticket",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("NOT_FOUND");
    });
  });
});

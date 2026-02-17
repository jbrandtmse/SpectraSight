import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";
import { registerCodeReferenceTools } from "../../tools/code-references.js";
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

describe("code reference tools", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;
  let tools: Map<string, ToolRegistration>;

  beforeEach(() => {
    clearUserCache();
    mockServer = createMockServer();
    mockApiClient = createMockApiClient();
    // Mock GET /users for resolveUser
    (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(activeUsers);
    registerCodeReferenceTools(mockServer as unknown as Parameters<typeof registerCodeReferenceTools>[0], mockApiClient, mockConfig);
    tools = mockServer.tools;
  });

  it("registers add_code_reference and remove_code_reference tools", () => {
    expect(tools.has("add_code_reference")).toBe(true);
    expect(tools.has("remove_code_reference")).toBe(true);
  });

  describe("add_code_reference", () => {
    it("calls POST with className, methodName, and resolved identity", async () => {
      const createdRef = {
        id: 5,
        className: "SpectraSight.Model.Ticket",
        methodName: "GetById",
        addedBy: "Spectra",
        timestamp: "2026-02-15T00:00:00Z",
      };
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(createdRef);

      const handler = tools.get("add_code_reference")!.handler;
      await handler({
        ticket_id: "SS-10",
        class_name: "SpectraSight.Model.Ticket",
        method_name: "GetById",
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/tickets/SS-10/code-references", expect.objectContaining({
        className: "SpectraSight.Model.Ticket",
        methodName: "GetById",
        actorName: "Spectra",
        actorType: "agent",
      }));
    });

    it("omits methodName when method_name is not provided", async () => {
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 6 });

      const handler = tools.get("add_code_reference")!.handler;
      await handler({
        ticket_id: "SS-10",
        class_name: "SpectraSight.Model.Ticket",
      });

      const callArgs = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(callArgs.className).toBe("SpectraSight.Model.Ticket");
      expect(callArgs.actorName).toBe("Spectra");
      expect(callArgs).not.toHaveProperty("methodName");
    });

    it("includes specified user as actorName", async () => {
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 7 });

      const handler = tools.get("add_code_reference")!.handler;
      await handler({
        ticket_id: "SS-10",
        class_name: "SomeClass",
        user: "Joe",
      });

      const callArgs = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(callArgs.actorName).toBe("Joe");
      expect(callArgs.actorType).toBe("agent");
    });

    it("returns created reference as JSON content", async () => {
      const createdRef = {
        id: 5,
        className: "SpectraSight.Model.Ticket",
        methodName: "GetById",
      };
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(createdRef);

      const handler = tools.get("add_code_reference")!.handler;
      const result = await handler({
        ticket_id: "SS-10",
        class_name: "SpectraSight.Model.Ticket",
        method_name: "GetById",
      });

      expect(result.content).toHaveLength(1);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe(5);
      expect(parsed.className).toBe("SpectraSight.Model.Ticket");
    });
  });

  describe("remove_code_reference", () => {
    it("calls DELETE with correct path and resolved identity body", async () => {
      (mockApiClient.del as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const handler = tools.get("remove_code_reference")!.handler;
      const result = await handler({
        ticket_id: "SS-10",
        reference_id: 5,
      });

      expect(mockApiClient.del).toHaveBeenCalledWith(
        "/tickets/SS-10/code-references/5",
        { actorName: "Spectra", actorType: "agent" }
      );
      expect(result.content[0].text).toContain("Code reference 5 removed");
      expect(result.content[0].text).toContain("SS-10");
    });

    it("includes specified user as actorName in DELETE body", async () => {
      (mockApiClient.del as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const handler = tools.get("remove_code_reference")!.handler;
      await handler({
        ticket_id: "SS-10",
        reference_id: 5,
        user: "Joe",
      });

      expect(mockApiClient.del).toHaveBeenCalledWith(
        "/tickets/SS-10/code-references/5",
        { actorName: "Joe", actorType: "agent" }
      );
    });
  });

  describe("Zod schema validation", () => {
    it("rejects invalid ticket_id format for add_code_reference", () => {
      const schema = tools.get("add_code_reference")!.schema;
      const ticketIdSchema = schema.ticket_id as z.ZodString;
      const result = ticketIdSchema.safeParse("invalid");
      expect(result.success).toBe(false);
    });

    it("accepts valid ticket_id format for add_code_reference", () => {
      const schema = tools.get("add_code_reference")!.schema;
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

      const handler = tools.get("add_code_reference")!.handler;
      const result = await handler({
        ticket_id: "SS-999",
        class_name: "SomeClass",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("NOT_FOUND");
    });
  });
});

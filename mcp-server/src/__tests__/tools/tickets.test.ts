import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";
import { registerTicketTools } from "../../tools/tickets.js";
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

describe("ticket tools", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;
  let tools: Map<string, ToolRegistration>;

  beforeEach(() => {
    clearUserCache();
    mockServer = createMockServer();
    mockApiClient = createMockApiClient();
    // Mock GET /users for resolveUser
    (mockApiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      if (path === "/users") return Promise.resolve(activeUsers);
      return Promise.resolve({});
    });
    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient, mockConfig);
    tools = mockServer.tools;
  });

  it("registers all five ticket tools", () => {
    expect(tools.has("create_ticket")).toBe(true);
    expect(tools.has("get_ticket")).toBe(true);
    expect(tools.has("update_ticket")).toBe(true);
    expect(tools.has("delete_ticket")).toBe(true);
    expect(tools.has("list_tickets")).toBe(true);
  });

  describe("create_ticket", () => {
    it("calls POST /tickets with correct camelCase body and resolved identity", async () => {
      const createdTicket = { id: "SS-1", title: "Bug fix", type: "bug" };
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(createdTicket);

      const handler = tools.get("create_ticket")!.handler;
      const result = await handler({
        title: "Bug fix",
        type: "bug",
        description: "Fix the bug",
        priority: "High",
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/tickets", expect.objectContaining({
        title: "Bug fix",
        type: "bug",
        description: "Fix the bug",
        priority: "High",
        actorName: "Spectra",
        actorType: "agent",
      }));

      expect(result.content[0].text).toContain("SS-1");
    });

    it("includes specified user as actorName in request body", async () => {
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-99" });

      const handler = tools.get("create_ticket")!.handler;
      await handler({
        title: "Test",
        type: "task",
        user: "Joe",
      });

      const callArgs = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(callArgs.actorName).toBe("Joe");
      expect(callArgs.actorType).toBe("agent");
    });

    it("maps parent_id to parentId in request body", async () => {
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-2" });

      const handler = tools.get("create_ticket")!.handler;
      await handler({
        title: "Sub-task",
        type: "task",
        parent_id: "SS-1",
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/tickets", expect.objectContaining({
        parentId: "SS-1",
      }));

      // Verify parent_id is NOT in the body (it should be mapped to parentId)
      const callArgs = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(callArgs).not.toHaveProperty("parent_id");
    });

    it("maps bug-specific fields to camelCase in request body", async () => {
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-3" });

      const handler = tools.get("create_ticket")!.handler;
      await handler({
        title: "Login crash",
        type: "bug",
        severity: "High",
        steps_to_reproduce: "1. Open app\n2. Click login",
        expected_behavior: "Login form appears",
        actual_behavior: "App crashes",
      });

      const callArgs = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(callArgs.severity).toBe("High");
      expect(callArgs.stepsToReproduce).toBe("1. Open app\n2. Click login");
      expect(callArgs.expectedBehavior).toBe("Login form appears");
      expect(callArgs.actualBehavior).toBe("App crashes");
      expect(callArgs).not.toHaveProperty("steps_to_reproduce");
      expect(callArgs).not.toHaveProperty("expected_behavior");
      expect(callArgs).not.toHaveProperty("actual_behavior");
    });

    it("maps task-specific fields to camelCase in request body", async () => {
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-4" });

      const handler = tools.get("create_ticket")!.handler;
      await handler({
        title: "Setup CI",
        type: "task",
        estimated_hours: 4,
        actual_hours: 2,
      });

      const callArgs = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(callArgs.estimatedHours).toBe(4);
      expect(callArgs.actualHours).toBe(2);
      expect(callArgs).not.toHaveProperty("estimated_hours");
      expect(callArgs).not.toHaveProperty("actual_hours");
    });

    it("maps story-specific fields to camelCase in request body", async () => {
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-5" });

      const handler = tools.get("create_ticket")!.handler;
      await handler({
        title: "User login",
        type: "story",
        story_points: 5,
        acceptance_criteria: "User can log in with email",
      });

      const callArgs = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(callArgs.storyPoints).toBe(5);
      expect(callArgs.acceptanceCriteria).toBe("User can log in with email");
      expect(callArgs).not.toHaveProperty("story_points");
      expect(callArgs).not.toHaveProperty("acceptance_criteria");
    });

    it("maps epic-specific fields to camelCase in request body", async () => {
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-6" });

      const handler = tools.get("create_ticket")!.handler;
      await handler({
        title: "MCP Integration",
        type: "epic",
        start_date: "2026-02-01",
        target_date: "2026-03-15",
      });

      const callArgs = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(callArgs.startDate).toBe("2026-02-01");
      expect(callArgs.targetDate).toBe("2026-03-15");
      expect(callArgs).not.toHaveProperty("start_date");
      expect(callArgs).not.toHaveProperty("target_date");
    });
  });

  describe("get_ticket", () => {
    it("calls GET with correct path", async () => {
      const ticket = { id: "SS-42", title: "Test ticket" };
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        if (path === "/users") return Promise.resolve(activeUsers);
        return Promise.resolve(ticket);
      });

      const handler = tools.get("get_ticket")!.handler;
      const result = await handler({ ticket_id: "SS-42" });

      expect(mockApiClient.get).toHaveBeenCalledWith("/tickets/SS-42");
      expect(result.content[0].text).toContain("SS-42");
      expect(result.content[0].text).toContain("Test ticket");
    });
  });

  describe("update_ticket", () => {
    it("calls PUT with correct path, strips ticket_id, and includes resolved identity", async () => {
      const updated = { id: "SS-10", title: "Updated title" };
      (mockApiClient.put as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

      const handler = tools.get("update_ticket")!.handler;
      const result = await handler({
        ticket_id: "SS-10",
        title: "Updated title",
        status: "In Progress",
      });

      expect(mockApiClient.put).toHaveBeenCalledWith("/tickets/SS-10", expect.objectContaining({
        title: "Updated title",
        status: "In Progress",
        actorName: "Spectra",
        actorType: "agent",
      }));

      // Verify ticket_id is NOT sent in the body
      const callArgs = (mockApiClient.put as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(callArgs).not.toHaveProperty("ticket_id");

      expect(result.content[0].text).toContain("Updated title");
    });

    it("returns error when no updatable fields are provided", async () => {
      const handler = tools.get("update_ticket")!.handler;
      const result = await handler({ ticket_id: "SS-10" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("At least one field");
      expect(mockApiClient.put).not.toHaveBeenCalled();
    });

    it("maps parent_id to parentId in update body", async () => {
      (mockApiClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-10" });

      const handler = tools.get("update_ticket")!.handler;
      await handler({
        ticket_id: "SS-10",
        parent_id: "SS-1",
      });

      const callArgs = (mockApiClient.put as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(callArgs.parentId).toBe("SS-1");
      expect(callArgs).not.toHaveProperty("parent_id");
    });

    it("maps type-specific fields to camelCase in update body", async () => {
      (mockApiClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-10" });

      const handler = tools.get("update_ticket")!.handler;
      await handler({
        ticket_id: "SS-10",
        severity: "Critical",
        steps_to_reproduce: "Steps here",
        estimated_hours: 8,
        story_points: 3,
        start_date: "2026-03-01",
      });

      const callArgs = (mockApiClient.put as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(callArgs.severity).toBe("Critical");
      expect(callArgs.stepsToReproduce).toBe("Steps here");
      expect(callArgs.estimatedHours).toBe(8);
      expect(callArgs.storyPoints).toBe(3);
      expect(callArgs.startDate).toBe("2026-03-01");
      expect(callArgs).not.toHaveProperty("ticket_id");
    });

    it("includes specified user as actorName in update request body", async () => {
      (mockApiClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-10" });

      const handler = tools.get("update_ticket")!.handler;
      await handler({
        ticket_id: "SS-10",
        title: "Test",
        user: "Joe",
      });

      const callArgs = (mockApiClient.put as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(callArgs.actorName).toBe("Joe");
      expect(callArgs.actorType).toBe("agent");
    });
  });

  describe("delete_ticket", () => {
    it("calls DELETE with correct path", async () => {
      (mockApiClient.del as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const handler = tools.get("delete_ticket")!.handler;
      const result = await handler({ ticket_id: "SS-5" });

      expect(mockApiClient.del).toHaveBeenCalledWith("/tickets/SS-5");
      expect(result.content[0].text).toContain("SS-5");
      expect(result.content[0].text).toContain("deleted successfully");
    });
  });

  describe("list_tickets", () => {
    it("maps page_size to pageSize in query params", async () => {
      const paginated = { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        if (path === "/users") return Promise.resolve(activeUsers);
        return Promise.resolve(paginated);
      });

      const handler = tools.get("list_tickets")!.handler;
      await handler({
        type: "bug",
        page: 2,
        page_size: 10,
      });

      expect(mockApiClient.get).toHaveBeenCalledWith("/tickets", expect.objectContaining({
        type: "bug",
        page: 2,
        pageSize: 10,
      }));

      // Find the /tickets call specifically
      const ticketCall = (mockApiClient.get as ReturnType<typeof vi.fn>).mock.calls.find(
        (c: unknown[]) => c[0] === "/tickets"
      );
      expect(ticketCall![1]).not.toHaveProperty("page_size");
    });

    it("calls GET without params when no filters are provided", async () => {
      const paginated = { data: [], total: 0, page: 1, pageSize: 25, totalPages: 0 };
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        if (path === "/users") return Promise.resolve(activeUsers);
        return Promise.resolve(paginated);
      });

      const handler = tools.get("list_tickets")!.handler;
      await handler({});

      expect(mockApiClient.get).toHaveBeenCalledWith("/tickets", expect.objectContaining({}));
    });

    it("passes includeClosed=true when include_closed is true", async () => {
      const paginated = { data: [], total: 0, page: 1, pageSize: 25, totalPages: 0 };
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        if (path === "/users") return Promise.resolve(activeUsers);
        return Promise.resolve(paginated);
      });

      const handler = tools.get("list_tickets")!.handler;
      await handler({ include_closed: true });

      const ticketCall = (mockApiClient.get as ReturnType<typeof vi.fn>).mock.calls.find(
        (c: unknown[]) => c[0] === "/tickets"
      );
      expect(ticketCall![1]).toHaveProperty("includeClosed", "true");
    });

    it("does not pass includeClosed when include_closed is false", async () => {
      const paginated = { data: [], total: 0, page: 1, pageSize: 25, totalPages: 0 };
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        if (path === "/users") return Promise.resolve(activeUsers);
        return Promise.resolve(paginated);
      });

      const handler = tools.get("list_tickets")!.handler;
      await handler({ include_closed: false });

      const ticketCall = (mockApiClient.get as ReturnType<typeof vi.fn>).mock.calls.find(
        (c: unknown[]) => c[0] === "/tickets"
      );
      expect(ticketCall![1].includeClosed).toBeUndefined();
    });

    it("does not pass includeClosed when include_closed is omitted", async () => {
      const paginated = { data: [], total: 0, page: 1, pageSize: 25, totalPages: 0 };
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        if (path === "/users") return Promise.resolve(activeUsers);
        return Promise.resolve(paginated);
      });

      const handler = tools.get("list_tickets")!.handler;
      await handler({});

      const ticketCall = (mockApiClient.get as ReturnType<typeof vi.fn>).mock.calls.find(
        (c: unknown[]) => c[0] === "/tickets"
      );
      expect(ticketCall![1].includeClosed).toBeUndefined();
    });

    it("returns full paginated envelope as JSON", async () => {
      const paginated = {
        data: [{ id: "SS-1", title: "First" }],
        total: 1,
        page: 1,
        pageSize: 25,
        totalPages: 1,
      };
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        if (path === "/users") return Promise.resolve(activeUsers);
        return Promise.resolve(paginated);
      });

      const handler = tools.get("list_tickets")!.handler;
      const result = await handler({});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data).toHaveLength(1);
      expect(parsed.total).toBe(1);
      expect(parsed.totalPages).toBe(1);
    });
  });

  describe("Zod schema validation", () => {
    it("rejects invalid ticket_id format (missing SS- prefix)", () => {
      const schema = tools.get("get_ticket")!.schema;
      const ticketIdSchema = schema.ticket_id as z.ZodString;
      const result = ticketIdSchema.safeParse("invalid");
      expect(result.success).toBe(false);
    });

    it("accepts valid ticket_id format (SS-42)", () => {
      const schema = tools.get("get_ticket")!.schema;
      const ticketIdSchema = schema.ticket_id as z.ZodString;
      const result = ticketIdSchema.safeParse("SS-42");
      expect(result.success).toBe(true);
    });

    it("rejects ticket_id without number (SS-)", () => {
      const schema = tools.get("get_ticket")!.schema;
      const ticketIdSchema = schema.ticket_id as z.ZodString;
      const result = ticketIdSchema.safeParse("SS-");
      expect(result.success).toBe(false);
    });
  });

  describe("error handling", () => {
    it("returns formatted error when API call fails", async () => {
      const { ApiError } = await import("../../api-client.js");
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        if (path === "/users") return Promise.resolve(activeUsers);
        return Promise.reject(new ApiError("NOT_FOUND", "Ticket not found", 404));
      });

      const handler = tools.get("get_ticket")!.handler;
      const result = await handler({ ticket_id: "SS-999" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("NOT_FOUND");
      expect(result.content[0].text).toContain("Ticket not found");
    });
  });
});

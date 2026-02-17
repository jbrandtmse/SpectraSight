/**
 * QA Automated Tests for Story 5.3: Project REST API & MCP Tools
 *
 * Cross-cutting tests that verify Story 5.3 changes across MCP components:
 * - TOOL_COUNT updated from 10 to 12 (list_projects + create_project)
 * - TICKET_ID_PATTERN supports multi-project prefixes (e.g., DATA-1, SS-42)
 * - list_tickets project parameter passes through to API
 * - README documents new project tools
 * - index.ts registers registerProjectTools
 * - Total tool count is 12 across all 6 registration modules
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { z } from "zod";
import { registerTicketTools } from "../tools/tickets.js";
import { registerCommentTools } from "../tools/comments.js";
import { registerCodeReferenceTools } from "../tools/code-references.js";
import { registerActivityTools } from "../tools/activity.js";
import { registerConnectionTools } from "../tools/connection.js";
import { registerProjectTools } from "../tools/projects.js";
import { TICKET_ID_PATTERN } from "../types.js";
import { ApiClient } from "../api-client.js";

// ---- Shared mock infrastructure ----

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

// ---- TICKET_ID_PATTERN multi-project support ----

describe("QA 5.3: TICKET_ID_PATTERN supports multi-project prefixes", () => {
  it("accepts SS-42 (default project)", () => {
    expect(TICKET_ID_PATTERN.test("SS-42")).toBe(true);
  });

  it("accepts DATA-1 (multi-project prefix)", () => {
    expect(TICKET_ID_PATTERN.test("DATA-1")).toBe(true);
  });

  it("accepts 2-letter prefix (AB-99)", () => {
    expect(TICKET_ID_PATTERN.test("AB-99")).toBe(true);
  });

  it("accepts 10-letter prefix (ABCDEFGHIJ-1)", () => {
    expect(TICKET_ID_PATTERN.test("ABCDEFGHIJ-1")).toBe(true);
  });

  it("rejects 1-letter prefix (A-1)", () => {
    expect(TICKET_ID_PATTERN.test("A-1")).toBe(false);
  });

  it("rejects 11-letter prefix (ABCDEFGHIJK-1)", () => {
    expect(TICKET_ID_PATTERN.test("ABCDEFGHIJK-1")).toBe(false);
  });

  it("rejects lowercase prefix (data-1)", () => {
    expect(TICKET_ID_PATTERN.test("data-1")).toBe(false);
  });

  it("rejects missing number (SS-)", () => {
    expect(TICKET_ID_PATTERN.test("SS-")).toBe(false);
  });

  it("rejects missing prefix (-42)", () => {
    expect(TICKET_ID_PATTERN.test("-42")).toBe(false);
  });

  it("rejects numeric prefix (12-34)", () => {
    expect(TICKET_ID_PATTERN.test("12-34")).toBe(false);
  });
});

// ---- Ticket tools: multi-project ticket_id validation ----

describe("QA 5.3: ticket tools accept multi-project ticket IDs", () => {
  let tools: Map<string, ToolRegistration>;

  beforeEach(() => {
    const mockServer = createMockServer();
    const mockApiClient = createMockApiClient();
    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient);
    tools = mockServer.tools;
  });

  it("get_ticket accepts DATA-1 ticket ID", () => {
    const schema = tools.get("get_ticket")!.schema;
    const ticketIdSchema = schema.ticket_id as z.ZodString;
    expect(ticketIdSchema.safeParse("DATA-1").success).toBe(true);
  });

  it("update_ticket accepts DATA-42 ticket ID", () => {
    const schema = tools.get("update_ticket")!.schema;
    const ticketIdSchema = schema.ticket_id as z.ZodString;
    expect(ticketIdSchema.safeParse("DATA-42").success).toBe(true);
  });

  it("delete_ticket accepts MYPROJ-99 ticket ID", () => {
    const schema = tools.get("delete_ticket")!.schema;
    const ticketIdSchema = schema.ticket_id as z.ZodString;
    expect(ticketIdSchema.safeParse("MYPROJ-99").success).toBe(true);
  });

  it("create_ticket parent_id accepts multi-project format", () => {
    const schema = tools.get("create_ticket")!.schema;
    const parentIdSchema = schema.parent_id;
    expect(parentIdSchema.safeParse("DATA-10").success).toBe(true);
  });
});

// ---- list_tickets: project parameter ----

describe("QA 5.3: list_tickets passes project parameter to API", () => {
  let tools: Map<string, ToolRegistration>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;

  beforeEach(() => {
    const mockServer = createMockServer();
    mockApiClient = createMockApiClient();
    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient);
    tools = mockServer.tools;
  });

  it("passes project prefix in query params", async () => {
    const paginated = { data: [], total: 0, page: 1, pageSize: 25, totalPages: 0 };
    (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(paginated);

    const handler = tools.get("list_tickets")!.handler;
    await handler({ project: "DATA" });

    const callParams = (mockApiClient.get as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(callParams.project).toBe("DATA");
  });

  it("passes numeric project ID in query params", async () => {
    const paginated = { data: [], total: 0, page: 1, pageSize: 25, totalPages: 0 };
    (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(paginated);

    const handler = tools.get("list_tickets")!.handler;
    await handler({ project: "5" });

    const callParams = (mockApiClient.get as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(callParams.project).toBe("5");
  });

  it("does not include project when not provided", async () => {
    const paginated = { data: [], total: 0, page: 1, pageSize: 25, totalPages: 0 };
    (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(paginated);

    const handler = tools.get("list_tickets")!.handler;
    await handler({});

    const callParams = (mockApiClient.get as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(callParams.project).toBeUndefined();
  });

  it("ListTicketsSchema has project field as optional string", () => {
    const schema = tools.get("list_tickets")!.schema;
    expect(schema.project).toBeDefined();
    expect(schema.project.safeParse("DATA").success).toBe(true);
    expect(schema.project.safeParse(undefined).success).toBe(true);
  });
});

// ---- Total tool count is 12 ----

describe("QA 5.3: total tool count is 12", () => {
  it("all 6 registration modules produce exactly 12 tools total", () => {
    const mockServer = createMockServer();
    const mockApiClient = createMockApiClient();
    const config = { baseUrl: "http://localhost:52773", username: "_SYSTEM", password: "SYS" };

    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient);
    registerCommentTools(mockServer as unknown as Parameters<typeof registerCommentTools>[0], mockApiClient);
    registerCodeReferenceTools(mockServer as unknown as Parameters<typeof registerCodeReferenceTools>[0], mockApiClient);
    registerActivityTools(mockServer as unknown as Parameters<typeof registerActivityTools>[0], mockApiClient);
    registerProjectTools(mockServer as unknown as Parameters<typeof registerProjectTools>[0], mockApiClient);
    registerConnectionTools(mockServer as unknown as Parameters<typeof registerConnectionTools>[0], mockApiClient, config);

    expect(mockServer.tools.size).toBe(12);
  });

  it("includes list_projects and create_project in the registered tools", () => {
    const mockServer = createMockServer();
    const mockApiClient = createMockApiClient();
    const config = { baseUrl: "http://localhost:52773", username: "_SYSTEM", password: "SYS" };

    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient);
    registerCommentTools(mockServer as unknown as Parameters<typeof registerCommentTools>[0], mockApiClient);
    registerCodeReferenceTools(mockServer as unknown as Parameters<typeof registerCodeReferenceTools>[0], mockApiClient);
    registerActivityTools(mockServer as unknown as Parameters<typeof registerActivityTools>[0], mockApiClient);
    registerProjectTools(mockServer as unknown as Parameters<typeof registerProjectTools>[0], mockApiClient);
    registerConnectionTools(mockServer as unknown as Parameters<typeof registerConnectionTools>[0], mockApiClient, config);

    expect(mockServer.tools.has("list_projects")).toBe(true);
    expect(mockServer.tools.has("create_project")).toBe(true);
  });

  it("test_connection success message includes 'All 12 tools available'", async () => {
    const mockServer = createMockServer();
    const mockApiClient = createMockApiClient();
    const config = { baseUrl: "http://localhost:52773", username: "_SYSTEM", password: "SYS" };

    registerConnectionTools(mockServer as unknown as Parameters<typeof registerConnectionTools>[0], mockApiClient, config);

    (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ total: 5 });

    const handler = mockServer.tools.get("test_connection")!.handler;
    const result = await handler({});

    expect(result.content[0].text).toContain("12 tools available");
  });
});

// ---- index.ts registers project tools ----

describe("QA 5.3: index.ts registers project tools", () => {
  let indexContent: string;

  beforeEach(() => {
    const indexPath = resolve(import.meta.dirname, "../index.ts");
    indexContent = readFileSync(indexPath, "utf-8");
  });

  it("imports registerProjectTools", () => {
    expect(indexContent).toContain("registerProjectTools");
    expect(indexContent).toContain("./tools/projects.js");
  });

  it("calls registerProjectTools(server, apiClient)", () => {
    expect(indexContent).toContain("registerProjectTools(server, apiClient)");
  });
});

// ---- README documents Story 5.3 tools ----

describe("QA 5.3: README documents project tools", () => {
  const readmePath = resolve(import.meta.dirname, "../../README.md");
  let readmeContent: string;

  beforeEach(() => {
    readmeContent = readFileSync(readmePath, "utf-8");
  });

  it("documents list_projects tool", () => {
    expect(readmeContent).toContain("list_projects");
  });

  it("documents create_project tool", () => {
    expect(readmeContent).toContain("create_project");
  });

  it("shows correct tool count of 12 in example output", () => {
    expect(readmeContent).toContain("12 tools available");
  });
});

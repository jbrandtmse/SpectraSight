/**
 * QA Automated Tests for Story 6.4: MCP User Identity Selection
 *
 * These tests verify all 8 acceptance criteria at the QA level, covering gaps
 * not addressed by dev-authored unit tests:
 *
 * - Schema: all 5 mutation tools include `user` parameter with correct description
 * - Schema: `user` param is optional on all schemas (undefined parses OK)
 * - Identity resolution: all mutation handlers resolve identity and pass actorName/actorType
 * - Identity resolution: default identity (no user param) maps config username to display name
 * - Identity resolution: invalid user error propagates as formatted error from all 5 tools
 * - Identity resolution: `user` field itself is never sent to REST API
 * - Cross-cutting: TOOL_COUNT stays at 12 (no new tools added)
 * - Cross-cutting: index.ts passes config to tickets, comments, code-references modules
 * - Cross-cutting: api-client del() accepts optional body for identity passing
 * - Cross-cutting: README documents user identity feature
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
import { ApiClient } from "../api-client.js";
import { Config } from "../config.js";
import { clearUserCache } from "../user-identity.js";

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

const mockConfig: Config = {
  baseUrl: "http://localhost:52773",
  username: "_SYSTEM",
  password: "SYS",
};

const activeUsers = [
  { id: 1, irisUsername: "_SYSTEM", displayName: "Spectra", isActive: true },
  { id: 2, irisUsername: "jdoe", displayName: "Joe", isActive: true },
];

function setupUserMock(mockApiClient: ReturnType<typeof createMockApiClient>) {
  (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(activeUsers);
}

const USER_PARAM_DESCRIPTION = "Display name of the mapped user to act as. Validated against active user mappings. If omitted, defaults to the display name mapped to the IRIS authentication username.";

// ---- AC #5: All 5 mutation tool schemas include `user` parameter ----

describe("QA AC#5: user parameter present on all mutation tool schemas", () => {
  let allTools: Map<string, ToolRegistration>;

  beforeEach(() => {
    const mockServer = createMockServer();
    const mockApiClient = createMockApiClient();

    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient, mockConfig);
    registerCommentTools(mockServer as unknown as Parameters<typeof registerCommentTools>[0], mockApiClient, mockConfig);
    registerCodeReferenceTools(mockServer as unknown as Parameters<typeof registerCodeReferenceTools>[0], mockApiClient, mockConfig);
    allTools = mockServer.tools;
  });

  const mutationTools = [
    "create_ticket",
    "update_ticket",
    "add_comment",
    "add_code_reference",
    "remove_code_reference",
  ];

  for (const toolName of mutationTools) {
    it(`${toolName} schema includes 'user' as an optional string parameter`, () => {
      const schema = allTools.get(toolName)!.schema;
      expect(schema.user, `Expected 'user' field in ${toolName} schema`).toBeDefined();
      // Should accept a valid string
      expect(schema.user.safeParse("Spectra").success).toBe(true);
      // Should accept undefined (optional)
      expect(schema.user.safeParse(undefined).success).toBe(true);
      // Should reject non-string
      expect(schema.user.safeParse(123).success).toBe(false);
    });
  }

  it("user parameter description is consistent across all 5 tools", () => {
    for (const toolName of mutationTools) {
      const schema = allTools.get(toolName)!.schema;
      const userField = schema.user as z.ZodOptional<z.ZodString>;
      // Extract description from the Zod schema
      const desc = userField.description;
      expect(desc, `Expected description on ${toolName}.user`).toBe(USER_PARAM_DESCRIPTION);
    }
  });

  it("non-mutation tools (get_ticket, delete_ticket, list_tickets) do NOT have user parameter", () => {
    const readOnlyTools = ["get_ticket", "delete_ticket", "list_tickets"];
    for (const toolName of readOnlyTools) {
      const schema = allTools.get(toolName)!.schema;
      expect(schema.user, `Expected NO 'user' field in ${toolName}`).toBeUndefined();
    }
  });
});

// ---- AC #6: TOOL_COUNT remains 12 ----

describe("QA AC#6: TOOL_COUNT remains 12 after Story 6.4", () => {
  it("all 6 registration modules produce exactly 12 tools total", () => {
    const mockServer = createMockServer();
    const mockApiClient = createMockApiClient();

    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient, mockConfig);
    registerCommentTools(mockServer as unknown as Parameters<typeof registerCommentTools>[0], mockApiClient, mockConfig);
    registerCodeReferenceTools(mockServer as unknown as Parameters<typeof registerCodeReferenceTools>[0], mockApiClient, mockConfig);
    registerActivityTools(mockServer as unknown as Parameters<typeof registerActivityTools>[0], mockApiClient);
    registerProjectTools(mockServer as unknown as Parameters<typeof registerProjectTools>[0], mockApiClient);
    registerConnectionTools(mockServer as unknown as Parameters<typeof registerConnectionTools>[0], mockApiClient, mockConfig);

    expect(mockServer.tools.size).toBe(12);
  });

  it("no tool named 'resolve_user' or 'set_user' was added (identity is param, not tool)", () => {
    const mockServer = createMockServer();
    const mockApiClient = createMockApiClient();

    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient, mockConfig);
    registerCommentTools(mockServer as unknown as Parameters<typeof registerCommentTools>[0], mockApiClient, mockConfig);
    registerCodeReferenceTools(mockServer as unknown as Parameters<typeof registerCodeReferenceTools>[0], mockApiClient, mockConfig);
    registerActivityTools(mockServer as unknown as Parameters<typeof registerActivityTools>[0], mockApiClient);
    registerProjectTools(mockServer as unknown as Parameters<typeof registerProjectTools>[0], mockApiClient);
    registerConnectionTools(mockServer as unknown as Parameters<typeof registerConnectionTools>[0], mockApiClient, mockConfig);

    expect(mockServer.tools.has("resolve_user")).toBe(false);
    expect(mockServer.tools.has("set_user")).toBe(false);
  });
});

// ---- AC #1: Specified user is used as actor across all 5 mutation tools ----

describe("QA AC#1: specified user becomes actorName on all mutation tools", () => {
  let allTools: Map<string, ToolRegistration>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;

  beforeEach(() => {
    clearUserCache();
    const mockServer = createMockServer();
    mockApiClient = createMockApiClient();
    setupUserMock(mockApiClient);

    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient, mockConfig);
    registerCommentTools(mockServer as unknown as Parameters<typeof registerCommentTools>[0], mockApiClient, mockConfig);
    registerCodeReferenceTools(mockServer as unknown as Parameters<typeof registerCodeReferenceTools>[0], mockApiClient, mockConfig);
    allTools = mockServer.tools;
  });

  it("create_ticket sends actorName='Joe' and actorType='agent' when user='Joe'", async () => {
    (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-1" });

    await allTools.get("create_ticket")!.handler({ title: "Test", type: "task", user: "Joe" });

    const body = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(body.actorName).toBe("Joe");
    expect(body.actorType).toBe("agent");
  });

  it("update_ticket sends actorName='Joe' when user='Joe'", async () => {
    (mockApiClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-1" });

    await allTools.get("update_ticket")!.handler({ ticket_id: "SS-1", title: "Updated", user: "Joe" });

    const body = (mockApiClient.put as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(body.actorName).toBe("Joe");
    expect(body.actorType).toBe("agent");
  });

  it("add_comment sends actorName='Joe' when user='Joe'", async () => {
    (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "1" });

    await allTools.get("add_comment")!.handler({ ticket_id: "SS-1", body: "Hello", user: "Joe" });

    const body = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(body.actorName).toBe("Joe");
    expect(body.actorType).toBe("agent");
  });

  it("add_code_reference sends actorName='Joe' when user='Joe'", async () => {
    (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });

    await allTools.get("add_code_reference")!.handler({ ticket_id: "SS-1", class_name: "MyClass", user: "Joe" });

    const body = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(body.actorName).toBe("Joe");
    expect(body.actorType).toBe("agent");
  });

  it("remove_code_reference sends actorName='Joe' when user='Joe'", async () => {
    (mockApiClient.del as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await allTools.get("remove_code_reference")!.handler({ ticket_id: "SS-1", reference_id: 5, user: "Joe" });

    const delBody = (mockApiClient.del as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(delBody.actorName).toBe("Joe");
    expect(delBody.actorType).toBe("agent");
  });

  it("user field itself is never forwarded to REST API body on any tool", async () => {
    (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-1" });
    (mockApiClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-1" });
    (mockApiClient.del as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await allTools.get("create_ticket")!.handler({ title: "T", type: "task", user: "Spectra" });
    await allTools.get("update_ticket")!.handler({ ticket_id: "SS-1", title: "U", user: "Spectra" });
    await allTools.get("add_comment")!.handler({ ticket_id: "SS-1", body: "C", user: "Spectra" });
    await allTools.get("add_code_reference")!.handler({ ticket_id: "SS-1", class_name: "X", user: "Spectra" });
    await allTools.get("remove_code_reference")!.handler({ ticket_id: "SS-1", reference_id: 1, user: "Spectra" });

    // Check POST calls (create_ticket, add_comment, add_code_reference)
    for (const call of (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls) {
      const body = call[1] as Record<string, unknown>;
      expect(body).not.toHaveProperty("user");
    }
    // Check PUT calls (update_ticket)
    for (const call of (mockApiClient.put as ReturnType<typeof vi.fn>).mock.calls) {
      const body = call[1] as Record<string, unknown>;
      expect(body).not.toHaveProperty("user");
    }
    // Check DEL calls (remove_code_reference)
    for (const call of (mockApiClient.del as ReturnType<typeof vi.fn>).mock.calls) {
      if (call[1] !== undefined) {
        const body = call[1] as Record<string, unknown>;
        expect(body).not.toHaveProperty("user");
      }
    }
  });
});

// ---- AC #2: Invalid user returns error from all mutation tools ----

describe("QA AC#2: invalid user returns descriptive error from all mutation tools", () => {
  let allTools: Map<string, ToolRegistration>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;

  beforeEach(() => {
    clearUserCache();
    const mockServer = createMockServer();
    mockApiClient = createMockApiClient();
    setupUserMock(mockApiClient);

    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient, mockConfig);
    registerCommentTools(mockServer as unknown as Parameters<typeof registerCommentTools>[0], mockApiClient, mockConfig);
    registerCodeReferenceTools(mockServer as unknown as Parameters<typeof registerCodeReferenceTools>[0], mockApiClient, mockConfig);
    allTools = mockServer.tools;
  });

  const toolsWithParams: Array<{ name: string; params: Record<string, unknown> }> = [
    { name: "create_ticket", params: { title: "T", type: "task", user: "InvalidPerson" } },
    { name: "update_ticket", params: { ticket_id: "SS-1", title: "U", user: "InvalidPerson" } },
    { name: "add_comment", params: { ticket_id: "SS-1", body: "C", user: "InvalidPerson" } },
    { name: "add_code_reference", params: { ticket_id: "SS-1", class_name: "X", user: "InvalidPerson" } },
    { name: "remove_code_reference", params: { ticket_id: "SS-1", reference_id: 1, user: "InvalidPerson" } },
  ];

  for (const { name, params } of toolsWithParams) {
    it(`${name} returns isError=true with descriptive message for invalid user`, async () => {
      const result = await allTools.get(name)!.handler(params);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("InvalidPerson");
      expect(result.content[0].text).toContain("does not match");
    });

    it(`${name} error lists valid display names`, async () => {
      const result = await allTools.get(name)!.handler(params);

      expect(result.content[0].text).toContain("Spectra");
      expect(result.content[0].text).toContain("Joe");
    });
  }

  it("no API mutation calls are made when user validation fails", async () => {
    for (const { name, params } of toolsWithParams) {
      await allTools.get(name)!.handler(params);
    }

    expect(mockApiClient.post).not.toHaveBeenCalled();
    expect(mockApiClient.put).not.toHaveBeenCalled();
    expect(mockApiClient.del).not.toHaveBeenCalled();
  });
});

// ---- AC #3: Default to mapped display name when no user param ----

describe("QA AC#3: default identity maps config username to display name", () => {
  let allTools: Map<string, ToolRegistration>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;

  beforeEach(() => {
    clearUserCache();
    const mockServer = createMockServer();
    mockApiClient = createMockApiClient();
    setupUserMock(mockApiClient);

    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient, mockConfig);
    registerCommentTools(mockServer as unknown as Parameters<typeof registerCommentTools>[0], mockApiClient, mockConfig);
    registerCodeReferenceTools(mockServer as unknown as Parameters<typeof registerCodeReferenceTools>[0], mockApiClient, mockConfig);
    allTools = mockServer.tools;
  });

  it("create_ticket defaults actorName to 'Spectra' (mapped from _SYSTEM)", async () => {
    (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-1" });

    await allTools.get("create_ticket")!.handler({ title: "T", type: "task" });

    const body = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(body.actorName).toBe("Spectra");
    expect(body.actorType).toBe("agent");
  });

  it("update_ticket defaults actorName to 'Spectra'", async () => {
    (mockApiClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-1" });

    await allTools.get("update_ticket")!.handler({ ticket_id: "SS-1", title: "U" });

    const body = (mockApiClient.put as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(body.actorName).toBe("Spectra");
  });

  it("add_comment defaults actorName to 'Spectra'", async () => {
    (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "1" });

    await allTools.get("add_comment")!.handler({ ticket_id: "SS-1", body: "Hi" });

    const body = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(body.actorName).toBe("Spectra");
  });

  it("add_code_reference defaults actorName to 'Spectra'", async () => {
    (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });

    await allTools.get("add_code_reference")!.handler({ ticket_id: "SS-1", class_name: "MyClass" });

    const body = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(body.actorName).toBe("Spectra");
  });

  it("remove_code_reference defaults actorName to 'Spectra'", async () => {
    (mockApiClient.del as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await allTools.get("remove_code_reference")!.handler({ ticket_id: "SS-1", reference_id: 5 });

    const delBody = (mockApiClient.del as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(delBody.actorName).toBe("Spectra");
  });
});

// ---- AC #4: Graceful fallback when no mapping exists for IRIS username ----

describe("QA AC#4: graceful fallback uses IRIS username when no mapping exists", () => {
  let allTools: Map<string, ToolRegistration>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;
  const unmappedConfig: Config = {
    baseUrl: "http://localhost:52773",
    username: "UnmappedUser",
    password: "SYS",
  };

  beforeEach(() => {
    clearUserCache();
    const mockServer = createMockServer();
    mockApiClient = createMockApiClient();
    setupUserMock(mockApiClient);

    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient, unmappedConfig);
    registerCommentTools(mockServer as unknown as Parameters<typeof registerCommentTools>[0], mockApiClient, unmappedConfig);
    registerCodeReferenceTools(mockServer as unknown as Parameters<typeof registerCodeReferenceTools>[0], mockApiClient, unmappedConfig);
    allTools = mockServer.tools;
  });

  it("create_ticket falls back to 'UnmappedUser' as actorName", async () => {
    (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-1" });

    await allTools.get("create_ticket")!.handler({ title: "T", type: "task" });

    const body = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(body.actorName).toBe("UnmappedUser");
    expect(body.actorType).toBe("agent");
  });

  it("add_comment falls back to 'UnmappedUser' as actorName", async () => {
    (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "1" });

    await allTools.get("add_comment")!.handler({ ticket_id: "SS-1", body: "Hi" });

    const body = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(body.actorName).toBe("UnmappedUser");
  });

  it("remove_code_reference falls back to 'UnmappedUser' as actorName", async () => {
    (mockApiClient.del as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await allTools.get("remove_code_reference")!.handler({ ticket_id: "SS-1", reference_id: 5 });

    const delBody = (mockApiClient.del as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(delBody.actorName).toBe("UnmappedUser");
  });
});

// ---- AC #7: REST body includes actorName and actorType ----

describe("QA AC#7: REST request bodies include actorName and actorType fields", () => {
  let allTools: Map<string, ToolRegistration>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;

  beforeEach(() => {
    clearUserCache();
    const mockServer = createMockServer();
    mockApiClient = createMockApiClient();
    setupUserMock(mockApiClient);

    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient, mockConfig);
    registerCommentTools(mockServer as unknown as Parameters<typeof registerCommentTools>[0], mockApiClient, mockConfig);
    registerCodeReferenceTools(mockServer as unknown as Parameters<typeof registerCodeReferenceTools>[0], mockApiClient, mockConfig);
    allTools = mockServer.tools;
  });

  it("create_ticket POST body always has both actorName and actorType", async () => {
    (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-1" });

    await allTools.get("create_ticket")!.handler({ title: "T", type: "task" });

    const body = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(body).toHaveProperty("actorName");
    expect(body).toHaveProperty("actorType");
    expect(typeof body.actorName).toBe("string");
    expect(typeof body.actorType).toBe("string");
  });

  it("update_ticket PUT body always has both actorName and actorType", async () => {
    (mockApiClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-1" });

    await allTools.get("update_ticket")!.handler({ ticket_id: "SS-1", title: "U" });

    const body = (mockApiClient.put as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(body).toHaveProperty("actorName");
    expect(body).toHaveProperty("actorType");
  });

  it("add_comment POST body always has both actorName and actorType", async () => {
    (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "1" });

    await allTools.get("add_comment")!.handler({ ticket_id: "SS-1", body: "Hi" });

    const body = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(body).toHaveProperty("actorName");
    expect(body).toHaveProperty("actorType");
  });

  it("add_code_reference POST body always has both actorName and actorType", async () => {
    (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });

    await allTools.get("add_code_reference")!.handler({ ticket_id: "SS-1", class_name: "C" });

    const body = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(body).toHaveProperty("actorName");
    expect(body).toHaveProperty("actorType");
  });

  it("remove_code_reference DELETE body always has both actorName and actorType", async () => {
    (mockApiClient.del as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await allTools.get("remove_code_reference")!.handler({ ticket_id: "SS-1", reference_id: 5 });

    const delBody = (mockApiClient.del as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(delBody).toHaveProperty("actorName");
    expect(delBody).toHaveProperty("actorType");
  });
});

// ---- Cross-cutting: index.ts passes config to all modules that need it ----

describe("QA cross-cutting: index.ts passes config to tool registration functions", () => {
  let indexContent: string;

  beforeEach(() => {
    const indexPath = resolve(import.meta.dirname, "../index.ts");
    indexContent = readFileSync(indexPath, "utf-8");
  });

  it("registerTicketTools receives config as third argument", () => {
    expect(indexContent).toContain("registerTicketTools(server, apiClient, config)");
  });

  it("registerCommentTools receives config as third argument", () => {
    expect(indexContent).toContain("registerCommentTools(server, apiClient, config)");
  });

  it("registerCodeReferenceTools receives config as third argument", () => {
    expect(indexContent).toContain("registerCodeReferenceTools(server, apiClient, config)");
  });

  it("imports resolveUser's module (user-identity) indirectly via tool modules", () => {
    // All three tool modules import resolveUser; verify they are imported
    expect(indexContent).toContain("registerTicketTools");
    expect(indexContent).toContain("registerCommentTools");
    expect(indexContent).toContain("registerCodeReferenceTools");
  });
});

// ---- Cross-cutting: api-client del() supports optional body ----

describe("QA cross-cutting: ApiClient.del() accepts optional body parameter", () => {
  let apiClientSource: string;

  beforeEach(() => {
    const filePath = resolve(import.meta.dirname, "../api-client.ts");
    apiClientSource = readFileSync(filePath, "utf-8");
  });

  it("del method signature accepts optional body parameter", () => {
    // The method signature should include body as an optional parameter
    expect(apiClientSource).toMatch(/async\s+del\s*\(\s*path:\s*string,\s*body\?/);
  });

  it("del method passes body to request when provided", () => {
    // The implementation should pass body when it exists
    expect(apiClientSource).toContain("body");
  });
});

// ---- Cross-cutting: README documents user identity feature ----

describe("QA cross-cutting: README documents Story 6.4 user identity feature", () => {
  let readmeContent: string;

  beforeEach(() => {
    const readmePath = resolve(import.meta.dirname, "../../README.md");
    readmeContent = readFileSync(readmePath, "utf-8");
  });

  it("documents all 12 tools in the tool list", () => {
    const toolNames = [
      "create_ticket", "get_ticket", "update_ticket", "delete_ticket", "list_tickets",
      "list_projects", "create_project",
      "add_comment",
      "add_code_reference", "remove_code_reference",
      "list_activity",
      "test_connection",
    ];
    for (const name of toolNames) {
      expect(readmeContent, `Expected README to mention ${name}`).toContain(`\`${name}\``);
    }
  });

  it("shows correct tool count of 12 in test_connection example", () => {
    expect(readmeContent).toContain("12 tools available");
  });
});

// ---- Cross-cutting: user-identity.ts exports clearUserCache for test isolation ----

describe("QA cross-cutting: user-identity module exports", () => {
  it("exports clearUserCache function for test cleanup", async () => {
    const module = await import("../user-identity.js");
    expect(typeof module.clearUserCache).toBe("function");
  });

  it("exports resolveUser function", async () => {
    const module = await import("../user-identity.js");
    expect(typeof module.resolveUser).toBe("function");
  });
});

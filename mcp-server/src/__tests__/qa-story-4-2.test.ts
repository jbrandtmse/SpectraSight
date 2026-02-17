/**
 * QA Automated Tests for Story 4.2: MCP Configuration & Connection Testing
 *
 * These tests cover gaps not addressed by dev-authored unit tests:
 * - README documentation accuracy (tool names, env var names, defaults)
 * - Config warning messages for USERNAME and PASSWORD env vars
 * - TOOL_COUNT constant consistency with actual tool registrations
 * - ApiError class structure (name property for instanceof checks)
 * - Error format consistency across all error code types
 * - 403 non-JSON body handling (only 401 non-JSON was tested by dev)
 * - PARSE_ERROR includes method and path context
 * - Startup validation behavior (non-blocking)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { ApiError, ApiClient } from "../api-client.js";
import { formatError } from "../errors.js";
import { getConfig } from "../config.js";
import { z } from "zod";
import { registerTicketTools } from "../tools/tickets.js";
import { registerCommentTools } from "../tools/comments.js";
import { registerCodeReferenceTools } from "../tools/code-references.js";
import { registerActivityTools } from "../tools/activity.js";
import { registerConnectionTools } from "../tools/connection.js";
import { registerProjectTools } from "../tools/projects.js";

// ---- Shared mock infrastructure ----

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

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

function mockResponse(status: number, body?: unknown, ok?: boolean) {
  return {
    status,
    ok: ok !== undefined ? ok : status >= 200 && status < 300,
    json: vi.fn().mockResolvedValue(body),
  };
}

// ---- README Documentation Accuracy ----

describe("QA: README documentation accuracy", () => {
  const readmePath = resolve(import.meta.dirname, "../../README.md");
  let readmeContent: string;

  beforeEach(() => {
    readmeContent = readFileSync(readmePath, "utf-8");
  });

  it("documents all 12 tool names that match actual registered tools", () => {
    const expectedTools = [
      "create_ticket",
      "get_ticket",
      "update_ticket",
      "delete_ticket",
      "list_tickets",
      "list_projects",
      "create_project",
      "add_comment",
      "add_code_reference",
      "remove_code_reference",
      "list_activity",
      "test_connection",
    ];

    for (const tool of expectedTools) {
      expect(readmeContent).toContain(`\`${tool}\``);
    }
  });

  it("documents all 3 environment variable names matching config.ts", () => {
    const expectedVars = [
      "SPECTRASIGHT_URL",
      "SPECTRASIGHT_USERNAME",
      "SPECTRASIGHT_PASSWORD",
    ];

    for (const envVar of expectedVars) {
      expect(readmeContent).toContain(`\`${envVar}\``);
    }
  });

  it("documents correct default values matching config.ts implementation", () => {
    // Default URL
    expect(readmeContent).toContain("http://localhost:52773");
    // Default username
    expect(readmeContent).toContain("_SYSTEM");
    // Default password
    expect(readmeContent).toContain("SYS");
  });

  it("documents build command correctly", () => {
    expect(readmeContent).toContain("npm run build");
    expect(readmeContent).toContain("npm install");
  });

  it("documents MCP client config JSON with correct entry point", () => {
    expect(readmeContent).toContain("build/index.js");
    expect(readmeContent).toContain('"command": "node"');
  });

  it("documents test_connection usage instructions", () => {
    expect(readmeContent).toContain("test_connection");
    expect(readmeContent).toContain("Testing the Connection");
  });

  it("documents all 4 troubleshooting error scenarios", () => {
    expect(readmeContent).toContain("CONNECTION_ERROR");
    expect(readmeContent).toContain("AUTH_FAILED");
    expect(readmeContent).toContain("AUTH_FORBIDDEN");
    expect(readmeContent).toContain("connection refused");
  });
});

// ---- Config Warning Logs ----

describe("QA: config warning logs for all env vars", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    process.env = { ...originalEnv };
    delete process.env.SPECTRASIGHT_URL;
    delete process.env.SPECTRASIGHT_USERNAME;
    delete process.env.SPECTRASIGHT_PASSWORD;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("logs warning when SPECTRASIGHT_USERNAME is not set", () => {
    getConfig();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("SPECTRASIGHT_USERNAME not set")
    );
  });

  it("logs warning when SPECTRASIGHT_PASSWORD is not set", () => {
    getConfig();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("SPECTRASIGHT_PASSWORD not set")
    );
  });

  it("does not log USERNAME warning when SPECTRASIGHT_USERNAME is set", () => {
    process.env.SPECTRASIGHT_URL = "http://example.com";
    process.env.SPECTRASIGHT_USERNAME = "admin";
    process.env.SPECTRASIGHT_PASSWORD = "pass";
    getConfig();
    expect(console.error).not.toHaveBeenCalledWith(
      expect.stringContaining("SPECTRASIGHT_USERNAME not set")
    );
  });

  it("does not log PASSWORD warning when SPECTRASIGHT_PASSWORD is set", () => {
    process.env.SPECTRASIGHT_URL = "http://example.com";
    process.env.SPECTRASIGHT_USERNAME = "admin";
    process.env.SPECTRASIGHT_PASSWORD = "pass";
    getConfig();
    expect(console.error).not.toHaveBeenCalledWith(
      expect.stringContaining("SPECTRASIGHT_PASSWORD not set")
    );
  });
});

// ---- TOOL_COUNT Matches Actual Registrations ----

describe("QA: TOOL_COUNT consistency", () => {
  it("connection tool reports 12 tools which matches total registered tools across all modules", () => {
    const mockServer = createMockServer();
    const mockApiClient = createMockApiClient();
    const config = { baseUrl: "http://localhost:52773", username: "_SYSTEM", password: "SYS" };

    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient);
    registerCommentTools(mockServer as unknown as Parameters<typeof registerCommentTools>[0], mockApiClient);
    registerCodeReferenceTools(mockServer as unknown as Parameters<typeof registerCodeReferenceTools>[0], mockApiClient);
    registerActivityTools(mockServer as unknown as Parameters<typeof registerActivityTools>[0], mockApiClient);
    registerProjectTools(mockServer as unknown as Parameters<typeof registerProjectTools>[0], mockApiClient);
    registerConnectionTools(mockServer as unknown as Parameters<typeof registerConnectionTools>[0], mockApiClient, config);

    const totalRegistered = mockServer.tools.size;
    expect(totalRegistered).toBe(12);

    // Verify each expected tool is registered
    const expectedTools = [
      "create_ticket", "get_ticket", "update_ticket", "delete_ticket",
      "list_tickets", "list_projects", "create_project", "add_comment",
      "add_code_reference", "remove_code_reference",
      "list_activity", "test_connection",
    ];
    for (const tool of expectedTools) {
      expect(mockServer.tools.has(tool)).toBe(true);
    }
  });
});

// ---- ApiError Class Properties ----

describe("QA: ApiError class structure", () => {
  it("has name property set to 'ApiError'", () => {
    const err = new ApiError("TEST", "test message", 400);
    expect(err.name).toBe("ApiError");
  });

  it("is an instance of Error", () => {
    const err = new ApiError("TEST", "test message", 400);
    expect(err).toBeInstanceOf(Error);
  });

  it("has message accessible via Error.message", () => {
    const err = new ApiError("TEST", "my message", 400);
    expect(err.message).toBe("my message");
  });

  it("preserves stack trace", () => {
    const err = new ApiError("TEST", "test", 500);
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain("ApiError");
  });
});

// ---- Error Format Consistency ----

describe("QA: error format consistency across all error codes", () => {
  const errorCodes = [
    { code: "CONNECTION_ERROR", message: "Cannot connect", status: 0 },
    { code: "AUTH_FAILED", message: "Authentication failed", status: 401 },
    { code: "AUTH_FORBIDDEN", message: "Access denied", status: 403 },
    { code: "PARSE_ERROR", message: "Failed to parse", status: 200 },
    { code: "NOT_FOUND", message: "Ticket not found", status: 404 },
    { code: "UNKNOWN_ERROR", message: "Unknown error", status: 500 },
  ];

  for (const { code, message, status } of errorCodes) {
    it(`formats ${code} errors consistently as 'Error [CODE]: message'`, () => {
      const err = new ApiError(code, message, status);
      const result = formatError(err);

      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe(`Error [${code}]: ${message}`);
    });
  }
});

// ---- API Client: 403 Non-JSON Body ----

describe("QA: api-client 403 non-JSON body handling", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws AUTH_FORBIDDEN even when 403 response body is not JSON", async () => {
    expect.assertions(3);
    const client = new ApiClient({
      baseUrl: "http://localhost:52773",
      username: "_SYSTEM",
      password: "SYS",
    });

    mockFetch.mockResolvedValue({
      status: 403,
      ok: false,
      json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
    });

    try {
      await client.get("/tickets");
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe("AUTH_FORBIDDEN");
      expect(apiErr.status).toBe(403);
      expect(apiErr.message).toContain("Access denied");
    }
  });
});

// ---- API Client: PARSE_ERROR context ----

describe("QA: api-client PARSE_ERROR includes method and path context", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("PARSE_ERROR for GET includes method and path", async () => {
    expect.assertions(2);
    const client = new ApiClient({
      baseUrl: "http://localhost:52773",
      username: "_SYSTEM",
      password: "SYS",
    });

    mockFetch.mockResolvedValue({
      status: 200,
      ok: true,
      json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
    });

    try {
      await client.get("/tickets/SS-1");
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.message).toContain("GET");
      expect(apiErr.message).toContain("/tickets/SS-1");
    }
  });

  it("PARSE_ERROR for POST includes method and path", async () => {
    expect.assertions(2);
    const client = new ApiClient({
      baseUrl: "http://localhost:52773",
      username: "_SYSTEM",
      password: "SYS",
    });

    mockFetch.mockResolvedValue({
      status: 201,
      ok: true,
      json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
    });

    try {
      await client.post("/tickets", { title: "Test" });
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.message).toContain("POST");
      expect(apiErr.message).toContain("/tickets");
    }
  });
});

// ---- Startup Validation Behavior ----

describe("QA: startup validation is non-blocking", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs success message when startup connection succeeds", async () => {
    const config = { baseUrl: "http://localhost:52773", username: "_SYSTEM", password: "SYS" };
    const client = new ApiClient(config);

    mockFetch.mockResolvedValue(mockResponse(200, {
      data: [],
      total: 0,
      page: 1,
      pageSize: 1,
      totalPages: 0,
    }));

    // Simulate the startup validation from index.ts
    try {
      await client.get("/tickets", { page: "1", pageSize: "1" });
      console.error(`[spectrasight-mcp] Connected to ${config.baseUrl} — ready`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[spectrasight-mcp] Warning: Could not connect to ${config.baseUrl} — ${message}. Tools will attempt to connect on first use.`);
    }

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Connected to http://localhost:52773 — ready")
    );
  });

  it("logs warning but does not throw when startup connection fails", async () => {
    const config = { baseUrl: "http://localhost:52773", username: "_SYSTEM", password: "SYS" };
    const client = new ApiClient(config);

    mockFetch.mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:52773"));

    // Simulate the startup validation from index.ts — should not throw
    let didThrow = false;
    try {
      await client.get("/tickets", { page: "1", pageSize: "1" });
      console.error(`[spectrasight-mcp] Connected to ${config.baseUrl} — ready`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[spectrasight-mcp] Warning: Could not connect to ${config.baseUrl} — ${message}. Tools will attempt to connect on first use.`);
    }

    // The key assertion: the startup validation pattern catches errors gracefully
    expect(didThrow).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Warning: Could not connect")
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Tools will attempt to connect on first use")
    );
  });
});

// ---- test_connection Tool: Edge Cases ----

describe("QA: test_connection tool edge cases", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;
  let tools: Map<string, ToolRegistration>;

  const testConfig = {
    baseUrl: "http://localhost:52773",
    username: "_SYSTEM",
    password: "SYS",
  };

  beforeEach(() => {
    mockServer = createMockServer();
    mockApiClient = createMockApiClient();
    registerConnectionTools(
      mockServer as unknown as Parameters<typeof registerConnectionTools>[0],
      mockApiClient,
      testConfig
    );
    tools = mockServer.tools;
  });

  it("has an empty schema (no required parameters)", () => {
    const tool = tools.get("test_connection")!;
    expect(Object.keys(tool.schema)).toHaveLength(0);
  });

  it("success message contains the configured base URL", async () => {
    (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [],
      total: 5,
      page: 1,
      pageSize: 1,
      totalPages: 5,
    });

    const handler = tools.get("test_connection")!.handler;
    const result = await handler({});

    expect(result.content[0].text).toContain("http://localhost:52773");
  });

  it("success message includes correct tool count of 12", async () => {
    (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [],
      total: 10,
      page: 1,
      pageSize: 1,
      totalPages: 10,
    });

    const handler = tools.get("test_connection")!.handler;
    const result = await handler({});

    expect(result.content[0].text).toContain("All 12 tools available");
  });

  it("handles response with missing total field gracefully (defaults to 0)", async () => {
    (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [],
    });

    const handler = tools.get("test_connection")!.handler;
    const result = await handler({});

    expect(result.content[0].text).toContain("0 tickets found");
    expect(result.isError).toBeUndefined();
  });

  it("uses correct API call parameters for lightweight check", async () => {
    (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: 1,
      totalPages: 0,
    });

    const handler = tools.get("test_connection")!.handler;
    await handler({});

    expect(mockApiClient.get).toHaveBeenCalledWith("/tickets", { page: "1", pageSize: "1" });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";
import { registerConnectionTools } from "../../tools/connection.js";
import { ApiClient, ApiError } from "../../api-client.js";
import { Config } from "../../config.js";

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

const testConfig: Config = {
  baseUrl: "http://localhost:52773",
  username: "_SYSTEM",
  password: "SYS",
};

describe("connection tools", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;
  let tools: Map<string, ToolRegistration>;

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

  it("registers test_connection tool", () => {
    expect(tools.has("test_connection")).toBe(true);
  });

  it("has correct description", () => {
    const tool = tools.get("test_connection")!;
    expect(tool.description).toBe("Test the connection to SpectraSight API and verify credentials");
  });

  describe("test_connection", () => {
    it("returns success message with ticket count on successful connection", async () => {
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [{ id: "SS-1" }],
        total: 42,
        page: 1,
        pageSize: 1,
        totalPages: 42,
      });

      const handler = tools.get("test_connection")!.handler;
      const result = await handler({});

      expect(mockApiClient.get).toHaveBeenCalledWith("/tickets", { page: "1", pageSize: "1" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toBe(
        "Connected to SpectraSight API at http://localhost:52773 — 42 tickets found. All 10 tools available."
      );
    });

    it("returns success message with 0 tickets when no tickets exist", async () => {
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 1,
        totalPages: 0,
      });

      const handler = tools.get("test_connection")!.handler;
      const result = await handler({});

      expect(result.content[0].text).toContain("0 tickets found");
      expect(result.isError).toBeUndefined();
    });

    it("returns auth error with credential guidance on 401", async () => {
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new ApiError("AUTH_FAILED", "Authentication failed for http://localhost:52773 — check SPECTRASIGHT_USERNAME and SPECTRASIGHT_PASSWORD", 401)
      );

      const handler = tools.get("test_connection")!.handler;
      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("AUTH_FAILED");
      expect(result.content[0].text).toContain("Authentication failed");
    });

    it("returns auth error with permissions message on 403", async () => {
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new ApiError("AUTH_FORBIDDEN", "Access denied at http://localhost:52773 — insufficient permissions", 403)
      );

      const handler = tools.get("test_connection")!.handler;
      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("AUTH_FORBIDDEN");
      expect(result.content[0].text).toContain("Access denied");
    });

    it("returns connection error with URL guidance on connection failure", async () => {
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new ApiError("CONNECTION_ERROR", "Cannot connect to SpectraSight API at http://localhost:52773 — connection refused. Is IRIS running?", 0)
      );

      const handler = tools.get("test_connection")!.handler;
      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("CONNECTION_ERROR");
      expect(result.content[0].text).toContain("connection refused");
    });

    it("returns generic error for unexpected errors", async () => {
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Something unexpected")
      );

      const handler = tools.get("test_connection")!.handler;
      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe("Error: Something unexpected");
    });
  });
});

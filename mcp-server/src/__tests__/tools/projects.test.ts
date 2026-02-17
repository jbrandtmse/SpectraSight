/**
 * QA Automated Tests for Story 5.3: Project MCP Tools
 *
 * Tests the list_projects and create_project MCP tools, including:
 * - Tool registration
 * - Correct API calls (GET /projects, POST /projects)
 * - CreateProjectSchema Zod validation (prefix regex, name length)
 * - Optional owner parameter handling
 * - Error handling via formatError
 * - JSON response formatting
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";
import { registerProjectTools } from "../../tools/projects.js";
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

describe("project tools", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;
  let tools: Map<string, ToolRegistration>;

  beforeEach(() => {
    mockServer = createMockServer();
    mockApiClient = createMockApiClient();
    registerProjectTools(mockServer as unknown as Parameters<typeof registerProjectTools>[0], mockApiClient);
    tools = mockServer.tools;
  });

  it("registers list_projects and create_project tools", () => {
    expect(tools.has("list_projects")).toBe(true);
    expect(tools.has("create_project")).toBe(true);
    expect(tools.size).toBe(2);
  });

  describe("list_projects", () => {
    it("has correct description", () => {
      const tool = tools.get("list_projects")!;
      expect(tool.description).toBe("List all projects in SpectraSight");
    });

    it("calls GET /projects with no parameters", async () => {
      const projects = [
        { id: 1, name: "SpectraSight", prefix: "SS" },
        { id: 2, name: "Data Pipeline", prefix: "DATA" },
      ];
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(projects);

      const handler = tools.get("list_projects")!.handler;
      const result = await handler({});

      expect(mockApiClient.get).toHaveBeenCalledWith("/projects");
      expect(result.isError).toBeUndefined();
    });

    it("returns projects as JSON content", async () => {
      const projects = [
        { id: 1, name: "SpectraSight", prefix: "SS", owner: "", sequenceCounter: 5, ticketCount: 5 },
      ];
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(projects);

      const handler = tools.get("list_projects")!.handler;
      const result = await handler({});

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].prefix).toBe("SS");
      expect(parsed[0].name).toBe("SpectraSight");
    });

    it("returns formatted error when API call fails", async () => {
      const { ApiError } = await import("../../api-client.js");
      (mockApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new ApiError("CONNECTION_ERROR", "Cannot connect", 0)
      );

      const handler = tools.get("list_projects")!.handler;
      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("CONNECTION_ERROR");
    });
  });

  describe("create_project", () => {
    it("has correct description", () => {
      const tool = tools.get("create_project")!;
      expect(tool.description).toBe("Create a new project in SpectraSight");
    });

    it("calls POST /projects with name and prefix", async () => {
      const created = { id: 2, name: "Data Pipeline", prefix: "DATA" };
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(created);

      const handler = tools.get("create_project")!.handler;
      const result = await handler({ name: "Data Pipeline", prefix: "DATA" });

      expect(mockApiClient.post).toHaveBeenCalledWith("/projects", {
        name: "Data Pipeline",
        prefix: "DATA",
      });
      expect(result.isError).toBeUndefined();
    });

    it("includes optional owner when provided", async () => {
      const created = { id: 3, name: "My Project", prefix: "MY", owner: "Josh" };
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(created);

      const handler = tools.get("create_project")!.handler;
      await handler({ name: "My Project", prefix: "MY", owner: "Josh" });

      expect(mockApiClient.post).toHaveBeenCalledWith("/projects", {
        name: "My Project",
        prefix: "MY",
        owner: "Josh",
      });
    });

    it("does not include owner when not provided", async () => {
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 4 });

      const handler = tools.get("create_project")!.handler;
      await handler({ name: "No Owner", prefix: "NO" });

      const callArgs = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(callArgs).not.toHaveProperty("owner");
    });

    it("returns created project as JSON content", async () => {
      const created = { id: 5, name: "Test Project", prefix: "TEST", owner: "", sequenceCounter: 0, ticketCount: 0 };
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(created);

      const handler = tools.get("create_project")!.handler;
      const result = await handler({ name: "Test Project", prefix: "TEST" });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.id).toBe(5);
      expect(parsed.prefix).toBe("TEST");
      expect(parsed.sequenceCounter).toBe(0);
    });

    it("returns formatted error when API call fails", async () => {
      const { ApiError } = await import("../../api-client.js");
      (mockApiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(
        new ApiError("BAD_REQUEST", "Duplicate prefix", 400)
      );

      const handler = tools.get("create_project")!.handler;
      const result = await handler({ name: "Dup", prefix: "SS" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("BAD_REQUEST");
      expect(result.content[0].text).toContain("Duplicate prefix");
    });
  });

  describe("Zod schema validation", () => {
    it("rejects prefix shorter than 2 characters", () => {
      const schema = tools.get("create_project")!.schema;
      const prefixSchema = schema.prefix;
      expect(prefixSchema.safeParse("A").success).toBe(false);
    });

    it("rejects prefix longer than 10 characters", () => {
      const schema = tools.get("create_project")!.schema;
      const prefixSchema = schema.prefix;
      expect(prefixSchema.safeParse("ABCDEFGHIJK").success).toBe(false);
    });

    it("rejects lowercase prefix", () => {
      const schema = tools.get("create_project")!.schema;
      const prefixSchema = schema.prefix;
      expect(prefixSchema.safeParse("data").success).toBe(false);
    });

    it("rejects prefix with numbers", () => {
      const schema = tools.get("create_project")!.schema;
      const prefixSchema = schema.prefix;
      expect(prefixSchema.safeParse("AB12").success).toBe(false);
    });

    it("accepts valid 2-letter uppercase prefix", () => {
      const schema = tools.get("create_project")!.schema;
      const prefixSchema = schema.prefix;
      expect(prefixSchema.safeParse("SS").success).toBe(true);
    });

    it("accepts valid 10-letter uppercase prefix", () => {
      const schema = tools.get("create_project")!.schema;
      const prefixSchema = schema.prefix;
      expect(prefixSchema.safeParse("ABCDEFGHIJ").success).toBe(true);
    });

    it("rejects empty name", () => {
      const schema = tools.get("create_project")!.schema;
      const nameSchema = schema.name;
      expect(nameSchema.safeParse("").success).toBe(false);
    });

    it("rejects name longer than 255 characters", () => {
      const schema = tools.get("create_project")!.schema;
      const nameSchema = schema.name;
      expect(nameSchema.safeParse("A".repeat(256)).success).toBe(false);
    });

    it("accepts valid name", () => {
      const schema = tools.get("create_project")!.schema;
      const nameSchema = schema.name;
      expect(nameSchema.safeParse("My Project").success).toBe(true);
    });

    it("owner is optional", () => {
      const schema = tools.get("create_project")!.schema;
      const ownerSchema = schema.owner;
      expect(ownerSchema.safeParse(undefined).success).toBe(true);
      expect(ownerSchema.safeParse("Josh").success).toBe(true);
    });
  });
});

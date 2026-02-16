/**
 * QA Automated Tests for Story 4.3: MCP Full Parity — Type-Specific Fields & Tools
 *
 * These tests verify all 10 acceptance criteria at the QA level, covering gaps
 * not addressed by dev-authored unit tests:
 *
 * - Schema completeness: all type-specific fields exist in CreateTicketSchema and UpdateTicketSchema
 * - Schema types: number fields are z.number(), severity is z.enum() with correct values
 * - Tool descriptions match the story spec
 * - update_ticket comprehensive camelCase mapping for ALL type-specific fields (dev spot-checks a subset)
 * - update_ticket error message includes all new field names
 * - Omitted optional fields are NOT sent to API (no undefined values leak)
 * - add_code_reference: class_name required, method_name optional schema validation
 * - remove_code_reference: reference_id is a required number
 * - list_activity: correct tool description and schema
 * - README documentation accuracy for new tools and updated descriptions
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { z } from "zod";
import { registerTicketTools } from "../tools/tickets.js";
import { registerCodeReferenceTools } from "../tools/code-references.js";
import { registerActivityTools } from "../tools/activity.js";
import { registerConnectionTools } from "../tools/connection.js";
import { registerCommentTools } from "../tools/comments.js";
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

// ---- AC #1: Bug-specific fields on create_ticket ----

describe("QA AC#1: create_ticket accepts bug-specific fields", () => {
  let tools: Map<string, ToolRegistration>;

  beforeEach(() => {
    const mockServer = createMockServer();
    const mockApiClient = createMockApiClient();
    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient);
    tools = mockServer.tools;
  });

  it("CreateTicketSchema includes severity as an enum with Low/Medium/High/Critical values", () => {
    const schema = tools.get("create_ticket")!.schema;
    expect(schema.severity).toBeDefined();
    // Verify it accepts valid enum values
    const severitySchema = schema.severity as z.ZodOptional<z.ZodEnum<[string, ...string[]]>>;
    expect(severitySchema.safeParse("Low").success).toBe(true);
    expect(severitySchema.safeParse("Medium").success).toBe(true);
    expect(severitySchema.safeParse("High").success).toBe(true);
    expect(severitySchema.safeParse("Critical").success).toBe(true);
    // Invalid value should fail
    expect(severitySchema.safeParse("Extreme").success).toBe(false);
  });

  it("CreateTicketSchema includes steps_to_reproduce as an optional string", () => {
    const schema = tools.get("create_ticket")!.schema;
    expect(schema.steps_to_reproduce).toBeDefined();
    const field = schema.steps_to_reproduce as z.ZodOptional<z.ZodString>;
    expect(field.safeParse("1. Open app\n2. Click button").success).toBe(true);
    expect(field.safeParse(undefined).success).toBe(true);
  });

  it("CreateTicketSchema includes expected_behavior as an optional string", () => {
    const schema = tools.get("create_ticket")!.schema;
    expect(schema.expected_behavior).toBeDefined();
    const field = schema.expected_behavior as z.ZodOptional<z.ZodString>;
    expect(field.safeParse("Page loads correctly").success).toBe(true);
    expect(field.safeParse(undefined).success).toBe(true);
  });

  it("CreateTicketSchema includes actual_behavior as an optional string", () => {
    const schema = tools.get("create_ticket")!.schema;
    expect(schema.actual_behavior).toBeDefined();
    const field = schema.actual_behavior as z.ZodOptional<z.ZodString>;
    expect(field.safeParse("App crashes").success).toBe(true);
    expect(field.safeParse(undefined).success).toBe(true);
  });
});

// ---- AC #2: Task-specific fields on create_ticket ----

describe("QA AC#2: create_ticket accepts task-specific fields", () => {
  let tools: Map<string, ToolRegistration>;

  beforeEach(() => {
    const mockServer = createMockServer();
    const mockApiClient = createMockApiClient();
    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient);
    tools = mockServer.tools;
  });

  it("CreateTicketSchema includes estimated_hours as an optional number", () => {
    const schema = tools.get("create_ticket")!.schema;
    expect(schema.estimated_hours).toBeDefined();
    const field = schema.estimated_hours as z.ZodOptional<z.ZodNumber>;
    expect(field.safeParse(4).success).toBe(true);
    expect(field.safeParse(undefined).success).toBe(true);
    // String should fail — must be a number
    expect(field.safeParse("4").success).toBe(false);
  });

  it("CreateTicketSchema includes actual_hours as an optional number", () => {
    const schema = tools.get("create_ticket")!.schema;
    expect(schema.actual_hours).toBeDefined();
    const field = schema.actual_hours as z.ZodOptional<z.ZodNumber>;
    expect(field.safeParse(2.5).success).toBe(true);
    expect(field.safeParse(undefined).success).toBe(true);
    expect(field.safeParse("2.5").success).toBe(false);
  });
});

// ---- AC #3: Story-specific fields on create_ticket ----

describe("QA AC#3: create_ticket accepts story-specific fields", () => {
  let tools: Map<string, ToolRegistration>;

  beforeEach(() => {
    const mockServer = createMockServer();
    const mockApiClient = createMockApiClient();
    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient);
    tools = mockServer.tools;
  });

  it("CreateTicketSchema includes story_points as an optional number", () => {
    const schema = tools.get("create_ticket")!.schema;
    expect(schema.story_points).toBeDefined();
    const field = schema.story_points as z.ZodOptional<z.ZodNumber>;
    expect(field.safeParse(5).success).toBe(true);
    expect(field.safeParse(undefined).success).toBe(true);
    expect(field.safeParse("5").success).toBe(false);
  });

  it("CreateTicketSchema includes acceptance_criteria as an optional string", () => {
    const schema = tools.get("create_ticket")!.schema;
    expect(schema.acceptance_criteria).toBeDefined();
    const field = schema.acceptance_criteria as z.ZodOptional<z.ZodString>;
    expect(field.safeParse("User can log in").success).toBe(true);
    expect(field.safeParse(undefined).success).toBe(true);
  });
});

// ---- AC #4: Epic-specific fields on create_ticket ----

describe("QA AC#4: create_ticket accepts epic-specific fields", () => {
  let tools: Map<string, ToolRegistration>;

  beforeEach(() => {
    const mockServer = createMockServer();
    const mockApiClient = createMockApiClient();
    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient);
    tools = mockServer.tools;
  });

  it("CreateTicketSchema includes start_date as an optional string", () => {
    const schema = tools.get("create_ticket")!.schema;
    expect(schema.start_date).toBeDefined();
    const field = schema.start_date as z.ZodOptional<z.ZodString>;
    expect(field.safeParse("2026-02-01").success).toBe(true);
    expect(field.safeParse(undefined).success).toBe(true);
  });

  it("CreateTicketSchema includes target_date as an optional string", () => {
    const schema = tools.get("create_ticket")!.schema;
    expect(schema.target_date).toBeDefined();
    const field = schema.target_date as z.ZodOptional<z.ZodString>;
    expect(field.safeParse("2026-03-15").success).toBe(true);
    expect(field.safeParse(undefined).success).toBe(true);
  });
});

// ---- AC #5: update_ticket type-specific fields with comprehensive mapping ----

describe("QA AC#5: update_ticket maps ALL type-specific fields to camelCase", () => {
  let tools: Map<string, ToolRegistration>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;

  beforeEach(() => {
    const mockServer = createMockServer();
    mockApiClient = createMockApiClient();
    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient);
    tools = mockServer.tools;
  });

  it("UpdateTicketSchema includes all 10 type-specific fields", () => {
    const schema = tools.get("update_ticket")!.schema;
    const typeSpecificFields = [
      "severity", "steps_to_reproduce", "expected_behavior", "actual_behavior",
      "estimated_hours", "actual_hours",
      "story_points", "acceptance_criteria",
      "start_date", "target_date",
    ];
    for (const field of typeSpecificFields) {
      expect(schema[field], `Expected field '${field}' in UpdateTicketSchema`).toBeDefined();
    }
  });

  it("maps all bug-specific fields to camelCase in update body", async () => {
    (mockApiClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-1" });

    const handler = tools.get("update_ticket")!.handler;
    await handler({
      ticket_id: "SS-1",
      severity: "High",
      steps_to_reproduce: "Open the app",
      expected_behavior: "Form loads",
      actual_behavior: "Crash occurs",
    });

    const callArgs = (mockApiClient.put as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.severity).toBe("High");
    expect(callArgs.stepsToReproduce).toBe("Open the app");
    expect(callArgs.expectedBehavior).toBe("Form loads");
    expect(callArgs.actualBehavior).toBe("Crash occurs");
    // Snake_case keys must NOT appear in body
    expect(callArgs).not.toHaveProperty("steps_to_reproduce");
    expect(callArgs).not.toHaveProperty("expected_behavior");
    expect(callArgs).not.toHaveProperty("actual_behavior");
  });

  it("maps all task-specific fields to camelCase in update body", async () => {
    (mockApiClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-2" });

    const handler = tools.get("update_ticket")!.handler;
    await handler({
      ticket_id: "SS-2",
      estimated_hours: 10,
      actual_hours: 6,
    });

    const callArgs = (mockApiClient.put as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.estimatedHours).toBe(10);
    expect(callArgs.actualHours).toBe(6);
    expect(callArgs).not.toHaveProperty("estimated_hours");
    expect(callArgs).not.toHaveProperty("actual_hours");
  });

  it("maps all story-specific fields to camelCase in update body", async () => {
    (mockApiClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-3" });

    const handler = tools.get("update_ticket")!.handler;
    await handler({
      ticket_id: "SS-3",
      story_points: 8,
      acceptance_criteria: "User can register",
    });

    const callArgs = (mockApiClient.put as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.storyPoints).toBe(8);
    expect(callArgs.acceptanceCriteria).toBe("User can register");
    expect(callArgs).not.toHaveProperty("story_points");
    expect(callArgs).not.toHaveProperty("acceptance_criteria");
  });

  it("maps all epic-specific fields to camelCase in update body", async () => {
    (mockApiClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-4" });

    const handler = tools.get("update_ticket")!.handler;
    await handler({
      ticket_id: "SS-4",
      start_date: "2026-04-01",
      target_date: "2026-06-30",
    });

    const callArgs = (mockApiClient.put as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.startDate).toBe("2026-04-01");
    expect(callArgs.targetDate).toBe("2026-06-30");
    expect(callArgs).not.toHaveProperty("start_date");
    expect(callArgs).not.toHaveProperty("target_date");
  });

  it("does not send omitted optional type-specific fields to API", async () => {
    (mockApiClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-5" });

    const handler = tools.get("update_ticket")!.handler;
    await handler({
      ticket_id: "SS-5",
      severity: "Low",
    });

    const callArgs = (mockApiClient.put as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.severity).toBe("Low");
    // All other type-specific fields should NOT be present
    expect(callArgs).not.toHaveProperty("stepsToReproduce");
    expect(callArgs).not.toHaveProperty("expectedBehavior");
    expect(callArgs).not.toHaveProperty("actualBehavior");
    expect(callArgs).not.toHaveProperty("estimatedHours");
    expect(callArgs).not.toHaveProperty("actualHours");
    expect(callArgs).not.toHaveProperty("storyPoints");
    expect(callArgs).not.toHaveProperty("acceptanceCriteria");
    expect(callArgs).not.toHaveProperty("startDate");
    expect(callArgs).not.toHaveProperty("targetDate");
    expect(callArgs).not.toHaveProperty("parentId");
  });
});

// ---- AC #6: update_ticket with parent_id ----

describe("QA AC#6: update_ticket accepts parent_id and maps to parentId", () => {
  let tools: Map<string, ToolRegistration>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;

  beforeEach(() => {
    const mockServer = createMockServer();
    mockApiClient = createMockApiClient();
    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient);
    tools = mockServer.tools;
  });

  it("UpdateTicketSchema includes parent_id with SS-pattern validation", () => {
    const schema = tools.get("update_ticket")!.schema;
    expect(schema.parent_id).toBeDefined();
    const field = schema.parent_id;
    expect(field.safeParse("SS-1").success).toBe(true);
    expect(field.safeParse("invalid").success).toBe(false);
    expect(field.safeParse(undefined).success).toBe(true); // optional
  });

  it("error message for empty update includes parent_id in field list", async () => {
    const handler = tools.get("update_ticket")!.handler;
    const result = await handler({ ticket_id: "SS-1" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("parent_id");
  });

  it("error message for empty update includes all type-specific field names", async () => {
    const handler = tools.get("update_ticket")!.handler;
    const result = await handler({ ticket_id: "SS-1" });

    const errorText = result.content[0].text;
    const expectedFieldNames = [
      "severity", "steps_to_reproduce", "expected_behavior", "actual_behavior",
      "estimated_hours", "actual_hours", "story_points", "acceptance_criteria",
      "start_date", "target_date",
    ];
    for (const field of expectedFieldNames) {
      expect(errorText, `Error message should mention '${field}'`).toContain(field);
    }
  });
});

// ---- AC #7: add_code_reference tool ----

describe("QA AC#7: add_code_reference tool", () => {
  let tools: Map<string, ToolRegistration>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;

  beforeEach(() => {
    const mockServer = createMockServer();
    mockApiClient = createMockApiClient();
    registerCodeReferenceTools(mockServer as unknown as Parameters<typeof registerCodeReferenceTools>[0], mockApiClient);
    tools = mockServer.tools;
  });

  it("has description matching 'Add an ObjectScript code reference to a ticket'", () => {
    const tool = tools.get("add_code_reference")!;
    expect(tool.description).toBe("Add an ObjectScript code reference to a ticket");
  });

  it("schema requires class_name as a string", () => {
    const schema = tools.get("add_code_reference")!.schema;
    expect(schema.class_name).toBeDefined();
    const field = schema.class_name as z.ZodString;
    expect(field.safeParse("SpectraSight.Model.Ticket").success).toBe(true);
    // Required — undefined should fail
    expect(field.safeParse(undefined).success).toBe(false);
  });

  it("schema has method_name as optional", () => {
    const schema = tools.get("add_code_reference")!.schema;
    expect(schema.method_name).toBeDefined();
    const field = schema.method_name;
    expect(field.safeParse("GetById").success).toBe(true);
    expect(field.safeParse(undefined).success).toBe(true); // optional
  });

  it("POSTs to /tickets/:id/code-references with correct endpoint", async () => {
    (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, className: "MyClass" });

    const handler = tools.get("add_code_reference")!.handler;
    await handler({
      ticket_id: "SS-42",
      class_name: "MyClass",
    });

    const [path] = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(path).toBe("/tickets/SS-42/code-references");
  });

  it("returns created reference as JSON in content array", async () => {
    const createdRef = {
      id: 7,
      className: "SpectraSight.REST.Handler",
      methodName: "HandleRequest",
      addedBy: "agent",
      timestamp: "2026-02-15T12:00:00Z",
    };
    (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(createdRef);

    const handler = tools.get("add_code_reference")!.handler;
    const result = await handler({
      ticket_id: "SS-42",
      class_name: "SpectraSight.REST.Handler",
      method_name: "HandleRequest",
    });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.id).toBe(7);
    expect(parsed.className).toBe("SpectraSight.REST.Handler");
    expect(parsed.methodName).toBe("HandleRequest");
  });
});

// ---- AC #8: remove_code_reference tool ----

describe("QA AC#8: remove_code_reference tool", () => {
  let tools: Map<string, ToolRegistration>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;

  beforeEach(() => {
    const mockServer = createMockServer();
    mockApiClient = createMockApiClient();
    registerCodeReferenceTools(mockServer as unknown as Parameters<typeof registerCodeReferenceTools>[0], mockApiClient);
    tools = mockServer.tools;
  });

  it("has description matching 'Remove a code reference from a ticket'", () => {
    const tool = tools.get("remove_code_reference")!;
    expect(tool.description).toBe("Remove a code reference from a ticket");
  });

  it("schema requires reference_id as a number", () => {
    const schema = tools.get("remove_code_reference")!.schema;
    expect(schema.reference_id).toBeDefined();
    const field = schema.reference_id as z.ZodNumber;
    expect(field.safeParse(5).success).toBe(true);
    // String should fail — must be a number
    expect(field.safeParse("5").success).toBe(false);
    // Required — undefined should fail
    expect(field.safeParse(undefined).success).toBe(false);
  });

  it("DELETEs to /tickets/:id/code-references/:refId with correct endpoint", async () => {
    (mockApiClient.del as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const handler = tools.get("remove_code_reference")!.handler;
    await handler({
      ticket_id: "SS-42",
      reference_id: 3,
    });

    const [path] = (mockApiClient.del as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(path).toBe("/tickets/SS-42/code-references/3");
  });

  it("returns confirmation message mentioning ticket_id and reference_id", async () => {
    (mockApiClient.del as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const handler = tools.get("remove_code_reference")!.handler;
    const result = await handler({
      ticket_id: "SS-15",
      reference_id: 9,
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("9");
    expect(result.content[0].text).toContain("SS-15");
  });

  it("returns formatted error on API failure", async () => {
    const { ApiError } = await import("../api-client.js");
    (mockApiClient.del as ReturnType<typeof vi.fn>).mockRejectedValue(
      new ApiError("NOT_FOUND", "Code reference not found", 404)
    );

    const handler = tools.get("remove_code_reference")!.handler;
    const result = await handler({
      ticket_id: "SS-42",
      reference_id: 999,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("NOT_FOUND");
  });
});

// ---- AC #9: list_activity tool ----

describe("QA AC#9: list_activity tool", () => {
  let tools: Map<string, ToolRegistration>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;

  beforeEach(() => {
    const mockServer = createMockServer();
    mockApiClient = createMockApiClient();
    registerActivityTools(mockServer as unknown as Parameters<typeof registerActivityTools>[0], mockApiClient);
    tools = mockServer.tools;
  });

  it("has description matching 'Get the activity timeline for a ticket'", () => {
    const tool = tools.get("list_activity")!;
    expect(tool.description).toBe("Get the activity timeline for a ticket");
  });

  it("schema requires ticket_id with SS-pattern", () => {
    const schema = tools.get("list_activity")!.schema;
    expect(schema.ticket_id).toBeDefined();
    const field = schema.ticket_id as z.ZodString;
    expect(field.safeParse("SS-42").success).toBe(true);
    expect(field.safeParse("invalid").success).toBe(false);
    expect(field.safeParse(undefined).success).toBe(false); // required
  });

  it("GETs to /tickets/:id/activity with correct endpoint", async () => {
    (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const handler = tools.get("list_activity")!.handler;
    await handler({ ticket_id: "SS-42" });

    const [path] = (mockApiClient.get as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(path).toBe("/tickets/SS-42/activity");
  });

  it("returns full activity array with multiple activity types as JSON", async () => {
    const activities = [
      { id: 1, type: "statusChange", actorName: "Josh", actorType: "human", fromStatus: "Open", toStatus: "In Progress", timestamp: "2026-02-15T10:00:00Z" },
      { id: 2, type: "assignmentChange", actorName: "agent", actorType: "agent", fromAssignee: null, toAssignee: "Josh", timestamp: "2026-02-15T10:01:00Z" },
      { id: 3, type: "comment", actorName: "agent", actorType: "agent", body: "Started work", timestamp: "2026-02-15T10:02:00Z" },
      { id: 4, type: "codeReferenceChange", actorName: "agent", actorType: "agent", className: "MyClass", methodName: "Run", action: "added", timestamp: "2026-02-15T10:03:00Z" },
    ];
    (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(activities);

    const handler = tools.get("list_activity")!.handler;
    const result = await handler({ ticket_id: "SS-10" });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toHaveLength(4);
    expect(parsed[0].type).toBe("statusChange");
    expect(parsed[1].type).toBe("assignmentChange");
    expect(parsed[2].type).toBe("comment");
    expect(parsed[3].type).toBe("codeReferenceChange");
  });
});

// ---- AC #10: Correct total tool count ----

describe("QA AC#10: total tool count is 10", () => {
  it("all 5 registration modules produce exactly 10 tools total", () => {
    const mockServer = createMockServer();
    const mockApiClient = createMockApiClient();
    const config = { baseUrl: "http://localhost:52773", username: "_SYSTEM", password: "SYS" };

    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient);
    registerCommentTools(mockServer as unknown as Parameters<typeof registerCommentTools>[0], mockApiClient);
    registerCodeReferenceTools(mockServer as unknown as Parameters<typeof registerCodeReferenceTools>[0], mockApiClient);
    registerActivityTools(mockServer as unknown as Parameters<typeof registerActivityTools>[0], mockApiClient);
    registerConnectionTools(mockServer as unknown as Parameters<typeof registerConnectionTools>[0], mockApiClient, config);

    expect(mockServer.tools.size).toBe(10);
  });

  it("test_connection success message includes 'All 10 tools available'", async () => {
    const mockServer = createMockServer();
    const mockApiClient = createMockApiClient();
    const config = { baseUrl: "http://localhost:52773", username: "_SYSTEM", password: "SYS" };

    registerConnectionTools(mockServer as unknown as Parameters<typeof registerConnectionTools>[0], mockApiClient, config);

    (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ total: 5 });

    const handler = mockServer.tools.get("test_connection")!.handler;
    const result = await handler({});

    expect(result.content[0].text).toContain("10 tools available");
  });
});

// ---- Cross-cutting: create_ticket does not leak omitted fields ----

describe("QA cross-cutting: create_ticket does not leak omitted optional fields", () => {
  let tools: Map<string, ToolRegistration>;
  let mockApiClient: ReturnType<typeof createMockApiClient>;

  beforeEach(() => {
    const mockServer = createMockServer();
    mockApiClient = createMockApiClient();
    registerTicketTools(mockServer as unknown as Parameters<typeof registerTicketTools>[0], mockApiClient);
    tools = mockServer.tools;
  });

  it("only sends title and type when no optional fields are provided", async () => {
    (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-1" });

    const handler = tools.get("create_ticket")!.handler;
    await handler({ title: "Minimal ticket", type: "task" });

    const callArgs = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(Object.keys(callArgs)).toEqual(["title", "type"]);
  });

  it("only sends provided fields for a bug with partial fields", async () => {
    (mockApiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "SS-2" });

    const handler = tools.get("create_ticket")!.handler;
    await handler({
      title: "Partial bug",
      type: "bug",
      severity: "Medium",
      // steps_to_reproduce, expected_behavior, actual_behavior omitted
    });

    const callArgs = (mockApiClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs).toHaveProperty("title");
    expect(callArgs).toHaveProperty("type");
    expect(callArgs).toHaveProperty("severity");
    expect(callArgs).not.toHaveProperty("stepsToReproduce");
    expect(callArgs).not.toHaveProperty("expectedBehavior");
    expect(callArgs).not.toHaveProperty("actualBehavior");
    expect(callArgs).not.toHaveProperty("estimatedHours");
    expect(callArgs).not.toHaveProperty("storyPoints");
    expect(callArgs).not.toHaveProperty("startDate");
  });
});

// ---- Cross-cutting: README documentation for Story 4.3 tools ----

describe("QA cross-cutting: README documents Story 4.3 changes", () => {
  const readmePath = resolve(import.meta.dirname, "../../README.md");
  let readmeContent: string;

  beforeEach(() => {
    readmeContent = readFileSync(readmePath, "utf-8");
  });

  it("documents add_code_reference tool", () => {
    expect(readmeContent).toContain("`add_code_reference`");
    expect(readmeContent).toContain("code reference");
  });

  it("documents remove_code_reference tool", () => {
    expect(readmeContent).toContain("`remove_code_reference`");
  });

  it("documents list_activity tool", () => {
    expect(readmeContent).toContain("`list_activity`");
    expect(readmeContent).toContain("activity");
  });

  it("documents that create_ticket supports type-specific fields", () => {
    expect(readmeContent).toContain("type-specific");
  });

  it("shows correct tool count of 10 in example output", () => {
    expect(readmeContent).toContain("10 tools available");
  });
});

// ---- Cross-cutting: index.ts registration order ----

describe("QA cross-cutting: index.ts registers all tool modules", () => {
  let indexContent: string;

  beforeEach(() => {
    const indexPath = resolve(import.meta.dirname, "../index.ts");
    indexContent = readFileSync(indexPath, "utf-8");
  });

  it("imports registerCodeReferenceTools", () => {
    expect(indexContent).toContain("registerCodeReferenceTools");
    expect(indexContent).toContain("./tools/code-references.js");
  });

  it("imports registerActivityTools", () => {
    expect(indexContent).toContain("registerActivityTools");
    expect(indexContent).toContain("./tools/activity.js");
  });

  it("calls registerCodeReferenceTools(server, apiClient)", () => {
    expect(indexContent).toContain("registerCodeReferenceTools(server, apiClient)");
  });

  it("calls registerActivityTools(server, apiClient)", () => {
    expect(indexContent).toContain("registerActivityTools(server, apiClient)");
  });
});

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";
import { formatError } from "../errors.js";
import { TICKET_ID_PATTERN } from "../types.js";

const TicketTypeEnum = z.enum(["bug", "task", "story", "epic"]);
const TicketStatusEnum = z.enum(["Open", "In Progress", "Blocked", "Complete"]);
const TicketPriorityEnum = z.enum(["Low", "Medium", "High", "Critical"]);
const SeverityEnum = z.enum(["Low", "Medium", "High", "Critical"]);

const CreateTicketSchema = {
  title: z.string().describe("Ticket title (required)"),
  type: TicketTypeEnum.describe("Ticket type: bug, task, story, or epic"),
  description: z.string().optional().describe("Ticket description"),
  status: TicketStatusEnum.optional().describe("Ticket status: Open, In Progress, Blocked, or Complete"),
  priority: TicketPriorityEnum.optional().describe("Ticket priority: Low, Medium, High, or Critical"),
  assignee: z.string().optional().describe("Assigned user"),
  parent_id: z.string().regex(TICKET_ID_PATTERN, "Parent ticket ID must match format {PREFIX}-{number} (e.g., SS-1)").optional().describe("Parent ticket ID (e.g., SS-1)"),
  // Bug-specific fields
  severity: SeverityEnum.optional().describe("Bug severity: Low, Medium, High, or Critical"),
  steps_to_reproduce: z.string().optional().describe("Steps to reproduce the bug"),
  expected_behavior: z.string().optional().describe("Expected behavior"),
  actual_behavior: z.string().optional().describe("Actual behavior observed"),
  // Task-specific fields
  estimated_hours: z.number().optional().describe("Estimated hours to complete"),
  actual_hours: z.number().optional().describe("Actual hours spent"),
  // Story-specific fields
  story_points: z.number().optional().describe("Story point estimate"),
  acceptance_criteria: z.string().optional().describe("Acceptance criteria for the story"),
  // Epic-specific fields
  start_date: z.string().optional().describe("Epic start date"),
  target_date: z.string().optional().describe("Epic target date"),
};

const GetTicketSchema = {
  ticket_id: z.string().regex(TICKET_ID_PATTERN, "Ticket ID must match format {PREFIX}-{number} (e.g., SS-42)").describe("Ticket ID (e.g., SS-42)"),
};

const UpdateTicketSchema = {
  ticket_id: z.string().regex(TICKET_ID_PATTERN, "Ticket ID must match format {PREFIX}-{number} (e.g., SS-42)").describe("Ticket ID to update (e.g., SS-42)"),
  title: z.string().optional().describe("New title"),
  description: z.string().optional().describe("New description"),
  status: TicketStatusEnum.optional().describe("New status: Open, In Progress, Blocked, or Complete"),
  priority: TicketPriorityEnum.optional().describe("New priority: Low, Medium, High, or Critical"),
  assignee: z.string().optional().describe("New assignee"),
  parent_id: z.string().regex(TICKET_ID_PATTERN, "Parent ticket ID must match format {PREFIX}-{number} (e.g., SS-1)").optional().describe("Parent ticket ID (e.g., SS-1)"),
  // Bug-specific fields
  severity: SeverityEnum.optional().describe("Bug severity: Low, Medium, High, or Critical"),
  steps_to_reproduce: z.string().optional().describe("Steps to reproduce the bug"),
  expected_behavior: z.string().optional().describe("Expected behavior"),
  actual_behavior: z.string().optional().describe("Actual behavior observed"),
  // Task-specific fields
  estimated_hours: z.number().optional().describe("Estimated hours to complete"),
  actual_hours: z.number().optional().describe("Actual hours spent"),
  // Story-specific fields
  story_points: z.number().optional().describe("Story point estimate"),
  acceptance_criteria: z.string().optional().describe("Acceptance criteria for the story"),
  // Epic-specific fields
  start_date: z.string().optional().describe("Epic start date"),
  target_date: z.string().optional().describe("Epic target date"),
};

const DeleteTicketSchema = {
  ticket_id: z.string().regex(TICKET_ID_PATTERN, "Ticket ID must match format {PREFIX}-{number} (e.g., SS-42)").describe("Ticket ID to delete (e.g., SS-42)"),
};

const ListTicketsSchema = {
  type: TicketTypeEnum.optional().describe("Filter by ticket type: bug, task, story, or epic"),
  status: TicketStatusEnum.optional().describe("Filter by status: Open, In Progress, Blocked, or Complete"),
  priority: TicketPriorityEnum.optional().describe("Filter by priority: Low, Medium, High, or Critical"),
  assignee: z.string().optional().describe("Filter by assignee"),
  search: z.string().optional().describe("Search in title and description"),
  sort: z.string().optional().describe("Sort field (e.g., createdAt, -priority)"),
  page: z.number().optional().describe("Page number (default: 1)"),
  page_size: z.number().optional().describe("Items per page (default: 25)"),
  project: z.string().optional().describe("Filter by project prefix (e.g., DATA) or project ID"),
};

export function registerTicketTools(server: McpServer, apiClient: ApiClient): void {
  server.tool(
    "create_ticket",
    "Create a new ticket in SpectraSight",
    CreateTicketSchema,
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          title: params.title,
          type: params.type,
        };
        if (params.description !== undefined) body.description = params.description;
        if (params.status !== undefined) body.status = params.status;
        if (params.priority !== undefined) body.priority = params.priority;
        if (params.assignee !== undefined) body.assignee = params.assignee;
        if (params.parent_id !== undefined) body.parentId = params.parent_id;
        // Bug-specific fields
        if (params.severity !== undefined) body.severity = params.severity;
        if (params.steps_to_reproduce !== undefined) body.stepsToReproduce = params.steps_to_reproduce;
        if (params.expected_behavior !== undefined) body.expectedBehavior = params.expected_behavior;
        if (params.actual_behavior !== undefined) body.actualBehavior = params.actual_behavior;
        // Task-specific fields
        if (params.estimated_hours !== undefined) body.estimatedHours = params.estimated_hours;
        if (params.actual_hours !== undefined) body.actualHours = params.actual_hours;
        // Story-specific fields
        if (params.story_points !== undefined) body.storyPoints = params.story_points;
        if (params.acceptance_criteria !== undefined) body.acceptanceCriteria = params.acceptance_criteria;
        // Epic-specific fields
        if (params.start_date !== undefined) body.startDate = params.start_date;
        if (params.target_date !== undefined) body.targetDate = params.target_date;

        const data = await apiClient.post("/tickets", body);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (err) {
        return formatError(err);
      }
    }
  );

  server.tool(
    "get_ticket",
    "Get full details of a ticket by ID",
    GetTicketSchema,
    async (params) => {
      try {
        const data = await apiClient.get(`/tickets/${params.ticket_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (err) {
        return formatError(err);
      }
    }
  );

  server.tool(
    "update_ticket",
    "Update an existing ticket's fields",
    UpdateTicketSchema,
    async (params) => {
      try {
        const body: Record<string, unknown> = {};
        if (params.title !== undefined) body.title = params.title;
        if (params.description !== undefined) body.description = params.description;
        if (params.status !== undefined) body.status = params.status;
        if (params.priority !== undefined) body.priority = params.priority;
        if (params.assignee !== undefined) body.assignee = params.assignee;
        if (params.parent_id !== undefined) body.parentId = params.parent_id;
        // Bug-specific fields
        if (params.severity !== undefined) body.severity = params.severity;
        if (params.steps_to_reproduce !== undefined) body.stepsToReproduce = params.steps_to_reproduce;
        if (params.expected_behavior !== undefined) body.expectedBehavior = params.expected_behavior;
        if (params.actual_behavior !== undefined) body.actualBehavior = params.actual_behavior;
        // Task-specific fields
        if (params.estimated_hours !== undefined) body.estimatedHours = params.estimated_hours;
        if (params.actual_hours !== undefined) body.actualHours = params.actual_hours;
        // Story-specific fields
        if (params.story_points !== undefined) body.storyPoints = params.story_points;
        if (params.acceptance_criteria !== undefined) body.acceptanceCriteria = params.acceptance_criteria;
        // Epic-specific fields
        if (params.start_date !== undefined) body.startDate = params.start_date;
        if (params.target_date !== undefined) body.targetDate = params.target_date;

        if (Object.keys(body).length === 0) {
          return {
            content: [{ type: "text" as const, text: "Error: At least one field must be provided to update (title, description, status, priority, assignee, parent_id, severity, steps_to_reproduce, expected_behavior, actual_behavior, estimated_hours, actual_hours, story_points, acceptance_criteria, start_date, target_date)" }],
            isError: true,
          };
        }

        const data = await apiClient.put(`/tickets/${params.ticket_id}`, body);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (err) {
        return formatError(err);
      }
    }
  );

  server.tool(
    "delete_ticket",
    "Delete a ticket by ID",
    DeleteTicketSchema,
    async (params) => {
      try {
        await apiClient.del(`/tickets/${params.ticket_id}`);
        return {
          content: [{ type: "text", text: `Ticket ${params.ticket_id} deleted successfully` }],
        };
      } catch (err) {
        return formatError(err);
      }
    }
  );

  server.tool(
    "list_tickets",
    "List tickets with optional filtering, sorting, and pagination",
    ListTicketsSchema,
    async (params) => {
      try {
        const queryParams: Record<string, string | number | undefined> = {
          type: params.type,
          status: params.status,
          priority: params.priority,
          assignee: params.assignee,
          search: params.search,
          sort: params.sort,
          page: params.page,
          pageSize: params.page_size,
          project: params.project,
        };

        const data = await apiClient.get("/tickets", queryParams);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (err) {
        return formatError(err);
      }
    }
  );
}

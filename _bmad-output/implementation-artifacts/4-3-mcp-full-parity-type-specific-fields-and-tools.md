# Story 4.3: MCP Full Parity — Type-Specific Fields & Additional Tools

Status: done

## Story

As an AI agent,
I want to set and update type-specific fields on tickets and manage code references and activity via MCP,
So that I have full functional parity with the web UI and can operate as an equal teammate.

## Acceptance Criteria

1. **Given** the MCP server from Story 4.1 exists, **When** an AI agent calls `create_ticket` with type `"bug"`, **Then** the tool accepts optional type-specific fields: `severity`, `steps_to_reproduce`, `expected_behavior`, `actual_behavior` and they are passed to the REST API as camelCase equivalents.

2. **Given** the MCP server is running, **When** `create_ticket` is called with type `"task"`, **Then** it accepts optional fields: `estimated_hours` (number), `actual_hours` (number).

3. **Given** the MCP server is running, **When** `create_ticket` is called with type `"story"`, **Then** it accepts optional fields: `story_points` (number), `acceptance_criteria` (string).

4. **Given** the MCP server is running, **When** `create_ticket` is called with type `"epic"`, **Then** it accepts optional fields: `start_date` (string), `target_date` (string).

5. **Given** the MCP server is running, **When** `update_ticket` is called with type-specific fields for the ticket's type, **Then** the fields are passed to `PUT /api/tickets/:id` and the ticket is updated.

6. **Given** the MCP server is running, **When** `update_ticket` is called with `parent_id`, **Then** the parent is set/changed via `PUT /api/tickets/:id` with `parentId` in the body.

7. **Given** the MCP server is running, **When** `add_code_reference` is called with `ticket_id`, `class_name` (required), and `method_name` (optional), **Then** it creates a code reference via `POST /api/tickets/:id/code-references` and returns the created reference.

8. **Given** the MCP server is running, **When** `remove_code_reference` is called with `ticket_id` and `reference_id`, **Then** it deletes the code reference via `DELETE /api/tickets/:id/code-references/:refId`.

9. **Given** the MCP server is running, **When** `list_activity` is called with `ticket_id`, **Then** it returns the full activity timeline via `GET /api/tickets/:id/activity`.

10. **Given** all new tools are registered, **When** `test_connection` is called, **Then** it reports the correct total tool count (10).

## Tasks / Subtasks

### Task 1: Add type-specific fields to `create_ticket` (AC: #1, #2, #3, #4)

Extend the `CreateTicketSchema` Zod schema and `create_ticket` handler body mapping.

- [x] **Subtask 1.1:** Add Bug-specific optional fields to `CreateTicketSchema`:
  - `severity`: `z.enum(["Low", "Medium", "High", "Critical"]).optional().describe("Bug severity: Low, Medium, High, or Critical")`
  - `steps_to_reproduce`: `z.string().optional().describe("Steps to reproduce the bug")`
  - `expected_behavior`: `z.string().optional().describe("Expected behavior")`
  - `actual_behavior`: `z.string().optional().describe("Actual behavior observed")`
- [x] **Subtask 1.2:** Add Task-specific optional fields to `CreateTicketSchema`:
  - `estimated_hours`: `z.number().optional().describe("Estimated hours to complete")`
  - `actual_hours`: `z.number().optional().describe("Actual hours spent")`
- [x] **Subtask 1.3:** Add Story-specific optional fields to `CreateTicketSchema`:
  - `story_points`: `z.number().optional().describe("Story point estimate")`
  - `acceptance_criteria`: `z.string().optional().describe("Acceptance criteria for the story")`
- [x] **Subtask 1.4:** Add Epic-specific optional fields to `CreateTicketSchema`:
  - `start_date`: `z.string().optional().describe("Epic start date")`
  - `target_date`: `z.string().optional().describe("Epic target date")`
- [x] **Subtask 1.5:** Update the `create_ticket` handler body mapping to include all new fields with snake_case → camelCase conversion:
  - `steps_to_reproduce` → `stepsToReproduce`
  - `expected_behavior` → `expectedBehavior`
  - `actual_behavior` → `actualBehavior`
  - `estimated_hours` → `estimatedHours`
  - `actual_hours` → `actualHours`
  - `story_points` → `storyPoints`
  - `acceptance_criteria` → `acceptanceCriteria`
  - `start_date` → `startDate`
  - `target_date` → `targetDate`
  - `severity` → `severity` (no case change needed)

### Task 2: Add type-specific fields and `parent_id` to `update_ticket` (AC: #5, #6)

Extend the `UpdateTicketSchema` and `update_ticket` handler.

- [x] **Subtask 2.1:** Add all type-specific optional fields to `UpdateTicketSchema` (same fields as Task 1)
- [x] **Subtask 2.2:** Add `parent_id` to `UpdateTicketSchema`:
  - `parent_id`: `z.string().regex(TICKET_ID_PATTERN).optional().describe("Parent ticket ID (e.g., SS-1)")`
- [x] **Subtask 2.3:** Update the `update_ticket` handler body mapping:
  - Include all type-specific fields with snake_case → camelCase conversion
  - Map `parent_id` → `parentId`
  - Update the "at least one field" validation error message to include new field names

### Task 3: Create `add_code_reference` and `remove_code_reference` tools (AC: #7, #8)

New file: `mcp-server/src/tools/code-references.ts`

- [x] **Subtask 3.1:** Create `mcp-server/src/tools/code-references.ts`:
  - Export `registerCodeReferenceTools(server, apiClient)` function
  - Follow the exact same pattern as `comments.ts`
- [x] **Subtask 3.2:** Implement `add_code_reference` tool:
  - Schema: `ticket_id` (required, SS-pattern), `class_name` (required string), `method_name` (optional string)
  - Description: "Add an ObjectScript code reference to a ticket"
  - POST to `/tickets/${ticket_id}/code-references` with `{ className: class_name, methodName: method_name }`
  - Return created code reference as JSON
- [x] **Subtask 3.3:** Implement `remove_code_reference` tool:
  - Schema: `ticket_id` (required, SS-pattern), `reference_id` (required number)
  - Description: "Remove a code reference from a ticket"
  - DELETE `/tickets/${ticket_id}/code-references/${reference_id}`
  - Return confirmation message

### Task 4: Create `list_activity` tool (AC: #9)

New file: `mcp-server/src/tools/activity.ts`

- [x] **Subtask 4.1:** Create `mcp-server/src/tools/activity.ts`:
  - Export `registerActivityTools(server, apiClient)` function
  - Follow the exact same pattern as `comments.ts`
- [x] **Subtask 4.2:** Implement `list_activity` tool:
  - Schema: `ticket_id` (required, SS-pattern)
  - Description: "Get the activity timeline for a ticket"
  - GET `/tickets/${ticket_id}/activity`
  - Return full activity array as JSON

### Task 5: Register new tools and update TOOL_COUNT (AC: #10)

- [x] **Subtask 5.1:** In `mcp-server/src/index.ts`:
  - Import `registerCodeReferenceTools` from `./tools/code-references.js`
  - Import `registerActivityTools` from `./tools/activity.js`
  - Call both functions after existing registrations
- [x] **Subtask 5.2:** In `mcp-server/src/tools/connection.ts`:
  - Update `TOOL_COUNT` from `7` to `10`

### Task 6: Build and verify (AC: all)

- [x] **Subtask 6.1:** Run `npm run build` in `mcp-server/` — verify zero TypeScript errors
- [x] **Subtask 6.2:** Manually verify the tool registrations by reviewing the built output

## Dev Notes

### Architecture: Thin Wrapper Pattern (CRITICAL)

The MCP server is a **thin translation layer** over the REST API. This story adds NO backend changes — all REST endpoints already exist and work:

```
AI Agent → MCP Tool → api-client.ts → REST API → IRIS Database
```

**REST endpoints already available:**
| MCP Tool (new) | HTTP Method | REST Endpoint | Status |
|---|---|---|---|
| `create_ticket` (enhanced) | POST | `/api/tickets` | Already accepts type-specific fields |
| `update_ticket` (enhanced) | PUT | `/api/tickets/:id` | Already accepts type-specific fields + parentId |
| `add_code_reference` | POST | `/api/tickets/:id/code-references` | Exists since Epic 2 |
| `remove_code_reference` | DELETE | `/api/tickets/:id/code-references/:refId` | Exists since Epic 2 |
| `list_activity` | GET | `/api/tickets/:id/activity` | Exists since Epic 3 |

### Existing Code Patterns to Follow

**Tool registration pattern** (from `tools/tickets.ts`):
```typescript
export function registerXxxTools(server: McpServer, apiClient: ApiClient): void {
  server.tool("tool_name", "Description", SchemaObject, async (params) => {
    try {
      const data = await apiClient.method("/path", body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (err) {
      return formatError(err);
    }
  });
}
```

**Imports needed in new files:**
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api-client.js";
import { formatError } from "../errors.js";
import { TICKET_ID_PATTERN } from "../types.js";
```

**snake_case → camelCase mapping pattern** (from `create_ticket` handler):
```typescript
if (params.parent_id !== undefined) body.parentId = params.parent_id;
```

### Type-Specific Fields — REST API Mapping

**Bug** (type: "bug"):
| MCP param (snake_case) | REST field (camelCase) | Type |
|---|---|---|
| `severity` | `severity` | enum: Low, Medium, High, Critical |
| `steps_to_reproduce` | `stepsToReproduce` | string (max 32000) |
| `expected_behavior` | `expectedBehavior` | string (max 32000) |
| `actual_behavior` | `actualBehavior` | string (max 32000) |

**Task** (type: "task"):
| MCP param (snake_case) | REST field (camelCase) | Type |
|---|---|---|
| `estimated_hours` | `estimatedHours` | number |
| `actual_hours` | `actualHours` | number |

**Story** (type: "story"):
| MCP param (snake_case) | REST field (camelCase) | Type |
|---|---|---|
| `story_points` | `storyPoints` | number |
| `acceptance_criteria` | `acceptanceCriteria` | string (max 32000) |

**Epic** (type: "epic"):
| MCP param (snake_case) | REST field (camelCase) | Type |
|---|---|---|
| `start_date` | `startDate` | string (date) |
| `target_date` | `targetDate` | string (date) |

### Code Reference REST API Contract

**POST /api/tickets/:id/code-references**
- Request: `{ "className": "SpectraSight.Model.Ticket", "methodName": "GetById" }`
- Response (201): `{ "data": { "id": 5, "className": "...", "methodName": "...", "addedBy": "...", "timestamp": "..." } }`

**DELETE /api/tickets/:id/code-references/:refId**
- Response (204): No content

### Activity REST API Contract

**GET /api/tickets/:id/activity**
- Response (200): `{ "data": [ { "id": 1, "type": "statusChange", "actorName": "...", "actorType": "human|agent", "timestamp": "...", ...typeSpecificFields } ] }`
- Activity types: `statusChange` (fromStatus, toStatus), `assignmentChange` (fromAssignee, toAssignee), `comment` (body), `codeReferenceChange` (className, methodName, action)

### File Changes Summary

| File | Action | Description |
|---|---|---|
| `mcp-server/src/tools/tickets.ts` | **Modify** | Add type-specific fields to CreateTicketSchema, UpdateTicketSchema, and their handlers |
| `mcp-server/src/tools/code-references.ts` | **New** | add_code_reference, remove_code_reference tools |
| `mcp-server/src/tools/activity.ts` | **New** | list_activity tool |
| `mcp-server/src/tools/connection.ts` | **Modify** | TOOL_COUNT 7 → 10 |
| `mcp-server/src/index.ts` | **Modify** | Import and register new tool modules |

**No backend (ObjectScript/IRIS) changes needed.**
**No frontend (Angular) changes needed.**

### What This Story Does NOT Include

- No new REST API endpoints (all already exist)
- No IRIS/ObjectScript changes
- No Angular UI changes
- No new TypeScript type definitions in `types.ts` (REST responses are generic `unknown` via api-client — the MCP tool returns raw JSON)
- No MCP resources or prompts (tools only)

### Dependencies

**Depends on:**
- Story 4.1 (done): MCP server base, api-client, tool registration pattern
- Story 4.2 (done): Connection testing with TOOL_COUNT, error handling patterns
- Story 1.2 (done): REST API ticket CRUD with type-specific fields
- Story 2.3 (done): REST API code reference endpoints
- Story 3.1 (done): REST API activity endpoint

### Lessons from Previous Stories (4.1 and 4.2)

1. **Co-locate Zod schemas with tool registrations** — schemas live in the same file as the tool, not in types.ts
2. **snake_case for MCP params, camelCase for REST** — map explicitly in handler body construction
3. **Use `formatError(err)` for all error handling** — consistent error formatting across all tools
4. **stderr for diagnostic logs** — stdout is reserved for MCP protocol
5. **TOOL_COUNT in connection.ts** — must be updated whenever tools are added/removed
6. **Build before done** — run `npm run build` and verify zero TypeScript errors
7. **Follow existing registration order in index.ts** — import → register pattern after existing tools

### Project Structure Notes

Files follow the existing MCP server structure established in Story 4.1:
```
mcp-server/src/
├── index.ts                    ← Modify: add imports + registrations
├── config.ts                   (no changes)
├── api-client.ts               (no changes)
├── errors.ts                   (no changes)
├── types.ts                    (no changes)
└── tools/
    ├── tickets.ts              ← Modify: add type-specific fields to schemas + handlers
    ├── comments.ts             (no changes)
    ├── connection.ts           ← Modify: TOOL_COUNT 7 → 10
    ├── code-references.ts      ← New: add_code_reference, remove_code_reference
    └── activity.ts             ← New: list_activity
```

### References

- [Architecture: MCP Server] `_bmad-output/planning-artifacts/architecture.md` — MCP tool naming, response format
- [Sprint Change Proposal] `_bmad-output/planning-artifacts/sprint-change-proposal-2026-02-15.md` — Full gap analysis and rationale
- [Story 4.1: MCP Server] `_bmad-output/implementation-artifacts/4-1-mcp-server-with-ticket-operations.md` — Tool registration patterns, api-client usage
- [Story 4.2: Connection Testing] `_bmad-output/implementation-artifacts/4-2-mcp-configuration-and-connection-testing.md` — TOOL_COUNT, error patterns
- [Epics: Story 4.3] `_bmad-output/planning-artifacts/epics.md` — Acceptance criteria

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None required — clean implementation with zero build errors and all 111 tests passing.

### Completion Notes List

- **Task 1 (AC #1-#4):** Extended `CreateTicketSchema` with 10 type-specific optional fields (bug: severity, steps_to_reproduce, expected_behavior, actual_behavior; task: estimated_hours, actual_hours; story: story_points, acceptance_criteria; epic: start_date, target_date). Updated handler with snake_case to camelCase mapping for all fields.
- **Task 2 (AC #5-#6):** Extended `UpdateTicketSchema` with same 10 type-specific fields plus `parent_id`. Updated handler with camelCase mapping and expanded validation error message.
- **Task 3 (AC #7-#8):** Created `code-references.ts` with `add_code_reference` (POST with className/methodName) and `remove_code_reference` (DELETE) tools. Follows exact same pattern as `comments.ts`.
- **Task 4 (AC #9):** Created `activity.ts` with `list_activity` tool (GET activity timeline). Follows exact same pattern as `comments.ts`.
- **Task 5 (AC #10):** Registered new tools in `index.ts` and updated `TOOL_COUNT` from 7 to 10 in `connection.ts`.
- **Task 6:** Build succeeded with zero TypeScript errors. All 5 built tool files verified in `build/tools/`.
- **Tests:** Added 14 new unit tests across 3 new test files (code-references.test.ts: 8, activity.test.ts: 6) and extended tickets.test.ts with 7 new tests for type-specific field mapping. Updated qa-story-4-2.test.ts to reflect new tool count (10). Full suite: 111 tests passing, 0 failures.

### Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 | **Date:** 2026-02-15 | **Outcome:** Approved (with fixes applied)

**AC Validation:** All 10 Acceptance Criteria verified as IMPLEMENTED.
- AC #1-#4: Type-specific fields in CreateTicketSchema confirmed with correct snake_case to camelCase mapping.
- AC #5-#6: Type-specific fields and parent_id in UpdateTicketSchema confirmed with correct mapping.
- AC #7-#8: add_code_reference and remove_code_reference tools confirmed with correct REST endpoints.
- AC #9: list_activity tool confirmed with correct GET endpoint.
- AC #10: TOOL_COUNT updated to 10, verified by test that registers all modules and counts.

**Task Audit:** All 6 tasks (17 subtasks) marked [x] — all verified against implementation.

**Issues Found:** 0 High, 3 Medium, 1 Low

**MEDIUM-1 (FIXED):** README not updated with new tools. The README still listed 7 tools and did not document `add_code_reference`, `remove_code_reference`, or `list_activity`. The example output showed "All 7 tools available." Updated README with all 10 tools and corrected descriptions for `create_ticket` and `update_ticket`.

**MEDIUM-2 (FIXED):** QA test had stale description. `qa-story-4-2.test.ts:474` test description said "success message includes correct tool count of 7" while the assertion correctly checked for 10. Fixed description to match.

**MEDIUM-3 (FIXED):** QA test README check only verified 7 tool names. `qa-story-4-2.test.ts:79` test only validated 7 tool names in README. Updated to check all 10 tool names.

**LOW-1 (Accepted):** `update_ticket` tests spot-check a subset of type-specific field mappings rather than testing all 10 fields. Acceptable since create_ticket tests cover each type group individually, and the mapping code is identical in both handlers.

**Post-fix verification:** All 111 tests passing. Build clean with zero TypeScript errors.

### Change Log

- 2026-02-15: Code review — fixed README (added 3 new tools, updated descriptions, corrected tool count), fixed QA test stale descriptions and tool name checks
- 2026-02-15: Implemented Story 4.3 — MCP Full Parity with type-specific fields and additional tools (code references, activity)

### File List

- `mcp-server/src/tools/tickets.ts` — Modified: added type-specific fields to CreateTicketSchema, UpdateTicketSchema, and their handlers
- `mcp-server/src/tools/code-references.ts` — New: add_code_reference and remove_code_reference tools
- `mcp-server/src/tools/activity.ts` — New: list_activity tool
- `mcp-server/src/tools/connection.ts` — Modified: TOOL_COUNT 7 to 10
- `mcp-server/src/index.ts` — Modified: import and register code-reference and activity tools
- `mcp-server/src/__tests__/tools/code-references.test.ts` — New: 8 unit tests for code reference tools
- `mcp-server/src/__tests__/tools/activity.test.ts` — New: 6 unit tests for activity tool
- `mcp-server/src/__tests__/tools/tickets.test.ts` — Modified: added 7 tests for type-specific field mapping
- `mcp-server/src/__tests__/tools/connection.test.ts` — Modified: updated expected tool count from 7 to 10
- `mcp-server/src/__tests__/qa-story-4-2.test.ts` — Modified: updated tool count references from 7 to 10, added new tool imports, fixed stale test descriptions, added 3 new tool names to README check
- `mcp-server/README.md` — Modified: added 3 new tools to Available Tools table, updated tool count in example output, updated create_ticket and update_ticket descriptions

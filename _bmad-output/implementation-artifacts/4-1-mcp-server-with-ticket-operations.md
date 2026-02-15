# Story 4.1: MCP Server with Ticket Operations

Status: review

## Story

As an AI agent,
I want to create, read, update, list, filter, and close tickets via MCP tools,
So that I can manage project work autonomously without needing a browser interface.

## Acceptance Criteria

1. **Given** the REST API exists from Epics 1-3, **When** an AI agent launches the MCP server process via stdio transport, **Then** the server registers the following MCP tools: `create_ticket`, `get_ticket`, `update_ticket`, `delete_ticket`, `list_tickets`, `add_comment`.

2. **Given** the MCP server is running, **When** `create_ticket` is called with `title` (required), `type` (required), and optional fields (description, status, priority, assignee, parent_id), **Then** it creates a ticket via `POST /api/tickets` and returns the created ticket data.

3. **Given** the MCP server is running, **When** `get_ticket` is called with `ticket_id`, **Then** it returns full ticket details via `GET /api/tickets/:id`.

4. **Given** the MCP server is running, **When** `update_ticket` is called with `ticket_id` and any updatable fields, **Then** it updates via `PUT /api/tickets/:id` and returns the updated ticket.

5. **Given** the MCP server is running, **When** `delete_ticket` is called with `ticket_id`, **Then** it deletes the ticket via `DELETE /api/tickets/:id` and returns a success confirmation.

6. **Given** the MCP server is running, **When** `list_tickets` is called with optional filters (`type`, `status`, `priority`, `assignee`, `search`, `sort`, `page`, `page_size`), **Then** it queries via `GET /api/tickets` with query parameters and returns the paginated ticket list.

7. **Given** the MCP server is running, **When** `add_comment` is called with `ticket_id` and `body`, **Then** it creates a comment via `POST /api/tickets/:id/comments` with `actorType: "agent"` and returns the created comment.

8. **Given** any MCP tool is called with invalid parameters, **When** Zod validation fails, **Then** the tool returns an MCP error with a clear validation message before calling the REST API.

9. **Given** the REST API returns an error, **When** the MCP server processes the response, **Then** it translates the REST error envelope (`{ error: { code, message, status } }`) into an MCP error format with the original code and message preserved.

10. **Given** the MCP server configuration, **When** it starts, **Then** it reads IRIS REST API credentials from environment variables: `SPECTRASIGHT_URL`, `SPECTRASIGHT_USERNAME`, `SPECTRASIGHT_PASSWORD`.

## Tasks / Subtasks

### Task 1: Initialize MCP server project structure (AC: #1, #10)

Create `mcp-server/` directory at project root with TypeScript + MCP SDK setup.

- [x] **Subtask 1.1:** Create `mcp-server/package.json`:
  - name: `spectrasight-mcp`
  - version: `0.1.0`
  - type: `module`
  - main: `build/index.js`
  - bin: `{ "spectrasight-mcp": "build/index.js" }`
  - scripts: `build` (tsc), `start` (node build/index.js)
  - dependencies: `@modelcontextprotocol/sdk`, `zod`
  - devDependencies: `typescript`, `@types/node`
- [x] **Subtask 1.2:** Create `mcp-server/tsconfig.json`:
  - target: `ES2022`, module: `Node16`, moduleResolution: `Node16`
  - outDir: `build`, rootDir: `src`
  - strict: true, esModuleInterop: true, skipLibCheck: true
  - declaration: true
- [x] **Subtask 1.3:** Run `npm install` in `mcp-server/` to install dependencies
- [x] **Subtask 1.4:** Create directory structure:
  ```
  mcp-server/src/
  ├── index.ts
  ├── config.ts
  ├── api-client.ts
  ├── tools/
  │   ├── tickets.ts
  │   └── comments.ts
  └── types.ts
  ```

### Task 2: Create config module (AC: #10)

- [x] **Subtask 2.1:** Create `mcp-server/src/config.ts`:
  - Read environment variables: `SPECTRASIGHT_URL` (default: `http://localhost:52773`), `SPECTRASIGHT_USERNAME` (default: `_SYSTEM`), `SPECTRASIGHT_PASSWORD` (default: `SYS`)
  - Export a `getConfig()` function returning `{ baseUrl, username, password }`
  - Validate that URL is present; warn to stderr if using defaults

### Task 3: Create API client module (AC: #2-7, #9, #10)

- [x] **Subtask 3.1:** Create `mcp-server/src/api-client.ts`:
  - Export a class `ApiClient` that wraps HTTP calls to the IRIS REST API
  - Constructor takes `{ baseUrl, username, password }` from config
  - Use Node.js built-in `fetch` (available in Node 18+) — no axios dependency needed
  - All requests include `Authorization: Basic <base64(username:password)>` header
  - All requests include `Content-Type: application/json` header
  - All requests prepend `/api` to the path (e.g., `/api/tickets`)
- [x] **Subtask 3.2:** Implement core HTTP methods:
  - `get(path, params?)` — GET with optional query parameters
  - `post(path, body)` — POST with JSON body
  - `put(path, body)` — PUT with JSON body
  - `del(path)` — DELETE
- [x] **Subtask 3.3:** Implement response handling:
  - Parse JSON response body
  - For success (2xx): return the `data` field from the response envelope
  - For errors (4xx/5xx): throw an `ApiError` class with `code`, `message`, `status` from the error envelope
  - For network errors: throw `ApiError` with code `CONNECTION_ERROR` and descriptive message
- [x] **Subtask 3.4:** Export `ApiError` class extending `Error` with `code: string`, `status: number`

### Task 4: Define TypeScript types and Zod schemas (AC: #8)

- [x] **Subtask 4.1:** Create `mcp-server/src/types.ts`:
  - `TicketType = 'bug' | 'task' | 'story' | 'epic'`
  - `TicketStatus = 'Open' | 'In Progress' | 'Blocked' | 'Complete'`
  - `TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical'`
  - `Ticket` interface matching REST API response shape
  - `PaginatedResponse<T>` interface with `data`, `total`, `page`, `pageSize`, `totalPages`
- [x] **Subtask 4.2:** Define Zod schemas in each tool file (co-located with tool registration):
  - `CreateTicketSchema`: title (string, required), type (enum, required), description (string, optional), status (enum, optional), priority (enum, optional), assignee (string, optional), parent_id (string, optional)
  - `GetTicketSchema`: ticket_id (string, required)
  - `UpdateTicketSchema`: ticket_id (string, required), title (string, optional), description (string, optional), status (enum, optional), priority (enum, optional), assignee (string, optional)
  - `DeleteTicketSchema`: ticket_id (string, required)
  - `ListTicketsSchema`: type (string, optional), status (string, optional), priority (string, optional), assignee (string, optional), search (string, optional), sort (string, optional), page (number, optional), page_size (number, optional)
  - `AddCommentSchema`: ticket_id (string, required), body (string, required)

### Task 5: Implement ticket CRUD tools (AC: #2, #3, #4, #5)

- [x] **Subtask 5.1:** Create `mcp-server/src/tools/tickets.ts`:
  - Export a function `registerTicketTools(server, apiClient)` that registers all ticket tools on the MCP server
- [x] **Subtask 5.2:** Implement `create_ticket` tool:
  - Description: "Create a new ticket in SpectraSight"
  - Input schema: `CreateTicketSchema` (Zod)
  - Map snake_case params to camelCase for REST: `parent_id` → `parentId`
  - POST to `/api/tickets`
  - Return created ticket data as JSON text content
- [x] **Subtask 5.3:** Implement `get_ticket` tool:
  - Description: "Get full details of a ticket by ID"
  - Input schema: `GetTicketSchema`
  - GET `/api/tickets/${ticket_id}`
  - Return ticket data as JSON text content
- [x] **Subtask 5.4:** Implement `update_ticket` tool:
  - Description: "Update an existing ticket's fields"
  - Input schema: `UpdateTicketSchema`
  - Map snake_case to camelCase, strip `ticket_id` from body
  - PUT `/api/tickets/${ticket_id}`
  - Return updated ticket data as JSON text content
- [x] **Subtask 5.5:** Implement `delete_ticket` tool:
  - Description: "Delete a ticket by ID"
  - Input schema: `DeleteTicketSchema`
  - DELETE `/api/tickets/${ticket_id}`
  - Return confirmation message: `"Ticket ${ticket_id} deleted successfully"`

### Task 6: Implement list_tickets tool (AC: #6)

- [x] **Subtask 6.1:** Implement `list_tickets` tool in `tickets.ts`:
  - Description: "List tickets with optional filtering, sorting, and pagination"
  - Input schema: `ListTicketsSchema`
  - Map snake_case params to query parameters: `page_size` → `pageSize`
  - GET `/api/tickets` with query params (only include non-undefined values)
  - Return full paginated response as JSON text content (data array + pagination metadata)

### Task 7: Implement add_comment tool (AC: #7)

- [x] **Subtask 7.1:** Create `mcp-server/src/tools/comments.ts`:
  - Export a function `registerCommentTools(server, apiClient)` that registers comment tools
- [x] **Subtask 7.2:** Implement `add_comment` tool:
  - Description: "Add a comment to a ticket"
  - Input schema: `AddCommentSchema`
  - POST to `/api/tickets/${ticket_id}/comments` with `{ body, actorType: "agent" }`
  - Always set `actorType: "agent"` — MCP tools are always agent-driven
  - Return created comment data as JSON text content

### Task 8: Create server entry point (AC: #1)

- [x] **Subtask 8.1:** Create `mcp-server/src/index.ts`:
  - Add shebang: `#!/usr/bin/env node`
  - Import `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
  - Import `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`
  - Create server instance: `new McpServer({ name: "spectrasight-mcp", version: "0.1.0" })`
  - Create `ApiClient` instance from config
  - Call `registerTicketTools(server, apiClient)`
  - Call `registerCommentTools(server, apiClient)`
  - Connect via stdio: `server.connect(new StdioServerTransport())`
  - Log server startup to stderr (not stdout — stdout is reserved for MCP protocol)

### Task 9: Build and verify (AC: all)

- [x] **Subtask 9.1:** Run `npm run build` in `mcp-server/` — verify zero TypeScript errors
- [x] **Subtask 9.2:** Verify the built `mcp-server/build/index.js` exists and has the shebang
- [x] **Subtask 9.3:** Test basic server startup: run `node mcp-server/build/index.js` and verify it doesn't crash immediately (it will wait for stdio input)

## Dev Notes

### Architecture: REST API as Single Gateway

The MCP server is a **thin translation layer** — it does NOT access IRIS `%Persistent` classes directly. All data access flows through the existing REST API:

```
AI Agent ↔ MCP Server (stdio) ↔ REST API (HTTP) ↔ IRIS Database
```

This ensures:
- Single source of truth for business logic (REST handlers)
- Activity recording happens server-side (REST layer)
- Validation rules enforced consistently
- No duplication of ObjectScript code

### Existing REST Endpoints to Wrap

| MCP Tool | HTTP Method | REST Endpoint | Response |
|----------|-------------|---------------|----------|
| `create_ticket` | POST | `/api/tickets` | 201 Created + ticket data |
| `get_ticket` | GET | `/api/tickets/:id` | 200 + ticket data |
| `update_ticket` | PUT | `/api/tickets/:id` | 200 + updated ticket data |
| `delete_ticket` | DELETE | `/api/tickets/:id` | 204 No Content |
| `list_tickets` | GET | `/api/tickets?...` | 200 + paginated list |
| `add_comment` | POST | `/api/tickets/:id/comments` | 201 Created + comment data |

### REST Response Envelope

All REST responses follow this pattern:
- Success: `{ "data": { ... } }` or `{ "data": [...], "total": N, "page": 1, "pageSize": 25, "totalPages": M }`
- Error: `{ "error": { "code": "ERROR_CODE", "message": "...", "status": 404 } }`
- Delete success: 204 No Content (empty body)

### MCP Tool Response Format

MCP tools return content as an array of content blocks. For JSON data:
```typescript
return {
  content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
};
```

For errors, throw `McpError` with error code and message.

### snake_case ↔ camelCase Mapping

MCP tool parameters use **snake_case** (MCP convention), but REST API uses **camelCase** (JavaScript convention):
- `ticket_id` → URL path parameter (no mapping needed — used in URL directly)
- `parent_id` → `parentId` (in request body)
- `page_size` → `pageSize` (in query params)
- `actor_type` → `actorType` (in request body)

### Ticket ID Format

All ticket IDs use `SS-{number}` format (e.g., `SS-42`). The REST API handles this format natively — the MCP server passes IDs through as-is.

### Authentication

IRIS REST API uses HTTP Basic Auth. The MCP server:
1. Reads credentials from environment variables at startup
2. Base64-encodes `username:password`
3. Sends `Authorization: Basic <encoded>` header on every request

### Node.js Built-in Fetch

Use Node.js 18+ built-in `fetch` API — no need for axios or node-fetch. This keeps dependencies minimal:
- `@modelcontextprotocol/sdk` — MCP protocol
- `zod` — schema validation (required by MCP SDK)
- `typescript` + `@types/node` — dev only

### What This Story Does NOT Include

- No HTTP transport (stdio only for MVP)
- No SSE/streaming support
- No MCP resources or prompts (tools only)
- No MCP client configuration docs (that's Story 4.2)
- No connection testing UI (that's Story 4.2)
- No `mcp-server/build/` committed to git (add to .gitignore)

### Dependencies

**Depends on:**
- Story 1.1 (done): Ticket data model
- Story 1.2 (done): REST API endpoints (CRUD)
- Story 2.2 (done): List filtering/sorting/pagination
- Story 3.2 (done): Comment endpoint with actorType support

### Lessons from Previous Stories

1. **Keep files focused** — one concern per file, under 700 lines
2. **Co-locate schemas** — Zod schemas next to tool registrations, not in a separate schemas file
3. **Error handling** — Always catch and translate errors; never let raw exceptions bubble to the agent
4. **stderr for logs** — MCP protocol uses stdout; all diagnostic output goes to stderr
5. **Test the build** — Verify `tsc` compiles cleanly before marking done

### References

- [Architecture: FR26-31] `_bmad-output/planning-artifacts/architecture.md` — MCP server design
- [UX: Agent Integration] `_bmad-output/planning-artifacts/ux-design-specification.md` — Agent parity principle
- [Epics: Story 4.1] `_bmad-output/planning-artifacts/epics.md` — Acceptance criteria
- [Story 1.2: REST API] `_bmad-output/implementation-artifacts/1-2-rest-api-for-ticket-operations.md` — REST patterns
- [Story 3.2: Comments] `_bmad-output/implementation-artifacts/3-2-comment-system.md` — Comment endpoint with actorType

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References
No debug globals used. Server startup verified via stdio with 3-second timeout test.

### Completion Notes List
- Task 1: Created MCP server project with package.json (spectrasight-mcp v0.1.0), tsconfig.json (ES2022/Node16), installed dependencies (@modelcontextprotocol/sdk ^1.26.0, zod ^3.24.0), and full src directory structure.
- Task 2: Config module reads SPECTRASIGHT_URL, SPECTRASIGHT_USERNAME, SPECTRASIGHT_PASSWORD from env vars with sensible defaults. Warns to stderr when using defaults.
- Task 3: ApiClient wraps fetch with Basic Auth, auto-prepends /api, handles response envelope extraction (data field for single items, full envelope for paginated lists), and translates REST errors to ApiError with code/message/status.
- Task 4: TypeScript types defined (TicketType, TicketStatus, TicketPriority, Ticket, PaginatedResponse). Zod schemas co-located in tool files per story guidance.
- Task 5: All four ticket CRUD tools registered (create_ticket, get_ticket, update_ticket, delete_ticket) with snake_case-to-camelCase mapping for parent_id.
- Task 6: list_tickets tool maps page_size to pageSize in query params, returns full paginated envelope.
- Task 7: add_comment tool always sets actorType: "agent" per story spec.
- Task 8: Entry point with shebang, McpServer + StdioServerTransport, all tool registrations, startup logged to stderr.
- Task 9: Build produces zero TypeScript errors. Built index.js has shebang. Server starts and waits for stdio input without crashing.
- Added mcp-server/build/ and mcp-server/node_modules/ to project .gitignore.

### Change Log
- 2026-02-15: Implemented Story 4.1 - MCP Server with Ticket Operations (all 9 tasks, 22 subtasks)

### File List
- mcp-server/package.json (new)
- mcp-server/tsconfig.json (new)
- mcp-server/src/index.ts (new)
- mcp-server/src/config.ts (new)
- mcp-server/src/api-client.ts (new)
- mcp-server/src/types.ts (new)
- mcp-server/src/tools/tickets.ts (new)
- mcp-server/src/tools/comments.ts (new)
- .gitignore (modified - added mcp-server/build/ and mcp-server/node_modules/)

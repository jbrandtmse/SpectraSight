# Story 4.2: MCP Configuration & Connection Testing

Status: review

## Story

As a developer,
I want to configure my AI agent's MCP client to connect to SpectraSight and verify the connection works,
So that I can start assigning tickets to the agent with confidence it can operate autonomously.

## Acceptance Criteria

1. **Given** the MCP server from Story 4.1 is built and available, **When** a developer configures their MCP client with the SpectraSight server entry (command, args, and environment variables for IRIS REST URL and credentials), **Then** the MCP server launches via stdio and registers all tools successfully.

2. **Given** the MCP server configuration, **When** it starts, **Then** it supports environment variables for: IRIS REST API base URL (`SPECTRASIGHT_URL`), username (`SPECTRASIGHT_USERNAME`), and password (`SPECTRASIGHT_PASSWORD`).

3. **Given** the MCP server is running, **When** a developer calls `list_tickets`, **Then** the server returns the current ticket list, confirming the connection works.

4. **Given** the REST API is unreachable, **When** any MCP tool is called, **Then** the MCP server returns a clear error message indicating the connection failure (e.g., "Cannot connect to SpectraSight API at http://localhost:52773 — connection refused").

5. **Given** the IRIS credentials are invalid, **When** any MCP tool is called, **Then** the MCP server returns a clear error message indicating authentication failure (e.g., "Authentication failed — check SPECTRASIGHT_USERNAME and SPECTRASIGHT_PASSWORD").

6. **Given** the `api-client.ts` module, **When** HTTP errors occur, **Then** it translates them to meaningful MCP tool errors with specific messages for connection, authentication, and API errors.

7. **Given** the project repository, **When** a developer reads the README, **Then** it includes MCP server setup instructions: how to build, configure environment variables, and add to an MCP client config (with example JSON).

8. **Given** the `package.json`, **When** a developer runs `npm run build`, **Then** the TypeScript MCP server compiles to JavaScript in the `build/` directory ready for use.

## Tasks / Subtasks

### Task 1: Enhance API client error messages for connection and auth failures (AC: #4, #5, #6)

Improve `mcp-server/src/api-client.ts` to provide developer-friendly error messages.

- [x] **Subtask 1.1:** Enhance the `CONNECTION_ERROR` case in the catch block:
  - Detect `ECONNREFUSED` in the error message → return: `"Cannot connect to SpectraSight API at ${baseUrl} — connection refused. Is IRIS running?"`
  - Detect `ETIMEDOUT` / `ENOTFOUND` → return: `"Cannot reach SpectraSight API at ${baseUrl} — check SPECTRASIGHT_URL"`
  - Generic network error → return: `"Network error connecting to SpectraSight API: ${error.message}"`
- [x] **Subtask 1.2:** Enhance HTTP error handling for auth failures:
  - 401 status → throw `ApiError` with code `AUTH_FAILED`, message: `"Authentication failed — check SPECTRASIGHT_USERNAME and SPECTRASIGHT_PASSWORD"`
  - 403 status → throw `ApiError` with code `AUTH_FORBIDDEN`, message: `"Access denied — insufficient permissions for this operation"`
  - Keep existing behavior for other error codes (extract from REST error envelope)
- [x] **Subtask 1.3:** Ensure all error messages include the base URL context so developers know which server they're trying to reach

### Task 2: Add `test_connection` MCP tool (AC: #3, #4, #5)

Add a lightweight connection-testing tool that developers can call to verify their setup.

- [x] **Subtask 2.1:** Create `mcp-server/src/tools/connection.ts`:
  - Export `registerConnectionTools(server, apiClient)` function
  - Register `test_connection` tool with no required parameters
  - Description: "Test the connection to SpectraSight API and verify credentials"
- [x] **Subtask 2.2:** Implement `test_connection` handler:
  - Call `apiClient.get('/tickets', { page: '1', pageSize: '1' })` to verify full round-trip
  - On success: return `"Connected to SpectraSight API at ${config.baseUrl} — ${total} tickets found. All ${toolCount} tools available."`
  - On auth failure (401/403): return formatted error with credential guidance
  - On connection failure: return formatted error with URL guidance
  - On other error: return formatted error with generic troubleshooting
- [x] **Subtask 2.3:** Register `test_connection` in `index.ts` alongside other tool registrations

### Task 3: Add startup connection validation (AC: #1, #4, #5)

Log connection status at startup so developers see issues immediately in stderr.

- [x] **Subtask 3.1:** In `mcp-server/src/index.ts`, after creating the ApiClient and before connecting:
  - Attempt a lightweight API call (GET `/tickets?page=1&pageSize=1`)
  - On success: log to stderr: `"SpectraSight MCP server connected to ${baseUrl} — ready"`
  - On failure: log warning to stderr: `"Warning: Could not connect to ${baseUrl} — ${error.message}. Tools will attempt to connect on first use."`
  - Do NOT exit on failure — let the server start anyway (the tools will return clear errors if the API is still down when called)

### Task 4: Create project README with MCP setup instructions (AC: #7)

- [x] **Subtask 4.1:** Create `mcp-server/README.md` with these sections:
  - **Overview**: What the MCP server does, how it relates to SpectraSight
  - **Prerequisites**: Node.js 18+, IRIS with SpectraSight REST API
  - **Building**: `cd mcp-server && npm install && npm run build`
  - **Configuration**: Environment variables table (SPECTRASIGHT_URL, SPECTRASIGHT_USERNAME, SPECTRASIGHT_PASSWORD) with defaults
  - **MCP Client Configuration**: Example JSON for Claude Desktop / claude_desktop_config.json:
    ```json
    {
      "mcpServers": {
        "spectrasight": {
          "command": "node",
          "args": ["/absolute/path/to/mcp-server/build/index.js"],
          "env": {
            "SPECTRASIGHT_URL": "http://localhost:52773",
            "SPECTRASIGHT_USERNAME": "_SYSTEM",
            "SPECTRASIGHT_PASSWORD": "SYS"
          }
        }
      }
    }
    ```
  - **Testing the Connection**: How to call `test_connection` tool after setup
  - **Available Tools**: Table of all 7 tools (create_ticket, get_ticket, update_ticket, delete_ticket, list_tickets, add_comment, test_connection) with brief descriptions
  - **Troubleshooting**: Common errors and solutions (connection refused, auth failed, IRIS not running)

### Task 5: Verify build and all tests (AC: #8)

- [x] **Subtask 5.1:** Run `npm run build` in `mcp-server/` — verify zero TypeScript errors
- [x] **Subtask 5.2:** Run `npm test` in `mcp-server/` — verify all existing + new tests pass
- [x] **Subtask 5.3:** Run Angular tests `npx ng test --no-watch --browsers=ChromeHeadless` in `frontend/` — verify no regressions

## Dev Notes

### Existing Infrastructure (from Story 4.1)

**Config module** (`config.ts`) already reads env vars with defaults:
- `SPECTRASIGHT_URL` → default `http://localhost:52773`
- `SPECTRASIGHT_USERNAME` → default `_SYSTEM`
- `SPECTRASIGHT_PASSWORD` → default `SYS`
- Warns to stderr when using defaults

**API client** (`api-client.ts`) already handles:
- Basic Auth via `Authorization` header
- Response envelope extraction (data unwrapping vs. paginated full envelope)
- Error types: `CONNECTION_ERROR`, `PARSE_ERROR`, `UNKNOWN_ERROR`, and REST envelope errors
- `ApiError` class with code, message, status

**Error formatting** (`errors.ts`) already:
- Formats `ApiError` → `"Error [CODE]: message"`
- Formats generic errors → `"Error: message"`
- Returns MCP `isError: true` content blocks

**Tools registered** (7 total after this story):
- `create_ticket`, `get_ticket`, `update_ticket`, `delete_ticket`, `list_tickets`, `add_comment`
- `test_connection` (new in this story)

### What Needs Enhancement

1. **api-client.ts**: More specific error messages for ECONNREFUSED, ETIMEDOUT, 401, 403
2. **index.ts**: Startup connection validation (non-blocking, log only)
3. **New tool**: `test_connection` for explicit connection verification
4. **New file**: `mcp-server/README.md` with setup/config/troubleshooting docs

### Error Message Philosophy

Error messages should tell the developer **what went wrong** AND **what to do about it**:
- Bad: `"Connection error"`
- Good: `"Cannot connect to SpectraSight API at http://localhost:52773 — connection refused. Is IRIS running?"`
- Bad: `"401 Unauthorized"`
- Good: `"Authentication failed — check SPECTRASIGHT_USERNAME and SPECTRASIGHT_PASSWORD"`

### What This Story Does NOT Include

- No UI for configuration (CLI/env vars only)
- No OAuth or token-based auth (Basic Auth only)
- No auto-reconnection or retry logic
- No MCP resources or prompts (tools only)
- No HTTP transport support (stdio only)

### Dependencies

**Depends on:**
- Story 4.1 (done): MCP server with all ticket/comment tools

### Lessons from Previous Stories

1. **Error messages need context** — include the URL/credentials being used (without leaking the password)
2. **Non-blocking startup** — don't prevent server from starting if API is temporarily down
3. **Test the happy path and error paths** — both connection success and failure scenarios
4. **README as a deliverable** — explicit AC, not an afterthought
5. **stderr for all diagnostics** — stdout is reserved for MCP protocol

### References

- [Architecture: FR34-35] `_bmad-output/planning-artifacts/architecture.md` — MCP config, connection testing
- [Epics: Story 4.2] `_bmad-output/planning-artifacts/epics.md` — Acceptance criteria
- [Story 4.1: MCP Server] `_bmad-output/implementation-artifacts/4-1-mcp-server-with-ticket-operations.md` — Base implementation

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References
No debug globals used; all changes are in the MCP server TypeScript codebase.

### Completion Notes List
- Task 1: Enhanced api-client.ts error handling with specific messages for ECONNREFUSED, ETIMEDOUT, ENOTFOUND, 401, and 403. All error messages include the base URL context. Added 9 new tests covering all error scenarios.
- Task 2: Created tools/connection.ts with test_connection tool. Registers with no required parameters, calls GET /tickets?page=1&pageSize=1 to verify full round-trip. Returns success message with ticket count or specific error for auth/connection failures. Added 8 new tests. Registered in index.ts.
- Task 3: Added non-blocking startup connection validation in index.ts. Logs success or warning to stderr before connecting transport. Does not prevent server from starting on failure.
- Task 4: Created comprehensive README.md with overview, prerequisites, build instructions, env var configuration table, MCP client config example JSON, test_connection usage, all 7 tools table, and troubleshooting section with 4 common error scenarios.
- Task 5: Verified build (zero TS errors), MCP server tests (58 pass), Angular frontend tests (402 pass). Fixed tsconfig.json to exclude test files from build output to prevent duplicate test execution.

### Change Log
- 2026-02-15: Implemented Story 4.2 — enhanced error messages, test_connection tool, startup validation, README documentation

### File List
- `mcp-server/src/api-client.ts` — Modified: enhanced error messages for ECONNREFUSED, ETIMEDOUT, ENOTFOUND, 401, 403
- `mcp-server/src/index.ts` — Modified: registered connection tools, added startup connection validation
- `mcp-server/src/tools/connection.ts` — New: test_connection MCP tool
- `mcp-server/src/__tests__/api-client.test.ts` — Modified: added 9 tests for enhanced error handling
- `mcp-server/src/__tests__/tools/connection.test.ts` — New: 8 tests for test_connection tool
- `mcp-server/tsconfig.json` — Modified: excluded test files from build output
- `mcp-server/README.md` — New: project documentation with setup, config, and troubleshooting

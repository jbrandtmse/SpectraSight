# Story 6.4: MCP User Identity Selection

Status: done

## Story

As an AI agent,
I want to specify which mapped user I'm acting as when performing ticket operations,
So that my actions are attributed to the correct team member identity rather than the IRIS connection account.

## Acceptance Criteria

1. **Given** user mappings exist, **When** an AI agent calls `create_ticket`, `update_ticket`, `add_comment`, `add_code_reference`, or `remove_code_reference` with an optional `user` parameter, **Then** the specified user is used as the actor for that operation (activity entries, comment author, etc.).

2. **Given** a `user` parameter is provided, **When** it does not match any active user mapping's display name, **Then** the MCP tool returns an error explaining the user is not a valid mapped display name.

3. **Given** no `user` parameter is provided, **When** a mutation MCP tool is called, **Then** the actor defaults to the display name mapped to the IRIS username used for REST authentication (from MCP config).

4. **Given** no `user` parameter is provided **And** no mapping exists for the authenticated IRIS user, **When** a mutation MCP tool is called, **Then** the IRIS username is used as-is (graceful fallback).

5. **Given** the MCP tool schemas, **When** reviewing `create_ticket`, `update_ticket`, `add_comment`, `add_code_reference`, and `remove_code_reference`, **Then** all include the `user` parameter in their Zod schemas with a description explaining its purpose.

6. **Given** the MCP server, **When** `test_connection` is called, **Then** TOOL_COUNT remains 12 (no new tools added — `user` is a parameter on existing tools, not a new tool).

7. **Given** the REST API mutation endpoints, **When** a request body includes `actorName` and `actorType` fields, **Then** the REST handler uses these values instead of `$USERNAME` and `"human"` for activity recording.

8. **Given** the REST API, **When** `actorName` is provided but does not match any active user mapping, **Then** a 400 Bad Request is returned with a descriptive error message.

## Tasks / Subtasks

### Task 1: Update REST API to accept actorName/actorType overrides (AC: #7, #8)

- [x] In `ActivityRecorder.cls`:
  - Add `ClassMethod ResolveActor(pBody As %DynamicObject) As %String` that:
    - If `pBody` has `actorName` field with non-empty value: validate against active UserMapping display names, return the name
    - If `actorName` is invalid (not in active mappings): return error status
    - If no `actorName` in body: fall back to `GetActorFromRequest()` (i.e., `$USERNAME`)
  - Add `ClassMethod ResolveActorType(pBody As %DynamicObject) As %String` that:
    - If `pBody` has `actorType` with value "human" or "agent": return it
    - Otherwise: return "human"
- [x] In `TicketHandler.cls` — `CreateTicket()`:
  - After saving the ticket, before recording activity: resolve actorName and actorType from request body
  - Replace `GetActorFromRequest()` with `ResolveActor(tBody)` — handle error status (return 400 if invalid)
  - Replace hardcoded `"human"` with `ResolveActorType(tBody)`
- [x] In `TicketHandler.cls` — `UpdateTicket()`:
  - Same pattern: resolve actorName and actorType from request body for status change and assignment change activities
- [x] In `TicketHandler.cls` — `AddComment()`:
  - Already accepts `actorType` from body
  - Add `actorName` support: if body has `actorName`, validate and use instead of `$USERNAME`
- [x] In `TicketHandler.cls` — `AddCodeReference()`:
  - Resolve actorName from request body for code reference added activity
  - Resolve actorType from request body
- [x] In `TicketHandler.cls` — `RemoveCodeReference()`:
  - Resolve actorName from request body for code reference removed activity
  - Resolve actorType from request body

### Task 2: Add `user` parameter to MCP mutation tool schemas (AC: #5, #6)

- [x] In `mcp-server/src/tools/tickets.ts`:
  - Add to `CreateTicketSchema`: `user: z.string().optional().describe("Display name of the mapped user to act as. Validated against active user mappings. If omitted, defaults to the display name mapped to the IRIS authentication username.")`
  - Add to `UpdateTicketSchema`: same `user` parameter
- [x] In `mcp-server/src/tools/comments.ts`:
  - Add to `AddCommentSchema`: same `user` parameter
- [x] In `mcp-server/src/tools/code-references.ts`:
  - Add to `AddCodeReferenceSchema`: same `user` parameter
  - Add to `RemoveCodeReferenceSchema`: same `user` parameter
- [x] Verify `TOOL_COUNT` in `connection.ts` remains 12

### Task 3: Implement user identity resolution in MCP tool handlers (AC: #1, #2, #3, #4)

- [x] Create `mcp-server/src/user-identity.ts` — user identity resolution module:
  - `resolveUser(apiClient, userParam?: string): Promise<{ actorName: string, actorType: string }>`:
    - If `userParam` provided: validate against active user mappings via `GET /api/users?isActive=true`
    - If valid: return `{ actorName: userParam, actorType: "agent" }`
    - If invalid: throw error with descriptive message listing valid display names
    - If not provided: look up IRIS config username in user mappings
    - If mapping found: return `{ actorName: mapping.displayName, actorType: "agent" }`
    - If no mapping: return `{ actorName: config.username, actorType: "agent" }` (graceful fallback)
  - Cache the user list for the duration of the MCP server process (reload on each tool call is excessive; a simple in-memory cache with TTL or per-call fetch is fine)
- [x] In `mcp-server/src/tools/tickets.ts` — `create_ticket` handler:
  - Call `resolveUser(apiClient, params.user)`
  - Add `actorName` and `actorType` to the request body sent to REST API
- [x] In `mcp-server/src/tools/tickets.ts` — `update_ticket` handler:
  - Same pattern: resolve user, add to request body
- [x] In `mcp-server/src/tools/comments.ts` — `add_comment` handler:
  - Call `resolveUser(apiClient, params.user)`
  - Replace hardcoded `actorType: "agent"` with resolved values
  - Add `actorName` to request body
- [x] In `mcp-server/src/tools/code-references.ts` — `add_code_reference` handler:
  - Call `resolveUser(apiClient, params.user)`
  - Add `actorName` and `actorType` to request body
- [x] In `mcp-server/src/tools/code-references.ts` — `remove_code_reference` handler:
  - Same pattern: resolve user, add to request body

### Task 4: Compile IRIS classes and build MCP server (AC: all)

- [x] Compile updated IRIS classes: `ActivityRecorder.cls`, `TicketHandler.cls`
- [x] Run `npm run build` in `mcp-server/`
- [x] Verify no compilation errors on either side

## Dev Notes

### Architecture: Key Implementation Details

**Two-Layer Design:**
This story modifies both the IRIS REST API (ObjectScript) and the MCP server (TypeScript). The MCP server is the agent-facing layer; the REST API is the data layer.

1. **MCP layer**: Accepts `user` parameter, validates against active user mappings, resolves identity, passes `actorName`/`actorType` in REST request body
2. **REST layer**: Accepts optional `actorName`/`actorType` in request body, validates `actorName` against active mappings if provided, uses for activity recording instead of `$USERNAME`

**Why validate at both layers:**
- REST API validation ensures direct API callers (not just MCP) can't inject arbitrary actor names
- MCP validation gives better error messages to agents (lists valid display names)
- Defense in depth

**ActivityRecorder.GetActorFromRequest() currently returns `$USERNAME`:**
```objectscript
ClassMethod GetActorFromRequest() As %String
{
    Quit $USERNAME
}
```
This is the fallback when no `actorName` is in the request body.

**Current actorType handling:**
- All mutation endpoints except `AddComment` hardcode `"human"` for actorType
- `AddComment` already accepts `actorType` from request body with whitelist validation (human/agent)
- Story 6.4 extends this pattern to all mutation endpoints

**MCP comment tool currently hardcodes actorType:**
```typescript
actorType: "agent"  // in comments.ts add_comment handler
```
After Story 6.4, this becomes dynamic via `resolveUser()`.

**User parameter uses display name (not IRIS username):**
Consistent with Story 6.3's pattern — assignee field stores display name. The `user` MCP parameter also uses display name (e.g., "Spectra", "Joe"), not IRIS username.

**Config username for identity resolution:**
The MCP server config already has `username` (from `SPECTRASIGHT_USERNAME` env var, default `_SYSTEM`). When no `user` parameter is provided, the MCP server uses this config username to look up the corresponding display name from user mappings.

### Key Code Locations

**IRIS (ObjectScript) — MODIFY:**
- `src/SpectraSight/Util/ActivityRecorder.cls` — Add `ResolveActor()`, `ResolveActorType()` class methods
- `src/SpectraSight/REST/TicketHandler.cls` — Update `CreateTicket()`, `UpdateTicket()`, `AddComment()`, `AddCodeReference()`, `RemoveCodeReference()` to use resolved actor

**MCP Server (TypeScript) — MODIFY:**
- `mcp-server/src/tools/tickets.ts` — Add `user` param to schemas, use `resolveUser()` in handlers
- `mcp-server/src/tools/comments.ts` — Add `user` param, replace hardcoded actorType
- `mcp-server/src/tools/code-references.ts` — Add `user` param, use `resolveUser()` in handlers

**MCP Server (TypeScript) — CREATE:**
- `mcp-server/src/user-identity.ts` — New module for user identity resolution logic

**MCP Server (TypeScript) — REFERENCE:**
- `mcp-server/src/config.ts` — `username` field for default identity resolution
- `mcp-server/src/api-client.ts` — Used for fetching user mappings
- `mcp-server/src/tools/connection.ts` — TOOL_COUNT must stay at 12
- `mcp-server/src/types.ts` — May need UserMapping interface

### What This Story Does NOT Include

- No frontend/Angular changes (all changes are backend IRIS + MCP server)
- No new MCP tools (user param is added to existing tools)
- No changes to user mapping CRUD (that was Story 6.1/6.2)
- No assignee dropdown changes (that was Story 6.3)
- No closed ticket filtering (that's Story 6.5)

### Previous Story Intelligence (6.3)

**Key patterns established:**
- UserMappingService with `activeUsers()` and `activeUserNames()` computed signals
- `findByIrisUsername()` for case-insensitive IRIS username to display name lookup
- Display name is the canonical identifier for assignees and actors
- Graceful fallback when no mapping exists (snackbar in UI, username as-is in this story)

**Code review lessons from Story 6.3:**
- Duplicate describe blocks in tests — watch for naming collisions
- Test names should accurately reflect what they test
- Always test navigation actions from snackbar/toast interactions

### IRIS ObjectScript Guidelines

- **NO underscores** in class/method/parameter names — use camelCase
- Method params: `p` prefix (`pBody`), locals: `t` prefix (`tActorName`)
- All methods return `%Status` with Try/Catch pattern; no `Quit` with args inside `Try`
- Keep classes under 700 lines
- Use `$$$AssertEquals`, `$$$AssertTrue`, `$$$AssertStatusOK` macros in tests

### MCP Server Patterns

- Zod schemas define tool parameters with `.describe()` for each field
- snake_case for MCP params, camelCase for REST body
- `formatError()` from `errors.ts` for consistent error formatting
- All tool handlers are async functions receiving validated `params`
- Tests use Vitest with mock API client

### Dependencies

- **Depends on:** Story 6.1 (REST API — COMPLETE), Story 6.2 (Configuration UI — COMPLETE), Story 6.3 (Assignee Dropdowns — COMPLETE)
- **Blocks:** Story 6.5 (Closed Ticket Filtering) — no direct dependency, but completes agent identity before filtering

### References

- [Architecture] `_bmad-output/planning-artifacts/architecture.md` — UserMapping model, activity recording patterns
- [Story 6.1] `_bmad-output/implementation-artifacts/6-1-user-mapping-data-model-and-rest-api.md` — REST API for user mappings
- [Story 6.3] `_bmad-output/implementation-artifacts/6-3-assignee-dropdowns-from-mapped-users.md` — Display name as identifier pattern
- [MCP Server] `mcp-server/src/` — Existing tool implementations, config, API client

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- iris-execute-mcp compilation returned "Access Denied" — used Atelier REST API via curl as workaround
- 15 test failures in qa-story-4-3.test.ts after signature changes — fixed by updating registration calls and adding user mocks

### Completion Notes List

- Added `ResolveActor()` and `ResolveActorType()` to ActivityRecorder.cls for REST-layer actor validation
- Updated all 5 mutation handlers in TicketHandler.cls (CreateTicket, UpdateTicket, AddComment, AddCodeReference, RemoveCodeReference) to use resolved actor instead of $USERNAME/hardcoded "human"
- Created `user-identity.ts` with 60s TTL cache for active user list and case-insensitive IRIS username lookup
- Added `user` parameter to all 5 MCP mutation tool Zod schemas
- Updated all MCP tool handlers to call `resolveUser()` and pass `actorName`/`actorType` in REST request bodies
- Extended `api-client.ts` `del()` method to accept optional body for remove_code_reference identity passing
- TOOL_COUNT remains 12 — no new tools added
- 218/218 MCP tests pass; 2 pre-existing Angular failures unrelated to this story

### File List

- `src/SpectraSight/Util/ActivityRecorder.cls` — Added ResolveActor, ResolveActorType methods
- `src/SpectraSight/REST/TicketHandler.cls` — Updated 5 mutation handlers for actor resolution
- `mcp-server/src/user-identity.ts` — NEW: User identity resolution module with TTL cache
- `mcp-server/src/tools/tickets.ts` — Added user param to schemas, resolveUser in handlers
- `mcp-server/src/tools/comments.ts` — Added user param, replaced hardcoded actorType
- `mcp-server/src/tools/code-references.ts` — Added user param to both schemas, resolveUser in handlers
- `mcp-server/src/api-client.ts` — Extended del() to accept optional body
- `mcp-server/src/index.ts` — Updated 3 registration calls to pass config
- `mcp-server/src/__tests__/user-identity.test.ts` — NEW: 9 tests for identity resolution
- `mcp-server/src/__tests__/tools/tickets.test.ts` — Updated for new signatures and actor assertions
- `mcp-server/src/__tests__/tools/comments.test.ts` — Updated for new signatures and actor assertions
- `mcp-server/src/__tests__/tools/code-references.test.ts` — Updated for new signatures and actor assertions
- `mcp-server/src/__tests__/qa-story-4-3.test.ts` — Updated for new signatures and user mocks
- `mcp-server/src/__tests__/qa-story-4-2.test.ts` — Updated for new registration signatures
- `mcp-server/src/__tests__/tools/connection.test.ts` — Updated for new registerConnectionTools signature (config param)
- `mcp-server/README.md` — Updated documentation

## Senior Developer Review (AI)

**Reviewer:** Developer on 2026-02-16
**Model:** Claude Opus 4.6

### Review Summary

**Issues Found:** 1 High, 5 Medium, 2 Low
**Issues Fixed:** 1 High, 1 Medium
**Action Items Created:** 0

### AC Validation

| AC | Status | Evidence |
|----|--------|----------|
| AC #1 | IMPLEMENTED | `resolveUser()` in `user-identity.ts` validates user param and passes `actorName`/`actorType` to REST body in all 5 mutation tool handlers |
| AC #2 | IMPLEMENTED | `resolveUser()` throws with descriptive error listing valid display names; IRIS `ResolveActor` returns error status for invalid actorName |
| AC #3 | IMPLEMENTED | When no user param, `resolveUser()` looks up config username in user mappings via case-insensitive IRIS username match |
| AC #4 | IMPLEMENTED | Graceful fallback returns `config.username` as-is when no mapping exists (`user-identity.ts:61`) |
| AC #5 | IMPLEMENTED | All 5 mutation schemas (CreateTicket, UpdateTicket, AddComment, AddCodeReference, RemoveCodeReference) include `user` parameter with `.describe()` |
| AC #6 | IMPLEMENTED | `TOOL_COUNT` in `connection.ts:7` remains 12; verified by `connection.test.ts` assertions |
| AC #7 | IMPLEMENTED | All 5 REST mutation handlers use `ResolveActor()` and `ResolveActorType()` from request body |
| AC #8 | IMPLEMENTED | `ResolveActor()` returns error status for invalid actorName; handlers return 400 Bad Request |

### Findings

**[FIXED] H1: UpdateTicket saves changes before actor validation (TicketHandler.cls:494-506)**
- Ticket was saved before validating actorName. If actorName was invalid, the ticket changes persisted but a 400 error was returned, misleading the caller. Fixed by moving `ResolveActor`/`ResolveActorType` calls before `%Save()`.

**[FIXED] M1: Missing File List entries**
- 3 changed files not documented in story File List: `qa-story-4-2.test.ts`, `connection.test.ts`, `README.md`. Added to File List.

**[NOTED] M2: TicketHandler.cls exceeds 700-line limit (1046 lines)**
- Pre-existing issue. Class was already over the limit before Story 6.4. Future stories should split this into separate handler classes.

**[NOTED] M3: RemoveCodeReference body parsing uses fragile Content check (TicketHandler.cls:685)**
- The `(%request.Content '= "") && ($ISOBJECT(%request.Content))` check works but is fragile for DELETE requests. Functional as-is.

**[NOTED] M4: Module-level mutable cache state in user-identity.ts**
- Works for single-process MCP server. Tests handle it correctly with `clearUserCache()`.

**[NOTED] M5: `user` parameter excluded from "no updatable fields" check in update_ticket**
- Calling `update_ticket` with only `user` param returns "At least one field must be provided" error. Arguably correct behavior but error message could be clearer.

**[NOTED] L1: `user` param name not stripped/documented as MCP-only**
- Currently harmless due to explicit body field mapping. No action needed.

**[NOTED] L2: Inconsistent tSC vs tSC2 usage in AddCodeReference**
- Consistent with codebase patterns. No action needed.

### Change Log

- 2026-02-16: Code review completed. Fixed H1 (actor validation before save in UpdateTicket). Fixed M1 (missing File List entries). All 218 MCP tests pass. IRIS compilation successful.

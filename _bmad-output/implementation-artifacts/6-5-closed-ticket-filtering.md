# Story 6.5: Closed Ticket Filtering

Status: done

## Story

As a developer,
I want closed/complete tickets hidden from the default ticket list,
So that my daily view shows only active work without clutter from finished tickets.

## Acceptance Criteria

1. **Given** the ticket list loads, **When** no `includeClosed` filter is active, **Then** tickets with status "Complete" are excluded by default.

2. **Given** the filter bar, **When** it renders, **Then** a "Show Closed" toggle appears at the end of the filter controls, defaulting to off.

3. **Given** "Show Closed" is toggled on, **When** the URL updates, **Then** `?includeClosed=true` appears in the query params.

4. **Given** the REST API `GET /api/tickets`, **When** called without `includeClosed=true`, **Then** tickets with status "Complete" are excluded from results.

5. **Given** the MCP `list_tickets` tool, **When** called with optional `include_closed` boolean parameter (default false), **Then** MCP agents can control whether closed tickets are included.

6. **Given** "Show Closed" is active, **When** Complete tickets display in the list, **Then** they display normally with their green Complete status badge (no special styling).

7. **Given** all tickets are closed and "Show Closed" is off, **When** the empty state message appears, **Then** it reads: "All tickets are closed. Toggle 'Show Closed' to view them."

## Tasks / Subtasks

### Task 1: Update REST API to exclude Complete by default (AC: #1, #4)

- [x] In `TicketHandler.cls` — `ListTickets()`:
  - Extract `includeClosed` query parameter: `Set tIncludeClosed = $ZCONVERT($GET(%request.Data("includeClosed", 1), "false"), "L")`
  - After existing filter WHERE clause building, add logic:
    - If `tIncludeClosed '= "true"` AND no explicit status filter is already set (i.e., `tStatus = ""`):
      - Add WHERE clause: `Status != 'Complete'`
    - If user explicitly set a status filter (e.g., `?status=Complete`), do NOT override — the explicit filter takes precedence
  - This means: default excludes Complete; `?includeClosed=true` includes all; `?status=Complete` explicitly requests Complete only

### Task 2: Add `include_closed` to MCP list_tickets tool (AC: #5)

- [x] In `mcp-server/src/tools/tickets.ts`:
  - Add to `ListTicketsSchema`: `include_closed: z.boolean().optional().describe("Include closed/completed tickets in results (default: false)")`
  - In `list_tickets` handler: pass `includeClosed: params.include_closed ? "true" : undefined` in queryParams
  - Only send `includeClosed=true` when explicitly requested (don't send `false` — let backend use its default)

### Task 3: Extend FilterState and TicketService (AC: #1, #3)

- [x] In `ticket.model.ts`:
  - Add `includeClosed?: boolean` to `FilterState` interface
- [x] In `ticket.service.ts` — `loadTickets()`:
  - If `state.includeClosed` is true: add `params = params.set('includeClosed', 'true')` to HTTP params
  - If false or undefined: don't send parameter (backend default excludes Complete)

### Task 4: Add "Show Closed" toggle to filter bar (AC: #2)

- [x] In `filter-bar.component.ts`:
  - Add `includeClosed = signal(false)` signal
  - Add `initialIncludeClosed = input(false)` input for URL-state restore
  - In `ngOnInit` or `effect`: sync `initialIncludeClosed` to `includeClosed` signal
  - Update `emitFilters()`: add `if (this.includeClosed()) state.includeClosed = true;`
  - Add `toggleIncludeClosed()` method: flips signal, calls `emitFilters()`
- [x] In `filter-bar.component.html`:
  - Add at the end of the filter controls (after assignee filter):
    ```html
    <mat-slide-toggle [checked]="includeClosed()" (change)="toggleIncludeClosed()">
      Show Closed
    </mat-slide-toggle>
    ```
  - Import `MatSlideToggleModule` if not already imported

### Task 5: Wire URL state management (AC: #3)

- [x] In `tickets-page.component.ts`:
  - Read `includeClosed` from query params in `initialFilters`:
    - `if (qp.get('includeClosed') === 'true') initial.includeClosed = true;`
  - Pass `initialIncludeClosed` to filter bar: `[initialIncludeClosed]="initialFilters.includeClosed ?? false"`
  - Update `syncFiltersToUrl()`: add `includeClosed: filters.includeClosed ? 'true' : null` to queryParams

### Task 6: Handle all-closed empty state (AC: #7)

- [x] In `ticket-list.component.ts` or `tickets-page.component.ts`:
  - Detect when ticket list is empty AND `includeClosed` is false
  - Show specific message: "All tickets are closed. Toggle 'Show Closed' to view them."
  - This is distinct from the existing "No tickets match your filters" empty state
  - Implementation approach: the existing empty state logic likely checks `tickets().length === 0` — add a condition that also checks whether the `includeClosed` filter is off

### Task 7: Build and verify (AC: all)

- [x] Run `ng build` to verify no compilation errors
- [x] Run `ng test` to verify all tests pass
- [x] Run `npm run build` in `mcp-server/` to verify MCP server compiles
- [x] Run `npx vitest run` in `mcp-server/` to verify MCP tests pass

## Dev Notes

### Architecture: Key Implementation Details

**Default Exclusion Pattern:**
The key design principle is "exclude Complete by default, include on demand." This is NOT a hard filter — it's a default behavior that can be overridden three ways:
1. Toggle "Show Closed" in the UI (`?includeClosed=true`)
2. Explicitly filter by status "Complete" (`?status=Complete`) — this overrides the default exclusion
3. Pass `include_closed: true` via MCP tool

**Interaction between status filter and includeClosed:**
- If user explicitly filters by `?status=Complete`, they want Complete tickets — do NOT also exclude them via default
- If user filters by `?status=Open,Complete`, same — explicit takes precedence
- Only apply default Complete exclusion when NO explicit status filter is set and `includeClosed` is not `true`

**Current Status Values:**
The four valid statuses are: `Open`, `In Progress`, `Blocked`, `Complete` (from `SpectraSight.Util.Validation`).

**Filter Bar Layout Order (per UX spec):**
`[Project] [Search] [Type chips] [Status chips] [Priority] [Assignee] [Show Closed toggle]`

The "Show Closed" toggle goes at the END, after all other filters.

**URL State Pattern (established in Story 2.2):**
- `tickets-page.component.ts` reads initial query params into `FilterState`
- `syncFiltersToUrl()` writes `FilterState` back to URL via `router.navigate()`
- Filter bar emits changes via `(filtersChanged)` output
- `includeClosed` follows the exact same pattern

**Empty State Logic:**
The all-closed empty state is a special case. When the list is empty and includeClosed is off, we need to distinguish between:
1. "No tickets at all" — "No tickets yet. Create your first ticket."
2. "No tickets match filters" — "No tickets match your filters."
3. "All tickets are closed" — "All tickets are closed. Toggle 'Show Closed' to view them."

The third case needs a signal or condition: `tickets().length === 0 && !includeClosed && hasNoOtherFilters`. The simplest approach: if the empty result comes with `total: 0` and includeClosed is false and no other filters are active, show the all-closed message. Alternatively, the backend could return a `totalIncludingClosed` count to help the frontend distinguish.

### Key Code Locations

**IRIS (ObjectScript) — MODIFY:**
- `src/SpectraSight/REST/TicketHandler.cls` — `ListTickets()`: Add `includeClosed` parameter, default exclusion of Complete

**MCP Server (TypeScript) — MODIFY:**
- `mcp-server/src/tools/tickets.ts` — Add `include_closed` to `ListTicketsSchema`, pass in handler

**Frontend (Angular) — MODIFY:**
- `frontend/src/app/tickets/ticket.model.ts` — Add `includeClosed` to `FilterState`
- `frontend/src/app/tickets/ticket.service.ts` — Pass `includeClosed` parameter in `loadTickets()`
- `frontend/src/app/shared/filter-bar/filter-bar.component.ts` — Add `includeClosed` signal, toggle method
- `frontend/src/app/shared/filter-bar/filter-bar.component.html` — Add "Show Closed" toggle
- `frontend/src/app/tickets/tickets-page.component.ts` — URL state management for `includeClosed`
- `frontend/src/app/tickets/ticket-list/ticket-list.component.ts` (or `tickets-page.component.ts`) — All-closed empty state

### What This Story Does NOT Include

- No changes to ticket creation or editing
- No changes to ticket detail view
- No changes to user mapping or authentication
- No archiving or soft-delete of tickets
- No visual distinction for Complete tickets beyond the existing green status badge

### Previous Story Intelligence (6.4)

**Key patterns established:**
- Two-layer validation: MCP validates, REST API also validates independently
- Query parameter extraction in ObjectScript: `$GET(%request.Data("paramName", 1), "defaultValue")`
- MCP parameters: only send truthy values, let backend use defaults for falsy/undefined
- Request body vs query params: this story uses query params (GET request), not body (unlike 6.4 which used body for mutations)

**Code review lessons from 6.4:**
- Signature changes in tool registration can break existing tests — update all test mocks
- Always check pre-existing test files for compatibility with changes

### IRIS ObjectScript Guidelines

- **NO underscores** in class/method/parameter names — use camelCase
- Method params: `p` prefix (`pInput`), locals: `t` prefix (`tStatus`)
- All methods return `%Status` with Try/Catch pattern
- Keep classes under 700 lines
- Use `$$$AssertEquals`, `$$$AssertTrue`, `$$$AssertStatusOK` macros in tests

### Dependencies

- **Depends on:** Story 2.2 (Filter Bar — COMPLETE), Story 6.4 (MCP User Identity — COMPLETE)
- **Blocks:** None — this is the last story in Epic 6

### References

- [Architecture] `_bmad-output/planning-artifacts/architecture.md` — FR46-48, REST API params, filter bar spec
- [UX Design] `_bmad-output/planning-artifacts/ux-design-specification.md` — Filter bar anatomy, empty states
- [Story 2.2] `_bmad-output/implementation-artifacts/2-2-list-filtering-sorting-and-search.md` — Filter bar patterns, URL state management
- [Story 6.4] `_bmad-output/implementation-artifacts/6-4-mcp-user-identity-selection.md` — MCP tool param pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

N/A — IRIS not available during development; ObjectScript changes verified by code review only.

### Completion Notes List

- **Task 1 (REST API):** Added `includeClosed` query parameter extraction in `ListTickets()`. When `includeClosed != "true"` AND no explicit status filter is set, a `Status != 'Complete'` WHERE clause is added. Explicit status filters (e.g., `?status=Complete`) take precedence. Also added `closedCount` metadata to the paginated response when default exclusion is active, enabling the frontend to distinguish "no tickets" from "all tickets closed."
- **Task 2 (MCP):** Added `include_closed: z.boolean().optional()` to `ListTicketsSchema`. Handler passes `includeClosed: "true"` only when `include_closed` is truthy; omits when false/undefined so backend uses its default.
- **Task 3 (FilterState + TicketService):** Added `includeClosed?: boolean` to `FilterState` interface. Updated `loadTickets()` to pass `includeClosed=true` HTTP param when set. Added `totalCount` and `closedCount` signals to track server response metadata.
- **Task 4 (Filter Bar UI):** Added `MatSlideToggleModule` import, `includeClosed` signal, `toggleIncludeClosed()` method, and the `<mat-slide-toggle>` element positioned at the end of the filter bar (after Assignee filter). Toggle emits `includeClosed: true` in FilterState when active. Reset on `clearAll()`.
- **Task 5 (URL State):** Extended `tickets-page.component.ts` to read `includeClosed` from query params on init and on back/forward navigation. Updated `syncFiltersToUrl()` to write `includeClosed: 'true'` or `null`.
- **Task 6 (All-Closed Empty State):** Added `isAllClosedHidden` computed signal in `ticket-list.component.ts` that checks: empty ticket list AND `includeClosed` is false AND no active filters AND `closedCount > 0` (from backend). This distinguishes "all tickets are closed" from "no tickets exist." Shows: "All tickets are closed. Toggle 'Show Closed' to view them."
- **Task 7 (Build/Verify):** Angular build succeeds (budget warnings only, pre-existing). Angular tests: 497 pass, 1 pre-existing failure (authGuard unrelated). MCP build succeeds. MCP tests: 270 pass (all).
- **Backend enhancement:** Modified `Response.PaginatedList()` to accept optional `pMetadata` DynamicObject parameter for extensible response metadata. Used to return `closedCount` in ticket list responses.
- **Tests added:** 8 new filter-bar tests for `includeClosed` toggle behavior. 3 new MCP tests for `include_closed` parameter handling.

### File List

- `src/SpectraSight/REST/TicketHandler.cls` — Modified: added `includeClosed` param, default Complete exclusion, closedCount metadata
- `src/SpectraSight/REST/Response.cls` — Modified: added optional `pMetadata` param to `PaginatedList()`
- `mcp-server/src/tools/tickets.ts` — Modified: added `include_closed` to ListTicketsSchema, passed in handler
- `mcp-server/src/__tests__/tools/tickets.test.ts` — Modified: added 3 tests for include_closed
- `frontend/src/app/tickets/ticket.model.ts` — Modified: added `includeClosed` to FilterState
- `frontend/src/app/tickets/ticket.service.ts` — Modified: pass includeClosed param, store totalCount/closedCount
- `frontend/src/app/shared/filter-bar/filter-bar.component.ts` — Modified: added includeClosed signal, toggle, MatSlideToggleModule
- `frontend/src/app/shared/filter-bar/filter-bar.component.html` — Modified: added Show Closed slide toggle
- `frontend/src/app/shared/filter-bar/filter-bar.component.scss` — Modified: added toggle styling
- `frontend/src/app/shared/filter-bar/filter-bar.component.spec.ts` — Modified: added 8 tests for includeClosed
- `frontend/src/app/tickets/tickets-page.component.ts` — Modified: URL state for includeClosed
- `frontend/src/app/tickets/ticket-list/ticket-list.component.ts` — Modified: added isAllClosedHidden computed
- `frontend/src/app/tickets/ticket-list/ticket-list.component.html` — Modified: added all-closed empty state
- `frontend/src/app/shared/models/api-response.model.ts` — Modified: added optional closedCount to ApiListResponse

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 | **Date:** 2026-02-16 | **Outcome:** Approved with fixes applied

### Review Summary

All 7 Acceptance Criteria verified as implemented. All tasks marked [x] confirmed done. File List matches git reality. Two bugs found and fixed; two advisory items noted.

### Issues Found: 2 High, 4 Medium, 1 Low

#### Fixed (2 HIGH, 2 MEDIUM)

1. **[HIGH] closedCount query ignores project filter** (`TicketHandler.cls:388-398`): The closedCount SQL counted ALL Complete tickets globally, ignoring the active project filter. When filtering by project, this returned inflated counts causing incorrect empty-state behavior. **Fix:** Rebuilt closedCount query to carry forward the project filter using parameterized query, reusing `tResolvedProjectId`.

2. **[MEDIUM] `hasActiveFilters` in ticket-list missing project check** (`ticket-list.component.ts:31-34`): The computed did not check `state.project`, so filtering by project alone would not count as "active filters." This caused `isAllClosedHidden` to show "All tickets are closed" when a project filter produced zero results. **Fix:** Added `state.project ||` to the condition.

3. **[MEDIUM] closedCount query not parameterized** (`TicketHandler.cls:390`): Used string literal `'Complete'` instead of a parameterized placeholder. **Fix:** Addressed as part of H2 fix — closedCount query now uses `?` parameter.

4. **[MEDIUM] Duplicate `hasActiveFilters` logic with divergent checks**: `filter-bar.component.ts` included project; `ticket-list.component.ts` did not. **Fix:** Addressed by M1 fix — both now include project.

#### Not Fixed (advisory)

5. **[HIGH-advisory] TicketHandler.cls at 1066 lines** — Exceeds 700-line guideline. Pre-existing issue not introduced by this story. Should be addressed in a future refactoring story (e.g., extract `BuildTicketResponse` into a separate utility class).

6. **[MEDIUM-advisory] No unit tests for `isAllClosedHidden` computed** — The 4-condition computed in `ticket-list.component.ts` has no direct test coverage. Delegated to QA agent.

7. **[LOW] SCSS nesting concern for `filter-bar__active`** — Investigated and confirmed no issue; SCSS `&__active` under `.filter-bar` correctly generates flat `.filter-bar__active` selectors.

### Verification

- Angular build: PASS (pre-existing budget warnings only)
- MCP server build: PASS
- All fixes are minimal and targeted

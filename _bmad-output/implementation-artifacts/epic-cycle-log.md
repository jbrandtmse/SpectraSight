# Epic Cycle Log

## Story 1.1: Project Scaffold & Ticket Data Model

**Status:** COMPLETE
**Commits:**
- `542d5a8` — chore: initial project setup with BMAD framework and planning artifacts
- `1a2e111` — feat(1.1): implement Project Scaffold & Ticket Data Model
- `114ade2` — test(1.1): add automated tests for Project Scaffold & Ticket Data Model

**Files Touched:**
- `src/SpectraSight/Model/Ticket.cls` — Base %Persistent ticket class
- `src/SpectraSight/Model/Bug.cls`, `Task.cls`, `Story.cls`, `Epic.cls` — Ticket subclasses
- `src/SpectraSight/Model/Activity.cls` — Base activity class
- `src/SpectraSight/Model/Comment.cls`, `StatusChange.cls`, `AssignmentChange.cls`, `CodeReferenceChange.cls` — Activity subclasses
- `src/SpectraSight/Model/CodeReference.cls` — Code reference model
- `src/SpectraSight/Test/TestTicket.cls` — 8 CRUD + polymorphic query tests
- `src/SpectraSight/Test/TestActivity.cls` — Activity hierarchy tests
- `src/SpectraSight/Test/TestCodeReference.cls` — CodeReference tests
- `src/SpectraSight/Test/Runner.cls` — SqlProc test runner
- `frontend/` — Angular 18 scaffold with Material M3 theme
- `.gitignore` — Project gitignore

**Key Design Decisions:**
- Angular CLI v18.2.21 used (v21 not available in environment)
- `%OnNew` callbacks skip `##super()` call due to IRIS 2025.1 MPP5386 limitation
- Azure palette used as closest M3 match to slate blue #4A6FA5; exact colors via CSS variables
- IRIS MCP tools had license allocation issues; compilation done via Atelier REST API

**Issues Auto-Resolved:**
- 4 HIGH: Missing Try/Catch in %OnNew/%OnBeforeSave callbacks (code review auto-fix)

**User Input Required:** None

## Story 1.2: REST API for Ticket Operations

**Status:** COMPLETE
**Commits:**
- `3dbbd2d` — feat(1.2): implement REST API for Ticket Operations
- `21b82cd` — fix(1.2): code review fixes for REST API
- `f115e4a` — test(1.2): add automated tests for REST API for Ticket Operations

**Files Touched:**
- `src/SpectraSight/REST/Dispatch.cls` — REST dispatch/routing class
- `src/SpectraSight/REST/TicketHandler.cls` — Ticket CRUD REST handler
- `src/SpectraSight/REST/Response.cls` — REST response envelope helper
- `src/SpectraSight/Util/TicketID.cls` — SS-{id} formatting utility
- `src/SpectraSight/Util/Validation.cls` — Input validation utility
- `src/SpectraSight/Util/ActivityRecorder.cls` — Server-side activity recording
- `src/SpectraSight/Util/Setup.cls` — IRIS setup/configuration
- `src/SpectraSight/Test/TestREST.cls` — 13 REST API tests

**Key Design Decisions:**
- REST dispatch via `%CSP.REST` with `XData UrlMap`
- `%DynamicObject` for JSON serialization with `HandleCorsRequest = 1`
- Response envelope pattern with status/data/error fields

**Issues Auto-Resolved:**
- 5 HIGH: Catch blocks leaked internal exception details via `ex.DisplayString()` (info disclosure vulnerability)

**User Input Required:** None

## Story 1.3: App Shell & Split Panel Layout

**Status:** COMPLETE
**Commits:**
- `7659719` — feat(1.3): implement App Shell & Split Panel Layout
- `b4ba996` — test(1.3): add automated tests for App Shell & Split Panel Layout

**Files Touched:**
- 52 frontend files — Full Angular app shell with login, toolbar, sidenav, split panel
- `frontend/src/app/core/error.interceptor.ts` — HTTP error interceptor
- `frontend/src/app/core/error.interceptor.spec.ts` — Interceptor tests
- `frontend/src/app/shared/pipes/relative-time.pipe.spec.ts` — Pipe tests
- `frontend/src/app/shared/status-badge/status-badge.component.spec.ts` — Badge tests
- `frontend/src/app/shared/type-icon/type-icon.component.spec.ts` — Icon tests
- `frontend/src/app/tickets/ticket-list/ticket-row.component.spec.ts` — Row tests
- `frontend/src/app/tickets/ticket.service.spec.ts` — Service tests

**Key Design Decisions:**
- Angular Material M3 with split panel layout
- Auth interceptor with login 401 guard to prevent double-handling
- Theme toggle with dark/light mode support

**Issues Auto-Resolved:**
- 1 HIGH: Login 401 double-handling bug (errorInterceptor + login component both reacted)

**User Input Required:** None

## Story 1.4: Ticket List View

**Status:** COMPLETE
**Commits:**
- `d467d80` — feat(1.4): implement Ticket List View
- `66a844c` — test(1.4): add automated tests for Ticket List View

**Files Touched:**
- `frontend/src/app/tickets/ticket-list/ticket-list.component.ts` — ViewChildren fix (read: ElementRef)
- `frontend/src/app/tickets/ticket-list/ticket-list.component.spec.ts` — 16 tests
- `frontend/src/app/tickets/tickets-page.component.spec.ts` — 6 tests
- `frontend/src/app/tickets/ticket.service.spec.ts` — 14 tests
- `frontend/src/app/shared/type-icon/type-icon.component.spec.ts` — 11 tests
- `frontend/src/app/shared/status-badge/status-badge.component.spec.ts` — 9 tests
- `frontend/src/app/shared/pipes/relative-time.pipe.spec.ts` — 9 tests
- `frontend/src/app/tickets/ticket-list/ticket-row.component.spec.ts` — 15 tests

**Key Design Decisions:**
- Audit-only development — all code from Story 1.3 already satisfied AC
- Code reviewer caught @ViewChildren missing { read: ElementRef } breaking keyboard scroll

**Issues Auto-Resolved:**
- 1 HIGH: @ViewChildren read option missing (code review)

**User Input Required:** None

## Story 1.5: Ticket Detail View & Inline Editing

**Status:** COMPLETE
**Commits:**
- `2c18b33` — feat(1.5): implement Ticket Detail View & Inline Editing
- `e35d710` — test(1.5): add automated tests for Ticket Detail View & Inline Editing

**Files Touched:**
- `frontend/src/app/tickets/ticket-detail/` — New detail component (ts/html/scss)
- `frontend/src/app/tickets/ticket.model.ts` — Type-specific fields added
- `frontend/src/app/tickets/tickets-page.component.ts` — Detail panel integration
- `frontend/src/app/shared/inline-edit/inline-edit.component.ts` — Escape key fix
- `frontend/src/app/shared/field-dropdown/field-dropdown.component.ts` — Escape key fix

**Key Design Decisions:**
- Full new build — ticket-detail component created from scratch
- Reused existing shared components (inline-edit, field-dropdown, type-icon, status-badge)

**Issues Auto-Resolved:**
- 3 HIGH: Escape key propagation, numeric field coercion, missing label
- 1 MEDIUM: Unused import

**User Input Required:** None

## Story 1.6: Ticket Creation & Deletion

**Status:** COMPLETE
**Commits:**
- `d3e95b1` — feat(1.6): implement Ticket Creation & Deletion
- `e643f4c` — test(1.6): add automated tests for Ticket Creation & Deletion

**Files Touched:**
- `frontend/src/app/tickets/ticket-create/` — New create component with reactive form
- `frontend/src/app/tickets/confirm-delete-dialog/` — New delete confirmation dialog
- `frontend/src/app/tickets/ticket.service.ts` — createTicket/deleteTicket methods
- `frontend/src/app/tickets/ticket-detail/` — Delete button integration
- `frontend/src/app/tickets/tickets-page.component.ts` — Ctrl+N shortcut, create form

**Key Design Decisions:**
- Reactive form with validation (title + type required)
- MatDialog for delete confirmation with ticket ID in body
- Ctrl+N keyboard shortcut for new ticket creation

**Issues Auto-Resolved:**
- 2 HIGH: Missing delete tests, missing create/Ctrl+N tests
- 2 MEDIUM: Missing output tests, dialog title documentation

**User Input Required:** None

## Story 2.1: Ticket Hierarchy & Navigation

**Status:** COMPLETE
**Commits:**
- `6130c9a` — feat(2.1): implement Ticket Hierarchy & Navigation
- `1d3f0fa` — test(2.1): add automated tests for Ticket Hierarchy & Navigation

**Files Touched:**
- `src/SpectraSight/Model/Ticket.cls` — Added parent property
- `src/SpectraSight/REST/TicketHandler.cls` — Parent/child endpoints, hierarchy validation in CRUD
- `src/SpectraSight/Util/Validation.cls` — ValidateHierarchy method (Epic>Story>Task rules)
- `frontend/src/app/shared/hierarchy-breadcrumb/` — New breadcrumb component
- `frontend/src/app/tickets/ticket-create/` — Parent autocomplete field
- `frontend/src/app/tickets/ticket-detail/` — Children list, breadcrumb, add-subtask
- `frontend/src/app/tickets/ticket.model.ts` — Parent/children type definitions
- `frontend/src/app/tickets/tickets-page.component.ts` — creatingParentId signal
- `src/SpectraSight/Test/TestHierarchy.cls` — 14 IRIS hierarchy tests
- Frontend spec files — 37 new Angular tests

**Key Design Decisions:**
- Hierarchy validation in Validation.cls: Epic->Story, Story->Task, Bug->any parent
- Breadcrumb component loads ancestor chain via recursive parent lookups
- Parent autocomplete with hierarchy rule warning (computed signal)

**Issues Auto-Resolved:**
- 2 HIGH: Bare Quit inside Try block refactored; duplicate parentId parse/open consolidated
- 3 MEDIUM: Empty catch block logging, non-reactive hierarchy warning, hardcoded breadcrumb width
- 2 LOW: Add-subtask hidden for Bugs, unused method removed

**User Input Required:** None

## Story 2.2: List Filtering, Sorting & Search

**Status:** COMPLETE
**Commits:**
- `67efc94` — feat(2.2): implement List Filtering, Sorting & Search
- `83eb383` — test(2.2): add automated tests for List Filtering, Sorting & Search

**Files Touched:**
- `frontend/src/app/shared/filter-bar/` — New filter bar component (ts/html/scss/spec)
- `frontend/src/app/tickets/ticket.model.ts` — FilterState interface
- `frontend/src/app/tickets/ticket.service.ts` — Filter state signal, setFilters(), debounced search
- `frontend/src/app/tickets/tickets-page.component.ts` — Filter bar integration, URL state sync, "/" shortcut
- `frontend/src/app/tickets/ticket-list/ticket-list.component.ts` — Sort column headers, filtered empty state
- `frontend/src/app/tickets/ticket-list/ticket-row.component.html` — Priority column
- `src/SpectraSight/REST/TicketHandler.cls` — Multi-value type/status filters, ExecuteWithParams helper
- `src/SpectraSight/Test/TestFilter.cls` — IRIS filter/sort/search tests

**Key Design Decisions:**
- Filter bar with multi-select type/status chips, priority/assignee dropdowns, debounced search
- URL state management via Router.navigate + ActivatedRoute.queryParamMap for browser history
- "/" keyboard shortcut to focus search (skips when in input/textarea)
- Comma-separated multi-value filters with OR for type subqueries, IN for status

**Issues Auto-Resolved:**
- 4 issues fixed during code review
- 1 SQL bug: table name translation fixed (schema-qualified name instead of replacing all dots)

**User Input Required:** None

## Story 2.3: Code Reference Fields

**Status:** COMPLETE
**Commits:**
- `0f99512` — feat(2.3): implement Code Reference Fields
- `dae3602` — test(2.3): add automated tests for Code Reference Fields

**Files Touched:**
- `src/SpectraSight/REST/ClassHandler.cls` — New class/method introspection handler
- `src/SpectraSight/REST/Dispatch.cls` — Added 4 new routes (classes, methods, code-references CRUD)
- `src/SpectraSight/REST/TicketHandler.cls` — AddCodeReference, RemoveCodeReference, codeReferences in BuildTicketResponse
- `src/SpectraSight/Util/ActivityRecorder.cls` — RecordCodeReferenceChange method
- `src/SpectraSight/Test/TestREST.cls` — Extended with code reference endpoint tests
- `frontend/src/app/code-references/code-reference.service.ts` — New service for class/method listing and CRUD
- `frontend/src/app/code-references/code-reference.service.spec.ts` — Service tests
- `frontend/src/app/code-references/code-reference-field/` — New ss-code-reference component (ts/html/scss/spec)
- `frontend/src/app/tickets/ticket-detail/` — Integrated code reference field
- `frontend/src/app/tickets/ticket.model.ts` — CodeReference interface

**Key Design Decisions:**
- ClassHandler queries %Dictionary.ClassDefinition/MethodDefinition for autocomplete
- Code references as one-to-many from Ticket via existing CodeReference model
- Activity recording (CodeReferenceChange) on add/remove, server-side only
- ss-code-reference component with mat-autocomplete, monospace display, signals

**Issues Auto-Resolved:**
- 4 issues fixed during code review
- 24 new QA tests added (IRIS + Angular)

**User Input Required:** None

## Story 3.1: Activity Timeline & Actor Attribution

**Status:** COMPLETE
**Commits:**
- `2562707` — feat(3.1): implement Activity Timeline & Actor Attribution
- `386297d` — test(3.1): add automated tests for Activity Timeline & Actor Attribution

**Files Touched:**
- `src/SpectraSight/REST/TicketHandler.cls` — ListActivity, BuildActivityEntry methods
- `src/SpectraSight/REST/Dispatch.cls` — Activity route
- `src/SpectraSight/Test/TestREST.cls` — 5 new activity timeline tests
- `frontend/src/app/activity/activity.model.ts` — TypeScript activity interfaces (union type)
- `frontend/src/app/activity/activity.service.ts` — Activity HTTP service with signals
- `frontend/src/app/activity/activity-timeline/` — New ss-activity-timeline component (ts/html/scss/spec)
- `frontend/src/app/tickets/ticket-detail/` — Timeline integration with refresh trigger

**Key Design Decisions:**
- Polymorphic query on Activity extent with `$CLASSNAME()` for subclass detection
- Human and agent entries use identical template — no visual differentiation (FR25)
- Activity refresh via `activityRefreshTrigger` signal incremented after mutations
- Subscription cancellation to prevent race conditions on rapid ticket switching

**Issues Auto-Resolved:**
- 3 MEDIUM: Silent catch logging, subscription race condition, `allowSignalWrites` anti-pattern
- 5 new IRIS QA tests + 13 dev-authored Angular tests

**User Input Required:** None

## Story 3.2: Comment System

**Status:** COMPLETE
**Commits:**
- `9f6d514` — feat(3.2): implement Comment System
- `670740e` — test(3.2): add automated tests for Comment System

**Files Touched:**
- `src/SpectraSight/REST/TicketHandler.cls` — AddComment method with body + actorType validation
- `src/SpectraSight/REST/Dispatch.cls` — POST /tickets/:id/comments route
- `src/SpectraSight/Test/TestComment.cls` — 8 new IRIS comment tests
- `frontend/src/app/activity/activity.service.ts` — addComment() with optimistic UI
- `frontend/src/app/activity/activity.service.spec.ts` — 10 new Angular service tests
- `frontend/src/app/activity/comment-form/` — New ss-comment-form component (ts/html/scss/spec — 14 dev tests)
- `frontend/src/app/tickets/ticket-detail/` — Comment form integration below timeline

**Key Design Decisions:**
- Optimistic UI: temp comment appended immediately, replaced on server success, removed on error
- Expanding textarea (40px → 100px on focus) with disabled submit when empty
- Code review added optional actorType extraction from request body with whitelist validation (human/agent)
- Separate TestComment.cls created (TestREST.cls exceeded 700-line limit)

**Issues Auto-Resolved:**
- 1 MEDIUM: AddComment hard-coded actorType="human" — added optional actorType from request body with whitelist validation
- 2 LOW remaining: Missing spinner/disabled-textarea tests (cosmetic, not auto-resolved)

**User Input Required:** None

## Story 4.1: MCP Server with Ticket Operations

**Status:** COMPLETE
**Commits:**
- `8ffb1e6` — feat(4.1): implement MCP Server with Ticket Operations
- `7e4f861` — test(4.1): add automated tests for MCP Server with Ticket Operations

**Files Touched:**
- `mcp-server/package.json` — New MCP server project (spectrasight-mcp v0.1.0)
- `mcp-server/tsconfig.json` — TypeScript config (ES2022/Node16)
- `mcp-server/src/index.ts` — Server entry point with stdio transport
- `mcp-server/src/config.ts` — Env var config (SPECTRASIGHT_URL/USERNAME/PASSWORD)
- `mcp-server/src/api-client.ts` — HTTP client wrapping REST API with Basic Auth
- `mcp-server/src/errors.ts` — Shared error formatting (extracted during code review)
- `mcp-server/src/types.ts` — TypeScript types + TICKET_ID_PATTERN regex
- `mcp-server/src/tools/tickets.ts` — 5 tools: create, get, update, delete, list
- `mcp-server/src/tools/comments.ts` — add_comment tool (actorType: "agent")
- `mcp-server/src/__tests__/` — 5 test files, 43 Vitest tests
- `.gitignore` — Added mcp-server/build/ and mcp-server/node_modules/

**Key Design Decisions:**
- Thin translation layer wrapping existing REST API (no direct IRIS access)
- Node.js built-in fetch (no axios) to minimize dependencies
- Zod schemas with SS-\d+ regex for ticket_id validation (path injection prevention)
- snake_case MCP params mapped to camelCase REST body
- add_comment always sets actorType: "agent"
- Vitest for testing (TypeScript-native, ESM-compatible)

**Issues Auto-Resolved:**
- 2 HIGH: Password leaked to stderr in defaults log, duplicated formatError extracted to shared module
- 4 MEDIUM: Path injection via unvalidated ticket_id, Content-Type on bodyless requests, empty PUT guard, duplicated TICKET_ID_PATTERN constant
- 3 LOW remaining: Negative page numbers, no Content-Type response validation, missing engines field

**User Input Required:** None

## Story 4.2: MCP Configuration & Connection Testing

**Status:** COMPLETE
**Commits:**
- `c085a2d` — feat(4.2): implement MCP Configuration & Connection Testing
- `037b771` — test(4.2): add automated tests for MCP Configuration & Connection Testing

**Files Touched:**
- `mcp-server/src/api-client.ts` — Enhanced error messages for ECONNREFUSED, ETIMEDOUT, 401, 403; auth checks before JSON parsing
- `mcp-server/src/index.ts` — Startup connection validation (non-blocking), connection tool registration
- `mcp-server/src/tools/connection.ts` — New test_connection MCP tool
- `mcp-server/tsconfig.json` — Excluded test files from build output
- `mcp-server/README.md` — Setup docs with build/config/client-setup/troubleshooting
- `mcp-server/src/__tests__/api-client.test.ts` — 9 new dev tests + expect.assertions() guards
- `mcp-server/src/__tests__/tools/connection.test.ts` — 8 dev tests for test_connection tool
- `mcp-server/src/__tests__/qa-story-4-2.test.ts` — 32 QA tests (README accuracy, config warnings, error format, startup validation, edge cases)

**Key Design Decisions:**
- 401/403 auth checks moved before JSON parsing (handles non-JSON IRIS error pages)
- Startup validation is non-blocking — logs warning but doesn't prevent server start
- test_connection tool calls GET /tickets?page=1&pageSize=1 for lightweight verification
- Shared formatError() utility used consistently across all tools
- README includes real MCP client config JSON example

**Issues Auto-Resolved:**
- 1 HIGH: 401/403 auth checks after JSON parsing (non-JSON body caused PARSE_ERROR instead of AUTH_FAILED)
- 4 MEDIUM: Hardcoded toolCount, manual error formatting in connection.ts, missing expect.assertions(), startup validation before transport connection
- 3 LOW remaining: README testing section, manual TOOL_COUNT sync, default creds in docs

**User Input Required:** None

## Story 4.3: MCP Full Parity — Type-Specific Fields & Tools

**Status:** COMPLETE
**Commits:**
- `34ebafe` — feat(4.3): implement MCP Full Parity — Type-Specific Fields & Tools
- `b6b6924` — test(4.3): add automated tests for MCP Full Parity — Type-Specific Fields & Tools

**Files Touched:**
- `mcp-server/src/tools/tickets.ts` — Added type-specific fields to CreateTicketSchema & UpdateTicketSchema (bug, task, story, epic)
- `mcp-server/src/tools/code-references.ts` — New: add_code_reference, remove_code_reference tools
- `mcp-server/src/tools/activity.ts` — New: list_activity tool
- `mcp-server/src/tools/connection.ts` — TOOL_COUNT 7 → 10
- `mcp-server/src/index.ts` — Register new tool modules (code-references, activity)
- `mcp-server/README.md` — Documented 3 new tools, updated count references
- `mcp-server/src/__tests__/tools/code-references.test.ts` — New: 8 unit tests
- `mcp-server/src/__tests__/tools/activity.test.ts` — New: 6 unit tests
- `mcp-server/src/__tests__/tools/tickets.test.ts` — 7 new type-specific field mapping tests
- `mcp-server/src/__tests__/tools/connection.test.ts` — Updated expected tool count to 10
- `mcp-server/src/__tests__/qa-story-4-2.test.ts` — Fixed stale descriptions, added new tool names
- `mcp-server/src/__tests__/qa-story-4-3.test.ts` — New: 46 QA tests covering all 10 ACs

**Key Design Decisions:**
- Type-specific fields added as optional params on create/update (flat schema, not nested by type)
- Snake_case MCP params mapped to camelCase REST API fields in handler body
- No backend (IRIS/ObjectScript) changes needed — all REST endpoints already existed
- Followed exact same pattern from Stories 4.1/4.2: Zod schemas → api-client call → JSON result

**Issues Auto-Resolved:**
- 3 MEDIUM: README not updated with new tools, stale QA test descriptions, incomplete tool name verification

**User Input Required:** None

## Story 5.1: Project Data Model & Default Project

**Status:** COMPLETE
**Commits:**
- `5cbd331` — feat(5.1): implement Project data model and default project
- `92afbbd` — test(5.1): add automated tests for Project Data Model & Default Project

**Files Touched:**
- `src/SpectraSight/Model/Project.cls` — NEW: Project %Persistent class with prefix, sequence counter, timestamps
- `src/SpectraSight/Model/Ticket.cls` — Added Project reference, SequenceNumber properties, storage values 10-11
- `src/SpectraSight/Util/TicketID.cls` — Rewritten for multi-project prefix support with backward compatibility
- `src/SpectraSight/Util/Setup.cls` — Added EnsureDefaultProject migration method
- `src/SpectraSight/REST/TicketHandler.cls` — Project assignment in CreateTicket (atomic locking), projectId/projectPrefix in BuildTicketResponse
- `src/SpectraSight/Test/TestProject.cls` — 6 unit tests for Project model
- `src/SpectraSight/Test/TestProjectIntegration.cls` — 11 integration tests (prefix validation, TicketID, response fields, migration, sequencing)

**Key Design Decisions:**
- Atomic sequence counter via LOCK +^SpectraSight.Model.ProjectD for concurrent safety
- Backward-compatible TicketID: falls back to SS-{ID} for tickets without Project/SequenceNumber
- EnsureDefaultProject migration assigns existing tickets to SS project with SequenceNumber = internal ID
- Prefix validation in %OnBeforeSave: uppercase alphanumeric, 2-10 chars

**Issues Auto-Resolved:**
- 3 HIGH: Prefix validation missing, lock-not-released path, silenced %Save errors
- 2 MEDIUM: Inconsistent error handling in migration, missing sequenceNumber in response

**User Input Required:** None

## Story 5.2: Project-Scoped Ticket Numbering

**Status:** COMPLETE
**Commits:**
- `bf3b547` — feat(5.2): verify project-scoped ticket numbering and add integration tests

**Files Touched:**
- `src/SpectraSight/Test/TestProjectIntegration.cls` — Added 4 new tests (sequential numbering, independent numbering, default project assignment, CRUD round-trip)

**Key Design Decisions:**
- No production code changes needed — Story 5.1 fully implemented all functionality
- Code review skipped (test-only changes, production code already reviewed in 5.1)
- 4 integration tests added to verify all 7 ACs

**Issues Auto-Resolved:** None (verification story)

**User Input Required:** None

## Story 5.3: Project REST API & MCP Tools

**Status:** COMPLETE
**Commits:**
- `9d012c5` — feat(5.3): implement Project REST API & MCP Tools
- `5cf2170` — test(5.3): add automated tests for Project REST API & MCP Tools

**Files Touched:**
- `src/SpectraSight/REST/ProjectHandler.cls` — NEW: Full CRUD handler (ListProjects, CreateProject, GetProject, UpdateProject, DeleteProject)
- `src/SpectraSight/REST/Dispatch.cls` — Added 5 project routes (/projects, /projects/:id)
- `src/SpectraSight/REST/Response.cls` — Added Conflict(409) and Forbidden(403) convenience methods + 403 in GetHttpStatusText
- `src/SpectraSight/REST/TicketHandler.cls` — Added project filter to ListTickets (accepts prefix string or numeric ID)
- `mcp-server/src/types.ts` — Updated TICKET_ID_PATTERN from /^SS-\d+$/ to /^[A-Z]{2,10}-\d+$/
- `mcp-server/src/tools/projects.ts` — NEW: list_projects and create_project MCP tools
- `mcp-server/src/tools/tickets.ts` — Added project param to list_tickets, updated ID format descriptions
- `mcp-server/src/index.ts` — Registered project tools
- `mcp-server/src/tools/connection.ts` — TOOL_COUNT 10 → 12
- `src/SpectraSight/Test/TestProjectREST.cls` — NEW: 20 QA tests

**Key Design Decisions:**
- ProjectHandler follows exact same Abstract class pattern as TicketHandler
- BuildProjectResponse includes ticketCount (SQL aggregate) for UI display
- Project filter resolves prefix via SQL lookup, falls back to -1 for unknown prefix (empty results)
- Default SS project protected from deletion via 403 Forbidden
- Prefix immutability enforced at handler level (400 if body contains prefix field)
- MCP TICKET_ID_PATTERN broadened to accept any 2-10 char uppercase prefix

**Issues Auto-Resolved:** Code review fixes applied

**User Input Required:** None

## Story 5.4: Project Configuration UI & List Filter

**Status:** COMPLETE
**Feat Commit:** `ab74b07` — feat(5.4): implement Project Configuration UI & List Filter
**Test Commit:** `879fc3a` — test(5.4): add automated tests for Project Configuration UI & List Filter
**Completed:** 2026-02-16

**Files Touched:**
- `frontend/src/app/core/settings/projects/project.model.ts` — NEW: Project interfaces
- `frontend/src/app/core/settings/projects/project.service.ts` — NEW: Project HTTP + signals
- `frontend/src/app/core/settings/projects/project.service.spec.ts` — NEW: 7 unit tests
- `frontend/src/app/core/settings/projects/project-list.component.ts` — NEW: Project CRUD UI
- `frontend/src/app/core/settings/projects/project-list.component.html` — NEW: Template
- `frontend/src/app/core/settings/projects/project-list.component.scss` — NEW: Styles
- `frontend/src/app/core/settings/projects/project-list.component.spec.ts` — NEW: 12 unit tests
- `frontend/src/app/core/settings/settings.component.ts` — Converted to tabbed layout
- `frontend/src/app/core/settings/settings.component.spec.ts` — NEW: 2 unit tests
- `frontend/src/app/tickets/ticket.model.ts` — Added project to FilterState
- `frontend/src/app/shared/filter-bar/filter-bar.component.ts` — Added project filter signal/input
- `frontend/src/app/shared/filter-bar/filter-bar.component.html` — Added project dropdown
- `frontend/src/app/shared/filter-bar/filter-bar.component.spec.ts` — Added project filter tests
- `frontend/src/app/tickets/tickets-page.component.ts` — Wired project service + filter
- `frontend/src/app/tickets/tickets-page.component.spec.ts` — Updated for project service
- `frontend/src/app/tickets/ticket.service.ts` — Added project param to loadTickets
- `frontend/src/app/tickets/ticket.service.spec.ts` — Added project param test
- `frontend/angular.json` — Budget increase for MatTabsModule

**Key Design Decisions:**
- Settings page uses mat-tab-group (General + Projects tabs), extensible for Users tab in Epic 6
- ProjectListComponent uses signal-driven inline forms (no reactive forms) — consistent with filter-bar pattern
- Project dropdown is first filter element per UX spec, single-select with "All Projects" default
- URL sync uses ?project=DATA prefix format matching backend API expectation
- Delete guards: default project (SS) always disabled, projects with tickets disabled with tooltip

**Issues Auto-Resolved:** 3 HIGH (missing error handlers on subscribe), 2 MEDIUM (mat-error without FormControl, MatSnackBar inject)

**User Input Required:** None

---

## Epic 5: Multi-Project Support — COMPLETE

All 4 stories done. Epic 5 delivered project model, scoped ticket numbering, REST API + MCP tools, and configuration UI with list filter.

---

## Story 6.1: User Mapping Data Model & REST API

**Status:** COMPLETE
**Feat Commit:** `21d1072` — feat(6.1): implement User Mapping Data Model & REST API
**Test Commit:** `f8bcdc3` — test(6.1): add automated tests for User Mapping Data Model & REST API
**Completed:** 2026-02-16

**Files Touched:**
- `src/SpectraSight/Model/UserMapping.cls` — NEW: UserMapping %Persistent class with IrisUsername (unique), DisplayName, IsActive, timestamps
- `src/SpectraSight/REST/UserHandler.cls` — NEW: Full CRUD handler (List, Create, Get, Update, Delete) with isActive filter, duplicate guard, ticket assignment check
- `src/SpectraSight/REST/Dispatch.cls` — Added 5 user routes (/users, /users/:id)
- `src/SpectraSight/Test/TestUserMapping.cls` — NEW: Unit tests for UserMapping model CRUD
- `src/SpectraSight/Test/TestREST.cls` — Extended with user endpoint tests
- `src/SpectraSight/Test/TestUserREST.cls` — NEW: QA REST endpoint tests (639 lines)

**Key Design Decisions:**
- UserMapping follows exact same %Persistent + %JSON.Adaptor pattern as Project.cls
- UserHandler follows exact same Abstract ClassMethod pattern as ProjectHandler.cls
- Delete guard checks ticket assignment by matching DisplayName against Ticket.Assignee field
- isActive filter supports true/false/omitted (returns all)
- Duplicate username returns 400, ticket-assigned user returns 409 Conflict on delete

**Issues Auto-Resolved:** Code review fixes applied

**User Input Required:** None

## Story 6.2: User Mapping Configuration UI

**Status:** COMPLETE
**Feat Commit:** `713a5bd` — feat(6.2): implement User Mapping Configuration UI
**Test Commit:** `c4ff48c` — test(6.2): add automated tests for User Mapping Configuration UI
**Completed:** 2026-02-17

**Files Touched:**
- `frontend/src/app/core/settings/users/user-mapping.model.ts` — NEW: TypeScript interfaces
- `frontend/src/app/core/settings/users/user-mapping.service.ts` — NEW: HTTP service with signals
- `frontend/src/app/core/settings/users/user-list.component.ts` — NEW: User CRUD UI with mat-table
- `frontend/src/app/core/settings/users/user-list.component.html` — NEW: Template with inline forms
- `frontend/src/app/core/settings/users/user-list.component.scss` — NEW: Styles with inactive row muting
- `frontend/src/app/core/settings/settings.component.ts` — MODIFIED: Added Users tab

**Key Design Decisions:**
- Follows exact same signal-driven pattern as ProjectListComponent
- isActive toggle uses optimistic UI: immediate visual update, revert on error
- Inactive rows styled with opacity: 0.5 via .inactive-row CSS class
- IRIS Username read-only after creation; only DisplayName editable
- Delete handles 409 Conflict from API (no pre-check needed)

**Issues Auto-Resolved:** Code review fixes applied

**User Input Required:** None

## Story 6.3: Assignee Dropdowns from Mapped Users

**Status:** COMPLETE
**Feat Commit:** `43fa701` — feat(6.3): implement Assignee Dropdowns from Mapped Users
**Test Commit:** `cd8876f` — test(6.3): add automated tests for Assignee Dropdowns from Mapped Users
**Completed:** 2026-02-16

**Files Touched:**
- `frontend/src/app/core/settings/users/user-mapping.service.ts` — MODIFIED: Added `activeUsers`, `activeUserNames` computed signals, `ensureLoaded()`, `findByIrisUsername()`
- `frontend/src/app/core/settings/users/user-mapping.service.spec.ts` — MODIFIED: Added tests for new signals and methods
- `frontend/src/app/tickets/ticket-detail/ticket-detail.component.ts` — MODIFIED: Injected UserMappingService, `activeUserNames` computed
- `frontend/src/app/tickets/ticket-detail/ticket-detail.component.html` — MODIFIED: Switched assignee from freeText to options dropdown
- `frontend/src/app/tickets/ticket-detail/ticket-detail.component.spec.ts` — MODIFIED: Added Story 6.3 tests
- `frontend/src/app/tickets/ticket-create/ticket-create.component.ts` — MODIFIED: Injected UserMappingService, `activeUserNames` computed
- `frontend/src/app/tickets/ticket-create/ticket-create.component.html` — MODIFIED: Replaced text input with `mat-select` for assignee
- `frontend/src/app/tickets/ticket-create/ticket-create.component.spec.ts` — MODIFIED: Added Story 6.3 tests
- `frontend/src/app/tickets/tickets-page.component.ts` — MODIFIED: Injected UserMappingService, `assigneeOptions` computed
- `frontend/src/app/tickets/tickets-page.component.spec.ts` — MODIFIED: Added Story 6.3 test
- `frontend/src/app/core/app-shell/sidenav.component.ts` — MODIFIED: Refactored to computed navItems, dynamic My Tickets resolution, snackbar
- `frontend/src/app/core/app-shell/sidenav.component.spec.ts` — MODIFIED: Rewrote tests for signal-based navItems, AC#3/#4 tests

**Key Design Decisions:**
- Assignee field stores display name (string), consistent across REST, MCP, filter bar, and My Tickets
- UserMappingService extended with computed signals for active user filtering (client-side)
- My Tickets resolves IRIS username to display name via `findByIrisUsername()` (case-insensitive)
- No-mapping case shows snackbar with "Go to Settings" action navigation
- Filter bar assignee options fall back to ticket-derived assignees when no user mappings loaded

**Issues Auto-Resolved:** 3 code review fixes (duplicate describe block, misleading test name, missing snackbar navigation test)

**User Input Required:** None

## Story 6.4: MCP User Identity Selection

**Status:** COMPLETE
**Feat Commit:** `7031817` — feat(6.4): implement MCP User Identity Selection
**Test Commit:** `5c6b2f3` — test(6.4): add automated tests for MCP User Identity Selection
**Completed:** 2026-02-17

**Files Touched:**
- `src/SpectraSight/Util/ActivityRecorder.cls` — MODIFIED: Added `ResolveActor()`, `ResolveActorType()` class methods for REST-layer actor validation
- `src/SpectraSight/REST/TicketHandler.cls` — MODIFIED: Updated 5 mutation handlers (CreateTicket, UpdateTicket, AddComment, AddCodeReference, RemoveCodeReference) to use resolved actor
- `mcp-server/src/user-identity.ts` — NEW: User identity resolution module with 60s TTL cache
- `mcp-server/src/tools/tickets.ts` — MODIFIED: Added `user` param to schemas, `resolveUser()` in handlers
- `mcp-server/src/tools/comments.ts` — MODIFIED: Added `user` param, replaced hardcoded actorType
- `mcp-server/src/tools/code-references.ts` — MODIFIED: Added `user` param to both schemas, `resolveUser()` in handlers
- `mcp-server/src/api-client.ts` — MODIFIED: Extended `del()` to accept optional body
- `mcp-server/src/index.ts` — MODIFIED: Updated 3 registration calls to pass config
- `mcp-server/src/__tests__/user-identity.test.ts` — NEW: 9 tests for identity resolution
- `mcp-server/src/__tests__/qa-story-6-4.test.ts` — NEW: QA tests for all 8 ACs

**Key Design Decisions:**
- Two-layer validation: MCP validates user against active mappings, REST API also validates actorName
- User parameter uses display name (not IRIS username), consistent with Story 6.3 pattern
- Graceful fallback: config IRIS username used as-is when no user mapping exists
- 60s TTL cache in MCP server for active user list to avoid per-call API requests
- TOOL_COUNT remains 12 — user is a parameter on existing tools, not a new tool
- Extended api-client `del()` to accept body for identity passing on remove_code_reference

**Issues Auto-Resolved:** Code review fixes applied; 15 pre-existing test failures in qa-story-4-3 fixed after signature changes

**User Input Required:** None

## Story 6.5: Closed Ticket Filtering

**Status:** COMPLETE
**Feat Commit:** `f9fe03f` — feat(6.5): implement Closed Ticket Filtering
**Test Commit:** `cc933e3` — test(6.5): add automated tests for Closed Ticket Filtering
**Completed:** 2026-02-17

**Files Touched:**
- `src/SpectraSight/REST/TicketHandler.cls` — MODIFIED: Added `includeClosed` query param, default `Status != 'Complete'` WHERE clause, `closedCount` metadata
- `src/SpectraSight/REST/Response.cls` — MODIFIED: Added optional `pMetadata` DynamicObject param to `PaginatedList()` for extensible response metadata
- `mcp-server/src/tools/tickets.ts` — MODIFIED: Added `include_closed: z.boolean().optional()` to ListTicketsSchema, passes `includeClosed: "true"` when truthy
- `mcp-server/src/__tests__/tools/tickets.test.ts` — MODIFIED: Added 3 tests for include_closed parameter
- `frontend/src/app/tickets/ticket.model.ts` — MODIFIED: Added `includeClosed?: boolean` to FilterState
- `frontend/src/app/tickets/ticket.service.ts` — MODIFIED: Passes `includeClosed=true` HTTP param, stores `totalCount`/`closedCount` signals
- `frontend/src/app/shared/filter-bar/filter-bar.component.ts` — MODIFIED: Added `includeClosed` signal, `toggleIncludeClosed()`, `MatSlideToggleModule`
- `frontend/src/app/shared/filter-bar/filter-bar.component.html` — MODIFIED: Added `<mat-slide-toggle>` "Show Closed" at end of filter bar
- `frontend/src/app/shared/filter-bar/filter-bar.component.scss` — MODIFIED: Added toggle styling
- `frontend/src/app/shared/filter-bar/filter-bar.component.spec.ts` — MODIFIED: Added 8 tests for includeClosed toggle
- `frontend/src/app/tickets/tickets-page.component.ts` — MODIFIED: URL state management for `includeClosed` query param
- `frontend/src/app/tickets/ticket-list/ticket-list.component.ts` — MODIFIED: Added `isAllClosedHidden` computed signal
- `frontend/src/app/tickets/ticket-list/ticket-list.component.html` — MODIFIED: Added all-closed empty state message
- `frontend/src/app/shared/models/api-response.model.ts` — MODIFIED: Added optional `closedCount` to `ApiListResponse`
- `frontend/src/app/tickets/ticket-list/ticket-list.component.spec.ts` — NEW: 109 lines of QA tests
- `frontend/src/app/tickets/ticket.service.spec.ts` — MODIFIED: 61 lines of QA tests
- `frontend/src/app/tickets/tickets-page.component.spec.ts` — MODIFIED: 69 lines of QA tests

**Key Design Decisions:**
- Default exclusion pattern: "exclude Complete by default, include on demand" — not a hard filter
- Three override mechanisms: UI toggle (`?includeClosed=true`), explicit status filter (`?status=Complete`), MCP `include_closed: true`
- `closedCount` metadata returned in paginated response enables frontend to distinguish "no tickets" from "all tickets closed"
- `PaginatedList()` extended with generic `pMetadata` parameter (iterates DynamicObject keys into response envelope) for future extensibility
- All-closed empty state uses computed signal checking: empty list + includeClosed off + no other filters + closedCount > 0

**Issues Auto-Resolved:** 2 bugs fixed during code review

**User Input Required:** None

---

## Epic 6: User Management & Agent Identity — COMPLETE

All 5 stories done. Epic 6 delivered user mapping data model + REST API, configuration UI, assignee dropdowns from mapped users, MCP user identity selection, and closed ticket filtering.

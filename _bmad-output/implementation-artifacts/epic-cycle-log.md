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

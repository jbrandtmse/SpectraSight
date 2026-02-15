---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - product-brief-SpectraSight-2026-02-14.md
  - prd.md
  - prd-validation-report.md
  - ux-design-specification.md
workflowType: 'architecture'
project_name: 'SpectraSight'
user_name: 'Developer'
date: '2026-02-15'
lastStep: 8
status: 'complete'
completedAt: '2026-02-15'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
35 FRs across 7 capability areas: Ticket Management (FR1-9), Organization & Hierarchy (FR10-13), Code Integration (FR14-16), Search & Navigation (FR17-21), Collaboration & Activity (FR22-25), AI Agent Operations (FR26-31), Installation & Configuration (FR32-35). The AI agent operations (FR26-31) are served by the MCP server, which itself consumes the REST API — making functional parity a natural outcome of the architecture rather than a separate engineering challenge.

**Non-Functional Requirements:**
- Performance: page loads <5s, REST API responses <3s, MCP ≤150% of REST (achievable since MCP adds only a thin translation layer over REST), 1,000 ticket capacity
- Security: all REST endpoints require IRIS authentication; MCP server authenticates to REST using configured IRIS credentials
- Reliability: IRIS `%Persistent` storage guarantees, auto-recovery within 60s of IRIS restart, structured JSON error responses from REST
- Integration: standard MCP protocol (stdio transport), standard REST/JSON API

**Scale & Complexity:**

- Primary domain: Full-stack (Angular SPA + IRIS REST API + MCP server)
- Complexity level: Medium — well-scoped MVP with clear boundaries
- Core architectural pattern: **REST API as single gateway** — both the Angular SPA and MCP server are consumers of the same REST API, which is the sole interface to the IRIS `%Persistent` data layer

### Technical Constraints & Dependencies

- **Platform:** InterSystems IRIS — all backend logic in ObjectScript, data in `%Persistent` classes, REST via `%CSP.REST` dispatch
- **Front end:** Angular SPA with Angular Material v3 (density -2), Chromium browsers only
- **MCP server:** stdio transport, thin wrapper over REST API, launched per-agent session
- **No external dependencies:** no Node.js server, no external database — IRIS hosts everything (REST API, static SPA files)
- **ObjectScript `%Persistent` inheritance:** base Ticket class extended by Bug, Task, Story, Epic subclasses. Polymorphic querying across subclasses needed for mixed-type list views and filtering

### Cross-Cutting Concerns Identified

1. **Authentication** — IRIS credentials used by both SPA (user login) and MCP server (configured credentials), all flowing through REST
2. **Activity/event tracking** — unified timeline model recording status changes, comments, assignments, and code reference changes from any actor (human or AI agent) with consistent attribution
3. **Polymorphic ticket querying** — filtering, sorting, and searching across `%Persistent` subclasses for mixed-type list views
4. **Structured error handling** — consistent JSON error responses from REST (HTTP status code, error code, message), surfaced cleanly in both SPA and MCP
5. **Code reference resolution** — querying IRIS for available ObjectScript classes and methods to support autocomplete in the SPA

## Starter Template Evaluation

### Primary Technology Domain

Full-stack: Angular SPA + InterSystems IRIS REST API + MCP Server (TypeScript). The technology stack is determined by the product's core value proposition — IRIS-native hosting and ObjectScript integration — not by starter template availability.

### Starter Options Considered

**Frontend — Angular CLI v21.x:**
The standard Angular scaffolding tool. No competing options considered — Angular is specified in the PRD and UX spec. Angular Material (M3 design system) is the chosen design system.

**Backend — InterSystems `iris-rest-api-template`:**
Community template providing `%CSP.REST` CRUD patterns with Swagger. Useful as a reference pattern for REST dispatch and `%Persistent` CRUD, but not a direct scaffold since SpectraSight installs on an existing IRIS instance rather than a Docker container. ObjectScript classes are authored directly.

**MCP Server — TypeScript MCP SDK (`@modelcontextprotocol/sdk`):**
Official ModelContextProtocol TypeScript SDK. Provides stdio and HTTP transports, tool/resource/prompt registration, and Zod schema validation. TypeScript chosen over Python for consistency with the frontend toolchain (npm/Node.js ecosystem).

### Selected Approach: Component-Specific Scaffolding

No single starter template covers SpectraSight's full stack. Each layer uses its ecosystem's standard tooling:

**Frontend Initialization:**

```bash
ng new spectrasight-ui --routing --style=scss --standalone --strict
cd spectrasight-ui
ng add @angular/material
```

**Backend Initialization:**
ObjectScript classes created directly on the IRIS instance. Package structure:
- `SpectraSight.Model.*` — `%Persistent` ticket classes
- `SpectraSight.REST.*` — `%CSP.REST` dispatch and route handlers
- `SpectraSight.Util.*` — shared utilities

**MCP Server Initialization:**

```bash
mkdir spectrasight-mcp
cd spectrasight-mcp
npm init -y
npm install @modelcontextprotocol/sdk zod
```

### Architectural Decisions Provided by Starters

**Language & Runtime:**
- Frontend: TypeScript (Angular CLI strict mode)
- Backend: ObjectScript (IRIS native)
- MCP Server: TypeScript (Node.js)

**Styling Solution:**
SCSS with Angular Material M3 theming system — custom color palette and density tokens per UX spec

**Build Tooling:**
- Frontend: Angular CLI (esbuild-based), `ng build` produces static files for IRIS web server
- Backend: IRIS class compiler (no external build)
- MCP Server: TypeScript compiled to JS, or ts-node for development

**Testing Framework:**
- Frontend: Jasmine/Karma (Angular CLI default) or migrate to Vitest
- Backend: `%UnitTest` framework (IRIS native)
- MCP Server: Vitest or Jest

**Code Organization:**
- Frontend: Angular standalone component architecture, smart/dumb pattern per UX spec
- Backend: ObjectScript package hierarchy (`SpectraSight.*`)
- MCP Server: Tool definitions mapping to REST endpoints

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data model: `%Persistent` class hierarchy for Tickets and Activities
- Ticket ID strategy: IRIS auto-increment, displayed as `SS-{id}`
- REST API as single gateway for SPA and MCP server
- Authentication: HTTP Basic Auth via IRIS credentials
- Monorepo structure with `/src` for ObjectScript classes

**Important Decisions (Shape Architecture):**
- Polymorphic querying via SQL on base class extents
- Activity class hierarchy for unified timeline
- Separate `CodeReference` class (one-to-many from Ticket)
- Angular Signals + Services for state management
- Offset-based pagination

**Deferred Decisions (Post-MVP):**
- API versioning (not needed until external consumers exist)
- Rate limiting (internal tool, small team)
- Monitoring/logging infrastructure (IRIS built-in logging sufficient for MVP)
- CI/CD pipeline (manual deployment acceptable for MVP)

### Data Architecture

**Ticket Model — `%Persistent` Class Hierarchy:**

```
SpectraSight.Model.Ticket (base)
  ├── SpectraSight.Model.Bug
  ├── SpectraSight.Model.Task
  ├── SpectraSight.Model.Story
  └── SpectraSight.Model.Epic
```

- Base `Ticket` class: title, description, status, priority, assignee, parent ticket reference, created/updated timestamps
- Subclasses extend with type-specific fields
- Ticket ID: IRIS native `%Persistent` auto-increment ID. Displayed as `SS-{id}` at the API layer (prefix prepended in REST responses, stripped on input)
- Polymorphic list queries: SQL against the base `Ticket` extent (`SELECT * FROM SpectraSight_Model.Ticket`) returns all subclass rows. Filtering by type, status, priority, assignee via SQL `WHERE` clauses
- Single-ticket CRUD: `%Persistent` object API (`%OpenId`, `%Save`, `%DeleteId`)

**Activity Model — `%Persistent` Class Hierarchy:**

```
SpectraSight.Model.Activity (base)
  ├── SpectraSight.Model.Comment
  ├── SpectraSight.Model.StatusChange
  ├── SpectraSight.Model.AssignmentChange
  └── SpectraSight.Model.CodeReferenceChange
```

- Base `Activity` class: ticket reference, actor name, actor type (human/agent), timestamp
- Subclasses add action-specific fields (e.g., `Comment.Body`, `StatusChange.FromStatus`/`ToStatus`)
- Timeline query: SQL against base `Activity` extent, filtered by ticket ID, ordered by timestamp ascending

**Code Reference Model:**

```
SpectraSight.Model.CodeReference
```

- Fields: ticket reference, class name, method name (optional), added-by actor, timestamp
- One-to-many from Ticket
- Enables cross-ticket queries ("which tickets reference this class?") for post-MVP code viewing feature

### Authentication & Security

- **Method:** HTTP Basic Auth — IRIS username/password sent with every REST request
- **SPA:** Credentials entered on login, stored in memory (not localStorage), attached via Angular HTTP interceptor
- **MCP server:** IRIS credentials configured in MCP server config, passed to REST API on each call
- **No anonymous access:** All REST endpoints require valid IRIS credentials
- **CORS:** `Parameter HandleCorsRequest = 1` is **mandatory** in the `%CSP.REST` dispatch class for Angular integration. Required during development (`ng serve` on different port) and in production configurations where the SPA is served from a separate web server

### API & Communication Patterns

**REST API Implementation:**
- Dispatch class extends `%CSP.REST` with routes defined in `XData UrlMap`
- Use `%DynamicObject` for JSON request/response handling
- All methods return `%Status` (see ObjectScript Method Pattern below)

**REST API URL Structure:**

```
GET    /api/tickets              — list tickets (query params: type, status, priority, assignee, search, sort, page, pageSize)
GET    /api/tickets/:id          — get single ticket with full details
POST   /api/tickets              — create ticket
PUT    /api/tickets/:id          — update ticket fields
DELETE /api/tickets/:id          — delete ticket
GET    /api/tickets/:id/activity — get activity timeline for a ticket
POST   /api/tickets/:id/comments — add comment to a ticket
GET    /api/classes              — list available ObjectScript classes (autocomplete)
GET    /api/classes/:name/methods — list methods on a class (autocomplete)
```

**Pagination:** Offset-based — `?page=1&pageSize=25`. Sufficient for ≤1,000 tickets. Response includes `total`, `page`, `pageSize`, `totalPages`.

**Error Response Format:**

```json
{
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "Ticket SS-42 not found",
    "status": 404
  }
}
```

Consistent across all endpoints. Both SPA and MCP server parse the same error envelope.

### Frontend Architecture

- **State management:** Angular Signals + Services. No external state library. Service-per-resource pattern: `TicketService`, `ActivityService`, `CodeReferenceService`
- **HTTP layer:** Angular `HttpClient` with interceptors for auth (attach Basic Auth header) and error handling (catch API errors, display snackbar)
- **API URL configuration:** API base URL must be configurable via `environment.ts` — never hardcoded in services
- **Strict typing:** Avoid `any` wherever possible. TypeScript interfaces must match the JSON structure from the REST API. Map all HTTP responses to typed interfaces.
- **Component architecture:** Standalone Angular components, smart/dumb pattern per UX spec. Smart containers manage data and state; dumb components render UI
- **Routing:** Angular Router with URL state (`/tickets/SS-42`, `/tickets?status=open&type=bug`). Filter state reflected in URL for deep-linking and back/forward navigation

### Infrastructure & Deployment

**Source Code Organization — Monorepo:**

```
/spectrasight
  /src             — ObjectScript classes (required path for VS Code multi-root sync)
  /frontend        — Angular SPA
  /mcp-server      — TypeScript MCP server
  /docs            — documentation
  /_bmad-output    — BMAD planning artifacts
```

**SPA Serving:**
- **Development:** `ng serve` on `localhost:4200` with proxy config forwarding `/api/*` to IRIS on `localhost:52773`
- **Production (recommended):** `ng build` output served from IRIS's web server (same-origin, no CORS needed)
- **Production (alternative):** SPA served from a separate web server (Apache, nginx, etc.) with CORS enabled on the IRIS REST API

**Backend Deployment:**
ObjectScript classes imported/compiled on the IRIS instance via VS Code ObjectScript extension or `$System.OBJ.Load()`. No external build pipeline.

### Decision Impact Analysis

**Implementation Sequence:**
1. ObjectScript `%Persistent` class hierarchy (Ticket, Activity, CodeReference) — foundation everything builds on
2. `%CSP.REST` dispatch class with CRUD endpoints — enables frontend and MCP development
3. Angular SPA scaffold + Material setup — UI shell with split panel layout
4. MCP server scaffold + tool definitions — wraps REST endpoints
5. Integration testing across all three layers

**Cross-Component Dependencies:**
- REST API endpoint signatures are the contract between all three components. Define these first.
- Ticket ID format (`SS-{id}`) is applied at the REST layer — SPA and MCP server both receive and send prefixed IDs
- Activity timeline is populated by the REST API on every ticket mutation (status change, comment, assignment, code ref change) — frontend just reads it
- Authentication interceptor (SPA) and credential config (MCP) both target the same Basic Auth mechanism on the REST API

## Implementation Patterns & Consistency Rules

### Naming Patterns

**ObjectScript (Backend):**
- Classes: PascalCase with dot-separated packages — `SpectraSight.Model.Ticket`, `SpectraSight.REST.Dispatch`. **NO underscores** in class names.
- Properties: PascalCase — `Title`, `CreatedAt`, `ActorType`
- Methods: PascalCase — `GetById`, `UpdateStatus`, `ValidateTicket`. **NO underscores** in method names.
- Class Parameters: UPPERCASE — `JSONMAPPING`, `JSONFIELDNAME`, `HandleCorsRequest`
- Method Parameters: must start with `p` prefix — `pInput`, `pTicketId`, `pStatus`. **NO underscores.**
- Local Variables: must start with `t` prefix — `tSC`, `tTicket`, `tStatus`
- Macros: use `$$$` syntax — `$$$OK`, `$$$ISERR(tSC)`, `$$$AssertEquals`

**JSON API Fields:**
- camelCase for all JSON field names — `title`, `createdAt`, `actorType`, `pageSize`
- ObjectScript properties map to camelCase via `%JSONFIELDNAME` parameter on each property
- Example: Property `CreatedAt` → JSON `"createdAt"`

**Angular (Frontend):**
- File names: kebab-case — `ticket-list.component.ts`, `ticket.service.ts`
- Class names: PascalCase — `TicketListComponent`, `TicketService`
- Variables/methods: camelCase — `ticketList`, `getTicketById()`
- Follow Angular CLI defaults without exception

**MCP Server:**
- Tool names: snake_case — `create_ticket`, `list_tickets`, `update_ticket`, `add_comment`
- Tool parameters: snake_case — `ticket_id`, `ticket_type`, `page_size`
- Internal TypeScript: camelCase (standard TypeScript convention)

### Structure Patterns

**Angular Feature Organization (by feature, not by type):**

```
/frontend/src/app/
  /tickets/              — ticket list, detail, creation components + ticket service
  /shared/               — reusable components (ss-status-badge, ss-type-icon, etc.)
  /core/                 — auth interceptor, error handler, app shell, layout
```

**Angular Test Placement:**
Co-located — `ticket-list.component.spec.ts` next to `ticket-list.component.ts`. Angular CLI default.

**ObjectScript Package Organization:**

```
/src/SpectraSight/
  /Model/                — %Persistent classes (Ticket, Bug, Task, Story, Epic, Activity, Comment, etc.)
  /REST/                 — %CSP.REST dispatch and route handler classes
  /Util/                 — shared utilities, helpers
  /Test/                 — %UnitTest classes
```

**MCP Server Organization:**

```
/mcp-server/
  /src/
    index.ts             — server entry point, stdio transport setup
    /tools/              — one file per tool group (tickets.ts, comments.ts, classes.ts)
    /types/              — shared TypeScript interfaces matching API responses
  /tests/                — test files
  package.json
  tsconfig.json
```

### Format Patterns

**API Response Envelope:**
- Success (single item): `{ "data": { ... } }`
- Success (list): `{ "data": [...], "total": 42, "page": 1, "pageSize": 25, "totalPages": 2 }`
- Success (mutation): `{ "data": { ... } }` (return created/updated item)
- Error: `{ "error": { "code": "ERROR_CODE", "message": "Human-readable message", "status": 404 } }`

Every REST response is either `{ "data": ... }` or `{ "error": ... }`. Never raw objects or arrays at the top level.

**Date/Time:** ISO 8601 strings in all JSON — `"2026-02-15T14:30:00Z"`. Stored as `%TimeStamp` in ObjectScript, serialized to ISO 8601 via `%JSON.Adaptor`.

**Null Handling:** Omit null/empty fields from JSON responses. Angular handles missing fields with TypeScript optional types (`field?: string`).

**Ticket ID in API:** Always prefixed — `"SS-42"` in all JSON responses and URL paths. REST layer strips prefix on input (`SS-42` → `42` for `%OpenId`), prepends on output.

### Process Patterns

**ObjectScript Method Pattern:**
All ObjectScript methods must return `%Status` unless a specific return type is required. Use the standard Try/Catch pattern:

```objectscript
Method MyMethod(pInput As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        // Logic here
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}
```

**Critical:** Do NOT use `Quit` with arguments inside a `Try` block. Set a variable (e.g., `tSC`) and `Quit` after the `Catch` block. Abstract methods must still have a body with `{}` and return a value.

**Activity Recording:**
Every ticket mutation in the REST handler creates an `Activity` subclass entry server-side:
- Ticket creation → `Activity` entry (type: created)
- Status change → `StatusChange` entry (fromStatus, toStatus)
- Assignment change → `AssignmentChange` entry (fromAssignee, toAssignee)
- Comment added → `Comment` entry (body)
- Code reference added/removed → `CodeReferenceChange` entry (className, methodName, action)

The frontend and MCP server never create Activity entries directly — they only read them via `GET /api/tickets/:id/activity`.

**Optimistic UI (Angular):**
1. Component calls service method
2. Service updates local signal immediately (optimistic)
3. Service makes HTTP call to REST API
4. On success: snackbar confirmation, no further action
5. On failure: service reverts signal to previous value, show error snackbar

**Error Handling Per Layer:**
- **ObjectScript REST handlers:** Catch exceptions, return structured JSON error envelope. Never expose raw IRIS error text to clients.
- **Angular HTTP interceptor:** Parse error envelope, show snackbar. On 401, redirect to login.
- **MCP server:** Parse REST error envelope, translate to MCP error format. Pass through error code and message.

**Validation Strategy:**
- **Backend is authoritative** — all validation in ObjectScript REST handlers (required fields, valid enum values, valid parent-child relationships). Invalid data returns 400 + error envelope.
- **Frontend validates for UX** — required field indicators, immediate feedback. Never trusts client-side validation alone.
- **MCP server** — Zod schemas validate tool inputs before calling REST. Catches obvious errors early, improves agent experience.

**ObjectScript Unit Testing (`%UnitTest`):**
- Test classes extend `%UnitTest.TestCase`
- Use **macros only** for assertions — `$$$AssertEquals(actual, expected, msg)`, `$$$AssertTrue(condition, msg)`, `$$$AssertStatusOK(sc, msg)`
- Do NOT use method-style assertions (`..AssertEquals`), `$$$AssertFalse`, or `$$$AssertCondition` — they do not exist
- If `%OnNew` is needed, call `##super(initvalue)` and check `$$$ISERR(tSC)` before custom init logic

**ObjectScript Debugging:**
- Use `^ClaudeDebug` global: `SET ^ClaudeDebug = ""` to clear, `SET ^ClaudeDebug = ^ClaudeDebug_"info; "` to append
- For instance methods, create a temporary classmethod wrapper. Clean up temporary classes after debugging.

### Enforcement Guidelines

**All AI Agents MUST:**
1. Use camelCase for all JSON API field names (configure `%JSONFIELDNAME` in ObjectScript)
2. Follow Angular CLI naming conventions for all frontend files and classes
3. Use snake_case for MCP tool names and parameters
4. Record Activity entries server-side in REST handlers — never from the client
5. Return the `{ "data": ... }` / `{ "error": ... }` response envelope on all REST endpoints
6. Use ISO 8601 for all date/time values in JSON
7. Organize Angular code by feature, not by type
8. Place all data validation in ObjectScript — frontend validation is for UX only
9. Always return the created/updated object in mutation responses
10. Use `SS-{id}` format for ticket IDs in all API communication

**ObjectScript Critical Constraints:**
11. **NO underscores** in class names, method names, or parameter names
12. **NO `Quit` with arguments inside `Try` blocks** — set a variable and `Quit` after `Catch`
13. All methods return `%Status` unless a specific return type is required
14. Method parameters prefixed with `p`, local variables prefixed with `t`
15. Keep classes under **700 lines** — split logic into separate classes if larger
16. Do NOT specify a datatype for `[ MultiDimensional ]` properties
17. Use `$$$AssertEquals`, `$$$AssertTrue`, `$$$AssertStatusOK` macros in `%UnitTest` — never method-style assertions
18. Use `%DynamicObject` for JSON payload handling in REST handlers
19. Configure API base URL via `environment.ts` in Angular — never hardcode
20. Avoid `any` type in TypeScript — use typed interfaces matching API responses

## Project Structure & Boundaries

### Complete Project Directory Structure

```
spectrasight/
├── README.md
├── CLAUDE.md
├── SpectraSight.code-workspace          — VS Code multi-root workspace config
├── .gitignore
│
├── src/                                  — ObjectScript classes (VS Code sync path)
│   └── SpectraSight/
│       ├── Model/
│       │   ├── Ticket.cls                — base %Persistent ticket class
│       │   ├── Bug.cls                   — extends Ticket
│       │   ├── Task.cls                  — extends Ticket
│       │   ├── Story.cls                 — extends Ticket
│       │   ├── Epic.cls                  — extends Ticket
│       │   ├── Activity.cls              — base %Persistent activity class
│       │   ├── Comment.cls               — extends Activity
│       │   ├── StatusChange.cls          — extends Activity
│       │   ├── AssignmentChange.cls      — extends Activity
│       │   ├── CodeReferenceChange.cls   — extends Activity
│       │   └── CodeReference.cls         — %Persistent, one-to-many from Ticket
│       ├── REST/
│       │   ├── Dispatch.cls              — %CSP.REST main dispatch (URL routing)
│       │   ├── TicketHandler.cls         — ticket CRUD logic
│       │   ├── ActivityHandler.cls       — activity timeline queries
│       │   ├── CommentHandler.cls        — comment creation
│       │   ├── ClassHandler.cls          — ObjectScript class/method introspection
│       │   └── Response.cls              — shared response envelope helper
│       ├── Util/
│       │   ├── TicketID.cls              — SS-{id} prefix/strip logic
│       │   └── Validation.cls            — shared validation utilities
│       └── Test/
│           ├── TestTicket.cls            — %UnitTest for Ticket CRUD
│           ├── TestActivity.cls          — %UnitTest for Activity recording
│           ├── TestREST.cls              — %UnitTest for REST endpoints
│           └── TestCodeReference.cls     — %UnitTest for CodeReference
│
├── frontend/                             — Angular SPA
│   ├── angular.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── proxy.conf.json                   — dev proxy: /api/* → localhost:52773
│   └── src/
│       ├── index.html
│       ├── main.ts
│       ├── styles.scss                   — global styles, Material theme
│       ├── app/
│       │   ├── app.component.ts          — root component (toolbar + sidenav + router-outlet)
│       │   ├── app.routes.ts             — route definitions
│       │   ├── core/
│       │   │   ├── auth.interceptor.ts   — Basic Auth header attachment
│       │   │   ├── error.interceptor.ts  — API error handling + snackbar
│       │   │   ├── auth.service.ts       — credential storage (in-memory)
│       │   │   ├── login.component.ts    — login form
│       │   │   └── app-shell/
│       │   │       ├── toolbar.component.ts
│       │   │       └── sidenav.component.ts
│       │   ├── tickets/
│       │   │   ├── ticket.service.ts          — HTTP calls + signals for ticket state
│       │   │   ├── ticket.model.ts            — TypeScript interfaces (Ticket, Bug, Task, etc.)
│       │   │   ├── ticket-list/
│       │   │   │   ├── ticket-list.component.ts       — smart container
│       │   │   │   ├── ticket-list.component.spec.ts
│       │   │   │   └── ticket-list.component.scss
│       │   │   ├── ticket-detail/
│       │   │   │   ├── ticket-detail.component.ts     — smart container
│       │   │   │   ├── ticket-detail.component.spec.ts
│       │   │   │   └── ticket-detail.component.scss
│       │   │   ├── ticket-create/
│       │   │   │   ├── ticket-create.component.ts
│       │   │   │   ├── ticket-create.component.spec.ts
│       │   │   │   └── ticket-create.component.scss
│       │   │   └── split-panel/
│       │   │       ├── split-panel.component.ts       — D3 resizable layout
│       │   │       ├── split-panel.component.spec.ts
│       │   │       └── split-panel.component.scss
│       │   ├── activity/
│       │   │   ├── activity.service.ts
│       │   │   ├── activity.model.ts
│       │   │   ├── activity-timeline/
│       │   │   │   ├── activity-timeline.component.ts
│       │   │   │   ├── activity-timeline.component.spec.ts
│       │   │   │   └── activity-timeline.component.scss
│       │   │   └── comment-form/
│       │   │       ├── comment-form.component.ts
│       │   │       └── comment-form.component.spec.ts
│       │   ├── code-references/
│       │   │   ├── code-reference.service.ts
│       │   │   ├── code-reference.model.ts
│       │   │   └── code-reference-field/
│       │   │       ├── code-reference-field.component.ts
│       │   │       └── code-reference-field.component.spec.ts
│       │   └── shared/
│       │       ├── status-badge/
│       │       │   └── status-badge.component.ts
│       │       ├── type-icon/
│       │       │   └── type-icon.component.ts
│       │       ├── hierarchy-breadcrumb/
│       │       │   └── hierarchy-breadcrumb.component.ts
│       │       ├── filter-bar/
│       │       │   └── filter-bar.component.ts
│       │       └── models/
│       │           └── api-response.model.ts  — { data, error } envelope types
│       └── assets/
│           └── icons/                    — ticket type SVG icons
│
├── mcp-server/                           — TypeScript MCP server
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                      — entry point, stdio transport, server setup
│       ├── config.ts                     — IRIS REST API URL + credentials config
│       ├── api-client.ts                 — HTTP client wrapping REST API calls
│       ├── tools/
│       │   ├── tickets.ts                — create_ticket, list_tickets, get_ticket, update_ticket, delete_ticket
│       │   ├── comments.ts               — add_comment, list_activity
│       │   └── classes.ts                — list_classes, list_methods
│       └── types/
│           ├── ticket.ts                 — TypeScript interfaces matching API
│           └── activity.ts
│
├── docs/                                 — project documentation
│
└── _bmad-output/                         — BMAD planning artifacts
    ├── planning-artifacts/
    └── implementation-artifacts/
```

### Architectural Boundaries

**Data Layer Boundary (ObjectScript `%Persistent`):**
- All data access goes through `%Persistent` classes in `SpectraSight.Model.*`
- No direct SQL from REST handlers — model classes encapsulate queries
- `%JSON.Adaptor` on all model classes handles JSON serialization with camelCase field mapping

**REST API Boundary (`SpectraSight.REST.*`):**
- `Dispatch.cls` is the single entry point — maps URLs to handler methods
- Handler classes (`TicketHandler`, `ActivityHandler`, etc.) contain business logic
- `Response.cls` provides helper methods for `{ "data": ... }` and `{ "error": ... }` envelope formatting
- All validation lives here — model classes persist, handlers validate

**Frontend-to-Backend Boundary:**
- Angular services (`ticket.service.ts`, etc.) are the sole point of contact with the REST API
- Components never call `HttpClient` directly — always through services
- Services own the signals (state) and expose them to components
- Interceptors handle auth and errors transparently

**MCP-to-REST Boundary:**
- `api-client.ts` is the sole HTTP client — all tool handlers call through it
- Tool files in `/tools/` define MCP tool schemas and map to `api-client` calls
- No direct data access — MCP server is purely a REST API consumer

### Requirements to Structure Mapping

**FR1-9 (Ticket Management):**
- Backend: `Model/Ticket.cls` + subclasses, `REST/TicketHandler.cls`
- Frontend: `tickets/` feature folder (list, detail, create components + service)
- MCP: `tools/tickets.ts`

**FR10-13 (Hierarchy & Organization):**
- Backend: `Model/Ticket.cls` (parent reference property), `REST/TicketHandler.cls` (hierarchy queries)
- Frontend: `shared/hierarchy-breadcrumb/`, child list in `ticket-detail/`

**FR14-16 (Code Integration):**
- Backend: `Model/CodeReference.cls`, `REST/ClassHandler.cls` (introspection)
- Frontend: `code-references/` feature folder
- MCP: `tools/classes.ts`

**FR17-21 (Search & Navigation):**
- Backend: `REST/TicketHandler.cls` (query params: filter, sort, search, pagination)
- Frontend: `shared/filter-bar/`, `tickets/ticket-list/`, `tickets/split-panel/`

**FR22-25 (Collaboration & Activity):**
- Backend: `Model/Activity.cls` + subclasses, `REST/ActivityHandler.cls`, `REST/CommentHandler.cls`
- Frontend: `activity/` feature folder (timeline, comment form)
- MCP: `tools/comments.ts`

**FR26-31 (AI Agent Operations):**
- MCP: all files in `mcp-server/` — tools mirror REST endpoints

**FR32-35 (Installation & Configuration):**
- `README.md` — setup instructions
- `SpectraSight.code-workspace` — VS Code workspace config
- `frontend/proxy.conf.json` — dev proxy config
- `mcp-server/src/config.ts` — MCP server connection config

### Data Flow

```
Human User → Angular SPA → HTTP (Basic Auth) → IRIS REST API → %Persistent → IRIS Storage
AI Agent   → MCP Server  → HTTP (Basic Auth) → IRIS REST API → %Persistent → IRIS Storage
```

Both paths converge at the REST API. Activity entries are created server-side on every mutation, ensuring a complete audit trail regardless of the originating client.

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** Pass
All technology choices are compatible: Angular 21 + Angular Material (M3) + SCSS, ObjectScript on IRIS with `%Persistent` + `%JSON.Adaptor` + `%CSP.REST`, TypeScript MCP SDK with stdio transport. Basic Auth works identically for SPA and MCP consumers. camelCase JSON mapping via `%JSONFIELDNAME` is supported by `%JSON.Adaptor`. No version conflicts or contradictory decisions.

**Pattern Consistency:** Pass
Naming conventions are layer-appropriate and non-overlapping: PascalCase (ObjectScript), camelCase (JSON/TypeScript), kebab-case (Angular files), snake_case (MCP tools). Response envelope is consistent across all endpoints. Activity recording is always server-side. Validation is consistently backend-authoritative.

**Structure Alignment:** Pass
Monorepo with `/src` for ObjectScript aligns with VS Code multi-root sync. Feature-based Angular organization maps to FR categories. MCP server `/tools/` mirrors REST endpoint groupings. Test placement follows each ecosystem's conventions.

### Requirements Coverage Validation

**Functional Requirements — 35/35 covered:**

| FR Range | Category | Architectural Support |
|----------|----------|----------------------|
| FR1-9 | Ticket Management | `Model/Ticket.cls` hierarchy + `REST/TicketHandler.cls` + `tickets/` frontend + `tools/tickets.ts` |
| FR10-13 | Hierarchy | Parent reference on Ticket + breadcrumb component + REST hierarchy queries |
| FR14-16 | Code Integration | `CodeReference.cls` + `ClassHandler.cls` + `code-references/` frontend |
| FR17-21 | Search & Navigation | SQL polymorphic queries + filter-bar + split-panel + offset pagination |
| FR22-25 | Collaboration | Activity hierarchy + `ActivityHandler.cls` + `CommentHandler.cls` + `activity/` frontend |
| FR26-31 | AI Agent Ops | MCP server tools mirror REST API — automatic parity |
| FR32-35 | Installation | README + workspace config + proxy config + MCP config |

**Non-Functional Requirements — all addressed:**
- Performance: Simple SQL queries, offset pagination, 1,000 ticket scale — within targets (<5s page load, <3s API, MCP ≤150% of REST)
- Security: Basic Auth on all endpoints, no anonymous access, CORS configurable
- Reliability: IRIS `%Persistent` storage guarantees, structured JSON error envelope, auto-recovery within 60s
- Integration: Standard MCP protocol (stdio), standard REST/JSON

### Implementation Readiness Validation

**Decision Completeness:** All critical and important decisions documented with rationale and technology versions verified.

**Structure Completeness:** Every file has a defined location. All 35 FRs map to specific directories and files.

**Pattern Completeness:** All 10 enforcement rules cover the primary conflict points between AI agents. Naming, format, structure, and process patterns are comprehensive.

### Gap Analysis Results

**Critical Gaps:** 0

**Important Gaps:** 1 (resolved)
- Ticket detail API response scope: `GET /api/tickets/:id` includes `children` array (id, title, status, type only) and `codeReferences` array in the response. Activity timeline remains a separate call (`GET /api/tickets/:id/activity`). Detail panel requires 2 HTTP calls total.

**Nice-to-Have Gaps:** 1 (documented)
- ObjectScript class introspection (`GET /api/classes`, `GET /api/classes/:name/methods`) uses IRIS `%Dictionary.ClassDefinition` and `%Dictionary.MethodDefinition`. Implementation detail, not an architectural gap.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (medium, 1,000 tickets)
- [x] Technical constraints identified (IRIS platform, Angular, MCP stdio)
- [x] Cross-cutting concerns mapped (auth, activity, polymorphic queries, errors, code refs)

**Architectural Decisions**
- [x] Critical decisions documented (data model, ID strategy, REST gateway, auth, monorepo)
- [x] Technology stack fully specified (Angular 21, IRIS, TypeScript MCP SDK)
- [x] Integration patterns defined (REST API as single gateway)
- [x] Performance considerations addressed (pagination, query strategy, 1k scale)

**Implementation Patterns**
- [x] Naming conventions established (per-layer conventions documented)
- [x] Structure patterns defined (feature-based Angular, ObjectScript packages, MCP tools)
- [x] Format patterns specified (response envelope, dates, null handling, ticket IDs)
- [x] Process patterns documented (activity recording, optimistic UI, error handling, validation)

**Project Structure**
- [x] Complete directory structure defined (all files and directories)
- [x] Component boundaries established (data, REST, frontend, MCP)
- [x] Integration points mapped (REST API is the single integration surface)
- [x] Requirements to structure mapping complete (all 35 FRs mapped)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- REST API as single gateway eliminates three-interface complexity
- `%Persistent` class hierarchy mirrors the domain model naturally
- Activity recording is server-side only — guarantees complete audit trail
- MCP-REST parity is automatic by design
- Clear enforcement rules prevent AI agent divergence

**Areas for Future Enhancement:**
- API versioning when external consumers appear
- WebSocket/SSE for real-time UI updates (currently manual refresh)
- Rate limiting if exposed publicly
- CI/CD pipeline for automated deployment

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions

**First Implementation Priority:**
1. Create ObjectScript `%Persistent` class hierarchy (Ticket + subclasses, Activity + subclasses, CodeReference)
2. Create `%CSP.REST` dispatch class with ticket CRUD endpoints + response envelope
3. Scaffold Angular SPA with `ng new` + Angular Material + split panel layout
4. Scaffold MCP server with tool definitions wrapping REST endpoints
5. Integration testing across all three layers

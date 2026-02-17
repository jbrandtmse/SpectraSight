---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - prd.md
  - architecture.md
  - ux-design-specification.md
  - docs/context.md
---

# SpectraSight - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for SpectraSight, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Ticket Management (FR1-FR9)**
- FR1: Users can create tickets of type Bug, Task, Story, or Epic
- FR2: Users can view the full details of any ticket
- FR3: Users can update any field on an existing ticket
- FR4: Users can delete tickets
- FR5: Users can view and set standard fields on any ticket: title, description, status, priority, and assignee
- FR6: Users can view and set type-specific fields unique to each ticket type
- FR7: Users can set ticket status to Open, In Progress, Blocked, or Complete
- FR8: Users can set ticket priority to Low, Medium, High, or Critical
- FR9: Users can assign tickets to a human user or an AI agent

**Ticket Organization & Hierarchy (FR10-FR13)**
- FR10: Users can create parent-child relationships between tickets (Epic > Story > Task)
- FR11: Users can link Bug tickets to any other ticket type
- FR12: Users can navigate from a parent ticket to its children and from a child to its parent
- FR13: Users can create tickets without assigning a parent — hierarchy linkages are optional

**Code Integration (FR14-FR16)**
- FR14: Users can add ObjectScript class references to any ticket
- FR15: Users can add ObjectScript method references to any ticket
- FR16: Users can view code references as structured fields separate from the free-text description

**Search & Navigation (FR17-FR21)**
- FR17: Users can view a list of all tickets across types
- FR18: Users can filter the ticket list by ticket type, status, priority, and assignee
- FR19: Users can sort the ticket list by any standard field
- FR20: Users can search tickets by text content (title, description)
- FR21: Users can view a ticket detail page showing all fields, hierarchy context, code references, and comments

**Collaboration & Activity (FR22-FR25)**
- FR22: Users can add comments to any ticket through the web UI
- FR23: AI agents can add comments to any ticket via MCP
- FR24: Users can view the full comment history and activity trail on a ticket
- FR25: Users can see the author (human user or AI agent) of each comment

**AI Agent Operations (FR26-FR31)**
- FR26: AI agents can create tickets via MCP
- FR27: AI agents can read full ticket details via MCP
- FR28: AI agents can update ticket fields (including status, assignee, and other fields) via MCP
- FR29: AI agents can list and filter tickets via MCP
- FR30: AI agents can close or complete tickets via MCP
- FR31: AI agents can query tickets by type, status, assignee, and other fields via MCP

**Installation & Configuration (FR32-FR35)**
- FR32: Administrators can install SpectraSight on an existing IRIS instance
- FR33: Administrators can configure authentication for API access
- FR34: Users can configure an MCP client to connect to the SpectraSight MCP server
- FR35: Users can test the MCP connection to verify it is working

### NonFunctional Requirements

**Performance**
- NFR1: Page load times for list views and ticket detail pages must be under 5 seconds
- NFR2: REST API operations (CRUD, queries) must complete within 3 seconds under normal load
- NFR3: MCP server operation response times must not exceed 150% of equivalent REST API response times
- NFR4: System must handle up to 1,000 tickets while maintaining page load and API response time targets
- NFR5: Text search and filtering operations must return results within the same page load time targets

**Security**
- NFR6: All REST API endpoints require IRIS authentication — no anonymous access to ticket data
- NFR7: MCP server connections authenticate using IRIS credentials passed via server configuration
- NFR8: API authentication uses IRIS's built-in user/password mechanism (HTTP Basic Auth)
- NFR9: Ticket data is accessible only to authenticated users — no public endpoints

**Reliability**
- NFR10: Ticket data is persisted through IRIS's built-in storage engine with no data loss under normal operation
- NFR11: System recovers automatically from IRIS instance restarts — service resumes without manual intervention within 60 seconds
- NFR12: Comment and activity data is persisted with the same reliability guarantees as ticket data
- NFR13: REST API returns structured JSON error responses (HTTP status code, error code, human-readable message) for invalid operations

**Integration**
- NFR14: MCP server achieves functional parity with REST API — every ticket operation available through REST is also available through MCP
- NFR15: REST API uses standard JSON request/response format
- NFR16: MCP server follows the standard MCP protocol specification for tool definitions
- NFR17: Front end communicates with IRIS back end via standard HTTP REST calls

### Additional Requirements

**From Architecture — Data Model:**
- `%Persistent` class hierarchy: base Ticket class extended by Bug, Task, Story, Epic subclasses
- Activity model hierarchy: base Activity class extended by Comment, StatusChange, AssignmentChange, CodeReferenceChange
- Separate CodeReference class (one-to-many from Ticket)
- Ticket ID: IRIS auto-increment, displayed as `SS-{id}` at REST layer (prefix on output, strip on input)
- Polymorphic list queries: SQL against base Ticket extent returns all subclass rows

**From Architecture — API & Communication:**
- REST API as single gateway — both SPA and MCP server consume the same REST API
- Response envelope: `{ "data": ... }` for success, `{ "error": { "code", "message", "status" } }` for errors
- HTTP Basic Auth for all endpoints (SPA via interceptor, MCP via configured credentials)
- Offset-based pagination: `?page=1&pageSize=25`
- camelCase JSON field names via `%JSONFIELDNAME` parameter on ObjectScript properties
- REST URL structure: `/api/tickets`, `/api/tickets/:id`, `/api/tickets/:id/activity`, `/api/tickets/:id/comments`, `/api/classes`, `/api/classes/:name/methods`
- CORS: `HandleCorsRequest = 1` mandatory in dispatch class

**From Architecture — Implementation:**
- Monorepo structure: `/src` (ObjectScript), `/frontend` (Angular), `/mcp-server` (TypeScript MCP)
- Angular CLI v21 with standalone components, Angular Material v3 (density -2)
- Angular Signals + Services for state management, smart/dumb component pattern
- Optimistic UI pattern for mutations
- Server-side Activity recording on every ticket mutation (never from client)
- MCP server: TypeScript with `@modelcontextprotocol/sdk`, stdio transport, wraps REST API calls
- All validation backend-authoritative; frontend validates for UX only
- ObjectScript: NO underscores, `p` prefix params, `t` prefix locals, Try/Catch pattern, %Status return

**From UX Design:**
- D3 Split Panel layout: resizable list panel (400px default) + detail panel
- 8 custom components: ss-split-panel, ss-ticket-row, ss-status-badge, ss-type-icon, ss-filter-bar, ss-activity-timeline, ss-code-reference, ss-hierarchy-breadcrumb
- Light/dark theme toggle with system preference detection
- Desktop-first responsive (1280px+ primary, 1024px minimum, <768px not supported)
- Keyboard shortcuts: Arrow Up/Down (list nav), Enter (select), Escape (deselect), Ctrl+N (new ticket), / (search focus)
- WCAG 2.1 AA accessibility compliance
- Color system: slate blue accent (#4A6FA5), type colors (Bug=red, Task=blue, Story=green, Epic=purple), status colors (Open=gray, In Progress=blue, Blocked=amber, Complete=green)
- Typography: system font stack for UI, monospace for ObjectScript references
- Spacing: 4px base unit, 36px list row height, 48px toolbar
- Inline ticket creation in detail panel (title + type required, everything else optional)
- Unified activity timeline — human and agent entries use identical visual treatment

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Create tickets of type Bug, Task, Story, or Epic |
| FR2 | Epic 1 | View full ticket details |
| FR3 | Epic 1 | Update any ticket field |
| FR4 | Epic 1 | Delete tickets |
| FR5 | Epic 1 | View/set standard fields (title, description, status, priority, assignee) |
| FR6 | Epic 1 | View/set type-specific fields |
| FR7 | Epic 1 | Set ticket status (Open, In Progress, Blocked, Complete) |
| FR8 | Epic 1 | Set ticket priority (Low, Medium, High, Critical) |
| FR9 | Epic 1 | Assign tickets to human or AI agent |
| FR10 | Epic 2 | Create parent-child relationships (Epic > Story > Task) |
| FR11 | Epic 2 | Link Bug tickets to any other ticket type |
| FR12 | Epic 2 | Navigate parent-to-children and child-to-parent |
| FR13 | Epic 2 | Create tickets without parent (hierarchy optional) |
| FR14 | Epic 2 | Add ObjectScript class references to tickets |
| FR15 | Epic 2 | Add ObjectScript method references to tickets |
| FR16 | Epic 2 | View code references as structured fields |
| FR17 | Epic 1 | View list of all tickets across types |
| FR18 | Epic 2 | Filter ticket list by type, status, priority, assignee |
| FR19 | Epic 2 | Sort ticket list by any standard field |
| FR20 | Epic 2 | Search tickets by text content |
| FR21 | Epic 1 | View ticket detail with all fields, hierarchy, code refs, comments |
| FR22 | Epic 3 | Add comments via web UI |
| FR23 | Epic 3 | AI agents add comments via MCP |
| FR24 | Epic 3 | View full comment history and activity trail |
| FR25 | Epic 3 | See author (human/AI) of each comment |
| FR26 | Epic 4 | AI agents create tickets via MCP |
| FR27 | Epic 4 | AI agents read ticket details via MCP |
| FR28 | Epic 4 | AI agents update ticket fields via MCP |
| FR29 | Epic 4 | AI agents list and filter tickets via MCP |
| FR30 | Epic 4 | AI agents close/complete tickets via MCP |
| FR31 | Epic 4 | AI agents query tickets by type, status, assignee via MCP |
| FR32 | Epic 1 | Install SpectraSight on existing IRIS instance |
| FR33 | Epic 1 | Configure authentication for API access |
| FR34 | Epic 4 | Configure MCP client connection |
| FR35 | Epic 4 | Test MCP connection |
| FR36 | Epic 5 | Create projects with name, prefix, and owner |
| FR37 | Epic 5 | View, update, and delete projects |
| FR38 | Epic 5 | Unique ticket prefix per project |
| FR39 | Epic 5 | Sequential ticket numbering per project |
| FR40 | Epic 5 | Filter ticket list by project |
| FR41 | Epic 5 | Default project on installation |
| FR42 | Epic 6 | Map IRIS accounts to display names |
| FR43 | Epic 6 | Only mapped users in assignee dropdowns |
| FR44 | Epic 6 | "My Tickets" based on mapped IRIS account |
| FR45 | Epic 6 | AI agents specify user identity via MCP |
| FR46 | Epic 6 | Closed tickets excluded from default list |
| FR47 | Epic 6 | Toggle filter to show closed tickets |
| FR48 | Epic 6 | MCP include_closed parameter |

## Epic List

### Epic 1: Core Ticket Management (Done)
A developer can install SpectraSight on their IRIS instance, log in, create tickets of all four types (Bug, Task, Story, Epic), and manage them through a split-panel web interface with full CRUD operations.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR17, FR21, FR32, FR33
**User journey:** Alex — First-Time Setup and Daily Use (core path)
**Implementation notes:** Includes full %Persistent class hierarchy (all models including Activity and CodeReference for data capture from day one), REST API with CRUD endpoints + response envelope, Angular scaffold with split panel layout, Basic Auth, ticket list and detail views.

### Epic 5: Multi-Project Support
Users can create and manage multiple projects, each with a unique ticket prefix and independent sequential numbering. Tickets are scoped to projects, and the list view can be filtered by project. A default project ensures backward compatibility with existing tickets.

**FRs covered:** FR36, FR37, FR38, FR39, FR40, FR41
**User journey:** Alex — managing tickets across multiple IRIS applications on the same instance
**Implementation notes:** New Project model class, TicketID utility rework, REST endpoints for project CRUD, MCP tools (list_projects, create_project), project filter in UI, project config page under Settings. Default "SS" project created on install for backward compatibility.

### Epic 6: User Management & Agent Identity
Administrators can map IRIS accounts to display names, controlling who appears in assignee dropdowns. AI agents can specify a user identity when performing MCP operations. Closed tickets are hidden from the default list view with a toggle to show them.

**FRs covered:** FR42, FR43, FR44, FR45, FR46, FR47, FR48, FR9 (updated)
**User journey:** Jordan — managing team members and reviewing filtered ticket lists; Spectra — operating as a named team member via MCP
**Implementation notes:** New UserMapping model class, REST endpoints for user CRUD, assignee dropdowns populated from mappings, MCP user parameter on mutation tools, closed ticket filtering in UI and MCP.

## Epic 1: Core Ticket Management

A developer can install SpectraSight on their IRIS instance, log in, create tickets of all four types (Bug, Task, Story, Epic), and manage them through a split-panel web interface with full CRUD operations.

### Story 1.1: Project Scaffold & Ticket Data Model

As a developer,
I want to set up the SpectraSight project structure and create the core data model on my IRIS instance,
So that I have a working foundation to build ticket management features on.

**Acceptance Criteria:**

**Given** a developer has an existing IRIS instance running
**When** they import the ObjectScript classes from the `/src` directory
**Then** the following %Persistent classes are compiled successfully: Ticket (base), Bug, Task, Story, Epic, Activity (base), Comment, StatusChange, AssignmentChange, CodeReferenceChange, and CodeReference
**And** the monorepo structure is created with `/src`, `/frontend`, and `/mcp-server` directories
**And** the Angular project is scaffolded with `ng new` (standalone, strict, SCSS, routing) with Angular Material installed and density -2 configured
**And** the Material theme is configured with the SpectraSight color palette (slate blue accent), system font stack, and monospace code font
**And** unit tests verify that Ticket subclasses can be created, saved, opened, and deleted via %Persistent API
**And** unit tests verify that polymorphic SQL queries against the base Ticket extent return rows from all subclasses

**Implementation Note:** This story creates all 11 %Persistent classes upfront (5 Ticket hierarchy + 5 Activity hierarchy + CodeReference). This is intentional — Activity entries are recorded server-side on every ticket mutation from Story 1.2 onward, so the Activity class hierarchy must exist before the REST API is built. Implement in two passes: (1) monorepo scaffold + Angular setup, (2) ObjectScript model classes + unit tests.

### Story 1.2: REST API for Ticket Operations

As a developer,
I want a REST API that allows creating, reading, updating, and deleting tickets of all four types,
So that ticket data can be managed programmatically and serve as the single gateway for all clients.

**Acceptance Criteria:**

**Given** the %Persistent ticket classes exist from Story 1.1
**When** a client sends `POST /api/tickets` with `{ "type": "bug", "title": "Fix validation" }`
**Then** a new Bug ticket is created and returned in the response envelope `{ "data": { "id": "SS-1", ... } }`
**And** `GET /api/tickets` returns a paginated list of all tickets across types with `{ "data": [...], "total", "page", "pageSize", "totalPages" }`
**And** `GET /api/tickets/:id` returns the full ticket details including type-specific fields
**And** `PUT /api/tickets/:id` updates specified fields and returns the updated ticket
**And** `DELETE /api/tickets/:id` deletes the ticket and returns a success response
**And** all endpoints require HTTP Basic Auth with IRIS credentials — unauthenticated requests return 401
**And** invalid operations return structured error responses `{ "error": { "code", "message", "status" } }`
**And** ticket IDs are displayed as `SS-{id}` in all API responses and accepted in URL paths
**And** CORS is enabled via `HandleCorsRequest = 1` in the dispatch class
**And** the dispatch class routes are defined in `XData UrlMap`
**And** all REST handler methods follow the Try/Catch %Status pattern with `p` prefix params and `t` prefix locals

### Story 1.3: App Shell & Split Panel Layout

As a developer,
I want the Angular application shell with a toolbar, collapsible sidenav, and resizable split-panel layout,
So that I have the core UI framework for browsing and managing tickets.

**Acceptance Criteria:**

**Given** the Angular project is scaffolded from Story 1.1
**When** a developer runs `ng serve` and opens the app in a Chromium browser
**Then** a login form is displayed requesting IRIS username and password
**And** after successful login, the app shell displays a 48px toolbar, a collapsible sidenav (240px), and a split-panel main content area
**And** the split panel has a resizable list panel (400px default, 300px min, 50% max) and a detail panel filling the remaining width
**And** the resize handle between panels is draggable and double-click resets to default width
**And** the sidenav displays navigation items: "All Tickets" (default active), "My Tickets" (filtered by current user), "Epics" (filtered to Epic type), and "Settings" (theme toggle and configuration)
**And** the active sidenav item is highlighted with an accent color left border
**And** the sidenav collapses to icon-only mode (56px) on screens narrower than 1280px
**And** credentials are stored in memory (not localStorage) and attached to all API requests via an Angular HTTP interceptor
**And** API errors are caught by an error interceptor and displayed via Material snackbar
**And** a proxy config forwards `/api/*` requests to `localhost:52773` during development
**And** the API base URL is configured via `environment.ts`
**And** light/dark theme toggle works with system preference detection and localStorage persistence

### Story 1.4: Ticket List View

As a developer,
I want to see all my tickets in a dense, scannable list in the left panel,
So that I can quickly browse and identify tickets to work on.

**Acceptance Criteria:**

**Given** the app shell and split panel are rendered from Story 1.3
**When** the ticket list loads
**Then** all tickets are displayed in dense 36px rows showing: type icon (colored, 16px), title (truncated with tooltip), status badge (color-coded dot + text), assignee name, and relative timestamp
**And** the list is sorted by most recently updated first by default
**And** each ticket type has a distinct icon: Bug (red circle-dot), Task (blue checkbox), Story (green bookmark), Epic (purple lightning bolt)
**And** each status has a distinct color: Open (gray), In Progress (blue), Blocked (amber), Complete (green)
**And** clicking a ticket row selects it (accent left border + highlighted background)
**And** Arrow Up/Down keys navigate between list rows, Enter loads the selected ticket's detail
**And** loading state shows skeleton rows matching row anatomy
**And** empty state shows "No tickets yet. Create your first ticket to get started." with a "New Ticket" button
**And** the ticket service uses Angular Signals for reactive state management

### Story 1.5: Ticket Detail View & Inline Editing

As a developer,
I want to click a ticket in the list and see its full details in the right panel with the ability to edit fields inline,
So that I can review and update tickets without navigating away from the list.

**Acceptance Criteria:**

**Given** a ticket is selected in the list panel from Story 1.4
**When** the detail panel loads
**Then** it displays: ticket title (headline), type icon + `SS-{id}`, status badge (clickable), priority, assignee, description, and timestamps (created, updated)
**And** clicking the status badge opens a dropdown to change status — the change saves immediately (optimistic UI) with a snackbar confirmation
**And** clicking the assignee shows a dropdown to reassign — the change saves immediately
**And** clicking the title or description makes it editable inline — Enter or blur saves, Escape cancels
**And** priority is editable via dropdown (Low, Medium, High, Critical)
**And** all type-specific fields for the ticket's type are displayed and editable
**And** if a save fails, the optimistic update is reverted and an error snackbar with "Retry" is shown
**And** the list panel's status badge and other metadata update in sync when changes are made
**And** Escape key clears the detail panel selection
**And** URL updates to `/tickets/SS-{id}` when a ticket is selected, supporting deep-linking

### Story 1.6: Ticket Creation & Deletion

As a developer,
I want to create new tickets quickly with just a title and type, and delete tickets I no longer need,
So that capturing work is frictionless and cleaning up is safe.

**Acceptance Criteria:**

**Given** a developer is viewing the split-panel interface from Story 1.5
**When** they click "New Ticket" in the toolbar or press Ctrl+N
**Then** an inline creation form appears in the detail panel with Title (required) and Type (required, select: Bug/Task/Story/Epic)
**And** optional fields are visible but empty: Status (defaults to "Open"), Priority, Assignee, Description
**And** submitting with title + type creates the ticket, adds it to the list, selects it, and shows a snackbar "Ticket SS-{id} created"
**And** the creation completes in under 3 seconds (title + type + submit)
**And** submitting without a title shows an inline validation error "Title is required"
**And** when viewing a ticket in the detail panel, a "Delete" button (red text, tertiary style) is available
**And** clicking "Delete" opens a confirmation dialog: "Delete ticket SS-{id}?" with "Cancel" and "Delete" actions
**And** confirming deletion removes the ticket from the list, clears the detail panel, and shows a snackbar confirmation
**And** Cancel or Escape dismisses the dialog without deleting

### Epic 2: Ticket Organization, Search & Code Integration
Users can organize tickets into an Epic > Story > Task hierarchy, navigate parent-child relationships via breadcrumbs, filter and sort the ticket list by type/status/priority/assignee, search by text, and add structured ObjectScript class/method references to tickets.

**FRs covered:** FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR18, FR19, FR20
**User journey:** Alex — Daily Use (hierarchy and code refs), Jordan — Team Oversight (filtering and search)
**Implementation notes:** Adds hierarchy navigation (breadcrumbs, child lists), filter bar, sorting, text search, CodeReference UI with autocomplete via class introspection endpoints.

## Epic 2: Ticket Organization, Search & Code Integration

Users can organize tickets into an Epic > Story > Task hierarchy, navigate parent-child relationships via breadcrumbs, filter and sort the ticket list by type/status/priority/assignee, search by text, and add structured ObjectScript class/method references to tickets.

### Story 2.1: Ticket Hierarchy & Navigation

As a developer,
I want to organize tickets into an Epic > Story > Task hierarchy and navigate between parents and children,
So that I can structure my work logically and understand how tasks relate to the bigger picture.

**Acceptance Criteria:**

**Given** the ticket CRUD system exists from Epic 1
**When** a user creates or edits a ticket and sets a parent ticket
**Then** the parent-child relationship is persisted (parent reference on the child ticket)
**And** the REST API validates hierarchy rules: Epics can contain Stories, Stories can contain Tasks, Bugs can link to any ticket type
**And** creating a ticket without a parent is valid — hierarchy is optional (FR13)
**And** `GET /api/tickets/:id` includes a `children` array (id, title, status, type) and a `parent` object (id, title, type) in the response
**And** the ticket detail panel displays an `ss-hierarchy-breadcrumb` at the top showing clickable ancestor chain (e.g., `Epic Name > Story Name > Current Task`)
**And** clicking an ancestor in the breadcrumb loads that ticket in the detail panel
**And** parent tickets display their children as a compact clickable list below the description
**And** clicking a child in the detail panel loads it in the detail panel (list panel is unaffected)
**And** standalone tickets (no parent) show no breadcrumb
**And** the ticket creation form includes an optional "Parent" field with autocomplete to select an existing ticket
**And** creating a sub-task from a parent ticket's detail view pre-fills the parent reference

### Story 2.2: List Filtering, Sorting & Search

As a developer,
I want to filter, sort, and search the ticket list by type, status, priority, assignee, and text content,
So that I can quickly find relevant tickets during triage and daily work.

**Acceptance Criteria:**

**Given** the ticket list view exists from Epic 1
**When** the `ss-filter-bar` component renders above the list panel
**Then** it displays: a text search input, type filter (multi-select chips: Bug/Task/Story/Epic), status filter (multi-select chips: Open/In Progress/Blocked/Complete), and assignee filter (dropdown)
**And** filters apply immediately — no "Apply" button needed
**And** active filters are shown as removable chips with a "Clear all" button when any filter is active
**And** the REST API accepts query parameters: `type`, `status`, `priority`, `assignee`, `search`, `sort`, `page`, `pageSize`
**And** text search matches against ticket title and description (FR20)
**And** clicking a column header in the list sorts by that field — toggling ascending/descending with a sort indicator arrow
**And** filter and sort state is reflected in the URL (e.g., `/tickets?status=open&type=bug&sort=title`)
**And** browser back/forward navigates filter state history
**And** the `/` key focuses the search input
**And** "No tickets match your filters" empty state is shown with a "Clear filters" button when filters produce no results
**And** search and filter operations return results within the page load time targets (NFR5)

### Story 2.3: Code Reference Fields

As a developer,
I want to add structured ObjectScript class and method references to tickets,
So that my tickets are directly linked to the code I'm working on without pasting class names into free-text descriptions.

**Acceptance Criteria:**

**Given** the ticket detail view exists from Epic 1
**When** a user clicks "Add code reference" on a ticket's detail panel
**Then** an `ss-code-reference` input field appears with two parts: Class Name (autocomplete) and Method Name (optional autocomplete)
**And** typing in the class name field triggers autocomplete suggestions from `GET /api/classes`
**And** after selecting a class, the method name field offers autocomplete suggestions from `GET /api/classes/:name/methods`
**And** the REST API `GET /api/classes` queries `%Dictionary.ClassDefinition` for available ObjectScript classes
**And** the REST API `GET /api/classes/:name/methods` queries `%Dictionary.MethodDefinition` for methods on the specified class
**And** multiple code references can be added to a single ticket
**And** saved code references are displayed in monospace font (e.g., `HS.Integration.PatientValidator.ValidateRecord`) as structured fields separate from the description (FR16)
**And** code references can be removed with a delete action
**And** adding or removing a code reference creates a `CodeReferenceChange` activity entry server-side
**And** `GET /api/tickets/:id` includes a `codeReferences` array in the response

### Epic 3: Collaboration & Activity Tracking
Users can add comments to tickets through the web UI, view a unified activity timeline showing all changes (status updates, assignments, comments, code reference changes) with clear attribution of whether a human or AI agent performed each action.

**FRs covered:** FR22, FR23, FR24, FR25
**User journey:** Alex — Daily Use (comments), Jordan — Team Oversight (activity review), Spectra — Agent Activity visibility
**Implementation notes:** Activity recording infrastructure created in Epic 1 (server-side on every mutation). This epic adds the activity timeline UI, comment creation form, actor attribution display, and the MCP comment endpoint.

## Epic 3: Collaboration & Activity Tracking

Users can add comments to tickets through the web UI, view a unified activity timeline showing all changes (status updates, assignments, comments, code reference changes) with clear attribution of whether a human or AI agent performed each action.

### Story 3.1: Activity Timeline & Actor Attribution

As a developer,
I want to see a unified activity timeline on each ticket showing all changes — status updates, assignments, comments, and code reference changes — with clear attribution of who performed each action,
So that I have a complete, transparent history of everything that happened on a ticket.

**Acceptance Criteria:**

**Given** the Activity %Persistent classes and server-side recording exist from Epic 1
**When** `GET /api/tickets/:id/activity` is called
**Then** it returns all activity entries for that ticket in chronological order (oldest first)
**And** each activity entry includes: actor name, actor type (human or agent), timestamp, and action-specific details
**And** the `ss-activity-timeline` component renders in the ticket detail panel below the description
**And** status change entries display: "[Actor] changed status from [old] to [new]" with colored status badges
**And** assignment change entries display: "[Actor] reassigned from [old] to [new]"
**And** code reference change entries display: "[Actor] added/removed code reference [Class.Method]"
**And** human and agent activity entries use the **exact same component template** — no visual differentiation by actor type (FR25)
**And** timestamps display as relative time ("2 minutes ago") with full timestamp on hover tooltip
**And** loading state shows a skeleton timeline
**And** empty state shows "No activity yet" in muted text
**And** the timeline updates after any inline edit in the detail panel (status change, reassignment, etc.)

### Story 3.2: Comment System

As a developer,
I want to add comments to tickets and see all comments in the activity timeline,
So that I can communicate context, decisions, and feedback directly on the ticket where the work is tracked.

**Acceptance Criteria:**

**Given** the activity timeline exists from Story 3.1
**When** a user types in the comment form at the bottom of the activity timeline and submits
**Then** `POST /api/tickets/:id/comments` creates a Comment activity entry with the comment body, actor name, and actor type
**And** the new comment appears immediately in the timeline (optimistic UI) with a snackbar "Comment added"
**And** comments display: actor name, timestamp, and full comment body — no truncation
**And** the comment form is a textarea that expands on focus with a "Submit" primary button
**And** submitting an empty comment is prevented (submit button disabled when empty)
**And** AI agent comments (created via MCP in Epic 4, or directly via REST) appear identically to human comments in the timeline — same component, same visual weight
**And** the REST API validates that comment body is non-empty, returning a 400 error for empty submissions
**And** comment data is persisted with the same reliability guarantees as ticket data (NFR12)

### Epic 4: AI Agent Integration via MCP Server
AI agents can connect to SpectraSight's MCP server and perform all ticket operations autonomously — create, read, update, list, filter, and close tickets, add comments, and query by any field — with functional parity to the web UI.

**FRs covered:** FR26, FR27, FR28, FR29, FR30, FR31, FR34, FR35
**User journey:** Spectra — AI Agent Autonomous Workflow, Alex — Connecting an AI Agent
**Implementation notes:** TypeScript MCP server with stdio transport, wrapping the REST API. All MCP tools mirror REST endpoints. Includes configuration and connection testing.

## Epic 4: AI Agent Integration via MCP Server

AI agents can connect to SpectraSight's MCP server and perform all ticket operations autonomously — create, read, update, list, filter, and close tickets, add comments, and query by any field — with functional parity to the web UI.

### Story 4.1: MCP Server with Ticket Operations

As an AI agent,
I want to create, read, update, list, filter, and close tickets via MCP tools,
So that I can manage project work autonomously without needing a browser interface.

**Acceptance Criteria:**

**Given** the REST API exists from Epic 1 and Epic 2
**When** an AI agent launches the MCP server process via stdio transport
**Then** the server registers the following MCP tools: `create_ticket`, `get_ticket`, `update_ticket`, `delete_ticket`, `list_tickets`, `add_comment`
**And** `create_ticket` accepts `title` (required), `type` (required), and optional fields (description, status, priority, assignee, parent_id) — creates a ticket via `POST /api/tickets` and returns the created ticket
**And** `get_ticket` accepts `ticket_id` and returns full ticket details via `GET /api/tickets/:id`
**And** `update_ticket` accepts `ticket_id` and any updatable fields — updates via `PUT /api/tickets/:id`
**And** `delete_ticket` accepts `ticket_id` — deletes via `DELETE /api/tickets/:id`
**And** `list_tickets` accepts optional filters (`type`, `status`, `priority`, `assignee`, `search`, `sort`, `page`, `page_size`) — queries via `GET /api/tickets`
**And** `add_comment` accepts `ticket_id` and `body` — creates a comment via `POST /api/tickets/:id/comments`
**And** all tool parameters use snake_case naming and are validated with Zod schemas before calling the REST API
**And** tool responses include the full data from the REST API response envelope
**And** REST API errors are translated to MCP error format with the original error code and message preserved
**And** the MCP server authenticates to the REST API using IRIS credentials from its configuration
**And** MCP operation response times do not exceed 150% of equivalent REST API response times (NFR3)
**And** the server follows the standard MCP protocol specification for tool definitions (NFR16)

### Story 4.2: MCP Configuration & Connection Testing

As a developer,
I want to configure my AI agent's MCP client to connect to SpectraSight and verify the connection works,
So that I can start assigning tickets to the agent with confidence it can operate autonomously.

**Acceptance Criteria:**

**Given** the MCP server from Story 4.1 is built and available
**When** a developer configures their MCP client with the SpectraSight server entry (command, args, and environment variables for IRIS REST URL and credentials)
**Then** the MCP server launches via stdio and registers all tools successfully
**And** the developer can test the connection by calling `list_tickets` — the server returns the current ticket list
**And** the MCP server configuration supports environment variables for: IRIS REST API base URL, username, and password
**And** if the REST API is unreachable or credentials are invalid, the MCP server returns a clear error message indicating the connection failure
**And** the `api-client.ts` module handles HTTP errors gracefully and translates them to meaningful MCP tool errors
**And** the project README includes MCP server setup instructions: how to build, configure, and add to an MCP client config
**And** a `package.json` script is available for building the TypeScript MCP server to JavaScript

### Story 4.3: MCP Full Parity — Type-Specific Fields & Additional Tools

As an AI agent,
I want to set and update type-specific fields on tickets and manage code references and activity via MCP,
So that I have full functional parity with the web UI and can operate as an equal teammate.

**Acceptance Criteria:**

**Given** the MCP server from Story 4.1 exists
**When** an AI agent calls `create_ticket` with type "bug"
**Then** the tool accepts optional type-specific fields: `severity`, `steps_to_reproduce`, `expected_behavior`, `actual_behavior`
**And** `create_ticket` with type "task" accepts: `estimated_hours`, `actual_hours`
**And** `create_ticket` with type "story" accepts: `story_points`, `acceptance_criteria`
**And** `create_ticket` with type "epic" accepts: `start_date`, `target_date`
**And** `update_ticket` accepts all type-specific fields for the ticket's type
**And** `update_ticket` accepts `parent_id` to set or change a ticket's parent
**And** a new `add_code_reference` tool accepts `ticket_id`, `class_name` (required), and `method_name` (optional) — creates via `POST /api/tickets/:id/code-references`
**And** a new `remove_code_reference` tool accepts `ticket_id` and `reference_id` — deletes via `DELETE /api/tickets/:id/code-references/:refId`
**And** a new `list_activity` tool accepts `ticket_id` and returns the full activity timeline via `GET /api/tickets/:id/activity`
**And** all new tool parameters use snake_case naming and are validated with Zod schemas
**And** the test_connection tool's TOOL_COUNT is updated to reflect the new total (10)
**And** MCP operation response times do not exceed 150% of equivalent REST API response times (NFR3)

### Epic 5: Multi-Project Support
Users can create and manage multiple projects, each with a unique ticket prefix and independent sequential numbering. Tickets are scoped to projects, and the list view can be filtered by project. A default project ensures backward compatibility with existing tickets.

**FRs covered:** FR36, FR37, FR38, FR39, FR40, FR41
**User journey:** Alex — managing tickets across multiple IRIS applications on the same instance
**Implementation notes:** New Project model class, TicketID utility rework, REST endpoints for project CRUD, MCP tools (list_projects, create_project), project filter in UI, project config page under Settings. Default "SS" project created on install for backward compatibility.

## Epic 5: Multi-Project Support

Users can create and manage multiple projects, each with a unique ticket prefix and independent sequential numbering. Tickets are scoped to projects, and the list view can be filtered by project. A default project ensures backward compatibility with existing tickets.

### Story 5.1: Project Data Model & Default Project

As a developer,
I want a Project model that stores project name, ticket prefix, and sequential numbering,
So that the system can support multiple projects with independent ticket numbering.

**Acceptance Criteria:**

**Given** the existing IRIS instance with SpectraSight installed
**When** the Project %Persistent class is compiled
**Then** it includes properties: Name (required), Prefix (required, unique, uppercase 2-10 chars), Owner (optional), SequenceCounter (integer, default 0), CreatedAt, UpdatedAt
**And** a default project is created: Name="SpectraSight", Prefix="SS", Owner="" with SequenceCounter set to the current max ticket ID
**And** all existing tickets are assigned to the default project
**And** the base Ticket class has a required Project reference property and a SequenceNumber integer property
**And** unit tests verify Project CRUD via %Persistent API
**And** unit tests verify that the default project is created with the correct SequenceCounter

### Story 5.2: Project-Scoped Ticket Numbering

As a developer,
I want ticket numbers to be sequential per project using the project's prefix,
So that each project has clean, independent numbering (e.g., DATA-1, DATA-2).

**Acceptance Criteria:**

**Given** the Project model exists from Story 5.1
**When** a new ticket is created via POST /api/tickets with a project_id
**Then** the Project's SequenceCounter is atomically incremented and the new value is stored as the ticket's SequenceNumber
**And** the ticket ID is displayed as {Prefix}-{SequenceNumber} in all API responses (e.g., DATA-1, SS-15)
**And** the TicketID utility is updated to resolve ticket IDs by parsing the prefix to find the project, then looking up by SequenceNumber within that project
**And** existing API paths accepting ticket IDs (GET/PUT/DELETE /api/tickets/:id) work with the new prefixed format
**And** creating a ticket without specifying project_id defaults to the system default project
**And** unit tests verify sequential numbering across multiple tickets in the same project
**And** unit tests verify independent numbering across different projects

### Story 5.3: Project REST API & MCP Tools

As a developer,
I want REST endpoints and MCP tools for managing projects,
So that projects can be created and listed through both the UI and AI agent interfaces.

**Acceptance Criteria:**

**Given** the Project model exists from Story 5.1
**When** a client sends POST /api/projects with { "name": "Data Pipeline", "prefix": "DATA" }
**Then** a new project is created and returned in the response envelope
**And** GET /api/projects returns all projects
**And** GET /api/projects/:id returns a single project's details
**And** PUT /api/projects/:id updates project name and owner (prefix is immutable after creation)
**And** DELETE /api/projects/:id deletes the project only if it has zero tickets — returns 409 Conflict otherwise
**And** the default project cannot be deleted — returns 403 Forbidden
**And** prefix uniqueness is validated on create — returns 400 if duplicate
**And** MCP tool list_projects returns all projects
**And** MCP tool create_project accepts name, prefix, owner and creates via POST /api/projects
**And** GET /api/tickets accepts a project query parameter to filter by project prefix or ID
**And** MCP tool list_tickets accepts a project parameter for filtering

### Story 5.4: Project Configuration UI & List Filter

As a developer,
I want a project configuration page and a project filter on the ticket list,
So that I can manage projects and view tickets scoped to a specific project.

**Acceptance Criteria:**

**Given** the Project REST API exists from Story 5.3
**When** a user navigates to Settings > Projects
**Then** a list of projects is displayed showing name, prefix, owner, ticket count, and created date
**And** clicking "New Project" opens an inline form with Name (required), Prefix (required, validated unique on blur, uppercase 2-10 chars), and Owner (optional)
**And** the prefix field is read-only when editing an existing project
**And** the default project is listed first and its delete action is disabled
**And** delete is disabled for projects with tickets (tooltip: "Cannot delete project with existing tickets")
**And** the filter bar includes a Project dropdown as the first filter showing all projects by name with prefix in parentheses
**And** selecting a project filters the ticket list to that project only
**And** "All Projects" option shows tickets across all projects
**And** the project filter state is reflected in the URL (?project=DATA)

### Epic 6: User Management & Agent Identity
Administrators can map IRIS accounts to display names, controlling who appears in assignee dropdowns. AI agents can specify a user identity when performing MCP operations. Closed tickets are hidden from the default list view with a toggle to show them.

**FRs covered:** FR42, FR43, FR44, FR45, FR46, FR47, FR48, FR9 (updated)
**User journey:** Jordan — managing team members and reviewing filtered ticket lists; Spectra — operating as a named team member via MCP
**Implementation notes:** New UserMapping model class, REST endpoints for user CRUD, assignee dropdowns populated from mappings, MCP user parameter on mutation tools, closed ticket filtering in UI and MCP.

## Epic 6: User Management & Agent Identity

Administrators can map IRIS accounts to display names, controlling who appears in assignee dropdowns. AI agents can specify a user identity when performing MCP operations. Closed tickets are hidden from the default list view with a toggle to show them.

### Story 6.1: User Mapping Data Model & REST API

As an administrator,
I want to map IRIS system accounts to display names,
So that team members and AI agents have recognizable identities throughout the system.

**Acceptance Criteria:**

**Given** the existing IRIS instance with SpectraSight installed
**When** the UserMapping %Persistent class is compiled
**Then** it includes properties: IrisUsername (required, unique), DisplayName (required), IsActive (boolean, default true), CreatedAt
**And** POST /api/users with { "irisUsername": "_SYSTEM", "displayName": "Joe" } creates a new mapping
**And** GET /api/users returns all user mappings
**And** GET /api/users?isActive=true returns only active mappings
**And** GET /api/users/:id returns a single mapping
**And** PUT /api/users/:id updates displayName and isActive
**And** DELETE /api/users/:id deletes the mapping only if the user has no ticket assignments — returns 409 Conflict otherwise
**And** IrisUsername uniqueness is validated — returns 400 if duplicate
**And** all endpoints follow the standard response envelope and require Basic Auth
**And** unit tests verify UserMapping CRUD via %Persistent API

### Story 6.2: User Mapping Configuration UI

As an administrator,
I want a settings page to manage user mappings,
So that I can control which IRIS accounts are available as assignees and what names are displayed.

**Acceptance Criteria:**

**Given** the UserMapping REST API exists from Story 6.1
**When** a user navigates to Settings > Users
**Then** a list of user mappings is displayed showing display name, IRIS username, active status toggle, and created date
**And** clicking "Add User" opens an inline form with IRIS Username (required) and Display Name (required)
**And** the active/inactive toggle saves immediately (optimistic UI) with snackbar confirmation
**And** delete is disabled for users assigned to any tickets (tooltip: "Cannot delete user assigned to tickets")
**And** inactive users remain in the list but are visually muted
**And** the Settings sidenav section shows subsections: Theme, Projects, Users

### Story 6.3: Assignee Dropdowns from Mapped Users

As a developer,
I want assignee dropdowns populated from mapped users instead of free text,
So that I can consistently assign tickets to recognized team members and AI agents.

**Acceptance Criteria:**

**Given** user mappings exist from Story 6.1
**When** a user clicks the assignee dropdown on ticket creation or ticket detail
**Then** the dropdown is populated from GET /api/users?isActive=true showing display names
**And** selecting a user sets the ticket's assignee to that display name
**And** the "My Tickets" sidenav filter identifies the current user by matching the authenticated IRIS username to a user mapping and filtering by that mapping's display name
**And** if no mapping exists for the current IRIS user, "My Tickets" shows an informational message: "Set up your user mapping in Settings > Users"
**And** the assignee filter in the filter bar is populated from active user mappings
**And** the MCP create_ticket and update_ticket tools validate assignee values against active user mappings — return error if assignee is not a valid mapped user

### Story 6.4: MCP User Identity Selection

As an AI agent,
I want to specify which mapped user I'm acting as when performing ticket operations,
So that my actions are attributed to the correct team member identity rather than the IRIS connection account.

**Acceptance Criteria:**

**Given** user mappings exist from Story 6.1
**When** an AI agent calls create_ticket, update_ticket, add_comment, add_code_reference, or remove_code_reference with an optional user parameter
**Then** the specified user is used as the actor for that operation (activity entries, comment author, etc.)
**And** the user parameter is validated against active user mappings — returns error if not a valid mapped display name
**And** if no user parameter is provided, the actor defaults to the display name mapped to the IRIS username used for REST authentication
**And** if no mapping exists for the authenticated IRIS user and no user parameter is provided, the IRIS username is used as-is (graceful fallback)
**And** all MCP mutation tools include the user parameter in their Zod schemas with description explaining its purpose
**And** the test_connection tool's TOOL_COUNT remains 12 (no new tools added)

### Story 6.5: Closed Ticket Filtering

As a developer,
I want closed/complete tickets hidden from the default ticket list,
So that my daily view shows only active work without clutter from finished tickets.

**Acceptance Criteria:**

**Given** the ticket list and filter bar exist from Epics 1-2
**When** the ticket list loads
**Then** tickets with status "Complete" are excluded by default
**And** the filter bar includes a "Show Closed" toggle at the end
**And** toggling "Show Closed" on includes Complete tickets in the list
**And** the toggle state is reflected in the URL (?includeClosed=true)
**And** GET /api/tickets defaults to excluding Complete status unless includeClosed=true is passed
**And** MCP list_tickets accepts include_closed parameter (boolean, default false)
**And** when "Show Closed" is active, Complete tickets display normally with their green Complete status badge
**And** the empty state message when all tickets are closed reads: "All tickets are closed. Toggle 'Show Closed' to view them."

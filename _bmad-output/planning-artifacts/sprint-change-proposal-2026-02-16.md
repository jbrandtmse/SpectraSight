# Sprint Change Proposal — SpectraSight Post-MVP Enhancements

**Author:** Developer
**Date:** 2026-02-16
**Change Scope:** Moderate
**Status:** Approved (2026-02-16)

---

## Section 1: Issue Summary

Four user feature requests have been identified that extend SpectraSight beyond its shipped MVP scope:

1. **Multi-project support** — Projects with custom prefixes, project-scoped ticket numbering, CRUD config page, project filter
2. **User account mapping** — IRIS accounts mapped to display names, filtered assignee dropdowns
3. **MCP user selection** — AI agents can specify a user identity for ticket operations
4. **Closed ticket filtering** — Hide completed tickets from default list view with toggle to show

**Discovery context:** Captured directly from user feedback in `docs/enhancements.md`. No implementation failure triggered these — the existing system works as designed. These represent natural workflow gaps observed during active use.

**Category:** New requirements emerged from stakeholders.

---

## Section 2: Impact Analysis

### Epic Impact

- **Epics 1-4:** No modifications to completed epics. Existing stories remain valid as-implemented.
- **New Epic 5 (Multi-Project Support):** New data model (Project class), ticket ID rework, REST API additions, MCP tools (list_projects, create_project), project filter in UI, project config page, default project migration.
- **New Epic 6 (User Management & Agent Identity):** New data model (UserMapping class), REST API additions, assignee dropdown rework, MCP user parameter, closed ticket filtering in UI and MCP.

### Story Impact

No existing stories require modification. All changes are additive:
- Epic 5: 4 new stories (5.1–5.4)
- Epic 6: 5 new stories (6.1–6.5)

### Artifact Conflicts

| Artifact | Scope of Change |
|----------|----------------|
| **PRD** | Add FRs 36-48 (13 new requirements). Update FR9, FR17, FR18, FR25, FR26, FR29. Add post-MVP scope section. |
| **Architecture** | Add 2 new model classes (Project, UserMapping), 8 new REST endpoints, 2 new MCP tools, modified MCP tool schemas. Update TicketID utility, Ticket model, API contracts. |
| **UX Spec** | Add 2 new pages (Project config, User mapping). Modify filter bar (project filter, show closed toggle, assignee from mapped users), sidenav (Settings subsections), ticket row (project-prefixed ID). |
| **Epics doc** | Add Epic 5 (4 stories) and Epic 6 (5 stories). |

### Technical Impact

- **Data model:** Ticket ID format changes from `SS-{id}` to `{Prefix}-{SequenceNumber}`. Mitigated by default "SS" project — existing tickets retain their IDs.
- **REST API:** 8 new endpoints following existing patterns. One modified endpoint (`GET /api/tickets` gains project and includeClosed params).
- **MCP server:** 2 new tools, 6 modified tools (new optional parameters). Backward compatible — existing MCP clients work without changes.
- **Angular UI:** 2 new config pages, modified filter bar, modified assignee dropdowns. No changes to core split-panel layout or component architecture.

---

## Section 3: Recommended Approach

**Selected: Direct Adjustment** — Add two new epics to the existing plan. No rollbacks, no MVP reduction.

### Rationale

- The REST-as-single-gateway pattern means new endpoints and MCP tools follow established patterns
- `%Persistent` inheritance accommodates new model classes without schema changes to existing classes
- The only "breaking" change (ticket ID format) is mitigated by default project with `SS` prefix
- Both new epics are independent — can be implemented in any order
- Same BMAD epic cycle workflow applies

### Alternatives Considered

| Option | Verdict | Reason |
|--------|---------|--------|
| Rollback | Not viable | No completed work needs reverting — these are additions, not corrections |
| MVP scope reduction | Not viable | Original MVP is delivered. These extend scope, not compete with it |
| Single mega-epic | Rejected | Too large. Two focused epics are cleaner and allow independent scheduling |
| Defer multi-project | Considered | Viable, but doing it later means more tickets to migrate. Better to do it early |

### Effort & Risk

- **Effort:** Medium — 9 stories across 2 epics
- **Risk:** Low-Medium — Ticket ID migration is the only tricky piece, mitigated by default project strategy
- **Timeline impact:** Additive scope. No existing work is delayed.

---

## Section 4: Detailed Change Proposals

### 4.1 PRD Changes

#### New Functional Requirements

**Multi-Project Support:**
- **FR36:** Administrators can create projects with a name, ticket prefix, and owner
- **FR37:** Administrators can view, update, and delete projects
- **FR38:** Each project has a unique ticket prefix used for ticket numbering (e.g., PROJ-1, DATA-15)
- **FR39:** Ticket numbers are sequential per project, starting at 1 for each new project
- **FR40:** Users can filter the ticket list by project
- **FR41:** A default project is created on installation so the system works without manual project setup

**User Management:**
- **FR42:** Administrators can map IRIS user accounts to display names
- **FR43:** Only mapped and active users appear in assignee dropdowns throughout the UI and MCP
- **FR44:** The "My Tickets" filter identifies the current user by their mapped IRIS account
- **FR45:** AI agents can specify a user identity when performing ticket operations via MCP (create, update, comment), allowing the agent to operate as a specific mapped user

**Closed Ticket Visibility:**
- **FR46:** Closed/complete tickets are excluded from the default ticket list view
- **FR47:** Users can toggle a filter to include closed/complete tickets in the list
- **FR48:** The MCP list_tickets tool supports an include_closed parameter to control closed ticket visibility (default: excluded)

#### Modified Existing FRs

- **FR9:** Users can assign tickets to any mapped user (human or AI agent) via a filtered dropdown populated from user mappings
- **FR17:** Users can view a list of all tickets across types, scoped to the selected project, with closed tickets excluded by default
- **FR18:** Users can filter the ticket list by project, ticket type, status (including closed toggle), priority, and assignee
- **FR25:** Users can see the author of each comment, displayed as the mapped display name from user mappings
- **FR26:** AI agents can create tickets via MCP, specifying a project and optionally acting as a specific mapped user
- **FR29:** AI agents can list and filter tickets via MCP, including filtering by project and controlling closed ticket visibility

#### Product Scope Addition

Add a "Post-MVP Enhancements (In Scope)" section after the MVP section:

**Multi-Project Support (Epic 5):**
- Project CRUD with configurable ticket prefix and owner
- Project-scoped sequential ticket numbering (replaces global SS-{id} format)
- Default project created on installation for backward compatibility
- Project filter in list view and MCP tools

**User Management & Agent Identity (Epic 6):**
- IRIS account to display name mapping with active/inactive status
- Assignee dropdowns populated exclusively from mapped users
- AI agent identity selection via MCP — agents can operate as a specific mapped user
- Closed ticket filtering — excluded from default list view with toggle to show

Remove "Enhanced filtering and saved views" from Growth Features (now covered).

### 4.2 Architecture Changes

#### New Data Model Classes

**SpectraSight.Model.Project (%Persistent, %JSON.Adaptor):**
- Properties: Name (required), Prefix (required, unique, uppercase 2-10 chars), Owner (optional), SequenceCounter (integer, default 0), CreatedAt, UpdatedAt
- Prefix validated: uppercase alphanumeric, 2-10 characters, unique across all projects
- SequenceCounter incremented atomically when a new ticket is created in the project
- Default project (Name: "SpectraSight", Prefix: "SS") created on first install
- JSON field mapping: `name`, `prefix`, `owner`, `sequenceCounter`, `createdAt`, `updatedAt`

**SpectraSight.Model.UserMapping (%Persistent, %JSON.Adaptor):**
- Properties: IrisUsername (required, unique), DisplayName (required), IsActive (boolean, default true), CreatedAt
- Only active mappings appear in assignee dropdowns and MCP user lists
- JSON field mapping: `irisUsername`, `displayName`, `isActive`, `createdAt`

#### Modified Data Model

**SpectraSight.Model.Ticket:**
- Add Project reference property (required, defaults to system default project)
- Add SequenceNumber integer property (assigned from Project.SequenceCounter on creation)
- Ticket ID displayed as `{Project.Prefix}-{SequenceNumber}` at the API layer
- IRIS %Persistent auto-increment ID remains as internal primary key

**SpectraSight.Util.TicketID:**
- Reworked: parse prefix to find project, look up by SequenceNumber within that project
- No longer hardcoded to `SS-` prefix

#### New REST API Endpoints

```
GET/POST         /api/projects              — list/create projects
GET/PUT/DELETE   /api/projects/:id          — project CRUD
GET/POST         /api/users                 — list/create user mappings
GET/PUT/DELETE   /api/users/:id             — user mapping CRUD
```

#### Modified REST API Endpoints

```
GET /api/tickets — add query params: project, includeClosed (default false)
```

#### New ObjectScript Classes

```
/src/SpectraSight/Model/Project.cls
/src/SpectraSight/Model/UserMapping.cls
/src/SpectraSight/REST/ProjectHandler.cls
/src/SpectraSight/REST/UserHandler.cls
/src/SpectraSight/Test/TestProject.cls
/src/SpectraSight/Test/TestUserMapping.cls
```

#### MCP Tool Changes

**New tools:**
- `list_projects` — returns all projects with id, name, prefix, owner
- `create_project` — accepts name (required), prefix (required), owner (optional)

**Modified tools:**
- `create_ticket` — add `project_id` (optional, defaults to default project), `user` (optional)
- `update_ticket` — add `user` (optional)
- `list_tickets` — add `project` (optional), `include_closed` (optional, default false)
- `add_comment` — add `user` (optional)
- `add_code_reference` — add `user` (optional)
- `remove_code_reference` — add `user` (optional)
- `test_connection` — TOOL_COUNT updated to 12

**New file:** `/mcp-server/src/tools/projects.ts`

### 4.3 UX Spec Changes

#### New Pages

**Project Configuration (Settings > Projects):**
- List + detail pattern within main content area
- Table: Name, Prefix, Owner, Ticket Count, Created date
- Create form: Name (required), Prefix (required, uppercase, unique, read-only after creation), Owner (optional)
- Default project listed first, cannot be deleted
- Delete disabled for projects with tickets

**User Mapping (Settings > Users):**
- List + detail pattern within main content area
- Table: Display Name, IRIS Username, Active toggle, Created date
- Create form: IRIS Username (required), Display Name (required)
- Active/inactive toggle saves immediately (optimistic UI)
- Delete disabled for users assigned to tickets

#### Modified Components

**Sidenav:** Settings subsections: Theme, Projects, Users

**Filter bar (`ss-filter-bar`):**
- Add Project dropdown as first filter (single-select, "All Projects" default)
- Add "Show Closed" toggle at end (default off)
- Assignee dropdown populated from active user mappings

**Ticket row (`ss-ticket-row`):** Show project-prefixed ticket ID (e.g., SS-42) in caption style

**Ticket creation form:** Add project selector (required), assignee dropdown from mapped users

**Assignee dropdowns (all locations):** Populated from active user mappings only

### 4.4 Epics Document Changes

#### Epic 5: Multi-Project Support (4 stories)

- **Story 5.1:** Project Data Model & Default Project — Project class, default SS project, existing ticket migration
- **Story 5.2:** Project-Scoped Ticket Numbering — atomic sequence counter, TicketID utility rework, prefixed display format
- **Story 5.3:** Project REST API & MCP Tools — CRUD endpoints, list_projects and create_project MCP tools, project filter on list_tickets
- **Story 5.4:** Project Configuration UI & List Filter — Settings > Projects page, project dropdown in filter bar

#### Epic 6: User Management & Agent Identity (5 stories)

- **Story 6.1:** User Mapping Data Model & REST API — UserMapping class, CRUD endpoints
- **Story 6.2:** User Mapping Configuration UI — Settings > Users page, active/inactive toggle
- **Story 6.3:** Assignee Dropdowns from Mapped Users — populate from mappings, "My Tickets" based on mapped account
- **Story 6.4:** MCP User Identity Selection — user parameter on mutation tools, actor attribution
- **Story 6.5:** Closed Ticket Filtering — default exclude Complete, Show Closed toggle, includeClosed API/MCP param

---

## Section 5: Implementation Handoff

### Change Scope Classification: Moderate

Requires backlog reorganization (new epics/stories) and artifact updates, but no fundamental architectural replan.

### Handoff Plan

| Role | Responsibility |
|------|---------------|
| **PM or Architect** | Update PRD, Architecture, and UX spec artifacts with approved changes |
| **PM** | Write full Epic 5 and Epic 6 story breakdowns into epics.md |
| **Development team** | Implement Epic 5 and Epic 6 via BMAD epic cycle |

### Recommended Implementation Order

1. Update planning artifacts (PRD, Architecture, UX Spec, Epics doc)
2. **Epic 5: Multi-Project Support** — foundational; changing ticket IDs is easier with fewer tickets
3. **Epic 6: User Management & Agent Identity** — independent of Epic 5, additive features

Epics 5 and 6 are independent and could be implemented in either order, but multi-project is recommended first to minimize migration complexity.

### Success Criteria

- All existing tickets retain their `SS-{id}` identifiers via default project
- New projects can be created with custom prefixes and independent numbering
- Assignee dropdowns show mapped user names, not IRIS usernames
- AI agents can operate under specific user identities via MCP
- Closed tickets are hidden by default with a toggle to reveal them
- All new functionality has unit tests and follows existing architectural patterns

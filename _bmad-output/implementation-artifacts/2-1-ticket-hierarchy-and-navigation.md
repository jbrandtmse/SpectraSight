# Story 2.1: Ticket Hierarchy & Navigation

Status: done

## Story

As a developer,
I want to organize tickets into an Epic > Story > Task hierarchy and navigate between parents and children,
So that I can structure my work logically and understand how tasks relate to the bigger picture.

## Acceptance Criteria

1. **Given** the ticket CRUD system exists from Epic 1, **When** a user creates or edits a ticket and sets a parent ticket, **Then** the parent-child relationship is persisted (parent reference on the child ticket).

2. **Given** a parent is set on a ticket, **When** the REST API validates the request, **Then** hierarchy rules are enforced: Epics can contain Stories, Stories can contain Tasks, Bugs can link to any ticket type.

3. **Given** a user creates a ticket, **When** no parent is specified, **Then** the ticket is created without a parent -- hierarchy is optional (FR13).

4. **Given** a ticket has a parent and/or children, **When** `GET /api/tickets/:id` is called, **Then** the response includes a `children` array (id, title, status, type) and a `parent` object (id, title, type).

5. **Given** the ticket detail panel displays a ticket with ancestors, **When** the `ss-hierarchy-breadcrumb` component renders, **Then** it shows a clickable ancestor chain (e.g., `Epic Name > Story Name > Current Task`).

6. **Given** the breadcrumb shows ancestors, **When** the user clicks an ancestor, **Then** that ticket is loaded in the detail panel.

7. **Given** a parent ticket is displayed in the detail panel, **When** children exist, **Then** they are displayed as a compact clickable list below the description.

8. **Given** a child is shown in the detail panel's children list, **When** the user clicks it, **Then** it loads in the detail panel (list panel is unaffected).

9. **Given** a ticket has no parent, **When** the detail panel renders, **Then** no breadcrumb is shown.

10. **Given** the ticket creation form is displayed, **When** the user inspects the form, **Then** an optional "Parent" field with autocomplete to select an existing ticket is available.

11. **Given** a user is viewing a parent ticket's detail, **When** they create a sub-task from that view, **Then** the parent reference is pre-filled.

## Tasks / Subtasks

### Task 1: Add hierarchy validation to REST API (AC: #2)

Add parent-child hierarchy rule validation to `SpectraSight.REST.TicketHandler`.

- [x] **Subtask 1.1:** Create `ClassMethod ValidateHierarchy(pParentId As %Integer, pChildType As %String) As %Status` in `SpectraSight.Util.Validation`
  - Open parent ticket, determine its type
  - Validate rules:
    - Epic can contain: Story (valid), Task (invalid), Bug (valid), Epic (invalid)
    - Story can contain: Task (valid), Bug (valid), Story (invalid), Epic (invalid)
    - Task can contain: nothing (invalid for all child types except Bug)
    - Bug can link to: any type (valid as child of Epic, Story, Task)
  - Return `$$$OK` if valid, error status with descriptive message if invalid
- [x] **Subtask 1.2:** Integrate `ValidateHierarchy` into `CreateTicket` method -- validate when `parentId` is provided in the request body
- [x] **Subtask 1.3:** Integrate `ValidateHierarchy` into `UpdateTicket` method -- validate when `parentId` is changed
- [x] **Subtask 1.4:** Allow setting `parentId` to empty/null in `UpdateTicket` to remove a parent (un-link from hierarchy)

### Task 2: Enhance `GET /api/tickets/:id` to include children and parent object (AC: #4)

- [x] **Subtask 2.1:** In `BuildTicketResponse`, replace the simple `parentId` string with a `parent` object: `{ "id": "SS-1", "title": "Epic Name", "type": "epic" }`. Keep `parentId` as well for backward compatibility.
- [x] **Subtask 2.2:** Add `children` array to `BuildTicketResponse` by querying: `SELECT ID, Title, Status FROM SpectraSight_Model.Ticket WHERE Parent = ?` (using the ticket's internal ID)
  - Each child object: `{ "id": "SS-3", "title": "Task Name", "status": "Open", "type": "task" }`
- [x] **Subtask 2.3:** For list responses (`GET /api/tickets`), do NOT include children array (performance). Only include `parentId` string as currently done.

### Task 3: Add parent index to Ticket model (performance)

- [x] **Subtask 3.1:** Add `Index ParentIdx On Parent` to `SpectraSight.Model.Ticket` class for efficient children queries
- [x] **Subtask 3.2:** Recompile the Ticket class and verify Storage definition is updated

### Task 4: Update frontend Ticket model (AC: #4)

- [x] **Subtask 4.1:** Add to `ticket.model.ts`:
  ```typescript
  export interface TicketRef {
    id: string;
    title: string;
    type: TicketType;
  }

  export interface TicketChild {
    id: string;
    title: string;
    status: TicketStatus;
    type: TicketType;
  }
  ```
- [x] **Subtask 4.2:** Add optional fields to `Ticket` interface:
  ```typescript
  parent?: TicketRef;
  children?: TicketChild[];
  ```

### Task 5: Create `ss-hierarchy-breadcrumb` component (AC: #5, #6, #9)

Create in `frontend/src/app/shared/hierarchy-breadcrumb/`.

- [x] **Subtask 5.1:** Create `hierarchy-breadcrumb.component.ts` as standalone with `ChangeDetectionStrategy.OnPush`
- [x] **Subtask 5.2:** Inputs: `ticket` (Ticket) -- the current ticket with parent data
- [x] **Subtask 5.3:** Output: `ancestorClicked` (emits ticket ID string)
- [x] **Subtask 5.4:** Build ancestor chain: use `ticket.parent` to show immediate parent. For deeper hierarchy, the component shows the direct parent only (fetching full ancestor chain requires recursive API calls -- keep it simple for MVP by showing one level: `Parent Title > Current Title`)
  - **Alternative approach:** If the detail API response includes nested parent objects (parent has its own parent), build the full chain. Otherwise, show just the immediate parent as a clickable link.
- [x] **Subtask 5.5:** Template: clickable parent links separated by `>` chevrons, current ticket name (not clickable) at the end
- [x] **Subtask 5.6:** If ticket has no parent, render nothing (empty component)

### Task 6: Add children list to ticket detail (AC: #7, #8)

- [x] **Subtask 6.1:** In `ticket-detail.component.html`, add a "Children" section below description (conditional on `ticket.children?.length > 0`)
- [x] **Subtask 6.2:** Render each child as a compact row: `ss-type-icon` + title + `ss-status-badge` (compact), clickable
- [x] **Subtask 6.3:** On child click, call `ticketService.selectTicket(childId)` and navigate to `/tickets/{childId}` -- loads child in detail panel without changing list panel

### Task 7: Integrate breadcrumb into ticket detail (AC: #5, #6, #9)

- [x] **Subtask 7.1:** Add `<ss-hierarchy-breadcrumb>` above the title in the ticket detail panel
- [x] **Subtask 7.2:** Wire `ancestorClicked` event to navigate to that ticket: `ticketService.selectTicket(id)` + `router.navigate(['/tickets', id])`

### Task 8: Add "Parent" field to ticket creation form (AC: #10)

- [x] **Subtask 8.1:** Add a `parent` form control to the creation form in `ticket-create.component`
- [x] **Subtask 8.2:** Use `mat-autocomplete` with a search input that queries existing tickets
  - As user types, filter tickets locally from `ticketService.tickets()` signal (matching title or ID)
  - Display matching tickets as options: `ss-type-icon` + title + ID
- [x] **Subtask 8.3:** Selected parent sets `parentId` in the create request payload
- [x] **Subtask 8.4:** Validate hierarchy rules client-side for UX (show warning if invalid parent-child combo) -- backend validates authoritatively

### Task 9: Support pre-filled parent from detail view (AC: #11)

- [x] **Subtask 9.1:** Add "Add sub-task" button to the children section of ticket detail (or a "+" icon)
- [x] **Subtask 9.2:** When clicked, switch to creation form with `parentId` pre-filled to the current ticket's ID
- [x] **Subtask 9.3:** Pass the parent ID via the `tickets-page.component` `creating` state (extend to include optional `parentId`)

### Task 10: Add unit tests for hierarchy validation (AC: #2)

- [x] **Subtask 10.1:** In `SpectraSight.Test.TestREST` (or a new test class), add tests for `ValidateHierarchy`:
  - Epic -> Story: valid
  - Epic -> Task: invalid
  - Story -> Task: valid
  - Task -> Task: invalid (Tasks cannot have children except Bug)
  - Bug -> any parent type: valid
  - No parent: valid (AC: #3)
- [x] **Subtask 10.2:** Test that `CreateTicket` with invalid hierarchy returns 400 error
- [x] **Subtask 10.3:** Test that children array is populated in `GetTicket` response

### Task 11: Verify builds succeed (AC: all)

- [x] **Subtask 11.1:** Compile all modified ObjectScript classes on IRIS
- [x] **Subtask 11.2:** Run `ng build` in `/frontend` and verify zero errors

## Dev Notes

### Hierarchy Rules Matrix

| Parent Type | Valid Child Types |
|-------------|------------------|
| Epic        | Story, Bug       |
| Story       | Task, Bug        |
| Task        | Bug only         |
| Bug         | (no children)    |
| (no parent) | Any type (FR13)  |

Key rules:
- Epics contain Stories (and Bugs). Epics do NOT contain Tasks directly.
- Stories contain Tasks (and Bugs).
- Tasks can only contain Bugs.
- Bugs cannot have children.
- Any ticket can exist without a parent -- hierarchy is optional.

### Backend Changes Summary

**Modified classes:**
- `SpectraSight.Model.Ticket` -- add `Index ParentIdx On Parent`
- `SpectraSight.Util.Validation` -- add `ValidateHierarchy` classmethod
- `SpectraSight.REST.TicketHandler` -- integrate hierarchy validation in Create/Update, add children query to `BuildTicketResponse`

**Enhanced API response for `GET /api/tickets/:id`:**
```json
{
  "data": {
    "id": "SS-3",
    "type": "task",
    "title": "Implement login form",
    "status": "In Progress",
    "parentId": "SS-2",
    "parent": {
      "id": "SS-2",
      "title": "User Authentication Story",
      "type": "story"
    },
    "children": [
      { "id": "SS-5", "title": "Write unit tests", "status": "Open", "type": "task" }
    ],
    ...
  }
}
```

**List response (`GET /api/tickets`) remains unchanged** -- no children array, just `parentId` string. This keeps list queries fast.

### ObjectScript Implementation Notes

**`ValidateHierarchy` method pattern:**
```objectscript
ClassMethod ValidateHierarchy(pParentId As %Integer, pChildType As %String) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tParent = ##class(SpectraSight.Model.Ticket).%OpenId(pParentId)
        If tParent = "" {
            Set tSC = $$$ERROR($$$GeneralError, "Parent ticket not found")
            Quit
        }
        Set tParentType = ..GetTicketType(tParent)  // Reuse from TicketHandler or duplicate
        // Validate based on rules matrix...
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}
```

**Wait -- `GetTicketType` is on `TicketHandler`, not `Validation`.** The dev agent should either:
1. Move `GetTicketType` to `Validation` class (better reuse)
2. Duplicate the logic in `ValidateHierarchy`
3. Call `##class(SpectraSight.REST.TicketHandler).GetTicketType(tParent)` (cross-class call)

Option 3 is simplest for MVP.

**Children query in `BuildTicketResponse`:**
```objectscript
// Add children array
Set tChildren = ##class(%DynamicArray).%New()
Set tChildSQL = "SELECT ID FROM SpectraSight_Model.Ticket WHERE Parent = ?"
Set tChildStmt = ##class(%SQL.Statement).%New()
Set tSC2 = tChildStmt.%Prepare(tChildSQL)
If $$$ISOK(tSC2) {
    Set tChildRS = tChildStmt.%Execute(pTicket.%Id())
    While tChildRS.%Next() {
        Set tChild = ##class(SpectraSight.Model.Ticket).%OpenId(tChildRS.ID)
        If tChild '= "" {
            Set tChildObj = ##class(%DynamicObject).%New()
            Do tChildObj.%Set("id", ##class(SpectraSight.Util.TicketID).Format(tChild.%Id()))
            Do tChildObj.%Set("title", tChild.Title)
            Do tChildObj.%Set("status", tChild.Status)
            Do tChildObj.%Set("type", ..GetTicketType(tChild))
            Do tChildren.%Push(tChildObj)
        }
    }
}
Do tObj.%Set("children", tChildren)
```

### Frontend Component Architecture

```
ticket-detail.component (modified)
  ├── ss-hierarchy-breadcrumb (NEW)     -- above title, shows parent chain
  │   └── clickable ancestor links
  ├── [existing detail fields]
  ├── children section (NEW)             -- below description
  │   └── compact child rows (type-icon + title + status-badge)
  └── "Add sub-task" button (NEW)

ticket-create.component (modified)
  └── parent field with mat-autocomplete (NEW)
```

### Breadcrumb Design

```
For a Task with parent Story, which has parent Epic:
┌──────────────────────────────────────────┐
│ Epic Name > Story Name > Current Task    │
│ [clickable] [clickable]  [current, bold] │
└──────────────────────────────────────────┘

For a standalone ticket (no parent):
(no breadcrumb rendered)
```

**MVP simplification:** The `GET /api/tickets/:id` response includes `parent` as `{ id, title, type }`. For a full ancestor chain, the frontend would need to recursively fetch parent's parent. For MVP, showing just the immediate parent in the breadcrumb is acceptable. If the API includes nested parent data (parent's parent), render the full chain.

### Children List Design

```
┌─ Children ────────────────────────────┐
│ [bug-icon] Fix login crash    ● Open  │  <- clickable row
│ [task-icon] Write tests    ● Complete │  <- clickable row
│                          [+ Add task] │  <- creates sub-task
└───────────────────────────────────────┘
```

### Parent Autocomplete in Creation Form

```
┌─ Parent (optional) ──────────────────┐
│ [search input: "Auth"]               │
│ ┌────────────────────────────────┐   │
│ │ [epic] Authentication Epic SS-1│   │  <- autocomplete dropdown
│ │ [story] User Auth Story   SS-2 │   │
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

Filter from `ticketService.tickets()` locally -- no new API endpoint needed for autocomplete since we already load all tickets.

### What This Story Does NOT Include

- No drag-and-drop reordering of children
- No bulk parent assignment
- No recursive deletion of children when parent is deleted (children become standalone)
- No visual tree view -- hierarchy is navigated via breadcrumbs and child lists only
- No filter by "has parent" or "is standalone"
- Full ancestor chain beyond immediate parent (deferred -- show one level for MVP)

### Dependencies

**Depends on:**
- Story 1.1 (done): %Persistent model with Parent property on Ticket
- Story 1.2 (review): REST API CRUD endpoints
- Story 1.5 (ready-for-dev): Ticket detail component (breadcrumb and children go here)
- Story 1.6 (ready-for-dev): Ticket creation form (parent field goes here)

**Blocks:**
- No other stories directly depend on hierarchy, but Epic 2 stories build on this foundation

### Lessons from Previous Stories

1. **ObjectScript naming**: NO underscores. `ValidateHierarchy`, not `Validate_Hierarchy`. `pParentId`, not `p_parent_id`.
2. **Try/Catch pattern**: mandatory for all methods returning `%Status`.
3. **`%SQL.Statement`** for queries: already used in `ListTickets`. Same pattern for children query.
4. **Angular standalone components** with `ChangeDetectionStrategy.OnPush`.
5. **`mat-autocomplete`** from `@angular/material` -- import `MatAutocompleteModule`.
6. **CSS custom properties** for all styling: `var(--ss-*)`.
7. **Test pattern**: `%RegisteredObject` with SqlProc runner (not `%UnitTest.Manager`). See Story 1.2 test class.

### References

- [Architecture: Data Architecture] `_bmad-output/planning-artifacts/architecture.md` -- Ticket model, parent reference
- [Architecture: API URL Structure] `_bmad-output/planning-artifacts/architecture.md` -- GET /api/tickets/:id response
- [Architecture: Validation Strategy] `_bmad-output/planning-artifacts/architecture.md` -- backend-authoritative validation
- [UX: Hierarchy Breadcrumb] `_bmad-output/planning-artifacts/ux-design-specification.md` -- ss-hierarchy-breadcrumb component
- [Epics: Story 2.1] `_bmad-output/planning-artifacts/epics.md` -- Story acceptance criteria
- [Story 1.2: REST API] `_bmad-output/implementation-artifacts/1-2-rest-api-for-ticket-operations.md` -- TicketHandler, BuildTicketResponse, Validation class
- [Story 1.5: Detail View] `_bmad-output/implementation-artifacts/1-5-ticket-detail-view-and-inline-editing.md` -- detail component to extend
- [Story 1.6: Creation] `_bmad-output/implementation-artifacts/1-6-ticket-creation-and-deletion.md` -- creation form to extend

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- IRIS tests: 16 passed, 0 failed (13 existing + 3 new hierarchy tests)
- Angular tests: 254 of 254 passed (0 failures)
- Angular build: success (zero errors)

### Completion Notes List

- Task 1: Added `ValidateHierarchy` classmethod to `SpectraSight.Util.Validation` with full hierarchy rules matrix (Epic->Story/Bug, Story->Task/Bug, Task->Bug, Bug->none). Integrated into both `CreateTicket` and `UpdateTicket` in `TicketHandler`. Setting parentId to empty/null in UpdateTicket removes the parent.
- Task 2: Enhanced `BuildTicketResponse` with optional `pIncludeChildren` parameter. When true (detail view), includes `parent` object (id, title, type) and `children` array (id, title, status, type). When false (list view), excludes both for performance.
- Task 3: Added `Index ParentIdx On Parent` to `SpectraSight.Model.Ticket` for efficient children queries. Compiled and verified.
- Task 4: Added `TicketRef` and `TicketChild` interfaces to `ticket.model.ts`. Added optional `parent` and `children` fields to `Ticket` interface. Added `parentId` to `CreateTicketRequest`.
- Task 5: Created `ss-hierarchy-breadcrumb` standalone component with OnPush. Shows clickable parent link + chevron + current title. Renders nothing if no parent.
- Task 6: Added children section to ticket detail with compact clickable rows (type-icon + title + status-badge). Child click navigates to that ticket.
- Task 7: Integrated breadcrumb above title in detail panel. Wired ancestorClicked to navigate.
- Task 8: Added parent autocomplete to creation form using `mat-autocomplete`. Filters from local tickets signal. Client-side hierarchy warning. Selected parent sets parentId in request.
- Task 9: Added "Add sub-task" button to detail view. Pre-fills parent via `creatingParentId` signal on `TicketsPageComponent`.
- Task 10: Added 3 test methods: `TestValidateHierarchy` (all hierarchy rule combos), `TestHierarchyInCreate` (parent persistence), `TestChildrenInGetTicket` (children array, parent object, list vs detail).
- Task 11: All IRIS classes compiled successfully. Angular build succeeded with zero errors.

### Senior Developer Review (AI) - Pass 1

**Reviewer:** Claude Opus 4.6 | **Date:** 2026-02-15 | **Outcome:** Approved (with fixes applied)

**Issues Found:** 2 High, 3 Medium, 3 Low | **Fixed:** 2 High, 2 Medium, 2 Low

**H1 (FIXED):** `ValidateHierarchy` used bare `Quit` inside `Try` block, inconsistent with class pattern. Refactored to nested `If/ElseIf` without `Quit`.

**H2 (FIXED):** `CreateTicket` parsed `parentId` and opened parent via `%OpenId` twice (validation + assignment). Consolidated to single parse/open, reusing the validated parent object.

**M1 (FIXED):** `BuildTicketResponse` catch block was empty, silently swallowing errors. Added `^ClaudeDebug` logging.

**M2 (DEFERRED to LOW):** Children query in `BuildTicketResponse` uses N+1 `%OpenId` pattern. Attempted optimization with `%ClassName(1)` in SQL but it does not work in dynamic SQL `%Prepare`. Reverted to working N+1 approach. Acceptable for MVP since children counts are small.

**M3 (FIXED):** Breadcrumb hardcoded `max-width: 200px`. Changed to `var(--ss-breadcrumb-max-width, 200px)` for configurability.

**M4 (FIXED):** Hierarchy warning `computed` in create form read `FormControl.value` which is not signal-tracked. Added `selectedType` signal synced from `valueChanges` subscription with proper cleanup via `takeUntilDestroyed`.

**L1 (NOTE):** `styleUrl` (singular) is valid Angular 17+ syntax, consistent across components.

**L2 (FIXED):** "Add sub-task" button was shown on Bug tickets which cannot have children. Added `ticket.type !== 'bug'` guard.

**L3 (FIXED):** Removed unused `displayParent` method from create component.

### Senior Developer Review (AI) - Pass 2

**Reviewer:** Claude Opus 4.6 | **Date:** 2026-02-15 | **Outcome:** Approved (with fixes applied)

**Issues Found:** 1 High, 3 Medium, 1 Low | **Fixed:** 1 High, 3 Medium

**H3 (FIXED):** `UpdateTicket` had no self-parenting prevention. A ticket could be set as its own parent, creating a circular reference. Added check: `If tNewParentInternalId = tInternalId` returns 400 error. (`TicketHandler.cls:385`)

**M5 (FIXED):** `DeleteTicket` left dangling parent references on children. When a parent is deleted, child tickets retained broken `Parent` foreign key references. Added `UPDATE SET Parent = NULL WHERE Parent = ?` before delete to make orphans standalone. (`TicketHandler.cls:472-476`)

**M6 (FIXED):** Breadcrumb used `<a>` element without `href`, poor for accessibility and keyboard navigation. Changed to `<button>` with `all: unset` styling and added `:focus-visible` outline. (`hierarchy-breadcrumb.component.ts`)

**M7 (FIXED):** `mat-autocomplete` in parent field lacked `displayWith` function. After selecting a parent ticket (object value), the input would briefly flash `[object Object]` because Angular Material writes the display value after `optionSelected` fires. Added `displayParent()` method and `[displayWith]="displayParent"` binding. (`ticket-create.component.ts`, `ticket-create.component.html`)

**L4 (NOTE):** N+1 `%OpenId` pattern in `BuildTicketResponse` children query persists. `%ClassName(1)` is not available as a SQL function in IRIS. Acceptable for MVP given small child counts per ticket.

**AC Validation:** All 11 acceptance criteria re-verified as implemented.
**Task Audit:** All 11 tasks re-verified as complete.
**Tests:** 16/16 IRIS tests pass after fixes. Angular build succeeds (zero errors).

### Change Log

- 2026-02-15: Implemented Story 2.1 - Ticket Hierarchy & Navigation (all 11 tasks)
- 2026-02-15: Code review pass 1: fixed 6 issues (2 high, 2 medium, 2 low), deferred 1 N+1 optimization
- 2026-02-15: Code review pass 2: fixed 4 issues (1 high, 3 medium) -- self-parenting prevention, dangling parent cleanup on delete, breadcrumb a11y, autocomplete displayWith

### File List

**Backend (modified):**
- src/SpectraSight/Model/Ticket.cls (added ParentIdx index)
- src/SpectraSight/Util/Validation.cls (added ValidateHierarchy classmethod)
- src/SpectraSight/REST/TicketHandler.cls (hierarchy validation in Create/Update, parent object + children array in BuildTicketResponse, list mode excludes children)
- src/SpectraSight/Test/TestREST.cls (added TestValidateHierarchy, TestHierarchyInCreate, TestChildrenInGetTicket)

**Frontend (new):**
- frontend/src/app/shared/hierarchy-breadcrumb/hierarchy-breadcrumb.component.ts

**Frontend (modified):**
- frontend/src/app/tickets/ticket.model.ts (TicketRef, TicketChild interfaces, parent/children on Ticket, parentId on CreateTicketRequest)
- frontend/src/app/tickets/ticket-detail/ticket-detail.component.ts (imports, navigateToTicket, onAddSubtask, addSubtaskRequested output)
- frontend/src/app/tickets/ticket-detail/ticket-detail.component.html (breadcrumb, children section, add sub-task button)
- frontend/src/app/tickets/ticket-detail/ticket-detail.component.scss (children styles)
- frontend/src/app/tickets/ticket-create/ticket-create.component.ts (parent autocomplete, hierarchy warning, prefillParentId input)
- frontend/src/app/tickets/ticket-create/ticket-create.component.html (parent autocomplete field)
- frontend/src/app/tickets/ticket-create/ticket-create.component.scss (parent option, hierarchy warning styles)
- frontend/src/app/tickets/tickets-page.component.ts (creatingParentId signal, onAddSubtask handler, prefillParentId passed to create component)

**Sprint tracking (modified):**
- _bmad-output/implementation-artifacts/sprint-status.yaml (2-1 status: in-progress -> review)
- _bmad-output/implementation-artifacts/2-1-ticket-hierarchy-and-navigation.md (status: review, all tasks checked)

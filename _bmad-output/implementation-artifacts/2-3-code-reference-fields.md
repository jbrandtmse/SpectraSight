# Story 2.3: Code Reference Fields

Status: done

## Story

As a developer,
I want to add structured ObjectScript class and method references to tickets,
So that my tickets are directly linked to the code I'm working on without pasting class names into free-text descriptions.

## Acceptance Criteria

1. **Given** the ticket detail view exists from Epic 1, **When** a user clicks "Add code reference" on a ticket's detail panel, **Then** an `ss-code-reference` input field appears with two parts: Class Name (autocomplete) and Method Name (optional autocomplete).

2. **Given** the code reference input is shown, **When** the user types in the class name field, **Then** autocomplete suggestions appear from `GET /api/classes`.

3. **Given** a class is selected, **When** the user moves to the method name field, **Then** autocomplete suggestions appear from `GET /api/classes/:name/methods`.

4. **Given** the REST API, **When** `GET /api/classes` is called, **Then** it queries `%Dictionary.ClassDefinition` for available ObjectScript classes.

5. **Given** the REST API, **When** `GET /api/classes/:name/methods` is called, **Then** it queries `%Dictionary.MethodDefinition` for methods on the specified class.

6. **Given** a ticket, **When** the user adds code references, **Then** multiple code references can be added to a single ticket.

7. **Given** code references are saved, **When** the ticket detail is displayed, **Then** saved code references are displayed in monospace font (e.g., `HS.Integration.PatientValidator.ValidateRecord`) as structured fields separate from the description (FR16).

8. **Given** a saved code reference, **When** the user clicks the delete action, **Then** the code reference is removed from the ticket.

9. **Given** a code reference is added or removed, **When** the operation completes, **Then** a `CodeReferenceChange` activity entry is created server-side with className, methodName, and action (added/removed).

10. **Given** the REST API, **When** `GET /api/tickets/:id` is called, **Then** the response includes a `codeReferences` array with all references for that ticket.

## Tasks / Subtasks

### Task 1: Create `ClassHandler.cls` REST handler (AC: #4, #5)

Create `src/SpectraSight/REST/ClassHandler.cls` for ObjectScript class/method introspection.

- [x] **Subtask 1.1:** Create `ClassHandler.cls` extending no base (abstract utility class with ClassMethods)
- [x] **Subtask 1.2:** Implement `ListClasses()` method:
  - Query `%Dictionary.ClassDefinition` for user classes (exclude system classes starting with `%`)
  - Accept `search` query param for filtering by class name prefix
  - Return JSON array of `{ name, super }` objects via `Response.Success()`
  - Limit results to 50 for autocomplete performance
- [x] **Subtask 1.3:** Implement `ListMethods(pClassName)` method:
  - Extract class name from URL parameter (`:name`)
  - Query `%Dictionary.MethodDefinition` where `parent = :className`
  - Return JSON array of `{ name, classMethod, returnType }` objects
  - Return 404 if class not found
- [x] **Subtask 1.4:** Follow existing patterns: Try/Catch, `%Status` return, `%DynamicObject`/`%DynamicArray` for JSON

### Task 2: Add routes to Dispatch.cls (AC: #4, #5)

- [x] **Subtask 2.1:** Add `GET /api/classes` route → `SpectraSight.REST.ClassHandler:ListClasses`
- [x] **Subtask 2.2:** Add `GET /api/classes/:name/methods` route → `SpectraSight.REST.ClassHandler:ListMethods`

### Task 3: Add code reference endpoints to TicketHandler.cls (AC: #1, #6, #8, #9, #10)

- [x] **Subtask 3.1:** Add `POST /api/tickets/:id/code-references` endpoint (`AddCodeReference` method):
  - Parse request body: `{ className, methodName? }`
  - Validate ticket exists
  - Create `SpectraSight.Model.CodeReference` with Ticket, ClassName, MethodName, AddedBy (from `ActivityRecorder.GetActorFromRequest()`)
  - Save and return 201 Created with the new reference data
  - Record `CodeReferenceChange` activity with action="added"
- [x] **Subtask 3.2:** Add `DELETE /api/tickets/:id/code-references/:refId` endpoint (`RemoveCodeReference` method):
  - Validate ticket exists and code reference belongs to that ticket
  - Record `CodeReferenceChange` activity with action="removed" BEFORE deleting
  - Delete the code reference
  - Return 204 No Content
- [x] **Subtask 3.3:** Add routes to `Dispatch.cls`:
  - `POST /tickets/:id/code-references` → `TicketHandler:AddCodeReference`
  - `DELETE /tickets/:id/code-references/:refId` → `TicketHandler:RemoveCodeReference`

### Task 4: Update BuildTicketResponse to include codeReferences (AC: #10)

- [x] **Subtask 4.1:** In `TicketHandler.BuildTicketResponse`, query `SpectraSight.Model.CodeReference` where `Ticket = :ticketId`
- [x] **Subtask 4.2:** Build a `%DynamicArray` of code reference objects with: id, className, methodName, addedBy, timestamp
- [x] **Subtask 4.3:** Add `codeReferences` property to the ticket response object

### Task 5: Add `RecordCodeReferenceChange` to ActivityRecorder (AC: #9)

- [x] **Subtask 5.1:** Add `RecordCodeReferenceChange(pTicketId, pClassName, pMethodName, pAction, pActorName, pActorType)` method to `ActivityRecorder.cls`
  - Follow the existing `RecordStatusChange` / `RecordAssignmentChange` pattern exactly
  - Create `CodeReferenceChange` activity with ClassName, MethodName, Action properties

### Task 6: Add `CodeReference` interface to ticket.model.ts (AC: #7, #10)

- [x] **Subtask 6.1:** Add `CodeReference` interface:
  ```typescript
  export interface CodeReference {
    id: number;
    className: string;
    methodName?: string;
    addedBy?: string;
    timestamp?: string;
  }
  ```
- [x] **Subtask 6.2:** Add `codeReferences?: CodeReference[]` to the `Ticket` interface

### Task 7: Create `CodeReferenceService` (AC: #2, #3, #6, #8)

Create `frontend/src/app/code-references/code-reference.service.ts`.

- [x] **Subtask 7.1:** Create as injectable service with `HttpClient`
- [x] **Subtask 7.2:** `listClasses(search?: string)` — GET `/api/classes?search={search}`
- [x] **Subtask 7.3:** `listMethods(className: string)` — GET `/api/classes/${className}/methods`
- [x] **Subtask 7.4:** `addCodeReference(ticketId: string, className: string, methodName?: string)` — POST `/api/tickets/${ticketId}/code-references`
- [x] **Subtask 7.5:** `removeCodeReference(ticketId: string, refId: number)` — DELETE `/api/tickets/${ticketId}/code-references/${refId}`

### Task 8: Create `ss-code-reference` component (AC: #1, #2, #3, #6, #7, #8)

Create `frontend/src/app/code-references/code-reference-field/`.

- [x] **Subtask 8.1:** Create `code-reference-field.component.ts` as standalone, `OnPush`
- [x] **Subtask 8.2:** Inputs: `codeReferences: CodeReference[]` (existing refs for this ticket), `ticketId: string`
- [x] **Subtask 8.3:** Outputs: `referenceAdded` (emits new `CodeReference`), `referenceRemoved` (emits ref id)
- [x] **Subtask 8.4:** Display mode: list saved references in monospace font (`ClassName.MethodName` or just `ClassName`), each with a remove (X) button
- [x] **Subtask 8.5:** Edit mode: triggered by "Add code reference" button/link
  - Class name input with `mat-autocomplete` — calls `CodeReferenceService.listClasses()` on type with debounce
  - Method name input with `mat-autocomplete` — calls `CodeReferenceService.listMethods()` after class selected
  - "Add" button to confirm, "Cancel" to dismiss
- [x] **Subtask 8.6:** Use `aria-label="ObjectScript code reference"` and `role="combobox"` on autocomplete inputs
- [x] **Subtask 8.7:** Style with CSS custom properties `--ss-code-ref-*`, monospace font for display mode

### Task 9: Integrate into ticket-detail component (AC: #1, #6, #7, #8)

- [x] **Subtask 9.1:** Add `<ss-code-reference>` to `ticket-detail.component.html` below description, before children section
- [x] **Subtask 9.2:** Pass `codeReferences` from `ticketService.selectedTicket()` and `ticketId`
- [x] **Subtask 9.3:** Handle `referenceAdded` — call `CodeReferenceService.addCodeReference()`, then reload ticket
- [x] **Subtask 9.4:** Handle `referenceRemoved` — call `CodeReferenceService.removeCodeReference()`, then reload ticket

### Task 10: Verify builds and existing tests (AC: all)

- [x] **Subtask 10.1:** Compile all modified/new ObjectScript classes on IRIS
- [x] **Subtask 10.2:** Run `ng build` and verify zero errors
- [x] **Subtask 10.3:** Run existing tests and verify no regressions

## Dev Notes

### Existing Backend Infrastructure

**CodeReference model already exists** at `src/SpectraSight/Model/CodeReference.cls`:
- Properties: Ticket (required ref), ClassName (MAXLEN=500), MethodName (MAXLEN=255), AddedBy, Timestamp
- Indexes: TicketIdx, ClassNameIdx
- Extends `%Persistent` and `%JSON.Adaptor`
- `%OnNew` auto-sets Timestamp

**CodeReferenceChange activity model already exists** at `src/SpectraSight/Model/CodeReferenceChange.cls`:
- Extends `SpectraSight.Model.Activity`
- Properties: ClassName, MethodName, Action (VALUELIST: "added,removed")

**ActivityRecorder utility** at `src/SpectraSight/Util/ActivityRecorder.cls`:
- Has `RecordStatusChange` and `RecordAssignmentChange` — follow the same pattern for `RecordCodeReferenceChange`
- Uses `GetActorFromRequest()` for actor name

**Response helper** at `src/SpectraSight/REST/Response.cls`:
- `Success()`, `Created()`, `SuccessNoContent()`, `PaginatedList()`, `Error()`, `NotFound()`, `BadRequest()`, `ServerError()`

### REST Dispatch Current Routes

```
GET    /tickets              → TicketHandler:ListTickets
POST   /tickets              → TicketHandler:CreateTicket
GET    /tickets/:id          → TicketHandler:GetTicket
PUT    /tickets/:id          → TicketHandler:UpdateTicket
DELETE /tickets/:id          → TicketHandler:DeleteTicket
```

New routes to add:
```
GET    /classes              → ClassHandler:ListClasses
GET    /classes/:name/methods → ClassHandler:ListMethods
POST   /tickets/:id/code-references      → TicketHandler:AddCodeReference
DELETE /tickets/:id/code-references/:refId → TicketHandler:RemoveCodeReference
```

### IRIS Class Introspection Pattern

For querying available classes:
```objectscript
Set tSQL = "SELECT Name, Super FROM %Dictionary.ClassDefinition WHERE Name NOT LIKE '%.' AND Name NOT LIKE '\%%' ESCAPE '\'"
```

For querying methods on a class:
```objectscript
Set tSQL = "SELECT Name, ClassMethod, ReturnType FROM %Dictionary.MethodDefinition WHERE parent = ?"
```

### Frontend Component Architecture

```
ticket-detail.component
  ├── ... existing sections ...
  └── ss-code-reference (NEW)
        ├── display list (monospace, remove buttons)
        └── add form (class autocomplete + method autocomplete)

code-references/ (NEW feature folder)
  ├── code-reference.service.ts
  ├── code-reference.model.ts (or add to ticket.model.ts)
  └── code-reference-field/
      ├── code-reference-field.component.ts
      ├── code-reference-field.component.html
      ├── code-reference-field.component.scss
      └── code-reference-field.component.spec.ts
```

### UX Spec: Code Reference Field Anatomy

From `ux-design-specification.md`:
- **Anatomy:** Two-part field: `[Class Name (autocomplete)] [. Method Name (optional autocomplete)]`
- **Display mode:** `HS.Integration.PatientValidator.ValidateRecord` in monospace
- **States:** Edit (input fields with autocomplete), Display (monospace text), Empty ("Add code reference")
- **Behavior:** Type class name for autocomplete. Dot triggers method autocomplete. Multiple refs per ticket.
- **Accessibility:** `aria-label="ObjectScript code reference"`, autocomplete uses `role="combobox"`

### What This Story Does NOT Include

- No "code view" feature (clicking a reference to open code — post-MVP)
- No cross-ticket queries ("which tickets reference this class?") — post-MVP
- No inline code reference creation during ticket creation (only from detail view)
- No batch operations on code references

### Dependencies

**Depends on:**
- Story 1.1 (done): CodeReference model and CodeReferenceChange activity model
- Story 1.2 (done): REST API patterns, Response helper, ActivityRecorder
- Story 1.5 (done): Ticket detail component
- Story 2.1 (done): Ticket hierarchy (context for detail view structure)

### Lessons from Previous Stories

1. **ObjectScript naming**: NO underscores. `tClassName`, not `t_class_name`.
2. **Angular standalone components** with `ChangeDetectionStrategy.OnPush`.
3. **Angular Signals** for all reactive state. Use `signal()`, `computed()`, `effect()`.
4. **Mat-autocomplete**: Use `mat-autocomplete` with `mat-option` and `displayWith` pipe.
5. **CSS custom properties** for all styling.
6. **Debounce pattern**: Use `debounceTime(300)` from rxjs with `valueChanges` on FormControl.
7. **REST patterns**: Try/Catch, `%Status`, `Response.Success()`/`Response.Created()`/`Response.NotFound()`.
8. **SQL table names**: Use schema-qualified names (e.g., `SpectraSight_Model.CodeReference`) — NOT `$TRANSLATE(class, ".", "_")`.

### References

- [Architecture: FR14-16] `_bmad-output/planning-artifacts/architecture.md` — Code reference model, ClassHandler
- [UX: Code Reference Field] `_bmad-output/planning-artifacts/ux-design-specification.md` — ss-code-reference component spec
- [Epics: Story 2.3] `_bmad-output/planning-artifacts/epics.md` — Acceptance criteria
- [Story 1.1: Data Model] `_bmad-output/implementation-artifacts/1-1-project-scaffold-and-ticket-data-model.md` — CodeReference.cls, CodeReferenceChange.cls
- [Story 1.2: REST API] `_bmad-output/implementation-artifacts/1-2-rest-api-for-ticket-operations.md` — TicketHandler patterns, Response helper
- [Story 1.5: Detail View] `_bmad-output/implementation-artifacts/1-5-ticket-detail-view-and-inline-editing.md` — ticket-detail component

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- IRIS backend tests: 21 passed, 0 failed (TestREST.RunAll)
- Angular frontend tests: 347 of 347 SUCCESS
- ng build: zero errors (pre-existing budget warnings only)

### Completion Notes List
- Task 1: Created ClassHandler.cls as abstract utility class with ListClasses() and ListMethods() ClassMethods. ListClasses queries %Dictionary.ClassDefinition excluding system classes (%), accepts search param, limits to 50 results. ListMethods queries %Dictionary.MethodDefinition by parent class, returns 404 if class not found.
- Task 2: Added 4 new routes to Dispatch.cls for classes and code-references endpoints. Route order matters: /classes/:name/methods before /classes to ensure proper matching.
- Task 3: Added AddCodeReference (POST, 201 Created) and RemoveCodeReference (DELETE, 204 No Content) to TicketHandler. Both validate ticket exists. RemoveCodeReference validates ref belongs to the ticket and records activity BEFORE deletion.
- Task 4: Updated BuildTicketResponse to include codeReferences array in detail view (pIncludeChildren=1) but not in list view (pIncludeChildren=0).
- Task 5: Added RecordCodeReferenceChange to ActivityRecorder following the exact pattern of RecordStatusChange and RecordAssignmentChange.
- Task 6: Added CodeReference interface and codeReferences optional property to Ticket interface in ticket.model.ts.
- Task 7: Created CodeReferenceService with listClasses, listMethods, addCodeReference, and removeCodeReference methods.
- Task 8: Created ss-code-reference standalone component with OnPush change detection, signal-based state, mat-autocomplete for class/method, debounced search, monospace display, remove buttons, CSS custom properties, and aria-labels.
- Task 9: Integrated ss-code-reference into ticket-detail component below description and before children. Handlers call refreshTickets() to reload ticket data.
- Task 10: All IRIS classes compiled successfully. ng build zero errors. 21/21 backend tests pass. 347/347 frontend tests pass.

### Change Log
- 2026-02-15: Implemented Story 2.3 - Code Reference Fields (all 10 tasks)
- 2026-02-15: Code review completed - 3 HIGH and 1 MEDIUM issues found and fixed

### File List
- src/SpectraSight/REST/ClassHandler.cls (new)
- src/SpectraSight/REST/Dispatch.cls (modified)
- src/SpectraSight/REST/TicketHandler.cls (modified)
- src/SpectraSight/Util/ActivityRecorder.cls (modified)
- src/SpectraSight/Test/TestREST.cls (modified)
- frontend/src/app/tickets/ticket.model.ts (modified)
- frontend/src/app/tickets/ticket.service.ts (modified)
- frontend/src/app/code-references/code-reference.service.ts (new)
- frontend/src/app/code-references/code-reference-field/code-reference-field.component.ts (new)
- frontend/src/app/code-references/code-reference-field/code-reference-field.component.html (new)
- frontend/src/app/code-references/code-reference-field/code-reference-field.component.scss (new)
- frontend/src/app/code-references/code-reference-field/code-reference-field.component.spec.ts (new)
- frontend/src/app/tickets/ticket-detail/ticket-detail.component.ts (modified)
- frontend/src/app/tickets/ticket-detail/ticket-detail.component.html (modified)

## Senior Developer Review (AI)

**Reviewer:** Code Review Agent (Claude Opus 4.6)
**Date:** 2026-02-15
**Outcome:** Approved (all issues auto-fixed)

### Findings

#### HIGH Severity (3 found, 3 fixed)

1. **Method autocomplete fired redundant API calls on every keystroke** (`code-reference-field.component.ts:65-76`)
   - The `methodControl.valueChanges` subscription called `listMethods()` on every keystroke ignoring the typed value, fetching the same full method list repeatedly.
   - **Fix:** Methods are now fetched once on class selection in `onClassSelected()`. Method input filters the cached list client-side.

2. **No error handling in HTTP subscriptions** (`code-reference-field.component.ts:104-117`)
   - `addReference()` and `removeReference()` had no `error` handlers. Failed API calls were silently swallowed with no user feedback.
   - **Fix:** Added `error` callbacks that show a `MatSnackBar` notification on failure.

3. **Code references disappeared from UI after add/remove** (`ticket-detail.component.ts:104-109`)
   - `onCodeReferenceAdded` and `onCodeReferenceRemoved` called `refreshTickets()` which loads the list view (excludes `codeReferences` from response). The `selectedTicket` computed signal then had `undefined` for `codeReferences`, causing all references to vanish.
   - **Fix:** Replaced `refreshTickets()` with `reloadSelectedTicket()` which calls `getTicket()` (detail view with `codeReferences`) and updates the ticket in the list via new `updateTicketInList()` method on `TicketService`.

#### MEDIUM Severity (1 found, 1 fixed)

4. **No input length validation for className/methodName on backend** (`TicketHandler.cls:513-515`)
   - `AddCodeReference` validated `className` for empty string only, not against `MAXLEN=500`. A very long string could cause save errors with unhelpful messages.
   - **Fix:** Added length validation for `className` (max 500) and `methodName` (max 255) before save, returning clear 400 error messages.

#### LOW Severity (1 found, 1 fixed)

5. **Subscription leak in component constructor** (`code-reference-field.component.ts:51-76`)
   - Two `FormControl.valueChanges` subscriptions were created without cleanup on destroy.
   - **Fix:** Added `DestroyRef` + `takeUntilDestroyed()` to both subscriptions.

### Verification
- IRIS backend: 21/21 tests pass
- Angular frontend: 347/347 tests pass
- ng build: zero errors (pre-existing budget warnings only)
- All HIGH and MEDIUM issues resolved

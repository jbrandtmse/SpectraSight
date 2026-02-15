# Story 1.6: Ticket Creation & Deletion

Status: done

## Story

As a developer,
I want to create new tickets quickly with just a title and type, and delete tickets I no longer need,
So that capturing work is frictionless and cleaning up is safe.

## Acceptance Criteria

1. **Given** a developer is viewing the split-panel interface from Story 1.5, **When** they click "New Ticket" in the toolbar or press Ctrl+N, **Then** an inline creation form appears in the detail panel with Title (required) and Type (required, select: Bug/Task/Story/Epic).

2. **Given** the creation form is displayed, **When** inspected, **Then** optional fields are visible but empty: Status (defaults to "Open"), Priority, Assignee, Description.

3. **Given** valid title + type are entered, **When** the form is submitted, **Then** the ticket is created, added to the list, selected, and a snackbar shows "Ticket SS-{id} created".

4. **Given** the creation form is submitted, **When** measured, **Then** the creation completes in under 3 seconds (title + type + submit).

5. **Given** the creation form is displayed, **When** submitting without a title, **Then** an inline validation error "Title is required" is shown.

6. **Given** a ticket is displayed in the detail panel, **When** a "Delete" button (red text, tertiary style) is visible, **Then** clicking it opens a confirmation dialog: "Delete ticket SS-{id}?" with "Cancel" and "Delete" actions.

7. **Given** the delete confirmation dialog is open, **When** "Delete" is confirmed, **Then** the ticket is removed from the list, the detail panel is cleared, and a snackbar confirmation is shown.

8. **Given** the delete confirmation dialog is open, **When** Cancel or Escape is pressed, **Then** the dialog is dismissed without deleting.

## Tasks / Subtasks

### Task 1: Add `createTicket()` and `deleteTicket()` to TicketService (AC: #3, #7)

- [x] **Subtask 1.1:** Add `createTicket(data: CreateTicketRequest): Observable<Ticket>` method to `ticket.service.ts`
  - POST to `${environment.apiBaseUrl}/tickets` with the creation payload
  - On success: prepend the new ticket to `ticketsSignal`, select it, show snackbar "Ticket SS-{id} created"
  - Return the created ticket Observable for the component to handle navigation
- [x] **Subtask 1.2:** Add `deleteTicket(id: string): void` method to `ticket.service.ts`
  - DELETE to `${environment.apiBaseUrl}/tickets/${id}`
  - On success: remove ticket from `ticketsSignal`, clear selection (`selectTicket(null)`), show snackbar "Ticket deleted"
  - On failure: show error snackbar
- [x] **Subtask 1.3:** Add `CreateTicketRequest` interface to `ticket.model.ts`:
  ```typescript
  export interface CreateTicketRequest {
    type: TicketType;
    title: string;
    description?: string;
    status?: TicketStatus;
    priority?: TicketPriority;
    assignee?: string;
  }
  ```

### Task 2: Create `ticket-create.component.ts` (AC: #1, #2, #3, #4, #5)

Create the inline creation form component in `frontend/src/app/tickets/ticket-create/`.

- [x] **Subtask 2.1:** Create `ticket-create.component.ts` as a standalone component with `ChangeDetectionStrategy.OnPush`
- [x] **Subtask 2.2:** Use a reactive `FormGroup` with:
  - `title`: `FormControl<string>` with `Validators.required`
  - `type`: `FormControl<TicketType | ''>` with `Validators.required`
  - `status`: `FormControl<TicketStatus>` defaulting to `'Open'`
  - `priority`: `FormControl<TicketPriority | ''>` (optional)
  - `assignee`: `FormControl<string>` (optional)
  - `description`: `FormControl<string>` (optional)
- [x] **Subtask 2.3:** Implement `onSubmit()`: validate form, call `ticketService.createTicket()`, on success navigate to `/tickets/{newId}` and emit `created` output
- [x] **Subtask 2.4:** Implement `onCancel()`: emit `cancelled` output to close the form
- [x] **Subtask 2.5:** Add `submitting` signal to show loading state during creation
- [x] **Subtask 2.6:** Show inline validation error "Title is required" when title is empty and form is submitted (AC: #5)

### Task 3: Create `ticket-create.component.html` template (AC: #1, #2, #5)

- [x] **Subtask 3.1:** Header: "New Ticket" title with close/cancel button
- [x] **Subtask 3.2:** Title field: `mat-form-field` with `matInput`, required asterisk, validation error display
- [x] **Subtask 3.3:** Type field: `mat-form-field` with `mat-select` containing Bug/Task/Story/Epic options with type icons
- [x] **Subtask 3.4:** Optional fields section: Status (mat-select, default "Open"), Priority (mat-select), Assignee (matInput), Description (textarea)
- [x] **Subtask 3.5:** Actions: "Create" primary button (disabled when form invalid or submitting) and "Cancel" text button

### Task 4: Create `ticket-create.component.scss` styles (AC: #1)

- [x] **Subtask 4.1:** Form layout with consistent spacing using `var(--ss-*)` tokens
- [x] **Subtask 4.2:** Compact form fields matching density -2
- [x] **Subtask 4.3:** Required fields visually distinct from optional fields

### Task 5: Add delete button to ticket-detail component (AC: #6, #7, #8)

- [x] **Subtask 5.1:** Add a "Delete" button at the bottom of the detail panel with red text, tertiary style (`mat-button` with `color="warn"`)
- [x] **Subtask 5.2:** On click, open a Material confirmation dialog (`MatDialog`)
- [x] **Subtask 5.3:** Dialog content: "Delete ticket SS-{id}?" with "Cancel" (default) and "Delete" (warn color) action buttons
- [x] **Subtask 5.4:** On confirm: call `ticketService.deleteTicket(id)`, close dialog, navigate to `/tickets`
- [x] **Subtask 5.5:** On cancel/Escape: close dialog, no action (AC: #8)

### Task 6: Create delete confirmation dialog component (AC: #6, #7, #8)

- [x] **Subtask 6.1:** Create `frontend/src/app/tickets/confirm-delete-dialog/confirm-delete-dialog.component.ts`
- [x] **Subtask 6.2:** Inject `MAT_DIALOG_DATA` to receive `{ ticketId: string }` data
- [x] **Subtask 6.3:** Template: title "Delete ticket?", content "Are you sure you want to delete ticket {ticketId}? This action cannot be undone.", actions: "Cancel" + "Delete"
- [x] **Subtask 6.4:** Use `MatDialogModule` (`mat-dialog-title`, `mat-dialog-content`, `mat-dialog-actions`, `mat-dialog-close`)

### Task 7: Add Ctrl+N keyboard shortcut and "New Ticket" button (AC: #1)

- [x] **Subtask 7.1:** Add "New Ticket" button to the toolbar component (or keep it in the list empty state -- both exist)
- [x] **Subtask 7.2:** Add `@HostListener('document:keydown.control.n')` or equivalent to handle Ctrl+N globally
- [x] **Subtask 7.3:** When triggered: set a `creating` signal/state in the tickets-page component to switch the detail panel to the creation form
- [x] **Subtask 7.4:** Replace the "Coming soon" snackbar in `ticket-list.component.ts` `onNewTicket()` with actual creation trigger

### Task 8: Integrate creation form into tickets-page (AC: #1, #3)

- [x] **Subtask 8.1:** Add `creating` signal to `tickets-page.component.ts`
- [x] **Subtask 8.2:** Detail panel logic: if `creating()` is true, show `<app-ticket-create>`. Otherwise if `selectedTicket()` exists, show `<app-ticket-detail>`. Otherwise show placeholder.
- [x] **Subtask 8.3:** On `app-ticket-create` `created` event: set `creating` to false, ticket is already selected by the service
- [x] **Subtask 8.4:** On `app-ticket-create` `cancelled` event: set `creating` to false

### Task 9: Verify `ng build` succeeds (AC: all)

- [x] **Subtask 9.1:** Run `ng build` in `/frontend` and verify zero compilation errors

## Dev Notes

### Architecture for Creation Flow

```
User clicks "New Ticket" or Ctrl+N
  → tickets-page sets creating = true
  → detail panel shows <app-ticket-create>
  → user fills title + type, optionally other fields
  → clicks "Create"
  → ticket-create calls ticketService.createTicket(data)
  → ticketService POSTs to /api/tickets
  → on success: ticket added to ticketsSignal, selected, snackbar shown
  → ticket-create emits created event
  → tickets-page sets creating = false
  → detail panel switches to <app-ticket-detail> showing the new ticket
  → URL updates to /tickets/SS-{newId}
```

### Architecture for Deletion Flow

```
User clicks "Delete" on detail panel
  → MatDialog opens with confirm-delete-dialog
  → user clicks "Delete" (or "Cancel"/Escape to abort)
  → on confirm: detail component calls ticketService.deleteTicket(id)
  → ticketService DELETEs /api/tickets/:id
  → on success: ticket removed from ticketsSignal, selection cleared, snackbar shown
  → detail component navigates to /tickets
  → detail panel shows placeholder
```

### REST API Endpoints

**Create:** `POST /api/tickets`
```json
// Request:
{ "type": "bug", "title": "Fix validation", "description": "...", "priority": "High" }

// Response (201 Created):
{ "data": { "id": "SS-1", "type": "bug", "title": "Fix validation", "status": "Open", ... } }
```

**Delete:** `DELETE /api/tickets/SS-{id}`
```json
// Response (204 No Content): empty body
```

**Error responses:** `{ "error": { "code": "BAD_REQUEST", "message": "Title is required", "status": 400 } }`

### Existing Code to MODIFY

**`ticket.service.ts`** -- Add `createTicket()` and `deleteTicket()` methods. Do NOT modify existing methods.

**`ticket.model.ts`** -- Add `CreateTicketRequest` interface. Do NOT modify existing interfaces (Story 1.5 may also add type-specific fields).

**`tickets-page.component.ts`** -- Add `creating` signal, import `TicketCreateComponent`, update template to show creation form conditionally.

**`ticket-list.component.ts`** -- Replace `onNewTicket()` "Coming soon" snackbar with actual creation trigger (emit event to parent).

**`ticket-detail.component.ts`** (created in Story 1.5) -- Add delete button and `MatDialog` integration. If Story 1.5 hasn't been developed yet, the dev agent should create the detail component first (see Story 1.5 file) or add the delete button to the placeholder.

### Existing Code to REUSE

- `TicketService` signals -- new ticket auto-appears in list, deleted ticket auto-disappears
- `ApiResponse<Ticket>` interface for create response typing
- Material components: `MatFormFieldModule`, `MatInputModule`, `MatSelectModule`, `MatButtonModule`, `MatDialogModule`, `MatSnackBar`
- `TypeIconComponent` for showing type icons in the type select options
- `ReactiveFormsModule` for form handling (same pattern as `LoginComponent`)

### File Structure (New Files)

```
frontend/src/app/tickets/
  ticket-create/
    ticket-create.component.ts       -- creation form
    ticket-create.component.html     -- form template
    ticket-create.component.scss     -- form styles
  confirm-delete-dialog/
    confirm-delete-dialog.component.ts  -- delete confirmation dialog
```

### Files to Modify

- `frontend/src/app/tickets/ticket.service.ts` -- add createTicket(), deleteTicket()
- `frontend/src/app/tickets/ticket.model.ts` -- add CreateTicketRequest
- `frontend/src/app/tickets/tickets-page.component.ts` -- add creating state, integrate create form
- `frontend/src/app/tickets/ticket-list/ticket-list.component.ts` -- wire up "New Ticket" button
- `frontend/src/app/tickets/ticket-detail/ticket-detail.component.ts` -- add delete button (if created by Story 1.5)

### Angular Patterns to Follow

- **Standalone components** with `ChangeDetectionStrategy.OnPush`
- **Reactive Forms** (`FormGroup`, `FormControl`, `Validators`) -- same pattern as login form
- **`MatDialog`** for confirmation dialog -- inject `MAT_DIALOG_DATA`, use `mat-dialog-close` for return value
- **Angular Signals** for `creating` and `submitting` state
- **`@if`/`@else`** control flow (not `*ngIf`)
- **No `any` type** -- use typed interfaces
- **CSS custom properties** for all colors/spacing

### Form Validation

- Title: required, show "Title is required" on blur or submit
- Type: required, show "Type is required" on blur or submit
- Status: optional, defaults to "Open" (set as initial value)
- Priority: optional, no default
- Assignee: optional, free text
- Description: optional, textarea

Use Angular Material form field error handling:
```html
<mat-form-field>
  <mat-label>Title</mat-label>
  <input matInput formControlName="title" />
  @if (form.controls.title.hasError('required') && form.controls.title.touched) {
    <mat-error>Title is required</mat-error>
  }
</mat-form-field>
```

### What This Story Does NOT Include

- No bulk creation
- No ticket duplication/cloning
- No undo for deletion
- No parent ticket assignment on create (Story 2.1)
- No code reference fields on create (Story 2.3)

### Dependencies

**Depends on:**
- Story 1.1 (done): Angular scaffold, Material components
- Story 1.2 (review): `POST /api/tickets`, `DELETE /api/tickets/:id` REST endpoints
- Story 1.3 (review): App shell, split panel, toolbar
- Story 1.4 (review): Ticket list, ticket service
- Story 1.5 (ready-for-dev): Ticket detail component (for delete button placement)

**Blocks:**
- Story 2.1: Parent field will be added to the creation form

### Lessons from Previous Stories

1. **Angular CLI v18.2.21** -- Angular 18 APIs.
2. **Angular Material v18.2.14** -- `MatDialogModule`, `MatSelectModule`, `MatFormFieldModule` available.
3. **Reactive Forms pattern** -- already used in `LoginComponent` (`FormGroup`, `FormControl`, `Validators.required`). Follow the same pattern.
4. **`environment.apiBaseUrl`** -- all HTTP calls use this, never hardcode URLs.
5. **Snackbar pattern** -- use `MatSnackBar.open(message, action?, config)` consistent with existing usage in error interceptor and ticket service.
6. **The login component** (`core/login/login.component.ts`) is the best reference for form implementation patterns in this project.

### References

- [Architecture: Frontend Architecture] `_bmad-output/planning-artifacts/architecture.md` -- component patterns, state management
- [Architecture: API URL Structure] `_bmad-output/planning-artifacts/architecture.md` -- POST /api/tickets, DELETE /api/tickets/:id
- [Architecture: Response Envelope] `_bmad-output/planning-artifacts/architecture.md` -- { data } for create, 204 for delete
- [UX: Ticket Creation] `_bmad-output/planning-artifacts/ux-design-specification.md` -- inline creation, minimal required fields
- [Epics: Story 1.6] `_bmad-output/planning-artifacts/epics.md` -- Story acceptance criteria
- [Story 1.5: Detail View] `_bmad-output/implementation-artifacts/1-5-ticket-detail-view-and-inline-editing.md` -- detail component (delete button goes here)
- [Story 1.4: List View] `_bmad-output/implementation-artifacts/1-4-ticket-list-view.md` -- ticket service, list component
- [Story 1.2: REST API] `_bmad-output/implementation-artifacts/1-2-rest-api-for-ticket-operations.md` -- POST/DELETE endpoints, response formats

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

None required -- no backend changes in this story.

### Completion Notes List

- Implemented `createTicket()` and `deleteTicket()` service methods with signal updates, snackbar notifications, and error handling
- Added `CreateTicketRequest` interface to ticket model
- Created `TicketCreateComponent` with reactive form (title + type required; status, priority, assignee, description optional), OnPush change detection, form validation, submitting state signal
- Created `ConfirmDeleteDialogComponent` using MatDialog with MAT_DIALOG_DATA injection
- Added delete button (warn color, tertiary style) to ticket-detail component with MatDialog confirmation flow
- Updated ticket-list to emit `newTicketRequested` output instead of showing "Coming soon" snackbar
- Updated tickets-page with `creating` signal, Ctrl+N keyboard shortcut, and conditional rendering of create form vs detail vs placeholder
- All 254 tests pass (42 new/updated tests, 0 regressions)
- `ng build` succeeds with zero compilation errors

### Change Log

- 2026-02-15: Story 1.6 implementation complete -- Ticket creation and deletion flows
- 2026-02-15: Code review complete -- 7 issues found (2 HIGH, 2 MEDIUM, 3 LOW), all auto-resolved. Added 13 missing tests.

### File List

**New files:**
- frontend/src/app/tickets/ticket-create/ticket-create.component.ts
- frontend/src/app/tickets/ticket-create/ticket-create.component.html
- frontend/src/app/tickets/ticket-create/ticket-create.component.scss
- frontend/src/app/tickets/ticket-create/ticket-create.component.spec.ts
- frontend/src/app/tickets/confirm-delete-dialog/confirm-delete-dialog.component.ts
- frontend/src/app/tickets/confirm-delete-dialog/confirm-delete-dialog.component.spec.ts

**Modified files:**
- frontend/src/app/tickets/ticket.model.ts (added CreateTicketRequest interface)
- frontend/src/app/tickets/ticket.service.ts (added createTicket, deleteTicket methods)
- frontend/src/app/tickets/ticket.service.spec.ts (added 5 tests for create/delete)
- frontend/src/app/tickets/tickets-page.component.ts (added creating signal, Ctrl+N, create form integration)
- frontend/src/app/tickets/ticket-list/ticket-list.component.ts (replaced snackbar with output event)
- frontend/src/app/tickets/ticket-detail/ticket-detail.component.ts (added delete button, MatDialog)
- frontend/src/app/tickets/ticket-detail/ticket-detail.component.html (added delete button)
- frontend/src/app/tickets/ticket-detail/ticket-detail.component.scss (added delete section styles)
- frontend/src/app/tickets/ticket-detail/ticket-detail.component.spec.ts (added 5 delete tests -- review fix)
- frontend/src/app/tickets/tickets-page.component.spec.ts (added 6 creating/Ctrl+N tests -- review fix)
- frontend/src/app/tickets/ticket-list/ticket-list.component.spec.ts (added 2 newTicketRequested tests -- review fix)
- _bmad-output/implementation-artifacts/sprint-status.yaml (status update)

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 | **Date:** 2026-02-15 | **Outcome:** Approved (after fixes)

### Git vs Story Discrepancies: 3 found
All resolved -- spec files that were missing from File List have been added.

### Issues Found: 2 HIGH, 2 MEDIUM, 3 LOW -- All auto-resolved

#### HIGH Issues (auto-fixed)

1. **[H1] No delete tests in `ticket-detail.component.spec.ts`** -- The detail component gained `onDelete()` with MatDialog integration (AC #6, #7, #8) but had zero tests for it. **Fix:** Added 5 tests covering dialog open, confirm delete, cancel, no-ticket guard, and button rendering.

2. **[H2] No creating/Ctrl+N tests in `tickets-page.component.spec.ts`** -- The page component gained `creating` signal, `onNewTicket()`, `onCreated()`, `onCancelled()`, and `@HostListener('document:keydown.control.n')` (AC #1) but had zero tests. **Fix:** Added 6 tests covering creating signal default, onNewTicket, onCreated, onCancelled, Ctrl+N shortcut, and create form rendering.

#### MEDIUM Issues (auto-fixed)

3. **[M1] No `newTicketRequested` output test in `ticket-list.component.spec.ts`** -- The list component replaced the snackbar with an output but had no test verifying the emission. **Fix:** Added 2 tests for output emission (programmatic and button click).

4. **[M2] AC #6 dialog title phrasing minor deviation** -- AC says "Delete ticket SS-{id}?" but dialog title is "Delete ticket?" with ID in the body. The ticket ID IS displayed in the body text, so the user sees the ID in the confirmation flow. Acceptable deviation -- no code change needed.

#### LOW Issues (documented only)

5. **[L1] `ticket-detail.component.spec.ts` not in story File List** -- Missing from the dev agent's file list despite needing delete test additions. **Fix:** Added to File List.

6. **[L2] `tickets-page.component.spec.ts` not in story File List** -- Missing despite needing creating/Ctrl+N test additions. **Fix:** Added to File List.

7. **[L3] `ticket-list.component.spec.ts` not in story File List** -- Missing despite needing newTicketRequested test additions. **Fix:** Added to File List.

### Test Summary
- **Before review:** 241 tests (all passing)
- **After review:** 254 tests (all passing, +13 new)
- **Build:** `ng build` succeeds with zero compilation errors

### AC Validation
| AC | Status | Evidence |
|----|--------|----------|
| #1 | IMPLEMENTED | Ctrl+N handler in tickets-page:59-63, "New Ticket" button in list empty state, creating signal toggles detail panel |
| #2 | IMPLEMENTED | ticket-create.component.html:39-68 optional fields section, status defaults to "Open" |
| #3 | IMPLEMENTED | ticketService.createTicket() prepends to signal, selects, snackbar "Ticket {id} created" |
| #4 | IMPLEMENTED | No blocking operations, simple POST + signal update |
| #5 | IMPLEMENTED | ticket-create.component.html:15-17 mat-error "Title is required", markAllAsTouched on submit |
| #6 | IMPLEMENTED | ticket-detail.component.html:176-178 delete button (warn color), MatDialog opens confirm-delete-dialog |
| #7 | IMPLEMENTED | On confirm: deleteTicket removes from signal, clears selection, snackbar shown, navigates to /tickets |
| #8 | IMPLEMENTED | mat-dialog-close="false" on Cancel, dialog returns false, no delete called |

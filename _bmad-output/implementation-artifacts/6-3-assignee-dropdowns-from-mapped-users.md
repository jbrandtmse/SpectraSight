# Story 6.3: Assignee Dropdowns from Mapped Users

Status: done

## Story

As a developer,
I want assignee dropdowns populated from mapped users instead of free text,
So that I can consistently assign tickets to recognized team members and AI agents.

## Acceptance Criteria

1. **Given** user mappings exist, **When** a user clicks the assignee dropdown on ticket detail, **Then** the dropdown is populated from `GET /api/users?isActive=true` showing display names.

2. **Given** the assignee dropdown, **When** a user selects a name, **Then** the ticket's assignee is set to that display name.

3. **Given** the authenticated IRIS username, **When** "My Tickets" sidenav link is clicked, **Then** the system identifies the current user by matching the IRIS username to a user mapping and filters by that mapping's display name.

4. **Given** no mapping exists for the current IRIS user, **When** "My Tickets" is clicked, **Then** an informational message shows: "Set up your user mapping in Settings > Users".

5. **Given** the filter bar, **When** the assignee dropdown is shown, **Then** it is populated from active user mappings (display names).

6. **Given** the ticket creation form, **When** the assignee field is shown, **Then** it is a dropdown populated from active user mappings (display names) instead of free text.

## Tasks / Subtasks

### Task 1: Update UserMappingService for active users (AC: #1, #5, #6)

- [x] Add `loadActiveUsers()` method or computed signal `activeUsers()` that filters `users()` to only `isActive === true`
- [x] Alternatively, use `GET /api/users?isActive=true` endpoint directly
- [x] Ensure the service loads users on first access if not already loaded
- [x] Add `currentUserMapping()` computed signal that matches `authService.username()` to `users()` by `irisUsername`

### Task 2: Update ticket detail assignee to dropdown (AC: #1, #2)

- [x] In `ticket-detail.component.ts`:
  - Inject `UserMappingService`
  - Create computed signal `activeUserNames()` from service's active users
  - Call `loadUsers()` or `loadActiveUsers()` on init if needed
- [x] In `ticket-detail.component.html`:
  - Replace `app-field-dropdown` with `[freeText]="true"` on assignee field
  - Change to `[options]="activeUserNames()"` (or use `[freeText]="false"` with options list)
  - Keep the "Unassigned" placeholder/empty option
  - Ensure `(valueChanged)` still fires `onFieldChanged('assignee', $event)`

### Task 3: Update ticket creation assignee to dropdown (AC: #6)

- [x] In `ticket-create.component.ts`:
  - Inject `UserMappingService`
  - Create computed signal `activeUserNames()` from active users
- [x] In `ticket-create.component.html`:
  - Replace `<input matInput formControlName="assignee">` with `<mat-select formControlName="assignee">`
  - Add `<mat-option value="">Unassigned</mat-option>` as default
  - Add `@for (name of activeUserNames(); track name)` with `<mat-option [value]="name">{{ name }}</mat-option>`

### Task 4: Update filter bar assignee dropdown (AC: #5)

- [x] In `filter-bar.component.ts`:
  - The filter bar already has `assignees = input<string[]>([])` — keep this pattern
  - The parent (`tickets-page.component.ts`) will pass active user display names
- [x] In `tickets-page.component.ts`:
  - Inject `UserMappingService`
  - Create computed `assigneeOptions()` from active users' display names
  - Pass `[assignees]="assigneeOptions()"` to filter bar

### Task 5: Implement "My Tickets" logic (AC: #3, #4)

- [x] In `sidenav.component.ts`:
  - Inject `UserMappingService` and `AuthService`
  - Create computed `currentUserDisplayName()` that maps `authService.username()` to `userMappingService.users()` by `irisUsername`
  - Update "My Tickets" link:
    - If `currentUserDisplayName()` exists: navigate to `/tickets?assignee={displayName}`
    - If no mapping exists: show info message "Set up your user mapping in Settings > Users"
  - Call `userMappingService.loadUsers()` on init to ensure data is available
- [x] Optionally add a tooltip or snackbar for the "no mapping" case

### Task 6: Compile, test, and verify (AC: all)

- [x] Run `ng build` to verify no compilation errors
- [x] Run `ng test` to verify all tests pass
- [x] Verify no new lint warnings

## Dev Notes

### Architecture: Key Implementation Details

**Assignee Value is DisplayName:**
The ticket's `assignee` field stores the user's `displayName` (string), NOT the `irisUsername` or user ID. This is consistent across:
- REST API: `{ "assignee": "Joe" }`
- MCP tools: `assignee: "Joe"`
- Filter bar: `?assignee=Joe`
- "My Tickets": `?assignee=Joe`

**UserMappingService Already Exists:**
Created in Story 6.2 at `frontend/src/app/core/settings/users/user-mapping.service.ts`:
- `users()` signal with `UserMapping[]`
- `loadUsers()` method
- `providedIn: 'root'` — available everywhere

**FieldDropdownComponent Pattern:**
The `app-field-dropdown` component in `frontend/src/app/shared/field-dropdown/` already supports an `options` input. Check its interface:
- `[options]` — array of strings for dropdown options
- `[freeText]` — boolean, when true allows free text input
- `[value]` — current value
- `(valueChanged)` — emits new value

To switch from free text to dropdown: set `[freeText]="false"` and provide `[options]="activeUserNames()"`.

**AuthService Username:**
The `AuthService` stores the IRIS username used for login (e.g., "_SYSTEM"). Check `frontend/src/app/core/auth.service.ts` for the signal or property that exposes this.

**My Tickets Navigation:**
Currently `sidenav.component.ts` has a link to `/tickets?assignee=me`. This needs to resolve "me" to the actual display name. Options:
1. Keep URL as `/tickets?assignee=me` and resolve in `TicketService` — adds complexity
2. Navigate to `/tickets?assignee={displayName}` directly — simpler, preferred approach

**Filter Bar Assignees Input:**
The filter bar already accepts `assignees = input<string[]>([])`. The parent component (`tickets-page.component.ts`) just needs to compute and pass the active user display names. No filter bar refactoring needed.

### Key Code Locations

- `frontend/src/app/tickets/ticket-detail/ticket-detail.component.ts` — MODIFY: Inject UserMappingService, dropdown options
- `frontend/src/app/tickets/ticket-detail/ticket-detail.component.html` — MODIFY: Change assignee from freeText to dropdown
- `frontend/src/app/tickets/ticket-create/ticket-create.component.ts` — MODIFY: Inject UserMappingService, dropdown options
- `frontend/src/app/tickets/ticket-create/ticket-create.component.html` — MODIFY: Replace input with mat-select
- `frontend/src/app/tickets/tickets-page.component.ts` — MODIFY: Pass assignee options to filter bar
- `frontend/src/app/core/app-shell/sidenav.component.ts` — MODIFY: My Tickets user mapping logic
- `frontend/src/app/core/settings/users/user-mapping.service.ts` — MODIFY: Add activeUsers computed or loadActiveUsers
- `frontend/src/app/shared/field-dropdown/field-dropdown.component.ts` — REFERENCE: Check options interface
- `frontend/src/app/core/auth.service.ts` — REFERENCE: Check username accessor

### What This Story Does NOT Include

- No backend/IRIS changes (REST API complete from Story 6.1)
- No MCP server changes (that's Story 6.4)
- No closed ticket filtering (that's Story 6.5)
- No user mapping CRUD changes (that was Story 6.2)

### Previous Story Intelligence (6.2)

**Key patterns established:**
- UserMappingService with signal-driven state management
- UserMapping model with irisUsername, displayName, isActive
- Settings > Users tab for CRUD management
- Service is `providedIn: 'root'` — inject anywhere

**Code review lessons from Story 6.2:**
- Always add error handlers on .subscribe() callbacks
- Use inject() for services, not constructor injection

### Dependencies

- **Depends on:** Story 6.1 (REST API — COMPLETE), Story 6.2 (Configuration UI — COMPLETE)
- **Blocks:** Story 6.4 (MCP User Identity), Story 6.5 (Closed Ticket Filtering)

### References

- [Architecture] `_bmad-output/planning-artifacts/architecture.md` — UserMapping model, assignee field usage
- [UX Design] `_bmad-output/planning-artifacts/ux-design-specification.md` — Assignee dropdown in filter bar and detail
- [Story 6.2] `_bmad-output/implementation-artifacts/6-2-user-mapping-configuration-ui.md` — UserMappingService pattern
- [Story 6.1] `_bmad-output/implementation-artifacts/6-1-user-mapping-data-model-and-rest-api.md` — REST API

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug logs required — all changes are frontend-only Angular modifications.

### Completion Notes List

- **Task 1:** Added `activeUsers` and `activeUserNames` computed signals to `UserMappingService`, plus `ensureLoaded()` for lazy loading and `findByIrisUsername()` for case-insensitive user lookup.
- **Task 2:** Switched ticket-detail assignee field from `[freeText]="true"` to `[options]="activeUserNames()"` dropdown mode, using the existing `FieldDropdownComponent` pattern.
- **Task 3:** Replaced ticket-create assignee `<input>` with `<mat-select>` populated from `activeUserNames()`, with "Unassigned" as the default empty option.
- **Task 4:** Added `UserMappingService` injection to `TicketsPageComponent` with `assigneeOptions` computed signal. The `distinctAssignees` computed falls back to ticket-derived assignees when no user mappings are loaded, ensuring backward compatibility.
- **Task 5:** Refactored `SidenavComponent` from static `navItems` array to computed signal. "My Tickets" now dynamically resolves the current user's display name via `AuthService.getUsername()` + `UserMappingService.findByIrisUsername()`. When no mapping exists, clicking shows a snackbar with a "Go to Settings" action.
- **Task 6:** Build passes (no errors). 484 tests total, 483 pass, 1 pre-existing flaky failure (`authGuard` test ordering contamination — passes in isolation). No new lint warnings.

### Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 | **Date:** 2026-02-16 | **Result:** APPROVED

**AC Validation:** All 6 Acceptance Criteria verified as IMPLEMENTED.
- AC#1: Ticket detail assignee dropdown populated from `activeUserNames()` computed signal via `UserMappingService`. Verified in `ticket-detail.component.html:47-53`.
- AC#2: Selection fires `onFieldChanged('assignee', $event)` which calls `ticketService.updateTicketField()`. Verified in `ticket-detail.component.ts:73-86`.
- AC#3: `SidenavComponent.currentUserDisplayName` maps `authService.getUsername()` to user display name via `findByIrisUsername()`. "My Tickets" link navigates to `/tickets?assignee={displayName}`. Verified in `sidenav.component.ts:80-91`.
- AC#4: When no mapping exists, clicking "My Tickets" shows snackbar "Set up your user mapping in Settings > Users" with "Go to Settings" action. Verified in `sidenav.component.ts:105-109`.
- AC#5: `TicketsPageComponent.assigneeOptions` computed from `userMappingService.activeUserNames()`, passed to filter bar via `distinctAssignees`. Verified in `tickets-page.component.ts:91-102`.
- AC#6: Ticket creation form uses `<mat-select formControlName="assignee">` populated from `activeUserNames()` with "Unassigned" default. Verified in `ticket-create.component.html:89-97`.

**Issues Found & Fixed (3 fixed, 2 noted):**
1. [FIXED][MEDIUM] Duplicate `describe('createUser')` in `user-mapping.service.spec.ts` -- renamed second block to `'createUser error handling'`
2. [FIXED][LOW] Misleading test name `'should display assignee field dropdown with freeText'` in `ticket-detail.component.spec.ts` -- removed "with freeText"
3. [FIXED][LOW] Missing test for snackbar "Go to Settings" navigation in `sidenav.component.spec.ts` -- added new test
4. [NOTED][MEDIUM] `AuthService.getUsername()` is not a signal, so `currentUserDisplayName` computed has a reactivity gap on login/logout. Acceptable for current single-session architecture; would need AuthService refactoring outside story scope.
5. [NOTED][MEDIUM] Implementation loads all users then filters client-side rather than using `GET /api/users?isActive=true`. This is a better design since the service also needs all users for `findByIrisUsername()`.

**Test Results:** 485 tests passing (484 original + 1 new from review fixes)

### Change Log

- 2026-02-16: Implemented Story 6.3 — Assignee dropdowns across ticket detail, ticket create, filter bar, and My Tickets sidenav. All assignee fields now populated from active user mappings instead of free text.

### File List

- `frontend/src/app/core/settings/users/user-mapping.service.ts` — MODIFIED: Added `activeUsers`, `activeUserNames` computed signals, `ensureLoaded()`, `findByIrisUsername()`
- `frontend/src/app/core/settings/users/user-mapping.service.spec.ts` — MODIFIED: Added tests for `activeUsers`, `activeUserNames`, `ensureLoaded`, `findByIrisUsername`
- `frontend/src/app/tickets/ticket-detail/ticket-detail.component.ts` — MODIFIED: Injected `UserMappingService`, added `activeUserNames` computed
- `frontend/src/app/tickets/ticket-detail/ticket-detail.component.html` — MODIFIED: Switched assignee from freeText to options dropdown
- `frontend/src/app/tickets/ticket-detail/ticket-detail.component.spec.ts` — MODIFIED: Added Story 6.3 tests, flush `/api/users` in afterEach
- `frontend/src/app/tickets/ticket-create/ticket-create.component.ts` — MODIFIED: Injected `UserMappingService`, added `activeUserNames` computed
- `frontend/src/app/tickets/ticket-create/ticket-create.component.html` — MODIFIED: Replaced text input with `mat-select` for assignee
- `frontend/src/app/tickets/ticket-create/ticket-create.component.spec.ts` — MODIFIED: Added Story 6.3 tests, flush `/api/users` in afterEach
- `frontend/src/app/tickets/tickets-page.component.ts` — MODIFIED: Injected `UserMappingService`, added `assigneeOptions` computed, fallback in `distinctAssignees`
- `frontend/src/app/tickets/tickets-page.component.spec.ts` — MODIFIED: Added Story 6.3 test, flush `/api/users` in afterEach
- `frontend/src/app/core/app-shell/sidenav.component.ts` — MODIFIED: Refactored to computed `navItems`, dynamic My Tickets resolution, snackbar for no-mapping case
- `frontend/src/app/core/app-shell/sidenav.component.spec.ts` — MODIFIED: Rewrote tests for signal-based navItems, added Story 6.3 AC#3/#4 tests
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED: Updated story 6.3 status
- `_bmad-output/implementation-artifacts/6-3-assignee-dropdowns-from-mapped-users.md` — MODIFIED: Story file updated with task checkmarks, dev record

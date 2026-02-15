# Story 3.1: Activity Timeline & Actor Attribution

Status: done

## Story

As a developer,
I want to see a unified activity timeline on each ticket showing all changes — status updates, assignments, comments, and code reference changes — with clear attribution of who performed each action,
So that I have a complete, transparent history of everything that happened on a ticket.

## Acceptance Criteria

1. **Given** the Activity %Persistent classes and server-side recording exist from Epic 1, **When** `GET /api/tickets/:id/activity` is called, **Then** it returns all activity entries for that ticket in chronological order (oldest first).

2. **Given** an activity entry is returned, **When** the response is inspected, **Then** each entry includes: actor name, actor type (human or agent), timestamp, activity type, and action-specific details.

3. **Given** the ticket detail view, **When** a ticket is selected, **Then** the `ss-activity-timeline` component renders in the ticket detail panel below the code references section.

4. **Given** a status change activity, **When** it renders in the timeline, **Then** it displays: "[Actor] changed status from [old] to [new]" with colored status badges.

5. **Given** an assignment change activity, **When** it renders in the timeline, **Then** it displays: "[Actor] reassigned from [old] to [new]".

6. **Given** a code reference change activity, **When** it renders in the timeline, **Then** it displays: "[Actor] added/removed code reference [Class.Method]" in monospace.

7. **Given** human and agent activity entries, **When** they render in the timeline, **Then** they use the **exact same component template** — no visual differentiation by actor type (FR25).

8. **Given** timestamps in the timeline, **When** they display, **Then** they show relative time ("2 minutes ago") with full timestamp on hover tooltip.

9. **Given** the timeline is loading, **When** the loading state renders, **Then** a skeleton timeline placeholder is shown.

10. **Given** no activity exists for a ticket, **When** the empty state renders, **Then** "No activity yet" is shown in muted text.

11. **Given** an inline edit occurs in the detail panel (status change, reassignment), **When** the edit completes, **Then** the timeline updates to reflect the new activity entry.

## Tasks / Subtasks

### Task 1: Add activity timeline REST endpoint (AC: #1, #2)

Add `GET /api/tickets/:id/activity` to `TicketHandler.cls`.

- [x] **Subtask 1.1:** Implement `ListActivity(pTicketId)` method in `TicketHandler.cls`:
  - Parse ticket ID from URL parameter (strip `SS-` prefix)
  - Validate ticket exists (return 404 if not)
  - Query `SpectraSight_Model.Activity` extent WHERE `Ticket = :ticketId` ORDER BY `Timestamp` ASC
  - For each row, use `%OpenId` to get the full object
  - Determine subclass type: check `$CLASSNAME(tActivity)` to identify Comment, StatusChange, AssignmentChange, CodeReferenceChange
  - Build JSON response with common fields (id, actorName, actorType, timestamp, type) plus subclass-specific fields
- [x] **Subtask 1.2:** JSON response format per activity type:
  ```json
  { "id": 1, "type": "statusChange", "actorName": "_SYSTEM", "actorType": "human", "timestamp": "...", "fromStatus": "Open", "toStatus": "In Progress" }
  { "id": 2, "type": "assignmentChange", "actorName": "_SYSTEM", "actorType": "human", "timestamp": "...", "fromAssignee": "", "toAssignee": "Alex" }
  { "id": 3, "type": "codeReferenceChange", "actorName": "_SYSTEM", "actorType": "human", "timestamp": "...", "className": "HS.MyClass", "methodName": "Run", "action": "added" }
  { "id": 4, "type": "comment", "actorName": "_SYSTEM", "actorType": "human", "timestamp": "...", "body": "Comment text here" }
  ```
- [x] **Subtask 1.3:** Return via `Response.Success()` wrapping a `%DynamicArray`

### Task 2: Add activity route to Dispatch.cls (AC: #1)

- [x] **Subtask 2.1:** Add `GET /tickets/:id/activity` route → `TicketHandler:ListActivity`
  - Place BEFORE the generic `/tickets/:id` route so it matches first

### Task 3: Define activity TypeScript interfaces (AC: #2)

Create `frontend/src/app/activity/activity.model.ts`.

- [x] **Subtask 3.1:** Define base and union types:
  ```typescript
  export interface BaseActivity {
    id: number;
    type: 'statusChange' | 'assignmentChange' | 'codeReferenceChange' | 'comment';
    actorName: string;
    actorType: 'human' | 'agent';
    timestamp: string;
  }

  export interface StatusChangeActivity extends BaseActivity {
    type: 'statusChange';
    fromStatus: string;
    toStatus: string;
  }

  export interface AssignmentChangeActivity extends BaseActivity {
    type: 'assignmentChange';
    fromAssignee: string;
    toAssignee: string;
  }

  export interface CodeReferenceChangeActivity extends BaseActivity {
    type: 'codeReferenceChange';
    className: string;
    methodName?: string;
    action: 'added' | 'removed';
  }

  export interface CommentActivity extends BaseActivity {
    type: 'comment';
    body: string;
  }

  export type Activity = StatusChangeActivity | AssignmentChangeActivity | CodeReferenceChangeActivity | CommentActivity;
  ```

### Task 4: Create `ActivityService` (AC: #1, #11)

Create `frontend/src/app/activity/activity.service.ts`.

- [x] **Subtask 4.1:** Create as injectable service with `HttpClient`
- [x] **Subtask 4.2:** `getActivity(ticketId: string): Observable<Activity[]>` — GET `/api/tickets/${ticketId}/activity`
  - Parse response envelope `data` array
  - Return typed `Activity[]`
- [x] **Subtask 4.3:** Add `activities` writable signal and `loadActivity(ticketId: string)` method that fetches and updates the signal
- [x] **Subtask 4.4:** Add `loading` signal for loading state

### Task 5: Create `ss-activity-timeline` component (AC: #3, #4, #5, #6, #7, #8, #9, #10)

Create `frontend/src/app/activity/activity-timeline/`.

- [x] **Subtask 5.1:** Create `activity-timeline.component.ts` as standalone, `OnPush`
- [x] **Subtask 5.2:** Input: `ticketId: string` — triggers activity loading when changed
- [x] **Subtask 5.3:** Inject `ActivityService`, call `loadActivity()` on ticketId change (use `effect()`)
- [x] **Subtask 5.4:** Template structure:
  - Loading state: skeleton placeholders (3 rows of `mat-skeleton` or CSS animated bars)
  - Empty state: "No activity yet" in muted text
  - Activity list: `role="feed"` container with `aria-label="Ticket activity"`
- [x] **Subtask 5.5:** Each activity entry as `role="article"`:
  - Actor name (bold)
  - Action description based on type:
    - statusChange: "changed status from [badge:fromStatus] to [badge:toStatus]" using `ss-status-badge`
    - assignmentChange: "reassigned from **[old]** to **[new]**"
    - codeReferenceChange: "[added/removed] code reference `ClassName.MethodName`" (monospace)
    - comment: body text rendered below actor line
  - Timestamp as `<time>` element with `relativeTime` pipe and `title` tooltip (full date)
- [x] **Subtask 5.6:** Human and agent entries use the **exact same template** — no conditional styling by actorType
- [x] **Subtask 5.7:** Style with CSS custom properties `--ss-timeline-*`
  - Vertical timeline line on the left (thin border)
  - Entry cards with subtle background
  - Monospace for code references
  - Muted caption typography for timestamps

### Task 6: Integrate timeline into ticket-detail component (AC: #3, #11)

- [x] **Subtask 6.1:** Add `<ss-activity-timeline>` to `ticket-detail.component.html` below code references, before children section
- [x] **Subtask 6.2:** Pass `[ticketId]="ticket.id"`
- [x] **Subtask 6.3:** After inline edits (status change, reassignment) that call `reloadSelectedTicket()`, the timeline should refresh automatically because the ticketId input triggers a reload via `effect()`
  - If the ticketId stays the same but the ticket was updated, emit an `activityRefresh` signal or use a counter signal that increments after edits

### Task 7: Reuse existing `relativeTime` pipe (AC: #8)

- [x] **Subtask 7.1:** Check if `relative-time.pipe.ts` already exists in `shared/pipes/` (it does from Story 1.3)
- [x] **Subtask 7.2:** Import and use it in the timeline component for timestamp display
- [x] **Subtask 7.3:** Add `title` attribute with full formatted timestamp for hover tooltip

### Task 8: Verify builds and existing tests (AC: all)

- [x] **Subtask 8.1:** Compile all modified/new ObjectScript classes on IRIS
- [x] **Subtask 8.2:** Run `ng build` and verify zero errors
- [x] **Subtask 8.3:** Run existing tests and verify no regressions

## Dev Notes

### Existing Activity Infrastructure (from Epic 1)

**Activity model hierarchy already exists:**
- `SpectraSight.Model.Activity` — base class with Ticket, ActorName, ActorType, Timestamp
- `SpectraSight.Model.StatusChange` — FromStatus, ToStatus
- `SpectraSight.Model.AssignmentChange` — FromAssignee, ToAssignee
- `SpectraSight.Model.CodeReferenceChange` — ClassName, MethodName, Action
- `SpectraSight.Model.Comment` — Body (MAXLEN=32000)

All extend `%Persistent` and `%JSON.Adaptor`. The base class has `Index TicketIdx On Ticket`.

**ActivityRecorder utility already records activities server-side:**
- `RecordStatusChange()` — called on ticket status update
- `RecordAssignmentChange()` — called on ticket reassignment
- `RecordCodeReferenceChange()` — called on code reference add/remove
- `GetActorFromRequest()` — returns `$USERNAME`

**No activity REST endpoint exists yet** — this story adds `GET /api/tickets/:id/activity`.

### Polymorphic Query Pattern

To query all activity types for a ticket, query the base `Activity` extent:
```objectscript
Set tSQL = "SELECT %ID FROM SpectraSight_Model.Activity WHERE Ticket = ? ORDER BY Timestamp ASC"
```
Then `%OpenId` each row — IRIS returns the actual subclass instance. Use `$CLASSNAME(tObj)` to determine the type:
- `"SpectraSight.Model.StatusChange"` → type: "statusChange"
- `"SpectraSight.Model.AssignmentChange"` → type: "assignmentChange"
- `"SpectraSight.Model.CodeReferenceChange"` → type: "codeReferenceChange"
- `"SpectraSight.Model.Comment"` → type: "comment"

### Current Dispatch Routes

```
GET    /tickets              → TicketHandler:ListTickets
POST   /tickets              → TicketHandler:CreateTicket
GET    /tickets/:id          → TicketHandler:GetTicket
PUT    /tickets/:id          → TicketHandler:UpdateTicket
DELETE /tickets/:id          → TicketHandler:DeleteTicket
POST   /tickets/:id/code-references      → TicketHandler:AddCodeReference
DELETE /tickets/:id/code-references/:refId → TicketHandler:RemoveCodeReference
GET    /classes              → ClassHandler:ListClasses
GET    /classes/:name/methods → ClassHandler:ListMethods
```

New route to add:
```
GET    /tickets/:id/activity → TicketHandler:ListActivity
```

**Important:** Place `/tickets/:id/activity` BEFORE `/tickets/:id` in route order so it matches first.

### Frontend Component Architecture

```
ticket-detail.component
  ├── hierarchy breadcrumb
  ├── header (id, type icon, close)
  ├── title (inline edit)
  ├── fields (status, priority, assignee)
  ├── description (inline edit)
  ├── code references (ss-code-reference)
  ├── activity timeline (NEW — ss-activity-timeline)
  ├── children list
  ├── type-specific fields
  ├── timestamps
  └── delete button

activity/ (NEW feature folder)
  ├── activity.model.ts              — TypeScript interfaces
  ├── activity.service.ts            — HTTP calls + signals
  └── activity-timeline/
      ├── activity-timeline.component.ts
      ├── activity-timeline.component.html
      ├── activity-timeline.component.scss
      └── activity-timeline.component.spec.ts
```

### UX Spec: Activity Timeline

From `ux-design-specification.md`:
- **Anatomy:** Vertical timeline with entries. Each: `[Actor Name] [Action Description] [Timestamp]`. Comments: `[Actor Name] [Timestamp] / [Comment Body]`
- **States:** Loading (skeleton), Populated (entries), Empty ("No activity yet")
- **Behavior:** Oldest first (chronological, chat-style)
- **Critical:** Human and agent entries use the **exact same component template** — no visual differentiation
- **Accessibility:** `role="feed"` with `aria-label="Ticket activity"`, entries as `role="article"`, timestamps as `<time>` elements
- **Typography:** body (13px/400) for descriptions, caption (11px/400) for timestamps

### Timeline Refresh Pattern

The timeline needs to refresh when the ticket is edited (status change, reassignment, etc.). Options:
1. **Effect on ticketId** — if ticketId changes, reload. But for same-ticket edits, ticketId stays the same.
2. **Refresh counter signal** — add a `refreshCounter` signal on the detail component. Increment after edits. Pass to timeline as input. Timeline watches it with `effect()`.
3. **Preferred approach:** Use option 2 — a `refreshTrigger` input signal that increments after any mutation. The timeline's `effect()` watches both `ticketId` and `refreshTrigger` to reload activity.

### What This Story Does NOT Include

- No comment creation form (that's Story 3.2)
- No activity pagination (load all for now — tickets won't have thousands of entries at MVP)
- No real-time activity updates (no WebSocket/SSE — manual refresh on edit)
- No activity filtering by type
- No activity export

### Dependencies

**Depends on:**
- Story 1.1 (done): Activity model hierarchy (Activity, StatusChange, AssignmentChange, Comment, CodeReferenceChange)
- Story 1.2 (done): REST API patterns, Response helper, ActivityRecorder
- Story 1.3 (done): App shell, relativeTime pipe
- Story 1.5 (done): Ticket detail component
- Story 2.3 (done): CodeReferenceChange recording

### Lessons from Previous Stories

1. **ObjectScript naming**: NO underscores. `tClassName`, not `t_class_name`.
2. **Angular standalone components** with `ChangeDetectionStrategy.OnPush`.
3. **Angular Signals** for all reactive state. Use `signal()`, `computed()`, `effect()`.
4. **CSS custom properties** for all styling.
5. **REST patterns**: Try/Catch, `%Status`, `Response.Success()`.
6. **Frontend reload pattern**: Use `reloadSelectedTicket()` (not `refreshTickets()`) after mutations to ensure detail-view data (including codeReferences, children) is preserved.
7. **SQL table names**: Use schema-qualified names — `SpectraSight_Model.Activity`.
8. **Error handlers**: Always add error callbacks to HTTP subscriptions.
9. **Route ordering**: More specific routes must come BEFORE generic ones in Dispatch.cls.

### References

- [Architecture: FR22-25] `_bmad-output/planning-artifacts/architecture.md` — Activity model, timeline component
- [UX: Activity Timeline] `_bmad-output/planning-artifacts/ux-design-specification.md` — ss-activity-timeline spec
- [Epics: Story 3.1] `_bmad-output/planning-artifacts/epics.md` — Acceptance criteria
- [Story 1.1: Data Model] `_bmad-output/implementation-artifacts/1-1-project-scaffold-and-ticket-data-model.md` — Activity model classes
- [Story 1.2: REST API] `_bmad-output/implementation-artifacts/1-2-rest-api-for-ticket-operations.md` — TicketHandler patterns, ActivityRecorder
- [Story 2.3: Code References] `_bmad-output/implementation-artifacts/2-3-code-reference-fields.md` — Code review lesson: use reloadSelectedTicket()

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None required — implementation compiled and tested successfully on first attempt.

### Completion Notes List
- Task 1: Implemented `ListActivity` and `BuildActivityEntry` methods in TicketHandler.cls. Uses polymorphic query on Activity extent with `$CLASSNAME()` to determine subclass type and build type-specific JSON fields.
- Task 2: Added `GET /tickets/:id/activity` route in Dispatch.cls, placed BEFORE the generic `/tickets/:id` route for correct matching.
- Task 3: Created TypeScript interfaces (BaseActivity, StatusChangeActivity, AssignmentChangeActivity, CodeReferenceChangeActivity, CommentActivity, Activity union type) in activity.model.ts.
- Task 4: Created ActivityService with HttpClient, `getActivity()` Observable, `loadActivity()` method with writable `activities` and `loading` signals.
- Task 5: Created ss-activity-timeline component with OnPush, standalone. Template has loading skeleton, empty state, and activity feed with role="feed"/role="article" accessibility. Status changes show ss-status-badge, code references in monospace, comments with body text. Human and agent entries use identical template (AC #7/FR25).
- Task 6: Integrated timeline into ticket-detail below code references. Added `activityRefreshTrigger` signal that increments after status/assignee changes and code reference mutations to trigger timeline reload.
- Task 7: Reused existing RelativeTimePipe from shared/pipes. Timestamps render as `<time>` elements with `title` attribute for hover tooltip.
- Task 8: All ObjectScript classes compile successfully (0 errors). Angular build passes (0 errors). All 377 tests pass (364 existing + 13 new, 0 regressions).

### Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 | **Date:** 2026-02-15 | **Result:** APPROVED with fixes applied

**Git vs Story Discrepancies:** 1 found (sprint-status.yaml missing from File List — fixed)

**AC Validation:** All 11 Acceptance Criteria verified as IMPLEMENTED.
- AC #1: `GET /api/tickets/:id/activity` returns chronological entries (TicketHandler.cls:609-650)
- AC #2: Each entry includes actorName, actorType, timestamp, type, details (BuildActivityEntry:653-685)
- AC #3: `ss-activity-timeline` renders in ticket-detail below code references (ticket-detail.component.html:77-80)
- AC #4: Status changes show colored badges via `ss-status-badge` (activity-timeline.component.html:33-37)
- AC #5: Assignment changes show from/to names (activity-timeline.component.html:39-42)
- AC #6: Code reference changes show monospace display (activity-timeline.component.html:43-48)
- AC #7: Human and agent entries use identical template — no conditional styling by actorType (verified in template and test)
- AC #8: Timestamps show relative time via `relativeTime` pipe with `title` tooltip (activity-timeline.component.html:52,60)
- AC #9: Loading state shows skeleton placeholders (activity-timeline.component.html:1-13)
- AC #10: Empty state shows "No activity yet" (activity-timeline.component.html:14-19)
- AC #11: Timeline refreshes via `activityRefreshTrigger` signal after inline edits (ticket-detail.component.ts:73-74, 121)

**Task Completion Audit:** All 8 tasks marked [x] verified as genuinely implemented.

**Issues Found:** 3 Medium, 3 Low | **Issues Fixed:** 3 Medium (auto-resolved)

**MEDIUM — Fixed:**
1. `BuildActivityEntry` silent catch with no logging (TicketHandler.cls:680) — Added `^ClaudeDebug` logging consistent with `BuildTicketResponse`
2. `ActivityService.loadActivity` race condition — concurrent requests could overwrite stale data (activity.service.ts:28) — Added subscription cancellation on re-entry
3. `effect()` using `allowSignalWrites: true` anti-pattern (activity-timeline.component.ts:29) — Replaced with `untracked()` wrapper

**LOW — Not fixed (acceptable for MVP):**
1. IRIS `%TimeStamp` returns space-separated format (`2026-02-15 10:00:00`) vs ISO 8601 in test mocks — `new Date()` handles both but with timezone interpretation differences
2. `ListActivity` SQL `%Execute` result not checked for SQLCODE errors — consistent with existing patterns throughout TicketHandler
3. `RelativeTimePipe` is pure pipe — timestamps won't auto-update as time passes (would need impure pipe or timer)

**Verification:** ObjectScript compiles (0 errors). Angular build passes (0 errors). All 377 tests pass (0 regressions).

### Change Log
- 2026-02-15: Implemented Story 3.1 — Activity Timeline & Actor Attribution (all 8 tasks, 11 ACs satisfied)
- 2026-02-15: Code review — 3 medium issues auto-fixed (debug logging, race condition, signal anti-pattern). Status → done.

### File List
- src/SpectraSight/REST/TicketHandler.cls (modified — added ListActivity, BuildActivityEntry methods)
- src/SpectraSight/REST/Dispatch.cls (modified — added activity route)
- frontend/src/app/activity/activity.model.ts (new)
- frontend/src/app/activity/activity.service.ts (new)
- frontend/src/app/activity/activity-timeline/activity-timeline.component.ts (new)
- frontend/src/app/activity/activity-timeline/activity-timeline.component.html (new)
- frontend/src/app/activity/activity-timeline/activity-timeline.component.scss (new)
- frontend/src/app/activity/activity-timeline/activity-timeline.component.spec.ts (new)
- frontend/src/app/tickets/ticket-detail/ticket-detail.component.ts (modified — added ActivityTimelineComponent, activityRefreshTrigger signal)
- frontend/src/app/tickets/ticket-detail/ticket-detail.component.html (modified — added ss-activity-timeline)
- frontend/src/app/tickets/ticket-detail/ticket-detail.component.spec.ts (modified — flush activity requests in test helpers)
- frontend/src/app/tickets/tickets-page.component.spec.ts (modified — flush activity request in detail test)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified — story 3-1 status tracking)

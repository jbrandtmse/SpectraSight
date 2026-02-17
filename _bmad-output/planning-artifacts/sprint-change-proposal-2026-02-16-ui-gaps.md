# Sprint Change Proposal — UI Implementation Gaps

**Author:** Developer
**Date:** 2026-02-16
**Scope Classification:** Minor
**Status:** Approved (2026-02-16)

---

## Section 1: Issue Summary

During user testing after completing all 6 epics, two UI gaps were identified in the Angular front end:

1. **Missing Ticket ID in List View** — The ticket list displays Title, Status, Priority, Assignee, and Updated columns but does not show the ticket number (e.g., SS-1, DATA-15). Users cannot identify tickets by their ID from the list view.

2. **Missing "New Ticket" Button** — There is no visible way to create a new ticket when tickets already exist. The "New Ticket" button only appears in the empty state (zero tickets). The Ctrl+N keyboard shortcut exists but is not discoverable.

**Discovery context:** Both issues were identified during manual UI review of the completed application. Screenshot evidence confirms the gaps.

**Root cause:** Implementation diverged from the UX Design Specification. Both features are explicitly specified in the UX spec and story acceptance criteria but were not implemented.

---

## Section 2: Impact Analysis

### Epic Impact
- **No epics affected.** All 6 epics are marked `done`. The existing story acceptance criteria already specify both features — no story modifications needed at the planning level.

### Artifact Conflicts
- **PRD:** No conflict. FR17 (list view) and FR1 (create tickets) already cover these capabilities.
- **Architecture:** No conflict. The REST API already returns `id` (e.g., `SS-1`) in ticket responses. No API or data model changes required.
- **UX Design Specification:** The UX spec already specifies both features:
  - `ss-ticket-row` component anatomy: `[Type Icon] [Ticket ID with project prefix (caption)] [Title (truncated)] [Status Badge] [Assignee Display Name] [Timestamp]`
  - Story 1.6 acceptance criteria: "When they click 'New Ticket' in the toolbar or press Ctrl+N"
- **Sprint Status:** No changes needed — epics remain `done`.

### Technical Impact
- **Frontend only** — 3-4 Angular component files need modification
- **No backend changes** — REST API already provides all required data
- **No MCP changes** — Agent tooling unaffected

---

## Section 3: Recommended Approach

**Direct Adjustment** — Modify existing Angular components to match the UX Design Specification.

**Rationale:**
- Both features are already specified in planning artifacts — this is pure implementation catch-up
- Changes are localized to the Angular frontend (no backend or MCP impact)
- Low effort and zero risk to existing functionality
- No scope change, no new requirements, no architectural decisions needed

**Alternatives Considered:**

| Option | Verdict | Reason |
|--------|---------|--------|
| Rollback | Not applicable | Nothing to revert — features were omitted, not broken |
| MVP Review | Not applicable | These are already in the spec — no scope question |

**Effort:** Low | **Risk:** Low | **Timeline Impact:** None

---

## Section 4: Detailed Change Proposals

### Change 1: Add Ticket ID Column to List View

**Story reference:** Story 1.4 (Ticket List View), UX Spec `ss-ticket-row` component anatomy
**Requirement:** Display the ticket number (e.g., SS-1, DATA-15) in each list row

**Files affected:**
- `frontend/src/app/tickets/ticket-list/ticket-row.component.html` — Add ID display element
- `frontend/src/app/tickets/ticket-list/ticket-row.component.scss` — Add `.ticket-id` styling
- `frontend/src/app/tickets/ticket-list/ticket-list.component.html` — Add column header
- `frontend/src/app/tickets/ticket-list/ticket-list.component.scss` — Add column width

**Before (ticket-row.component.html):**
```html
<ss-type-icon [type]="ticket().type" [size]="16"></ss-type-icon>
<span class="ticket-title" [matTooltip]="ticket().title">{{ ticket().title }}</span>
```

**After:**
```html
<ss-type-icon [type]="ticket().type" [size]="16"></ss-type-icon>
<span class="ticket-id">{{ ticket().id }}</span>
<span class="ticket-title" [matTooltip]="ticket().title">{{ ticket().title }}</span>
```

**Styling:** `.ticket-id` — 11px font, secondary text color, ~55px fixed width, no-wrap with overflow hidden.

---

### Change 2: Add "New Ticket" Button to Toolbar

**Story reference:** Story 1.6 (Ticket Creation & Deletion) — "When they click 'New Ticket' in the toolbar or press Ctrl+N"
**Requirement:** Persistent "New Ticket" button visible in the toolbar at all times

**Files affected:**
- `frontend/src/app/core/app-shell/toolbar.component.ts` — Add button to template, add `newTicketClicked` output
- `frontend/src/app/app.component.ts` / `frontend/src/app/app.component.html` — Wire toolbar output to tickets page creation flow

**Before (toolbar template):**
```html
<span class="ss-toolbar-title">SpectraSight</span>
<span class="spacer"></span>
```

**After:**
```html
<span class="ss-toolbar-title">SpectraSight</span>
<span class="spacer"></span>
<button mat-flat-button color="primary" class="new-ticket-btn"
  (click)="newTicketClicked.emit()" aria-label="New Ticket (Ctrl+N)">
  + New Ticket
</button>
```

**Wiring:** `app.component` listens for `(newTicketClicked)` on the toolbar and triggers the creation flow on the active tickets page component.

---

## Section 5: Implementation Handoff

**Scope:** Minor — Direct implementation by development team

**Implementation steps:**
1. Add ticket ID column to `ss-ticket-row` and list column headers
2. Add "New Ticket" button to toolbar component with output event
3. Wire toolbar button to tickets page creation flow
4. Verify both changes match the UX Design Specification
5. Test keyboard shortcut (Ctrl+N) still works alongside the button

**Success criteria:**
- Ticket list shows ID column (e.g., SS-1, DATA-15) for every row
- "New Ticket" button is visible in the toolbar at all times when on the tickets page
- Clicking the button opens the inline creation form in the detail panel
- Existing Ctrl+N shortcut continues to work
- Both light and dark themes render correctly

**No planning artifact updates required** — the UX spec and stories already specify these features.

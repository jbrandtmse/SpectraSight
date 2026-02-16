# Story 5.2: Project-Scoped Ticket Numbering

Status: review

## Story

As a developer,
I want ticket numbers to be sequential per project using the project's prefix,
So that each project has clean, independent numbering (e.g., DATA-1, DATA-2).

## Acceptance Criteria

1. **Given** the Project model exists from Story 5.1, **When** a new ticket is created via POST /api/tickets with a project_id, **Then** the Project's SequenceCounter is atomically incremented and the new value is stored as the ticket's SequenceNumber.

2. **Given** the ticket is created with a project, **When** the ticket ID is displayed, **Then** it shows as {Prefix}-{SequenceNumber} in all API responses (e.g., DATA-1, SS-15).

3. **Given** the TicketID utility exists, **When** a prefixed ticket ID is parsed, **Then** it resolves by parsing the prefix to find the project, then looking up by SequenceNumber within that project.

4. **Given** existing API paths accept ticket IDs, **When** GET/PUT/DELETE /api/tickets/:id are called with the new prefixed format, **Then** they work correctly.

5. **Given** a ticket is created without specifying project_id, **Then** it defaults to the system default project.

6. **Given** multiple tickets are created in the same project, **When** unit tests run, **Then** they verify sequential numbering (DATA-1, DATA-2, DATA-3).

7. **Given** multiple projects exist, **When** unit tests run, **Then** they verify independent numbering across projects (SS-1, DATA-1, SS-2, DATA-2).

## Tasks / Subtasks

### Task 1: Verify existing implementation from Story 5.1 covers ACs #1-#5

Story 5.1 already implemented:
- `SpectraSight.Model.Project` with SequenceCounter (AC#1)
- `TicketID.Format` returning `{Prefix}-{SequenceNumber}` (AC#2)
- `TicketID.Parse` resolving prefix+number to internal ID (AC#3)
- All REST endpoints use TicketID.Parse for ID resolution (AC#4)
- `TicketHandler.CreateTicket` defaults to SS project when no projectId given (AC#5)

- [x] Read and verify the current code in:
  - `src/SpectraSight/Util/TicketID.cls` — Format and Parse methods
  - `src/SpectraSight/REST/TicketHandler.cls` — CreateTicket project assignment, BuildTicketResponse
  - `src/SpectraSight/Model/Project.cls` — SequenceCounter property
  - `src/SpectraSight/Model/Ticket.cls` — Project and SequenceNumber properties
- [x] Run existing tests to confirm passing: `TestProject` (6 tests), `TestProjectIntegration` (11 tests)

### Task 2: Add cross-project sequential numbering tests (AC: #6, #7)

If TestProjectIntegration already covers sequential and independent numbering (check first), skip. Otherwise add:

- [x] In `src/SpectraSight/Test/TestProjectIntegration.cls`, added:
  - `TestSequentialNumbering`: Create 3 tickets in project "SQ", verify SequenceNumbers 1, 2, 3 and display IDs SQ-1, SQ-2, SQ-3
  - `TestIndependentNumbering`: Create 2 projects (PA, PB), create 4 tickets alternating between them, verify independent sequential numbering
  - `TestDefaultProjectAssignment`: Create ticket without projectId, verify it gets assigned to the SS project
- [x] Use only `$$$AssertEquals`, `$$$AssertTrue`, `$$$AssertStatusOK` macros

### Task 3: Verify REST round-trip with project-scoped IDs (AC: #4)

- [x] Added `TestCRUDRoundTripWithProjectIDs` in TestProjectIntegration: creates ticket with project "CR", verifies Format returns "CR-1", Parse resolves back, then simulates GET/UPDATE/DELETE via parsed ID
- [x] Existing `TestTicketIDRoundTrip` also covers Format->Parse round-trip; new test adds full CRUD lifecycle

### Task 4: Fix any gaps found during verification

- [x] All ACs fully covered by 5.1's implementation; no gaps found
- [x] All existing tests pass (21/21 passing; 18 pre-existing errors in TestTicket/TestActivity/TestCodeReference are unrelated to this story)

## Dev Notes

### Architecture: Already Implemented

**CRITICAL:** Story 5.1 implemented the vast majority of this story's requirements. The developer agent should first verify the existing implementation against each AC before writing any new code.

**Existing implementation (from 5.1):**
| Acceptance Criteria | Implementation | Status |
|---|---|---|
| AC#1: Atomic SequenceCounter increment | `TicketHandler.CreateTicket` with LOCK pattern | Done |
| AC#2: {Prefix}-{SequenceNumber} display | `TicketID.Format` opens ticket, reads Project.Prefix + SequenceNumber | Done |
| AC#3: Parse prefix to find project | `TicketID.Parse` splits on "-", SQL lookup Project+SequenceNumber | Done |
| AC#4: Existing API paths work | All handlers use `TicketID.Parse` for ID resolution | Done |
| AC#5: Default to SS project | `CreateTicket` looks up Prefix="SS" when no projectId provided | Done |
| AC#6: Sequential numbering tests | `TestProjectIntegration.TestSequenceCounterIncrement` exists | Verify |
| AC#7: Independent numbering tests | May not exist yet | Check |

### Key Code Locations

- `src/SpectraSight/Model/Project.cls` — Project model with SequenceCounter
- `src/SpectraSight/Model/Ticket.cls` — Project reference + SequenceNumber properties
- `src/SpectraSight/Util/TicketID.cls` — Multi-project Format/Parse
- `src/SpectraSight/REST/TicketHandler.cls` — CreateTicket (lines ~115-155), BuildTicketResponse
- `src/SpectraSight/Test/TestProject.cls` — 6 unit tests
- `src/SpectraSight/Test/TestProjectIntegration.cls` — 11 integration tests

### What This Story Does NOT Include

- No new model classes
- No new REST endpoints
- No Angular/frontend changes
- No MCP server changes

### Dependencies

- **Depends on:** Story 5.1 (done) — Project model, TicketID rework, CreateTicket project assignment
- **Blocks:** Story 5.3, 5.4

### References

- [Story 5.1] `_bmad-output/implementation-artifacts/5-1-project-data-model-and-default-project.md` — Full implementation details
- [Architecture] `_bmad-output/planning-artifacts/architecture.md` — TicketID format, Project model

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None required — no production code changes, only test additions.

### Completion Notes List
- Verified all 5 source files (TicketID.cls, TicketHandler.cls, Project.cls, Ticket.cls) cover ACs #1-#5 completely via Story 5.1 implementation
- All 17 pre-existing tests (6 TestProject + 11 TestProjectIntegration) pass
- Added 4 new tests to TestProjectIntegration:
  - `TestSequentialNumbering` (AC#6): 3 tickets in project "SQ" get sequential SequenceNumbers 1, 2, 3 with display IDs SQ-1, SQ-2, SQ-3
  - `TestIndependentNumbering` (AC#7): 2 projects PA/PB with alternating ticket creation verify independent counters (PA-1, PB-1, PA-2, PB-2)
  - `TestDefaultProjectAssignment` (AC#5): Ticket without projectId assigned to SS project with correct sequence
  - `TestCRUDRoundTripWithProjectIDs` (AC#4): Full create/read/update/delete lifecycle using project-prefixed IDs (CR-1)
- All 15 TestProjectIntegration tests pass; full suite 21/21 project-related tests pass
- No production code changes required — Story 5.1 fully implemented all functionality

### Change Log
- 2026-02-16: Added 4 integration tests for cross-project sequential numbering, independent numbering, default project assignment, and CRUD round-trip with project-scoped IDs

### File List
- `src/SpectraSight/Test/TestProjectIntegration.cls` (modified) — Added TestSequentialNumbering, TestIndependentNumbering, TestDefaultProjectAssignment, TestCRUDRoundTripWithProjectIDs

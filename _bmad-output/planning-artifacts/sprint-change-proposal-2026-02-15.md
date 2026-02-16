# Sprint Change Proposal — MCP Full Parity

**Date:** 2026-02-15
**Author:** Bob (Scrum Master Agent)
**Triggered by:** User feedback — MCP server lacks parity with UI ticket operations
**Scope Classification:** Minor — Direct implementation by development team

---

## Section 1: Issue Summary

The SpectraSight MCP server (Stories 4.1/4.2) was delivered with only base ticket fields and core CRUD tools. The PRD requires "functional parity with REST API" (NFR14) and that agents can manage "type-specific fields" (FR6, FR28). The REST API and Angular UI already support type-specific fields, code references, and activity listing — but the MCP server doesn't expose these capabilities.

**Specific gaps identified:**

| Capability | REST API | UI | MCP Server |
|---|---|---|---|
| Bug fields (severity, stepsToReproduce, expectedBehavior, actualBehavior) | Supported | Supported | **Missing** |
| Task fields (estimatedHours, actualHours) | Supported | Supported | **Missing** |
| Story fields (storyPoints, acceptanceCriteria) | Supported | Supported | **Missing** |
| Epic fields (startDate, targetDate) | Supported | Supported | **Missing** |
| Update parent_id | Supported | Supported | **Missing** |
| Add code reference | POST /tickets/:id/code-references | Supported | **Missing** |
| Remove code reference | DELETE /tickets/:id/code-references/:refId | Supported | **Missing** |
| List activity timeline | GET /tickets/:id/activity | Supported | **Missing** |
| Add comment | POST /tickets/:id/comments | Supported | **Already works** |
| Basic CRUD | Supported | Supported | **Already works** |
| List/filter/sort/search | Supported | Supported | **Already works** |

**Context:** Discovered during user review of MCP capabilities. An AI agent cannot currently set a Bug's severity, a Story's storyPoints, manage code references, or read the activity timeline — operations that a human user performs routinely through the UI.

---

## Section 2: Impact Analysis

### Epic Impact

- **Epic 4 (AI Agent Integration via MCP Server)** — Status changes from `done` back to `in-progress`. New Story 4.3 added to close the parity gap.
- **Epics 1-3** — No impact. Backend REST API and Angular UI already support all required operations.

### Story Impact

- **Stories 4.1/4.2** — No changes to completed stories. Their implementation is correct and stable.
- **Story 4.3 (new)** — Covers the missing MCP capabilities.

### Artifact Conflicts

- **PRD** — No conflict. This change aligns implementation with PRD requirements (NFR14, FR6, FR28).
- **Architecture** — No conflict. MCP wrapping REST API is the defined pattern. Adding more tools follows the same architecture.
- **UI/UX** — No conflict. MCP-only changes. Zero UI modifications needed.
- **Epics document** — Needs Story 4.3 added to Epic 4.
- **Sprint status** — Needs Epic 4 reopened and Story 4.3 tracked.

### Technical Impact

- **Backend (ObjectScript/IRIS):** Zero changes. All REST endpoints already exist and work correctly.
- **Frontend (Angular):** Zero changes.
- **MCP Server (TypeScript):** Tool schema updates + 3 new tools + updated tool count.

---

## Section 3: Recommended Approach

**Direct Adjustment** — Add Story 4.3 to Epic 4.

### Rationale

The REST API already handles all required operations. The MCP server needs additional TypeScript tool definitions wrapping existing endpoints. This follows the exact same pattern established in Story 4.1 — define Zod schemas, call api-client, return results.

- **Effort:** Low — TypeScript tool wrappers over existing REST endpoints
- **Risk:** Low — no backend changes, no UI changes, well-understood pattern
- **Timeline impact:** Minimal — one additional story in Epic 4
- **Technical complexity:** Low — established pattern from Stories 4.1/4.2

### Alternatives Considered

- **Rollback (Option 2):** Not viable — existing MCP tools work correctly, they just need additions.
- **MVP Review (Option 3):** Not needed — this completes the MCP server as specified in the PRD, doesn't add new scope.

---

## Section 4: Detailed Change Proposals

### Change 1: Epics Document — Add Story 4.3

**File:** `_bmad-output/planning-artifacts/epics.md`
**Section:** Epic 4, after Story 4.2

**ADD:**

```markdown
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
```

### Change 2: Sprint Status — Reopen Epic 4

**File:** `_bmad-output/implementation-artifacts/sprint-status.yaml`
**Section:** development_status (Epic 4)

**OLD:**
```yaml
  epic-4: done
  4-1-mcp-server-with-ticket-operations: done
  4-2-mcp-configuration-and-connection-testing: done
  epic-4-retrospective: optional
```

**NEW:**
```yaml
  epic-4: in-progress
  4-1-mcp-server-with-ticket-operations: done
  4-2-mcp-configuration-and-connection-testing: done
  4-3-mcp-full-parity-type-specific-fields-and-tools: backlog
  epic-4-retrospective: optional
```

### Change 3: MCP Server Implementation Scope

**Files to modify:**

| File | Change |
|---|---|
| `mcp-server/src/tools/tickets.ts` | Add type-specific fields to `create_ticket` and `update_ticket` Zod schemas; add `parent_id` to `update_ticket` |
| `mcp-server/src/types.ts` | Add type-specific field interfaces for Bug, Task, Story, Epic |
| `mcp-server/src/tools/code-references.ts` | **New file** — `add_code_reference` and `remove_code_reference` tools |
| `mcp-server/src/tools/activity.ts` | **New file** — `list_activity` tool |
| `mcp-server/src/tools/connection.ts` | Update `TOOL_COUNT` from 7 to 10 |
| `mcp-server/src/index.ts` | Register new tools from code-references.ts and activity.ts |

**No backend (ObjectScript/IRIS) changes needed.**
**No frontend (Angular) changes needed.**

---

## Section 5: Implementation Handoff

**Scope:** Minor — Direct implementation by development team
**Handoff to:** Developer agent (via `/bmad-bmm-create-story` then `/bmad-bmm-dev-story`)

### Responsibilities

| Role | Responsibility |
|---|---|
| **Scrum Master** | Update epics.md with Story 4.3, update sprint-status.yaml |
| **Developer** | Implement Story 4.3 (MCP tool definitions in TypeScript) |
| **Code Reviewer** | Review MCP tool implementations for consistency with Stories 4.1/4.2 |
| **QA** | Verify all MCP tools achieve parity with REST API endpoints |

### Success Criteria

1. An AI agent can create a Bug with `severity` set via MCP
2. An AI agent can update a Story's `story_points` via MCP
3. An AI agent can set/change `parent_id` via MCP update
4. An AI agent can add and remove code references via MCP
5. An AI agent can read a ticket's full activity timeline via MCP
6. Every operation available in the UI is also available via MCP
7. All MCP tools validated with Zod schemas and snake_case parameters
8. `test_connection` reports correct tool count (10)

---
name: 'epic-cycle'
description: 'Execute the full BMAD development cycle (create-story → dev-story → code-review → commit → qa-automate → commit) for all stories in an Epic'
---

# Epic Development Cycle — Agent Teams

Execute the BMAD Method development cycle for all stories in an Epic (or a range of Epics) using **Agent Teams** with spawn-on-demand coordination. For each story, the pipeline runs:

1. `/bmad-bmm-create-story`
2. `/bmad-bmm-dev-story`
3. `/bmad-bmm-code-review`
4. Commit and Push to Git
5. `/bmad-bmm-qa-automate`
6. Commit and Push to Git

**IMPORTANT:** This workflow uses Agent Teams with **spawn-on-demand** coordination. Do NOT use the task list system (`TaskCreate`, `TaskList`, `TaskUpdate`) — agents poll TaskList on every wake-up and will self-schedule regardless of prompt instructions, `blockedBy` constraints, or task ownership. The lead tracks pipeline state directly and spawns/dispatches/shuts down agents one at a time.

---

## Phase 1 — Startup

1. Load `{project-root}/_bmad/bmm/config.yaml` to resolve `planning_artifacts` and `implementation_artifacts` paths.
2. Load the epics file from `{planning_artifacts}` (glob `*epic*.md`) to discover all stories for the target Epic(s).
3. Ask the user which Epic (or range of Epics) to execute, and which stories to include (default: all stories in the Epic).
4. List the stories that will be processed and confirm with the user before starting.
5. Assign each story a short ID (e.g., "1.1", "1.2", "2.1").

---

## Phase 2 — Team Setup

### Create the Team

```
TeamCreate("epic-cycle")
```

The team exists only for agent coordination (SendMessage routing). **Do NOT create any tasks** — the lead tracks pipeline state directly.

### Agent Roles

Four agent roles are used, each spawned fresh per task via the `Task` tool:

| Role | Name | Workflow |
|------|------|----------|
| Story Creator | `story-creator` | `/bmad-bmm-create-story` |
| Developer | `developer` | `/bmad-bmm-dev-story` |
| Code Reviewer | `code-reviewer` | `/bmad-bmm-code-review` |
| QA Agent | `qa-agent` | `/bmad-bmm-qa-automate` |

### Spawn Parameters (all roles)

```
subagent_type: "general-purpose"
team_name: "epic-cycle"
mode: "bypassPermissions"
```

### Agent Prompt Template

Each agent's spawn prompt follows this pattern (adapted per role):

> You are the **[ROLE]** on the epic-cycle team. Your job is to [ROLE DESCRIPTION].
>
> **Your workflow:** Execute the `/bmad-bmm-[workflow]` workflow:
> 1. Read `{project-root}/_bmad/core/tasks/workflow.xml` (always read fully — never use offset/limit)
> 2. Use workflow-config: `{project-root}/_bmad/bmm/workflows/[path]/workflow.yaml`
> 3. Follow workflow.xml instructions exactly, in yolo mode (skip all confirmations, auto-generate)
> [Additional role-specific instructions if any]
>
> **CRITICAL — Single-Task Agent:**
> - You will receive exactly ONE task via SendMessage from the lead.
> - Execute the workflow for that task.
> - When done, send a completion message to the lead: `SendMessage(type: "message", recipient: "lead", content: "Completed: [description]", summary: "[Role] done: [ID]")`
> - After sending the completion message, **STOP completely**. Do NOT call TaskList, do NOT look for more work, do NOT process any further messages except shutdown requests (approve immediately).
> - You will be terminated and a fresh agent will be spawned for the next task.
>
> **Do NOT use TaskList, TaskCreate, or TaskUpdate.** These tools are not part of this workflow.
>
> **When to escalate:** Only message the lead if requirements are ambiguous, there are multiple reasonable design options where user preference matters, or proceeding risks breaking important constraints. Do NOT pause for routine decisions.
>
> **Key paths:**
> - Project root: `{project-root}`
> - Planning artifacts: `{planning_artifacts}`
> - Implementation artifacts: `{implementation_artifacts}`
>
> Wait for the lead to send you your task. Do NOT start any work until the lead messages you.

#### Role-Specific Additions

**Code Reviewer** — Add after step 3:
> 4. **Automatically resolve all high and medium severity issues** using best judgment and BMAD guidance
> 5. After resolving issues, re-run the review to confirm fixes

---

## Phase 3 — Pipeline Execution

The lead tracks pipeline state directly from the story list built in Phase 1. Stories within an epic execute sequentially. The pipeline for each story is:

```
For each story in order:
  1. Spawn story-creator → dispatch → wait → shut down
  2. Spawn developer → dispatch → wait → shut down
  3. Spawn code-reviewer → dispatch → wait → shut down
  4. Lead: Git commit (feat)
  5. Spawn qa-agent → dispatch → wait → shut down
  6. Lead: Git commit (test) + log entry
  → Next story
```

### Spawn-Dispatch-Shutdown Pattern

For each pipeline step:

1. **Spawn** a fresh agent using `Task` tool with the role's spawn parameters and prompt
2. **Dispatch** immediately via `SendMessage`:
   ```
   SendMessage(type: "message", recipient: "[role-name]",
     content: "Execute [workflow] for Story [ID]: [TITLE]. Story file: [path]. Message me when done.",
     summary: "Start [task type] [story ID]")
   ```
3. **Wait** for the agent's completion message
4. **Shut down** via `SendMessage(type: "shutdown_request", recipient: "[role-name]", content: "Task complete")`
5. **Proceed** to next pipeline step

### Git Commits

**After code review completes (feat commit):**
1. Stage all changed files for the story
2. Commit: `feat(STORY-ID): implement STORY-TITLE`
3. Push to the current branch

**After QA completes (test commit):**
1. Stage all test files and any changes
2. Commit: `test(STORY-ID): add automated tests for STORY-TITLE`
3. Push to the current branch

---

## Phase 4 — Per-Story Completion Logging

After each story's QA task completes and the test commit is pushed, append a log entry to `{implementation_artifacts}/epic-cycle-log.md`:

```markdown
## Story [STORY-ID]: [TITLE]
- **Status:** Complete
- **Files touched:** [list of files]
- **Key design decisions:** [summary]
- **Issues auto-resolved:** [count] | **User input required:** [count]
- **Git commits:** feat: [hash] | test: [hash]
- **Completed:** [timestamp]
```

---

## Phase 5 — Shutdown

When all stories are completed:

1. Call `TeamDelete` to clean up the team (agents are already shut down individually after each task)
2. Display a final summary:
   - Total stories completed
   - Total commits created
   - Total issues auto-resolved
   - Any items that required user input
   - Link to `epic-cycle-log.md`

---

## When to Pause

Within each agent, only pause and escalate to the lead if:

- The acceptance criteria or requirements are ambiguous
- There are multiple reasonable design options and the user's preference matters
- Proceeding would risk breaking important constraints (security, compliance, performance, interoperability)

Do NOT pause for routine decisions — use best judgment and BMAD guidance.

## Handling Clarifications

When an agent surfaces a clarification via `SendMessage`:

1. The lead receives the message automatically
2. The lead relays the question to the user with context (Story ID, file(s) affected, key tradeoffs)
3. The user answers
4. The lead sends the answer back to the agent: `SendMessage(type: "message", recipient: "[agent]", content: "[user's answer]", summary: "Clarification for [ID]")`
5. The agent incorporates the answer as a hard constraint and resumes

---

## Anti-Patterns (Do NOT Use)

These patterns were tested and failed due to agent self-scheduling behavior:

- **TaskCreate/TaskList/TaskUpdate** — Agents poll TaskList on every wake-up and grab tasks regardless of `blockedBy`, prompt instructions, or task ownership. Even assigning tasks to `"team-lead"` is unreliable.
- **Persistent agents** — Idle agents self-schedule between tasks. Always shut down after each task.
- **Self-scheduling prompts** — Instructions like "do NOT call TaskList" are unreliable. Agents have built-in behavior to poll for work that overrides prompt text.
- **blockedBy constraints** — The task system does NOT enforce `blockedBy`. Agents can mark blocked tasks as `in_progress` and start working.

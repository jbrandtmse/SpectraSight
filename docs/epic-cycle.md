# Epic Development Cycle Slash Command

Develop a slash command that executes the BMAD Method development cycle, using Agent Teams, sequentially for a story for all stories in an Epic, or a range of Epics. The task sequence is:

1. **Lead** executes `/bmad-bmm-create-story` directly (no agent — prevents race-ahead)
2. Agent: `/bmad-bmm-dev-story`
3. Agent: `/bmad-bmm-code-review`
4. **Lead**: Commit and Push to Git
5. Agent: `/bmad-bmm-qa-automate`
6. **Lead**: Commit and Push to Git

Make sure to include a file for the slash command in the `/.claude/commands` folder so the workflow can be executed as a slash command.

## Execution Guidelines

**IMPORTANT:** Each task should be executed in Agent Teams using the **spawn-on-demand** pattern.

Automatically resolve all high and medium severity issues found during code review using your best judgment and BMAD guidance.

## Spawn-on-Demand Coordination (Critical)

**Do NOT use the task list system** (`TaskCreate`, `TaskList`, `TaskUpdate`). Agents poll TaskList on every wake-up and will self-schedule regardless of prompt instructions, `blockedBy` constraints, or task ownership. This behavior cannot be overridden by prompt text alone.

Instead, the lead tracks pipeline state directly from the epic story list and coordinates agents via **spawn-on-demand**:

### Spawn-Dispatch-Shutdown Pattern

For each pipeline step, the lead:

1. **Spawns** a fresh agent using the `Task` tool
2. **Dispatches** the task via `SendMessage` immediately
3. **Waits** for the completion message
4. **Shuts down** the agent via `SendMessage(type: "shutdown_request")` — agent prompt instructs them to approve immediately
5. **Re-spawns** a fresh agent for the next task

This completely eliminates self-scheduling — terminated agents can't poll TaskList.

### Pipeline Flow

```
For each story in order:
  Lead executes /bmad-bmm-create-story directly (pipeline gate)
  Lead spawns developer → dispatches → waits → shuts down
  Lead spawns code-reviewer → dispatches → waits → shuts down
  Lead does feat commit + push
  Lead spawns qa-agent → dispatches → waits → shuts down
  Lead does test commit + push
  Lead logs completion → next story
```

### Lead Creates Story Files (Critical Gate)

The lead executes `/bmad-bmm-create-story` directly — NOT via an agent. This is a deliberate pipeline gate that prevents agents from racing ahead. Only 3 agent roles exist: developer, code-reviewer, qa-agent.

### Agent Prompt Requirements

Each agent's spawn prompt must include:

```
**CRITICAL — Single-Task Agent:**
- You will receive exactly ONE task via SendMessage from the lead.
- Execute the workflow for that task.
- When done, send a completion message to the lead.
- After sending the completion message, STOP completely.
- Do NOT call TaskList, do NOT look for more work.
- Approve any shutdown request immediately.
- Do NOT use TaskList, TaskCreate, or TaskUpdate.

Wait for the lead to send you your task. Do NOT start any work until the lead messages you.
```

## When to Pause

Within each agent in the Agent Team, only pause to ask me a question if:

- The acceptance criteria or requirements are ambiguous
- There are multiple reasonable design options and my preference matters
- Proceeding would risk breaking important constraints (security, compliance, performance, interoperability)

## Handling Clarifications

When you need clarification, do not continue autonomously for that story. Instead:

- Surface a clear, numbered question back to me in the main conversation
- Include a concise summary of the relevant context (Story ID, file(s) affected, key tradeoffs)
- Wait for my answer before resuming work on that story's sub-agent

After I answer, incorporate my response as a hard constraint and resume the same story's agent workflow from where it left off. Continue through the task sequence as needed.

## Completion Logging

At the completion of each story, write a brief log entry summarizing:

- Story ID/name
- Files touched
- Key design decisions
- Any issues auto-resolved vs. those that required my input

## Anti-Patterns (Do NOT Use)

These patterns were tested and failed due to agent self-scheduling behavior:

- **TaskCreate/TaskList/TaskUpdate** — Agents poll TaskList on every wake-up and grab tasks regardless of `blockedBy`, prompt instructions, or task ownership
- **Persistent agents between tasks** — Idle agents self-schedule. Always shut down after each task
- **`blockedBy` constraints** — The task system does NOT enforce `blockedBy`. Agents work out of order
- **Lead-owned task parking** — Assigning tasks to "team-lead" is unreliable; agents still find and grab tasks
- **Self-scheduling prompts** — "Do NOT call TaskList" is unreliable; agents have built-in polling behavior
- **Story-creator agent** — A story-creator agent races ahead to create story files for future stories, enabling other agents to self-schedule. The lead must create story files directly as a pipeline gate

---
name: 'epic-cycle'
description: 'Execute the full BMAD development cycle (create-story → dev-story → code-review → commit → qa-automate → commit) for all stories in an Epic'
---

# Epic Development Cycle

Execute the BMAD Method development cycle sequentially for all stories in an Epic (or a range of Epics). For each story, run the following task sequence:

1. `/bmad-bmm-create-story`
2. `/bmad-bmm-dev-story`
3. `/bmad-bmm-code-review`
4. Commit and Push to Git
5. `/bmad-bmm-qa-automate`
6. Commit and Push to Git

## Startup

1. Load `{project-root}/_bmad/bmm/config.yaml` to resolve `planning_artifacts` and `implementation_artifacts` paths.
2. Load the epics file from `{planning_artifacts}` (glob `*epic*.md`) to discover all stories for the target Epic.
3. Ask the user which Epic (or range of Epics) to execute, and which stories to include (default: all stories in the Epic).
4. List the stories that will be processed and confirm with the user before starting.

## Per-Story Execution

**IMPORTANT:** Each task in the sequence MUST be executed as a sub-agent using the Task tool.

For each story in the Epic, run steps 1–6 in order:

### Step 1 — Create Story (sub-agent)
Execute `/bmad-bmm-create-story` for this story in yolo mode:
- Load `{project-root}/_bmad/core/tasks/workflow.xml`
- Pass workflow-config: `{project-root}/_bmad/bmm/workflows/4-implementation/create-story/workflow.yaml`
- Follow workflow.xml instructions exactly

### Step 2 — Dev Story (sub-agent)
Execute `/bmad-bmm-dev-story` for this story in yolo mode:
- Load `{project-root}/_bmad/core/tasks/workflow.xml`
- Pass workflow-config: `{project-root}/_bmad/bmm/workflows/4-implementation/dev-story/workflow.yaml`
- Follow workflow.xml instructions exactly

### Step 3 — Code Review (sub-agent)
Execute `/bmad-bmm-code-review` for this story in yolo mode:
- Load `{project-root}/_bmad/core/tasks/workflow.xml`
- Pass workflow-config: `{project-root}/_bmad/bmm/workflows/4-implementation/code-review/workflow.yaml`
- Follow workflow.xml instructions exactly
- **Automatically resolve all high and medium severity issues** using best judgment and BMAD guidance
- After resolving issues, re-run the review to confirm fixes

### Step 4 — Commit and Push
- Stage all changed files for the story
- Commit with message: `feat(STORY-ID): implement STORY-TITLE`
- Push to the current branch

### Step 5 — QA Automate (sub-agent)
Execute `/bmad-bmm-qa-automate` for this story in yolo mode:
- Load `{project-root}/_bmad/core/tasks/workflow.xml`
- Pass workflow-config: `{project-root}/_bmad/bmm/workflows/qa/automate/workflow.yaml`
- Follow workflow.xml instructions exactly

### Step 6 — Commit and Push
- Stage all test files and any changes
- Commit with message: `test(STORY-ID): add automated tests for STORY-TITLE`
- Push to the current branch

## When to Pause

Within each sub-agent, only pause and surface a question to the main conversation if:

- The acceptance criteria or requirements are ambiguous
- There are multiple reasonable design options and the user's preference matters
- Proceeding would risk breaking important constraints (security, compliance, performance, interoperability)

Do NOT pause for routine decisions — use best judgment and BMAD guidance.

## Handling Clarifications

When clarification is needed, do not continue autonomously for that story. Instead:

- Surface a clear, numbered question back to the user in the main conversation
- Include a concise summary of the relevant context (Story ID, file(s) affected, key tradeoffs)
- Wait for the user's answer before resuming work on that story

After receiving an answer, incorporate it as a hard constraint and resume the story's workflow from where it left off.

## Completion Logging

At the completion of each story, write a log entry to `{implementation_artifacts}/epic-cycle-log.md` (append) summarizing:

- **Story ID/name**
- **Files touched**
- **Key design decisions**
- **Issues auto-resolved** vs. those that required user input
- **Git commits** created (hashes)

After all stories are complete, display a final summary of the full Epic cycle.

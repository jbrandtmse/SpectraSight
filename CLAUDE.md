# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SpectraSight is built on the **BMAD Framework** (Build Method for AI-Driven Development) v6.0.0-Beta.8. It is a multi-agent AI development methodology platform — not a traditional application. There is no build/test/lint pipeline; all work is driven through BMAD workflow slash commands.

The backend targets **InterSystems IRIS** (localhost:52773, user `_SYSTEM`). MCP servers for IRIS execution and interoperability are available in this environment.

## Key Directories

- `_bmad/core/` — Core BMAD engine: workflow executor (`tasks/workflow.xml`), master agent, and shared workflows (brainstorming, party-mode)
- `_bmad/bmm/` — Business Method Module: 10 agent personas, 4-phase workflow configs, templates, and reference data
- `_bmad/_memory/` — Persistent agent memory (documentation standards, config)
- `_bmad-output/` — Generated artifacts split into `planning-artifacts/` and `implementation-artifacts/`
- `.claude/commands/` — 41 slash commands mapping to BMAD workflows
- `docs/` — Project documentation

## Workflow Execution Model

Every BMAD slash command follows the same pattern:
1. Load `_bmad/core/tasks/workflow.xml` (the universal executor — **always read fully, never use offset/limit**)
2. Read the referenced `workflow.yaml` from `_bmad/bmm/workflows/{phase}/{workflow}/`
3. Resolve variables from `_bmad/bmm/config.yaml` and system context
4. Execute instructions step-by-step, saving outputs to `_bmad-output/`

Two execution modes: **normal** (interactive, confirm each step) and **yolo** (skip confirmations, auto-generate).

## Development Phases and Common Commands

### Phase 1 — Analysis
`/bmad-brainstorming`, `/bmad-bmm-market-research`, `/bmad-bmm-domain-research`, `/bmad-bmm-technical-research`, `/bmad-bmm-create-product-brief`

### Phase 2 — Planning
`/bmad-bmm-create-prd`, `/bmad-bmm-validate-prd`, `/bmad-bmm-edit-prd`, `/bmad-bmm-create-ux-design`

### Phase 3 — Solutioning
`/bmad-bmm-create-architecture`, `/bmad-bmm-create-epics-and-stories`, `/bmad-bmm-check-implementation-readiness`

### Phase 4 — Implementation
`/bmad-bmm-sprint-planning`, `/bmad-bmm-create-story`, `/bmad-bmm-dev-story`, `/bmad-bmm-code-review`, `/bmad-bmm-qa-automate`, `/bmad-bmm-retrospective`, `/bmad-bmm-sprint-status`

### Cross-cutting
`/bmad-help` (contextual guidance), `/bmad-party-mode` (multi-agent discussion), `/bmad-bmm-correct-course`, `/bmad-bmm-quick-dev`, `/bmad-bmm-quick-spec`

## Agent Personas

Agent definitions live in `_bmad/bmm/agents/`. Each is a markdown file with embedded XML activation instructions. The 10 roles: BMAD Master, Analyst, Product Manager, Architect, Developer, QA, Scrum Master, UX Designer, Tech Writer, Quick-Flow Solo Dev. Agents can be activated directly via `/bmad-agent-bmm-{role}` commands.

## Epic Cycle Pattern

The full story development cycle (documented in `docs/epic-cycle.md`) runs as sub-agents in sequence:
1. `/bmad-bmm-create-story` → 2. `/bmad-bmm-dev-story` → 3. `/bmad-bmm-code-review` → 4. Git commit/push → 5. `/bmad-bmm-qa-automate` → 6. Git commit/push

Auto-resolve high/medium severity code review issues. Only pause for ambiguous requirements, meaningful design choices, or safety constraints.

## Critical Rules

- **Never use offset/limit** when reading workflow-related files — always read completely
- Instructions in workflow steps are **mandatory** — execute all steps in exact order
- After each `template-output` tag, save content and wait for user confirmation (unless in yolo mode)
- Config is loaded from `_bmad/bmm/config.yaml` — output goes to `{project-root}/_bmad-output`

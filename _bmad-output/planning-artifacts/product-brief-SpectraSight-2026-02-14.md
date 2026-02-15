---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: []
date: 2026-02-14
author: Developer
---

# Product Brief: SpectraSight

<!-- Content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

SpectraSight is an IRIS-native ticketing and project management system purpose-built for InterSystems development teams. It combines a full-stack Angular/IRIS architecture with first-of-its-kind features: direct ObjectScript code linking from tickets, a built-in MCP server for AI agent integration, and a flexible ticket type system powered by ObjectScript persistent object inheritance. By hosting entirely on IRIS and integrating deeply with its codebase, SpectraSight eliminates the friction of disconnected tooling that IRIS teams face with general-purpose platforms like Jira.

---

## Core Vision

### Problem Statement

InterSystems IRIS development teams rely on general-purpose project management tools like Jira that have no native understanding of the IRIS ecosystem. Developers cannot link tickets directly to ObjectScript classes and methods, cannot browse server-side code from within their work items, and have no way to connect AI agent workflows to their ticketing system without building custom extensions. This creates a persistent gap between where work is tracked and where work actually happens.

### Problem Impact

This disconnect forces IRIS teams into manual workarounds — copy-pasting class names into ticket descriptions, switching between tools to cross-reference code and tasks, and lacking the ability to leverage emerging AI agent capabilities for ticket creation, triage, and code-change linking. Development velocity suffers, context is lost, and the growing ecosystem of MCP-enabled AI tools remains inaccessible to their project workflows.

### Why Existing Solutions Fall Short

General-purpose ticketing systems treat all development ecosystems the same. They offer no ObjectScript-aware features, no native IRIS hosting option, and no built-in MCP server. While extensions and integrations can partially bridge these gaps, they add complexity, introduce maintenance burden, and never achieve the seamless experience of a purpose-built tool. No existing solution provides direct, in-ticket ObjectScript code viewing or first-class AI agent access to the ticketing workflow.

### Proposed Solution

SpectraSight is a full-stack ticketing system with an Angular front end and IRIS back end that provides:

- **Hierarchical ticket management** — Initiative > Epic > Story > Task > Sub-Task with optional linkages (not all levels required)
- **Core ticket types** — Bugs, Tasks, Stories, Epics, Initiatives, and Sub-Tasks built on ObjectScript persistent object inheritance, sharing a common root Ticket class while extending type-specific fields
- **Native ObjectScript code linking** — Reference specific classes and methods directly in tickets, with the ability to view method source code from within the ticket interface
- **Built-in MCP server** — First-class AI agent access for creating tickets, updating status, and linking code changes
- **List and board views** — List view as the primary interface with kanban-style board view for visual workflow management
- **IRIS-hosted** — Runs entirely on the InterSystems IRIS platform, no external dependencies

### Key Differentiators

- **First IRIS-native project management tool** — Purpose-built for the InterSystems ecosystem, not adapted from a generic platform
- **ObjectScript code browsing from tickets** — Directly link to and view class methods without leaving the ticketing interface
- **Built-in MCP server** — Native AI agent integration for the emerging agentic development workflow, with no extensions required
- **Persistent object inheritance architecture** — Leverages IRIS's own object model for clean, extensible ticket type design
- **First mover advantage** — Positioned to be the first ticketing platform combining IRIS-native hosting, ObjectScript integration, and MCP agent support

## Target Users

### Primary Users

#### IRIS Developer — "Alex"

Alex is a senior InterSystems IRIS developer working on a healthcare integration platform. They're either a solo developer or part of a small team (2-5 people) managing a complex IRIS codebase. Alex creates, works, and manages tickets — wearing multiple hats from planning through implementation.

**Current Frustration:** Alex tracks work in Jira but constantly context-switches between the ticketing UI and the IRIS Management Portal or VS Code to cross-reference ObjectScript classes. Bug tickets reference methods by name in free-text descriptions, which go stale as code evolves. There's no way to quickly verify what a referenced method actually does without leaving the ticket.

**What Success Looks Like:** Alex opens a bug ticket, clicks the linked method reference, and sees the current ObjectScript source right there. They update the ticket status, link the fix to the relevant class, and move on — all without leaving SpectraSight. The overhead of tracking work drops dramatically.

**Motivations:** Efficiency, reducing context-switching, keeping code and work items connected, spending more time coding and less time on tooling friction.

#### AI Agent — "Spectra"

Spectra is an AI coding agent (e.g., Claude Code, Cursor, or a custom MCP client) operating as a first-class team member. Spectra interacts with SpectraSight entirely through the MCP server, participating in the development workflow on equal footing with human developers.

**How Spectra Works:** Spectra creates tickets when it identifies issues during code analysis, updates ticket status as it works through tasks, links code changes directly to the tickets it's working on, and queries the ticket system for context about what needs to be done next. Spectra doesn't need a UI — the MCP server is its native interface.

**What Success Looks Like:** A developer asks Spectra to implement a story. Spectra reads the story ticket via MCP, writes the code, links the changed classes and methods back to the ticket, marks it complete, and moves to the next task — all without human intervention on the ticketing side.

**Motivations:** Structured access to project context, ability to read and update work items programmatically, seamless code-to-ticket linking.

### Secondary Users

#### Team Lead — "Jordan"

In small team scenarios, Jordan is a senior developer who also coordinates work. They use SpectraSight's list and board views to see what's in progress, what's blocked, and what the AI agents are working on alongside human team members. Jordan doesn't need heavy project management features — just clear visibility into the current state of work across the team hierarchy (Initiatives through Sub-Tasks).

**What Success Looks Like:** Jordan glances at the board view, sees three stories in progress (one by Alex, two by Spectra), spots a blocked task, and reassigns it — all in under a minute.

### User Journey

1. **Discovery:** An IRIS developer finds SpectraSight on Open Exchange or hears about it through the InterSystems developer community. The promise of native ObjectScript integration and MCP agent support catches their attention.

2. **Onboarding:** They install SpectraSight on their existing IRIS instance. Setup is lightweight — no external dependencies, no complex configuration. They create their first project and a few tickets within minutes.

3. **First "Aha" Moment — Code Linking:** They add an ObjectScript class and method reference to a bug ticket, click it, and see the actual method source code rendered inline. No more copy-pasting or switching tools.

4. **Second "Aha" Moment — Agent Integration:** They point their AI coding agent at SpectraSight's MCP server. The agent reads the next open story, implements it, and links its code changes back to the ticket — all autonomously. The developer sees the ticket updated with linked classes and a completed status.

5. **Long-term Adoption:** SpectraSight becomes the single source of truth for their IRIS project. Human and AI team members interact with the same ticket system through their preferred interfaces (Angular UI vs. MCP), and every ticket stays connected to the actual code it references.

## Success Metrics

### User Success Metrics

- **Ease of adoption:** A new user (human or AI agent) can install SpectraSight on an existing IRIS instance and create their first ticket within 15 minutes
- **Active ticket usage:** Tickets are the primary method for tracking work — team members consistently create, update, and close tickets rather than reverting to informal tracking
- **Code reference utilization:** Tickets regularly include ObjectScript class/method references, indicating the code-linking feature is providing real value over plain-text descriptions
- **AI agent participation:** AI agents are actively creating and updating tickets via the MCP server as part of their normal development workflow, not as an afterthought
- **Reduced context-switching:** Users browse linked ObjectScript code directly from tickets instead of switching to the Management Portal or IDE

### Business Objectives

- **Open-source community growth:** Build an active, engaged community around SpectraSight on GitHub and the InterSystems developer ecosystem
- **Internal validation first:** Prove the product's value through daily use by the development team before promoting externally
- **Community contribution:** Establish SpectraSight as a recognized tool on Open Exchange that attracts contributors and feedback

### Key Performance Indicators

| KPI | 3-Month Target | 12-Month Target |
|-----|---------------|-----------------|
| Internal team daily usage | Active — primary ticketing tool for the team | Continued daily use with expanded feature set |
| External adoption | N/A (internal focus) | Other IRIS teams actively using SpectraSight |
| GitHub stars | N/A | Growing star count indicating community interest |
| MCP agent interactions | AI agents regularly creating/updating tickets | AI agent workflows documented and adopted by external users |
| Open Exchange presence | Published on Open Exchange | Positive reviews and community feedback |
| Code reference usage | >50% of tickets include ObjectScript links | Standard practice across all adopting teams |

## MVP Scope

### Core Features

**Ticket System Foundation**
- **Core ticket types:** Bug, Task, Story, Epic — built on ObjectScript persistent object inheritance with a shared root Ticket class
- **Ticket CRUD:** Create, read, update, and close tickets through both the UI and API
- **Hierarchical relationships:** Epic > Story > Task with optional linkages (not all levels required for every ticket); Bugs as standalone or linked to any level
- **ObjectScript code references:** Text-based class/method reference fields on tickets (store the reference, code viewing deferred to post-MVP)
- **Standard ticket fields:** Title, description, status, priority, assignee (human or AI agent), type-specific fields via inheritance

**Angular Front End**
- **List view:** Primary ticket interface with filtering, sorting, and search
- **Ticket detail view:** Full ticket view with all fields, hierarchy navigation, and code references
- **Standalone SPA:** Served from IRIS or deployed to an external web server
- **Simple setup:** No complex role-based permissions — lightweight configuration suitable for small teams and solo developers

**IRIS Back End**
- **REST API:** Full CRUD operations for all ticket types
- **Persistent object model:** ObjectScript class hierarchy with Ticket as the base persistent class, extended by each ticket type
- **Self-hosted on IRIS:** No external database or service dependencies

**MCP Server**
- **Ticket CRUD via MCP:** AI agents can create, read, update, list, and close tickets
- **Query capabilities:** Filter and search tickets by type, status, assignee, and other fields
- **First-class agent access:** AI agents operate as equal participants in the ticketing workflow

### Out of Scope for MVP

- **Board/kanban view** — Post-MVP enhancement for visual workflow management
- **In-ticket ObjectScript code viewing** — Key differentiator deferred to a near-term post-MVP epic; MVP stores references only
- **Code-linking operations via MCP** — Deferred alongside code viewing feature
- **Initiative and Sub-Task ticket types** — Will extend the inheritance hierarchy post-MVP
- **Notifications and alerts** — No email, webhook, or in-app notification system in MVP
- **Reporting and dashboards** — No analytics, burndown charts, or velocity tracking
- **Time tracking** — No time logging or estimation features
- **Sprint management** — No sprint boundaries, sprint planning, or sprint-based views
- **VS Code extension** — Roadmap item for IDE-integrated ticket management
- **CI/CD pipeline integration** — Future capability for linking builds/deploys to tickets

### MVP Success Criteria

- **Daily driver:** The internal development team uses SpectraSight as their primary ticketing tool, replacing previous tools for day-to-day work tracking
- **Agent integration validated:** AI agents successfully create and update tickets via the MCP server as part of normal development workflows
- **Code references in use:** Tickets consistently include ObjectScript class/method references, demonstrating the value of native IRIS integration even before code viewing is added
- **Hierarchy works:** Epic > Story > Task relationships effectively organize work at different levels of granularity
- **Decision gate:** If the team is using SpectraSight daily after 3 months, proceed with code viewing epic and external release preparation

### Future Vision

**Near-term (Post-MVP)**
- **ObjectScript code viewing from tickets** — The key differentiator: click a class/method reference and see the live source code inline
- **Board/kanban view** — Visual drag-and-drop workflow management
- **Code-linking via MCP** — AI agents can attach code references when updating tickets
- **Initiative and Sub-Task ticket types** — Complete the full hierarchy

**Mid-term**
- **VS Code extension** — Browse and manage SpectraSight tickets directly from VS Code, with bidirectional ObjectScript code linking
- **Custom ticket types** — Allow teams to define their own ticket types that extend the base Ticket class
- **Notifications** — Configurable alerts for ticket updates, assignments, and status changes

**Long-term**
- **CI/CD integration** — Link build and deployment events to tickets automatically
- **Expanded IRIS integration** — Beyond ObjectScript to SQL queries, interoperability productions, and other IRIS capabilities
- **Community ecosystem** — Plugin architecture enabling the InterSystems community to extend SpectraSight with custom integrations

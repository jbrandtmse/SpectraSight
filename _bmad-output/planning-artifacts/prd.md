---
stepsCompleted: [step-01-init, step-02-discovery, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish]
inputDocuments:
  - product-brief-SpectraSight-2026-02-14.md
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 0
  projectContext: 0
classification:
  projectType: web_app + developer_tool
  domain: developer_tooling_general
  complexity: medium
  projectContext: greenfield
workflowType: 'prd'
---

# Product Requirements Document - SpectraSight

**Author:** Developer
**Date:** 2026-02-14

## Executive Summary

SpectraSight is an IRIS-native ticketing and project management system designed for InterSystems IRIS development teams. It runs on the same IRIS instance as the code it tracks, eliminating the friction of context-switching between external tools and the development environment.

**Key differentiators:**

1. **First IRIS-native project management tool** — purpose-built for the InterSystems ecosystem, hosted on IRIS itself
2. **AI agents as first-class users** — built-in MCP server treats AI coding agents as equal participants alongside human developers
3. **ObjectScript %Persistent inheritance** — ticket types modeled using IRIS's native object inheritance, making the platform's own object model the product's extensibility model

**Target users:** IRIS developers (daily ticket management with ObjectScript code references), team leads (work coordination and oversight), and AI coding agents (autonomous ticket operations via MCP).

**Architecture:** Angular SPA front end + IRIS REST API back end + MCP server (stdio transport). All three interfaces operate against the same IRIS persistent object layer.

## Success Criteria

### User Success

- **Frictionless setup:** A developer with an existing IRIS instance can install SpectraSight and create their first ticket within 15 minutes
- **Replaces existing tools:** The team stops using Jira or other external ticketing tools for day-to-day IRIS project work within 2 weeks of adoption
- **Code references feel natural:** Developers instinctively add ObjectScript class/method references to tickets because the UI makes it easy — not because they're required to
- **AI agents just work:** Configuring an AI agent's MCP client to connect to SpectraSight is straightforward, and the agent can create and manage tickets without human intervention on the ticketing side
- **Hierarchy clarifies work:** Developers organize work into Epic > Story > Task naturally, and the hierarchy helps them understand what they're working on and why

### Business Success

- **3-month milestone:** Internal team uses SpectraSight daily as their primary ticketing tool; published on Open Exchange
- **12-month milestone:** At least one external IRIS team actively using SpectraSight; growing GitHub star count; positive community feedback on Open Exchange
- **Community validation:** InterSystems developer community recognizes SpectraSight as a useful tool, evidenced by downloads, stars, and organic mentions

### Technical Success

- **Performance:** Ticket list views and detail pages load within a few seconds; no operations take minutes. MCP server response times are comparable to the web UI experience
- **Browser support:** Chromium-based browsers (Chrome, Edge, Brave, etc.)
- **Reliability:** Ticket data is persisted reliably through IRIS's built-in storage — no data loss under normal operation
- **Maintainability:** ObjectScript persistent object inheritance model makes adding new ticket types straightforward — extending the base Ticket class with type-specific fields should not require changes to core CRUD logic

### Measurable Outcomes

| Outcome | Target |
|---------|--------|
| Time to first ticket (from install) | < 15 minutes |
| Weekly ticket volume (solo/small team) | 5-15 tickets/week |
| Code reference adoption | > 50% of tickets include ObjectScript class/method references |
| AI agent ticket operations | Agents create/update tickets weekly as part of normal workflow |
| Page load time | < 5 seconds for list and detail views |
| MCP operation response | Comparable to web UI response times |

## Product Scope

### MVP Strategy

**MVP Approach:** Problem-Solving MVP — deliver a focused tool that solves the specific pain of IRIS developers lacking native project tracking with code integration and AI agent access.

**Build Approach:** Solo developer building with AI agents (Claude Code + MCP), prioritizing working functionality over polish.

**Resource Requirements:** One developer + AI agent toolchain. No dedicated QA, design, or DevOps team — all roles handled through the BMAD framework workflow.

### MVP - Minimum Viable Product

**Core User Journeys Supported:**
- Alex — First-Time Setup and Daily Use
- Spectra — AI Agent Autonomous Workflow
- Alex — Connecting an AI Agent for the First Time
- Jordan — Team Oversight and Work Coordination

**Ticket System**
- Bug, Task, Story, Epic ticket types via ObjectScript persistent object inheritance
- Full CRUD through Angular UI and REST API
- Epic > Story > Task hierarchy with optional linkages; Bugs standalone or linked to any level
- Text-based ObjectScript class/method reference fields on tickets
- Standard fields: title, description, status, priority, assignee (human or AI agent)
- Type-specific fields via class inheritance
- Comment/activity system — both humans (via UI) and AI agents (via MCP) can add comments

**Angular Front End**
- List view with filtering, sorting, and search
- Ticket detail view with all fields, hierarchy navigation, code references, and comments
- Standalone SPA (served from IRIS or external web server)
- Chromium browser support
- Simple, lightweight configuration — no complex permissions

**IRIS Back End**
- REST API for all ticket operations and comments
- ObjectScript persistent class hierarchy (Ticket base class, extended per type)
- Self-hosted on existing IRIS instance, no external dependencies

**MCP Server**
- Ticket CRUD (create, read, update, list, close)
- Comment support — AI agents can add and read comments
- Query and filter by type, status, assignee, and other fields
- AI agents as first-class participants — functional parity with REST API

### Growth Features (Post-MVP)

- ObjectScript code viewing from tickets (key differentiator — view live method source inline)
- Board/kanban view for visual workflow management
- Code-linking operations via MCP (read/navigate code through agent interface)
- Initiative and Sub-Task ticket types (complete hierarchy)
- Enhanced filtering and saved views

### Vision (Future)

- VS Code extension for IDE-integrated ticket management
- Custom ticket types extending the base Ticket class
- Notifications and configurable alerts
- CI/CD pipeline integration
- Expanded IRIS integration (SQL, interoperability productions)
- IPM/ZPM package distribution on Open Exchange
- Community plugin ecosystem

## User Journeys

### Journey 1: Alex — First-Time Setup and Daily Use

**Opening Scene:** Alex is a senior IRIS developer maintaining a healthcare integration platform. They've been tracking work in Jira, but every time they file a bug, they copy-paste class names into the description field, then alt-tab to the Management Portal to double-check the method signature. Half the time, the references in old tickets are stale. Alex hears about SpectraSight on Open Exchange and decides to try it.

**Rising Action:** Alex downloads SpectraSight and installs it on their existing IRIS instance. Within minutes, the Angular UI is running. They create their first Epic — "Patient Data Validation Overhaul" — and break it into three Stories. For the first Story, they add a Task and a Bug they've been meaning to track. When creating the Bug, they type in the ObjectScript class `HS.Integration.PatientValidator` and method `ValidateRecord` as a code reference. It's stored right there on the ticket — no copy-paste into a free-text description.

**Climax:** The next morning, Alex opens SpectraSight and navigates to the Bug. The class and method reference is right there, structured and clear. They click into the Story, see the three child Tasks underneath it, and immediately know where they left off. No context-switching to Jira, no searching through free-text descriptions for class names. For the first time, the ticketing system actually understands what they're working on.

**Resolution:** Within a week, Alex has stopped opening Jira entirely. SpectraSight is their daily driver. Every ticket has ObjectScript references, the hierarchy keeps work organized, and the whole thing runs on the same IRIS instance as their code. The friction is gone.

---

### Journey 2: Spectra — AI Agent Autonomous Workflow

**Opening Scene:** Spectra is an AI coding agent (Claude Code with MCP) that has been configured to connect to SpectraSight's MCP server. Alex has just asked Spectra to implement the next open Story in the "Patient Data Validation Overhaul" Epic.

**Rising Action:** Spectra queries the MCP server: "List all Stories in Epic 'Patient Data Validation Overhaul' with status 'Open'." SpectraSight returns three Stories. Spectra picks the first one — "Add ZIP code format validation" — and reads its full details: description, acceptance criteria, linked Tasks, and the ObjectScript code reference `HS.Integration.PatientValidator`. Spectra updates the Story status to "In Progress" via MCP.

**Climax:** Spectra writes the validation logic, extends the `ValidateRecord` method, and writes unit tests. When done, Spectra updates the Story via MCP — sets status to "Complete," adds a comment summarizing the changes, and references the modified class and method. The whole cycle happened without a single browser tab opening.

**Resolution:** Alex checks SpectraSight and sees the Story marked complete with a clear summary of what changed. They review the code, satisfied that the agent worked autonomously through the ticketing system just like a human teammate would. The MCP server made it seamless — Spectra didn't need a UI, and the ticket history tells the full story of what happened.

---

### Journey 3: Alex — Connecting an AI Agent for the First Time

**Opening Scene:** Alex has been using SpectraSight for a week and loves it. Now they want to connect their AI coding agent (Claude Code) to the MCP server so the agent can read and update tickets autonomously.

**Rising Action:** Alex opens their MCP client configuration and adds SpectraSight's MCP server endpoint — it's running on the same IRIS instance, so the connection details are straightforward. They configure authentication (same IRIS credentials) and test the connection. The agent queries "List all open tickets" and SpectraSight returns the full list.

**Climax:** Alex assigns a Task to the AI agent and asks it to work on it. The agent reads the Task details via MCP, implements the change, and updates the ticket status to "Complete" with a comment describing what it did. Alex sees the update appear in the SpectraSight UI in real-time. It just works.

**Resolution:** From this point on, Alex treats the AI agent as a teammate. They assign Tasks and Stories to the agent, and it works through them autonomously — reading ticket details, updating status, and commenting on progress. The MCP server is the bridge that makes human-AI collaboration feel natural.

---

### Journey 4: Jordan — Team Oversight and Work Coordination

**Opening Scene:** Jordan is a senior developer who coordinates a small IRIS team (two developers plus two AI agents). The team has been using SpectraSight for a month, and Jordan needs to check on sprint progress.

**Rising Action:** Jordan opens SpectraSight's list view and filters by the current Epic. They see all Stories and Tasks at a glance — status, assignee, priority. Two Stories are in progress (one assigned to Alex, one to an AI agent), one Task is blocked, and three Stories are still open. Jordan clicks into the blocked Task and reads the description — it's waiting on a clarification about the data format for a patient ID field.

**Climax:** Jordan adds a comment to the blocked Task with the answer, changes the status from "Blocked" to "Open," and reassigns it to the AI agent. They then check the AI agent's completed Stories — each has a clear comment trail showing what the agent did and which ObjectScript classes were modified. Jordan can verify the work without asking anyone for a status update.

**Resolution:** In under five minutes, Jordan has a complete picture of the team's progress, unblocked a stuck Task, and redistributed work — all from the list view. No standup meeting needed, no chasing people for updates. SpectraSight gives Jordan the visibility they need without heavyweight project management overhead.

---

### Journey Requirements Summary

| Journey | Capabilities Required |
|---------|----------------------|
| Alex — Setup & Daily Use | Installation on IRIS, ticket CRUD UI, code reference fields, hierarchy navigation, list view with filtering |
| Spectra — Agent Workflow | MCP server CRUD, ticket querying/filtering via MCP, status updates, comment support via MCP, code reference fields via MCP |
| Alex — Agent Connection | MCP server endpoint configuration, authentication, connection testing, real-time UI updates |
| Jordan — Team Oversight | List view filtering by Epic/assignee/status, comment system, status management, reassignment, hierarchy visibility |

**Cross-cutting capabilities:**
- **Comment/activity system** — both humans (via UI) and AI agents (via MCP) can add comments, creating a shared activity trail
- **Status workflow:** Open, In Progress, Blocked, Complete
- **Assignee management:** Assign to human or AI agent

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. First IRIS-Native Project Management Tool**
SpectraSight appears to be the first purpose-built ticketing and project management system designed specifically for the InterSystems IRIS ecosystem. Rather than adapting a generic platform, it leverages IRIS as both the runtime platform and the development environment it integrates with — the ticketing system runs on the same server as the code it tracks.

**2. AI Agent as First-Class User via Built-in MCP Server**
Most ticketing systems treat AI/automation as an afterthought — typically through REST API extensions or third-party integrations. SpectraSight inverts this by designing the MCP server as a primary interface from day one, treating AI agents as equal participants alongside human users.

**3. ObjectScript %Persistent Inheritance as Ticket Architecture**
Instead of using a traditional relational model with a single tickets table and type columns, SpectraSight uses IRIS's native %Persistent object inheritance to model ticket types. A base Ticket class defines shared fields and behavior, while Bug, Task, Story, and Epic subclasses extend it with type-specific fields. Adding a new ticket type is as simple as creating a new subclass.

### Market Context & Competitive Landscape

- No known IRIS-native project management or ticketing tools exist on Open Exchange or in the InterSystems ecosystem
- No known ticketing systems ship with a built-in MCP server as a core interface (rather than an extension)
- The combination of IRIS-native hosting + ObjectScript code linking + MCP agent access is unique in the market
- SpectraSight is positioned as a first mover in an uncontested niche

### Validation Approach

- **%Persistent inheritance model:** Validate early by implementing the base Ticket class and at least two subclasses (Bug, Task) to confirm the inheritance approach handles CRUD, querying, and polymorphic list views cleanly
- **MCP server parity:** Validate that MCP operations achieve functional parity with REST API operations — an AI agent should be able to do everything a human can do through the UI
- **Code reference utility:** Validate that structured class/method references provide meaningfully better experience than free-text descriptions, even before code viewing is added

## Web App & Developer Tool Specific Requirements

### Project-Type Overview

SpectraSight is a hybrid web application and developer tool: an Angular SPA front end communicating with an IRIS REST API back end, paired with an MCP server for AI agent access. The web app serves human users, while the MCP server (stdio transport) serves AI agents. Both interfaces operate against the same IRIS persistent object layer.

### Technical Architecture Considerations

**Front End — Angular SPA**
- Single Page Application built with Angular
- Chromium browser support (Chrome, Edge, Brave)
- No SEO requirements — internal/developer tool, not a public-facing site
- No real-time push required — manual page refresh acceptable for MVP
- Standard accessibility best practices (semantic HTML, keyboard navigation, ARIA labels)
- Responsive layout nice-to-have — primary use is desktop

**Back End — IRIS REST API**
- RESTful API serving the Angular front end
- All ticket operations exposed as REST endpoints (CRUD for all ticket types, comments, hierarchy queries)
- IRIS authentication for API access
- JSON request/response format
- API documentation covered in the BMAD architecture document

**MCP Server**
- **Transport:** stdio (local process) — AI agents connect by launching the MCP server process locally
- **Protocol:** Standard MCP tool definitions for ticket operations
- **Parity goal:** MCP tools mirror REST API capabilities — create, read, update, list, close tickets; add comments; query/filter
- **Authentication:** IRIS credentials passed via MCP server configuration

### Installation & Distribution

- **MVP distribution:** GitHub repository with import instructions for loading into an existing IRIS instance
- **Future distribution:** IPM/ZPM package on Open Exchange for streamlined installation
- **Prerequisites:** Existing InterSystems IRIS instance (any recent version supporting %JSON and REST)
- **No external dependencies:** No Node.js server, no external database — Angular SPA is pre-built static files served from IRIS or any web server

### Documentation Strategy

- **MVP documentation:** README with setup instructions, configuration, and quick start guide
- **API documentation:** Covered in the BMAD architecture document as a planning artifact
- **MCP tool documentation:** Tool descriptions embedded in MCP server implementation (self-documenting via MCP protocol)
- **BMAD artifacts:** Full planning and architecture documents distributed with the project

### Implementation Considerations

- **Angular-to-IRIS communication:** Angular HttpClient calling IRIS REST endpoints; CORS configuration needed if SPA served from different origin than IRIS
- **Static file serving:** Angular build output (dist/) served from IRIS's web server or any static file server
- **MCP stdio lifecycle:** MCP server process launched per-agent session; each session gets its own stdio connection to the IRIS instance
- **ObjectScript class compilation:** Ticket type classes and REST dispatch classes loaded via standard IRIS class import; no special build pipeline needed

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| %Persistent inheritance doesn't scale for complex queries | Could limit filtering/reporting | Fallback to a more relational model; IRIS supports both approaches. Validate early with prototype queries |
| MCP adoption slower than expected | Fewer AI agent users | REST API provides full functionality regardless; MCP is additive, not exclusive |
| No market demand for IRIS-native ticketing | Low adoption | Internal team validates value first; only invest in external promotion after 3-month internal use |
| Code references without code viewing feel incomplete | Users may not see value until post-MVP | Ensure structured references save time vs. free-text; communicate code viewing roadmap |
| MCP stdio transport reliability | Agent workflow disruption | Standard MCP pattern, well-documented. Test with Claude Code early to validate |
| Solo developer bandwidth | Delayed delivery | AI agents handle significant work via MCP. BMAD provides structure. If constrained, defer Phase 2 and ship solid MVP |
| Minimal viable feature set too thin | Insufficient value for adoption | Could launch with Bug + Task types and add Story/Epic in a fast follow. Core CRUD + MCP is the absolute minimum |

## Functional Requirements

### Ticket Management

- **FR1:** Users can create tickets of type Bug, Task, Story, or Epic
- **FR2:** Users can view the full details of any ticket
- **FR3:** Users can update any field on an existing ticket
- **FR4:** Users can delete tickets
- **FR5:** Users can view and set standard fields on any ticket: title, description, status, priority, and assignee
- **FR6:** Users can view and set type-specific fields unique to each ticket type
- **FR7:** Users can set ticket status to Open, In Progress, Blocked, or Complete
- **FR8:** Users can set ticket priority to Low, Medium, High, or Critical
- **FR9:** Users can assign tickets to a human user or an AI agent

### Ticket Organization & Hierarchy

- **FR10:** Users can create parent-child relationships between tickets (Epic > Story > Task)
- **FR11:** Users can link Bug tickets to any other ticket type
- **FR12:** Users can navigate from a parent ticket to its children and from a child to its parent
- **FR13:** Users can create tickets without assigning a parent — hierarchy linkages are optional

### Code Integration

- **FR14:** Users can add ObjectScript class references to any ticket
- **FR15:** Users can add ObjectScript method references to any ticket
- **FR16:** Users can view code references as structured fields separate from the free-text description

### Search & Navigation

- **FR17:** Users can view a list of all tickets across types
- **FR18:** Users can filter the ticket list by ticket type, status, priority, and assignee
- **FR19:** Users can sort the ticket list by any standard field
- **FR20:** Users can search tickets by text content (title, description)
- **FR21:** Users can view a ticket detail page showing all fields, hierarchy context, code references, and comments

### Collaboration & Activity

- **FR22:** Users can add comments to any ticket through the web UI
- **FR23:** AI agents can add comments to any ticket via MCP
- **FR24:** Users can view the full comment history and activity trail on a ticket
- **FR25:** Users can see the author (human user or AI agent) of each comment

### AI Agent Operations

- **FR26:** AI agents can create tickets via MCP
- **FR27:** AI agents can read full ticket details via MCP
- **FR28:** AI agents can update ticket fields (including status, assignee, and other fields) via MCP
- **FR29:** AI agents can list and filter tickets via MCP
- **FR30:** AI agents can close or complete tickets via MCP
- **FR31:** AI agents can query tickets by type, status, assignee, and other fields via MCP

### Installation & Configuration

- **FR32:** Administrators can install SpectraSight on an existing IRIS instance
- **FR33:** Administrators can configure authentication for API access
- **FR34:** Users can configure an MCP client to connect to the SpectraSight MCP server
- **FR35:** Users can test the MCP connection to verify it is working

## Non-Functional Requirements

### Performance

- Page load times for list views and ticket detail pages must be under 5 seconds
- REST API operations (CRUD, queries) must complete within 3 seconds under normal load
- MCP server operation response times must not exceed 150% of equivalent REST API response times
- System must handle up to 1,000 tickets while maintaining page load and API response time targets
- Text search and filtering operations must return results within the same page load time targets

### Security

- All REST API endpoints require IRIS authentication — no anonymous access to ticket data
- MCP server connections authenticate using IRIS credentials passed via server configuration
- API authentication uses IRIS's built-in user/password mechanism
- Ticket data is accessible only to authenticated users — no public endpoints

### Reliability

- Ticket data is persisted through IRIS's built-in storage engine with no data loss under normal operation
- System recovers automatically from IRIS instance restarts — service resumes without manual intervention within 60 seconds of IRIS becoming available
- Comment and activity data is persisted with the same reliability guarantees as ticket data
- REST API returns structured JSON error responses (HTTP status code, error code, human-readable message) for invalid operations rather than silent failures

### Integration

- MCP server achieves functional parity with REST API — every ticket operation available through REST is also available through MCP
- REST API uses standard JSON request/response format
- MCP server follows the standard MCP protocol specification for tool definitions
- Front end communicates with IRIS back end via standard HTTP REST calls

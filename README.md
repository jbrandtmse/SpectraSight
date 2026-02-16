# SpectraSight

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AI-powered ticket management built on **InterSystems IRIS**, **Angular**, and the **Model Context Protocol (MCP)**. SpectraSight lets both humans and AI agents manage tickets through the same REST API — the Angular SPA for humans, an MCP server for AI assistants like Claude.

<!-- ![SpectraSight screenshot](docs/screenshot.png) -->

## Architecture

```
┌─────────────┐     ┌─────────────┐
│  Angular SPA │     │  MCP Server │
│  (frontend/) │     │ (mcp-server/)│
└──────┬───────┘     └──────┬──────┘
       │                    │
       └────────┬───────────┘
                │ REST / JSON
        ┌───────▼────────┐
        │  IRIS REST API  │
        │    (src/)       │
        └───────┬─────────┘
                │
        ┌───────▼────────┐
        │  IRIS %Persistent│
        │   Data Layer    │
        └─────────────────┘
```

- **IRIS Backend** (`src/`) — ObjectScript classes: `%Persistent` ticket model (Bug, Task, Story, Epic), `%CSP.REST` dispatch, activity tracking, code references
- **Angular Frontend** (`frontend/`) — Angular 18 SPA with Angular Material, communicates with IRIS REST API
- **MCP Server** (`mcp-server/`) — TypeScript MCP server exposing ticket operations as tools for AI agents. See [mcp-server/README.md](mcp-server/README.md)
- **BMAD Framework** (`_bmad/`) — Build Method for AI-Driven Development workflow engine used to develop SpectraSight itself

## Prerequisites

- [InterSystems IRIS](https://www.intersystems.com/products/intersystems-iris/) (Community Edition or licensed)
- [Node.js](https://nodejs.org/) 18+
- [Angular CLI](https://angular.io/cli) (`npm install -g @angular/cli`)

## Quick Start

### 1. IRIS Backend

Import the ObjectScript classes from `src/` into your IRIS instance:

```objectscript
Do $SYSTEM.OBJ.LoadDir("/path/to/SpectraSight/src/", "ck", .errors, 1)
```

Run the setup utility to create the REST web application:

```objectscript
Do ##class(SpectraSight.Util.Setup).Install()
```

The REST API is now available at `http://localhost:52773/spectrasight/api/`.

### 2. Angular Frontend

```bash
cd frontend
npm install
ng serve
```

Open `http://localhost:4200`. The app proxies API requests to IRIS at `localhost:52773`.

### 3. MCP Server

```bash
cd mcp-server
npm install
npm run build
```

Add the server to your MCP client config (e.g., Claude Desktop). See [mcp-server/README.md](mcp-server/README.md) for full configuration details.

Copy `.mcp.json.example` to `.mcp.json` and fill in your IRIS credentials:

```bash
cp .mcp.json.example .mcp.json
```

## Project Structure

```
SpectraSight/
├── src/                    # IRIS ObjectScript backend
│   └── SpectraSight/
│       ├── Model/          # %Persistent ticket classes
│       ├── REST/           # %CSP.REST dispatch & handlers
│       ├── Util/           # Setup, validation, helpers
│       └── Test/           # %UnitTest classes
├── frontend/               # Angular SPA
├── mcp-server/             # MCP server (TypeScript)
├── _bmad/                  # BMAD development framework
├── _bmad-output/           # Generated planning & implementation artifacts
└── docs/                   # Project documentation
```

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

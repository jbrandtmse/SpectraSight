# Contributing to SpectraSight

Thanks for your interest in contributing! Here's how to get started.

## Development Environment

1. **InterSystems IRIS** — Install [IRIS Community Edition](https://www.intersystems.com/products/intersystems-iris/) or use a licensed instance
2. **Node.js 18+** — Required for the Angular frontend and MCP server
3. **Angular CLI** — `npm install -g @angular/cli`

### Setup

```bash
# Clone the repo
git clone https://github.com/jbrandtmse/SpectraSight.git
cd SpectraSight

# Frontend
cd frontend && npm install && cd ..

# MCP server
cd mcp-server && npm install && npm run build && cd ..

# IRIS backend — import classes into your IRIS instance
# Then run: Do ##class(SpectraSight.Util.Setup).Install()
```

Copy `.mcp.json.example` to `.mcp.json` and add your IRIS credentials.

## Coding Standards

- **ObjectScript**: See `docs/context.md` for naming conventions, error handling patterns, and REST guidelines
- **TypeScript/Angular**: Follow the existing patterns in `frontend/` and `mcp-server/`
- Keep ObjectScript classes under 700 lines

## Pull Request Process

1. Fork the repository and create a feature branch from `main`
2. Make your changes with clear, focused commits
3. Ensure IRIS unit tests pass (`Do ##class(SpectraSight.Test.Runner).RunAll()`)
4. Ensure MCP server tests pass (`cd mcp-server && npm test`)
5. Open a PR against `main` with a description of what and why

## Reporting Issues

Open an issue on [GitHub Issues](https://github.com/jbrandtmse/SpectraSight/issues) with:
- Steps to reproduce
- Expected vs actual behavior
- IRIS version and environment details

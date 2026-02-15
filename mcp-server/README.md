# SpectraSight MCP Server

An MCP (Model Context Protocol) server that exposes SpectraSight ticket management operations as tools for AI agents. This allows AI assistants like Claude to create, read, update, and delete tickets autonomously through the MCP protocol.

## Prerequisites

- **Node.js** 18 or later
- **InterSystems IRIS** with the SpectraSight REST API deployed and running

## Building

```bash
cd mcp-server
npm install
npm run build
```

This compiles the TypeScript source into JavaScript in the `build/` directory.

## Configuration

The server is configured via environment variables:

| Variable | Description | Default |
|---|---|---|
| `SPECTRASIGHT_URL` | Base URL for the IRIS REST API | `http://localhost:52773` |
| `SPECTRASIGHT_USERNAME` | IRIS username for Basic Auth | `_SYSTEM` |
| `SPECTRASIGHT_PASSWORD` | IRIS password for Basic Auth | `SYS` |

If any variable is not set, the server logs a warning to stderr and uses the default value.

## MCP Client Configuration

Add the following to your MCP client configuration file. For Claude Desktop, edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "spectrasight": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/build/index.js"],
      "env": {
        "SPECTRASIGHT_URL": "http://localhost:52773",
        "SPECTRASIGHT_USERNAME": "_SYSTEM",
        "SPECTRASIGHT_PASSWORD": "SYS"
      }
    }
  }
}
```

Replace `/absolute/path/to/mcp-server/build/index.js` with the actual absolute path to the built `index.js` file on your system.

## Testing the Connection

After configuring the MCP client, call the `test_connection` tool to verify your setup:

```
test_connection
```

On success you will see:
```
Connected to SpectraSight API at http://localhost:52773 — 42 tickets found. All 7 tools available.
```

On failure, the error message will indicate the specific problem (connection refused, authentication failed, etc.) and what to check.

## Available Tools

| Tool | Description |
|---|---|
| `create_ticket` | Create a new ticket with title, type, description, status, priority, assignee, and parent ID |
| `get_ticket` | Get full details of a ticket by its ID (e.g., SS-42) |
| `update_ticket` | Update an existing ticket's title, description, status, priority, or assignee |
| `delete_ticket` | Delete a ticket by its ID |
| `list_tickets` | List tickets with optional filtering by type, status, priority, assignee, search, sorting, and pagination |
| `add_comment` | Add a comment to a ticket |
| `test_connection` | Test the connection to the SpectraSight API and verify credentials |

## Troubleshooting

### Connection Refused

```
Error [CONNECTION_ERROR]: Cannot connect to SpectraSight API at http://localhost:52773 — connection refused. Is IRIS running?
```

**Cause:** The IRIS instance is not running or not reachable at the configured URL.

**Fix:**
1. Verify IRIS is running
2. Check `SPECTRASIGHT_URL` is correct (default: `http://localhost:52773`)
3. Check for firewall rules blocking the port

### Authentication Failed

```
Error [AUTH_FAILED]: Authentication failed for http://localhost:52773 — check SPECTRASIGHT_USERNAME and SPECTRASIGHT_PASSWORD
```

**Cause:** The username or password is incorrect.

**Fix:**
1. Verify `SPECTRASIGHT_USERNAME` and `SPECTRASIGHT_PASSWORD` are correct
2. Default credentials are `_SYSTEM` / `SYS`

### Access Denied

```
Error [AUTH_FORBIDDEN]: Access denied at http://localhost:52773 — insufficient permissions for this operation
```

**Cause:** The user account does not have sufficient privileges.

**Fix:**
1. Use an IRIS account with appropriate permissions for the SpectraSight REST API

### Cannot Reach Host

```
Error [CONNECTION_ERROR]: Cannot reach SpectraSight API at http://badhost:52773 — check SPECTRASIGHT_URL
```

**Cause:** DNS resolution failed or the host timed out.

**Fix:**
1. Verify `SPECTRASIGHT_URL` contains a valid, reachable hostname
2. Check network connectivity to the target host

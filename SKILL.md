---
name: lithium-kb
description: Generates, maintains, and visualizes a structured Markdown knowledge base (.agent-kb/{architecture,debug,tasks,features}) with an interactive Neural Network graph, auto-watch mode, custom agent directives (.agentrules), and MCP server integration for Pi, Claude, Codex, Cursor, and other coding agents.
---

# Structured Agent Knowledge Base (lithium-kb)

`lithium-kb` establishes a modular, highly organized knowledge hierarchy (`.agent-kb/`) paired with `PROJECT_KB.md`, an interactive **Neural Network Graph**, **MCP Server**, and **Live File Watcher**.

## Structured Knowledge Base Hierarchy

```text
your-project/
├── .agent-kb/
│   ├── architecture/
│   │   └── 1.overview.md          # Topology, entry points, service boundaries
│   ├── debug/
│   │   ├── 1.debug-quickstart.md  # Solved issues & root-cause postmortems
│   │   └── ...
│   ├── tasks/
│   │   ├── 1.task-initial-setup.md # Active backlog & task specs
│   │   └── ...
│   └── features/
│       ├── 1.feature-spec.md      # Detailed feature specifications
│       └── ...
└── PROJECT_KB.md                  # Compact global in-memory index (< 2KB)
```

## How Agents Use This

1. **Orientation**: When starting work in a repo, read `PROJECT_KB.md` into context.
2. **Modular Deep Dives**: When assigned a task or bug, read *only* `.agent-kb/tasks/N.<name>.md` or `.agent-kb/debug/N.<name>.md` instead of the whole codebase.
3. **Persisting Knowledge**:
   - Fixed a bug? Save the postmortem to `.agent-kb/debug/N.<name>.md`.
   - Building a feature? Check `.agent-kb/features/N.<name>.md`.
   - Completed a task? Mark status in `.agent-kb/tasks/N.<name>.md`.

## Commands

```bash
# Auto-configure MCP for Cursor, Claude, Windsurf, Zed, and VS Code
npx @liulinnuha/lithium-kb init

# Generate / sync structured knowledge base
npx @liulinnuha/lithium-kb

# Open Neural Graph Web UI (port 3030)
npx @liulinnuha/lithium-kb --ui

# Auto-update knowledge base on file changes
npx @liulinnuha/lithium-kb --watch

# Start MCP stdio server for Claude Desktop / Cursor / Pi
npx @liulinnuha/lithium-kb --mcp
```

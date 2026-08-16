# ⚡ lithium-kb: Structured Agent Knowledge Base & Neural Graph

[![npm version](https://img.shields.io/npm/v/%40liulinnuha%2Flithium-kb.svg?color=cb3837&logo=npm)](https://www.npmjs.com/package/@liulinnuha/lithium-kb)
[![GitHub Packages](https://img.shields.io/badge/GitHub%20Packages-%40liulinnuha%2Flithium--kb-blue.svg?logo=github)](https://github.com/liulinnuha/lithium-kb/packages)
[![GitHub](https://img.shields.io/badge/GitHub-liulinnuha%2Flithium--kb-181717.svg?logo=github)](https://github.com/liulinnuha/lithium-kb)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-blue.svg)](package.json)
[![MCP Compatible](https://img.shields.io/badge/MCP-JSON--RPC%202.0-purple.svg)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-performance structured project knowledge base generator, neural network memory visualizer, and Model Context Protocol (MCP) server for AI coding agents (**Pi**, **Claude**, **Codex**, **Cursor**, **Windsurf**).

---

## 📁 Structured Knowledge Hierarchy

Whenever `lithium-kb` is run, it organizes project memory into dedicated, modular knowledge categories:

```text
your-project/
├── .agent-kb/
│   ├── architecture/
│   │   └── 1.overview.md          # Topology, entry points, service boundaries
│   ├── debug/
│   │   ├── 1.debug-quickstart.md  # Resolved incidents & root-cause postmortems
│   │   └── ...
│   ├── tasks/
│   │   ├── 1.task-initial-setup.md # Active sprint tasks & acceptance criteria
│   │   └── ...
│   └── features/
│       ├── 1.feature-spec.md      # Detailed feature specifications
│       └── ...
└── PROJECT_KB.md                  # Compact global index (< 2KB)
```

---

## ⚡ Why Structured Knowledge Matters

1. **Surgical Token Efficiency**: When an agent works on a bug or task, it reads *only* `.agent-kb/tasks/N.<name>.md` or `.agent-kb/debug/N.<name>.md` instead of blindly traversing thousands of codebase lines.
2. **Deterministic Context**: Agents don't lose track of multi-step plans across sessions.
3. **Interactive Neural Visualizer**: Observe live memory hits, dynamic impulse animations, and token savings as agents query knowledge nodes.
4. **Zero Dependencies**: Pure Node.js standard library — zero install footprint, lightning fast.

---

## 📦 Installation & Quickstart

### 🚀 1-Command Setup (Auto-Configure All Agents & Editors)
Run this inside any project repository to initialize the knowledge structure and automatically configure MCP for **Cursor**, **Claude Desktop**, **Windsurf**, **Zed**, and **VS Code (Cline / Roo Code)**:

```bash
npx @liulinnuha/lithium-kb init
```

---

### Additional Commands

```bash
# Generate / Sync knowledge base (.agent-kb/ and PROJECT_KB.md)
npx @liulinnuha/lithium-kb

# Open Neural Graph Web UI (port 3030)
npx @liulinnuha/lithium-kb --ui

# Auto-watch for file changes and sync live
npx @liulinnuha/lithium-kb --watch

# Launch MCP stdio server manually
npx @liulinnuha/lithium-kb --mcp
```

### Method 2: Global CLI Installation
Install globally on your machine to use `lithium-kb` anywhere:
```bash
npm install -g @liulinnuha/lithium-kb

# Then run anywhere:
lithium-kb --ui
```

---

## 🔌 Agent MCP Integration (Claude Desktop, Cursor, Pi)

Add this to your Claude Desktop config (`claude_desktop_config.json`) or Cursor MCP settings:

```json
{
  "mcpServers": {
    "lithium-kb": {
      "command": "npx",
      "args": ["-y", "@liulinnuha/lithium-kb", "--mcp"]
    }
  }
}
```

---

## 📜 MCP Tools Exposed

| Tool | Purpose |
| :--- | :--- |
| `get_project_memory` | Return compact architecture & symbol index (< 2KB). |
| `read_knowledge_doc` | Read targeted doc from `.agent-kb/` (`category`, `filename`). |
| `write_knowledge_doc` | Persist new task note, debug postmortem, or feature spec. |
| `query_symbol_map` | Search exported functions, classes, and types across the repo. |

---

## 📄 License
MIT © [Moch Ulin Nuha](https://github.com/liulinnuha)

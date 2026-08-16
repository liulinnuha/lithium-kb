# Contributing to `lithium-kb`

Thank you for your interest in contributing to **`lithium-kb`**! This project provides AI coding agents (Claude, Cursor, Windsurf, Zed, Pi, Roo Code, Cline) with a fast, zero-dependency in-memory knowledge graph and MCP server to eliminate context waste and maximize reasoning speed.

---

## 🏗️ Architecture Overview

The codebase is strictly structured for zero-dependency modularity, high performance, and ease of maintenance:

```text
lithium-kb/
├── bin/
│   └── cli.js               # CLI runner (handles init, --ui, --watch, --mcp)
├── src/
│   ├── core/
│   │   ├── constants.js     # Default ignore patterns, categories, limits
│   │   ├── scanner.js       # Directory crawler, stack detection, symbol AST parsing
│   │   ├── generator.js     # Knowledge base markdown & graph topology generator
│   │   ├── initializer.js   # 1-command auto-configuration for editors & agents
│   │   └── types.d.ts       # TypeScript type definitions
│   ├── server/
│   │   ├── http.js          # HTTP server & REST endpoints (/api/kb, /api/doc, /api/access)
│   │   ├── sse.js           # Server-Sent Events broker for live agent activity stream
│   │   └── watcher.js       # Debounced recursive file system watcher
│   ├── mcp/
│   │   └── server.js        # Model Context Protocol (MCP) JSON-RPC 2.0 stdio server
│   └── ui/
│       ├── index.html       # Web UI layout & accessibility tree
│       ├── styles.css       # Dark-mode neural network styles & animations
│       └── app.js           # Canvas force-directed physics, zoom/pan & SSE stream handler
└── test/
    ├── scanner.test.js      # Unit tests for codebase scanner & symbol extraction
    ├── generator.test.js    # Unit tests for knowledge base markdown & graph generation
    ├── initializer.test.js  # Unit tests for 1-command init across editors & home dir safety
    ├── http.test.js         # Integration tests for HTTP & SSE endpoints
    └── mcp.test.js          # Integration tests for JSON-RPC 2.0 MCP tools & protocol
```

---

## 🛠️ Development Workflow

### 1. Prerequisites
- **Node.js 18.0.0 or higher**.
- **Zero external dependencies required!** (We use only standard library modules `node:http`, `node:fs`, `node:path`, `node:test`, `node:child_process`, etc.)

### 2. Running Tests
We use Node's native test runner (`node:test`):
```bash
# Run full test suite (14+ automated tests)
npm test
```

### 3. Local CLI Commands
```bash
# 1. Test 1-command agent auto-configuration
node bin/cli.js init

# 2. Generate knowledge base for local directory
npm run generate  # or node bin/cli.js

# 3. Launch Neural Network Web UI at http://localhost:3030
npm start         # or node bin/cli.js --ui

# 4. Start background live file watcher
npm run watch     # or node bin/cli.js --watch

# 5. Test MCP stdio server
npm run mcp       # or node bin/cli.js --mcp
```

---

## 💡 How to Add New Features

### 1. Adding Editor & Agent Auto-Configuration
To add support for auto-configuring a new coding agent or editor in `init`:
1. Open `src/core/initializer.js`.
2. Add the platform-specific configuration path in `getGlobalAgentConfigs()` or `getProjectAgentConfigs()`.
3. Add a test case in `test/initializer.test.js`.

### 2. Adding Language Symbol AST Parsers
To support export symbol extraction for new languages (e.g. Kotlin, Rust, Go, Swift, Elixir):
1. Open `src/core/scanner.js`.
2. Add the parser regex in `extractKeySymbols()`.
3. Add a test case in `test/scanner.test.js`.

### 3. Adding New MCP Tools
To expose new capabilities to AI coding agents:
1. Open `src/mcp/server.js`.
2. Define the tool schema under `tools/list` handler.
3. Implement the tool handler in the `tools/call` switch-case.
4. Add integration test verification in `test/mcp.test.js`.

### 4. Improving the Web UI
1. Frontend code lives in `src/ui/`:
   - `index.html`: Semantic layout, accessibility labels, modal shortcuts (`?`).
   - `styles.css`: Dark neural network visual styles, responsive design, focus outlines.
   - `app.js`: 2D Canvas force-directed graph, zoom/pan wheel math, node search, SSE stream handler.
2. Changes to `src/ui/` take effect immediately on browser refresh.

---

## 🤝 Contribution Guidelines

1. **Zero Runtime Dependencies**: Keep `dependencies: {}` strictly empty in `package.json`. Always utilize Node.js built-ins (`node:*`).
2. **Deterministic Output**: Do not introduce dynamic timestamps or dynamic session headers in generated markdown files to prevent unnecessary git diff noise.
3. **Comprehensive Tests**: Every new feature or bug fix must include a test under `test/` running on `node --test`.
4. **Follow Conventional Commits**:
   - `feat: add Kotlin symbol parsing to scanner`
   - `fix: sanitize path traversal in /api/doc endpoint`
   - `docs: update MCP setup for new editor agent`
5. **Submit a PR**: Open a pull request at [github.com/liulinnuha/lithium-kb/pulls](https://github.com/liulinnuha/lithium-kb/pulls). For bug reports or feature ideas, open an issue at [github.com/liulinnuha/lithium-kb/issues](https://github.com/liulinnuha/lithium-kb/issues).

---

## 📄 License
MIT © [Moch Ulin Nuha](https://github.com/liulinnuha)

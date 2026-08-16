# Contributing to `lithium-kb`

Thank you for your interest in contributing! This project aims to provide coding agents (Pi, Claude, Cursor, Codex) with a fast, zero-dependency in-memory knowledge graph to eliminate context waste and maximize speed.

---

## 🏗️ Architecture Overview

The codebase is strictly structured for modularity and maintainability:

```text
lithium-kb/
├── bin/
│   └── agent-kb.js          # CLI executable runner
├── src/
│   ├── core/
│   │   ├── constants.js     # Default ignore paths, categories, limits
│   │   ├── scanner.js       # Directory crawler, stack detection, symbol AST parsing
│   │   ├── generator.js     # Knowledge base markdown & graph topology generator
│   │   └── types.d.ts       # TypeScript definitions
│   ├── server/
│   │   ├── http.js          # HTTP server & REST endpoints
│   │   ├── sse.js           # Server-Sent Events broker for live agent activity
│   │   └── watcher.js       # Debounced file system watcher
│   ├── mcp/
│   │   └── server.js        # Model Context Protocol (MCP) JSON-RPC 2.0 stdio server
│   └── ui/
│       ├── index.html       # Web UI layout
│       ├── styles.css       # Dark-mode neural network styles
│       └── app.js           # 2D Canvas force-directed physics & SSE stream handler
├── test/
│   ├── scanner.test.js      # Unit tests for scanner
│   ├── generator.test.js    # Unit tests for generator
│   └── http.test.js         # Integration tests for HTTP & SSE
└── .agent-kb/               # Knowledge base for this project
```

---

## 🛠️ Development Workflow

### 1. Prerequisites
- Node.js 18.0.0 or higher.
- **Zero dependencies required!** (We use only standard library modules `node:http`, `node:fs`, `node:path`, etc.)

### 2. Running Tests
We use Node's native test runner (`node:test`):
```bash
# Run test suite once
npm test

# Run tests in watch mode
npm run test:watch
```

### 3. Local Development
```bash
# Generate knowledge base for local directory
npm run generate

# Launch the Web UI at http://localhost:3030
npm run ui

# Start background file watcher
npm run watch

# Test MCP stdio server
npm run mcp
```

---

## 💡 How to Add New Features

### Adding Language AST Parsers
To support export symbol extraction for new languages (e.g. C#, Swift, Elixir):
1. Open `src/core/scanner.js`.
2. Update regex match in `extractKeySymbols()`.
3. Add a test case in `test/scanner.test.js`.

### Improving the Web UI
1. Frontend code is cleanly separated in `src/ui/`:
   - `index.html`: Structure & DOM layout.
   - `styles.css`: Visual styling & animations.
   - `app.js`: Canvas physics, event handling, and SSE subscriptions.
2. Changes to `src/ui/` take effect immediately on server restart or reload.

---

## 🤝 Contribution Guidelines

1. **Zero Runtime Dependencies**: Keep `dependencies: {}` empty in `package.json`. Standard library first!
2. **Write Tests**: Every new feature or bug fix should include a test under `test/`.
3. **Run `npm test`** before creating a Pull Request.
4. **Follow Semantic Commit Messages**:
   - `feat: add Elixir symbol parsing`
   - `fix: handle symlink recursion in scanTree`
   - `docs: update MCP setup guide`

---

## 📄 License
MIT License

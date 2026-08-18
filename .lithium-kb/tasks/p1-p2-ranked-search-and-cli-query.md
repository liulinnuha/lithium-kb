# P1 & P2 Ranked Search, Graph Associative Linking & CLI Query

- **Status:** Complete
- **Goal:** Provide weighted in-memory document & section search, associative markdown link extraction in neural graph, and direct CLI query command.
- **Scope:**
  1. Implement `searchKnowledgeBase()` with weighted title/heading scoring and section snippet extraction.
  2. Register `search_knowledge_base` MCP tool in stdio server with real-time SSE query broadcast.
  3. Support `npx @liulinnuha/lithium-kb query <terms>` for terminal retrieval without UI.
  4. Parse cross-references and links in `.lithium-kb/**/*.md` inside `buildNeuralGraphData()` to connect doc nodes to codebase nodes.
  5. Add test coverage for ranked search and MCP search tool.

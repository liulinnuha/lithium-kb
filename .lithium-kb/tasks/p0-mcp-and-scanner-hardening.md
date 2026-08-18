# P0 MCP Protocol Standards & Ingestion Hardening

- **Status:** Complete
- **Goal:** Harden project tree ingestion with standard `.gitignore` support and align MCP server with JSON-RPC 2.0 capabilities for tools and resources.
- **Scope:**
  1. Parse `.gitignore` alongside `.agentignore` in `scanner.js` to prevent untracked artifacts from polluting the knowledge base.
  2. Implement MCP `resources/list` and `resources/read` endpoints to expose structured knowledge documents as addressable resources.
  3. Standardize MCP tool execution errors using `{ isError: true, content: [...] }`.
  4. Expose `list_knowledge_docs` in `tools/list` schema for agent discovery.
  5. Add automated unit test coverage for MCP resources and ignore ingestion.

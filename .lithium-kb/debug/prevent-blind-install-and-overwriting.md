# Prevent Blind Config Installation and File Overwriting

- **Issue:** Running `init lithium-kb` unconditionally created `.cursor/mcp.json`, `.cursorrules`, `CLAUDE.md`, and `.windsurfrules` regardless of the user's active editor, cluttering workspaces. In addition, existing config/rule files risked being overwritten or corrupted if JSON parsing failed.
- **Root Cause:**
  1. `initializeProject` blindly wrote all 4 rule files and injected `.cursor/mcp.json` into every project workspace.
  2. `readJsonSafe` returned `{}` on JSON parse failures, causing `writeJsonSafe` to overwrite user configuration files on malformed or commented JSON.
- **Resolution:**
  1. Implemented environment and workspace detection (`detectEnvironmentAgents`) targeting Cursor, Claude, Windsurf, VS Code, Zed, and Pi.
  2. Scoped file generation to only detected agents (falling back to `.agentrules` if no specific IDE is active).
  3. Added non-overwriting guarantees for all rule files, `PROJECT_KB.md`, and starter markdown docs.
  4. Added safe JSON reading and non-destructive merging for MCP config targets.

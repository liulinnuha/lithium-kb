#!/usr/bin/env node
import path from 'node:path';
import { generateMarkdownKB } from '../src/core/generator.js';
import { startServer } from '../src/server/http.js';
import { startFileWatcher } from '../src/server/watcher.js';
import { startMcpServer } from '../src/mcp/server.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

const isUiMode = args.includes('--ui') || args.includes('-u') || args.includes('ui') || args.includes('--serve');
const isWatchMode = args.includes('--watch') || args.includes('-w');
const isMcpMode = args.includes('--mcp');
const isHelpMode = args.includes('--help') || args.includes('-h');

if (isHelpMode) {
  console.log(`
🧠 lithium-kb — Fast In-Memory Markdown Knowledge Base & Neural Graph

Usage:
  npx lithium-kb           Generate/sync .agent-kb/ and PROJECT_KB.md
  npx lithium-kb --ui      Start real-time Neural Network Web UI
  npx lithium-kb --watch   Auto-update knowledge base on file changes
  npx lithium-kb --mcp     Start stdio Model Context Protocol (MCP) server

Options:
  --port=<num>             Port for Web UI (default: 3030)
  --help, -h               Show this help message
`);
  process.exit(0);
}

if (isMcpMode) {
  startMcpServer(cwd);
} else {
  const data = generateMarkdownKB(cwd);
  const outputPath = path.join(cwd, 'PROJECT_KB.md');
  console.log(`[lithium-kb] Generated ${outputPath} & structured .agent-kb/ (${data.markdown.length} bytes)`);

  if (isWatchMode) {
    startFileWatcher(cwd);
  }

  if (isUiMode) {
    const portArg = args.find(a => a.startsWith('--port='));
    const port = portArg ? parseInt(portArg.split('=')[1], 10) : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3030);
    startServer(cwd, port);
  } else if (!isWatchMode) {
    console.log(`💡 Options: --ui (Web Graph UI), --watch (Auto-update on file change), --mcp (MCP stdio server)`);
  }
}

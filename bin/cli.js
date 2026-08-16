#!/usr/bin/env node
import path from 'node:path';
import { generateMarkdownKB } from '../src/core/generator.js';
import { initializeProject } from '../src/core/initializer.js';
import { startServer } from '../src/server/http.js';
import { startFileWatcher } from '../src/server/watcher.js';
import { startMcpServer } from '../src/mcp/server.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

const isInitMode = args.includes('init') || args.includes('--init');
const isUiMode = args.includes('--ui') || args.includes('-u') || args.includes('ui') || args.includes('--serve');
const isWatchMode = args.includes('--watch') || args.includes('-w');
const isMcpMode = args.includes('--mcp');
const isHelpMode = args.includes('--help') || args.includes('-h');

if (isHelpMode) {
  console.log(`
⚡ lithium-kb — Fast Structured Markdown Knowledge Base, Neural Graph & MCP

Usage:
  npx @liulinnuha/lithium-kb init       Auto-configure MCP for Cursor, Claude, Windsurf, Zed, VS Code
  npx @liulinnuha/lithium-kb            Generate/sync .agent-kb/ and PROJECT_KB.md
  npx @liulinnuha/lithium-kb --ui       Start real-time Neural Network Web UI
  npx @liulinnuha/lithium-kb --watch    Auto-update knowledge base on file changes
  npx @liulinnuha/lithium-kb --mcp      Start stdio Model Context Protocol (MCP) server

Options:
  --port=<num>                          Port for Web UI (default: 3030)
  --help, -h                            Show this help message
`);
  process.exit(0);
}

if (isInitMode) {
  console.log(`⚡ [lithium-kb] Auto-configuring project & AI agent environments...\n`);
  const res = initializeProject(cwd);

  if (res.kbInitialized) {
    console.log(`✔ Initialized structured knowledge base (.agent-kb/ & PROJECT_KB.md)`);
  }
  if (res.agentRulesCreated) {
    console.log(`✔ Created .agentrules (Agent navigation directives)`);
  }

  if (res.configuredTargets.length > 0) {
    console.log(`\n✔ Configured MCP for detected editors & agents:`);
    for (const target of res.configuredTargets) {
      console.log(`  • ${target.name}: ${target.path}`);
    }
  } else {
    console.log(`\n✔ Configured project-level MCP: .cursor/mcp.json`);
  }

  console.log(`\n🚀 Setup complete! Your coding agents and editors can now interact with lithium-kb via MCP.`);
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
    console.log(`💡 Options: init (Auto-config agents), --ui (Web Graph UI), --watch (Auto-update), --mcp (MCP server)`);
  }
}

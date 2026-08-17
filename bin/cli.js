#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import { generateMarkdownKB } from '../src/core/generator.js';
import { initializeProject, uninstallProject, isHomeOrRootDir } from '../src/core/initializer.js';
import { startServer } from '../src/server/http.js';
import { startFileWatcher } from '../src/server/watcher.js';
import { startMcpServer } from '../src/mcp/server.js';

const cwd = process.cwd();
const isHome = isHomeOrRootDir(cwd);
const args = process.argv.slice(2);

const isInitMode = args.includes('init') || args.includes('--init');
const isUninstallMode = args.includes('uninstall') || args.includes('--uninstall') || args.includes('clean');
const isCleanFiles = args.includes('--purge') || args.includes('--all') || args.includes('--clean-files');
const isUiMode = args.includes('--ui') || args.includes('-u') || args.includes('ui') || args.includes('--serve');
const isWatchMode = args.includes('--watch') || args.includes('-w');
const isMcpMode = args.includes('--mcp');
const isHelpMode = args.includes('--help') || args.includes('-h');
const pathArg = args.find(a => a.startsWith('--path='));
const targetDir = pathArg ? path.resolve(pathArg.split('=')[1]) : cwd;

if (isHelpMode) {
  console.log(`
⚡ lithium-kb — Fast Structured Markdown Knowledge Base, Neural Graph & MCP

Usage:
  npx @liulinnuha/lithium-kb init          Auto-configure MCP for Cursor, Claude, Windsurf, Zed, VS Code
  npx @liulinnuha/lithium-kb               Generate/sync .agent-kb/ and PROJECT_KB.md
  npx @liulinnuha/lithium-kb --ui          Start real-time Neural Network Web UI
  npx @liulinnuha/lithium-kb --watch       Auto-update knowledge base on file changes
  npx @liulinnuha/lithium-kb --mcp         Start stdio Model Context Protocol (MCP) server
  npx @liulinnuha/lithium-kb uninstall     Remove MCP configs & legacy agent-kb references
  npx @liulinnuha/lithium-kb uninstall --purge   Remove MCP configs AND project .agent-kb/ + PROJECT_KB.md

Options:
  --port=<num>                             Port for Web UI (default: 3030)
  --purge, --all                           Clean local .agent-kb files during uninstall
  --help, -h                               Show this help message
`);
  process.exit(0);
}

if (isUninstallMode) {
  console.log(`⚡ [lithium-kb] Uninstaller: Cleaning configurations and legacy references...\n`);
  const res = uninstallProject(cwd, isCleanFiles);

  if (res.cleanedTargets.length > 0) {
    console.log(`✔ Cleaned MCP configs in detected editors:`);
    for (const target of res.cleanedTargets) {
      console.log(`  • ${target.name}: ${target.path}`);
    }
  } else {
    console.log(`ℹ No editor MCP configurations found to clean.`);
  }

  if (res.uninstalledSkills.length > 0) {
    console.log(`\n✔ Removed agent skills:`);
    for (const skill of res.uninstalledSkills) {
      console.log(`  • ${skill}`);
    }
  }

  if (res.removedFiles.length > 0) {
    console.log(`\n✔ Purged local project knowledge base files:`);
    for (const f of res.removedFiles) {
      console.log(`  • ${f}`);
    }
  }

  console.log(`\n🧹 Uninstallation complete!`);
  process.exit(0);
}

if (isInitMode) {
  console.log(`⚡ [lithium-kb] Auto-configuring project & AI agent environments...\n`);
  const res = initializeProject(cwd);

  if (res.isHomeDir) {
    console.log(`ℹ Detected home/root directory (~): Skipped local knowledge base creation.`);
  } else {
    if (res.kbInitialized) {
      console.log(`✔ Initialized structured knowledge base (.agent-kb/ & PROJECT_KB.md)`);
    }
    if (res.agentRulesCreated) {
      console.log(`✔ Created .agentrules (Agent navigation directives)`);
    }
  }

  if (res.configuredTargets.length > 0) {
    console.log(`\n✔ Configured MCP for detected editors & agents:`);
    for (const target of res.configuredTargets) {
      console.log(`  • ${target.name}: ${target.path}`);
    }
  } else if (!res.isHomeDir) {
    console.log(`\n✔ Configured project-level MCP: .cursor/mcp.json`);
  }

  console.log(`\n🚀 Setup complete! Your coding agents and editors can now interact with lithium-kb via MCP.`);
  process.exit(0);
}

if (isMcpMode) {
  startMcpServer(cwd);
} else {
  // Hard prevent generating/syncing in HOME or ROOT unless in UI mode
  if (isHome && !isUiMode) {
    console.log(`ℹ Detected home/root directory (~): Skipped local knowledge base operation.`);
    console.log(`💡 Navigate to a project directory before running lithium-kb.`);
    process.exit(0);
  }

  const kbExists = fs.existsSync(path.join(cwd, '.lithium-kb')) || fs.existsSync(path.join(cwd, '.agent-kb')) || fs.existsSync(path.join(cwd, 'PROJECT_KB.md'));

  if (!kbExists && !isUiMode) {
    console.log(`ℹ No structured knowledge base (.lithium-kb/) found in: ${cwd}`);
    console.log(`💡 Run 'npx @liulinnuha/lithium-kb init' to initialize this project.`);
    process.exit(0);
  }

  if (isUiMode) {
    const portArg = args.find(a => a.startsWith('--port='));
    const port = portArg ? parseInt(portArg.split('=')[1], 10) : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3030);
    startServer(targetDir, port);
  } else {
    const data = generateMarkdownKB(cwd, true);
    const outputPath = path.join(cwd, 'PROJECT_KB.md');
    console.log(`[lithium-kb] Synchronized ${outputPath} & knowledge base (${data.markdown.length} bytes)`);

    if (isWatchMode) {
      startFileWatcher(cwd);
    } else {
      console.log(`💡 Options: init (Auto-config agents), --ui (Web Graph UI), --watch (Auto-update), --mcp (MCP server)`);
    }
  }
}

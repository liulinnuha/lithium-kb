import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { KB_DIR_NAME, KB_CATEGORIES } from './constants.js';
import {
  detectProjectType,
  getPackageScripts,
  getCustomAgentRules,
  scanTree,
  extractKeySymbols
} from './scanner.js';

/**
 * Ensures standard knowledge folders (.agent-kb/{architecture,debug,tasks,features}) exist.
 * @param {string} cwd
 * @returns {string}
 */
export function ensureKnowledgeBaseStructure(cwd) {
  const kbRoot = path.join(cwd, KB_DIR_NAME);

  for (const cat of KB_CATEGORIES) {
    const dir = path.join(kbRoot, cat);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Create starter docs only if directory is empty
  const archDir = path.join(kbRoot, 'architecture');
  if (fs.readdirSync(archDir).length === 0) {
    fs.writeFileSync(
      path.join(archDir, '1.overview.md'),
      `# Architecture Overview\n\n- **Project:** ${path.basename(cwd)}\n- **Role:** High-level system structure, entrypoints, and communication contracts.\n`,
      'utf8'
    );
  }

  const taskDir = path.join(kbRoot, 'tasks');
  if (fs.readdirSync(taskDir).length === 0) {
    fs.writeFileSync(
      path.join(taskDir, '1.task-initial-setup.md'),
      `# Task 1: Project Setup\n\n- **Status:** Complete\n- **Goal:** Initialize project structure and baseline modules.\n`,
      'utf8'
    );
  }

  const debugDir = path.join(kbRoot, 'debug');
  if (fs.readdirSync(debugDir).length === 0) {
    fs.writeFileSync(
      path.join(debugDir, '1.debug-quickstart.md'),
      `# Debug 1: Quickstart Diagnostics\n\n- **Issue:** Token bloat during multi-file repository exploration.\n- **Resolution:** Route agents to in-memory .agent-kb/ directory map.\n`,
      'utf8'
    );
  }

  const featDir = path.join(kbRoot, 'features');
  if (fs.readdirSync(featDir).length === 0) {
    fs.writeFileSync(
      path.join(featDir, '1.feature-spec.md'),
      `# Feature 1: Core Feature Specification\n\n- **Status:** Active\n- **Description:** Core requirements and user workflows.\n`,
      'utf8'
    );
  }

  return kbRoot;
}

/**
 * Scans all structured markdown files inside .agent-kb/
 * @param {string} cwd
 * @returns {Record<string, Array>}
 */
export function scanStructuredKnowledgeDocs(cwd) {
  const kbRoot = path.join(cwd, KB_DIR_NAME);
  if (!fs.existsSync(kbRoot)) ensureKnowledgeBaseStructure(cwd);

  const result = {};
  for (const cat of KB_CATEGORIES) {
    const dir = path.join(kbRoot, cat);
    result[cat] = [];
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const relPath = path.relative(cwd, fullPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const firstLine = content.split('\n').find(l => l.startsWith('#')) || file;
        const title = firstLine.replace(/^#+\s*/, '').trim();
        result[cat].push({
          category: cat,
          filename: file,
          relPath,
          title,
          content,
          size: fs.statSync(fullPath).size
        });
      }
    }
  }
  return result;
}

/**
 * Builds nodes and links for the 2D force-directed neural graph.
 * @param {string} cwd
 * @returns {{ nodes: Array, links: Array }}
 */
export function buildNeuralGraphData(cwd) {
  const pkgInfo = getPackageScripts(cwd);
  const rootName = pkgInfo?.name || path.basename(path.resolve(cwd));
  const docs = scanStructuredKnowledgeDocs(cwd);
  const items = scanTree(cwd, cwd);
  const files = items.filter(i => i.type === 'file' && !i.path.startsWith(KB_DIR_NAME));

  const nodes = [
    { id: 'node-root', label: `Agent Core (${rootName})`, group: 'core', val: 28, color: '#38bdf8' },
    { id: 'cat-arch', label: '📁 architecture/', group: 'category', val: 20, color: '#818cf8' },
    { id: 'cat-tasks', label: '📋 tasks/', group: 'category', val: 20, color: '#10b981' },
    { id: 'cat-debug', label: '🐛 debug/', group: 'category', val: 20, color: '#f59e0b' },
    { id: 'cat-features', label: '✨ features/', group: 'category', val: 20, color: '#ec4899' },
    { id: 'cat-code', label: '💻 codebase/', group: 'category', val: 18, color: '#06b6d4' }
  ];

  const links = [
    { source: 'node-root', target: 'cat-arch' },
    { source: 'node-root', target: 'cat-tasks' },
    { source: 'node-root', target: 'cat-debug' },
    { source: 'node-root', target: 'cat-features' },
    { source: 'node-root', target: 'cat-code' }
  ];

  const categoryMap = {
    architecture: { parent: 'cat-arch', color: '#a5b4fc', prefix: 'doc-arch' },
    tasks: { parent: 'cat-tasks', color: '#6ee7b7', prefix: 'doc-task' },
    debug: { parent: 'cat-debug', color: '#fcd34d', prefix: 'doc-debug' },
    features: { parent: 'cat-features', color: '#f472b6', prefix: 'doc-feat' }
  };

  for (const [cat, config] of Object.entries(categoryMap)) {
    for (const doc of docs[cat] || []) {
      const id = `${config.prefix}-${doc.filename}`;
      nodes.push({ id, label: doc.filename, group: 'doc', val: 12, color: config.color, path: doc.relPath });
      links.push({ source: config.parent, target: id });
    }
  }

  for (const f of files.slice(0, 6)) {
    const id = `file-${f.path}`;
    nodes.push({ id, label: path.basename(f.path), group: 'file', val: 10, color: '#67e8f9', path: f.path });
    links.push({ source: 'cat-code', target: id });
  }

  return { nodes, links };
}

/**
 * Generates the unified Markdown Knowledge Base (PROJECT_KB.md).
 * @param {string} cwd
 * @returns {object}
 */
export function generateMarkdownKB(cwd) {
  ensureKnowledgeBaseStructure(cwd);
  const pkgInfo = getPackageScripts(cwd);
  const rootName = pkgInfo?.name || path.basename(path.resolve(cwd));
  const projectType = detectProjectType(cwd);
  const customRules = getCustomAgentRules(cwd);
  const docs = scanStructuredKnowledgeDocs(cwd);
  const items = scanTree(cwd, cwd);
  const files = items.filter(i => i.type === 'file' && !i.path.startsWith(KB_DIR_NAME));
  const symbols = extractKeySymbols(cwd, files);

  let gitBranch = 'N/A';
  try {
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {}

  let md = `# Project Knowledge Base: ${rootName}\n\n`;
  md += `> Generated on ${new Date().toISOString().split('T')[0]} | Branch: \`${gitBranch}\` | Stack: **${projectType}**\n\n`;

  // 1. Overview
  md += `## 1. Overview\n`;
  if (pkgInfo?.description) md += `- **Description:** ${pkgInfo.description}\n`;
  md += `- **Root:** \`${rootName}\`\n`;
  md += `- **Stack:** ${projectType}\n`;
  md += `- **Structured Knowledge Base:** \`.agent-kb/\`\n\n`;

  // 2. Structured Knowledge Directory
  md += `## 2. Structured Knowledge Directory (.agent-kb/)\n\n`;
  md += `| Category | Documents | Purpose |\n| :--- | :--- | :--- |\n`;
  md += `| **architecture/** | ${(docs.architecture || []).map(d => `\`${d.filename}\``).join(', ') || 'none'} | System topology, services, APIs |\n`;
  md += `| **tasks/** | ${(docs.tasks || []).map(d => `\`${d.filename}\``).join(', ') || 'none'} | Active tasks, backlog, completed work |\n`;
  md += `| **debug/** | ${(docs.debug || []).map(d => `\`${d.filename}\``).join(', ') || 'none'} | Resolved incidents, root-cause notes |\n`;
  md += `| **features/** | ${(docs.features || []).map(d => `\`${d.filename}\``).join(', ') || 'none'} | Feature specifications & requirements |\n\n`;

  // 3. Common Commands
  md += `## 3. Common Commands\n`;
  if (pkgInfo?.scripts && Object.keys(pkgInfo.scripts).length > 0) {
    md += '```sh\n';
    for (const [name, script] of Object.entries(pkgInfo.scripts)) {
      md += `npm run ${name} # ${script}\n`;
    }
    md += '```\n\n';
  }

  // 4. Directory Map
  md += `## 4. Directory Map\n\`\`\`text\n`;
  const topLevel = items.filter(i => i.depth <= 2 && !i.path.startsWith(KB_DIR_NAME));
  for (const item of topLevel) {
    const indent = '  '.repeat(item.depth);
    md += `${indent}${item.type === 'dir' ? '📁 ' : '📄 '}${path.basename(item.path)}\n`;
  }
  md += `\`\`\`\n\n`;

  // 5. Key Entry Points
  if (symbols.length > 0) {
    md += `## 5. Key Entry Points & Signatures\n`;
    for (const s of symbols.slice(0, 10)) {
      md += `### \`${s.file}\`\n`;
      md += '```ts\n' + s.exports.join('\n') + '\n```\n';
    }
    md += '\n';
  }

  // 6. Guidelines
  md += `## 6. Agent Navigation Rules\n`;
  md += `1. **Surgical Memory**: Read \`.agent-kb/tasks/\`, \`.agent-kb/debug/\`, or \`.agent-kb/features/\` doc before code crawling.\n`;
  md += `2. **Record Learnings**: When fixing bugs, save to \`.agent-kb/debug/N.<issue>.md\`. When finishing tasks, update \`.agent-kb/tasks/\`.\n`;

  if (customRules) {
    md += `\n### Custom Project Directives (.agentrules)\n\`\`\`text\n${customRules}\n\`\`\`\n`;
  }

  const outputPath = path.join(cwd, 'PROJECT_KB.md');
  fs.writeFileSync(outputPath, md, 'utf8');

  return {
    markdown: md,
    rootName,
    projectType,
    gitBranch,
    docs,
    filesCount: files.length,
    graph: buildNeuralGraphData(cwd)
  };
}

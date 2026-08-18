import fs from 'node:fs';
import path from 'node:path';
import { KB_DIR_NAME, LEGACY_KB_DIR_NAME, KB_CATEGORIES } from './constants.js';
import {
  detectProjectType,
  getPackageScripts,
  getCustomAgentRules,
  scanTree,
  extractKeySymbols
} from './scanner.js';

/**
 * Resolves active knowledge base root directory (.lithium-kb or fallback to legacy .agent-kb).
 * @param {string} cwd
 * @returns {string}
 */
export function resolveKbDirectory(cwd) {
  const primary = path.join(cwd, KB_DIR_NAME);
  const legacy = path.join(cwd, LEGACY_KB_DIR_NAME);

  if (fs.existsSync(primary)) return primary;
  if (fs.existsSync(legacy)) return legacy;
  return primary;
}

/**
 * Ensures standard knowledge folders (.lithium-kb/{architecture,debug,tasks,features}) exist.
 * @param {string} cwd
 * @returns {string}
 */
export function ensureKnowledgeBaseStructure(cwd) {
  const kbRoot = resolveKbDirectory(cwd);

  for (const cat of KB_CATEGORIES) {
    const dir = path.join(kbRoot, cat);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Create starter docs only if directory is empty and file doesn't exist
  const archFile = path.join(kbRoot, 'architecture', 'overview.md');
  const archDir = path.join(kbRoot, 'architecture');
  if (fs.readdirSync(archDir).length === 0 && !fs.existsSync(archFile)) {
    fs.writeFileSync(
      archFile,
      `# Architecture Overview\n\n- **Project:** ${path.basename(cwd)}\n- **Role:** High-level system structure, entrypoints, and communication contracts.\n`,
      'utf8'
    );
  }

  const taskFile = path.join(kbRoot, 'tasks', 'initial-setup.md');
  const taskDir = path.join(kbRoot, 'tasks');
  if (fs.readdirSync(taskDir).length === 0 && !fs.existsSync(taskFile)) {
    fs.writeFileSync(
      taskFile,
      `# Initial Project Setup\n\n- **Status:** Complete\n- **Goal:** Initialize project structure and baseline modules.\n`,
      'utf8'
    );
  }

  const debugFile = path.join(kbRoot, 'debug', 'quickstart-diagnostics.md');
  const debugDir = path.join(kbRoot, 'debug');
  if (fs.readdirSync(debugDir).length === 0 && !fs.existsSync(debugFile)) {
    fs.writeFileSync(
      debugFile,
      `# Quickstart Diagnostics\n\n- **Issue:** Token bloat during multi-file repository exploration.\n- **Resolution:** Route agents to in-memory .lithium-kb/ directory map.\n`,
      'utf8'
    );
  }

  const featFile = path.join(kbRoot, 'features', 'core-specs.md');
  const featDir = path.join(kbRoot, 'features');
  if (fs.readdirSync(featDir).length === 0 && !fs.existsSync(featFile)) {
    fs.writeFileSync(
      featFile,
      `# Core Feature Specifications\n\n- **Status:** Active\n- **Description:** Core requirements and user workflows.\n`,
      'utf8'
    );
  }

  return kbRoot;
}

/**
 * Scans all structured markdown files inside .lithium-kb/ (or legacy .agent-kb/)
 * @param {string} cwd
 * @returns {Record<string, Array>}
 */
export function scanStructuredKnowledgeDocs(cwd) {
  const kbRoot = resolveKbDirectory(cwd);

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

  // Add associative cross-links from markdown content references
  const linkSet = new Set(links.map(l => `${l.source}->${l.target}`));
  for (const [cat, config] of Object.entries(categoryMap)) {
    for (const doc of docs[cat] || []) {
      const sourceId = `${config.prefix}-${doc.filename}`;
      const linkRegex = /\[.*?\]\((.*?)\)|`([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)`/g;
      let match;
      while ((match = linkRegex.exec(doc.content)) !== null) {
        const targetRef = (match[1] || match[2] || '').trim();
        if (!targetRef) continue;
        const baseName = path.basename(targetRef);
        for (const node of nodes) {
          if (node.id !== sourceId && (node.path === targetRef || node.label === baseName || node.label === targetRef)) {
            const linkKey = `${sourceId}->${node.id}`;
            if (!linkSet.has(linkKey)) {
              linkSet.add(linkKey);
              links.push({ source: sourceId, target: node.id });
            }
          }
        }
      }
    }
  }

  return { nodes, links };
}

/**
 * Ranked search across structured markdown files.
 * @param {string} cwd
 * @param {string} query
 * @param {object} [options]
 * @param {string} [options.category]
 * @param {number} [options.limit=5]
 * @returns {Array<{ category: string, filename: string, relPath: string, title: string, score: number, snippet: string }>}
 */
export function searchKnowledgeBase(cwd, query, options = {}) {
  if (!query || typeof query !== 'string' || !query.trim()) return [];
  const limit = options.limit || 5;
  const targetCategory = options.category;
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  if (terms.length === 0) return [];

  const docs = scanStructuredKnowledgeDocs(cwd);
  const results = [];
  const categories = targetCategory ? [targetCategory] : KB_CATEGORIES;

  for (const cat of categories) {
    for (const doc of docs[cat] || []) {
      let score = 0;
      const lowerTitle = doc.title.toLowerCase();
      const lowerFilename = doc.filename.toLowerCase();

      for (const term of terms) {
        if (lowerTitle.includes(term)) score += 10;
        if (lowerFilename.includes(term)) score += 8;
      }

      const sections = doc.content.split(/\n(?=#{1,4}\s)/);
      let bestSection = '';
      let bestSectionScore = 0;

      for (const sec of sections) {
        let secScore = 0;
        const lowerSec = sec.toLowerCase();
        const firstLine = lowerSec.split('\n')[0] || '';

        for (const term of terms) {
          if (firstLine.includes(term)) secScore += 5;
          const count = lowerSec.split(term).length - 1;
          secScore += Math.min(count, 5);
        }

        if (secScore > bestSectionScore) {
          bestSectionScore = secScore;
          bestSection = sec.trim();
        }
      }

      score += bestSectionScore;

      if (score > 0) {
        let snippet = bestSection || doc.content.slice(0, 300);
        if (snippet.length > 300) {
          snippet = snippet.slice(0, 300) + '...';
        }

        results.push({
          category: doc.category,
          filename: doc.filename,
          relPath: doc.relPath,
          title: doc.title,
          score,
          snippet
        });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Generates the unified Markdown Knowledge Base (PROJECT_KB.md).
 * @param {string} cwd
 * @param {boolean} [writeFiles=true]
 * @returns {object}
 */
export function generateMarkdownKB(cwd, writeFiles = true) {
  const pkgInfo = getPackageScripts(cwd);
  const rootName = pkgInfo?.name || path.basename(path.resolve(cwd));
  const projectType = detectProjectType(cwd);
  const customRules = getCustomAgentRules(cwd);
  const kbDirName = path.basename(resolveKbDirectory(cwd));
  const docs = scanStructuredKnowledgeDocs(cwd);
  const items = scanTree(cwd, cwd);
  const files = items.filter(i => i.type === 'file' && !i.path.startsWith(KB_DIR_NAME) && !i.path.startsWith(LEGACY_KB_DIR_NAME));
  const symbols = extractKeySymbols(cwd, files);

  let md = `# Project Knowledge Base: ${rootName}\n\n`;

  // 1. Overview
  md += `## 1. Overview\n`;
  if (pkgInfo?.description) md += `- **Description:** ${pkgInfo.description}\n`;
  md += `- **Root:** \`${rootName}\`\n`;
  md += `- **Stack:** ${projectType}\n`;
  md += `- **Structured Knowledge Base:** \`${kbDirName}/\`\n\n`;

  // 2. Structured Knowledge Directory
  md += `## 2. Structured Knowledge Directory (${kbDirName}/)\n\n`;
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
  const topLevel = items.filter(i => i.depth <= 2 && !i.path.startsWith(KB_DIR_NAME) && !i.path.startsWith(LEGACY_KB_DIR_NAME));
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
  md += `1. **Surgical Memory**: Read \`${kbDirName}/tasks/\`, \`${kbDirName}/debug/\`, or \`${kbDirName}/features/\` doc before code crawling.\n`;
  md += `2. **Auto-Generate & Sync**: If \`${kbDirName}/\` or \`PROJECT_KB.md\` is absent or outdated, generate it via \`npx @liulinnuha/lithium-kb\`.\n`;
  md += `3. **Record Learnings**: When fixing bugs, save to \`${kbDirName}/debug/<topic-name>.md\`. When working on tasks, update \`${kbDirName}/tasks/<task-name>.md\`.\n`;
  md += `4. **Trigger Keywords**: Activate or sync on mentions of "kb", "knowledge base", "sync kb", "spec feature", "debug note".\n`;
  md += `5. **Deterministic Output**: Do not emit dynamic date timestamps or ephemeral session headers in generated knowledge files.\n`;

  if (customRules) {
    md += `\n### Custom Project Directives (.agentrules)\n\`\`\`text\n${customRules}\n\`\`\`\n`;
  }

  if (writeFiles) {
    const outputPath = path.join(cwd, 'PROJECT_KB.md');
    fs.writeFileSync(outputPath, md, 'utf8');
  }

  return {
    markdown: md,
    rootName,
    cwd: path.resolve(cwd),
    projectType,
    docs,
    filesCount: files.length,
    graph: buildNeuralGraphData(cwd)
  };
}

import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_IGNORED_DIRS, MAX_DEPTH, MAX_SAMPLE_FILES, KB_DIR_NAME } from './constants.js';

/**
 * Loads user ignore patterns from .agentignore and .gitignore if present.
 * @param {string} cwd
 * @returns {Set<string>}
 */
export function getIgnoredSet(cwd) {
  const set = new Set(DEFAULT_IGNORED_DIRS);
  const candidates = ['.agentignore', '.gitignore'];
  for (const file of candidates) {
    const filePath = path.join(cwd, file);
    if (fs.existsSync(filePath)) {
      try {
        const lines = fs.readFileSync(filePath, 'utf8').split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('!')) {
            const normalized = trimmed.replace(/^\/+|\/+$/g, '');
            if (normalized) set.add(normalized);
          }
        }
      } catch {}
    }
  }
  return set;
}

/**
 * Loads project-specific custom agent rules (.agentrules, AGENT_RULES.md, .cursorrules).
 * @param {string} cwd
 * @returns {string|null}
 */
export function getCustomAgentRules(cwd) {
  const candidates = ['.agentrules', 'AGENT_RULES.md', '.cursorrules'];
  for (const c of candidates) {
    const p = path.join(cwd, c);
    if (fs.existsSync(p)) {
      try {
        return fs.readFileSync(p, 'utf8').trim();
      } catch {}
    }
  }
  return null;
}

/**
 * Detects the runtime / language ecosystem of the project.
 * @param {string} cwd
 * @returns {string}
 */
export function detectProjectType(cwd) {
  const files = fs.readdirSync(cwd);
  const types = [];

  if (files.includes('package.json')) types.push('Node.js / JavaScript / TypeScript');
  if (files.includes('pyproject.toml') || files.includes('requirements.txt') || files.includes('Pipfile')) types.push('Python');
  if (files.includes('Cargo.toml')) types.push('Rust');
  if (files.includes('go.mod')) types.push('Go');
  if (files.includes('pom.xml') || files.includes('build.gradle')) types.push('Java / Kotlin');
  if (files.includes('Makefile')) types.push('Make-based');
  if (files.includes('docker-compose.yml') || files.includes('Dockerfile')) types.push('Dockerized');

  return types.length > 0 ? types.join(', ') : 'Generic / Multi-language';
}

/**
 * Reads package manifest data if present.
 * @param {string} cwd
 * @returns {object|null}
 */
export function getPackageScripts(cwd) {
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return {
      name: pkg.name || path.basename(cwd),
      version: pkg.version || '0.0.0',
      description: pkg.description || '',
      scripts: pkg.scripts || {},
      dependencies: Object.keys(pkg.dependencies || {}),
      devDependencies: Object.keys(pkg.devDependencies || {})
    };
  } catch {
    return null;
  }
}

/**
 * Recursively scans project directory up to MAX_DEPTH.
 * @param {string} dir
 * @param {string} rootDir
 * @param {number} depth
 * @param {Array} summary
 * @param {Set<string>} ignoredSet
 * @returns {Array}
 */
export function scanTree(dir, rootDir, depth = 0, summary = [], ignoredSet = null) {
  if (depth > MAX_DEPTH) return summary;
  const ignored = ignoredSet || getIgnoredSet(rootDir);
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return summary;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.env.example' && entry.name !== KB_DIR_NAME) continue;
    if (ignored.has(entry.name)) continue;
    if (entry.isSymbolicLink()) continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath);

    try {
      if (entry.isDirectory()) {
        summary.push({ type: 'dir', path: relPath, depth });
        scanTree(fullPath, rootDir, depth + 1, summary, ignored);
      } else {
        const stats = fs.statSync(fullPath);
        summary.push({ type: 'file', path: relPath, depth, size: stats.size });
      }
    } catch {}
  }
  return summary;
}

/**
 * Extracts exported functions, classes, interfaces, and signatures.
 * @param {string} cwd
 * @param {Array} files
 * @returns {Array}
 */
export function extractKeySymbols(cwd, files) {
  const symbols = [];
  const codeFiles = files.filter(f => /\.(ts|js|py|go|rs)$/.test(f.path) && !f.path.startsWith(KB_DIR_NAME)).slice(0, MAX_SAMPLE_FILES);

  for (const f of codeFiles) {
    try {
      const content = fs.readFileSync(path.join(cwd, f.path), 'utf8');
      const lines = content.split('\n');
      const exports = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('export ') || trimmed.startsWith('export default ')) {
          exports.push(trimmed.replace(/^export (default )?/, '').slice(0, 80));
        } else if (/^(def |class )/.test(trimmed)) {
          exports.push(trimmed.slice(0, 80));
        } else if (/^(func |type )/.test(trimmed)) {
          exports.push(trimmed.slice(0, 80));
        } else if (trimmed.startsWith('pub ')) {
          exports.push(trimmed.slice(0, 80));
        }
        if (exports.length >= 6) break;
      }

      if (exports.length > 0) {
        symbols.push({ file: f.path, exports });
      }
    } catch {}
  }
  return symbols;
}

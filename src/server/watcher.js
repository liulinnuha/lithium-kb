import fs from 'node:fs';
import path from 'node:path';
import { generateMarkdownKB } from '../core/generator.js';
import { KB_DIR_NAME, LEGACY_KB_DIR_NAME } from '../core/constants.js';

/**
 * Starts continuous watcher for project repository changes with cross-platform resilience.
 * @param {string} cwd
 * @param {Function} [onUpdate]
 * @returns {object}
 */
export function startFileWatcher(cwd, onUpdate) {
  console.log(`[lithium-kb] Watching for project changes in ${cwd}...`);
  let timer = null;

  const triggerUpdate = (filename) => {
    if (!filename || filename === 'PROJECT_KB.md' || filename.startsWith('.git') || filename.includes('node_modules') || filename.startsWith(KB_DIR_NAME) || filename.startsWith(LEGACY_KB_DIR_NAME)) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log(`[lithium-kb] Detected change in ${filename}, updating knowledge base...`);
      try {
        const data = generateMarkdownKB(cwd);
        if (typeof onUpdate === 'function') onUpdate(data);
      } catch (err) {
        console.error('[lithium-kb] Error regenerating knowledge base:', err.message);
      }
    }, 300);
  };

  try {
    return fs.watch(cwd, { recursive: true }, (eventType, filename) => {
      triggerUpdate(filename);
    });
  } catch {
    const watchers = [];
    function watchDir(dir) {
      try {
        const watcher = fs.watch(dir, (eventType, filename) => {
          triggerUpdate(filename ? path.join(path.relative(cwd, dir), filename) : dir);
        });
        watchers.push(watcher);
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== KB_DIR_NAME && entry.name !== LEGACY_KB_DIR_NAME) {
            watchDir(path.join(dir, entry.name));
          }
        }
      } catch {}
    }
    watchDir(cwd);
    return {
      close() {
        for (const w of watchers) {
          try { w.close(); } catch {}
        }
      }
    };
  }
}

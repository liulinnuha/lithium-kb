import fs from 'node:fs';
import { generateMarkdownKB } from '../core/generator.js';

/**
 * Starts continuous watcher for project repository changes.
 * @param {string} cwd
 * @param {Function} [onUpdate]
 * @returns {fs.FSWatcher}
 */
export function startFileWatcher(cwd, onUpdate) {
  console.log(`[lithium-kb] Watching for project changes in ${cwd}...`);
  let timer = null;

  return fs.watch(cwd, { recursive: true }, (eventType, filename) => {
    if (!filename || filename === 'PROJECT_KB.md' || filename.startsWith('.git') || filename.includes('node_modules') || filename.startsWith(KB_DIR_NAME)) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log(`[lithium-kb] Detected change in ${filename}, updating knowledge base...`);
      const data = generateMarkdownKB(cwd);
      if (typeof onUpdate === 'function') onUpdate(data);
    }, 400);
  });
}

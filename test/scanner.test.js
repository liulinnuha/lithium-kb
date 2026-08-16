import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  detectProjectType,
  getPackageScripts,
  getIgnoredSet,
  scanTree,
  extractKeySymbols
} from '../src/core/scanner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

test('scanner: detectProjectType detects Node.js environment', () => {
  const type = detectProjectType(projectRoot);
  assert.ok(type.includes('Node.js'));
});

test('scanner: getPackageScripts extracts package name and scripts', () => {
  const pkg = getPackageScripts(projectRoot);
  assert.ok(pkg);
  assert.equal(pkg.name, 'lithium-kb');
  assert.ok(pkg.scripts.generate);
});

test('scanner: getIgnoredSet defaults include node_modules and .git', () => {
  const ignored = getIgnoredSet(projectRoot);
  assert.ok(ignored.has('node_modules'));
  assert.ok(ignored.has('.git'));
});

test('scanner: scanTree traverses files without ignored directories', () => {
  const tree = scanTree(projectRoot, projectRoot);
  assert.ok(tree.length > 0);
  assert.ok(!tree.some(item => item.path.includes('node_modules')));
});

test('scanner: extractKeySymbols extracts exports from codebase', () => {
  const files = [{ path: 'src/core/constants.js' }];
  const symbols = extractKeySymbols(projectRoot, files);
  assert.ok(symbols.length > 0);
  assert.ok(symbols[0].exports.some(e => e.includes('DEFAULT_IGNORED_DIRS')));
});

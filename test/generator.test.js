import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  ensureKnowledgeBaseStructure,
  scanStructuredKnowledgeDocs,
  buildNeuralGraphData,
  generateMarkdownKB
} from '../src/core/generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

test('generator: ensureKnowledgeBaseStructure initializes .agent-kb subdirectories', () => {
  const kbRoot = ensureKnowledgeBaseStructure(projectRoot);
  assert.ok(fs.existsSync(path.join(kbRoot, 'architecture')));
  assert.ok(fs.existsSync(path.join(kbRoot, 'tasks')));
  assert.ok(fs.existsSync(path.join(kbRoot, 'debug')));
  assert.ok(fs.existsSync(path.join(kbRoot, 'features')));
});

test('generator: scanStructuredKnowledgeDocs reads categorized docs', () => {
  const docs = scanStructuredKnowledgeDocs(projectRoot);
  assert.ok(docs.architecture);
  assert.ok(docs.tasks);
  assert.ok(docs.debug);
  assert.ok(docs.features);
});

test('generator: buildNeuralGraphData generates nodes and links', () => {
  const graph = buildNeuralGraphData(projectRoot);
  assert.ok(graph.nodes.length >= 6);
  assert.ok(graph.links.length >= 5);
  assert.ok(graph.nodes.some(n => n.id === 'node-root'));
  assert.ok(graph.nodes.some(n => n.id === 'cat-tasks'));
});

test('generator: generateMarkdownKB creates PROJECT_KB.md', () => {
  const result = generateMarkdownKB(projectRoot);
  assert.ok(result.markdown);
  assert.ok(result.markdown.includes('# Project Knowledge Base'));
  assert.ok(fs.existsSync(path.join(projectRoot, 'PROJECT_KB.md')));
});

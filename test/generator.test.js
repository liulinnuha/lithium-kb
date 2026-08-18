import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  ensureKnowledgeBaseStructure,
  scanStructuredKnowledgeDocs,
  buildNeuralGraphData,
  generateMarkdownKB,
  searchKnowledgeBase
} from '../src/core/generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

test('generator: ensureKnowledgeBaseStructure initializes .lithium-kb subdirectories', () => {
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

test('generator: searchKnowledgeBase ranks matching documents by score', () => {
  const results = searchKnowledgeBase(projectRoot, 'architecture overview');
  assert.ok(results.length > 0);
  assert.equal(results[0].category, 'architecture');
  assert.ok(results[0].score > 0);
  assert.ok(results[0].snippet);
});

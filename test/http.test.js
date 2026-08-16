import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../src/server/http.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const TEST_PORT = 3099;

test('http: starts server and serves HTML UI and REST endpoints', async () => {
  const server = startServer(projectRoot, TEST_PORT);

  await new Promise((resolve) => setTimeout(resolve, 100));

  try {
    // 1. Test GET /
    const htmlRes = await fetch(`http://localhost:${TEST_PORT}/`);
    assert.equal(htmlRes.status, 200);
    const html = await htmlRes.text();
    assert.ok(html.includes('lithium-kb'));

    // 2. Test GET /api/kb
    const kbRes = await fetch(`http://localhost:${TEST_PORT}/api/kb`);
    assert.equal(kbRes.status, 200);
    const kbData = await kbRes.json();
    assert.ok(kbData.rootName.includes('lithium-kb'));
    assert.ok(kbData.graph.nodes.length > 0);

    // 3. Test POST /api/access
    const postRes = await fetch(`http://localhost:${TEST_PORT}/api/access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: 'cat-tasks',
        label: 'tasks/',
        agent: 'Vitest Runner',
        query: 'Automated test access',
        tokensSaved: 1000
      })
    });
    assert.equal(postRes.status, 200);
    const postData = await postRes.json();
    assert.equal(postData.ok, true);
  } finally {
    server.close();
  }
});

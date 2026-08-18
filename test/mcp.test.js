import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const cliPath = path.join(projectRoot, 'bin', 'cli.js');

test('mcp: handles JSON-RPC 2.0 initialize, tools/list, tools/call, and resources', async () => {
  const proc = spawn(process.execPath, [cliPath, '--mcp'], {
    cwd: projectRoot,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  const responses = [];
  let buffer = '';

  proc.stdout.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // retain incomplete line
    for (const line of lines) {
      if (line.trim()) {
        try {
          responses.push(JSON.parse(line));
        } catch {}
      }
    }
  });

  const send = (msg) => proc.stdin.write(JSON.stringify(msg) + '\n');

  // 1. Initialize
  send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
  await new Promise(r => setTimeout(r, 100));

  // 2. List tools
  send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  await new Promise(r => setTimeout(r, 100));

  // 3. Call get_project_memory tool
  send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_project_memory' } });
  await new Promise(r => setTimeout(r, 150));

  // 4. Resources list
  send({ jsonrpc: '2.0', id: 4, method: 'resources/list', params: {} });
  await new Promise(r => setTimeout(r, 100));

  // 5. Resources read
  send({ jsonrpc: '2.0', id: 5, method: 'resources/read', params: { uri: 'lithium-kb://architecture/overview.md' } });
  await new Promise(r => setTimeout(r, 100));

  // 6. Tool error handling with isError: true
  send({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'read_knowledge_doc', arguments: { category: 'architecture', filename: 'nonexistent.md' } } });
  await new Promise(r => setTimeout(r, 100));

  // 7. Search knowledge base tool
  send({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'search_knowledge_base', arguments: { query: 'architecture' } } });
  await new Promise(r => setTimeout(r, 100));

  // Clean exit
  proc.stdin.end();
  await new Promise(r => proc.on('close', r));

  assert.ok(responses.length >= 7, `Expected at least 7 responses, got ${responses.length}`);

  const initRes = responses.find(r => r.id === 1);
  assert.ok(initRes);
  assert.equal(initRes.result.serverInfo.name, 'lithium-kb');
  assert.ok(initRes.result.capabilities.resources);

  const toolsRes = responses.find(r => r.id === 2);
  assert.ok(toolsRes);
  assert.ok(toolsRes.result.tools.some(t => t.name === 'get_project_memory'));
  assert.ok(toolsRes.result.tools.some(t => t.name === 'read_knowledge_doc'));
  assert.ok(toolsRes.result.tools.some(t => t.name === 'list_knowledge_docs'));
  assert.ok(toolsRes.result.tools.some(t => t.name === 'search_knowledge_base'));

  const callRes = responses.find(r => r.id === 3);
  assert.ok(callRes);
  assert.ok(callRes.result.content[0].text.includes('# Project Knowledge Base'));

  const resList = responses.find(r => r.id === 4);
  assert.ok(resList);
  assert.ok(Array.isArray(resList.result.resources));

  const resRead = responses.find(r => r.id === 5);
  assert.ok(resRead);
  assert.ok(resRead.result.contents[0].text.length > 0);

  const toolErr = responses.find(r => r.id === 6);
  assert.ok(toolErr);
  assert.equal(toolErr.result.isError, true);
  assert.ok(toolErr.result.content[0].text.includes('Document not found'));

  const searchRes = responses.find(r => r.id === 7);
  assert.ok(searchRes);
  assert.ok(searchRes.result.content[0].text.includes('architecture'));
});

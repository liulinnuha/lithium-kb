import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { initializeProject, uninstallProject, isHomeOrRootDir } from '../src/core/initializer.js';

test('initializer: isHomeOrRootDir accurately identifies home directory', () => {
  assert.equal(isHomeOrRootDir(os.homedir()), true);
  assert.equal(isHomeOrRootDir('/'), true);
  assert.equal(isHomeOrRootDir(path.join(os.tmpdir(), 'some-project-123')), false);
});

test('initializer: initializeProject skips KB creation in home directory', () => {
  const res = initializeProject(os.homedir());
  assert.equal(res.isHomeDir, true);
  assert.equal(res.kbInitialized, false);
});

test('initializer: initializeProject configures agent knowledge structure and cursor mcp.json in project dir', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lithium-init-test-'));

  try {
    const res = initializeProject(tempDir);
    assert.equal(res.isHomeDir, false);
    assert.equal(res.kbInitialized, true);

    // Verify .agent-kb was created
    assert.ok(fs.existsSync(path.join(tempDir, '.agent-kb', 'architecture')));
    assert.ok(fs.existsSync(path.join(tempDir, '.agent-kb', 'tasks')));
    assert.ok(fs.existsSync(path.join(tempDir, '.agent-kb', 'debug')));
    assert.ok(fs.existsSync(path.join(tempDir, '.agent-kb', 'features')));

    // Verify PROJECT_KB.md
    assert.ok(fs.existsSync(path.join(tempDir, 'PROJECT_KB.md')));

    // Verify .agentrules
    assert.ok(fs.existsSync(path.join(tempDir, '.agentrules')));

    // Verify .cursor/mcp.json
    const cursorMcpPath = path.join(tempDir, '.cursor', 'mcp.json');
    assert.ok(fs.existsSync(cursorMcpPath));
    const cursorMcp = JSON.parse(fs.readFileSync(cursorMcpPath, 'utf8'));
    assert.ok(cursorMcp.mcpServers['lithium-kb']);
    assert.equal(cursorMcp.mcpServers['lithium-kb'].command, 'npx');

    // Test uninstall / cleanup
    const uninstallRes = uninstallProject(tempDir, true);
    assert.ok(uninstallRes.cleanedTargets.length > 0);
    assert.equal(fs.existsSync(path.join(tempDir, '.agent-kb')), false);
    assert.equal(fs.existsSync(path.join(tempDir, 'PROJECT_KB.md')), false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

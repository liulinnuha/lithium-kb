import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { initializeProject, uninstallProject, isHomeOrRootDir, detectEnvironmentAgents } from '../src/core/initializer.js';

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

test('initializer: adapts to neutral/clean project without spamming editor configs', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lithium-clean-test-'));

  // Ensure clean environment
  const originalEnv = { ...process.env };
  delete process.env.CURSOR_AGENT;
  delete process.env.CURSOR_VERSION;
  delete process.env.CLAUDE_CODE;
  delete process.env.CLAUDE_SESSION_ID;
  delete process.env.WINDSURF_PORTABLE;
  delete process.env.TERM_PROGRAM;
  delete process.env.PI_SESSION_DIR;
  delete process.env.PI_AGENT;

  try {
    const res = initializeProject(tempDir);
    assert.equal(res.isHomeDir, false);
    assert.equal(res.kbInitialized, true);

    // Verify .lithium-kb was created
    assert.ok(fs.existsSync(path.join(tempDir, '.lithium-kb', 'architecture')));
    assert.ok(fs.existsSync(path.join(tempDir, '.lithium-kb', 'tasks')));
    assert.ok(fs.existsSync(path.join(tempDir, '.lithium-kb', 'debug')));
    assert.ok(fs.existsSync(path.join(tempDir, '.lithium-kb', 'features')));
    assert.ok(fs.existsSync(path.join(tempDir, 'PROJECT_KB.md')));

    // Universal fallback: .agentrules created
    assert.ok(fs.existsSync(path.join(tempDir, '.agentrules')));

    // MUST NOT create unrequested editor folders and files
    assert.equal(fs.existsSync(path.join(tempDir, '.cursor')), false);
    assert.equal(fs.existsSync(path.join(tempDir, '.cursorrules')), false);
    assert.equal(fs.existsSync(path.join(tempDir, 'CLAUDE.md')), false);
    assert.equal(fs.existsSync(path.join(tempDir, '.windsurfrules')), false);
    assert.equal(fs.existsSync(path.join(tempDir, '.windsurf')), false);
    assert.equal(fs.existsSync(path.join(tempDir, '.vscode')), false);
    assert.equal(fs.existsSync(path.join(tempDir, '.zed')), false);
  } finally {
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('initializer: adapts specifically to Cursor environment', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lithium-cursor-test-'));
  const originalEnv = { ...process.env };
  process.env.CURSOR_AGENT = 'true';

  try {
    const res = initializeProject(tempDir);
    assert.ok(res.detectedAgents.includes('cursor'));

    // Should create Cursor rules and MCP config
    assert.ok(fs.existsSync(path.join(tempDir, '.cursorrules')));
    const cursorMcpPath = path.join(tempDir, '.cursor', 'mcp.json');
    assert.ok(fs.existsSync(cursorMcpPath));
    const cursorMcp = JSON.parse(fs.readFileSync(cursorMcpPath, 'utf8'));
    assert.ok(cursorMcp.mcpServers['lithium-kb']);

    // Should NOT create Claude or Windsurf rules
    assert.equal(fs.existsSync(path.join(tempDir, 'CLAUDE.md')), false);
    assert.equal(fs.existsSync(path.join(tempDir, '.windsurfrules')), false);
  } finally {
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('initializer: adapts specifically to Claude environment', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lithium-claude-test-'));
  const originalEnv = { ...process.env };
  delete process.env.CURSOR_AGENT;
  delete process.env.CURSOR_VERSION;
  process.env.CLAUDE_CODE = '1';

  try {
    const res = initializeProject(tempDir);
    assert.ok(res.detectedAgents.includes('claude'));

    // Should create CLAUDE.md
    assert.ok(fs.existsSync(path.join(tempDir, 'CLAUDE.md')));

    // Should NOT create .cursor or .windsurfrules
    assert.equal(fs.existsSync(path.join(tempDir, '.cursor')), false);
    assert.equal(fs.existsSync(path.join(tempDir, '.cursorrules')), false);
    assert.equal(fs.existsSync(path.join(tempDir, '.windsurfrules')), false);
  } finally {
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('initializer: adapts to Windsurf workspace indicators', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lithium-windsurf-test-'));
  const originalEnv = { ...process.env };
  delete process.env.CURSOR_AGENT;
  delete process.env.CLAUDE_CODE;

  // Simulate existing .windsurf workspace folder
  fs.mkdirSync(path.join(tempDir, '.windsurf'));

  try {
    const res = initializeProject(tempDir);
    assert.ok(res.detectedAgents.includes('windsurf'));

    // Should create .windsurfrules and .windsurf/mcp.json
    assert.ok(fs.existsSync(path.join(tempDir, '.windsurfrules')));
    assert.ok(fs.existsSync(path.join(tempDir, '.windsurf', 'mcp.json')));

    // Should NOT create .cursor or CLAUDE.md
    assert.equal(fs.existsSync(path.join(tempDir, '.cursor')), false);
    assert.equal(fs.existsSync(path.join(tempDir, '.cursorrules')), false);
    assert.equal(fs.existsSync(path.join(tempDir, 'CLAUDE.md')), false);
  } finally {
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('initializer: never overwrites existing project files or MCP configurations', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lithium-overwrite-test-'));
  const originalEnv = { ...process.env };
  process.env.CURSOR_AGENT = 'true';

  try {
    // 1. User already has custom PROJECT_KB.md
    const customKbContent = '# Custom User KB\nDo not overwrite!';
    fs.writeFileSync(path.join(tempDir, 'PROJECT_KB.md'), customKbContent, 'utf8');

    // 2. User already has custom .cursorrules
    const customCursorRules = '# Custom Cursor Rules\nCustom directive';
    fs.writeFileSync(path.join(tempDir, '.cursorrules'), customCursorRules, 'utf8');

    // 3. User already has custom starter doc
    fs.mkdirSync(path.join(tempDir, '.lithium-kb', 'architecture'), { recursive: true });
    const customArchDoc = '# My Architecture\nExisting spec.';
    fs.writeFileSync(path.join(tempDir, '.lithium-kb', 'architecture', 'overview.md'), customArchDoc, 'utf8');

    // 4. User already has existing .cursor/mcp.json with other servers
    fs.mkdirSync(path.join(tempDir, '.cursor'), { recursive: true });
    const existingMcp = {
      mcpServers: {
        'github-tools': { command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'] }
      }
    };
    fs.writeFileSync(path.join(tempDir, '.cursor', 'mcp.json'), JSON.stringify(existingMcp, null, 2), 'utf8');

    // Run initialize
    const res = initializeProject(tempDir);

    // Verify PROJECT_KB.md was NOT overwritten
    assert.equal(fs.readFileSync(path.join(tempDir, 'PROJECT_KB.md'), 'utf8'), customKbContent);
    assert.ok(res.preservedFiles.includes('PROJECT_KB.md'));

    // Verify .cursorrules was NOT overwritten
    assert.equal(fs.readFileSync(path.join(tempDir, '.cursorrules'), 'utf8'), customCursorRules);
    assert.ok(res.preservedFiles.includes('.cursorrules'));

    // Verify overview.md was NOT overwritten
    assert.equal(fs.readFileSync(path.join(tempDir, '.lithium-kb', 'architecture', 'overview.md'), 'utf8'), customArchDoc);

    // Verify .cursor/mcp.json merged lithium-kb without deleting github-tools
    const updatedMcp = JSON.parse(fs.readFileSync(path.join(tempDir, '.cursor', 'mcp.json'), 'utf8'));
    assert.ok(updatedMcp.mcpServers['github-tools'], 'Existing server should be preserved');
    assert.ok(updatedMcp.mcpServers['lithium-kb'], 'lithium-kb server should be added');
    assert.equal(updatedMcp.mcpServers['github-tools'].command, 'npx');

    // Test uninstall / cleanup
    const uninstallRes = uninstallProject(tempDir, true);
    assert.ok(uninstallRes.cleanedTargets.length > 0);
  } finally {
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

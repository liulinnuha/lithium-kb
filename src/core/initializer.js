import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { ensureKnowledgeBaseStructure, generateMarkdownKB } from './generator.js';

const MCP_COMMAND = 'npx';
const MCP_ARGS = ['-y', '@liulinnuha/lithium-kb', '--mcp'];

const DEFAULT_RULES = `# Agent Navigation & Memory Directives
1. Zero Blind Crawling: Before crawling files across the repository, read .lithium-kb/ or PROJECT_KB.md.
2. Mandatory Task & Bug Tracking:
   - For every task, UI refactor, or feature assigned, create/update .lithium-kb/tasks/<task-name>.md.
   - For every resolved bug or diagnostic fix, document root cause and solution in .lithium-kb/debug/<issue-name>.md.
3. Keep Memory Synced: Run 'npx @liulinnuha/lithium-kb' after updating .lithium-kb/ docs.
4. Deterministic Output: Do not emit dynamic timestamps or session headers in knowledge markdown files.
`;

/**
 * Safely reads and parses JSON, or returns undefined on parse failure.
 * Returns null if file does not exist.
 */
function readJsonSafe(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return {};
    return JSON.parse(raw);
  } catch {
    // Try stripping comments and trailing commas before failing
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const stripped = raw
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*/g, '')
        .replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(stripped);
    } catch {
      return undefined; // Parse error on existing file
    }
  }
}

/**
 * Writes JSON file with parent directory creation.
 */
function writeJsonSafe(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/**
 * Checks if a given directory is the user's home directory or filesystem root.
 */
export function isHomeOrRootDir(dir) {
  const resolved = path.resolve(dir);
  const home = path.resolve(os.homedir());
  const root = path.parse(resolved).root;
  return resolved === home || resolved === root;
}

/**
 * Detects the active coding agents, IDEs, and environments.
 * @param {string} cwd
 * @returns {Set<string>}
 */
export function detectEnvironmentAgents(cwd = process.cwd()) {
  const detected = new Set();
  const env = process.env;
  const term = (env.TERM_PROGRAM || '').toLowerCase();

  // 1. Cursor IDE / Agent
  if (
    env.CURSOR_AGENT ||
    env.CURSOR_VERSION ||
    env.CURSOR_SERVER_USER_DATA_DIR ||
    term === 'cursor' ||
    fs.existsSync(path.join(cwd, '.cursor')) ||
    fs.existsSync(path.join(cwd, '.cursorrules'))
  ) {
    detected.add('cursor');
  }

  // 2. Claude Code CLI / Claude Desktop
  if (
    env.CLAUDE_CODE ||
    env.CLAUDE_SESSION_ID ||
    env.CLAUDE_DIR ||
    env.CLAUDE_AGENT ||
    fs.existsSync(path.join(cwd, 'CLAUDE.md')) ||
    fs.existsSync(path.join(cwd, '.claude'))
  ) {
    detected.add('claude');
  }

  // 3. Windsurf / Codeium
  if (
    env.WINDSURF_PORTABLE ||
    env.WINDSURF_VERSION ||
    term === 'windsurf' ||
    fs.existsSync(path.join(cwd, '.windsurf')) ||
    fs.existsSync(path.join(cwd, '.windsurfrules'))
  ) {
    detected.add('windsurf');
  }

  // 4. VS Code (Standard / Cline / Roo Code)
  if (
    ((term === 'vscode' || env.VSCODE_PID) && !detected.has('cursor') && !detected.has('windsurf')) ||
    fs.existsSync(path.join(cwd, '.vscode'))
  ) {
    detected.add('vscode');
  }

  // 5. Zed Editor
  if (
    env.ZED_TERM ||
    env.ZED_SERVER ||
    term === 'zed' ||
    fs.existsSync(path.join(cwd, '.zed'))
  ) {
    detected.add('zed');
  }

  // 6. Pi / Coding Agent Harness
  if (
    env.PI_SESSION_DIR ||
    env.PI_AGENT ||
    env.PI_MODEL ||
    env.PI_TERMINAL ||
    fs.existsSync(path.join(cwd, '.agentrules')) ||
    fs.existsSync(path.join(os.homedir(), '.pi')) ||
    fs.existsSync(path.join(os.homedir(), '.agents', 'skills'))
  ) {
    detected.add('pi');
  }

  return detected;
}

/**
 * Returns platform-specific global configuration paths for various editors and agents.
 */
function getGlobalAgentConfigs() {
  const home = os.homedir();
  const platform = os.platform();
  const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');

  const configs = [];

  // 1. Claude Desktop
  let claudeConfigPath;
  if (platform === 'darwin') {
    claudeConfigPath = path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else if (platform === 'win32') {
    claudeConfigPath = path.join(appData, 'Claude', 'claude_desktop_config.json');
  } else {
    claudeConfigPath = path.join(home, '.config', 'Claude', 'claude_desktop_config.json');
  }
  configs.push({
    name: 'Claude Desktop',
    agent: 'claude',
    type: 'mcpServers',
    path: claudeConfigPath,
    global: true
  });

  // 2. Windsurf (Codeium)
  let windsurfConfigPath;
  if (platform === 'darwin' || platform === 'linux' || platform === 'win32') {
    windsurfConfigPath = path.join(home, '.codeium', 'windsurf', 'mcp_config.json');
  }
  if (windsurfConfigPath) {
    configs.push({
      name: 'Windsurf',
      agent: 'windsurf',
      type: 'mcpServers',
      path: windsurfConfigPath,
      global: true
    });
  }

  // 3. Zed Editor
  let zedConfigPath;
  if (platform === 'darwin' || platform === 'linux') {
    zedConfigPath = path.join(home, '.config', 'zed', 'settings.json');
  } else if (platform === 'win32') {
    zedConfigPath = path.join(appData, 'Zed', 'settings.json');
  }
  if (zedConfigPath) {
    configs.push({
      name: 'Zed Editor',
      agent: 'zed',
      type: 'zedContextServers',
      path: zedConfigPath,
      global: true
    });
  }

  // 4. VS Code - Cline extension
  let clineConfigPath;
  if (platform === 'darwin') {
    clineConfigPath = path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
  } else if (platform === 'win32') {
    clineConfigPath = path.join(appData, 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
  } else {
    clineConfigPath = path.join(home, '.config', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
  }
  configs.push({
    name: 'Cline (VS Code)',
    agent: 'vscode',
    type: 'mcpServers',
    path: clineConfigPath,
    global: true
  });

  // 5. VS Code - Roo Code extension
  let rooConfigPath;
  if (platform === 'darwin') {
    rooConfigPath = path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json');
  } else if (platform === 'win32') {
    rooConfigPath = path.join(appData, 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json');
  } else {
    rooConfigPath = path.join(home, '.config', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json');
  }
  configs.push({
    name: 'Roo Code (VS Code)',
    agent: 'vscode',
    type: 'mcpServers',
    path: rooConfigPath,
    global: true
  });

  return configs;
}

/**
 * Returns project-level configurations for Cursor, Windsurf, Zed, and local VS Code.
 */
function getProjectAgentConfigs(cwd) {
  return [
    {
      name: 'Cursor',
      agent: 'cursor',
      type: 'mcpServers',
      path: path.join(cwd, '.cursor', 'mcp.json'),
      global: false
    },
    {
      name: 'Windsurf (Workspace)',
      agent: 'windsurf',
      type: 'mcpServers',
      path: path.join(cwd, '.windsurf', 'mcp.json'),
      global: false
    },
    {
      name: 'Zed (Workspace)',
      agent: 'zed',
      type: 'zedContextServers',
      path: path.join(cwd, '.zed', 'settings.json'),
      global: false
    },
    {
      name: 'VS Code (Workspace)',
      agent: 'vscode',
      type: 'mcpServers',
      path: path.join(cwd, '.vscode', 'mcp.json'),
      global: false
    }
  ];
}

/**
 * Injects lithium-kb configuration into an editor config file safely without overwriting other entries.
 */
function injectMcpConfig(target) {
  try {
    const fileExists = fs.existsSync(target.path);
    let data = {};

    if (fileExists) {
      const parsed = readJsonSafe(target.path);
      if (parsed === undefined) {
        // Corrupted or unsupported JSON: do NOT overwrite to protect user files
        return { success: false, reason: `Cannot safely parse ${target.path}; skipped to avoid overwriting.` };
      }
      data = parsed || {};
    }

    let modified = false;

    if (target.type === 'zedContextServers') {
      data.context_servers = data.context_servers || {};
      if (data.context_servers['agent-kb']) {
        delete data.context_servers['agent-kb'];
        modified = true;
      }
      const existing = data.context_servers['lithium-kb'];
      if (!existing || existing.command !== MCP_COMMAND || JSON.stringify(existing.args) !== JSON.stringify(MCP_ARGS)) {
        data.context_servers['lithium-kb'] = {
          command: MCP_COMMAND,
          args: MCP_ARGS
        };
        modified = true;
      }
    } else {
      data.mcpServers = data.mcpServers || {};
      if (data.mcpServers['agent-kb']) {
        delete data.mcpServers['agent-kb'];
        modified = true;
      }
      const existing = data.mcpServers['lithium-kb'];
      if (!existing || existing.command !== MCP_COMMAND || JSON.stringify(existing.args) !== JSON.stringify(MCP_ARGS)) {
        data.mcpServers['lithium-kb'] = {
          command: MCP_COMMAND,
          args: MCP_ARGS
        };
        modified = true;
      }
    }

    if (modified || !fileExists) {
      writeJsonSafe(target.path, data);
    }
    return { success: true, updated: modified || !fileExists };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

/**
 * Removes lithium-kb and legacy agent-kb configurations from an editor config file.
 */
function removeMcpConfig(target) {
  try {
    if (!fs.existsSync(target.path)) return false;
    const data = readJsonSafe(target.path);
    if (!data || typeof data !== 'object') return false;
    let modified = false;

    if (target.type === 'zedContextServers' && data.context_servers) {
      if (data.context_servers['lithium-kb']) {
        delete data.context_servers['lithium-kb'];
        modified = true;
      }
      if (data.context_servers['agent-kb']) {
        delete data.context_servers['agent-kb'];
        modified = true;
      }
    } else if (data.mcpServers) {
      if (data.mcpServers['lithium-kb']) {
        delete data.mcpServers['lithium-kb'];
        modified = true;
      }
      if (data.mcpServers['agent-kb']) {
        delete data.mcpServers['agent-kb'];
        modified = true;
      }
    }

    if (modified) {
      writeJsonSafe(target.path, data);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Ensures global Pi / Claude agent skill is registered in ~/.agents/skills/lithium-kb/SKILL.md
 */
export function ensureGlobalAgentSkill() {
  try {
    const home = os.homedir();
    const globalSkillDir = path.join(home, '.agents', 'skills', 'lithium-kb');
    if (!fs.existsSync(globalSkillDir)) {
      fs.mkdirSync(globalSkillDir, { recursive: true });
    }

    const localSkillPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../SKILL.md');
    const skillContent = fs.existsSync(localSkillPath)
      ? fs.readFileSync(localSkillPath, 'utf8')
      : `---
name: lithium-kb
description: Generates, maintains, and visualizes a structured Markdown knowledge base (.lithium-kb/{architecture,debug,tasks,features}) with an interactive Neural Network graph, auto-watch mode, custom agent directives (.agentrules), and MCP server integration for Pi, Claude, Codex, Cursor, and other coding agents. Triggers automatically on tasks, bugs, or when the user mentions "kb", "knowledge base", "sync kb".
---

# Structured Agent Knowledge Base (lithium-kb)

When assigned a task or bug fix:
1. Consult .lithium-kb/ or PROJECT_KB.md before crawling files.
2. Record task updates in .lithium-kb/tasks/<name>.md and bug resolutions in .lithium-kb/debug/<name>.md.
3. Sync global index using 'npx @liulinnuha/lithium-kb'.
`;

    const targetSkillFile = path.join(globalSkillDir, 'SKILL.md');
    if (!fs.existsSync(targetSkillFile)) {
      fs.writeFileSync(targetSkillFile, skillContent, 'utf8');
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes global Pi agent skill registrations if present.
 */
function uninstallGlobalSkills() {
  const home = os.homedir();
  const uninstalled = [];
  const skillPaths = [
    path.join(home, '.agents', 'skills', 'lithium-kb'),
    path.join(home, '.agents', 'skills', 'agent-kb')
  ];

  for (const sp of skillPaths) {
    if (fs.existsSync(sp)) {
      try {
        fs.rmSync(sp, { recursive: true, force: true });
        uninstalled.push(sp);
      } catch {}
    }
  }
  return uninstalled;
}

/**
 * Uninstalls lithium-kb and agent-kb configurations from editors, workspace, and global skills.
 */
export function uninstallProject(cwd = process.cwd(), cleanFiles = false) {
  const isHome = isHomeOrRootDir(cwd);
  const results = {
    cleanedTargets: [],
    removedFiles: [],
    uninstalledSkills: []
  };

  // 1. Remove project-level configs
  if (!isHome) {
    const projectConfigs = getProjectAgentConfigs(cwd);
    for (const cfg of projectConfigs) {
      if (removeMcpConfig(cfg)) {
        results.cleanedTargets.push(cfg);
      }
    }
  }

  // 2. Clean files if requested
  if (cleanFiles) {
    const kbDir = path.join(cwd, '.lithium-kb');
    const legacyKbDir = path.join(cwd, '.agent-kb');
    const projectKb = path.join(cwd, 'PROJECT_KB.md');
    const ruleFiles = ['.agentrules', '.cursorrules', 'CLAUDE.md', '.windsurfrules'];

    if (fs.existsSync(kbDir)) {
      try {
        fs.rmSync(kbDir, { recursive: true, force: true });
        results.removedFiles.push(kbDir);
      } catch {}
    }
    if (fs.existsSync(legacyKbDir)) {
      try {
        fs.rmSync(legacyKbDir, { recursive: true, force: true });
        results.removedFiles.push(legacyKbDir);
      } catch {}
    }
    if (fs.existsSync(projectKb)) {
      try {
        fs.unlinkSync(projectKb);
        results.removedFiles.push(projectKb);
      } catch {}
    }
    for (const rf of ruleFiles) {
      const fullRf = path.join(cwd, rf);
      if (fs.existsSync(fullRf)) {
        try {
          fs.unlinkSync(fullRf);
          results.removedFiles.push(fullRf);
        } catch {}
      }
    }
  }

  // 3. Remove global editor configurations
  const globalConfigs = getGlobalAgentConfigs();
  for (const cfg of globalConfigs) {
    if (removeMcpConfig(cfg)) {
      results.cleanedTargets.push(cfg);
    }
  }

  // 4. Remove global agent skills
  results.uninstalledSkills = uninstallGlobalSkills();

  return results;
}

/**
 * Safely writes a rule file only if it doesn't already exist.
 * @param {string} filePath
 * @param {string} content
 * @param {object} results
 */
function safelyCreateRuleFile(filePath, content, results) {
  const relName = path.basename(filePath);
  if (fs.existsSync(filePath)) {
    results.preservedFiles.push(relName);
  } else {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      results.createdFiles.push(relName);
      if (relName === '.agentrules') {
        results.agentRulesCreated = true;
      }
    } catch (err) {
      results.errors.push(`Failed to create ${relName}: ${err.message}`);
    }
  }
}

/**
 * Runs adaptive agent setup targeted specifically to the user's detected active editor/agent.
 * Never overwrites existing user files.
 */
export function initializeProject(cwd = process.cwd()) {
  const isHome = isHomeOrRootDir(cwd);

  const results = {
    isHomeDir: isHome,
    kbInitialized: false,
    agentRulesCreated: false,
    detectedAgents: [],
    createdFiles: [],
    preservedFiles: [],
    configuredTargets: [],
    errors: []
  };

  // If run in HOME or ROOT, skip creating project knowledge files
  if (isHome) {
    return results;
  }

  // 1. Initialize structured knowledge base directory and starter files (without overwriting)
  try {
    ensureKnowledgeBaseStructure(cwd);
    results.kbInitialized = true;

    const projectKbPath = path.join(cwd, 'PROJECT_KB.md');
    if (fs.existsSync(projectKbPath)) {
      results.preservedFiles.push('PROJECT_KB.md');
      generateMarkdownKB(cwd, false);
    } else {
      generateMarkdownKB(cwd, true);
      results.createdFiles.push('PROJECT_KB.md');
    }
  } catch (err) {
    results.errors.push(`Failed to initialize knowledge structure: ${err.message}`);
  }

  // 2. Detect active agent & IDE environments
  const detected = detectEnvironmentAgents(cwd);
  results.detectedAgents = Array.from(detected);

  // 3. Adapt rule files and workspace MCP to detected environments
  if (detected.size === 0) {
    // Universal fallback: create standard .agentrules without cluttering editor-specific folders
    safelyCreateRuleFile(path.join(cwd, '.agentrules'), DEFAULT_RULES, results);
  } else {
    // 3a. Cursor
    if (detected.has('cursor')) {
      safelyCreateRuleFile(path.join(cwd, '.cursorrules'), DEFAULT_RULES, results);
      const cursorTarget = {
        name: 'Cursor',
        agent: 'cursor',
        type: 'mcpServers',
        path: path.join(cwd, '.cursor', 'mcp.json'),
        global: false
      };
      const inj = injectMcpConfig(cursorTarget);
      if (inj.success) {
        results.configuredTargets.push(cursorTarget);
      } else if (inj.reason) {
        results.errors.push(inj.reason);
      }
    }

    // 3b. Claude Code CLI / Claude Desktop
    if (detected.has('claude')) {
      safelyCreateRuleFile(path.join(cwd, 'CLAUDE.md'), DEFAULT_RULES, results);
      const globalConfigs = getGlobalAgentConfigs();
      for (const cfg of globalConfigs) {
        if (cfg.agent === 'claude' && (fs.existsSync(cfg.path) || fs.existsSync(path.dirname(cfg.path)))) {
          const inj = injectMcpConfig(cfg);
          if (inj.success) results.configuredTargets.push(cfg);
        }
      }
    }

    // 3c. Windsurf
    if (detected.has('windsurf')) {
      safelyCreateRuleFile(path.join(cwd, '.windsurfrules'), DEFAULT_RULES, results);
      const wsTarget = {
        name: 'Windsurf (Workspace)',
        agent: 'windsurf',
        type: 'mcpServers',
        path: path.join(cwd, '.windsurf', 'mcp.json'),
        global: false
      };
      if (fs.existsSync(path.join(cwd, '.windsurf')) || process.env.TERM_PROGRAM === 'windsurf') {
        const inj = injectMcpConfig(wsTarget);
        if (inj.success) results.configuredTargets.push(wsTarget);
      }
      const globalConfigs = getGlobalAgentConfigs();
      for (const cfg of globalConfigs) {
        if (cfg.agent === 'windsurf' && (fs.existsSync(cfg.path) || fs.existsSync(path.dirname(cfg.path)))) {
          const inj = injectMcpConfig(cfg);
          if (inj.success) results.configuredTargets.push(cfg);
        }
      }
    }

    // 3d. VS Code
    if (detected.has('vscode')) {
      const vscodeTarget = {
        name: 'VS Code (Workspace)',
        agent: 'vscode',
        type: 'mcpServers',
        path: path.join(cwd, '.vscode', 'mcp.json'),
        global: false
      };
      const inj = injectMcpConfig(vscodeTarget);
      if (inj.success) results.configuredTargets.push(vscodeTarget);

      // Check global Cline / Roo Code extensions
      const globalConfigs = getGlobalAgentConfigs();
      for (const cfg of globalConfigs) {
        if (cfg.agent === 'vscode' && (fs.existsSync(cfg.path) || fs.existsSync(path.dirname(cfg.path)))) {
          const ginj = injectMcpConfig(cfg);
          if (ginj.success) results.configuredTargets.push(cfg);
        }
      }

      // If no rule file exists at all in workspace, create .agentrules
      if (
        !fs.existsSync(path.join(cwd, '.agentrules')) &&
        !fs.existsSync(path.join(cwd, '.cursorrules')) &&
        !fs.existsSync(path.join(cwd, 'CLAUDE.md')) &&
        !fs.existsSync(path.join(cwd, '.windsurfrules'))
      ) {
        safelyCreateRuleFile(path.join(cwd, '.agentrules'), DEFAULT_RULES, results);
      }
    }

    // 3e. Zed
    if (detected.has('zed')) {
      const zedTarget = {
        name: 'Zed (Workspace)',
        agent: 'zed',
        type: 'zedContextServers',
        path: path.join(cwd, '.zed', 'settings.json'),
        global: false
      };
      if (fs.existsSync(path.join(cwd, '.zed')) || process.env.TERM_PROGRAM === 'zed') {
        const inj = injectMcpConfig(zedTarget);
        if (inj.success) results.configuredTargets.push(zedTarget);
      }
      const globalConfigs = getGlobalAgentConfigs();
      for (const cfg of globalConfigs) {
        if (cfg.agent === 'zed' && (fs.existsSync(cfg.path) || fs.existsSync(path.dirname(cfg.path)))) {
          const inj = injectMcpConfig(cfg);
          if (inj.success) results.configuredTargets.push(cfg);
        }
      }
    }

    // 3f. Pi
    if (detected.has('pi')) {
      safelyCreateRuleFile(path.join(cwd, '.agentrules'), DEFAULT_RULES, results);
      if (ensureGlobalAgentSkill()) {
        results.configuredTargets.push({
          name: 'Pi Agent Skill (~/.agents/skills/lithium-kb)',
          type: 'skill',
          path: path.join(os.homedir(), '.agents', 'skills', 'lithium-kb', 'SKILL.md'),
          global: true
        });
      }
    }
  }

  return results;
}

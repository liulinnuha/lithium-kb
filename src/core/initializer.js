import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ensureKnowledgeBaseStructure, generateMarkdownKB } from './generator.js';

const MCP_COMMAND = 'npx';
const MCP_ARGS = ['-y', '@liulinnuha/lithium-kb', '--mcp'];

/**
 * Safely reads and parses JSON, or returns a default fallback.
 */
function readJsonSafe(filePath, fallback = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch {
    // Return fallback if corrupted or empty
  }
  return fallback;
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
    type: 'mcpServers',
    path: claudeConfigPath,
    global: true
  });

  // 2. Windsurf (Codeium)
  let windsurfConfigPath;
  if (platform === 'darwin' || platform === 'linux') {
    windsurfConfigPath = path.join(home, '.codeium', 'windsurf', 'mcp_config.json');
  } else if (platform === 'win32') {
    windsurfConfigPath = path.join(home, '.codeium', 'windsurf', 'mcp_config.json');
  }
  if (windsurfConfigPath) {
    configs.push({
      name: 'Windsurf',
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
      type: 'mcpServers',
      path: path.join(cwd, '.cursor', 'mcp.json'),
      global: false
    },
    {
      name: 'Windsurf (Workspace)',
      type: 'mcpServers',
      path: path.join(cwd, '.windsurf', 'mcp.json'),
      global: false
    },
    {
      name: 'Zed (Workspace)',
      type: 'zedContextServers',
      path: path.join(cwd, '.zed', 'settings.json'),
      global: false
    },
    {
      name: 'VS Code (Workspace)',
      type: 'mcpServers',
      path: path.join(cwd, '.vscode', 'mcp.json'),
      global: false
    }
  ];
}

/**
 * Injects lithium-kb configuration into an editor config file.
 */
function injectMcpConfig(target) {
  try {
    const data = readJsonSafe(target.path, {});

    if (target.type === 'zedContextServers') {
      data.context_servers = data.context_servers || {};
      data.context_servers['lithium-kb'] = {
        command: {
          path: MCP_COMMAND,
          args: MCP_ARGS
        }
      };
    } else {
      data.mcpServers = data.mcpServers || {};
      data.mcpServers['lithium-kb'] = {
        command: MCP_COMMAND,
        args: MCP_ARGS
      };
    }

    writeJsonSafe(target.path, data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Runs one-click agent setup across project workspace & detected editors.
 */
export function initializeProject(cwd = process.cwd()) {
  const results = {
    kbInitialized: false,
    agentRulesCreated: false,
    configuredTargets: [],
    errors: []
  };

  // 1. Initialize .agent-kb/ and PROJECT_KB.md
  try {
    ensureKnowledgeBaseStructure(cwd);
    generateMarkdownKB(cwd);
    results.kbInitialized = true;
  } catch (err) {
    results.errors.push(`Failed to initialize knowledge structure: ${err.message}`);
  }

  // 2. Create .agentrules if not present
  try {
    const agentRulesPath = path.join(cwd, '.agentrules');
    if (!fs.existsSync(agentRulesPath)) {
      const defaultRules = `# Agent Navigation Directives
1. Zero Blind Crawling: Consult .agent-kb/ or PROJECT_KB.md before crawling files.
2. Record Learnings: Store bug fixes to .agent-kb/debug/ and tasks to .agent-kb/tasks/.
3. Deterministic Context: Use lithium-kb MCP tools for fast retrieval.
`;
      fs.writeFileSync(agentRulesPath, defaultRules, 'utf8');
      results.agentRulesCreated = true;
    }
  } catch (err) {
    results.errors.push(`Failed to write .agentrules: ${err.message}`);
  }

  // 3. Configure Project-Level MCP (Cursor, Workspace MCP)
  const projectConfigs = getProjectAgentConfigs(cwd);
  for (const cfg of projectConfigs) {
    // Always configure Cursor project config by default
    if (cfg.name === 'Cursor') {
      if (injectMcpConfig(cfg)) {
        results.configuredTargets.push(cfg);
      }
    }
  }

  // 4. Detect and configure existing global editors/agents
  const globalConfigs = getGlobalAgentConfigs();
  for (const cfg of globalConfigs) {
    const parentDir = path.dirname(cfg.path);
    // If the editor's app directory exists, configure it
    if (fs.existsSync(parentDir) || fs.existsSync(cfg.path)) {
      if (injectMcpConfig(cfg)) {
        results.configuredTargets.push(cfg);
      }
    }
  }

  return results;
}

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
 * Checks if a given directory is the user's home directory or filesystem root.
 */
export function isHomeOrRootDir(dir) {
  const resolved = path.resolve(dir);
  const home = path.resolve(os.homedir());
  const root = path.parse(resolved).root;
  return resolved === home || resolved === root;
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
  if (platform === 'darwin' || platform === 'linux' || platform === 'win32') {
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
 * Injects lithium-kb configuration into an editor config file (and upgrades legacy agent-kb entries).
 */
function injectMcpConfig(target) {
  try {
    const data = readJsonSafe(target.path, {});

    if (target.type === 'zedContextServers') {
      data.context_servers = data.context_servers || {};
      delete data.context_servers['agent-kb']; // Clean up legacy
      data.context_servers['lithium-kb'] = {
        command: MCP_COMMAND,
        args: MCP_ARGS
      };
    } else {
      data.mcpServers = data.mcpServers || {};
      delete data.mcpServers['agent-kb']; // Clean up legacy
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
 * Removes lithium-kb and legacy agent-kb configurations from an editor config file.
 */
function removeMcpConfig(target) {
  try {
    if (!fs.existsSync(target.path)) return false;
    const data = readJsonSafe(target.path, {});
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

    if (cleanFiles) {
      const kbDir = path.join(cwd, '.agent-kb');
      const projectKb = path.join(cwd, 'PROJECT_KB.md');
      const agentRules = path.join(cwd, '.agentrules');

      if (fs.existsSync(kbDir)) {
        try {
          fs.rmSync(kbDir, { recursive: true, force: true });
          results.removedFiles.push(kbDir);
        } catch {}
      }
      if (fs.existsSync(projectKb)) {
        try {
          fs.unlinkSync(projectKb);
          results.removedFiles.push(projectKb);
        } catch {}
      }
      if (fs.existsSync(agentRules)) {
        try {
          fs.unlinkSync(agentRules);
          results.removedFiles.push(agentRules);
        } catch {}
      }
    }
  }

  // 2. Remove global editor configurations
  const globalConfigs = getGlobalAgentConfigs();
  for (const cfg of globalConfigs) {
    if (removeMcpConfig(cfg)) {
      results.cleanedTargets.push(cfg);
    }
  }

  // 3. Remove global agent skills
  results.uninstalledSkills = uninstallGlobalSkills();

  return results;
}

/**
 * Runs one-click agent setup across project workspace & detected editors.
 */
export function initializeProject(cwd = process.cwd()) {
  const isHome = isHomeOrRootDir(cwd);

  const results = {
    isHomeDir: isHome,
    kbInitialized: false,
    agentRulesCreated: false,
    configuredTargets: [],
    errors: []
  };

  // If run in HOME or ROOT, skip creating project knowledge files
  if (!isHome) {
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
1. Zero Blind Crawling: When starting, read .agent-kb/ or PROJECT_KB.md before broad codebase crawling.
2. Auto-Generate Knowledge: If .agent-kb/ or PROJECT_KB.md is missing, run 'npx @liulinnuha/lithium-kb' or initialize it immediately.
3. Record Learnings: Store bug fixes to .agent-kb/debug/ and task updates to .agent-kb/tasks/.
4. Trigger Keywords: Trigger updates or scans on "kb", "knowledge base", "sync kb", "architecture", "debug note".
5. Deterministic Context: Use lithium-kb MCP tools for targeted retrieval.
`;
        fs.writeFileSync(agentRulesPath, defaultRules, 'utf8');
        results.agentRulesCreated = true;
      }
    } catch (err) {
      results.errors.push(`Failed to write .agentrules: ${err.message}`);
    }

    // 3. Configure Project-Level MCP (Cursor)
    const projectConfigs = getProjectAgentConfigs(cwd);
    for (const cfg of projectConfigs) {
      if (cfg.name === 'Cursor') {
        if (injectMcpConfig(cfg)) {
          results.configuredTargets.push(cfg);
        }
      }
    }
  }

  // 4. Detect and configure existing global editors/agents
  const globalConfigs = getGlobalAgentConfigs();
  for (const cfg of globalConfigs) {
    const parentDir = path.dirname(cfg.path);
    if (fs.existsSync(parentDir) || fs.existsSync(cfg.path)) {
      if (injectMcpConfig(cfg)) {
        results.configuredTargets.push(cfg);
      }
    }
  }

  return results;
}

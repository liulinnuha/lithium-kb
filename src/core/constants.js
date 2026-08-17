export const DEFAULT_IGNORED_DIRS = [
  'node_modules', '.git', '.next', 'dist', 'build', 'out',
  'coverage', '.venv', '__pycache__', 'target', '.turbo', '.cache'
];

export const MAX_DEPTH = 4;
export const MAX_SAMPLE_FILES = 60;
export const KB_DIR_NAME = '.lithium-kb';
export const LEGACY_KB_DIR_NAME = '.agent-kb';

export const KB_CATEGORIES = [
  'architecture',
  'debug',
  'tasks',
  'features'
];

export const CATEGORY_ICONS = {
  architecture: '📁',
  debug: '🐛',
  tasks: '📋',
  features: '✨'
};

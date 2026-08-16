export interface ProjectMemoryItem {
  type: 'dir' | 'file';
  path: string;
  depth: number;
  size?: number;
}

export interface SymbolExport {
  file: string;
  exports: string[];
}

export interface KnowledgeDocument {
  category: 'architecture' | 'debug' | 'tasks' | 'features';
  filename: string;
  relPath: string;
  title: string;
  content: string;
  size: number;
}

export interface GraphNode {
  id: string;
  label: string;
  group: 'core' | 'category' | 'doc' | 'file' | 'symbol' | 'item';
  val: number;
  color?: string;
  path?: string;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}

export interface ProjectKnowledgeBaseResult {
  markdown: string;
  rootName: string;
  projectType: string;
  gitBranch: string;
  docs: Record<string, KnowledgeDocument[]>;
  filesCount: number;
  graph: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
}

export function generateMarkdownKB(cwd: string): ProjectKnowledgeBaseResult;
export function buildNeuralGraphData(cwd: string): { nodes: GraphNode[]; links: GraphLink[] };
export function scanStructuredKnowledgeDocs(cwd: string): Record<string, KnowledgeDocument[]>;
export function ensureKnowledgeBaseStructure(cwd: string): string;
export function startServer(cwd: string, port?: number): import('node:http').Server;
export function startMcpServer(cwd: string): void;
export function startFileWatcher(cwd: string, onUpdate?: (data: ProjectKnowledgeBaseResult) => void): import('node:fs').FSWatcher;

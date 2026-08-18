import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import { generateMarkdownKB, resolveKbDirectory, scanStructuredKnowledgeDocs, searchKnowledgeBase } from '../core/generator.js';
import { scanTree, extractKeySymbols } from '../core/scanner.js';
import { KB_DIR_NAME, KB_CATEGORIES } from '../core/constants.js';

function notifyEvent(event) {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3030;
  try {
    fetch(`http://127.0.0.1:${port}/api/access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }).catch(() => {});
  } catch {}
}

/**
 * Starts stdio Model Context Protocol (JSON-RPC 2.0) Server.
 * @param {string} cwd
 */
export function startMcpServer(cwd) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

  function sendJsonRpc(obj) {
    process.stdout.write(JSON.stringify(obj) + '\n');
  }

  rl.on('line', (line) => {
    if (!line.trim()) return;
    try {
      const req = JSON.parse(line);
      const { id, method, params } = req;

      if (method === 'initialize') {
        sendJsonRpc({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: { name: 'lithium-kb', version: '1.3.0' },
            capabilities: { tools: {}, resources: {} }
          }
        });
      } else if (method === 'resources/list') {
        const docs = scanStructuredKnowledgeDocs(cwd);
        const resources = [];
        for (const cat of KB_CATEGORIES) {
          for (const doc of docs[cat] || []) {
            resources.push({
              uri: `lithium-kb://${doc.category}/${doc.filename}`,
              name: `${doc.category}/${doc.filename}`,
              description: doc.title || `${doc.category}/${doc.filename}`,
              mimeType: 'text/markdown'
            });
          }
        }
        sendJsonRpc({
          jsonrpc: '2.0',
          id,
          result: { resources }
        });
      } else if (method === 'resources/read') {
        const uri = params?.uri || '';
        const match = uri.replace(/^lithium-kb:\/\//, '').split('/');
        const category = match[0];
        const filename = match.slice(1).join('/');
        const docPath = KB_CATEGORIES.includes(category) && filename
          ? path.join(resolveKbDirectory(cwd), category, path.basename(filename))
          : null;

        if (docPath && fs.existsSync(docPath)) {
          const content = fs.readFileSync(docPath, 'utf8');
          sendJsonRpc({
            jsonrpc: '2.0',
            id,
            result: {
              contents: [{ uri, mimeType: 'text/markdown', text: content }]
            }
          });
        } else {
          sendJsonRpc({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Resource not found: ${uri}` }
          });
        }
      } else if (method === 'tools/list') {
        sendJsonRpc({
          jsonrpc: '2.0',
          id,
          result: {
            tools: [
              {
                name: 'get_project_memory',
                description: 'Get concise architecture, stack, directory map, and entry points of the project to save tokens.',
                inputSchema: { type: 'object', properties: {} }
              },
              {
                name: 'list_knowledge_docs',
                description: 'List all documents in a knowledge base category.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    category: { type: 'string', enum: ['architecture', 'debug', 'tasks', 'features'] }
                  }
                }
              },
              {
                name: 'read_knowledge_doc',
                description: 'Read a specific structured knowledge doc from .lithium-kb/ (e.g. debug/quickstart-diagnostics.md, tasks/initial-setup.md).',
                inputSchema: {
                  type: 'object',
                  properties: {
                    category: { type: 'string', enum: ['architecture', 'debug', 'tasks', 'features'] },
                    filename: { type: 'string' }
                  },
                  required: ['category', 'filename']
                }
              },
              {
                name: 'write_knowledge_doc',
                description: 'Create or update a structured knowledge doc in .lithium-kb/ (e.g., logging a resolved debug note or task).',
                inputSchema: {
                  type: 'object',
                  properties: {
                    category: { type: 'string', enum: ['architecture', 'debug', 'tasks', 'features'] },
                    filename: { type: 'string' },
                    content: { type: 'string' }
                  },
                  required: ['category', 'filename', 'content']
                }
              },
              {
                name: 'search_knowledge_base',
                description: 'Ranked search across structured knowledge base documents returning matching snippets, categories, and titles.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Search query' },
                    category: { type: 'string', enum: ['architecture', 'debug', 'tasks', 'features'] }
                  },
                  required: ['query']
                }
              },
              {
                name: 'query_symbol_map',
                description: 'Lookup exported functions, classes, and types for files.',
                inputSchema: { type: 'object', properties: { filePattern: { type: 'string' } } }
              }
            ]
          }
        });
      } else if (method === 'tools/call') {
        const toolName = params?.name;
        const args = params?.arguments || {};

        if (toolName === 'list_knowledge_docs') {
          const safeCategory = ['architecture', 'debug', 'tasks', 'features'].includes(args.category) ? args.category : 'architecture';
          const dir = path.join(resolveKbDirectory(cwd), safeCategory);
          const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.md')) : [];
          notifyEvent({
            id: Date.now(),
            nodeId: `list-${safeCategory}`,
            label: `${safeCategory}/`,
            query: `List ${safeCategory} docs`,
            agent: 'MCP Coding Agent',
            time: new Date().toLocaleTimeString(),
            tokensSaved: 500
          });
          sendJsonRpc({
            jsonrpc: '2.0',
            id,
            result: { content: [{ type: 'text', text: JSON.stringify(files) }] }
          });
        } else if (toolName === 'get_project_memory') {
          const data = generateMarkdownKB(cwd);
          notifyEvent({
            id: Date.now(),
            nodeId: 'node-root',
            label: 'Agent Core Memory',
            query: 'Read global index',
            agent: 'MCP Coding Agent',
            time: new Date().toLocaleTimeString(),
            tokensSaved: 1650
          });
          sendJsonRpc({
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: data.markdown }]
            }
          });
        } else if (toolName === 'read_knowledge_doc') {
          const safeFilename = path.basename(args.filename || '');
          const safeCategory = ['architecture', 'debug', 'tasks', 'features'].includes(args.category) ? args.category : 'architecture';
          const docPath = path.join(resolveKbDirectory(cwd), safeCategory, safeFilename);
          if (fs.existsSync(docPath)) {
            const content = fs.readFileSync(docPath, 'utf8');
            notifyEvent({
              id: Date.now(),
              nodeId: `doc-${safeCategory.slice(0, 4)}-${safeFilename}`,
              label: `${safeCategory}/${safeFilename}`,
              query: `Read ${safeCategory}/${safeFilename}`,
              agent: 'MCP Coding Agent',
              time: new Date().toLocaleTimeString(),
              tokensSaved: 1400
            });
            sendJsonRpc({
              jsonrpc: '2.0',
              id,
              result: { content: [{ type: 'text', text: content }] }
            });
          } else {
            sendJsonRpc({
              jsonrpc: '2.0',
              id,
              result: { isError: true, content: [{ type: 'text', text: `Document not found: ${safeCategory}/${safeFilename}` }] }
            });
          }
        } else if (toolName === 'write_knowledge_doc') {
          const safeFilename = path.basename(args.filename || '');
          const safeCategory = ['architecture', 'debug', 'tasks', 'features'].includes(args.category) ? args.category : 'tasks';
          const targetDir = path.join(resolveKbDirectory(cwd), safeCategory);
          if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
          const docPath = path.join(targetDir, safeFilename);
          fs.writeFileSync(docPath, args.content || '', 'utf8');
          generateMarkdownKB(cwd);
          notifyEvent({
            id: Date.now(),
            nodeId: `cat-${safeCategory}`,
            label: `${safeCategory}/${safeFilename}`,
            query: `Saved ${safeCategory}/${safeFilename}`,
            agent: 'MCP Coding Agent',
            time: new Date().toLocaleTimeString(),
            tokensSaved: 950
          });
          sendJsonRpc({
            jsonrpc: '2.0',
            id,
            result: { content: [{ type: 'text', text: `Successfully saved ${safeCategory}/${safeFilename}` }] }
          });
        } else if (toolName === 'search_knowledge_base') {
          const query = args.query || '';
          const results = searchKnowledgeBase(cwd, query, { category: args.category, limit: 6 });
          notifyEvent({
            id: Date.now(),
            nodeId: 'node-root',
            label: 'Search Knowledge Base',
            query: `Search: ${query}`,
            agent: 'MCP Coding Agent',
            time: new Date().toLocaleTimeString(),
            tokensSaved: 1250
          });
          sendJsonRpc({
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: JSON.stringify(results, null, 2) }]
            }
          });
        } else if (toolName === 'query_symbol_map') {
          const items = scanTree(cwd, cwd);
          const files = items.filter(i => i.type === 'file');
          const symbols = extractKeySymbols(cwd, files);
          const filtered = args.filePattern ? symbols.filter(s => s.file.includes(args.filePattern)) : symbols;
          notifyEvent({
            id: Date.now(),
            nodeId: 'cat-code',
            label: 'Codebase Symbols',
            query: `Symbol search: ${args.filePattern || 'all'}`,
            agent: 'MCP Coding Agent',
            time: new Date().toLocaleTimeString(),
            tokensSaved: 1100
          });
          sendJsonRpc({
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: JSON.stringify(filtered, null, 2) }]
            }
          });
        } else {
          sendJsonRpc({
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Tool not found: ${toolName}` }
          });
        }
      } else {
        sendJsonRpc({ jsonrpc: '2.0', id, result: {} });
      }
    } catch (err) {
      sendJsonRpc({ jsonrpc: '2.0', id: null, error: { code: -32700, message: err.message } });
    }
  });
}

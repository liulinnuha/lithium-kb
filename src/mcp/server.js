import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import { generateMarkdownKB } from '../core/generator.js';
import { scanTree, extractKeySymbols } from '../core/scanner.js';
import { KB_DIR_NAME } from '../core/constants.js';
import { globalSseBroker } from '../server/sse.js';

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
            serverInfo: { name: 'lithium-kb', version: '1.1.0' },
            capabilities: { tools: {} }
          }
        });
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
                name: 'read_knowledge_doc',
                description: 'Read a specific structured knowledge doc from .agent-kb/ (e.g. debug/1.debug-1.md, tasks/1.task-1.md).',
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
                description: 'Create or update a structured knowledge doc in .agent-kb/ (e.g., logging a resolved debug note or task).',
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

        if (toolName === 'get_project_memory') {
          const data = generateMarkdownKB(cwd);
          globalSseBroker.broadcast({
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
          const docPath = path.join(cwd, KB_DIR_NAME, args.category, args.filename);
          if (fs.existsSync(docPath)) {
            const content = fs.readFileSync(docPath, 'utf8');
            globalSseBroker.broadcast({
              id: Date.now(),
              nodeId: `doc-${args.category.slice(0, 4)}-${args.filename}`,
              label: `${args.category}/${args.filename}`,
              query: `Read ${args.category}/${args.filename}`,
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
              error: { code: -32602, message: `Document not found: ${args.category}/${args.filename}` }
            });
          }
        } else if (toolName === 'write_knowledge_doc') {
          const targetDir = path.join(cwd, KB_DIR_NAME, args.category);
          if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
          const docPath = path.join(targetDir, args.filename);
          fs.writeFileSync(docPath, args.content, 'utf8');
          generateMarkdownKB(cwd);
          globalSseBroker.broadcast({
            id: Date.now(),
            nodeId: `cat-${args.category}`,
            label: `${args.category}/${args.filename}`,
            query: `Saved ${args.category}/${args.filename}`,
            agent: 'MCP Coding Agent',
            time: new Date().toLocaleTimeString(),
            tokensSaved: 950
          });
          sendJsonRpc({
            jsonrpc: '2.0',
            id,
            result: { content: [{ type: 'text', text: `Successfully saved ${args.category}/${args.filename}` }] }
          });
        } else if (toolName === 'query_symbol_map') {
          const items = scanTree(cwd, cwd);
          const files = items.filter(i => i.type === 'file');
          const symbols = extractKeySymbols(cwd, files);
          const filtered = args.filePattern ? symbols.filter(s => s.file.includes(args.filePattern)) : symbols;
          globalSseBroker.broadcast({
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

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateMarkdownKB, buildNeuralGraphData } from '../core/generator.js';
import { globalSseBroker } from './sse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UI_DIR = path.resolve(__dirname, '../ui');

/**
 * Creates and starts the HTTP / SSE server.
 * @param {string} cwd
 * @param {number} port
 * @returns {http.Server}
 */
export function startServer(cwd, port = 3030) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // Static Assets
    if (pathname === '/' && req.method === 'GET') {
      const data = generateMarkdownKB(cwd, false);
      data.cumulativeTokensSaved = globalSseBroker.getTokensSaved();

      const htmlPath = path.join(UI_DIR, 'index.html');
      let html = fs.readFileSync(htmlPath, 'utf8');
      const injection = `window.__INITIAL_DATA__ = ${JSON.stringify(data)};`;
      html = html.replace('/* __INITIAL_DATA_PLACEHOLDER__ */', injection);

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } else if (pathname === '/styles.css' && req.method === 'GET') {
      const cssPath = path.join(UI_DIR, 'styles.css');
      res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
      res.end(fs.readFileSync(cssPath, 'utf8'));
    } else if (pathname === '/app.js' && req.method === 'GET') {
      const jsPath = path.join(UI_DIR, 'app.js');
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end(fs.readFileSync(jsPath, 'utf8'));
    }

    // API Routes
    else if (pathname === '/api/stream' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      globalSseBroker.addClient(res);
      req.on('close', () => globalSseBroker.removeClient(res));
    } else if (pathname === '/api/kb' && req.method === 'GET') {
      const data = generateMarkdownKB(cwd, false);
      data.cumulativeTokensSaved = globalSseBroker.getTokensSaved();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } else if (pathname === '/api/doc' && req.method === 'GET') {
      const docPath = url.searchParams.get('path');
      if (docPath) {
        const resolvedPath = path.resolve(cwd, docPath);
        // Security: Prevent path traversal outside project root
        if (resolvedPath.startsWith(path.resolve(cwd)) && fs.existsSync(resolvedPath)) {
          const content = fs.readFileSync(resolvedPath, 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ path: docPath, content }));
          return;
        }
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Doc not found' }));
    } else if (pathname === '/api/graph' && req.method === 'GET') {
      const graph = buildNeuralGraphData(cwd);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(graph));
    } else if (pathname === '/api/events' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(globalSseBroker.getHistory()));
    } else if (pathname === '/api/access' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const event = {
            id: Date.now(),
            nodeId: payload.nodeId || 'cat-tasks',
            label: payload.label || 'Structured Memory',
            query: payload.query || 'Agent Memory Access',
            agent: payload.agent || 'Coding Agent',
            time: new Date().toLocaleTimeString(),
            tokensSaved: payload.tokensSaved || 750
          };
          globalSseBroker.broadcast(event);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, event, cumulativeTokensSaved: globalSseBroker.getTokensSaved() }));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else if (pathname === '/api/regenerate' && req.method === 'POST') {
      const data = generateMarkdownKB(cwd, false);
      data.cumulativeTokensSaved = globalSseBroker.getTokensSaved();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  });

  server.listen(port, () => {
    console.log(`\n🚀 Agent Neural Knowledge Graph active at: http://localhost:${port}`);
    console.log(`Press Ctrl+C to stop.`);
  });

  return server;
}

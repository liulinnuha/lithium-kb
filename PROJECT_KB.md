# Project Knowledge Base: lithium-kb

## 1. Overview
- **Description:** Fast, in-memory structured markdown knowledge base (.agent-kb/) with 2D neural graph visualization, live SSE activity stream, and MCP stdio integration.
- **Root:** `lithium-kb`
- **Stack:** Node.js / JavaScript / TypeScript
- **Structured Knowledge Base:** `.agent-kb/`

## 2. Structured Knowledge Directory (.agent-kb/)

| Category | Documents | Purpose |
| :--- | :--- | :--- |
| **architecture/** | `1.overview.md` | System topology, services, APIs |
| **tasks/** | `1.task-initial-setup.md` | Active tasks, backlog, completed work |
| **debug/** | `1.debug-quickstart.md` | Resolved incidents, root-cause notes |
| **features/** | `1.feature-neural-graph.md` | Feature specifications & requirements |

## 3. Common Commands
```sh
npm run start # node bin/cli.js --ui
npm run generate # node bin/cli.js
npm run watch # node bin/cli.js --watch
npm run mcp # node bin/cli.js --mcp
npm run test # node --test
```

## 4. Directory Map
```text
📄 CONTRIBUTING.md
📄 LICENSE
📄 PROJECT_KB.md
📄 README.md
📄 SKILL.md
📁 bin
  📄 cli.js
📄 package.json
📁 src
  📁 core
    📄 constants.js
    📄 generator.js
    📄 scanner.js
    📄 types.d.ts
  📁 mcp
    📄 server.js
  📁 server
    📄 http.js
    📄 sse.js
    📄 watcher.js
  📁 ui
    📄 app.js
    📄 index.html
    📄 styles.css
📁 test
  📄 generator.test.js
  📄 http.test.js
  📄 mcp.test.js
  📄 scanner.test.js
```

## 5. Key Entry Points & Signatures
### `src/core/constants.js`
```ts
const DEFAULT_IGNORED_DIRS = [
const MAX_DEPTH = 4;
const MAX_SAMPLE_FILES = 60;
const KB_DIR_NAME = '.agent-kb';
const KB_CATEGORIES = [
const CATEGORY_ICONS = {
```
### `src/core/generator.js`
```ts
function ensureKnowledgeBaseStructure(cwd) {
function scanStructuredKnowledgeDocs(cwd) {
function buildNeuralGraphData(cwd) {
function generateMarkdownKB(cwd) {
```
### `src/core/scanner.js`
```ts
function getIgnoredSet(cwd) {
function getCustomAgentRules(cwd) {
function detectProjectType(cwd) {
function getPackageScripts(cwd) {
function scanTree(dir, rootDir, depth = 0, summary = [], ignoredSet = null) {
function extractKeySymbols(cwd, files) {
```
### `src/core/types.d.ts`
```ts
interface ProjectMemoryItem {
interface SymbolExport {
interface KnowledgeDocument {
interface GraphNode {
interface GraphLink {
interface ProjectKnowledgeBaseResult {
```
### `src/mcp/server.js`
```ts
function startMcpServer(cwd) {
```
### `src/server/http.js`
```ts
function startServer(cwd, port = 3030) {
```
### `src/server/sse.js`
```ts
class SseBroker {
const globalSseBroker = new SseBroker();
```
### `src/server/watcher.js`
```ts
function startFileWatcher(cwd, onUpdate) {
```
### `src/ui/app.js`
```ts
function initGraphData() {
function renderKbTree(filter = '') {
function filterKbTree(query) {
async function loadDoc(relPath) {
function loadMainIndex() {
function resize() {
```

## 6. Agent Navigation Rules
1. **Surgical Memory**: Read `.agent-kb/tasks/`, `.agent-kb/debug/`, or `.agent-kb/features/` doc before code crawling.
2. **Record Learnings**: When fixing bugs, save to `.agent-kb/debug/N.<issue>.md`. When finishing tasks, update `.agent-kb/tasks/`.
3. **Deterministic Output**: Do not emit dynamic date timestamps or ephemeral session headers in generated knowledge files.

### Custom Project Directives (.agentrules)
```text
# lithium-kb Agent Directives
1. Zero Runtime Dependencies: Always use Node.js standard library (node:*).
2. Deterministic Knowledge Generation: Never emit dynamic timestamps or session headers in PROJECT_KB.md or .agent-kb/ files to avoid unnecessary git diff churn.
3. Modular Memory: Keep .agent-kb/ organized under architecture/, debug/, tasks/, features/.
4. Comprehensive Testing: Keep test coverage using Node's native test runner (node --test).
```

# Project Knowledge Base: lithium-kb

> Generated on 2026-08-16 | Branch: `N/A` | Stack: **Node.js / JavaScript / TypeScript**

## 1. Overview
- **Description:** Fast markdown knowledge base generator and agent skill with interactive Neural Network Graph for token-efficient coding agents
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
npm run test # node --test
npm run test:watch # node --test --watch
npm run start # node ./bin/agent-kb.js --ui
npm run generate # node ./bin/agent-kb.js
npm run ui # node ./bin/agent-kb.js --ui
npm run watch # node ./bin/agent-kb.js --watch
npm run mcp # node ./bin/agent-kb.js --mcp
```

## 4. Directory Map
```text
📄 CONTRIBUTING.md
📄 LICENSE
📄 PROJECT_KB.md
📄 README.md
📄 SKILL.md
📁 bin
  📄 agent-kb.js
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
  📄 scanner.test.js
📁 test_project
  📁 .agent-kb
    📁 architecture
    📁 debug
    📁 features
    📁 tasks
  📄 PROJECT_KB.md
  📄 package.json
  📄 server.log
  📁 src
    📄 agent-router.ts
    📄 index.ts
    📄 memory-engine.ts
    📄 quantum-scheduler.ts
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
### `test_project/src/agent-router.ts`
```ts
class AgentRouter {
```

## 6. Agent Navigation Rules
1. **Surgical Memory**: Read `.agent-kb/tasks/`, `.agent-kb/debug/`, or `.agent-kb/features/` doc before code crawling.
2. **Record Learnings**: When fixing bugs, save to `.agent-kb/debug/N.<issue>.md`. When finishing tasks, update `.agent-kb/tasks/`.

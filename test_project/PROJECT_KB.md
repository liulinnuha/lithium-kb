# Project Knowledge Base: quantum-nexus

> Generated on 2026-08-16 | Branch: `N/A` | Stack: **Node.js / JavaScript / TypeScript**

## 1. Overview
- **Description:** Distributed neural agent orchestration engine with time-travel execution memory
- **Root:** `quantum-nexus`
- **Stack:** Node.js / JavaScript / TypeScript
- **Structured Knowledge Base:** `.agent-kb/`

## 2. Structured Knowledge Directory (.agent-kb/)

| Category | Documents | Purpose |
| :--- | :--- | :--- |
| **architecture/** | `1.architecture-topology.md`, `2.data-flow-protocol.md` | System topology, services, APIs |
| **tasks/** | `1.task-hnsw-indexing.md`, `2.task-websocket-streaming.md`, `3.task-distributed-consensus.md` | Active tasks, backlog, completed work |
| **debug/** | `1.debug-sse-buffer-overflow.md`, `2.debug-event-loop-crypto-lag.md` | Resolved incidents, root-cause notes |
| **features/** | `1.feature-neural-routing.md`, `2.feature-time-travel-debugger.md` | Feature specifications & requirements |

## 3. Common Commands
```sh
npm run dev # tsx watch src/index.ts
npm run build # tsc --build
npm run test # vitest run
npm run deploy # node scripts/deploy.js
npm run benchmark # node scripts/benchmark.js
```

## 4. Directory Map
```text
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
### `src/agent-router.ts`
```ts
class AgentRouter {
```
### `src/index.ts`
```ts
function createQuantumNexus() {
```
### `src/memory-engine.ts`
```ts
interface MemoryNode {
class MemoryEngine {
```
### `src/quantum-scheduler.ts`
```ts
interface AgentTask {
class QuantumScheduler {
```

## 6. Agent Navigation Rules
1. **Surgical Memory**: Read `.agent-kb/tasks/`, `.agent-kb/debug/`, or `.agent-kb/features/` doc before code crawling.
2. **Record Learnings**: When fixing bugs, save to `.agent-kb/debug/N.<issue>.md`. When finishing tasks, update `.agent-kb/tasks/`.

### Custom Project Directives (.agentrules)
```text
# Quantum Nexus Agent Rules
1. Never block the event loop with synchronous heavy vector math.
2. All new task schedulers must implement the AgentTask interface.
3. Write test cases in vitest for all new router algorithms.
4. Record architectural changes into .agent-kb/architecture/.
```

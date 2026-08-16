import { QuantumScheduler } from './quantum-scheduler.js';
import { MemoryEngine } from './memory-engine.js';
import { AgentRouter } from './agent-router.js';

export function createQuantumNexus() {
  const scheduler = new QuantumScheduler();
  const memory = new MemoryEngine();
  const router = new AgentRouter(scheduler, memory);

  return { scheduler, memory, router };
}

import { QuantumScheduler } from './quantum-scheduler.js';
import { MemoryEngine } from './memory-engine.js';

export class AgentRouter {
  constructor(
    private scheduler: QuantumScheduler,
    private memory: MemoryEngine
  ) {}

  public dispatch(intent: string, payload: unknown): string {
    return `Dispatched ${intent} to active cluster`;
  }
}

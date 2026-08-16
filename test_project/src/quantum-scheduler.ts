export interface AgentTask {
  id: string;
  payload: Record<string, unknown>;
  priority: number;
  assignedAgent?: string;
}

export class QuantumScheduler {
  private queue: AgentTask[] = [];

  public schedule(task: AgentTask): void {
    this.queue.push(task);
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  public next(): AgentTask | undefined {
    return this.queue.shift();
  }
}

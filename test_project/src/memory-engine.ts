export interface MemoryNode {
  key: string;
  vector: number[];
  metadata: Record<string, unknown>;
  ttl?: number;
}

export class MemoryEngine {
  private store = new Map<string, MemoryNode>();

  public save(node: MemoryNode): void {
    this.store.set(node.key, node);
  }

  public query(vector: number[], topK = 5): MemoryNode[] {
    return Array.from(this.store.values()).slice(0, topK);
  }
}

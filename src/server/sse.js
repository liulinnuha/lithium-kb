export class SseBroker {
  constructor() {
    this.clients = new Set();
    this.cumulativeTokensSaved = 4250;
    this.history = [
      {
        id: 1,
        nodeId: 'node-root',
        label: 'Agent Core',
        query: 'Initial Session Orientation',
        agent: 'Pi / Claude',
        time: new Date().toLocaleTimeString(),
        tokensSaved: 1450
      }
    ];
  }

  addClient(res) {
    this.clients.add(res);
  }

  removeClient(res) {
    this.clients.delete(res);
  }

  broadcast(event) {
    this.history.unshift(event);
    if (this.history.length > 50) this.history.pop();
    this.cumulativeTokensSaved += (event.tokensSaved || 750);

    const payload = `data: ${JSON.stringify({ event, cumulativeTokensSaved: this.cumulativeTokensSaved })}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(payload);
      } catch {
        this.clients.delete(client);
      }
    }
  }

  getHistory() {
    return this.history;
  }

  getTokensSaved() {
    return this.cumulativeTokensSaved;
  }
}

export const globalSseBroker = new SseBroker();

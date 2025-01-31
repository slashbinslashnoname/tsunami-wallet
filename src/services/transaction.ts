import { Transaction, AddressData } from '../types/bitcoin';

const WS_URL = 'wss://ws.blockchain.info/inv';

export const TransactionService = {
  ws: null as WebSocket | null,
  subscriptions: new Set<string>(),

  connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve(this.ws);
        return;
      }

      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        this.ws = ws;
        // Resubscribe to previously monitored addresses
        this.subscriptions.forEach(addr => {
          ws.send(JSON.stringify({ op: 'addr_sub', addr }));
        });
        resolve(ws);
      };

      ws.onerror = (error) => {
        reject(error);
      };

      ws.onclose = () => {
        setTimeout(() => this.connect(), 5000); // Reconnect after 5s
      };
    });
  },

  async monitorAddress(address: string, onTransaction: (tx: Transaction) => void) {
    if (!this.ws) {
      await this.connect();
    }

    this.subscriptions.add(address);
    this.ws?.send(JSON.stringify({ op: 'addr_sub', addr: address }));

    this.ws!.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.op === 'utx' || data.op === 'tx') {
        const tx = this.parseTransaction(data.x, address);
        onTransaction(tx);
      }
    };
  },

  parseTransaction(rawTx: any, address: string): Transaction {
    const isIncoming = rawTx.out.some((out: any) => out.addr === address);
    const amount = isIncoming
      ? rawTx.out.reduce((sum: number, out: any) => 
          out.addr === address ? sum + out.value : sum, 0)
      : rawTx.inputs.reduce((sum: number, input: any) => 
          input.prev_out.addr === address ? sum + input.prev_out.value : sum, 0);

    return {
      txid: rawTx.hash,
      amount: amount / 1e8,
      confirmations: rawTx.confirmations || 0,
      timestamp: rawTx.time * 1000,
      type: isIncoming ? 'incoming' : 'outgoing',
      addresses: [...new Set([
        ...rawTx.inputs.map((input: any) => input.prev_out.addr),
        ...rawTx.out.map((out: any) => out.addr)
      ])],
      status: rawTx.confirmations > 0 ? 'confirmed' : 'pending'
    };
  },

}; 
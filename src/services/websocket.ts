import { Transaction } from '../types/bitcoin';

type WebSocketCallback = (tx: Transaction) => void;

export const WebSocketService = {
  socket: null as WebSocket | null,
  callbacks: new Set<WebSocketCallback>(),

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    this.socket = new WebSocket('wss://ws.blockchain.info/inv');
    
    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.socket?.send(JSON.stringify({ "op": "unconfirmed_sub" }));
      this.socket?.send(JSON.stringify({ "op": "blocks_sub" }));
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.op === 'utx' || data.op === 'block') {
        this.notifyCallbacks(this.formatTransaction(data.x));
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(() => this.connect(), 5000); // Reconnect after 5 seconds
    };
  },

  subscribe(callback: WebSocketCallback) {
    this.callbacks.add(callback);
    if (!this.socket) this.connect();
  },

  unsubscribe(callback: WebSocketCallback) {
    this.callbacks.delete(callback);
    if (this.callbacks.size === 0) {
      this.socket?.close();
    }
  },

  formatTransaction(tx: any): Transaction {
    // Safely calculate total output value
    const outputValue = tx.out?.reduce((sum: number, out: any) => 
      sum + (out.value || 0), 0) || 0;

    // Safely get addresses
    const inputAddresses = tx.inputs?.map((input: any) => input.prev_out?.addr).filter(Boolean) || [];
    const outputAddresses = tx.out?.map((out: any) => out.addr).filter(Boolean) || [];

    return {
      txid: tx.hash || '',
      amount: outputValue / 1e8,
      confirmations: tx.block_height ? 1 : 0,
      timestamp: Date.now(),
      type: 'incoming',
      addresses: [...inputAddresses, ...outputAddresses],
      status: tx.block_height ? 'confirmed' : 'pending'
    };
  },

  notifyCallbacks(tx: Transaction) {
    this.callbacks.forEach(callback => callback(tx));
  }
}; 
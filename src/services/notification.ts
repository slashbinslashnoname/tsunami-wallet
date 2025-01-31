import * as Notifications from 'expo-notifications';
import { Transaction } from '../types/bitcoin';

export const NotificationService = {
  async setup() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      throw new Error('Permission not granted for notifications');
    }

    await Notifications.setNotificationChannelAsync('transactions', {
      name: 'Transactions',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E63946',
    });
  },

  async notifyTransaction(transaction: Transaction) {
    const amount = Math.abs(transaction.amount);
    const formattedAmount = `${amount.toFixed(8)} BTC`;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: transaction.type === 'incoming' ? 'Incoming Transaction' : 'Outgoing Transaction',
        body: `${transaction.type === 'incoming' ? 'Received' : 'Sent'} ${formattedAmount}`,
        data: { txid: transaction.txid },
      },
      trigger: null,
    });
  }
}; 
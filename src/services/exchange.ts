import axios from 'axios';

interface ExchangeRates {
  USD: number;
  EUR: number;
}

export const ExchangeService = {
  fetchRates: async (): Promise<{ USD: number; EUR: number }> => {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur');
      return {
        USD: response.data.bitcoin.usd,
        EUR: response.data.bitcoin.eur
      };
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      return { USD: 0, EUR: 0 };
    }
  },

  convertToFiat(btcAmount: number, rate: number): number {
    return btcAmount * rate;
  },

  convertToBTC(fiatAmount: number, rate: number): number {
    return fiatAmount / rate;
  }
}; 
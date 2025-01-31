interface ExchangeRates {
  USD: number;
  EUR: number;
}

export const ExchangeService = {
  async getRates(): Promise<{ USD: number; EUR: number }> {
    try {
      const response = await fetch('https://blockchain.info/ticker');
      const data = await response.json();
      return {
        USD: data.USD.last,
        EUR: data.EUR.last,
      };
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      throw new Error('Failed to fetch exchange rates');
    }
  },

  convertToFiat(btcAmount: number, rate: number): number {
    return btcAmount * rate;
  },

  convertToBTC(fiatAmount: number, rate: number): number {
    return fiatAmount / rate;
  }
}; 
interface ExchangeRates {
  USD: number;
  EUR: number;
}

export const ExchangeService = {
  async fetchRates(): Promise<ExchangeRates> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur');
      const data = await response.json();
      
      return {
        USD: data.bitcoin.usd,
        EUR: data.bitcoin.eur
      };
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      return {
        USD: 0,
        EUR: 0
      };
    }
  },

  convertToFiat(btcAmount: number, rate: number): number {
    return btcAmount * rate;
  },

  convertToBTC(fiatAmount: number, rate: number): number {
    return fiatAmount / rate;
  }
}; 
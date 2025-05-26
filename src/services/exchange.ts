interface ExchangeRates {
  USD: number;
  EUR: number;
}

export const ExchangeService = {
  async fetchRates(): Promise<ExchangeRates> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur');
      if (!response.ok) {
        throw new Error(`Failed to fetch rates: ${response.status}`);
      }
      const data = await response.json();
      
      if (data && data.bitcoin && typeof data.bitcoin.usd === 'number' && typeof data.bitcoin.eur === 'number') {
        return {
          USD: data.bitcoin.usd,
          EUR: data.bitcoin.eur
        };
      } else {
        throw new Error('Invalid or incomplete data received from API');
      }
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
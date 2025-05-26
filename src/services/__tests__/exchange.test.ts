import { ExchangeService } from '../exchange'; // Corrected import

describe('ExchangeService', () => {
  describe('convertToFiat', () => {
    it('should correctly convert BTC to a fiat currency given a rate', () => {
      expect(ExchangeService.convertToFiat(0.5, 50000)).toBe(25000); // 0.5 BTC at 50000 USD/BTC
    });

    it('should correctly convert another BTC amount to a fiat currency', () => {
      expect(ExchangeService.convertToFiat(2, 45000)).toBe(90000); // 2 BTC at 45000 EUR/BTC
    });

    it('should return 0 when BTC amount is zero', () => {
      expect(ExchangeService.convertToFiat(0, 50000)).toBe(0);
    });

    it('should return 0 when rate is zero', () => {
      expect(ExchangeService.convertToFiat(0.5, 0)).toBe(0);
    });
  });

  describe('convertToBTC', () => {
    it('should correctly convert a fiat amount to BTC given a rate', () => {
      expect(ExchangeService.convertToBTC(25000, 50000)).toBe(0.5); // 25000 USD at 50000 USD/BTC
    });

    it('should correctly convert another fiat amount to BTC', () => {
      expect(ExchangeService.convertToBTC(90000, 45000)).toBe(2); // 90000 EUR at 45000 EUR/BTC
    });

    it('should return 0 when fiat amount is zero', () => {
      expect(ExchangeService.convertToBTC(0, 50000)).toBe(0);
    });

    it('should return Infinity when rate is zero', () => {
      expect(ExchangeService.convertToBTC(100, 0)).toBe(Infinity);
    });
  });

  describe('fetchRates', () => {
    let fetchSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      // Mock global.fetch before each test
      fetchSpy = jest.spyOn(global, 'fetch');
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error output
    });

    afterEach(() => {
      // Restore fetch and console.error to their original implementations after each test
      fetchSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should fetch and return USD and EUR rates successfully', async () => {
      const mockRates = { bitcoin: { usd: 50000, eur: 45000 } };
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRates,
      } as Response);

      const rates = await ExchangeService.fetchRates();
      expect(rates).toEqual({ USD: 50000, EUR: 45000 });
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur'
      );
    });

    it('should return default rates and log error when API returns an error response', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const rates = await ExchangeService.fetchRates();
      expect(rates).toEqual({ USD: 0, EUR: 0 });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching exchange rates:', new Error('Failed to fetch rates: 500'));
    });

    it('should return default rates and log error when fetch throws a network error', async () => {
      const networkError = new Error('Network error');
      fetchSpy.mockRejectedValueOnce(networkError);

      const rates = await ExchangeService.fetchRates();
      expect(rates).toEqual({ USD: 0, EUR: 0 });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching exchange rates:', networkError);
    });

    it('should return default rates and log error when API response is not as expected', async () => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ bitcoin: { gbp: 40000 } }), // Missing usd or eur
        } as Response);
  
        const rates = await ExchangeService.fetchRates();
        expect(rates).toEqual({ USD: 0, EUR: 0 });
        expect(consoleErrorSpy).toHaveBeenCalled(); // Check that an error was logged
      });
  });
});

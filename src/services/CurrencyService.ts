export interface ExchangeRate {
  currency: string;
  rate: number;
}

export interface CurrencyApiResponse {
  base: string;
  rates: Record<string, number>;
}

class CurrencyService {
  private static instance: CurrencyService;
  private baseUrl = 'https://api.exchangerate-api.com/v4/latest/USD';

  public static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  async fetchLiveRates(): Promise<ExchangeRate[]> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      
      const data: CurrencyApiResponse = await response.json();
      
      // Convert all available rates from the API
      return Object.entries(data.rates).map(([currency, rate]) => ({
        currency,
        rate
      })).sort((a, b) => a.currency.localeCompare(b.currency)); // Sort alphabetically
    } catch (error) {
      console.warn('Failed to fetch live rates, using fallback:', error);
      return this.getFallbackRates();
    }
  }

  private getFallbackRates(): ExchangeRate[] {
    // Basic fallback rates for common currencies
    const fallbackRates: Record<string, number> = {
      USD: 1.0000,
      EUR: 0.9689,
      GBP: 0.8051,
      CHF: 0.9081,
      JPY: 157.05,
      CAD: 1.4424,
      AUD: 1.6100,
      CNY: 7.3000,
      MAD: 9.01,
      INR: 85.75,
      BRL: 5.46,
      MXN: 18.64,
      KRW: 1369.63,
      SGD: 1.28,
      NOK: 10.1,
      SEK: 9.53,
      DKK: 6.36,
      PLN: 3.62,
      CZK: 21.01,
      HUF: 341.05
    };

    return Object.entries(fallbackRates).map(([currency, rate]) => ({
      currency,
      rate
    })).sort((a, b) => a.currency.localeCompare(b.currency));
  }
}

export default CurrencyService; 
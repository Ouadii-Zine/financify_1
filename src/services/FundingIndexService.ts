import { FundingIndex, FundingIndexData, CurrencyFundingIndex, Currency } from '@/types/finance';

class FundingIndexService {
  private static instance: FundingIndexService;
  
  // Comprehensive funding indices data with current rates
  private fundingIndicesData: Record<FundingIndex, FundingIndexData> = {
    // Euro Zone
    EUR3M: {
      code: 'EUR3M',
      name: 'EURIBOR 3M',
      currency: 'EUR',
      currentValue: 3.85,
      lastUpdated: new Date().toISOString(),
      description: 'Euro Interbank Offered Rate 3-month'
    },
    ESTR: {
      code: 'ESTR',
      name: 'Euro Short-Term Rate',
      currency: 'EUR',
      currentValue: 3.75,
      lastUpdated: new Date().toISOString(),
      description: 'Euro Short-Term Rate - ECB reference rate'
    },
    
    // US Dollar
    SOFR: {
      code: 'SOFR',
      name: 'SOFR (Secured Overnight Financing Rate)',
      currency: 'USD',
      currentValue: 5.33,
      lastUpdated: new Date().toISOString(),
      description: 'Secured Overnight Financing Rate - USD reference rate'
    },
    LIB3M: {
      code: 'LIB3M',
      name: 'LIBOR 3M',
      currency: 'USD',
      currentValue: 5.45,
      lastUpdated: new Date().toISOString(),
      description: 'London Interbank Offered Rate 3-month (legacy)'
    },
    
    // British Pound
    SONIA: {
      code: 'SONIA',
      name: 'SONIA (Sterling Overnight Index Average)',
      currency: 'GBP',
      currentValue: 5.25,
      lastUpdated: new Date().toISOString(),
      description: 'Sterling Overnight Index Average - GBP reference rate'
    },
    
    // Swiss Franc
    SARON: {
      code: 'SARON',
      name: 'SARON (Swiss Average Rate Overnight)',
      currency: 'CHF',
      currentValue: 1.65,
      lastUpdated: new Date().toISOString(),
      description: 'Swiss Average Rate Overnight - CHF reference rate'
    },
    
    // Japanese Yen
    TONAR: {
      code: 'TONAR',
      name: 'TONAR (Tokyo Overnight Average Rate)',
      currency: 'JPY',
      currentValue: 0.05,
      lastUpdated: new Date().toISOString(),
      description: 'Tokyo Overnight Average Rate - JPY reference rate'
    },
    TIBOR: {
      code: 'TIBOR',
      name: 'TIBOR (Tokyo Interbank Offered Rate)',
      currency: 'JPY',
      currentValue: 0.08,
      lastUpdated: new Date().toISOString(),
      description: 'Tokyo Interbank Offered Rate'
    },
    
    // Australian Dollar
    AUB3M: {
      code: 'AUB3M',
      name: 'Bank Accepted Bills 3M',
      currency: 'AUD',
      currentValue: 4.35,
      lastUpdated: new Date().toISOString(),
      description: 'Australian Bank Accepted Bills 3-month rate'
    },
    BBSW: {
      code: 'BBSW',
      name: 'BBSW (Bank Bill Swap Rate)',
      currency: 'AUD',
      currentValue: 4.40,
      lastUpdated: new Date().toISOString(),
      description: 'Bank Bill Swap Rate - AUD reference rate'
    },
    
    // Canadian Dollar
    BA: {
      code: 'BA',
      name: 'Banker\'s Acceptance',
      currency: 'CAD',
      currentValue: 4.75,
      lastUpdated: new Date().toISOString(),
      description: 'Canadian Banker\'s Acceptance rate'
    },
    CORRA: {
      code: 'CORRA',
      name: 'CORRA (Canadian Overnight Repo Rate Average)',
      currency: 'CAD',
      currentValue: 4.70,
      lastUpdated: new Date().toISOString(),
      description: 'Canadian Overnight Repo Rate Average'
    },
    
    // Scandinavian Currencies
    CIB3M: {
      code: 'CIB3M',
      name: 'Copenhagen Interbank 3M',
      currency: 'DKK',
      currentValue: 3.45,
      lastUpdated: new Date().toISOString(),
      description: 'Copenhagen Interbank Offered Rate 3-month'
    },
    OIB3M: {
      code: 'OIB3M',
      name: 'Oslo Interbank 3M',
      currency: 'NOK',
      currentValue: 4.15,
      lastUpdated: new Date().toISOString(),
      description: 'Oslo Interbank Offered Rate 3-month'
    },
    STIBOR: {
      code: 'STIBOR',
      name: 'STIBOR (Stockholm Interbank Offered Rate)',
      currency: 'SEK',
      currentValue: 3.95,
      lastUpdated: new Date().toISOString(),
      description: 'Stockholm Interbank Offered Rate'
    },
    
    // Eastern European Currencies
    WIB3M: {
      code: 'WIB3M',
      name: 'Warsaw Interbank 3M',
      currency: 'PLN',
      currentValue: 5.85,
      lastUpdated: new Date().toISOString(),
      description: 'Warsaw Interbank Offered Rate 3-month'
    },
    BUBOR: {
      code: 'BUBOR',
      name: 'BUBOR (Budapest Interbank Offered Rate)',
      currency: 'HUF',
      currentValue: 7.25,
      lastUpdated: new Date().toISOString(),
      description: 'Budapest Interbank Offered Rate'
    },
    PRIBOR: {
      code: 'PRIBOR',
      name: 'PRIBOR (Prague Interbank Offered Rate)',
      currency: 'CZK',
      currentValue: 5.15,
      lastUpdated: new Date().toISOString(),
      description: 'Prague Interbank Offered Rate'
    },
    
    // Asian Currencies
    SIBOR: {
      code: 'SIBOR',
      name: 'Singapore Interbank (SIBOR)',
      currency: 'SGD',
      currentValue: 3.65,
      lastUpdated: new Date().toISOString(),
      description: 'Singapore Interbank Offered Rate'
    },
    SHIBOR: {
      code: 'SHIBOR',
      name: 'SHIBOR (Shanghai Interbank Offered Rate)',
      currency: 'CNY',
      currentValue: 2.85,
      lastUpdated: new Date().toISOString(),
      description: 'Shanghai Interbank Offered Rate'
    },
    MIBOR: {
      code: 'MIBOR',
      name: 'MIBOR (Mumbai Interbank Offered Rate)',
      currency: 'INR',
      currentValue: 6.75,
      lastUpdated: new Date().toISOString(),
      description: 'Mumbai Interbank Offered Rate'
    },
    KIBOR: {
      code: 'KIBOR',
      name: 'KIBOR (Karachi Interbank Offered Rate)',
      currency: 'PKR',
      currentValue: 22.50,
      lastUpdated: new Date().toISOString(),
      description: 'Karachi Interbank Offered Rate'
    },
    BIBOR: {
      code: 'BIBOR',
      name: 'BIBOR (Bangkok Interbank Offered Rate)',
      currency: 'THB',
      currentValue: 2.45,
      lastUpdated: new Date().toISOString(),
      description: 'Bangkok Interbank Offered Rate'
    },
    KLIBOR: {
      code: 'KLIBOR',
      name: 'KLIBOR (Kuala Lumpur Interbank Offered Rate)',
      currency: 'MYR',
      currentValue: 3.25,
      lastUpdated: new Date().toISOString(),
      description: 'Kuala Lumpur Interbank Offered Rate'
    },
    
    // Latin American Currencies
    BRLIBOR: {
      code: 'BRLIBOR',
      name: 'BRLIBOR (Brazilian Interbank Offered Rate)',
      currency: 'BRL',
      currentValue: 13.75,
      lastUpdated: new Date().toISOString(),
      description: 'Brazilian Interbank Offered Rate'
    },
    MXNIBOR: {
      code: 'MXNIBOR',
      name: 'MXNIBOR (Mexican Interbank Offered Rate)',
      currency: 'MXN',
      currentValue: 11.25,
      lastUpdated: new Date().toISOString(),
      description: 'Mexican Interbank Offered Rate'
    },
    
    // Other Major Currencies
    KRWIBOR: {
      code: 'KRWIBOR',
      name: 'KRWIBOR (Korean Interbank Offered Rate)',
      currency: 'KRW',
      currentValue: 3.55,
      lastUpdated: new Date().toISOString(),
      description: 'Korean Interbank Offered Rate'
    },
    JIBAR: {
      code: 'JIBAR',
      name: 'Johannesburg Interbank (JIBAR)',
      currency: 'ZAR',
      currentValue: 8.25,
      lastUpdated: new Date().toISOString(),
      description: 'Johannesburg Interbank Average Rate'
    },
    MADIBOR: {
      code: 'MADIBOR',
      name: 'MADIBOR (Moroccan Interbank Offered Rate)',
      currency: 'MAD',
      currentValue: 3.15,
      lastUpdated: new Date().toISOString(),
      description: 'Moroccan Interbank Offered Rate'
    }
  };

  // Updated currency to funding index mapping with multiple options
  private currencyFundingIndexMapping: Record<Currency, CurrencyFundingIndex> = {
    EUR: {
      currency: 'EUR',
      defaultIndex: 'EUR3M',
      availableIndices: ['EUR3M', 'ESTR']
    },
    USD: {
      currency: 'USD',
      defaultIndex: 'SOFR',
      availableIndices: ['SOFR', 'LIB3M']
    },
    GBP: {
      currency: 'GBP',
      defaultIndex: 'SONIA',
      availableIndices: ['SONIA', 'LIB3M']
    },
    CHF: {
      currency: 'CHF',
      defaultIndex: 'SARON',
      availableIndices: ['SARON', 'LIB3M']
    },
    JPY: {
      currency: 'JPY',
      defaultIndex: 'TONAR',
      availableIndices: ['TONAR', 'TIBOR', 'LIB3M']
    },
    AUD: {
      currency: 'AUD',
      defaultIndex: 'BBSW',
      availableIndices: ['BBSW', 'AUB3M']
    },
    CAD: {
      currency: 'CAD',
      defaultIndex: 'CORRA',
      availableIndices: ['CORRA', 'BA']
    },
    DKK: {
      currency: 'DKK',
      defaultIndex: 'CIB3M',
      availableIndices: ['CIB3M']
    },
    NOK: {
      currency: 'NOK',
      defaultIndex: 'OIB3M',
      availableIndices: ['OIB3M']
    },
    SEK: {
      currency: 'SEK',
      defaultIndex: 'STIBOR',
      availableIndices: ['STIBOR']
    },
    PLN: {
      currency: 'PLN',
      defaultIndex: 'WIB3M',
      availableIndices: ['WIB3M']
    },
    CZK: {
      currency: 'CZK',
      defaultIndex: 'PRIBOR',
      availableIndices: ['PRIBOR']
    },
    HUF: {
      currency: 'HUF',
      defaultIndex: 'BUBOR',
      availableIndices: ['BUBOR']
    },
    SGD: {
      currency: 'SGD',
      defaultIndex: 'SIBOR',
      availableIndices: ['SIBOR']
    },
    CNY: {
      currency: 'CNY',
      defaultIndex: 'SHIBOR',
      availableIndices: ['SHIBOR']
    },
    INR: {
      currency: 'INR',
      defaultIndex: 'MIBOR',
      availableIndices: ['MIBOR']
    },
    BRL: {
      currency: 'BRL',
      defaultIndex: 'BRLIBOR',
      availableIndices: ['BRLIBOR']
    },
    MXN: {
      currency: 'MXN',
      defaultIndex: 'MXNIBOR',
      availableIndices: ['MXNIBOR']
    },
    KRW: {
      currency: 'KRW',
      defaultIndex: 'KRWIBOR',
      availableIndices: ['KRWIBOR']
    },
    ZAR: {
      currency: 'ZAR',
      defaultIndex: 'JIBAR',
      availableIndices: ['JIBAR']
    },
    MAD: {
      currency: 'MAD',
      defaultIndex: 'MADIBOR',
      availableIndices: ['MADIBOR']
    },
    // For currencies without specific funding indices, use LIBOR as fallback
    PKR: {
      currency: 'PKR',
      defaultIndex: 'KIBOR',
      availableIndices: ['KIBOR']
    },
    THB: {
      currency: 'THB',
      defaultIndex: 'BIBOR',
      availableIndices: ['BIBOR']
    },
    MYR: {
      currency: 'MYR',
      defaultIndex: 'KLIBOR',
      availableIndices: ['KLIBOR']
    }
  };

  private constructor() {}

  public static getInstance(): FundingIndexService {
    if (!FundingIndexService.instance) {
      FundingIndexService.instance = new FundingIndexService();
    }
    return FundingIndexService.instance;
  }

  /**
   * Get funding index data for a specific index
   */
  public getFundingIndexData(index: FundingIndex): FundingIndexData | null {
    return this.fundingIndicesData[index] || null;
  }

  /**
   * Get all funding indices data
   */
  public getAllFundingIndicesData(): FundingIndexData[] {
    return Object.values(this.fundingIndicesData);
  }

  /**
   * Get the default funding index for a currency
   */
  public getDefaultFundingIndexForCurrency(currency: Currency): FundingIndex | null {
    const mapping = this.currencyFundingIndexMapping[currency];
    return mapping ? mapping.defaultIndex : null;
  }

  /**
   * Get available funding indices for a currency
   */
  public getAvailableFundingIndicesForCurrency(currency: Currency): FundingIndex[] {
    const mapping = this.currencyFundingIndexMapping[currency];
    return mapping ? mapping.availableIndices : [];
  }

  /**
   * Get currency funding index mapping
   */
  public getCurrencyFundingIndexMapping(currency: Currency): CurrencyFundingIndex | null {
    return this.currencyFundingIndexMapping[currency] || null;
  }

  /**
   * Get funding index data for a currency (returns default index data)
   */
  public getFundingIndexDataForCurrency(currency: Currency): FundingIndexData | null {
    const defaultIndex = this.getDefaultFundingIndexForCurrency(currency);
    return defaultIndex ? this.getFundingIndexData(defaultIndex) : null;
  }

  /**
   * Get fallback funding index for unsupported currencies
   * Uses a tiered approach: USD SOFR -> EUR ESTR -> LIBOR 3M
   */
  public getFallbackFundingIndex(currency: Currency): FundingIndexData {
    // Tier 1: Try USD SOFR (most liquid market)
    const sofrData = this.getFundingIndexData('SOFR');
    if (sofrData) {
      return {
        ...sofrData,
        code: 'SOFR' as FundingIndex,
        name: `SOFR (Fallback for ${currency})`,
        currency: currency,
        description: `Using USD SOFR as fallback for ${currency} - no specific funding index available`
      };
    }

    // Tier 2: Try EUR ESTR
    const estrData = this.getFundingIndexData('ESTR');
    if (estrData) {
      return {
        ...estrData,
        code: 'ESTR' as FundingIndex,
        name: `ESTR (Fallback for ${currency})`,
        currency: currency,
        description: `Using EUR ESTR as fallback for ${currency} - no specific funding index available`
      };
    }

    // Tier 3: Try LIBOR 3M (legacy fallback)
    const liborData = this.getFundingIndexData('LIB3M');
    if (liborData) {
      return {
        ...liborData,
        code: 'LIB3M' as FundingIndex,
        name: `LIBOR 3M (Fallback for ${currency})`,
        currency: currency,
        description: `Using USD LIBOR 3M as fallback for ${currency} - no specific funding index available`
      };
    }

    // Ultimate fallback: Generic rate
    return {
      code: 'LIB3M' as FundingIndex,
      name: `Generic Rate (Fallback for ${currency})`,
      currency: currency,
      currentValue: 5.0,
      lastUpdated: new Date().toISOString(),
      description: `Generic funding rate for ${currency} - please configure specific index`
    };
  }

  /**
   * Check if a currency has specific funding indices
   */
  public hasSpecificFundingIndices(currency: Currency): boolean {
    return currency in this.currencyFundingIndexMapping;
  }

  /**
   * Get funding index data with fallback for unsupported currencies
   */
  public getFundingIndexDataWithFallback(currency: Currency): FundingIndexData {
    const specificData = this.getFundingIndexDataForCurrency(currency);
    if (specificData) {
      return specificData;
    }
    return this.getFallbackFundingIndex(currency);
  }

  /**
   * Get available funding indices for a currency with fallback options
   */
  public getAvailableFundingIndicesWithFallback(currency: Currency): FundingIndex[] {
    const specificIndices = this.getAvailableFundingIndicesForCurrency(currency);
    if (specificIndices.length > 0) {
      return specificIndices;
    }
    
    // Return fallback options
    return ['SOFR', 'ESTR', 'LIB3M'];
  }

  /**
   * Get default funding index for a currency with fallback
   */
  public getDefaultFundingIndexWithFallback(currency: Currency): FundingIndex {
    const specificIndex = this.getDefaultFundingIndexForCurrency(currency);
    if (specificIndex) {
      return specificIndex;
    }
    
    // Return SOFR as primary fallback
    return 'SOFR';
  }

  /**
   * Update funding index value (for future real-time updates)
   */
  public updateFundingIndexValue(index: FundingIndex, newValue: number): void {
    if (this.fundingIndicesData[index]) {
      this.fundingIndicesData[index].currentValue = newValue;
      this.fundingIndicesData[index].lastUpdated = new Date().toISOString();
    }
  }

  /**
   * Get all currencies that have funding indices
   */
  public getSupportedCurrencies(): Currency[] {
    return Object.keys(this.currencyFundingIndexMapping) as Currency[];
  }

  /**
   * Get funding indices grouped by currency
   */
  public getFundingIndicesByCurrency(): Partial<Record<Currency, FundingIndexData[]>> {
    const grouped: Partial<Record<Currency, FundingIndexData[]>> = {};
    
    Object.values(this.fundingIndicesData).forEach(indexData => {
      if (!grouped[indexData.currency]) {
        grouped[indexData.currency] = [];
      }
      grouped[indexData.currency]!.push(indexData);
    });
    
    return grouped;
  }
}

export default FundingIndexService; 
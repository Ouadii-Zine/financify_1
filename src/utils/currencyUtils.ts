import { Currency } from '../types/finance';

// Currency symbols mapping
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CNY: '¥',
  MAD: 'MAD',
  INR: '₹',
  BRL: 'R$',
  MXN: 'MX$',
  KRW: '₩',
  SGD: 'S$',
  NOK: 'kr',
  SEK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  ZAR: 'R',
  PKR: '₨',
  THB: '฿',
  MYR: 'RM'
};

// Currency names mapping
export const CURRENCY_NAMES: Record<Currency, string> = {
  EUR: 'Euro',
  USD: 'US Dollar',
  GBP: 'British Pound',
  CHF: 'Swiss Franc',
  JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  CNY: 'Chinese Yuan',
  MAD: 'Moroccan Dirham',
  INR: 'Indian Rupee',
  BRL: 'Brazilian Real',
  MXN: 'Mexican Peso',
  KRW: 'South Korean Won',
  SGD: 'Singapore Dollar',
  NOK: 'Norwegian Krone',
  SEK: 'Swedish Krona',
  DKK: 'Danish Krone',
  PLN: 'Polish Zloty',
  CZK: 'Czech Koruna',
  HUF: 'Hungarian Forint',
  ZAR: 'South African Rand',
  PKR: 'Pakistani Rupee',
  THB: 'Thai Baht',
  MYR: 'Malaysian Ringgit'
};

/**
 * Get currency symbol for a given currency code
 */
export const getCurrencySymbol = (currency: Currency): string => {
  return CURRENCY_SYMBOLS[currency] || currency;
};

/**
 * Get currency name for a given currency code
 */
export const getCurrencyName = (currency: Currency): string => {
  return CURRENCY_NAMES[currency] || currency;
};

/**
 * Format currency amount with proper symbol and formatting
 */
export const formatCurrency = (
  amount: number, 
  currency: Currency = 'EUR', 
  options: {
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
    useSymbol?: boolean;
  } = {}
): string => {
  const {
    maximumFractionDigits = 0,
    minimumFractionDigits = 0,
    useSymbol = true
  } = options;

  const symbol = getCurrencySymbol(currency);
  
  // Format the number with proper locale
  const formattedNumber = new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(amount);

  // Use symbol if available and requested, otherwise use currency code
  if (useSymbol && symbol !== currency) {
    // For currencies where symbol comes before the number
    if (['USD', 'CAD', 'AUD', 'BRL', 'MXN', 'SGD', 'GBP'].includes(currency)) {
      return `${symbol}${formattedNumber}`;
    }
    // For currencies where symbol comes after the number
    else if (['EUR', 'CHF', 'PLN', 'CZK', 'HUF', 'NOK', 'SEK', 'DKK'].includes(currency)) {
      return `${formattedNumber}${symbol}`;
    }
    // For currencies with special formatting
    else if (['JPY', 'CNY', 'KRW'].includes(currency)) {
      return `${symbol}${formattedNumber}`;
    }
    // For currencies with special formatting (INR)
    else if (currency === 'INR') {
      return `${symbol}${formattedNumber}`;
    }
    // Default to symbol before number
    else {
      return `${symbol}${formattedNumber}`;
    }
  } else {
    // Use currency code when no symbol available or not requested
    return `${formattedNumber} ${currency}`;
  }
};

/**
 * Convert amount from EUR to target currency using USD-based exchange rates
 * Exchange rates from API are in format: 1 USD = X target_currency
 * Our data is stored in EUR, so we need to convert: EUR -> USD -> target_currency
 */
export const convertCurrency = (
  amountInEUR: number, 
  targetCurrency: Currency, 
  targetCurrencyRate: number,
  eurToUsdRate: number = 1.0968 // Approximate EUR to USD rate, will be updated from API
): number => {
  if (targetCurrency === 'EUR') {
    return amountInEUR;
  }
  
  // Convert EUR to USD first, then USD to target currency
  // Since API rates are USD-based: 1 USD = X EUR, so 1 EUR = 1/X USD
  const amountInUSD = amountInEUR / eurToUsdRate;
  
  if (targetCurrency === 'USD') {
    return amountInUSD;
  }
  
  // Convert USD to target currency
  return amountInUSD * targetCurrencyRate;
};

/**
 * Format percentage value
 */
export const formatPercentage = (
  value: number,
  options: {
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
  } = {}
): string => {
  const {
    maximumFractionDigits = 2,
    minimumFractionDigits = 0
  } = options;

  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits,
    minimumFractionDigits
  }).format(value / 100);
}; 

/**
 * Convert amount from any currency to any other using USD-based exchange rates
 * rates: { USD: 1, EUR: 0.97, ... } (1 USD = X target_currency)
 * eurToUsdRate: 1 EUR = X USD
 */
export const convertBetweenCurrencies = (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  rates: Record<string, number>,
  eurToUsdRate: number = 1.0968
): number => {
  if (fromCurrency === toCurrency) return amount;
  
  // API rates are in format: 1 USD = X target_currency
  // So rates[EUR] = 0.87 means 1 USD = 0.87 EUR
  
  if (fromCurrency === 'USD') {
    // USD to any currency
    if (rates[toCurrency]) {
      return amount * rates[toCurrency];
    }
  } else if (toCurrency === 'USD') {
    // Any currency to USD
    if (rates[fromCurrency]) {
      return amount / rates[fromCurrency];
    }
  } else {
    // fromCurrency to toCurrency via USD
    let amountInUSD = amount;
    if (rates[fromCurrency]) {
      amountInUSD = amount / rates[fromCurrency]; // Convert to USD
    }
    if (rates[toCurrency]) {
      return amountInUSD * rates[toCurrency]; // Convert from USD to target
    }
  }
  
  // Fallback: no conversion
  return amount;
}; 

/**
 * Convert amount from loan currency to display currency
 * This function handles the case where loan amounts are stored in their original currency
 * and need to be converted to the display currency
 */
export const convertLoanAmountToDisplayCurrency = (
  amount: number,
  loanCurrency: Currency,
  displayCurrency: Currency,
  exchangeRates: Record<string, number>,
  eurToUsdRate: number = 1.0968
): number => {
  // If currencies are the same, no conversion needed
  if (loanCurrency === displayCurrency) {
    return amount;
  }
  
  // Use convertBetweenCurrencies for proper conversion
  return convertBetweenCurrencies(amount, loanCurrency, displayCurrency, exchangeRates, eurToUsdRate);
}; 
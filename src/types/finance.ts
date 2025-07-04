export type LoanStatus = 'active' | 'closed' | 'default' | 'restructured';
export type LoanType = 'term' | 'revolver' | 'bullet' | 'amortizing';
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'JPY';
export type ClientType = 'banqueCommerciale' | 'banqueInvestissement' | 'assurance' | 'fonds' | 'entreprise';

export interface Loan {
  id: string;
  name: string;
  clientName: string;
  clientType?: ClientType;
  portfolioId: string;
  type: LoanType;
  status: LoanStatus;
  startDate: string;
  endDate: string;
  currency: Currency;
  originalAmount: number;
  outstandingAmount: number;
  drawnAmount: number;
  undrawnAmount: number;
  pd: number; // Probability of Default (%)
  lgd: number; // Loss Given Default (%)
  ead: number; // Exposure at Default
  fees: {
    upfront: number;
    commitment: number;
    agency: number;
    other: number;
  };
  margin: number; // Spread over reference rate (%)
  referenceRate: number; // Base rate (%)
  internalRating: string;
  sector: string;
  country: string;
  cashFlows: CashFlow[];
  metrics: LoanMetrics;
  additionalDetails?: Record<string, any>; // Dynamic additional fields
}

export interface CashFlow {
  id: string;
  date: string;
  type: 'drawdown' | 'repayment' | 'interest' | 'fee';
  amount: number;
  isManual: boolean; // Flag to identify manually entered cashflows
  description?: string;
}

export interface LoanMetrics {
  evaIntrinsic: number;
  evaSale: number;
  expectedLoss: number;
  rwa: number;
  roe: number;
  raroc: number;
  costOfRisk: number;
  capitalConsumption: number;
  netMargin: number;
  effectiveYield: number;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  clientType?: ClientType;
  createdDate: string;
  lastModified: string;
  isDefault?: boolean;
  loans: Loan[];
  metrics: PortfolioMetrics;
}

export interface PortfolioSummary {
  id: string;
  name: string;
  description?: string;
  clientType?: ClientType;
  createdDate: string;
  lastModified: string;
  isDefault?: boolean;
  loanCount: number;
  totalExposure: number;
  metrics: PortfolioMetrics;
}

export interface PortfolioMetrics {
  totalExposure: number;
  totalDrawn: number;
  totalUndrawn: number;
  weightedAveragePD: number;
  weightedAverageLGD: number;
  totalExpectedLoss: number;
  totalRWA: number;
  portfolioROE: number;
  portfolioRAROC: number;
  evaSumIntrinsic: number;
  evaSumSale: number;
  diversificationBenefit: number;
}

export interface CalculationParameters {
  targetROE: number;
  corporateTaxRate: number;
  capitalRatio: number; // Common Equity Tier 1 ratio
  fundingCost: number;
  operationalCostRatio: number;
  priceFactor?: number; // Facteur de pricing
  spread?: number; // Spread par défaut
  pdCurve: { rating: string; pd: number }[];
  lgdAssumptions: { sector: string; lgd: number }[];
  stressScenarios: {
    name: string;
    pdMultiplier: number;
    lgdMultiplier: number;
    rateShift: number;
    spreadShift: number;
  }[];
}

export interface SimulationResult {
  baseCase: PortfolioMetrics;
  scenarios: {
    name: string;
    metrics: PortfolioMetrics;
    deltaToBase: {
      expectedLoss: number;
      rwa: number;
      roe: number;
    };
  }[];
}

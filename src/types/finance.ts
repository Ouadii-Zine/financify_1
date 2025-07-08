export type LoanStatus = 'active' | 'closed' | 'default' | 'restructured';
export type LoanType = 'term' | 'revolver' | 'bullet' | 'amortizing';
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'JPY';
export type ClientType = 'banqueCommerciale' | 'banqueInvestissement' | 'assurance' | 'fonds' | 'entreprise';

// S&P Rating System
export type SPRating = 
  | 'AAA' | 'AA+' | 'AA' | 'AA-' 
  | 'A+' | 'A' | 'A-' 
  | 'BBB+' | 'BBB' | 'BBB-' 
  | 'BB+' | 'BB' | 'BB-' 
  | 'B+' | 'B' | 'B-' 
  | 'CCC+' | 'CCC' | 'CCC-' 
  | 'CC' | 'C' | 'D';

export interface RatingMapping {
  rating: SPRating;
  pd: number; // Probability of Default in decimal
  riskWeight: number; // Risk weight for RWA calculation
}

// Standard S&P rating mappings
export const S_P_RATING_MAPPINGS: RatingMapping[] = [
  { rating: 'AAA', pd: 0.0001, riskWeight: 0.20 },
  { rating: 'AA+', pd: 0.0002, riskWeight: 0.20 },
  { rating: 'AA', pd: 0.0003, riskWeight: 0.20 },
  { rating: 'AA-', pd: 0.0005, riskWeight: 0.20 },
  { rating: 'A+', pd: 0.0008, riskWeight: 0.50 },
  { rating: 'A', pd: 0.0012, riskWeight: 0.50 },
  { rating: 'A-', pd: 0.0018, riskWeight: 0.50 },
  { rating: 'BBB+', pd: 0.0025, riskWeight: 1.00 },
  { rating: 'BBB', pd: 0.0035, riskWeight: 1.00 },
  { rating: 'BBB-', pd: 0.0050, riskWeight: 1.00 },
  { rating: 'BB+', pd: 0.0075, riskWeight: 1.50 },
  { rating: 'BB', pd: 0.0125, riskWeight: 1.50 },
  { rating: 'BB-', pd: 0.0200, riskWeight: 1.50 },
  { rating: 'B+', pd: 0.0350, riskWeight: 2.00 },
  { rating: 'B', pd: 0.0600, riskWeight: 2.00 },
  { rating: 'B-', pd: 0.1000, riskWeight: 2.00 },
  { rating: 'CCC+', pd: 0.1500, riskWeight: 2.50 },
  { rating: 'CCC', pd: 0.2500, riskWeight: 2.50 },
  { rating: 'CCC-', pd: 0.4000, riskWeight: 2.50 },
  { rating: 'CC', pd: 0.6000, riskWeight: 3.00 },
  { rating: 'C', pd: 0.8000, riskWeight: 3.00 },
  { rating: 'D', pd: 1.0000, riskWeight: 3.00 }
];

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
  internalRating: SPRating;
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

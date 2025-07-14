export type LoanStatus = 'active' | 'closed' | 'default' | 'restructured';
export type LoanType = 'term' | 'revolver' | 'bullet' | 'amortizing';
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'JPY' | 'CAD' | 'AUD' | 'CNY' | 'MAD' | 'INR' | 'BRL' | 'MXN' | 'KRW' | 'SGD' | 'NOK' | 'SEK' | 'DKK' | 'PLN' | 'CZK' | 'HUF';
export type ClientType = 'banqueCommerciale' | 'banqueInvestissement' | 'assurance' | 'fonds' | 'entreprise';

// S&P Rating System
export type SPRating = 
  | 'AAA' | 'AA+' | 'AA' | 'AA-' 
  | 'A+' | 'A' | 'A-' 
  | 'BBB+' | 'BBB' | 'BBB-' 
  | 'BB+' | 'BB' | 'BB-' 
  | 'B+' | 'B' | 'B-' 
  | 'CCC+' | 'CCC' | 'CCC-' 
  | 'CC' | 'C' | 'D' | 'N/A';

// Moody's Rating System
export type MoodysRating = 
  | 'Aaa' | 'Aa1' | 'Aa2' | 'Aa3'
  | 'A1' | 'A2' | 'A3'
  | 'Baa1' | 'Baa2' | 'Baa3'
  | 'Ba1' | 'Ba2' | 'Ba3'
  | 'B1' | 'B2' | 'B3'
  | 'Caa1' | 'Caa2' | 'Caa3'
  | 'Ca' | 'C' | 'D' | 'N/A';

// Fitch Rating System  
export type FitchRating = 
  | 'AAA' | 'AA+' | 'AA' | 'AA-'
  | 'A+' | 'A' | 'A-'
  | 'BBB+' | 'BBB' | 'BBB-'
  | 'BB+' | 'BB' | 'BB-'
  | 'B+' | 'B' | 'B-'
  | 'CCC+' | 'CCC' | 'CCC-'
  | 'CC' | 'C' | 'RD' | 'D' | 'N/A';

// Internal Rating System (customizable, same as S&P for simplicity)
export type InternalRating = 
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
  | 'AAA' | 'AA+' | 'AA' | 'AA-' 
  | 'A+' | 'A' | 'A-' 
  | 'BBB+' | 'BBB' | 'BBB-' 
  | 'BB+' | 'BB' | 'BB-' 
  | 'B+' | 'B' | 'B-' 
  | 'CCC+' | 'CCC' | 'CCC-' 
  | 'CC' | 'C' | 'D' | 'N/A';

// Rating type selector
export type RatingType = 'internal' | 'sp' | 'moodys' | 'fitch';

// Multi-rating support interface
export interface LoanRatings {
  internal?: InternalRating;
  sp?: SPRating;
  moodys?: MoodysRating;
  fitch?: FitchRating;
}

export interface RatingMapping {
  rating: SPRating;
  pd: number; // Probability of Default in decimal
  riskWeight: number; // Risk weight for RWA calculation
}

// Standard S&P rating mappings (keep existing for compatibility)
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

// Moody's to S&P mapping for PD calculations
export const MOODYS_TO_SP_MAPPING: Record<MoodysRating, SPRating> = {
  'Aaa': 'AAA', 'Aa1': 'AA+', 'Aa2': 'AA', 'Aa3': 'AA-',
  'A1': 'A+', 'A2': 'A', 'A3': 'A-',
  'Baa1': 'BBB+', 'Baa2': 'BBB', 'Baa3': 'BBB-',
  'Ba1': 'BB+', 'Ba2': 'BB', 'Ba3': 'BB-',
  'B1': 'B+', 'B2': 'B', 'B3': 'B-',
  'Caa1': 'CCC+', 'Caa2': 'CCC', 'Caa3': 'CCC-',
  'Ca': 'CC', 'C': 'C', 'D': 'D', 'N/A': 'N/A'
};

// Fitch to S&P mapping for PD calculations
export const FITCH_TO_SP_MAPPING: Record<FitchRating, SPRating> = {
  'AAA': 'AAA', 'AA+': 'AA+', 'AA': 'AA', 'AA-': 'AA-',
  'A+': 'A+', 'A': 'A', 'A-': 'A-',
  'BBB+': 'BBB+', 'BBB': 'BBB', 'BBB-': 'BBB-',
  'BB+': 'BB+', 'BB': 'BB', 'BB-': 'BB-',
  'B+': 'B+', 'B': 'B', 'B-': 'B-',
  'CCC+': 'CCC+', 'CCC': 'CCC', 'CCC-': 'CCC-',
  'CC': 'CC', 'C': 'C', 'RD': 'D', 'D': 'D', 'N/A': 'N/A'
};

// Internal rating to S&P mapping (flexible for different institutions)
export const INTERNAL_TO_SP_MAPPING: Record<InternalRating, SPRating> = {
  // Numeric internal ratings (1-12 scale)
  '1': 'AAA', '2': 'AA', '3': 'A+', '4': 'A-', '5': 'BBB+', '6': 'BBB-',
  '7': 'BB+', '8': 'BB-', '9': 'B+', '10': 'B-', '11': 'CCC', '12': 'D',
  // Letter-based internal ratings (same as S&P)
  'AAA': 'AAA', 'AA+': 'AA+', 'AA': 'AA', 'AA-': 'AA-',
  'A+': 'A+', 'A': 'A', 'A-': 'A-',
  'BBB+': 'BBB+', 'BBB': 'BBB', 'BBB-': 'BBB-',
  'BB+': 'BB+', 'BB': 'BB', 'BB-': 'BB-',
  'B+': 'B+', 'B': 'B', 'B-': 'B-',
  'CCC+': 'CCC+', 'CCC': 'CCC', 'CCC-': 'CCC-',
  'CC': 'CC', 'C': 'C', 'D': 'D', 'N/A': 'N/A'
};

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
  
  // Multi-rating support
  ratings: LoanRatings;
  
  // Legacy field for backward compatibility (will use selected portfolio rating)
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
  
  // Rating preference for calculations
  selectedRatingType?: RatingType;
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

// Transition matrix interface
export interface TransitionMatrix {
  from: string;
  to: string;
  probability: number;
}

export interface CalculationParameters {
  targetROE: number;
  corporateTaxRate: number;
  capitalRatio: number; // Common Equity Tier 1 ratio
  fundingCost: number;
  operationalCostRatio: number;
  priceFactor?: number; // Facteur de pricing
  spread?: number; // Spread par défaut
  currency?: Currency; // Selected display currency
  exchangeRate?: number; // Exchange rate from EUR to selected currency
  
  // Legacy PD curve (for backward compatibility)
  pdCurve: { rating: string; pd: number }[];
  
  // Multi-rating system PD mappings
  ratingPDMappings: {
    internal: { rating: InternalRating; pd: number }[];
    sp: { rating: SPRating; pd: number }[];
    moodys: { rating: MoodysRating; pd: number }[];
    fitch: { rating: FitchRating; pd: number }[];
  };
  
  // Rating transition matrices (one-year probabilities)
  transitionMatrices: {
    internal: TransitionMatrix[];
    sp: TransitionMatrix[];
    moodys: TransitionMatrix[];
    fitch: TransitionMatrix[];
  };
  
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

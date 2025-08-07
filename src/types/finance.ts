export type LoanStatus = 'active' | 'closed' | 'default' | 'restructured';
export type LoanType = 'term' | 'revolver' | 'bullet' | 'amortizing';
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'JPY' | 'CAD' | 'AUD' | 'CNY' | 'MAD' | 'INR' | 'BRL' | 'MXN' | 'KRW' | 'SGD' | 'NOK' | 'SEK' | 'DKK' | 'PLN' | 'CZK' | 'HUF' | 'ZAR' | 'PKR' | 'THB' | 'MYR';
export type ClientType = 'banqueCommerciale' | 'banqueInvestissement' | 'assurance' | 'fonds' | 'entreprise';

// Funding Index Types
export type FundingIndex = 
  | 'EUR3M' | 'ESTR' | 'SOFR' | 'LIB3M' | 'SONIA' | 'SARON' | 'TONAR' | 'TIBOR' | 'AUB3M' | 'BBSW' | 'BA' | 'CORRA'
  | 'CIB3M' | 'OIB3M' | 'STIBOR' | 'WIB3M' | 'BUBOR' | 'PRIBOR' | 'SIBOR' | 'SHIBOR' | 'MIBOR' | 'KIBOR' | 'BIBOR' | 'KLIBOR'
  | 'BRLIBOR' | 'MXNIBOR' | 'KRWIBOR' | 'JIBAR' | 'MADIBOR';

export interface FundingIndexData {
  code: FundingIndex;
  name: string;
  currency: Currency;
  currentValue: number; // Current rate in percentage
  lastUpdated: string;
  description: string;
}

export interface CurrencyFundingIndex {
  currency: Currency;
  defaultIndex: FundingIndex;
  availableIndices: FundingIndex[];
}

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

// Internal Rating System (customizable, allows any string for dynamic ratings)
export type InternalRating = string;

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
export const INTERNAL_TO_SP_MAPPING: Record<string, SPRating> = {
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

// Function to get S&P equivalent for any internal rating
export const getInternalRatingSPEquivalent = (internalRating: InternalRating): SPRating => {
  return INTERNAL_TO_SP_MAPPING[internalRating] || 'BB+'; // Default to BB+ for unknown ratings
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
  rateType: 'fixed' | 'variable'; // Fixed or variable rate loan
  fundingIndex?: FundingIndex; // Funding index for the loan

  // --- NOUVEAUX PARAMÈTRES STRUCTURE CASHFLOW ---
  interestPaymentFrequency?: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  principalRepaymentFrequency?: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  amortizationType?: 'inFine' | 'constant' | 'annuity';
  interestCalculationMethod?: string; // ex: "30/360", "Actual/360", etc.
  gracePeriodMonths?: number;
  allowPrepayment?: boolean;
  allowPenalty?: boolean;
  revocableImmediately?: boolean;
  // ------------------------------------------------

  // Enhanced LGD Configuration
  lgdType?: 'constant' | 'variable' | 'guaranteed' | 'collateralized';
  lgdConstant?: number;
  lgdVariable?: {
    type: 'realEstate' | 'equipment' | 'vehicle' | 'cash' | 'other';
    initialValue: number;
    model: 'linear' | 'exponential' | 'logarithmic' | 'polynomial';
    parameters: {
      depreciationRate?: number; // Annual depreciation rate (for equipment, vehicles)
      appreciationRate?: number; // Annual appreciation rate (for real estate)
      halfLife?: number; // Half-life for exponential decay
      polynomialCoefficients?: number[]; // For polynomial models
    };
  };
  lgdGuaranteed?: {
    baseLGD: number; // LGD without guarantee (e.g., 45%)
    guaranteeType: 'government' | 'corporate' | 'personal' | 'collateral' | 'other';
    coverage: number; // Coverage percentage (e.g., 60% = 0.6)
    guarantorLGD: number; // LGD of the guarantor (e.g., 0% for government, 20% for corporate)
  };
  
  // Enhanced Collateral Portfolio
  collateralPortfolio?: CollateralPortfolio;
  
  // Enhanced LGD Configuration with Collateral
  enhancedLGDConfig?: EnhancedLGDConfig;

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
  type: 'drawdown' | 'repayment' | 'interest' | 'fee' | 'prepayment' | 'penalty' | 'capitalizedInterest' | 'default' | 'restructuring' | 'extension' | 'recovery' | 'netloss' | 'liquidity_crisis';
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
  // Add these for revolvers
  monthlyInterest?: number;
  annualCommission?: number;
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
  defaultFundingIndex?: FundingIndex; // Default funding index for new loans
  
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

// Enhanced Collateral Types and Interfaces
export type CollateralCategory = 
  | 'realEstate' 
  | 'equipment' 
  | 'vehicle' 
  | 'cash' 
  | 'securities' 
  | 'inventory' 
  | 'receivables' 
  | 'intellectualProperty' 
  | 'commodities' 
  | 'other';

export type CollateralValuationMethod = 
  | 'marketValue' 
  | 'appraisedValue' 
  | 'bookValue' 
  | 'liquidationValue' 
  | 'replacementCost' 
  | 'incomeApproach' 
  | 'costApproach' 
  | 'comparableSales';

export type CollateralRiskLevel = 'low' | 'medium' | 'high' | 'veryHigh';

export interface CollateralItem {
  id: string;
  name: string;
  category: CollateralCategory;
  description?: string;
  
  // Valuation Information
  valuationMethod: CollateralValuationMethod;
  currentValue: number;
  currency: Currency;
  valuationDate: string;
  nextValuationDate?: string;
  
  // Risk Assessment
  riskLevel: CollateralRiskLevel;
  volatility: number; // Annual volatility percentage
  correlationWithLoan: number; // Correlation with loan performance (-1 to 1)
  
  // Collateral Specific Properties
  properties: {
    // Real Estate
    propertyType?: 'residential' | 'commercial' | 'industrial' | 'land' | 'mixed';
    location?: string;
    squareMeters?: number;
    constructionYear?: number;
    propertyCondition?: 'excellent' | 'good' | 'fair' | 'poor';
    
    // Equipment/Vehicles
    manufacturer?: string;
    model?: string;
    yearOfManufacture?: number;
    equipmentCondition?: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
    maintenanceHistory?: string;
    
    // Securities
    securityType?: 'equity' | 'bond' | 'fund' | 'derivative' | 'other';
    issuer?: string;
    maturityDate?: string;
    couponRate?: number;
    creditRating?: string;
    
    // Inventory
    inventoryType?: 'rawMaterials' | 'workInProgress' | 'finishedGoods' | 'spareParts';
    quantity?: number;
    unitCost?: number;
    obsolescenceRisk?: number;
    
    // Receivables
    debtorType?: 'corporate' | 'individual' | 'government';
    averagePaymentTerm?: number;
    defaultRate?: number;
    
    // Other properties
    [key: string]: any;
  };
  
  // Valuation Model Parameters
  valuationModel: {
    type: 'linear' | 'exponential' | 'logarithmic' | 'polynomial' | 'custom';
    parameters: {
      depreciationRate?: number;
      appreciationRate?: number;
      halfLife?: number;
      polynomialCoefficients?: number[];
      customFormula?: string;
    };
  };
  
  // Legal and Regulatory
  legalStatus: 'registered' | 'pending' | 'unregistered';
  encumbranceLevel: number; // 0-1, percentage of collateral encumbered
  priorityRank: number; // 1 = first priority, 2 = second priority, etc.
  
  // Insurance and Protection
  insured: boolean;
  insuranceValue?: number;
  insuranceExpiryDate?: string;
  
  // Monitoring and Maintenance
  monitoringFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  
  // Liquidation Information
  estimatedLiquidationValue: number;
  estimatedLiquidationTime: number; // in months
  liquidationCosts: number;
  
  // Historical Data
  historicalValues: Array<{
    date: string;
    value: number;
    method: CollateralValuationMethod;
  }>;
  
  // Risk Metrics
  riskMetrics: {
    valueAtRisk: number;
    expectedShortfall: number;
    stressTestScenarios: Array<{
      scenario: string;
      impactOnValue: number;
    }>;
  };
}

export interface CollateralPortfolio {
  id: string;
  loanId: string;
  totalValue: number;
  currency: Currency;
  diversificationScore: number; // 0-1, higher is better
  concentrationRisk: number; // 0-1, higher is riskier
  items: CollateralItem[];
  
  // Portfolio Level Risk Metrics
  portfolioRiskMetrics: {
    totalValueAtRisk: number;
    weightedAverageVolatility: number;
    correlationMatrix: number[][];
    stressTestResults: Array<{
      scenario: string;
      portfolioValue: number;
      lossAmount: number;
      impactPercentage: number;
    }>;
    expectedShortfall: number;
    portfolioBeta: number;
  };
  
  // Regulatory Compliance
  regulatoryCompliance: {
    baselCompliant: boolean;
    lcrEligible: boolean;
    hqlaCategory?: 'level1' | 'level2a' | 'level2b' | 'ineligible';
    haircutPercentage: number;
    regulatoryRatios: {
      lcrRatio: number;
      nsfRatio: number;
      hqlaRatio: number;
    };
  };
}

// Enhanced LGD Configuration with Collateral
export interface EnhancedLGDConfig {
  type: 'constant' | 'variable' | 'guaranteed' | 'collateralized';
  constant?: number;
  variable?: {
    baseLGD: number;
    collateralAdjustment: number;
    timeDecay: number;
  };
  guaranteed?: {
    baseLGD: number;
    guaranteeType: 'government' | 'corporate' | 'personal' | 'collateral' | 'other';
    coverage: number;
    guarantorLGD: number;
  };
  collateralized?: {
    baseLGD: number;
    collateralPortfolio: CollateralPortfolio;
    haircutPercentage: number;
    correlationAdjustment: number;
  };
}

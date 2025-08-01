
import { Loan, Portfolio, CalculationParameters, InternalRating, SPRating, MoodysRating, FitchRating } from '../types/finance';

// Paramètres de calcul par défaut
export const defaultCalculationParameters: CalculationParameters = {
  targetROE: 0.15, // 15%
  corporateTaxRate: 0.25, // 25%
  capitalRatio: 0.08, // 8%
  fundingCost: 0.02, // 2%
  operationalCostRatio: 0.01, // 1%
  currency: 'USD', // Default display currency (matches API base)
  exchangeRate: 1.0, // Default rate (USD to USD)
  pdCurve: [
    { rating: 'AAA', pd: 0.0001 },
    { rating: 'AA', pd: 0.0008 },
    { rating: 'A', pd: 0.0017 },
    { rating: 'BBB', pd: 0.0041 },
    { rating: 'BB', pd: 0.0121 },
    { rating: 'B', pd: 0.0267 },
    { rating: 'CCC', pd: 0.0822 },
    { rating: 'CC', pd: 0.2122 },
    { rating: 'C', pd: 0.3622 },
    { rating: 'D', pd: 1.0 }
  ],
  ratingPDMappings: {
    internal: [
      { rating: '1' as InternalRating, pd: 0.0001 }, // AAA equivalent
      { rating: '2' as InternalRating, pd: 0.0003 }, // AA equivalent
      { rating: '3' as InternalRating, pd: 0.0008 }, // A+ equivalent
      { rating: '4' as InternalRating, pd: 0.0018 }, // A- equivalent
      { rating: '5' as InternalRating, pd: 0.0025 }, // BBB+ equivalent
      { rating: '6' as InternalRating, pd: 0.0050 }, // BBB- equivalent
      { rating: '7' as InternalRating, pd: 0.0075 }, // BB+ equivalent
      { rating: '8' as InternalRating, pd: 0.0200 }, // BB- equivalent
      { rating: '9' as InternalRating, pd: 0.0350 }, // B+ equivalent
      { rating: '10' as InternalRating, pd: 0.1000 }, // B- equivalent
      { rating: '11' as InternalRating, pd: 0.2500 }, // CCC equivalent
      { rating: '12' as InternalRating, pd: 1.0000 }, // D equivalent
      { rating: 'AAA' as InternalRating, pd: 0.0001 },
      { rating: 'AA+' as InternalRating, pd: 0.0002 },
      { rating: 'AA' as InternalRating, pd: 0.0003 },
      { rating: 'AA-' as InternalRating, pd: 0.0005 },
      { rating: 'A+' as InternalRating, pd: 0.0008 },
      { rating: 'A' as InternalRating, pd: 0.0012 },
      { rating: 'A-' as InternalRating, pd: 0.0018 },
      { rating: 'BBB+' as InternalRating, pd: 0.0025 },
      { rating: 'BBB' as InternalRating, pd: 0.0035 },
      { rating: 'BBB-' as InternalRating, pd: 0.0050 },
      { rating: 'BB+' as InternalRating, pd: 0.0075 },
      { rating: 'BB' as InternalRating, pd: 0.0125 },
      { rating: 'BB-' as InternalRating, pd: 0.0200 },
      { rating: 'B+' as InternalRating, pd: 0.0350 },
      { rating: 'B' as InternalRating, pd: 0.0600 },
      { rating: 'B-' as InternalRating, pd: 0.1000 },
      { rating: 'CCC+' as InternalRating, pd: 0.1500 },
      { rating: 'CCC' as InternalRating, pd: 0.2500 },
      { rating: 'CCC-' as InternalRating, pd: 0.4000 },
      { rating: 'CC' as InternalRating, pd: 0.6000 },
      { rating: 'C' as InternalRating, pd: 0.8000 },
      { rating: 'D' as InternalRating, pd: 1.0000 }
    ],
    sp: [
      { rating: 'AAA' as SPRating, pd: 0.0001 },
      { rating: 'AA+' as SPRating, pd: 0.0002 },
      { rating: 'AA' as SPRating, pd: 0.0003 },
      { rating: 'AA-' as SPRating, pd: 0.0005 },
      { rating: 'A+' as SPRating, pd: 0.0008 },
      { rating: 'A' as SPRating, pd: 0.0012 },
      { rating: 'A-' as SPRating, pd: 0.0018 },
      { rating: 'BBB+' as SPRating, pd: 0.0025 },
      { rating: 'BBB' as SPRating, pd: 0.0035 },
      { rating: 'BBB-' as SPRating, pd: 0.0050 },
      { rating: 'BB+' as SPRating, pd: 0.0075 },
      { rating: 'BB' as SPRating, pd: 0.0125 },
      { rating: 'BB-' as SPRating, pd: 0.0200 },
      { rating: 'B+' as SPRating, pd: 0.0350 },
      { rating: 'B' as SPRating, pd: 0.0600 },
      { rating: 'B-' as SPRating, pd: 0.1000 },
      { rating: 'CCC+' as SPRating, pd: 0.1500 },
      { rating: 'CCC' as SPRating, pd: 0.2500 },
      { rating: 'CCC-' as SPRating, pd: 0.4000 },
      { rating: 'CC' as SPRating, pd: 0.6000 },
      { rating: 'C' as SPRating, pd: 0.8000 },
      { rating: 'D' as SPRating, pd: 1.0000 }
    ],
    moodys: [
      { rating: 'Aaa' as MoodysRating, pd: 0.0001 },
      { rating: 'Aa1' as MoodysRating, pd: 0.0002 },
      { rating: 'Aa2' as MoodysRating, pd: 0.0003 },
      { rating: 'Aa3' as MoodysRating, pd: 0.0005 },
      { rating: 'A1' as MoodysRating, pd: 0.0008 },
      { rating: 'A2' as MoodysRating, pd: 0.0012 },
      { rating: 'A3' as MoodysRating, pd: 0.0018 },
      { rating: 'Baa1' as MoodysRating, pd: 0.0025 },
      { rating: 'Baa2' as MoodysRating, pd: 0.0035 },
      { rating: 'Baa3' as MoodysRating, pd: 0.0050 },
      { rating: 'Ba1' as MoodysRating, pd: 0.0075 },
      { rating: 'Ba2' as MoodysRating, pd: 0.0125 },
      { rating: 'Ba3' as MoodysRating, pd: 0.0200 },
      { rating: 'B1' as MoodysRating, pd: 0.0350 },
      { rating: 'B2' as MoodysRating, pd: 0.0600 },
      { rating: 'B3' as MoodysRating, pd: 0.1000 },
      { rating: 'Caa1' as MoodysRating, pd: 0.1500 },
      { rating: 'Caa2' as MoodysRating, pd: 0.2500 },
      { rating: 'Caa3' as MoodysRating, pd: 0.4000 },
      { rating: 'Ca' as MoodysRating, pd: 0.6000 },
      { rating: 'C' as MoodysRating, pd: 0.8000 },
      { rating: 'D' as MoodysRating, pd: 1.0000 }
    ],
    fitch: [
      { rating: 'AAA' as FitchRating, pd: 0.0001 },
      { rating: 'AA+' as FitchRating, pd: 0.0002 },
      { rating: 'AA' as FitchRating, pd: 0.0003 },
      { rating: 'AA-' as FitchRating, pd: 0.0005 },
      { rating: 'A+' as FitchRating, pd: 0.0008 },
      { rating: 'A' as FitchRating, pd: 0.0012 },
      { rating: 'A-' as FitchRating, pd: 0.0018 },
      { rating: 'BBB+' as FitchRating, pd: 0.0025 },
      { rating: 'BBB' as FitchRating, pd: 0.0035 },
      { rating: 'BBB-' as FitchRating, pd: 0.0050 },
      { rating: 'BB+' as FitchRating, pd: 0.0075 },
      { rating: 'BB' as FitchRating, pd: 0.0125 },
      { rating: 'BB-' as FitchRating, pd: 0.0200 },
      { rating: 'B+' as FitchRating, pd: 0.0350 },
      { rating: 'B' as FitchRating, pd: 0.0600 },
      { rating: 'B-' as FitchRating, pd: 0.1000 },
      { rating: 'CCC+' as FitchRating, pd: 0.1500 },
      { rating: 'CCC' as FitchRating, pd: 0.2500 },
      { rating: 'CCC-' as FitchRating, pd: 0.4000 },
      { rating: 'CC' as FitchRating, pd: 0.6000 },
      { rating: 'C' as FitchRating, pd: 0.8000 },
      { rating: 'RD' as FitchRating, pd: 0.9000 },
      { rating: 'D' as FitchRating, pd: 1.0000 }
    ]
  },
  lgdAssumptions: [
    { sector: 'Banking', lgd: 0.45 },
    { sector: 'Technology', lgd: 0.55 },
    { sector: 'Retail', lgd: 0.60 },
    { sector: 'Manufacturing', lgd: 0.50 },
    { sector: 'Energy', lgd: 0.40 },
    { sector: 'Healthcare', lgd: 0.35 },
    { sector: 'Real Estate', lgd: 0.30 },
    { sector: 'Telecom', lgd: 0.55 },
    { sector: 'Automotive', lgd: 0.65 },
    { sector: 'Agriculture', lgd: 0.45 }
  ],
  transitionMatrices: {
    // Initialize with empty arrays - will be populated from separate matrix files when Reset to Default is clicked
    internal: [],
    sp: [],
    moodys: [],
    fitch: []
  },
  stressScenarios: [
    {
      name: 'Mild Recession',
      pdMultiplier: 1.5,
      lgdMultiplier: 1.2,
      rateShift: 0.001,
      spreadShift: 0.002
    },
    {
      name: 'Severe Recession',
      pdMultiplier: 2.5,
      lgdMultiplier: 1.5,
      rateShift: 0.002,
      spreadShift: 0.005
    },
    {
      name: 'Financial Crisis',
      pdMultiplier: 4.0,
      lgdMultiplier: 2.0,
      rateShift: 0.01,
      spreadShift: 0.02
    },
    {
      name: 'Rate Hike',
      pdMultiplier: 1.2,
      lgdMultiplier: 1.0,
      rateShift: 0.02,
      spreadShift: 0.005
    }
  ]
};

// Données d'exemple pour les prêts
export const sampleLoans: Loan[] = [
  {
    id: '1',
    name: 'Tech Expansion Loan',
    clientName: 'TechCorp Inc.',
    portfolioId: 'default',
    type: 'term',
    status: 'active',
    startDate: '2023-01-15',
    endDate: '2028-01-15',
    currency: 'EUR',
    originalAmount: 10000000,
    outstandingAmount: 9500000,
    drawnAmount: 8000000,
    undrawnAmount: 1500000,
    pd: 0.0041,
    lgd: 0.55,
    ead: 9000000,
    fees: {
      upfront: 100000,
      commitment: 0.005,
      agency: 20000,
      other: 15000
    },
    margin: 0.025,
    referenceRate: 0.015,
    fundingIndex: 'EUR3M',
    ratings: {
      internal: 'BBB',
      sp: 'BBB',
      moodys: 'Baa2',
      fitch: 'BBB'
    },
    internalRating: 'BBB',
    sector: 'Technology',
    country: 'France',
    cashFlows: [
      {
        id: 'cf1-1',
        date: '2023-01-15',
        type: 'drawdown',
        amount: 5000000,
        isManual: false
      },
      {
        id: 'cf1-2',
        date: '2023-06-15',
        type: 'drawdown',
        amount: 3000000,
        isManual: false
      },
      {
        id: 'cf1-3',
        date: '2023-12-15',
        type: 'interest',
        amount: 250000,
        isManual: false
      },
      {
        id: 'cf1-4',
        date: '2024-06-15',
        type: 'repayment',
        amount: 500000,
        isManual: false
      }
    ],
    metrics: {
      evaIntrinsic: 0,
      evaSale: 0,
      expectedLoss: 0,
      rwa: 0,
      roe: 0,
      raroc: 0,
      costOfRisk: 0,
      capitalConsumption: 0,
      netMargin: 0,
      effectiveYield: 0
    }
  },
  {
    id: '2',
    name: 'Retail Expansion Facility',
    clientName: 'RetailGroup SA',
    portfolioId: 'default',
    type: 'revolver',
    status: 'active',
    startDate: '2022-08-20',
    endDate: '2026-08-20',
    currency: 'EUR',
    originalAmount: 15000000,
    outstandingAmount: 12000000,
    drawnAmount: 9000000,
    undrawnAmount: 3000000,
    pd: 0.0121,
    lgd: 0.60,
    ead: 10800000,
    fees: {
      upfront: 75000,
      commitment: 0.0045,
      agency: 25000,
      other: 10000
    },
    margin: 0.03,
    referenceRate: 0.015,
    fundingIndex: 'EUR3M',
    ratings: {
      internal: 'BB',
      sp: 'BB',
      moodys: 'Ba2',
      fitch: 'BB'
    },
    internalRating: 'BB',
    sector: 'Retail',
    country: 'Germany',
    cashFlows: [
      {
        id: 'cf2-1',
        date: '2022-08-20',
        type: 'drawdown',
        amount: 6000000,
        isManual: false
      },
      {
        id: 'cf2-2',
        date: '2023-02-20',
        type: 'drawdown',
        amount: 3000000,
        isManual: false
      },
      {
        id: 'cf2-3',
        date: '2023-08-20',
        type: 'interest',
        amount: 337500,
        isManual: false
      },
      {
        id: 'cf2-4',
        date: '2024-02-20',
        type: 'repayment',
        amount: 3000000,
        isManual: true
      }
    ],
    metrics: {
      evaIntrinsic: 0,
      evaSale: 0,
      expectedLoss: 0,
      rwa: 0,
      roe: 0,
      raroc: 0,
      costOfRisk: 0,
      capitalConsumption: 0,
      netMargin: 0,
      effectiveYield: 0
    }
  },
  {
    id: '3',
    name: 'Energy Infrastructure Project',
    clientName: 'GreenEnergy Corp',
    type: 'term',
    status: 'active',
    startDate: '2023-03-10',
    endDate: '2033-03-10',
    currency: 'EUR',
    originalAmount: 25000000,
    outstandingAmount: 25000000,
    drawnAmount: 20000000,
    undrawnAmount: 5000000,
    pd: 0.0267,
    lgd: 0.40,
    ead: 22500000,
    fees: {
      upfront: 250000,
      commitment: 0.006,
      agency: 40000,
      other: 30000
    },
    margin: 0.035,
    referenceRate: 0.015,
    internalRating: 'B',
    sector: 'Energy',
    country: 'Spain',
    cashFlows: [
      {
        id: 'cf3-1',
        date: '2023-03-10',
        type: 'drawdown',
        amount: 15000000,
        isManual: false
      },
      {
        id: 'cf3-2',
        date: '2023-09-10',
        type: 'drawdown',
        amount: 5000000,
        isManual: false
      },
      {
        id: 'cf3-3',
        date: '2024-03-10',
        type: 'interest',
        amount: 800000,
        isManual: false
      },
      {
        id: 'cf3-4',
        date: '2025-03-10',
        type: 'repayment',
        amount: 2500000,
        isManual: false
      }
    ],
    metrics: {
      evaIntrinsic: 0,
      evaSale: 0,
      expectedLoss: 0,
      rwa: 0,
      roe: 0,
      raroc: 0,
      costOfRisk: 0,
      capitalConsumption: 0,
      netMargin: 0,
      effectiveYield: 0
    }
  },
  {
    id: '4',
    name: 'Real Estate Development Loan',
    clientName: 'PropDev SA',
    type: 'bullet',
    status: 'active',
    startDate: '2022-12-05',
    endDate: '2027-12-05',
    currency: 'EUR',
    originalAmount: 8000000,
    outstandingAmount: 8000000,
    drawnAmount: 8000000,
    undrawnAmount: 0,
    pd: 0.0041,
    lgd: 0.30,
    ead: 8000000,
    fees: {
      upfront: 120000,
      commitment: 0,
      agency: 15000,
      other: 20000
    },
    margin: 0.028,
    referenceRate: 0.015,
    internalRating: 'BBB',
    sector: 'Real Estate',
    country: 'France',
    cashFlows: [
      {
        id: 'cf4-1',
        date: '2022-12-05',
        type: 'drawdown',
        amount: 8000000,
        isManual: false
      },
      {
        id: 'cf4-2',
        date: '2023-12-05',
        type: 'interest',
        amount: 344000,
        isManual: false
      },
      {
        id: 'cf4-3',
        date: '2027-12-05',
        type: 'repayment',
        amount: 8000000,
        isManual: false
      }
    ],
    metrics: {
      evaIntrinsic: 0,
      evaSale: 0,
      expectedLoss: 0,
      rwa: 0,
      roe: 0,
      raroc: 0,
      costOfRisk: 0,
      capitalConsumption: 0,
      netMargin: 0,
      effectiveYield: 0
    }
  },
  {
    id: '5',
    name: 'Healthcare Acquisition Facility',
    clientName: 'MediGroup AG',
    type: 'term',
    status: 'active',
    startDate: '2023-06-15',
    endDate: '2028-06-15',
    currency: 'EUR',
    originalAmount: 12000000,
    outstandingAmount: 12000000,
    drawnAmount: 10000000,
    undrawnAmount: 2000000,
    pd: 0.0017,
    lgd: 0.35,
    ead: 10700000,
    fees: {
      upfront: 90000,
      commitment: 0.004,
      agency: 15000,
      other: 10000
    },
    margin: 0.02,
    referenceRate: 0.015,
    internalRating: 'A',
    sector: 'Healthcare',
    country: 'Switzerland',
    cashFlows: [
      {
        id: 'cf5-1',
        date: '2023-06-15',
        type: 'drawdown',
        amount: 10000000,
        isManual: false
      },
      {
        id: 'cf5-2',
        date: '2023-12-15',
        type: 'fee',
        amount: 8000,
        isManual: false,
        description: 'Commitment fee'
      },
      {
        id: 'cf5-3',
        date: '2024-06-15',
        type: 'interest',
        amount: 350000,
        isManual: false
      },
      {
        id: 'cf5-4',
        date: '2025-06-15',
        type: 'repayment',
        amount: 2000000,
        isManual: false
      }
    ],
    metrics: {
      evaIntrinsic: 0,
      evaSale: 0,
      expectedLoss: 0,
      rwa: 0,
      roe: 0,
      raroc: 0,
      costOfRisk: 0,
      capitalConsumption: 0,
      netMargin: 0,
      effectiveYield: 0
    }
  }
];

// Portefeuille d'exemple
export const samplePortfolio: Portfolio = {
  id: '1',
  name: 'Corporate Loan Portfolio',
  description: 'Portefeuille principal de crédits corporate',
  loans: sampleLoans,
  metrics: {
    totalExposure: 0,
    totalDrawn: 0,
    totalUndrawn: 0,
    weightedAveragePD: 0,
    weightedAverageLGD: 0,
    totalExpectedLoss: 0,
    totalRWA: 0,
    portfolioROE: 0,
    portfolioRAROC: 0,
    evaSumIntrinsic: 0,
    evaSumSale: 0,
    diversificationBenefit: 0
  }
};

import { 
  Loan, 
  LoanMetrics, 
  PortfolioMetrics, 
  CalculationParameters, 
  S_P_RATING_MAPPINGS, 
  RatingMapping,
  SPRating,
  RatingType,
  LoanRatings,
  MOODYS_TO_SP_MAPPING,
  FITCH_TO_SP_MAPPING,
  INTERNAL_TO_SP_MAPPING,
  FundingIndex
} from '../types/finance';
import FundingIndexService from '../services/FundingIndexService';
import { calculateEffectiveLGD } from './lgdModels';

// Helper function to get available rating types for a loan
export const getAvailableRatingTypes = (ratings: LoanRatings): RatingType[] => {
  const available: RatingType[] = [];
  if (ratings.internal && ratings.internal !== 'N/A') available.push('internal');
  if (ratings.sp && ratings.sp !== 'N/A') available.push('sp');
  if (ratings.moodys && ratings.moodys !== 'N/A') available.push('moodys');
  if (ratings.fitch && ratings.fitch !== 'N/A') available.push('fitch');
  return available;
};

// Helper function to convert any rating to S&P equivalent for calculations
export const convertToSPRating = (ratings: LoanRatings, preferredType?: RatingType): SPRating => {
  // If preferred type is available, use it
  if (preferredType) {
    switch (preferredType) {
      case 'sp':
        if (ratings.sp && ratings.sp !== 'N/A') return ratings.sp;
        break;
      case 'moodys':
        if (ratings.moodys && ratings.moodys !== 'N/A') return MOODYS_TO_SP_MAPPING[ratings.moodys];
        break;
      case 'fitch':
        if (ratings.fitch && ratings.fitch !== 'N/A') return FITCH_TO_SP_MAPPING[ratings.fitch];
        break;
      case 'internal':
        if (ratings.internal && ratings.internal !== 'N/A') return INTERNAL_TO_SP_MAPPING[ratings.internal];
        break;
    }
  }

  // Fallback hierarchy: S&P > Internal > Moody's > Fitch > Default
  if (ratings.sp && ratings.sp !== 'N/A') return ratings.sp;
  if (ratings.internal && ratings.internal !== 'N/A') return INTERNAL_TO_SP_MAPPING[ratings.internal];
  if (ratings.moodys && ratings.moodys !== 'N/A') return MOODYS_TO_SP_MAPPING[ratings.moodys];
  if (ratings.fitch && ratings.fitch !== 'N/A') return FITCH_TO_SP_MAPPING[ratings.fitch];
  
  // Default to BB- if no ratings available
  return 'BB-';
};

// Helper function to get PD value from parameters based on rating and type
export const getPDFromParameters = (
  ratings: LoanRatings, 
  params: CalculationParameters,
  preferredRatingType?: RatingType
): number => {
  // If preferred type is available and we have parameter mappings, use them
  if (preferredRatingType && params.ratingPDMappings) {
    switch (preferredRatingType) {
      case 'sp':
        if (ratings.sp && ratings.sp !== 'N/A') {
          const mapping = params.ratingPDMappings.sp?.find(m => m.rating === ratings.sp);
          if (mapping) return mapping.pd;
        }
        break;
      case 'moodys':
        if (ratings.moodys && ratings.moodys !== 'N/A') {
          const mapping = params.ratingPDMappings.moodys?.find(m => m.rating === ratings.moodys);
          if (mapping) return mapping.pd;
        }
        break;
      case 'fitch':
        if (ratings.fitch && ratings.fitch !== 'N/A') {
          const mapping = params.ratingPDMappings.fitch?.find(m => m.rating === ratings.fitch);
          if (mapping) return mapping.pd;
        }
        break;
      case 'internal':
        if (ratings.internal && ratings.internal !== 'N/A') {
          const mapping = params.ratingPDMappings.internal?.find(m => m.rating === ratings.internal);
          if (mapping) return mapping.pd;
        }
        break;
    }
  }

  // Fallback: convert to S&P and get PD from parameters or default mappings
  const spRating = convertToSPRating(ratings, preferredRatingType);
  
  // Try to get from parameter mappings first
  if (params.ratingPDMappings?.sp) {
    const mapping = params.ratingPDMappings.sp.find(m => m.rating === spRating);
    if (mapping) return mapping.pd;
  }
  
  // Final fallback to hardcoded S&P mappings
  const mapping = S_P_RATING_MAPPINGS.find(r => r.rating === spRating);
  if (mapping) return mapping.pd;
  
  // Default PD if nothing found
  return 0.0125; // BB equivalent
};



// Helper function to get rating mapping (updated to support parameter-based PD)
export const getRatingMapping = (loan: Loan, params: CalculationParameters, preferredRatingType?: RatingType): RatingMapping => {
  let spRating: SPRating;
  let pd: number;
  
  // If loan has ratings object, use the conversion function and parameter-based PD
  if (loan.ratings) {
    spRating = convertToSPRating(loan.ratings, preferredRatingType);
    pd = getPDFromParameters(loan.ratings, params, preferredRatingType);
  } else {
    // Backward compatibility: use internalRating as S&P rating
    spRating = loan.internalRating;
    const mapping = S_P_RATING_MAPPINGS.find(r => r.rating === spRating);
    pd = mapping ? mapping.pd : 0.0125;
  }
  
  // Get risk weight from default S&P mappings (this doesn't change based on parameters)
  const defaultMapping = S_P_RATING_MAPPINGS.find(r => r.rating === spRating);
  const riskWeight = defaultMapping ? defaultMapping.riskWeight : 1.5;
  
  return {
    rating: spRating,
    pd: pd,
    riskWeight: riskWeight
  };
};

// Helper: Calculate CCF for revolvers
function getCCF(loan: Loan): number {
  // Support a 'revocableImmediately' flag for CCF logic
  if ((loan as any).revocableImmediately) return 0.1;
  const start = new Date(loan.startDate);
  const end = new Date(loan.endDate);
  const durationYears = (end.getTime() - start.getTime()) / (365 * 24 * 60 * 60 * 1000);
  if (durationYears > 1) return 0.4;
  if (durationYears < 1) return 0.2;
  return 0.1; // fallback (should be explicit if flag exists)
}

// Helper: Calculate EAD for revolvers
function calculateRevolverEAD(loan: Loan): number {
  const ccf = getCCF(loan);
  return loan.drawnAmount + (loan.undrawnAmount * ccf);
}

// Helper: Calculate monthly interest for revolvers
function calculateRevolverMonthlyInterest(loan: Loan, params: CalculationParameters): number {
  // Annual rate = referenceRate + fundingIndexRate + margin + operationalCost + capitalCost
  return loan.drawnAmount * (getTotalInterestRate(loan, params) / 12);
}

// Helper: Calculate annual commission for revolvers
function calculateRevolverAnnualCommission(loan: Loan): number {
  return loan.undrawnAmount * loan.fees.commitment;
}

// Patch: calculateExpectedLoss
export const calculateExpectedLoss = (loan: Loan): number => {
  // Use variable LGD if available, otherwise use constant LGD
  const effectiveLGD = loan.lgdType === 'variable' && loan.lgdVariable 
    ? calculateEffectiveLGD(loan)
    : loan.lgd;
    
  if (loan.type === 'revolver') {
    // Use EAD for revolver
    const ead = calculateRevolverEAD(loan);
    return loan.pd * effectiveLGD * ead;
  }
  return loan.pd * effectiveLGD * loan.ead;
};

// Patch: calculateRWA
export const calculateRWA = (loan: Loan, params: CalculationParameters, preferredRatingType?: RatingType): number => {
  const ratingMapping = getRatingMapping(loan, params, preferredRatingType);
  const riskWeight = ratingMapping.riskWeight;
  if (loan.type === 'revolver') {
    const ead = calculateRevolverEAD(loan);
    return ead * riskWeight;
  }
  return loan.ead * riskWeight;
};

// Calcul du Return on Equity (ROE)
export const calculateROE = (loan: Loan, params: CalculationParameters, preferredRatingType?: RatingType): number => {
  const rwa = calculateRWA(loan, params, preferredRatingType);
  const capitalRequired = rwa * params.capitalRatio;
  
  // Calcul correct du revenu annuel en tenant compte de la durée du prêt en années
  const loanDurationMs = (loan.endDate ? new Date(loan.endDate).getTime() : 0) - 
                         (loan.startDate ? new Date(loan.startDate).getTime() : 0);
  const loanDurationYears = loanDurationMs / (365 * 24 * 60 * 60 * 1000);
  
  const annualInterestIncome = getTotalInterestRate(loan, params) * loan.drawnAmount;
  const annualCommitmentFee = loan.fees.commitment * loan.undrawnAmount;
  const upfrontFeesAmortized = (loan.fees.upfront + loan.fees.agency + loan.fees.other) / 
                              Math.max(loanDurationYears, 1); // Éviter division par zéro
  
  const annualIncome = annualInterestIncome + annualCommitmentFee + upfrontFeesAmortized;
  
  const fundingCost = params.fundingCost * loan.drawnAmount;
  const operationalCost = params.operationalCostRatio * loan.originalAmount;
  const expectedLoss = calculateExpectedLoss(loan);
  
  const profitBeforeTax = annualIncome - fundingCost - operationalCost - expectedLoss;
  const profitAfterTax = profitBeforeTax * (1 - params.corporateTaxRate);
  
  return capitalRequired > 0 ? profitAfterTax / capitalRequired : 0;
};

// Calcul de l'EVA Intrinsèque
export const calculateEVAIntrinsic = (loan: Loan, params: CalculationParameters, preferredRatingType?: RatingType): number => {
  const roe = calculateROE(loan, params, preferredRatingType);
  const rwa = calculateRWA(loan, params, preferredRatingType);
  const capitalRequired = rwa * params.capitalRatio;
  
  return (roe - params.targetROE) * capitalRequired;
};

// Calcul de l'EVA de Cession
export const calculateEVASale = (loan: Loan, params: CalculationParameters, salePriceOrRatingType?: number | RatingType, salePrice: number = 1): number => {
  let preferredRatingType: RatingType | undefined;
  let actualSalePrice = salePrice;
  
  // Handle parameter overload: if third param is string, it's rating type
  if (typeof salePriceOrRatingType === 'string') {
    preferredRatingType = salePriceOrRatingType;
  } else if (typeof salePriceOrRatingType === 'number') {
    actualSalePrice = salePriceOrRatingType;
  }
  
  const evaIntrinsic = calculateEVAIntrinsic(loan, params, preferredRatingType);
  const bookValue = loan.drawnAmount;
  const saleImpact = (actualSalePrice - bookValue) * (1 - params.corporateTaxRate);
  
  return evaIntrinsic + saleImpact;
};

// Calcul du RAROC (Risk-Adjusted Return on Capital)
export const calculateRAROC = (loan: Loan, params: CalculationParameters, preferredRatingType?: RatingType): number => {
  const rwa = calculateRWA(loan, params, preferredRatingType);
  const capitalRequired = rwa * params.capitalRatio;
  
  // Utilisation de la même logique que pour le calcul du ROE mais avant impôts
  const loanDurationMs = (loan.endDate ? new Date(loan.endDate).getTime() : 0) - 
                         (loan.startDate ? new Date(loan.startDate).getTime() : 0);
  const loanDurationYears = loanDurationMs / (365 * 24 * 60 * 60 * 1000);
  
  const annualInterestIncome = getTotalInterestRate(loan, params) * loan.drawnAmount;
  const annualCommitmentFee = loan.fees.commitment * loan.undrawnAmount;
  const upfrontFeesAmortized = (loan.fees.upfront + loan.fees.agency + loan.fees.other) / 
                              Math.max(loanDurationYears, 1);
  
  const annualIncome = annualInterestIncome + annualCommitmentFee + upfrontFeesAmortized;
  
  const fundingCost = params.fundingCost * loan.drawnAmount;
  const operationalCost = params.operationalCostRatio * loan.originalAmount;
  const expectedLoss = calculateExpectedLoss(loan);
  
  const riskAdjustedProfit = annualIncome - fundingCost - operationalCost - expectedLoss;
  
  return capitalRequired > 0 ? riskAdjustedProfit / capitalRequired : 0;
};

// Patch: calculateLoanMetrics
export const calculateLoanMetrics = (loan: Loan, params: CalculationParameters, preferredRatingType?: RatingType): LoanMetrics => {
  
  if (loan.type === 'revolver') {
    const ead = calculateRevolverEAD(loan);
    const rwa = ead * getRatingMapping(loan, params, preferredRatingType).riskWeight;
    const expectedLoss = calculateExpectedLoss(loan);
    const monthlyInterest = calculateRevolverMonthlyInterest(loan, params);
    const annualCommission = calculateRevolverAnnualCommission(loan);
    const capitalConsumption = rwa * params.capitalRatio;
    // Compute ROE, RAROC, netMargin, effectiveYield for revolvers
    const loanDurationMs = (loan.endDate ? new Date(loan.endDate).getTime() : 0) - (loan.startDate ? new Date(loan.startDate).getTime() : 0);
    const loanDurationYears = loanDurationMs / (365 * 24 * 60 * 60 * 1000);
    const annualInterestIncome = getTotalInterestRate(loan, params) * loan.drawnAmount;
    const annualCommitmentFee = loan.fees.commitment * loan.undrawnAmount;
    const upfrontFeesAmortized = (loan.fees.upfront + loan.fees.agency + loan.fees.other) / Math.max(loanDurationYears, 1);
    const annualIncome = annualInterestIncome + annualCommitmentFee + upfrontFeesAmortized;
    const fundingCost = params.fundingCost * loan.drawnAmount;
    const operationalCost = params.operationalCostRatio * loan.originalAmount;
    const profitBeforeTax = annualIncome - fundingCost - operationalCost - expectedLoss;
    const profitAfterTax = profitBeforeTax * (1 - params.corporateTaxRate);
    const roe = capitalConsumption > 0 ? profitAfterTax / capitalConsumption : 0;
    const raroc = capitalConsumption > 0 ? profitBeforeTax / capitalConsumption : 0;
    const costOfRisk = expectedLoss / (loan.drawnAmount || 1);
    const netMargin = getTotalInterestRate(loan, params) - (params.fundingCost + params.operationalCostRatio + costOfRisk);
    const feesPerYear = (loan.fees.upfront + loan.fees.agency + loan.fees.other) / Math.max(loanDurationYears, 1);
    const effectiveYield = getTotalInterestRate(loan, params) + (feesPerYear / (loan.drawnAmount || 1));
    return {
      evaIntrinsic: (roe - params.targetROE) * capitalConsumption,
      evaSale: 0, // Not directly specified for revolvers
      expectedLoss,
      rwa,
      roe,
      raroc,
      costOfRisk,
      capitalConsumption,
      netMargin,
      effectiveYield,
      monthlyInterest,
      annualCommission
    };
  }
  // Default for other types
  const expectedLoss = calculateExpectedLoss(loan);
  const rwa = calculateRWA(loan, params, preferredRatingType);
  const roe = calculateROE(loan, params, preferredRatingType);
  const raroc = calculateRAROC(loan, params, preferredRatingType);
  const evaIntrinsic = calculateEVAIntrinsic(loan, params, preferredRatingType);
  const evaSale = calculateEVASale(loan, params, preferredRatingType);
  const capitalConsumption = rwa * params.capitalRatio;
  const costOfRisk = expectedLoss / (loan.drawnAmount || 1); // Avoid division by zero
  const netMargin = getTotalInterestRate(loan, params) - (params.fundingCost + params.operationalCostRatio + costOfRisk);
  // Calcul correct du yield effectif
  const loanDurationMs = (loan.endDate ? new Date(loan.endDate).getTime() : 0) - 
                         (loan.startDate ? new Date(loan.startDate).getTime() : 0);
  const loanDurationYears = loanDurationMs / (365 * 24 * 60 * 60 * 1000);
  const feesPerYear = (loan.fees.upfront + loan.fees.agency + loan.fees.other) / 
                     Math.max(loanDurationYears, 1);
  const effectiveYield = getTotalInterestRate(loan, params) + 
                         (feesPerYear / (loan.drawnAmount || 1));
  return {
    evaIntrinsic,
    evaSale,
    expectedLoss,
    rwa,
    roe,
    raroc,
    costOfRisk,
    capitalConsumption,
    netMargin,
    effectiveYield
  };
};

// Calcul des métriques d'un portefeuille
export const calculatePortfolioMetrics = (loans: Loan[], params: CalculationParameters, preferredRatingType?: RatingType): PortfolioMetrics => {
  // Filtrer les prêts avec montant nul pour éviter les erreurs de calcul
  const validLoans = loans.filter(loan => loan.originalAmount > 0);
  
  const totalExposure = validLoans.reduce((sum, loan) => sum + loan.originalAmount, 0);
  const totalDrawn = validLoans.reduce((sum, loan) => sum + loan.drawnAmount, 0);
  const totalUndrawn = validLoans.reduce((sum, loan) => sum + loan.undrawnAmount, 0);
  
  // Moyennes pondérées
  const weightedAveragePD = totalExposure > 0 
    ? validLoans.reduce((sum, loan) => sum + (loan.pd * loan.originalAmount), 0) / totalExposure 
    : 0;
    
  const weightedAverageLGD = totalExposure > 0 
    ? validLoans.reduce((sum, loan) => {
        const effectiveLGD = loan.lgdType === 'variable' && loan.lgdVariable 
          ? calculateEffectiveLGD(loan)
          : loan.lgd;
        return sum + (effectiveLGD * loan.originalAmount);
      }, 0) / totalExposure 
    : 0;
  
  const totalExpectedLoss = validLoans.reduce((sum, loan) => sum + calculateExpectedLoss(loan), 0);
  const totalRWA = validLoans.reduce((sum, loan) => sum + calculateRWA(loan, params, preferredRatingType), 0);
  
  const totalCapitalRequired = totalRWA * params.capitalRatio;
  
  // Calcul des revenus et coûts totaux du portefeuille
  const totalAnnualIncome = validLoans.reduce((sum, loan) => {
    const loanDurationMs = (loan.endDate ? new Date(loan.endDate).getTime() : 0) - 
                          (loan.startDate ? new Date(loan.startDate).getTime() : 0);
    const loanDurationYears = loanDurationMs / (365 * 24 * 60 * 60 * 1000);
    
    const annualInterestIncome = getTotalInterestRate(loan, params) * loan.drawnAmount;
    const annualCommitmentFee = loan.fees.commitment * loan.undrawnAmount;
    const upfrontFeesAmortized = (loan.fees.upfront + loan.fees.agency + loan.fees.other) / 
                                Math.max(loanDurationYears, 1);
    
    return sum + annualInterestIncome + annualCommitmentFee + upfrontFeesAmortized;
  }, 0);
  
  const totalFundingCost = validLoans.reduce((sum, loan) => {
    return sum + params.fundingCost * loan.drawnAmount;
  }, 0);
  const totalOperationalCost = validLoans.reduce((sum, loan) => {
    return sum + params.operationalCostRatio * loan.originalAmount;
  }, 0);
  
  const portfolioProfitBeforeTax = totalAnnualIncome - totalFundingCost - totalOperationalCost - totalExpectedLoss;
  const portfolioProfitAfterTax = portfolioProfitBeforeTax * (1 - params.corporateTaxRate);
  
  const portfolioROE = totalCapitalRequired > 0 ? portfolioProfitAfterTax / totalCapitalRequired : 0;
  const portfolioRAROC = totalCapitalRequired > 0 ? portfolioProfitBeforeTax / totalCapitalRequired : 0;
  
  // Calcul des sommes EVA
  const evaSumIntrinsic = validLoans.reduce((sum, loan) => sum + calculateEVAIntrinsic(loan, params, preferredRatingType), 0);
  const evaSumSale = validLoans.reduce((sum, loan) => sum + calculateEVASale(loan, params, preferredRatingType), 0);
  
  // Calcul du bénéfice de diversification
  // Approche simplifiée: une corrélation parfaite serait égale à la somme des EL individuels
  // Toute réduction est le bénéfice de diversification
  const perfectCorrelationEL = totalExpectedLoss;
  // En réalité, vous utiliseriez une matrice de corrélation entre les prêts
  // Pour l'instant, nous utiliserons une réduction simple de 20 % comme espace réservé
  const diversificationBenefit = perfectCorrelationEL * 0.2;
  
  return {
    totalExposure,
    totalDrawn,
    totalUndrawn,
    weightedAveragePD,
    weightedAverageLGD,
    totalExpectedLoss,
    totalRWA,
    portfolioROE,
    portfolioRAROC,
    evaSumIntrinsic,
    evaSumSale,
    diversificationBenefit
  };
};

// Fonction pour simuler un scénario avec des variations des paramètres
// Function to update loan PD based on new parameter mappings
export const updateLoanPDFromParameters = (loan: Loan, params: CalculationParameters, preferredRatingType?: RatingType): Loan => {
  // If loan has ratings, recalculate PD from parameters
  if (loan.ratings) {
    const newPD = getPDFromParameters(loan.ratings, params, preferredRatingType);
    return { ...loan, pd: newPD };
  }
  
  // For loans without ratings object, try to use internalRating
  if (loan.internalRating && loan.internalRating !== 'N/A') {
    // Create a ratings object from the internalRating for backward compatibility
    const tempRatings: LoanRatings = {
      internal: loan.internalRating as any // Type assertion for backward compatibility
    };
    const newPD = getPDFromParameters(tempRatings, params, 'internal');
    return { ...loan, pd: newPD };
  }
  
  // If no ratings available, keep existing PD
  return loan;
};

// Function to update all loans with new PD values based on parameter changes
export const updateLoansWithNewParameters = (loans: Loan[], params: CalculationParameters, preferredRatingType?: RatingType): Loan[] => {
  return loans.map(loan => {
    // Update PD based on ratings and new parameters
    const loanWithNewPD = updateLoanPDFromParameters(loan, params, preferredRatingType);
    
    // Recalculate all metrics with new parameters and PD
    // Note: The calculateLoanMetrics function will use frozen costs if available
    const newMetrics = calculateLoanMetrics(loanWithNewPD, params, preferredRatingType);
    
    return {
      ...loanWithNewPD,
      metrics: newMetrics
    };
  });
};

export const simulateScenario = (
  loans: Loan[], 
  params: CalculationParameters,
  pdMultiplier: number = 1,
  lgdMultiplier: number = 1,
  rateShift: number = 0,
  spreadShift: number = 0
): PortfolioMetrics => {
  // Copie profonde des prêts pour appliquer les changements sans modifier les originaux
  const modifiedLoans = loans.map(loan => {
    const modifiedLoan = {
      ...loan,
      pd: loan.pd * pdMultiplier,
      margin: loan.margin + spreadShift,
      referenceRate: loan.referenceRate + rateShift
    };
    
    // Handle LGD multiplier differently for variable vs constant LGD
    if (loan.lgdType === 'variable' && loan.lgdVariable) {
      // For variable LGD, apply multiplier to the initial value and parameters
      modifiedLoan.lgdVariable = {
        ...loan.lgdVariable,
        initialValue: loan.lgdVariable.initialValue * lgdMultiplier,
        parameters: {
          ...loan.lgdVariable.parameters,
          depreciationRate: loan.lgdVariable.parameters.depreciationRate ? 
            loan.lgdVariable.parameters.depreciationRate * lgdMultiplier : undefined,
          appreciationRate: loan.lgdVariable.parameters.appreciationRate ? 
            loan.lgdVariable.parameters.appreciationRate * lgdMultiplier : undefined
        }
      };
    } else {
      // For constant LGD, apply multiplier directly
      modifiedLoan.lgd = loan.lgd * lgdMultiplier;
    }
    
    return modifiedLoan;
  });
  
  return calculatePortfolioMetrics(modifiedLoans, params);
};

// Helper function to get current funding index rate for a loan
export const getCurrentFundingIndexRate = (loan: Loan): number => {
  const fundingIndexService = FundingIndexService.getInstance();
  
  // If loan has a specific funding index, use it
  if (loan.fundingIndex) {
    const indexData = fundingIndexService.getFundingIndexData(loan.fundingIndex);
    if (indexData) {
      return indexData.currentValue / 100; // Convert from percentage to decimal
    }
  }
  
  // Otherwise, get the default funding index for the loan's currency
  const defaultIndexData = fundingIndexService.getFundingIndexDataWithFallback(loan.currency);
  return defaultIndexData.currentValue / 100; // Convert from percentage to decimal
};

// Helper function to get the total interest rate for cashflow calculations
export const getTotalInterestRate = (loan: Loan, params?: CalculationParameters): number => {
  const fundingIndexRate = getCurrentFundingIndexRate(loan);
  const baseRate = loan.referenceRate + fundingIndexRate + loan.margin;
  
  // If params are provided, include operational and capital costs
  if (params) {
    const operationalCost = params.operationalCostRatio;
    
    // Calculate capital cost dynamically based on loan's capital requirements
    const rwa = calculateRWA(loan, params);
    const capitalRequired = rwa * params.capitalRatio;
    const capitalCost = (params.targetROE * capitalRequired) / (loan.drawnAmount || loan.originalAmount);
    
    return baseRate + operationalCost + capitalCost;
  }
  
  return baseRate;
};

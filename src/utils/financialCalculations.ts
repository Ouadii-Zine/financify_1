import { Loan, LoanMetrics, PortfolioMetrics, CalculationParameters, S_P_RATING_MAPPINGS, RatingMapping } from '../types/finance';

// Helper function to get rating mapping
export const getRatingMapping = (rating: string): RatingMapping => {
  const mapping = S_P_RATING_MAPPINGS.find(r => r.rating === rating);
  if (!mapping) {
    // Default to BB- if rating not found
    return S_P_RATING_MAPPINGS.find(r => r.rating === 'BB-')!;
  }
  return mapping;
};

// Calcul de l'Expected Loss (EL)
export const calculateExpectedLoss = (loan: Loan): number => {
  return loan.pd * loan.lgd * loan.ead;
};

// Calcul des Risk-Weighted Assets (RWA) using S&P ratings
export const calculateRWA = (loan: Loan, params: CalculationParameters): number => {
  const ratingMapping = getRatingMapping(loan.internalRating);
  
  // Use the risk weight from S&P rating mapping
  const riskWeight = ratingMapping.riskWeight;
  
  // Calculate RWA using the standard formula: RWA = EAD × Risk Weight × 100%
  // Risk weight is already in percentage terms (e.g., 1.5 for BB+)
  return loan.ead * riskWeight;
};

// Calcul du Return on Equity (ROE)
export const calculateROE = (loan: Loan, params: CalculationParameters): number => {
  const rwa = calculateRWA(loan, params);
  const capitalRequired = rwa * params.capitalRatio;
  
  // Calcul correct du revenu annuel en tenant compte de la durée du prêt en années
  const loanDurationMs = (loan.endDate ? new Date(loan.endDate).getTime() : 0) - 
                         (loan.startDate ? new Date(loan.startDate).getTime() : 0);
  const loanDurationYears = loanDurationMs / (365 * 24 * 60 * 60 * 1000);
  
  const annualInterestIncome = (loan.margin + loan.referenceRate) * loan.drawnAmount;
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
export const calculateEVAIntrinsic = (loan: Loan, params: CalculationParameters): number => {
  const roe = calculateROE(loan, params);
  const rwa = calculateRWA(loan, params);
  const capitalRequired = rwa * params.capitalRatio;
  
  return (roe - params.targetROE) * capitalRequired;
};

// Calcul de l'EVA de Cession
export const calculateEVASale = (loan: Loan, params: CalculationParameters, salePrice: number = 1): number => {
  const evaIntrinsic = calculateEVAIntrinsic(loan, params);
  const bookValue = loan.drawnAmount;
  const saleImpact = (salePrice - bookValue) * (1 - params.corporateTaxRate);
  
  return evaIntrinsic + saleImpact;
};

// Calcul du RAROC (Risk-Adjusted Return on Capital)
export const calculateRAROC = (loan: Loan, params: CalculationParameters): number => {
  const rwa = calculateRWA(loan, params);
  const capitalRequired = rwa * params.capitalRatio;
  
  // Utilisation de la même logique que pour le calcul du ROE mais avant impôts
  const loanDurationMs = (loan.endDate ? new Date(loan.endDate).getTime() : 0) - 
                         (loan.startDate ? new Date(loan.startDate).getTime() : 0);
  const loanDurationYears = loanDurationMs / (365 * 24 * 60 * 60 * 1000);
  
  const annualInterestIncome = (loan.margin + loan.referenceRate) * loan.drawnAmount;
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

// Calcul des métriques complètes d'un prêt
export const calculateLoanMetrics = (loan: Loan, params: CalculationParameters): LoanMetrics => {
  const expectedLoss = calculateExpectedLoss(loan);
  const rwa = calculateRWA(loan, params);
  const roe = calculateROE(loan, params);
  const raroc = calculateRAROC(loan, params);
  const evaIntrinsic = calculateEVAIntrinsic(loan, params);
  const evaSale = calculateEVASale(loan, params);
  
  const capitalConsumption = rwa * params.capitalRatio;
  const costOfRisk = expectedLoss / (loan.drawnAmount || 1); // Éviter division par zéro
  const netMargin = loan.margin - (params.fundingCost + params.operationalCostRatio + costOfRisk);
  
  // Calcul correct du yield effectif
  const loanDurationMs = (loan.endDate ? new Date(loan.endDate).getTime() : 0) - 
                         (loan.startDate ? new Date(loan.startDate).getTime() : 0);
  const loanDurationYears = loanDurationMs / (365 * 24 * 60 * 60 * 1000);
  
  const feesPerYear = (loan.fees.upfront + loan.fees.agency + loan.fees.other) / 
                     Math.max(loanDurationYears, 1);
  const effectiveYield = (loan.margin + loan.referenceRate) + 
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
export const calculatePortfolioMetrics = (loans: Loan[], params: CalculationParameters): PortfolioMetrics => {
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
    ? validLoans.reduce((sum, loan) => sum + (loan.lgd * loan.originalAmount), 0) / totalExposure 
    : 0;
  
  const totalExpectedLoss = validLoans.reduce((sum, loan) => sum + calculateExpectedLoss(loan), 0);
  const totalRWA = validLoans.reduce((sum, loan) => sum + calculateRWA(loan, params), 0);
  
  const totalCapitalRequired = totalRWA * params.capitalRatio;
  
  // Calcul des revenus et coûts totaux du portefeuille
  const totalAnnualIncome = validLoans.reduce((sum, loan) => {
    const loanDurationMs = (loan.endDate ? new Date(loan.endDate).getTime() : 0) - 
                          (loan.startDate ? new Date(loan.startDate).getTime() : 0);
    const loanDurationYears = loanDurationMs / (365 * 24 * 60 * 60 * 1000);
    
    const annualInterestIncome = (loan.margin + loan.referenceRate) * loan.drawnAmount;
    const annualCommitmentFee = loan.fees.commitment * loan.undrawnAmount;
    const upfrontFeesAmortized = (loan.fees.upfront + loan.fees.agency + loan.fees.other) / 
                                Math.max(loanDurationYears, 1);
    
    return sum + annualInterestIncome + annualCommitmentFee + upfrontFeesAmortized;
  }, 0);
  
  const totalFundingCost = validLoans.reduce((sum, loan) => sum + params.fundingCost * loan.drawnAmount, 0);
  const totalOperationalCost = validLoans.reduce((sum, loan) => sum + params.operationalCostRatio * loan.originalAmount, 0);
  
  const portfolioProfitBeforeTax = totalAnnualIncome - totalFundingCost - totalOperationalCost - totalExpectedLoss;
  const portfolioProfitAfterTax = portfolioProfitBeforeTax * (1 - params.corporateTaxRate);
  
  const portfolioROE = totalCapitalRequired > 0 ? portfolioProfitAfterTax / totalCapitalRequired : 0;
  const portfolioRAROC = totalCapitalRequired > 0 ? portfolioProfitBeforeTax / totalCapitalRequired : 0;
  
  // Calcul des sommes EVA
  const evaSumIntrinsic = validLoans.reduce((sum, loan) => sum + calculateEVAIntrinsic(loan, params), 0);
  const evaSumSale = validLoans.reduce((sum, loan) => sum + calculateEVASale(loan, params), 0);
  
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
export const simulateScenario = (
  loans: Loan[], 
  params: CalculationParameters,
  pdMultiplier: number = 1,
  lgdMultiplier: number = 1,
  rateShift: number = 0,
  spreadShift: number = 0
): PortfolioMetrics => {
  // Copie profonde des prêts pour appliquer les changements sans modifier les originaux
  const modifiedLoans = loans.map(loan => ({
    ...loan,
    pd: loan.pd * pdMultiplier,
    lgd: loan.lgd * lgdMultiplier,
    margin: loan.margin + spreadShift,
    referenceRate: loan.referenceRate + rateShift
  }));
  
  return calculatePortfolioMetrics(modifiedLoans, params);
};

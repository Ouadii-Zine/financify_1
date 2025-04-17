
import { Loan, LoanMetrics, PortfolioMetrics, CalculationParameters } from '../types/finance';

// Calcul de l'Expected Loss (EL)
export const calculateExpectedLoss = (loan: Loan): number => {
  return loan.pd * loan.lgd * loan.ead;
};

// Calcul des Risk-Weighted Assets (RWA)
export const calculateRWA = (loan: Loan, params: CalculationParameters): number => {
  // Formule simplifiée pour RWA selon l'approche IRB
  const maturityAdjustment = 1 + (2.5 * ((loan.endDate ? new Date(loan.endDate).getTime() : 0) - 
                             (new Date().getTime())) / (365 * 24 * 60 * 60 * 1000));
  const correlationFactor = 0.12 * (1 - Math.exp(-50 * loan.pd)) / (1 - Math.exp(-50)) +
                           0.24 * (1 - (1 - Math.exp(-50 * loan.pd)) / (1 - Math.exp(-50)));
  
  const k = (1 - correlationFactor) * loan.lgd * loan.pd +
           correlationFactor * loan.lgd * 1.06 * Math.sqrt(1.5); // 1.06 est un facteur de confiance à 99.9%
  
  return loan.ead * k * maturityAdjustment * 12.5 * params.capitalRatio;
};

// Calcul du Return on Equity (ROE)
export const calculateROE = (loan: Loan, params: CalculationParameters): number => {
  const rwa = calculateRWA(loan, params);
  const capitalRequired = rwa * params.capitalRatio;
  const annualIncome = (loan.margin + loan.referenceRate) * loan.drawnAmount +
                       loan.fees.commitment * loan.undrawnAmount +
                       (loan.fees.upfront + loan.fees.agency + loan.fees.other) / 
                       ((loan.endDate ? new Date(loan.endDate).getTime() : 0) - 
                       (loan.startDate ? new Date(loan.startDate).getTime() : 0)) * 
                       (365 * 24 * 60 * 60 * 1000);
  
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
  const annualIncome = (loan.margin + loan.referenceRate) * loan.drawnAmount +
                       loan.fees.commitment * loan.undrawnAmount +
                       (loan.fees.upfront + loan.fees.agency + loan.fees.other) / 
                       ((loan.endDate ? new Date(loan.endDate).getTime() : 0) - 
                       (loan.startDate ? new Date(loan.startDate).getTime() : 0)) * 
                       (365 * 24 * 60 * 60 * 1000);
  
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
  const costOfRisk = expectedLoss / loan.drawnAmount;
  const netMargin = loan.margin - (params.fundingCost + params.operationalCostRatio + costOfRisk);
  const effectiveYield = (loan.margin + loan.referenceRate) + 
                         (loan.fees.upfront + loan.fees.agency + loan.fees.other) / 
                         (loan.drawnAmount * 
                         ((loan.endDate ? new Date(loan.endDate).getTime() : 0) - 
                         (loan.startDate ? new Date(loan.startDate).getTime() : 0)) * 
                         (365 * 24 * 60 * 60 * 1000));
  
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
  const totalExposure = loans.reduce((sum, loan) => sum + loan.originalAmount, 0);
  const totalDrawn = loans.reduce((sum, loan) => sum + loan.drawnAmount, 0);
  const totalUndrawn = loans.reduce((sum, loan) => sum + loan.undrawnAmount, 0);
  
  // Weighted averages
  const weightedAveragePD = totalExposure > 0 
    ? loans.reduce((sum, loan) => sum + (loan.pd * loan.originalAmount), 0) / totalExposure 
    : 0;
    
  const weightedAverageLGD = totalExposure > 0 
    ? loans.reduce((sum, loan) => sum + (loan.lgd * loan.originalAmount), 0) / totalExposure 
    : 0;
  
  const totalExpectedLoss = loans.reduce((sum, loan) => sum + calculateExpectedLoss(loan), 0);
  const totalRWA = loans.reduce((sum, loan) => sum + calculateRWA(loan, params), 0);
  
  const totalCapitalRequired = totalRWA * params.capitalRatio;
  
  // Calculate total income and costs for the portfolio
  const totalAnnualIncome = loans.reduce((sum, loan) => {
    return sum + (loan.margin + loan.referenceRate) * loan.drawnAmount +
           loan.fees.commitment * loan.undrawnAmount +
           (loan.fees.upfront + loan.fees.agency + loan.fees.other) / 
           ((loan.endDate ? new Date(loan.endDate).getTime() : 0) - 
           (loan.startDate ? new Date(loan.startDate).getTime() : 0)) * 
           (365 * 24 * 60 * 60 * 1000);
  }, 0);
  
  const totalFundingCost = loans.reduce((sum, loan) => sum + params.fundingCost * loan.drawnAmount, 0);
  const totalOperationalCost = loans.reduce((sum, loan) => sum + params.operationalCostRatio * loan.originalAmount, 0);
  
  const portfolioProfitBeforeTax = totalAnnualIncome - totalFundingCost - totalOperationalCost - totalExpectedLoss;
  const portfolioProfitAfterTax = portfolioProfitBeforeTax * (1 - params.corporateTaxRate);
  
  const portfolioROE = totalCapitalRequired > 0 ? portfolioProfitAfterTax / totalCapitalRequired : 0;
  const portfolioRAROC = totalCapitalRequired > 0 ? portfolioProfitBeforeTax / totalCapitalRequired : 0;
  
  // Calculate EVA sums
  const evaSumIntrinsic = loans.reduce((sum, loan) => sum + calculateEVAIntrinsic(loan, params), 0);
  const evaSumSale = loans.reduce((sum, loan) => sum + calculateEVASale(loan, params), 0);
  
  // Calculate diversification benefit
  // Simplified approach: assuming perfect correlation would equal sum of individual ELs
  // Any reduction is the diversification benefit
  const perfectCorrelationEL = totalExpectedLoss;
  // In reality, you would use a correlation matrix between loans
  // For now, we'll use a simple 20% reduction as a placeholder
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

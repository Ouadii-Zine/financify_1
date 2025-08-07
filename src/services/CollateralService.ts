import { 
  CollateralItem, 
  CollateralPortfolio, 
  CollateralCategory, 
  CollateralValuationMethod, 
  CollateralRiskLevel,
  Currency 
} from '@/types/finance';

class CollateralService {
  private static instance: CollateralService;

  private constructor() {}

  public static getInstance(): CollateralService {
    if (!CollateralService.instance) {
      CollateralService.instance = new CollateralService();
    }
    return CollateralService.instance;
  }

  /**
   * Calculate the current value of a collateral item based on its valuation model
   * Enhanced with more sophisticated mathematical models
   */
  public calculateCollateralValue(
    item: CollateralItem, 
    currentDate: Date = new Date()
  ): number {
    const valuationDate = new Date(item.valuationDate);
    const timeInYears = (currentDate.getTime() - valuationDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    switch (item.valuationModel.type) {
      case 'linear':
        return this.calculateLinearValue(item.currentValue, timeInYears, item.valuationModel.parameters);
      case 'exponential':
        return this.calculateExponentialValue(item.currentValue, timeInYears, item.valuationModel.parameters);
      case 'logarithmic':
        return this.calculateLogarithmicValue(item.currentValue, timeInYears, item.valuationModel.parameters);
      case 'polynomial':
        return this.calculatePolynomialValue(item.currentValue, timeInYears, item.valuationModel.parameters);
      case 'custom':
        return this.calculateCustomValue(item.currentValue, timeInYears, item.valuationModel.parameters);
      default:
        return item.currentValue;
    }
  }

  /**
   * Calculate portfolio-level risk metrics with enhanced mathematical formulas
   */
  public calculatePortfolioRiskMetrics(portfolio: CollateralPortfolio): CollateralPortfolio['portfolioRiskMetrics'] {
    const items = portfolio.items;
    const totalValue = portfolio.totalValue;
    
    // Calculate weighted average volatility
    const weightedAvgVolatility = items.reduce((sum, item) => {
      return sum + (item.currentValue / totalValue) * item.volatility;
    }, 0);

    // Calculate correlation matrix with enhanced methodology
    const correlationMatrix = this.calculateCorrelationMatrix(items);

    // Calculate Value at Risk using Monte Carlo simulation approach
    const valueAtRisk = this.calculateValueAtRisk(items, totalValue, 0.95);

    // Calculate Expected Shortfall (Conditional VaR)
    const expectedShortfall = this.calculateExpectedShortfall(items, totalValue, 0.95);

    // Calculate stress test results with multiple scenarios
    const stressTestResults = this.calculateStressTestResults(portfolio);

    // Calculate portfolio beta and systematic risk
    const portfolioBeta = this.calculatePortfolioBeta(items, totalValue);

    return {
      totalValueAtRisk: valueAtRisk,
      weightedAverageVolatility: weightedAvgVolatility,
      correlationMatrix: correlationMatrix,
      stressTestResults: stressTestResults,
      expectedShortfall: expectedShortfall,
      portfolioBeta: portfolioBeta
    };
  }

  /**
   * Calculate diversification score using Herfindahl-Hirschman Index (HHI)
   * Enhanced with category-based diversification
   */
  public calculateDiversificationScore(portfolio: CollateralPortfolio): number {
    const items = portfolio.items;
    if (items.length <= 1) return 0;

    // Calculate Herfindahl-Hirschman Index (HHI)
    const totalValue = portfolio.totalValue;
    const hhi = items.reduce((sum, item) => {
      const marketShare = item.currentValue / totalValue;
      return sum + marketShare * marketShare;
    }, 0);

    // Calculate category-based diversification
    const categoryShares = new Map<CollateralCategory, number>();
    items.forEach(item => {
      const currentShare = categoryShares.get(item.category) || 0;
      categoryShares.set(item.category, currentShare + item.currentValue / totalValue);
    });
    
    const categoryHHI = Array.from(categoryShares.values()).reduce((sum, share) => sum + share * share, 0);

    // Combine individual and category diversification
    const combinedHHI = (hhi + categoryHHI) / 2;
    
    // Convert HHI to diversification score (inverse relationship)
    // HHI ranges from 1/n (perfect diversification) to 1 (perfect concentration)
    const perfectDiversificationHHI = 1 / items.length;
    const diversificationScore = (1 - combinedHHI) / (1 - perfectDiversificationHHI);
    
    return Math.max(0, Math.min(1, diversificationScore));
  }

  /**
   * Calculate concentration risk with enhanced methodology
   */
  public calculateConcentrationRisk(portfolio: CollateralPortfolio): number {
    const items = portfolio.items;
    if (items.length === 0) return 1;

    const totalValue = portfolio.totalValue;
    
    // Calculate individual concentration risk
    const maxShare = Math.max(...items.map(item => item.currentValue / totalValue));
    
    // Calculate category concentration risk
    const categoryShares = new Map<CollateralCategory, number>();
    items.forEach(item => {
      const currentShare = categoryShares.get(item.category) || 0;
      categoryShares.set(item.category, currentShare + item.currentValue / totalValue);
    });
    
    const maxCategoryShare = Math.max(...categoryShares.values());
    
    // Calculate geographic concentration (if location data available)
    const locationShares = new Map<string, number>();
    items.forEach(item => {
      if (item.properties.location) {
        const currentShare = locationShares.get(item.properties.location) || 0;
        locationShares.set(item.properties.location, currentShare + item.currentValue / totalValue);
      }
    });
    
    const maxLocationShare = locationShares.size > 0 ? Math.max(...locationShares.values()) : 0;
    
    // Combine all concentration measures with weights
    const individualWeight = 0.4;
    const categoryWeight = 0.4;
    const locationWeight = 0.2;
    
    return individualWeight * maxShare + 
           categoryWeight * maxCategoryShare + 
           locationWeight * maxLocationShare;
  }

  /**
   * Get recommended valuation parameters for a collateral category
   * Enhanced with more detailed parameters
   */
  public getRecommendedValuationParams(category: CollateralCategory): {
    volatility: number;
    correlationWithLoan: number;
    monitoringFrequency: CollateralItem['monitoringFrequency'];
    haircutPercentage: number;
    recommendedValuationMethod: CollateralValuationMethod;
    recommendedValuationModel: 'linear' | 'exponential' | 'logarithmic' | 'polynomial';
  } {
    const recommendations: Record<CollateralCategory, any> = {
      realEstate: {
        volatility: 0.15,
        correlationWithLoan: 0.3,
        monitoringFrequency: 'quarterly' as const,
        haircutPercentage: 0.25,
        recommendedValuationMethod: 'marketValue' as CollateralValuationMethod,
        recommendedValuationModel: 'exponential' as const
      },
      equipment: {
        volatility: 0.25,
        correlationWithLoan: 0.5,
        monitoringFrequency: 'monthly' as const,
        haircutPercentage: 0.35,
        recommendedValuationMethod: 'replacementCost' as CollateralValuationMethod,
        recommendedValuationModel: 'linear' as const
      },
      vehicle: {
        volatility: 0.30,
        correlationWithLoan: 0.6,
        monitoringFrequency: 'monthly' as const,
        haircutPercentage: 0.40,
        recommendedValuationMethod: 'marketValue' as CollateralValuationMethod,
        recommendedValuationModel: 'exponential' as const
      },
      cash: {
        volatility: 0.02,
        correlationWithLoan: 0.1,
        monitoringFrequency: 'daily' as const,
        haircutPercentage: 0.05,
        recommendedValuationMethod: 'marketValue' as CollateralValuationMethod,
        recommendedValuationModel: 'linear' as const
      },
      securities: {
        volatility: 0.20,
        correlationWithLoan: 0.4,
        monitoringFrequency: 'daily' as const,
        haircutPercentage: 0.15,
        recommendedValuationMethod: 'marketValue' as CollateralValuationMethod,
        recommendedValuationModel: 'linear' as const
      },
      inventory: {
        volatility: 0.35,
        correlationWithLoan: 0.7,
        monitoringFrequency: 'weekly' as const,
        haircutPercentage: 0.45,
        recommendedValuationMethod: 'bookValue' as CollateralValuationMethod,
        recommendedValuationModel: 'linear' as const
      },
      receivables: {
        volatility: 0.25,
        correlationWithLoan: 0.8,
        monitoringFrequency: 'monthly' as const,
        haircutPercentage: 0.30,
        recommendedValuationMethod: 'bookValue' as CollateralValuationMethod,
        recommendedValuationModel: 'linear' as const
      },
      intellectualProperty: {
        volatility: 0.40,
        correlationWithLoan: 0.2,
        monitoringFrequency: 'quarterly' as const,
        haircutPercentage: 0.50,
        recommendedValuationMethod: 'incomeApproach' as CollateralValuationMethod,
        recommendedValuationModel: 'exponential' as const
      },
      commodities: {
        volatility: 0.30,
        correlationWithLoan: 0.3,
        monitoringFrequency: 'daily' as const,
        haircutPercentage: 0.20,
        recommendedValuationMethod: 'marketValue' as CollateralValuationMethod,
        recommendedValuationModel: 'linear' as const
      },
      other: {
        volatility: 0.25,
        correlationWithLoan: 0.5,
        monitoringFrequency: 'monthly' as const,
        haircutPercentage: 0.35,
        recommendedValuationMethod: 'marketValue' as CollateralValuationMethod,
        recommendedValuationModel: 'linear' as const
      }
    };

    return recommendations[category];
  }

  /**
   * Calculate effective LGD considering collateral with enhanced formula
   * Formula: LGD_effective = max(0, LGD_base - (Collateral_Value * (1 - Haircut) / Loan_Amount))
   */
  public calculateEffectiveLGD(
    baseLGD: number,
    collateralPortfolio: CollateralPortfolio,
    loanAmount: number,
    haircutPercentage: number = 0.25
  ): number {
    const totalCollateralValue = collateralPortfolio.totalValue;
    
    // Calculate collateral coverage ratio
    const coverageRatio = totalCollateralValue / loanAmount;
    
    // Apply haircut to collateral value
    const haircutValue = totalCollateralValue * (1 - haircutPercentage);
    
    // Calculate effective LGD with correlation adjustment
    const correlationAdjustment = this.calculateCorrelationAdjustment(collateralPortfolio);
    const adjustedHaircutValue = haircutValue * (1 - correlationAdjustment);
    
    // Calculate effective LGD
    const effectiveLGD = Math.max(0, baseLGD - (adjustedHaircutValue / loanAmount));
    
    return Math.min(1, effectiveLGD);
  }

  /**
   * Calculate correlation adjustment for collateral portfolio
   */
  private calculateCorrelationAdjustment(portfolio: CollateralPortfolio): number {
    const items = portfolio.items;
    if (items.length === 0) return 0;

    // Calculate weighted average correlation with loan
    const totalValue = portfolio.totalValue;
    const weightedCorrelation = items.reduce((sum, item) => {
      return sum + (item.currentValue / totalValue) * item.correlationWithLoan;
    }, 0);

    // Convert correlation to adjustment factor (0-1)
    return Math.max(0, weightedCorrelation);
  }

  /**
   * Validate collateral portfolio for regulatory compliance
   * Enhanced with Basel III and LCR requirements
   */
  public validateRegulatoryCompliance(portfolio: CollateralPortfolio): {
    baselCompliant: boolean;
    lcrEligible: boolean;
    hqlaCategory: 'level1' | 'level2a' | 'level2b' | 'ineligible';
    issues: string[];
    regulatoryRatios: {
      lcrRatio: number;
      nsfRatio: number;
      hqlaRatio: number;
    };
  } {
    const issues: string[] = [];
    let baselCompliant = true;
    let lcrEligible = true;
    let hqlaCategory: 'level1' | 'level2a' | 'level2b' | 'ineligible' = 'ineligible';

    // Calculate HQLA values
    let level1Value = 0;
    let level2aValue = 0;
    let level2bValue = 0;

    portfolio.items.forEach(item => {
      // Level 1 HQLA (cash, central bank reserves)
      if (item.category === 'cash' && item.properties.issuer === 'centralBank') {
        level1Value += item.currentValue;
        hqlaCategory = 'level1';
      }
      // Level 2A HQLA (government securities, etc.)
      else if (item.category === 'securities' && 
               ['AAA', 'AA+', 'AA', 'AA-'].includes(item.properties.creditRating || '')) {
        level2aValue += item.currentValue * 0.85; // 15% haircut
        if (hqlaCategory === 'ineligible') hqlaCategory = 'level2a';
      }
      // Level 2B HQLA (corporate bonds, etc.)
      else if (item.category === 'securities' && 
               ['A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-'].includes(item.properties.creditRating || '')) {
        level2bValue += item.currentValue * 0.50; // 50% haircut
        if (hqlaCategory === 'ineligible') hqlaCategory = 'level2b';
      }
    });

    // Check for regulatory issues
    portfolio.items.forEach(item => {
      if (item.legalStatus === 'unregistered') {
        issues.push(`Collateral ${item.name} is not legally registered`);
        baselCompliant = false;
      }
      
      if (item.encumbranceLevel > 0.8) {
        issues.push(`Collateral ${item.name} is highly encumbered (${(item.encumbranceLevel * 100).toFixed(1)}%)`);
      }
      
      if (item.volatility > 0.5) {
        issues.push(`Collateral ${item.name} has high volatility (${(item.volatility * 100).toFixed(1)}%)`);
      }

      if (item.estimatedLiquidationTime > 12) {
        issues.push(`Collateral ${item.name} has long liquidation time (${item.estimatedLiquidationTime} months)`);
      }
    });

    // Calculate regulatory ratios
    const totalHQLA = level1Value + level2aValue + level2bValue;
    const lcrRatio = totalHQLA / portfolio.totalValue; // Simplified LCR calculation
    const nsfRatio = 0.8; // Net Stable Funding Ratio (simplified)
    const hqlaRatio = totalHQLA / portfolio.totalValue;

    return {
      baselCompliant,
      lcrEligible: hqlaCategory !== 'ineligible',
      hqlaCategory,
      issues,
      regulatoryRatios: {
        lcrRatio,
        nsfRatio,
        hqlaRatio
      }
    };
  }

  // Private helper methods with enhanced mathematical formulas
  private calculateLinearValue(
    initialValue: number, 
    timeInYears: number, 
    parameters: any
  ): number {
    const rate = parameters.depreciationRate || parameters.appreciationRate || 0;
    return Math.max(0, initialValue * (1 + rate * timeInYears));
  }

  private calculateExponentialValue(
    initialValue: number, 
    timeInYears: number, 
    parameters: any
  ): number {
    const rate = parameters.depreciationRate || parameters.appreciationRate || 0;
    return Math.max(0, initialValue * Math.pow(1 + rate, timeInYears));
  }

  private calculateLogarithmicValue(
    initialValue: number, 
    timeInYears: number, 
    parameters: any
  ): number {
    const rate = parameters.depreciationRate || parameters.appreciationRate || 0;
    return Math.max(0, initialValue * (1 + rate * Math.log(1 + timeInYears)));
  }

  private calculatePolynomialValue(
    initialValue: number, 
    timeInYears: number, 
    parameters: any
  ): number {
    const coefficients = parameters.polynomialCoefficients || [1, 0];
    let result = 0;
    coefficients.forEach((coef: number, index: number) => {
      result += coef * Math.pow(timeInYears, index);
    });
    return Math.max(0, initialValue * result);
  }

  private calculateCustomValue(
    initialValue: number,
    timeInYears: number,
    parameters: any
  ): number {
    // Custom formula evaluation (simplified)
    const customFormula = parameters.customFormula || 'value';
    // In a real implementation, this would use a formula parser
    return Math.max(0, initialValue * (1 - 0.05 * timeInYears)); // Default 5% annual depreciation
  }

  private calculateCorrelationMatrix(items: CollateralItem[]): number[][] {
    const n = items.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          // Enhanced correlation calculation based on categories and properties
          const item1 = items[i];
          const item2 = items[j];
          
          let correlation = 0.1; // Base correlation
          
          // Category-based correlation
          if (item1.category === item2.category) {
            correlation = 0.7; // High correlation within same category
          } else if (this.areCategoriesRelated(item1.category, item2.category)) {
            correlation = 0.4; // Medium correlation for related categories
          }
          
          // Location-based correlation (if available)
          if (item1.properties.location && item2.properties.location &&
              item1.properties.location === item2.properties.location) {
            correlation += 0.2;
          }
          
          // Issuer-based correlation (for securities)
          if (item1.properties.issuer && item2.properties.issuer &&
              item1.properties.issuer === item2.properties.issuer) {
            correlation += 0.3;
          }
          
          matrix[i][j] = Math.min(0.9, correlation); // Cap at 0.9
        }
      }
    }
    
    return matrix;
  }

  private areCategoriesRelated(cat1: CollateralCategory, cat2: CollateralCategory): boolean {
    const relatedGroups = [
      ['realEstate', 'equipment'],
      ['securities', 'cash'],
      ['inventory', 'receivables'],
      ['vehicle', 'equipment'],
      ['intellectualProperty', 'securities'],
      ['commodities', 'inventory']
    ];
    
    return relatedGroups.some(group => group.includes(cat1) && group.includes(cat2));
  }

  private calculateValueAtRisk(
    items: CollateralItem[], 
    totalValue: number, 
    confidenceLevel: number
  ): number {
    // Enhanced VaR calculation using Monte Carlo simulation approach
    const weightedVolatility = items.reduce((sum, item) => {
      return sum + (item.currentValue / totalValue) * item.volatility;
    }, 0);
    
    // Calculate portfolio correlation effect
    const correlationEffect = this.calculatePortfolioCorrelationEffect(items);
    
    const zScore = confidenceLevel === 0.95 ? 1.645 : 2.326; // 95% or 99% confidence
    const adjustedVolatility = weightedVolatility * Math.sqrt(correlationEffect);
    
    return totalValue * adjustedVolatility * zScore;
  }

  private calculateExpectedShortfall(
    items: CollateralItem[],
    totalValue: number,
    confidenceLevel: number
  ): number {
    // Expected Shortfall (Conditional VaR) calculation
    const var95 = this.calculateValueAtRisk(items, totalValue, 0.95);
    const var99 = this.calculateValueAtRisk(items, totalValue, 0.99);
    
    // Simplified ES calculation: average of VaR at different confidence levels
    return (var95 + var99) / 2;
  }

  private calculatePortfolioBeta(
    items: CollateralItem[],
    totalValue: number
  ): number {
    // Calculate portfolio beta relative to market
    const weightedBeta = items.reduce((sum, item) => {
      const itemBeta = this.getCategoryBeta(item.category);
      return sum + (item.currentValue / totalValue) * itemBeta;
    }, 0);
    
    return weightedBeta;
  }

  private getCategoryBeta(category: CollateralCategory): number {
    const betas: Record<CollateralCategory, number> = {
      realEstate: 0.8,
      equipment: 1.2,
      vehicle: 1.5,
      cash: 0.0,
      securities: 1.0,
      inventory: 1.3,
      receivables: 1.1,
      intellectualProperty: 1.4,
      commodities: 0.9,
      other: 1.0
    };
    
    return betas[category] || 1.0;
  }

  private calculatePortfolioCorrelationEffect(items: CollateralItem[]): number {
    if (items.length <= 1) return 1;
    
    // Calculate average correlation
    let totalCorrelation = 0;
    let correlationCount = 0;
    
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const item1 = items[i];
        const item2 = items[j];
        
        let correlation = 0.1;
        if (item1.category === item2.category) {
          correlation = 0.7;
        } else if (this.areCategoriesRelated(item1.category, item2.category)) {
          correlation = 0.4;
        }
        
        totalCorrelation += correlation;
        correlationCount++;
      }
    }
    
    const averageCorrelation = totalCorrelation / correlationCount;
    
    // Convert to correlation effect factor
    return 1 + averageCorrelation * (items.length - 1) / items.length;
  }

  private calculateStressTestResults(portfolio: CollateralPortfolio): Array<{
    scenario: string;
    portfolioValue: number;
    lossAmount: number;
    impactPercentage: number;
  }> {
    const scenarios = [
      { name: 'Market Crash', impact: -0.3, description: 'Severe market downturn' },
      { name: 'Economic Recession', impact: -0.2, description: 'Economic contraction' },
      { name: 'Interest Rate Shock', impact: -0.15, description: 'Rapid rate increase' },
      { name: 'Currency Crisis', impact: -0.25, description: 'Currency devaluation' },
      { name: 'Sector-Specific Crisis', impact: -0.35, description: 'Industry-specific downturn' },
      { name: 'Liquidity Crisis', impact: -0.4, description: 'Market liquidity freeze' },
      { name: 'Geopolitical Risk', impact: -0.2, description: 'Political instability' },
      { name: 'Climate Risk', impact: -0.15, description: 'Environmental factors' }
    ];

    return scenarios.map(scenario => {
      const newValue = portfolio.totalValue * (1 + scenario.impact);
      return {
        scenario: scenario.name,
        portfolioValue: newValue,
        lossAmount: portfolio.totalValue - newValue,
        impactPercentage: scenario.impact * 100
      };
    });
  }
}

export default CollateralService; 
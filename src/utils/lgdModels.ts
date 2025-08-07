// LGD Mathematical Models for Variable Collateral Values
// This file contains mathematical functions to model how LGD changes over time
// based on collateral depreciation/appreciation patterns

export type CollateralType = 'realEstate' | 'equipment' | 'vehicle' | 'cash' | 'other';
export type LGDModel = 'linear' | 'exponential' | 'logarithmic' | 'polynomial';
export type GuaranteeType = 'government' | 'corporate' | 'personal' | 'collateral' | 'other';

export interface LGDModelParameters {
  depreciationRate?: number; // Annual depreciation rate (for equipment, vehicles)
  appreciationRate?: number; // Annual appreciation rate (for real estate)
  halfLife?: number; // Half-life for exponential decay
  polynomialCoefficients?: number[]; // For polynomial models
}

export interface LGDVariableConfig {
  type: CollateralType;
  initialValue: number;
  model: LGDModel;
  parameters: LGDModelParameters;
}

export interface LGDGuaranteedConfig {
  baseLGD: number;
  guaranteeType: GuaranteeType;
  coverage: number;
  guarantorLGD: number;
}

// Default parameters for different collateral types
export const DEFAULT_COLLATERAL_PARAMETERS: Record<CollateralType, LGDModelParameters> = {
  realEstate: {
    appreciationRate: 0.03, // 3% annual appreciation
    model: 'exponential'
  },
  equipment: {
    depreciationRate: 0.15, // 15% annual depreciation
    model: 'exponential'
  },
  vehicle: {
    depreciationRate: 0.20, // 20% annual depreciation (higher than equipment)
    model: 'exponential'
  },
  cash: {
    depreciationRate: 0.02, // 2% annual depreciation (inflation)
    model: 'linear'
  },
  other: {
    depreciationRate: 0.10, // 10% annual depreciation
    model: 'linear'
  }
};

// Default parameters for different guarantee types
export const DEFAULT_GUARANTEE_PARAMETERS: Record<GuaranteeType, { defaultCoverage: number; defaultGuarantorLGD: number }> = {
  government: {
    defaultCoverage: 0.80, // 80% coverage
    defaultGuarantorLGD: 0.00 // 0% LGD for government (risk-free)
  },
  corporate: {
    defaultCoverage: 0.60, // 60% coverage
    defaultGuarantorLGD: 0.20 // 20% LGD for corporate guarantor
  },
  personal: {
    defaultCoverage: 0.50, // 50% coverage
    defaultGuarantorLGD: 0.30 // 30% LGD for personal guarantor
  },
  collateral: {
    defaultCoverage: 0.70, // 70% coverage
    defaultGuarantorLGD: 0.10 // 10% LGD for collateral
  },
  other: {
    defaultCoverage: 0.40, // 40% coverage
    defaultGuarantorLGD: 0.25 // 25% LGD for other guarantors
  }
};

// Mathematical model functions

/**
 * Linear model: LGD = initialValue + rate * time
 * Used for: Cash, other assets with steady depreciation
 */
export const calculateLinearLGD = (
  initialValue: number,
  timeInYears: number,
  parameters: LGDModelParameters
): number => {
  const rate = parameters.depreciationRate || 0;
  return Math.max(0, Math.min(1, initialValue + rate * timeInYears));
};

/**
 * Exponential model: LGD = initialValue * (1 ± rate)^time
 * Used for: Real estate (appreciation), equipment/vehicles (depreciation)
 */
export const calculateExponentialLGD = (
  initialValue: number,
  timeInYears: number,
  parameters: LGDModelParameters
): number => {
  if (parameters.appreciationRate) {
    // Appreciation (real estate)
    return Math.max(0, Math.min(1, initialValue * Math.pow(1 + parameters.appreciationRate, timeInYears)));
  } else if (parameters.depreciationRate) {
    // Depreciation (equipment, vehicles)
    return Math.max(0, Math.min(1, initialValue * Math.pow(1 - parameters.depreciationRate, timeInYears)));
  } else if (parameters.halfLife) {
    // Exponential decay with half-life
    return Math.max(0, Math.min(1, initialValue * Math.pow(0.5, timeInYears / parameters.halfLife)));
  }
  return initialValue;
};

/**
 * Logarithmic model: LGD = initialValue + a * ln(1 + time)
 * Used for: Assets with rapid initial depreciation then stabilization
 */
export const calculateLogarithmicLGD = (
  initialValue: number,
  timeInYears: number,
  parameters: LGDModelParameters
): number => {
  const rate = parameters.depreciationRate || 0.1;
  return Math.max(0, Math.min(1, initialValue + rate * Math.log(1 + timeInYears)));
};

/**
 * Polynomial model: LGD = initialValue + Σ(coefficients[i] * time^i)
 * Used for: Complex patterns, custom curves
 */
export const calculatePolynomialLGD = (
  initialValue: number,
  timeInYears: number,
  parameters: LGDModelParameters
): number => {
  const coefficients = parameters.polynomialCoefficients || [0];
  let result = initialValue;
  
  coefficients.forEach((coef, index) => {
    result += coef * Math.pow(timeInYears, index + 1);
  });
  
  return Math.max(0, Math.min(1, result));
};

/**
 * Main function to calculate LGD at a specific time based on model type
 */
export const calculateVariableLGD = (
  config: LGDVariableConfig,
  timeInYears: number
): number => {
  switch (config.model) {
    case 'linear':
      return calculateLinearLGD(config.initialValue, timeInYears, config.parameters);
    case 'exponential':
      return calculateExponentialLGD(config.initialValue, timeInYears, config.parameters);
    case 'logarithmic':
      return calculateLogarithmicLGD(config.initialValue, timeInYears, config.parameters);
    case 'polynomial':
      return calculatePolynomialLGD(config.initialValue, timeInYears, config.parameters);
    default:
      return config.initialValue;
  }
};

/**
 * Generate LGD curve data points for visualization
 */
export const generateLGDCurveData = (
  config: LGDVariableConfig,
  startDate: Date,
  endDate: Date,
  intervalMonths: number = 1
): Array<{ date: string; lgd: number; timeInYears: number }> => {
  const data = [];
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const totalMonths = Math.ceil((endTime - startTime) / (30 * 24 * 60 * 60 * 1000));
  
  for (let month = 0; month <= totalMonths; month += intervalMonths) {
    const currentDate = new Date(startTime + month * 30 * 24 * 60 * 60 * 1000);
    const timeInYears = month / 12;
    const lgd = calculateVariableLGD(config, timeInYears);
    
    data.push({
      date: currentDate.toISOString().split('T')[0],
      lgd: lgd,
      timeInYears: timeInYears
    });
  }
  
  return data;
};

/**
 * Get recommended model and parameters for a collateral type
 */
export const getRecommendedModel = (collateralType: CollateralType): { model: LGDModel; parameters: LGDModelParameters } => {
  const defaultParams = DEFAULT_COLLATERAL_PARAMETERS[collateralType];
  
  switch (collateralType) {
    case 'realEstate':
      return {
        model: 'exponential',
        parameters: { appreciationRate: defaultParams.appreciationRate }
      };
    case 'equipment':
      return {
        model: 'exponential',
        parameters: { depreciationRate: defaultParams.depreciationRate }
      };
    case 'vehicle':
      return {
        model: 'exponential',
        parameters: { depreciationRate: defaultParams.depreciationRate }
      };
    case 'cash':
      return {
        model: 'linear',
        parameters: { depreciationRate: defaultParams.depreciationRate }
      };
    case 'other':
      return {
        model: 'linear',
        parameters: { depreciationRate: defaultParams.depreciationRate }
      };
    default:
      return {
        model: 'linear',
        parameters: { depreciationRate: 0.1 }
      };
  }
};

/**
 * Get recommended parameters for a guarantee type
 */
export const getRecommendedGuaranteeParams = (guaranteeType: GuaranteeType): { coverage: number; guarantorLGD: number } => {
  const defaultParams = DEFAULT_GUARANTEE_PARAMETERS[guaranteeType];
  
  return {
    coverage: defaultParams.defaultCoverage,
    guarantorLGD: defaultParams.defaultGuarantorLGD
  };
};

/**
 * Calculate guaranteed LGD using the formula: LGD_final = LGD_unsecured × (1 - Coverage) + LGD_guarantor × Coverage
 */
export const calculateGuaranteedLGD = (config: LGDGuaranteedConfig): number => {
  const { baseLGD, coverage, guarantorLGD } = config;
  
  // Ensure coverage is between 0 and 1
  const validCoverage = Math.max(0, Math.min(1, coverage));
  
  // Calculate final LGD using the guarantee formula
  const finalLGD = baseLGD * (1 - validCoverage) + guarantorLGD * validCoverage;
  
  // Ensure result is between 0 and 1
  return Math.max(0, Math.min(1, finalLGD));
};

/**
 * Calculate effective LGD for a loan with any LGD type
 */
export const calculateEffectiveLGD = (
  loan: any,
  currentDate: Date = new Date()
): number => {
  // Handle guaranteed LGD
  if (loan.lgdType === 'guaranteed' && loan.lgdGuaranteed) {
    return calculateGuaranteedLGD(loan.lgdGuaranteed);
  }
  
  // Handle variable LGD
  if (loan.lgdType === 'variable' && loan.lgdVariable) {
    const startDate = new Date(loan.startDate);
    const timeInYears = (currentDate.getTime() - startDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
    return calculateVariableLGD(loan.lgdVariable, Math.max(0, timeInYears));
  }
  
  // Default to constant LGD
  return loan.lgd || 0.45;
}; 
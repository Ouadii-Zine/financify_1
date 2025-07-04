// DataValidationService.ts - Data validation and integrity service
// Based on the ValidateData VBA script described in the PDF

import { Loan, Portfolio } from '../types/finance';

interface ValidationError {
  type: 'critical' | 'warning' | 'info';
  field: string;
  message: string;
  value?: any;
  suggestedValue?: any;
  loanId?: string;
  portfolioId?: string;
}

interface ValidationResult {
  isValid: boolean;
  criticalErrors: string[];
  warnings: string[];
  infoMessages: string[];
  errors: ValidationError[];
}

export class DataValidationService {
  private static instance: DataValidationService;
  private validCurrencies = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD'];
  private validSectors = [
    'Banking', 'Technology', 'Retail', 'Manufacturing', 'Energy', 
    'Healthcare', 'Real Estate', 'Telecom', 'Automotive', 'Agriculture'
  ];
  private validRatings = [
    'AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 
    'BBB+', 'BBB', 'BBB-', 'BB+', 'BB', 'BB-', 
    'B+', 'B', 'B-', 'CCC+', 'CCC', 'CCC-', 'CC', 'C', 'D'
  ];

  private constructor() {}

  static getInstance(): DataValidationService {
    if (!DataValidationService.instance) {
      DataValidationService.instance = new DataValidationService();
    }
    return DataValidationService.instance;
  }

  async validatePortfolioData(portfolios?: Portfolio[]): Promise<ValidationResult> {
    const allErrors: ValidationError[] = [];
    
    if (!portfolios || portfolios.length === 0) {
      return {
        isValid: true,
        criticalErrors: [],
        warnings: [],
        infoMessages: ['No portfolios to validate'],
        errors: []
      };
    }
    
    for (const portfolio of portfolios) {
      const portfolioErrors = await this.validatePortfolio(portfolio);
      allErrors.push(...portfolioErrors);
    }
    
    return this.processValidationResults(allErrors);
  }

  private async validatePortfolio(portfolio: Portfolio): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    if (!portfolio.id || !portfolio.name) {
      errors.push({
        type: 'critical',
        field: 'portfolio',
        message: 'Portfolio missing required fields (id, name)',
        portfolioId: portfolio.id
      });
    }
    
    if (portfolio.loans && portfolio.loans.length > 0) {
      for (const loan of portfolio.loans) {
        const loanErrors = await this.validateLoan(loan);
        errors.push(...loanErrors);
      }
    }
    
    return errors;
  }

  private async validateLoan(loan: Loan): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // Temporal consistency
    if (loan.startDate && loan.endDate) {
      const startDate = new Date(loan.startDate);
      const endDate = new Date(loan.endDate);
      
      if (startDate >= endDate) {
        errors.push({
          type: 'critical',
          field: 'dateRange',
          message: 'Facility date must be before maturity date',
          value: { startDate: loan.startDate, endDate: loan.endDate },
          loanId: loan.id
        });
      }
    }
    
    // Financial consistency
    if (loan.drawnAmount > loan.originalAmount) {
      errors.push({
        type: 'critical',
        field: 'drawnAmount',
        message: 'Drawn outstanding cannot exceed total facility amount',
        value: loan.drawnAmount,
        suggestedValue: loan.originalAmount,
        loanId: loan.id
      });
    }
    
    // Referential integrity
    if (!this.validCurrencies.includes(loan.currency)) {
      errors.push({
        type: 'critical',
        field: 'currency',
        message: `Invalid currency: ${loan.currency}`,
        value: loan.currency,
        suggestedValue: 'EUR',
        loanId: loan.id
      });
    }
    
    // Business rules
    if (loan.pd < 0 || loan.pd > 1) {
      errors.push({
        type: 'critical',
        field: 'pd',
        message: 'Probability of Default must be between 0 and 1',
        value: loan.pd,
        suggestedValue: Math.max(0, Math.min(1, loan.pd)),
        loanId: loan.id
      });
    }
    
    if (loan.lgd < 0 || loan.lgd > 1) {
      errors.push({
        type: 'critical',
        field: 'lgd',
        message: 'Loss Given Default must be between 0 and 1',
        value: loan.lgd,
        suggestedValue: Math.max(0, Math.min(1, loan.lgd)),
        loanId: loan.id
      });
    }
    
    return errors;
  }

  private processValidationResults(errors: ValidationError[]): ValidationResult {
    const criticalErrors = errors.filter(e => e.type === 'critical');
    const warnings = errors.filter(e => e.type === 'warning');
    const infoMessages = errors.filter(e => e.type === 'info');
    
    return {
      isValid: criticalErrors.length === 0,
      criticalErrors: criticalErrors.map(e => e.message),
      warnings: warnings.map(e => e.message),
      infoMessages: infoMessages.map(e => e.message),
      errors: errors
    };
  }
}

export default DataValidationService; 
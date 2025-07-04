import { Loan, CalculationParameters, Portfolio } from '../types/finance';
import { calculateLoanMetrics, calculatePortfolioMetrics } from '../utils/financialCalculations';
import { sampleLoans, defaultCalculationParameters } from '../data/sampleData';
import DynamicColumnsService from './DynamicColumnsService';
import PortfolioService from './PortfolioService';

// Keep backwards compatibility events
export const LOANS_UPDATED_EVENT = 'loans-updated';

class LoanDataService {
  private static instance: LoanDataService;
  private portfolioService: PortfolioService;
  private calculationParams: CalculationParameters = defaultCalculationParameters;

  private constructor() {
    this.portfolioService = PortfolioService.getInstance();
    this.migrateExistingData();
  }

  static getInstance(): LoanDataService {
    if (!this.instance) {
      this.instance = new LoanDataService();
    }
    return this.instance;
  }

  // Migrate existing loans to portfolio system
  private migrateExistingData(): void {
    const existingData = localStorage.getItem('financify-portfolio-loans');
    if (existingData) {
      try {
        const parsedData = JSON.parse(existingData);
        if (parsedData.loans && Array.isArray(parsedData.loans)) {
          const defaultPortfolio = this.portfolioService.getDefaultPortfolio();
          
          // Add portfolioId to existing loans and add them to default portfolio
          const migratedLoans = parsedData.loans.map((loan: any) => ({
            ...loan,
            portfolioId: defaultPortfolio.id
          }));
          
          if (migratedLoans.length > 0) {
            this.portfolioService.addLoansToPortfolio(defaultPortfolio.id, migratedLoans);
          }
        }
        
        // Remove old storage after migration
        localStorage.removeItem('financify-portfolio-loans');
      } catch (error) {
        console.error('Error migrating existing loan data:', error);
      }
    }
  }

  // Trigger loans updated event for backwards compatibility
  private dispatchLoansUpdated(): void {
    const allLoans = this.getAllLoans(false);
    const event = new CustomEvent(LOANS_UPDATED_EVENT, { detail: allLoans });
    window.dispatchEvent(event);
  }

  // Add loan to specific portfolio
  addLoan(loan: Loan, portfolioId?: string, params: CalculationParameters = this.calculationParams): void {
    const targetPortfolioId = portfolioId || this.portfolioService.getDefaultPortfolio().id;
    
    console.log('LoanDataService: Adding new loan to portfolio:', targetPortfolioId, loan);
    
    const metrics = calculateLoanMetrics(loan, params);
    const newLoan = { ...loan, metrics, portfolioId: targetPortfolioId };
    
    this.portfolioService.addLoanToPortfolio(targetPortfolioId, newLoan);
    this.dispatchLoansUpdated();
  }

  // Add multiple loans to specific portfolio
  addLoans(loans: Loan[], portfolioId?: string, params: CalculationParameters = this.calculationParams): void {
    const targetPortfolioId = portfolioId || this.portfolioService.getDefaultPortfolio().id;
    
    const loansWithMetrics = loans.map(loan => ({
      ...loan,
      metrics: calculateLoanMetrics(loan, params),
      portfolioId: targetPortfolioId
    }));
    
    this.portfolioService.addLoansToPortfolio(targetPortfolioId, loansWithMetrics);
    this.dispatchLoansUpdated();
  }

  // Get all loans across all portfolios (with optional samples)
  getAllLoans(includeSamples: boolean = true): Loan[] {
    const portfolios = this.portfolioService.getPortfolios();
    let allLoans: Loan[] = [];
    
    portfolios.forEach(portfolio => {
      allLoans = allLoans.concat(portfolio.loans);
    });
    
    if (includeSamples) {
      // Add sample loans with metrics
      const samplesWithMetrics = sampleLoans.map(loan => ({
        ...loan,
        portfolioId: 'samples',
        metrics: calculateLoanMetrics(loan, this.calculationParams)
      }));
      allLoans = allLoans.concat(samplesWithMetrics);
    }
    
    return allLoans;
  }
  
  // Get loans from specific portfolio
  getLoans(portfolioId?: string): Loan[] {
    if (portfolioId) {
      return this.portfolioService.getLoansByPortfolio(portfolioId).map(loan => this.ensureDynamicColumns(loan));
    }
    
    // Default behavior: get all user loans
    const portfolios = this.portfolioService.getPortfolios();
    let allLoans: Loan[] = [];
    
    portfolios.forEach(portfolio => {
      allLoans = allLoans.concat(portfolio.loans);
    });
    
    return allLoans.map(loan => this.ensureDynamicColumns(loan));
  }
  
  // Get specific loan by ID
  getLoanById(id: string, includeSamples: boolean = true): Loan | undefined {
    // Search in portfolios first
    const result = this.portfolioService.findLoanById(id);
    if (result) {
      return this.ensureDynamicColumns(result.loan);
    }
    
    // Search in sample loans if requested
    if (includeSamples) {
      const sampleLoan = sampleLoans.find(loan => loan.id === id);
      if (sampleLoan) {
        const loanWithMetrics = {
          ...sampleLoan,
          portfolioId: 'samples',
          metrics: calculateLoanMetrics(sampleLoan, this.calculationParams)
        };
        return this.ensureDynamicColumns(loanWithMetrics);
      }
    }
    
    return undefined;
  }
  
  // Update a loan
  updateLoan(id: string, updatedLoan: Loan, params: CalculationParameters = this.calculationParams): boolean {
    const result = this.portfolioService.findLoanById(id);
    if (!result) return false;
    
    const metrics = calculateLoanMetrics(updatedLoan, params);
    const loanWithMetrics = { ...updatedLoan, metrics };
    
    const success = this.portfolioService.updateLoanInPortfolio(result.portfolioId, id, loanWithMetrics);
    if (success) {
      this.dispatchLoansUpdated();
    }
    return success;
  }
  
  // Delete a loan
  deleteLoan(id: string): boolean {
    const result = this.portfolioService.findLoanById(id);
    if (!result) return false;
    
    const success = this.portfolioService.removeLoanFromPortfolio(result.portfolioId, id);
    if (success) {
      this.dispatchLoansUpdated();
    }
    return success;
  }
  
  // Get portfolio with all loans (backwards compatibility)
  getPortfolio(includeSamples: boolean = true): Portfolio {
    const defaultPortfolio = this.portfolioService.getDefaultPortfolio();
    
    if (includeSamples) {
      const allLoans = this.getAllLoans(true);
      const metrics = calculatePortfolioMetrics(allLoans, this.calculationParams);
      
      return {
        id: 'complete-portfolio',
        name: 'Complete Portfolio',
        description: 'All portfolios combined including samples',
        createdDate: defaultPortfolio.createdDate,
        lastModified: new Date().toISOString(),
        loans: allLoans,
        metrics
      };
    }
    
    return defaultPortfolio;
  }
  
  // Get calculation parameters
  getCalculationParams(): CalculationParameters {
    return this.calculationParams;
  }
  
  // Update calculation parameters
  updateCalculationParams(params: Partial<CalculationParameters>): void {
    this.calculationParams = { ...this.calculationParams, ...params };
    
    // Recalculate metrics for all loans in all portfolios
    const portfolios = this.portfolioService.getPortfolios();
    portfolios.forEach(portfolio => {
      const updatedLoans = portfolio.loans.map(loan => ({
        ...loan,
        metrics: calculateLoanMetrics(loan, this.calculationParams)
      }));
      
      if (updatedLoans.length > 0) {
        this.portfolioService.updatePortfolio(portfolio.id, { loans: updatedLoans });
      }
    });
    
    this.dispatchLoansUpdated();
  }

  // Load from localStorage (for backwards compatibility)
  loadFromLocalStorage(): void {
    // This is now handled by PortfolioService
    // Just trigger the migration if needed
    this.migrateExistingData();
  }

  // Ensure dynamic columns are present
  private ensureDynamicColumns(loan: Loan): Loan {
    const dynamicColumnsService = DynamicColumnsService.getInstance();
    const dynamicColumns = dynamicColumnsService.getDynamicColumns();
    
    if (dynamicColumns.length === 0) {
      return loan;
    }
    
    const additionalDetails = loan.additionalDetails || {};
    const defaultValues = dynamicColumnsService.getDefaultValues();
    
    // Add missing dynamic columns with default values
    dynamicColumns.forEach(column => {
      if (!(column.key in additionalDetails)) {
        additionalDetails[column.key] = defaultValues[column.key];
      }
    });
    
    return {
      ...loan,
      additionalDetails: Object.keys(additionalDetails).length > 0 ? additionalDetails : undefined
    };
  }

  // Clear all loans (for testing)
  clearLoans(): void {
    this.portfolioService.clearAllPortfolios();
    this.dispatchLoansUpdated();
  }

  // Portfolio-specific methods (delegate to PortfolioService)
  getPortfolioService(): PortfolioService {
    return this.portfolioService;
  }
}

export default LoanDataService;

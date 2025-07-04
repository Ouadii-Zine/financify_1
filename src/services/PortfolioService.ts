import { Portfolio, PortfolioSummary, Loan, ClientType, CalculationParameters } from '../types/finance';
import { calculatePortfolioMetrics } from '../utils/financialCalculations';
import { defaultCalculationParameters } from '../data/sampleData';

const PORTFOLIOS_STORAGE_KEY = 'financify-portfolios';
export const PORTFOLIOS_UPDATED_EVENT = 'portfolios-updated';

export class PortfolioService {
  private static instance: PortfolioService;
  private portfolios: Portfolio[] = [];
  private calculationParams: CalculationParameters = defaultCalculationParameters;

  private constructor() {
    this.loadFromLocalStorage();
    this.ensureDefaultPortfolio();
  }

  static getInstance(): PortfolioService {
    if (!this.instance) {
      this.instance = new PortfolioService();
    }
    return this.instance;
  }

  private dispatchPortfoliosUpdated(): void {
    const event = new CustomEvent(PORTFOLIOS_UPDATED_EVENT, { 
      detail: { portfolios: this.portfolios } 
    });
    window.dispatchEvent(event);
  }

  private ensureDefaultPortfolio(): void {
    if (this.portfolios.length === 0) {
      const defaultPortfolio: Portfolio = {
        id: 'default-portfolio',
        name: 'Main Portfolio',
        description: 'Default portfolio for all loans',
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isDefault: true,
        loans: [],
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
      this.portfolios.push(defaultPortfolio);
      this.saveToLocalStorage();
    }
  }

  // Portfolio CRUD operations
  createPortfolio(name: string, description?: string, clientType?: ClientType): Portfolio {
    const portfolio: Portfolio = {
      id: `portfolio-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name,
      description,
      clientType,
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      loans: [],
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

    this.portfolios.push(portfolio);
    this.saveToLocalStorage();
    this.dispatchPortfoliosUpdated();
    return portfolio;
  }

  getPortfolios(): Portfolio[] {
    return this.portfolios.map(portfolio => ({
      ...portfolio,
      metrics: calculatePortfolioMetrics(portfolio.loans, this.calculationParams)
    }));
  }

  getPortfolioSummaries(): PortfolioSummary[] {
    return this.portfolios.map(portfolio => {
      const metrics = calculatePortfolioMetrics(portfolio.loans, this.calculationParams);
      return {
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description,
        clientType: portfolio.clientType,
        createdDate: portfolio.createdDate,
        lastModified: portfolio.lastModified,
        isDefault: portfolio.isDefault,
        loanCount: portfolio.loans.length,
        totalExposure: metrics.totalExposure,
        metrics
      };
    });
  }

  getPortfolioById(id: string): Portfolio | undefined {
    const portfolio = this.portfolios.find(p => p.id === id);
    if (portfolio) {
      return {
        ...portfolio,
        metrics: calculatePortfolioMetrics(portfolio.loans, this.calculationParams)
      };
    }
    return undefined;
  }

  getDefaultPortfolio(): Portfolio {
    let defaultPortfolio = this.portfolios.find(p => p.isDefault);
    if (!defaultPortfolio) {
      this.ensureDefaultPortfolio();
      defaultPortfolio = this.portfolios.find(p => p.isDefault)!;
    }
    return {
      ...defaultPortfolio,
      metrics: calculatePortfolioMetrics(defaultPortfolio.loans, this.calculationParams)
    };
  }

  updatePortfolio(id: string, updates: Partial<Portfolio>): boolean {
    const index = this.portfolios.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.portfolios[index] = {
      ...this.portfolios[index],
      ...updates,
      lastModified: new Date().toISOString()
    };

    this.saveToLocalStorage();
    this.dispatchPortfoliosUpdated();
    return true;
  }

  deletePortfolio(id: string): boolean {
    const portfolio = this.portfolios.find(p => p.id === id);
    if (!portfolio || portfolio.isDefault) return false; // Cannot delete default portfolio

    this.portfolios = this.portfolios.filter(p => p.id !== id);
    this.saveToLocalStorage();
    this.dispatchPortfoliosUpdated();
    return true;
  }

  // Loan operations within portfolios
  addLoanToPortfolio(portfolioId: string, loan: Loan): boolean {
    const portfolioIndex = this.portfolios.findIndex(p => p.id === portfolioId);
    if (portfolioIndex === -1) return false;

    // Ensure loan has the correct portfolio ID
    loan.portfolioId = portfolioId;
    
    // Check if loan already exists
    if (this.portfolios[portfolioIndex].loans.some(l => l.id === loan.id)) {
      throw new Error(`A loan with ID ${loan.id} already exists in this portfolio`);
    }

    this.portfolios[portfolioIndex].loans.push(loan);
    this.portfolios[portfolioIndex].lastModified = new Date().toISOString();
    
    this.saveToLocalStorage();
    this.dispatchPortfoliosUpdated();
    return true;
  }

  addLoansToPortfolio(portfolioId: string, loans: Loan[]): boolean {
    const portfolioIndex = this.portfolios.findIndex(p => p.id === portfolioId);
    if (portfolioIndex === -1) return false;

    const existingLoanIds = this.portfolios[portfolioIndex].loans.map(l => l.id);
    const newLoans = loans.filter(loan => !existingLoanIds.includes(loan.id));
    
    // Ensure all loans have the correct portfolio ID
    newLoans.forEach(loan => loan.portfolioId = portfolioId);

    this.portfolios[portfolioIndex].loans.push(...newLoans);
    this.portfolios[portfolioIndex].lastModified = new Date().toISOString();
    
    this.saveToLocalStorage();
    this.dispatchPortfoliosUpdated();
    return true;
  }

  removeLoanFromPortfolio(portfolioId: string, loanId: string): boolean {
    const portfolioIndex = this.portfolios.findIndex(p => p.id === portfolioId);
    if (portfolioIndex === -1) return false;

    const initialLength = this.portfolios[portfolioIndex].loans.length;
    this.portfolios[portfolioIndex].loans = this.portfolios[portfolioIndex].loans.filter(l => l.id !== loanId);
    
    if (this.portfolios[portfolioIndex].loans.length !== initialLength) {
      this.portfolios[portfolioIndex].lastModified = new Date().toISOString();
      this.saveToLocalStorage();
      this.dispatchPortfoliosUpdated();
      return true;
    }
    return false;
  }

  updateLoanInPortfolio(portfolioId: string, loanId: string, updatedLoan: Loan): boolean {
    const portfolioIndex = this.portfolios.findIndex(p => p.id === portfolioId);
    if (portfolioIndex === -1) return false;

    const loanIndex = this.portfolios[portfolioIndex].loans.findIndex(l => l.id === loanId);
    if (loanIndex === -1) return false;

    // Ensure loan has the correct portfolio ID
    updatedLoan.portfolioId = portfolioId;
    
    this.portfolios[portfolioIndex].loans[loanIndex] = updatedLoan;
    this.portfolios[portfolioIndex].lastModified = new Date().toISOString();
    
    this.saveToLocalStorage();
    this.dispatchPortfoliosUpdated();
    return true;
  }

  getLoansByPortfolio(portfolioId: string): Loan[] {
    const portfolio = this.portfolios.find(p => p.id === portfolioId);
    return portfolio ? portfolio.loans : [];
  }

  findLoanById(loanId: string): { loan: Loan; portfolioId: string } | undefined {
    for (const portfolio of this.portfolios) {
      const loan = portfolio.loans.find(l => l.id === loanId);
      if (loan) {
        return { loan, portfolioId: portfolio.id };
      }
    }
    return undefined;
  }

  // Utility methods
  getClientTypes(): ClientType[] {
    return ['banqueCommerciale', 'banqueInvestissement', 'assurance', 'fonds', 'entreprise'];
  }

  getPortfoliosByClientType(clientType: ClientType): Portfolio[] {
    return this.portfolios.filter(p => p.clientType === clientType);
  }

  // Storage methods
  private saveToLocalStorage(): void {
    const dataToSave = JSON.stringify({
      portfolios: this.portfolios,
      calculationParams: this.calculationParams
    });
    localStorage.setItem(PORTFOLIOS_STORAGE_KEY, dataToSave);
  }

  private loadFromLocalStorage(): void {
    const storedData = localStorage.getItem(PORTFOLIOS_STORAGE_KEY);
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        this.portfolios = parsedData.portfolios || [];
        if (parsedData.calculationParams) {
          this.calculationParams = parsedData.calculationParams;
        }
      } catch (error) {
        console.error('Error loading portfolios from localStorage:', error);
        localStorage.removeItem(PORTFOLIOS_STORAGE_KEY);
        this.portfolios = [];
      }
    }
  }

  // Clear all data (for testing/reset purposes)
  clearAllPortfolios(): void {
    this.portfolios = [];
    localStorage.removeItem(PORTFOLIOS_STORAGE_KEY);
    this.ensureDefaultPortfolio();
    this.dispatchPortfoliosUpdated();
  }
}

export default PortfolioService; 
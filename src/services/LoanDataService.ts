
import { Loan, CalculationParameters } from '../types/finance';
import { calculateLoanMetrics } from '../utils/financialCalculations';

class LoanDataService {
  private static instance: LoanDataService;
  private loans: Loan[] = [];

  private constructor() {}

  static getInstance(): LoanDataService {
    if (!this.instance) {
      this.instance = new LoanDataService();
    }
    return this.instance;
  }

  addLoan(loan: Loan, params: CalculationParameters): void {
    const metrics = calculateLoanMetrics(loan, params);
    const newLoan = { ...loan, metrics };
    this.loans.push(newLoan);
    this.saveToLocalStorage();
  }

  addLoans(loans: Loan[], params: CalculationParameters): void {
    const newLoans = loans.map(loan => ({
      ...loan,
      metrics: calculateLoanMetrics(loan, params)
    }));
    this.loans = [...this.loans, ...newLoans];
    this.saveToLocalStorage();
  }

  getLoans(): Loan[] {
    return this.loans;
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('userLoans', JSON.stringify(this.loans));
  }

  loadFromLocalStorage(): void {
    const storedLoans = localStorage.getItem('userLoans');
    if (storedLoans) {
      this.loans = JSON.parse(storedLoans);
    }
  }

  clearLoans(): void {
    this.loans = [];
    localStorage.removeItem('userLoans');
  }
}

export default LoanDataService;

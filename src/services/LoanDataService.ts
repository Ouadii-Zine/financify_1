import { Loan, CalculationParameters, Portfolio } from '../types/finance';
import { calculateLoanMetrics, calculatePortfolioMetrics } from '../utils/financialCalculations';
import { sampleLoans, defaultCalculationParameters } from '../data/sampleData';
import DynamicColumnsService from './DynamicColumnsService';

const LOCAL_STORAGE_KEY = 'financify-portfolio-loans';
// Définir un événement personnalisé pour les mises à jour de prêts
export const LOANS_UPDATED_EVENT = 'loans-updated';

class LoanDataService {
  private static instance: LoanDataService;
  private loans: Loan[] = [];
  private calculationParams: CalculationParameters = defaultCalculationParameters;

  private constructor() {
    this.loadFromLocalStorage();
  }

  static getInstance(): LoanDataService {
    if (!this.instance) {
      this.instance = new LoanDataService();
    }
    return this.instance;
  }

  // Déclencher un événement pour informer que les prêts ont été mis à jour
  private dispatchLoansUpdated(): void {
    const event = new CustomEvent(LOANS_UPDATED_EVENT, { detail: this.loans });
    window.dispatchEvent(event);
  }

  // Ajouter un prêt
  addLoan(loan: Loan, params: CalculationParameters = this.calculationParams): void {
    // Vérifier si l'ID existe déjà
    if (this.loans.some(l => l.id === loan.id)) {
      throw new Error(`Un prêt avec l'ID ${loan.id} existe déjà`);
    }
    
    console.log('LoanDataService: Ajout d\'un nouveau prêt:', loan);
    
    const metrics = calculateLoanMetrics(loan, params);
    const newLoan = { ...loan, metrics };
    this.loans.push(newLoan);
    
    console.log('LoanDataService: Prêts après ajout:', this.loans);
    
    this.saveToLocalStorage();
    this.dispatchLoansUpdated();
  }

  // Ajouter plusieurs prêts
  addLoans(loans: Loan[], params: CalculationParameters = this.calculationParams): void {
    // Filtrer les prêts avec des IDs existants
    const newLoans = loans.filter(loan => !this.loans.some(l => l.id === loan.id));
    
    const loansWithMetrics = newLoans.map(loan => ({
      ...loan,
      metrics: calculateLoanMetrics(loan, params)
    }));
    
    this.loans = [...this.loans, ...loansWithMetrics];
    this.saveToLocalStorage();
    this.dispatchLoansUpdated();
  }

  // Obtenir tous les prêts (utilisateur + échantillons)
  getAllLoans(includeSamples: boolean = true): Loan[] {
    if (includeSamples) {
      // Recalculer les métriques pour les prêts d'échantillon
      const samplesWithMetrics = sampleLoans.map(loan => ({
        ...loan, 
        metrics: calculateLoanMetrics(loan, this.calculationParams)
      }));
      
      return [...samplesWithMetrics, ...this.loans];
    }
    return this.loans;
  }
  
  // Obtenir uniquement les prêts ajoutés par l'utilisateur
  getLoans(): Loan[] {
    console.log('LoanDataService: Récupération des prêts utilisateur:', this.loans);
    // Ensure all loans have default values for dynamic columns
    return this.loans.map(loan => this.ensureDynamicColumns(loan));
  }
  
  // Obtenir un prêt spécifique par ID
  getLoanById(id: string, includeSamples: boolean = true): Loan | undefined {
    // Chercher d'abord dans les prêts utilisateur
    const userLoan = this.loans.find(loan => loan.id === id);
    if (userLoan) return this.ensureDynamicColumns(userLoan);
    
    // Si pas trouvé et includeSamples est true, chercher dans les échantillons
    if (includeSamples) {
      const sampleLoan = sampleLoans.find(loan => loan.id === id);
      if (sampleLoan) {
        // Recalculer les métriques pour le prêt d'échantillon
        const loanWithMetrics = {
          ...sampleLoan,
          metrics: calculateLoanMetrics(sampleLoan, this.calculationParams)
        };
        return this.ensureDynamicColumns(loanWithMetrics);
      }
    }
    
    return undefined;
  }
  
  // Mettre à jour un prêt
  updateLoan(id: string, updatedLoan: Loan, params: CalculationParameters = this.calculationParams): boolean {
    const index = this.loans.findIndex(loan => loan.id === id);
    
    if (index === -1) {
      return false; // Prêt non trouvé
    }
    
    const metrics = calculateLoanMetrics(updatedLoan, params);
    this.loans[index] = { ...updatedLoan, metrics };
    this.saveToLocalStorage();
    this.dispatchLoansUpdated();
    return true;
  }
  
  // Supprimer un prêt
  deleteLoan(id: string): boolean {
    const initialLength = this.loans.length;
    this.loans = this.loans.filter(loan => loan.id !== id);
    
    if (this.loans.length !== initialLength) {
      this.saveToLocalStorage();
      this.dispatchLoansUpdated();
      return true;
    }
    return false;
  }
  
  // Obtenir un portfolio complet avec métriques calculées
  getPortfolio(includeSamples: boolean = true): Portfolio {
    const allLoans = this.getAllLoans(includeSamples);
    const metrics = calculatePortfolioMetrics(allLoans, this.calculationParams);
    
    return {
      id: 'financify-portfolio',
      name: 'Portfolio Financify',
      description: 'Portfolio complet comprenant tous les prêts',
      loans: allLoans,
      metrics
    };
  }
  
  // Obtenir les paramètres de calcul actuels
  getCalculationParams(): CalculationParameters {
    return this.calculationParams;
  }
  
  // Mettre à jour les paramètres de calcul
  updateCalculationParams(params: Partial<CalculationParameters>): void {
    this.calculationParams = { ...this.calculationParams, ...params };
    
    // Recalculer les métriques de tous les prêts avec les nouveaux paramètres
    this.loans = this.loans.map(loan => ({
      ...loan,
      metrics: calculateLoanMetrics(loan, this.calculationParams)
    }));
    
    this.saveToLocalStorage();
    this.dispatchLoansUpdated();
  }

  // Sauvegarder les données dans le localStorage
  private saveToLocalStorage(): void {
    const dataToSave = JSON.stringify({
      loans: this.loans,
      calculationParams: this.calculationParams
    });
    
    console.log('LoanDataService: Sauvegarde dans localStorage:', dataToSave.slice(0, 200) + '...');
    
    localStorage.setItem(LOCAL_STORAGE_KEY, dataToSave);
  }

  // Charger les données depuis le localStorage
  loadFromLocalStorage(): void {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    console.log('LoanDataService: Données du localStorage récupérées:', storedData ? storedData.slice(0, 200) + '...' : 'null');
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        this.loans = parsedData.loans || [];
        if (parsedData.calculationParams) {
          this.calculationParams = parsedData.calculationParams;
        }
        console.log('LoanDataService: Prêts chargés depuis localStorage:', this.loans);
      } catch (error) {
        console.error('Erreur lors du chargement des données du localStorage:', error);
        // En cas d'erreur, réinitialiser le localStorage
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }

  // Ensure loan has default values for all dynamic columns
  private ensureDynamicColumns(loan: Loan): Loan {
    const dynamicColumnsService = DynamicColumnsService.getInstance();
    const dynamicColumns = dynamicColumnsService.getDynamicColumns();
    
    if (dynamicColumns.length === 0) {
      return loan; // No dynamic columns defined yet
    }
    
    const defaultValues = dynamicColumnsService.getDefaultValues();
    const existingDetails = loan.additionalDetails || {};
    
    // Merge existing details with default values for missing columns
    const mergedDetails: Record<string, any> = { ...defaultValues };
    Object.keys(existingDetails).forEach(key => {
      mergedDetails[key] = existingDetails[key];
    });
    
    return {
      ...loan,
      additionalDetails: mergedDetails
    };
  }

  // Effacer toutes les données utilisateur
  clearLoans(): void {
    this.loans = [];
    this.calculationParams = defaultCalculationParameters;
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}

export default LoanDataService;

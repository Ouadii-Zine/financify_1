import { Portfolio, Loan, CalculationParameters } from '@/types/finance';
import { calculatePortfolioMetrics, calculateLoanMetrics } from '@/utils/financialCalculations';
import DataValidationService from './DataValidationService';
import PerformanceTimerService from './PerformanceTimerService';
import CacheManagerService from './CacheManagerService';
import AuditTrailService from './AuditTrailService';

// Refresh options interface
interface RefreshOptions {
  importFacilities?: boolean;
  refreshMarketData?: boolean;
  syncDrawings?: boolean;
  generateDashboard?: boolean;
  updateReports?: boolean;
  validateData?: boolean;
  backupData?: boolean;
}

// Refresh result interface
interface RefreshResult {
  success: boolean;
  message: string;
  portfolios: Portfolio[];
  performance?: {
    totalTime: number;
    bottlenecks: string[];
    memoryUsage: number;
  };
}

/**
 * MasterRefreshService - Core orchestration service
 * Implements the VBA MasterRefresh script equivalent
 * This is the main "Click on Run First" functionality
 */
class MasterRefreshService {
  private static instance: MasterRefreshService;
  private validationService: DataValidationService;
  private performanceService: PerformanceTimerService;
  private cacheService: CacheManagerService;
  private auditService: AuditTrailService;
  private isRefreshing: boolean = false;

  private constructor() {
    this.validationService = DataValidationService.getInstance();
    this.performanceService = PerformanceTimerService.getInstance();
    this.cacheService = CacheManagerService.getInstance();
    this.auditService = AuditTrailService.getInstance();
  }

  static getInstance(): MasterRefreshService {
    if (!MasterRefreshService.instance) {
      MasterRefreshService.instance = new MasterRefreshService();
    }
    return MasterRefreshService.instance;
  }

  /**
   * Main refresh method - equivalent to VBA MasterRefresh
   * Executes the complete calculation sequence as defined in the PDF
   */
  async refreshPortfolio(
    portfolios: Portfolio[],
    calculationParameters: CalculationParameters,
    options: RefreshOptions = {}
  ): Promise<RefreshResult> {
    
    if (this.isRefreshing) {
      return {
        success: false,
        message: 'Refresh already in progress',
        portfolios
      };
    }

    this.isRefreshing = true;
    const refreshId = `refresh_${Date.now()}`;
    
    try {
      // Start performance monitoring
      this.performanceService.startTimer('MasterRefresh');
      
      // Log audit trail
      this.auditService.logEvent('MasterRefresh', 'Started', {
        portfolioCount: portfolios.length,
        options
      });

      // Phase 1: Preparation (equivalent to VBA initialization)
      await this.preparationPhase(refreshId, options);

      // Phase 2: Data Import (ImportFacilities, RefreshMarketData, SyncDrawings)
      await this.dataImportPhase(portfolios, options);

      // Phase 3: Validation (ValidateData)
      if (options.validateData !== false) {
        await this.validationPhase(portfolios);
      }

      // Phase 4: Core Calculations (Main VBA calculation sequence)
      const updatedPortfolios = await this.calculationPhase(portfolios, calculationParameters);

      // Phase 5: Output Generation (GenerateDashboard, UpdateReports)
      await this.outputGenerationPhase(updatedPortfolios, options);

      // Phase 6: Finalization (BackupData, cleanup)
      await this.finalizationPhase(updatedPortfolios, options);

      // Complete performance monitoring
      const totalTime = this.performanceService.endTimer('MasterRefresh');
      const report = this.performanceService.generateReport();
      const bottlenecks = report.bottlenecks;
      const memoryUsage = report.memoryPeak;

      // Log completion
      this.auditService.logEvent('MasterRefresh', 'Completed', {
        totalTime,
        bottlenecks: bottlenecks.length,
        memoryUsage
      });

      return {
        success: true,
        message: 'Portfolio refresh completed successfully',
        portfolios: updatedPortfolios,
        performance: {
          totalTime,
          bottlenecks,
          memoryUsage
        }
      };

    } catch (error) {
      // Log error
      this.auditService.logEvent('MasterRefresh', 'Error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: `Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        portfolios
      };
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Phase 1: Preparation - Initialize refresh process
   */
  private async preparationPhase(refreshId: string, options: RefreshOptions): Promise<void> {
    this.performanceService.startTimer('PreparationPhase');
    
    // Clear cache if needed
    this.cacheService.clear();
    
    // Set permissions (simulated - in VBA this would be actual Excel permissions)
    console.log('Setting calculation permissions...');
    
    // Initialize backup if requested
    if (options.backupData) {
      console.log('Preparing data backup...');
    }
    
    this.performanceService.endTimer('PreparationPhase');
  }

  /**
   * Phase 2: Data Import - Import facilities, refresh market data, sync drawings
   */
  private async dataImportPhase(portfolios: Portfolio[], options: RefreshOptions): Promise<void> {
    this.performanceService.startTimer('DataImportPhase');
    
    if (options.importFacilities) {
      console.log('Importing facilities...');
      // Simulate facility import
      await this.simulateAsyncOperation(500);
    }
    
    if (options.refreshMarketData) {
      console.log('Refreshing market data...');
      // Simulate market data refresh
      await this.simulateAsyncOperation(1000);
    }
    
    if (options.syncDrawings) {
      console.log('Synchronizing drawings...');
      // Simulate drawings synchronization
      await this.simulateAsyncOperation(300);
    }
    
    this.performanceService.endTimer('DataImportPhase');
  }

  /**
   * Phase 3: Validation - Validate data integrity
   */
  private async validationPhase(portfolios: Portfolio[]): Promise<void> {
    this.performanceService.startTimer('ValidationPhase');
    
    const validationResult = await this.validationService.validatePortfolioData(portfolios);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed: ${validationResult.criticalErrors.join(', ')}`);
    }
    
    this.performanceService.endTimer('ValidationPhase');
  }

  /**
   * Phase 4: Core Calculations - Main VBA calculation sequence
   * Exact order from PDF: UpdateOutstanding -> CalculateRWA -> UpdatePD -> CalculateLGD -> ComputeWAL -> CalculateEVA -> CalculatePortfolio
   */
  private async calculationPhase(
    portfolios: Portfolio[],
    calculationParameters: CalculationParameters
  ): Promise<Portfolio[]> {
    this.performanceService.startTimer('CalculationPhase');
    
    const updatedPortfolios = [...portfolios];
    
    for (const portfolio of updatedPortfolios) {
      // Step 1: UpdateOutstanding
      console.log('Updating outstanding amounts...');
      await this.updateOutstanding(portfolio);
      
      // Step 2: CalculateRWA
      console.log('Calculating RWA...');
      await this.calculateRWA(portfolio, calculationParameters);
      
      // Step 3: UpdatePD
      console.log('Updating PD...');
      await this.updatePD(portfolio);
      
      // Step 4: CalculateLGD
      console.log('Calculating LGD...');
      await this.calculateLGD(portfolio);
      
      // Step 5: ComputeWAL
      console.log('Computing WAL...');
      await this.computeWAL(portfolio);
      
      // Step 6: CalculateEVA
      console.log('Calculating EVA...');
      await this.calculateEVA(portfolio, calculationParameters);
      
      // Step 7: CalculatePortfolio (final portfolio metrics)
      console.log('Calculating portfolio metrics...');
      portfolio.metrics = calculatePortfolioMetrics(portfolio.loans, calculationParameters);
      
      // Update last modified
      portfolio.lastModified = new Date().toISOString();
    }
    
    this.performanceService.endTimer('CalculationPhase');
    return updatedPortfolios;
  }

  /**
   * Phase 5: Output Generation - Generate dashboard and reports
   */
  private async outputGenerationPhase(portfolios: Portfolio[], options: RefreshOptions): Promise<void> {
    this.performanceService.startTimer('OutputGenerationPhase');
    
    if (options.generateDashboard) {
      console.log('Generating dashboard...');
      await this.simulateAsyncOperation(800);
    }
    
    if (options.updateReports) {
      console.log('Updating reports...');
      await this.simulateAsyncOperation(1200);
    }
    
    this.performanceService.endTimer('OutputGenerationPhase');
  }

  /**
   * Phase 6: Finalization - Backup data and cleanup
   */
  private async finalizationPhase(portfolios: Portfolio[], options: RefreshOptions): Promise<void> {
    this.performanceService.startTimer('FinalizationPhase');
    
    if (options.backupData) {
      console.log('Backing up data...');
      await this.simulateAsyncOperation(600);
    }
    
    // Clear temporary calculations
    console.log('Cleaning up temporary data...');
    
    this.performanceService.endTimer('FinalizationPhase');
  }

  /**
   * UpdateOutstanding - Update outstanding amounts for all loans
   */
  private async updateOutstanding(portfolio: Portfolio): Promise<void> {
    this.performanceService.startTimer('UpdateOutstanding');
    
    for (const loan of portfolio.loans) {
      // Simulate outstanding amount calculation
      // In real implementation, this would update based on drawings and repayments
      loan.outstandingAmount = loan.outstandingAmount || loan.originalAmount * 0.8;
    }
    
    this.performanceService.endTimer('UpdateOutstanding');
  }

  /**
   * CalculateRWA - Calculate Risk Weighted Assets
   */
  private async calculateRWA(portfolio: Portfolio, params: CalculationParameters): Promise<void> {
    this.performanceService.startTimer('CalculateRWA');
    
    for (const loan of portfolio.loans) {
      // Recalculate loan metrics to ensure RWA is up to date
      loan.metrics = calculateLoanMetrics(loan, params);
    }
    
    this.performanceService.endTimer('CalculateRWA');
  }

  /**
   * UpdatePD - Update Probability of Default
   */
  private async updatePD(portfolio: Portfolio): Promise<void> {
    this.performanceService.startTimer('UpdatePD');
    
    for (const loan of portfolio.loans) {
      // Simulate PD update based on latest market conditions
      // In real implementation, this would use rating migration matrices
      loan.pd = Math.min(loan.pd * 1.05, 1.0); // Slight increase, capped at 100%
    }
    
    this.performanceService.endTimer('UpdatePD');
  }

  /**
   * CalculateLGD - Calculate Loss Given Default
   */
  private async calculateLGD(portfolio: Portfolio): Promise<void> {
    this.performanceService.startTimer('CalculateLGD');
    
    for (const loan of portfolio.loans) {
      // Simulate LGD calculation based on collateral and recovery rates
      // Adjust LGD based on collateral type and market conditions
      loan.lgd = Math.min(loan.lgd * 1.02, 1.0); // Slight increase, capped at 100%
    }
    
    this.performanceService.endTimer('CalculateLGD');
  }

  /**
   * ComputeWAL - Compute Weighted Average Life
   */
  private async computeWAL(portfolio: Portfolio): Promise<void> {
    this.performanceService.startTimer('ComputeWAL');
    
    for (const loan of portfolio.loans) {
      // Calculate WAL based on repayment schedule
      const maturityDate = new Date(loan.endDate);
      const currentDate = new Date();
      const yearsToMaturity = (maturityDate.getTime() - currentDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      
      // Store WAL calculation (simplified for now)
      // In real implementation, this would be stored in a separate field or calculated differently
      console.log(`WAL for loan ${loan.id}: ${Math.max(yearsToMaturity * 0.7, 0.1)} years`);
    }
    
    this.performanceService.endTimer('ComputeWAL');
  }

  /**
   * CalculateEVA - Calculate Economic Value Added
   */
  private async calculateEVA(portfolio: Portfolio, params: CalculationParameters): Promise<void> {
    this.performanceService.startTimer('CalculateEVA');
    
    for (const loan of portfolio.loans) {
      // Recalculate full metrics including EVA
      loan.metrics = calculateLoanMetrics(loan, params);
    }
    
    this.performanceService.endTimer('CalculateEVA');
  }

  /**
   * Utility method to simulate async operations
   */
  private async simulateAsyncOperation(delayMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }

  /**
   * Get current refresh status
   */
  isCurrentlyRefreshing(): boolean {
    return this.isRefreshing;
  }

  /**
   * Force stop refresh (emergency stop)
   */
  forceStopRefresh(): void {
    this.isRefreshing = false;
    this.auditService.logEvent('MasterRefresh', 'ForceStopped', {
      timestamp: new Date().toISOString()
    });
  }
}

export default MasterRefreshService; 
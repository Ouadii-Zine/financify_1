import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PieChart, 
  LineChart, 
  BarChart, 
  ComposedChart, 
  ResponsiveContainer, 
  Pie, 
  Cell, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Bar, 
  Area 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  CreditCard, 
  BadgePercent, 
  BarChart3, 
  UserCheck 
} from 'lucide-react';
import { samplePortfolio, defaultCalculationParameters } from '../data/sampleData';
import { calculatePortfolioMetrics, calculateLoanMetrics } from '../utils/financialCalculations';
import { Loan, Currency, CalculationParameters } from '../types/finance';
import LoanDataService from '../services/LoanDataService';
import { LOANS_UPDATED_EVENT } from '../services/LoanDataService';
import ParameterService from '../services/ParameterService';
import { formatCurrency as formatCurrencyUtil, convertCurrency, convertLoanAmountToDisplayCurrency } from '../utils/currencyUtils';

const COLORS = ['#00C48C', '#2D5BFF', '#FFB800', '#FF3B5B', '#1A2C42'];

const Dashboard = () => {
  const [portfolio, setPortfolio] = useState(samplePortfolio);
  const [portfolioMetrics, setPortfolioMetrics] = useState(portfolio.metrics);
  const [currentCurrency, setCurrentCurrency] = useState<Currency>('USD');
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number>(1.0);
  const [eurToUsdRate, setEurToUsdRate] = useState<number>(1.0968); // EUR to USD rate
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 1 });
  const loanDataService = LoanDataService.getInstance();
  
  // Calculate portfolio metrics with proper currency conversion
  const calculatePortfolioMetricsWithCurrencyConversion = (
    loans: Loan[], 
    params: CalculationParameters, 
    displayCurrency: Currency,
    exchangeRates: Record<string, number>,
    eurToUsdRate: number
  ) => {

    // Convert each loan's metrics to display currency before aggregating
    const loansWithConvertedMetrics = loans.map(loan => {
      const convertedOriginalAmount = convertLoanAmountToDisplayCurrency(
        loan.originalAmount, 
        loan.currency, 
        displayCurrency, 
        exchangeRates, 
        eurToUsdRate
      );
      const convertedDrawnAmount = convertLoanAmountToDisplayCurrency(
        loan.drawnAmount, 
        loan.currency, 
        displayCurrency, 
        exchangeRates, 
        eurToUsdRate
      );
      const convertedUndrawnAmount = convertLoanAmountToDisplayCurrency(
        loan.undrawnAmount, 
        loan.currency, 
        displayCurrency, 
        exchangeRates, 
        eurToUsdRate
      );
      
      return {
        ...loan,
        originalAmount: convertedOriginalAmount,
        drawnAmount: convertedDrawnAmount,
        undrawnAmount: convertedUndrawnAmount,
        metrics: {
          ...loan.metrics,
          expectedLoss: convertLoanAmountToDisplayCurrency(
            loan.metrics?.expectedLoss || 0, 
            loan.currency, 
            displayCurrency, 
            exchangeRates, 
            eurToUsdRate
          ),
          rwa: convertLoanAmountToDisplayCurrency(
            loan.metrics?.rwa || 0, 
            loan.currency, 
            displayCurrency, 
            exchangeRates, 
            eurToUsdRate
          ),
          evaIntrinsic: convertLoanAmountToDisplayCurrency(
            loan.metrics?.evaIntrinsic || 0, 
            loan.currency, 
            displayCurrency, 
            exchangeRates, 
            eurToUsdRate
          ),
          evaSale: convertLoanAmountToDisplayCurrency(
            loan.metrics?.evaSale || 0, 
            loan.currency, 
            displayCurrency, 
            exchangeRates, 
            eurToUsdRate
          )
        }
      };
    });
    
    // Now calculate portfolio metrics with converted amounts
    return calculatePortfolioMetrics(loansWithConvertedMetrics, params);
  };
  
  // Load currency settings from parameters and fetch EUR rate
  useEffect(() => {
    const loadCurrencySettings = async () => {
      const parameters = ParameterService.loadParameters();
      if (parameters.currency) {
        setCurrentCurrency(parameters.currency);
      }
      if (parameters.exchangeRate) {
        setCurrentExchangeRate(parameters.exchangeRate);
      }
      
      // Fetch all exchange rates
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.ok) {
          const data = await response.json();
          setExchangeRates(data.rates || { USD: 1 });
          const eurRate = data.rates?.EUR;
          if (eurRate) {
            setEurToUsdRate(eurRate);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch exchange rates, using fallback:', error);
        setEurToUsdRate(0.9689); // Fallback EUR rate
        setExchangeRates({ USD: 1, EUR: 0.9689 });
      }
    };
    
    loadCurrencySettings();
  }, []);
  
  const loadDashboardData = useCallback(() => {
    // Load data from service
    loanDataService.loadFromLocalStorage();
    // Get only user-added loans, without including predefined examples
    const userLoans = loanDataService.getLoans();
    
    if (userLoans.length === 0) {
      // If no user loans, initialize with empty array
      const emptyPortfolio = {
        ...portfolio,
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
      setPortfolio(emptyPortfolio);
      setPortfolioMetrics(emptyPortfolio.metrics);
      setSectorData([]);
    } else {
      // Calculate metrics for user loans
      const loansWithMetrics = userLoans.map(loan => ({
        ...loan,
        metrics: calculateLoanMetrics(loan, ParameterService.loadParameters())
      }));
      
      // Calculate portfolio metrics with currency conversion
      const userPortfolioMetrics = calculatePortfolioMetricsWithCurrencyConversion(
        loansWithMetrics, 
        ParameterService.loadParameters(),
        currentCurrency,
        exchangeRates,
        eurToUsdRate
      );
      
      // Create portfolio with user loans
      const userPortfolio = {
        ...portfolio,
        loans: loansWithMetrics,
        metrics: userPortfolioMetrics
      };
      
      // Update state with user portfolio
      setPortfolio(userPortfolio);
      setPortfolioMetrics(userPortfolioMetrics);
      
      // Recalculate charts with user data
      const updatedSectorData = calculateSectorData(loansWithMetrics);
      setSectorData(updatedSectorData);
    }
  }, [currentCurrency, exchangeRates, eurToUsdRate]);
  
  useEffect(() => {
    loadDashboardData();
    
    // Add event listener for loan updates
    const handleLoansUpdated = () => {
      loadDashboardData();
    };

    // Add event listener for parameter updates (including currency changes)
    const handleParametersUpdated = async () => {
      const parameters = ParameterService.loadParameters();
      if (parameters.currency) {
        setCurrentCurrency(parameters.currency);
      }
      if (parameters.exchangeRate) {
        setCurrentExchangeRate(parameters.exchangeRate);
      }
      
      // Refresh exchange rates when parameters are updated
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.ok) {
          const data = await response.json();
          setExchangeRates(data.rates || { USD: 1 });
          const eurRate = data.rates?.EUR;
          if (eurRate) {
            setEurToUsdRate(eurRate);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch exchange rates, using current value');
      }
      
      loadDashboardData();
    };
    
    window.addEventListener(LOANS_UPDATED_EVENT, handleLoansUpdated);
    window.addEventListener('parameters-updated', handleParametersUpdated);
    
    // Cleanup listeners on component unmount
    return () => {
      window.removeEventListener(LOANS_UPDATED_EVENT, handleLoansUpdated);
      window.removeEventListener('parameters-updated', handleParametersUpdated);
    };
  }, []);

  // Refresh dashboard when currency or exchange rates change
  useEffect(() => {
    loadDashboardData();
  }, [currentCurrency, currentExchangeRate, exchangeRates]);
  
  // Add this function to calculate sector data
  const [sectorData, setSectorData] = useState<{ name: string; value: number }[]>([]);
  
  // Function to calculate sector distribution data with currency conversion
  const calculateSectorData = useCallback((loans: Loan[]) => {
    return loans.reduce((acc, loan) => {
      const existingSector = acc.find(item => item.name === loan.sector);
      const convertedAmount = convertLoanAmountToDisplayCurrency(
        loan.originalAmount, 
        loan.currency, 
        currentCurrency, 
        exchangeRates, 
        eurToUsdRate
      );
      if (existingSector) {
        existingSector.value += convertedAmount;
      } else {
        acc.push({ name: loan.sector, value: convertedAmount });
      }
      return acc;
    }, [] as { name: string; value: number }[]);
  }, [currentCurrency, exchangeRates, eurToUsdRate]);
  
  // Data for actual portfolio performance by sector with currency conversion
  const performanceBySector = portfolio.loans.reduce((acc, loan) => {
    const existingSector = acc.find(item => item.sector === loan.sector);
    const loanROE = (loan.metrics?.roe || 0) * 100;
    const loanRAROC = (loan.metrics?.raroc || 0) * 100;
    const loanEVA = convertLoanAmountToDisplayCurrency(
      loan.metrics?.evaIntrinsic || 0, 
      loan.currency, 
      currentCurrency, 
      exchangeRates, 
      eurToUsdRate
    );
    const loanExposure = convertLoanAmountToDisplayCurrency(
      loan.originalAmount, 
      loan.currency, 
      currentCurrency, 
      exchangeRates, 
      eurToUsdRate
    );
    
    if (existingSector) {
      existingSector.totalEVA += loanEVA;
      existingSector.totalExposure += loanExposure;
      existingSector.loanCount += 1;
      // Weighted average ROE and RAROC by exposure
      existingSector.weightedROE = ((existingSector.weightedROE * (existingSector.totalExposure - loanExposure)) + 
                                   (loanROE * loanExposure)) / existingSector.totalExposure;
      existingSector.weightedRAROC = ((existingSector.weightedRAROC * (existingSector.totalExposure - loanExposure)) + 
                                     (loanRAROC * loanExposure)) / existingSector.totalExposure;
    } else {
      acc.push({
        sector: loan.sector,
        totalEVA: loanEVA,
        totalExposure: loanExposure,
        weightedROE: loanROE,
        weightedRAROC: loanRAROC,
        loanCount: 1
      });
    }
    return acc;
  }, [] as { sector: string; totalEVA: number; totalExposure: number; weightedROE: number; weightedRAROC: number; loanCount: number }[]);

  // Performance vs targets data
  const performanceVsTargets = [
    {
      metric: 'Portfolio ROE',
      actual: portfolioMetrics.portfolioROE * 100,
      target: defaultCalculationParameters.targetROE * 100,
      status: portfolioMetrics.portfolioROE >= defaultCalculationParameters.targetROE ? 'above' : 'below'
    },
    {
      metric: 'Portfolio RAROC', 
      actual: portfolioMetrics.portfolioRAROC * 100,
      target: defaultCalculationParameters.targetROE * 100, // Using same target for simplicity
      status: portfolioMetrics.portfolioRAROC >= defaultCalculationParameters.targetROE ? 'above' : 'below'
    },
    {
      metric: 'Risk-Adj. Return',
      actual: (portfolioMetrics.portfolioROE / (portfolioMetrics.weightedAveragePD || 1)) * 100,
      target: 100, // Example target of 100% risk-adjusted return
      status: (portfolioMetrics.portfolioROE / (portfolioMetrics.weightedAveragePD || 1)) >= 1 ? 'above' : 'below'
    }
  ];
  
  // Data for evolution of exposure, RWA, EL by quarter (sample data in EUR)
  const exposureData = [
    { name: 'Q1 2023', exposure: 65000000, rwa: 35000000, el: 750000 },
    { name: 'Q2 2023', exposure: 68000000, rwa: 36500000, el: 800000 },
    { name: 'Q3 2023', exposure: 70000000, rwa: 38000000, el: 820000 },
    { name: 'Q4 2023', exposure: 72000000, rwa: 39500000, el: 850000 },
    { name: 'Q1 2024', exposure: 75000000, rwa: 41000000, el: 880000 },
  ].map(item => ({
    ...item,
    exposure: convertLoanAmountToDisplayCurrency(item.exposure, 'EUR', currentCurrency, exchangeRates, eurToUsdRate),
    rwa: convertLoanAmountToDisplayCurrency(item.rwa, 'EUR', currentCurrency, exchangeRates, eurToUsdRate),
    el: convertLoanAmountToDisplayCurrency(item.el, 'EUR', currentCurrency, exchangeRates, eurToUsdRate)
  }));
  
  // Data for Top 5 Loans by EVA chart
  const topLoansByEva = portfolio.loans
    .slice()
    .sort((a, b) => (b.metrics?.evaIntrinsic || 0) - (a.metrics?.evaIntrinsic || 0))
    .slice(0, 5)
    .map(loan => ({
      name: loan.name,
      eva: convertLoanAmountToDisplayCurrency(
        loan.metrics?.evaIntrinsic || 0, 
        loan.currency, 
        currentCurrency, 
        exchangeRates, 
        eurToUsdRate
      ),
      roe: (loan.metrics?.roe || 0) * 100
    }));
  
  // Formatter to display amounts in selected currency
  const formatCurrency = (value: number) => {
    // Portfolio metrics are already converted to display currency, so no need for additional conversion
    return formatCurrencyUtil(value, currentCurrency, { maximumFractionDigits: 0 });
  };
  
  return (
    <div className="dashboard-grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* KPIs Row */}
      <Card className="financial-card col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <DollarSign className="h-5 w-5 mr-1 text-financial-blue" />
            Total Exposure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {formatCurrency(portfolioMetrics.totalExposure)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Drawn: {formatCurrency(portfolioMetrics.totalDrawn)}
          </p>
        </CardContent>
      </Card>
      
      <Card className="financial-card col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <BarChart3 className="h-5 w-5 mr-1 text-financial-green" />
            Portfolio ROE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold flex items-center">
            {(portfolioMetrics.portfolioROE * 100).toFixed(2)}%
            {portfolioMetrics.portfolioROE > defaultCalculationParameters.targetROE ? (
              <TrendingUp className="ml-2 h-5 w-5 text-financial-green" />
            ) : (
              <TrendingDown className="ml-2 h-5 w-5 text-financial-red" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Target: {(defaultCalculationParameters.targetROE * 100).toFixed(2)}%
          </p>
        </CardContent>
      </Card>
      
      <Card className="financial-card col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <AlertTriangle className="h-5 w-5 mr-1 text-financial-yellow" />
            Expected Loss
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {formatCurrency(portfolioMetrics.totalExpectedLoss)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {((portfolioMetrics.totalExpectedLoss / portfolioMetrics.totalExposure) * 100).toFixed(2)}% of portfolio
          </p>
        </CardContent>
      </Card>
      
      {/* Tabs for charts */}
      <div className="col-span-1 lg:col-span-3">
        <Tabs defaultValue="exposure" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="exposure">Exposure</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="risk">Risk</TabsTrigger>
            <TabsTrigger value="eva">EVA</TabsTrigger>
          </TabsList>
          
          {/* Exposure Tab */}
          <TabsContent value="exposure" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="financial-card">
                <CardHeader>
                  <CardTitle>Sector Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sectorData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {sectorData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="financial-card">
                <CardHeader>
                  <CardTitle>Exposure Evolution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={exposureData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Area type="monotone" dataKey="exposure" yAxisId="left" stroke="#2D5BFF" fill="#2D5BFF" fillOpacity={0.1} />
                        <Bar dataKey="rwa" yAxisId="left" barSize={20} fill="#00C48C" />
                        <Line type="monotone" dataKey="el" yAxisId="right" stroke="#FF3B5B" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="financial-card">
              <CardHeader>
                  <CardTitle>Performance vs Targets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceVsTargets} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="metric" />
                      <YAxis 
                        domain={[0, 'dataMax']}
                          tickFormatter={(value) => `${value.toFixed(1)}%`}
                      />
                        <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                      <Legend />
                        <Bar dataKey="actual" fill="#2D5BFF" name="Actual" />
                        <Bar dataKey="target" fill="#00C48C" name="Target" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
              
              <Card className="financial-card">
                <CardHeader>
                  <CardTitle>Performance by Sector</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={performanceBySector}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="sector" />
                        <YAxis yAxisId="left" orientation="left" label={{ value: 'ROE/RAROC (%)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: `EVA (${currentCurrency})`, angle: 90, position: 'insideRight' }} />
                        <Tooltip formatter={(value: number, name: string) => [
                          name === 'totalEVA' 
                            ? formatCurrency(value)
                            : `${value.toFixed(2)}%`,
                          name === 'weightedROE' ? 'Weighted ROE' : name === 'weightedRAROC' ? 'Weighted RAROC' : 'Total EVA'
                        ]} />
                        <Legend />
                        <Bar dataKey="weightedROE" yAxisId="left" fill="#2D5BFF" name="Weighted ROE (%)" />
                        <Bar dataKey="weightedRAROC" yAxisId="left" fill="#00C48C" name="Weighted RAROC (%)" />
                        <Line type="monotone" dataKey="totalEVA" yAxisId="right" stroke="#FF3B5B" name={`Total EVA (${currentCurrency})`} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Performance Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="financial-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <BadgePercent className="h-4 w-4 mr-1 text-financial-blue" />
                    Risk-Adjusted Return
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {((portfolioMetrics.portfolioROE / (portfolioMetrics.weightedAveragePD || 1)) * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ROE / Weighted Avg PD
                  </p>
                </CardContent>
              </Card>
              
              <Card className="financial-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <CreditCard className="h-4 w-4 mr-1 text-financial-green" />
                    Capital Efficiency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {portfolioMetrics.totalRWA > 0 ? (portfolioMetrics.evaSumIntrinsic / portfolioMetrics.totalRWA * 100).toFixed(2) : '0.00'}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    EVA / RWA Ratio
                  </p>
                </CardContent>
              </Card>
              
              <Card className="financial-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <UserCheck className="h-4 w-4 mr-1 text-financial-yellow" />
                    Diversification Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {performanceBySector.length > 0 ? (100 / performanceBySector.length).toFixed(0) : '0'}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {performanceBySector.length} sectors
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Risk Tab */}
          <TabsContent value="risk" className="space-y-6">
            <Card className="financial-card">
              <CardHeader>
                <CardTitle>PD/LGD Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={portfolio.loans.map(loan => ({
                        name: loan.name,
                        pd: loan.pd * 100,
                        lgd: loan.lgd * 100,
                        exposure: loan.originalAmount
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" label={{ value: 'PD/LGD (%)', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: `Exposure (${currentCurrency})`, angle: 90, position: 'insideRight' }} />
                      <Tooltip formatter={(value: number, name: string) => [
                        name === 'exposure' 
                          ? formatCurrency(value)
                          : `${value.toFixed(2)}%`,
                        name === 'pd' ? 'PD' : name === 'lgd' ? 'LGD' : 'Exposure'
                      ]} />
                      <Legend />
                      <Bar dataKey="pd" yAxisId="left" fill="#FF3B5B" name="PD (%)" />
                      <Bar dataKey="lgd" yAxisId="left" fill="#FFB800" name="LGD (%)" />
                      <Line type="monotone" dataKey="exposure" yAxisId="right" stroke="#2D5BFF" name={`Exposure (${currentCurrency})`} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* EVA Tab */}
          <TabsContent value="eva" className="space-y-6">
            <Card className="financial-card">
              <CardHeader>
                <CardTitle>Top 5 Loans by EVA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topLoansByEva}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" label={{ value: `EVA (${currentCurrency})`, angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'ROE (%)', angle: 90, position: 'insideRight' }} />
                      <Tooltip formatter={(value: number, name: string) => [
                        name === 'eva' 
                          ? formatCurrency(value)
                          : `${value.toFixed(2)}%`,
                        name === 'eva' ? 'EVA' : 'ROE'
                      ]} />
                      <Legend />
                      <Bar dataKey="eva" yAxisId="left" fill="#00C48C" name="EVA" />
                      <Line type="monotone" dataKey="roe" yAxisId="right" stroke="#2D5BFF" name="ROE (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;

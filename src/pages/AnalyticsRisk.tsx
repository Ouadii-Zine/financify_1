
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  PieChart, 
  ResponsiveContainer, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ZAxis,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Target, 
  Shield, 
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Briefcase,
  Calculator,
  Zap,
  Info
} from 'lucide-react';
import { defaultCalculationParameters } from '@/data/sampleData';
import { calculatePortfolioMetrics, calculateLoanMetrics } from '@/utils/financialCalculations';
import { Loan, PortfolioMetrics, PortfolioSummary, Currency } from '@/types/finance';
import LoanDataService, { LOANS_UPDATED_EVENT } from '@/services/LoanDataService';
import PortfolioService, { PORTFOLIOS_UPDATED_EVENT } from '@/services/PortfolioService';
import ParameterService from '@/services/ParameterService';
import { formatCurrency as formatCurrencyUtil, convertCurrency, CURRENCY_SYMBOLS } from '@/utils/currencyUtils';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const COLORS = ['#00C48C', '#2D5BFF', '#FFB800', '#FF3B5B', '#1A2C42', '#9B87F5', '#7E69AB'];

const AnalyticsRisk = () => {
  const navigate = useNavigate();
  const loanDataService = LoanDataService.getInstance();
  const portfolioService = PortfolioService.getInstance();
  
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics>({
    totalExposure: 0,
    totalDrawn: 0,
    totalUndrawn: 0,
    totalExpectedLoss: 0,
    weightedAveragePD: 0,
    weightedAverageLGD: 0,
    totalRWA: 0,
    portfolioROE: 0,
    portfolioRAROC: 0,
    evaSumIntrinsic: 0,
    evaSumSale: 0,
    diversificationBenefit: 0
  });
  
  // Currency state management
  const [currentCurrency, setCurrentCurrency] = useState<Currency>('USD');
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number>(1.0);
  const [eurToUsdRate, setEurToUsdRate] = useState<number>(1.0968);
  
  // Stress testing scenarios
  const [stressScenario, setStressScenario] = useState<string>('mild');
  
  useEffect(() => {
    // Load data
    loanDataService.loadFromLocalStorage();
    
    // Load portfolios
    const portfolioSummaries = portfolioService.getPortfolioSummaries();
    setPortfolios(portfolioSummaries);
    
    // Auto-select the default portfolio
    if (!selectedPortfolioId && portfolioSummaries.length > 0) {
      const defaultPortfolio = portfolioSummaries.find(p => p.isDefault);
      if (defaultPortfolio) {
        setSelectedPortfolioId(defaultPortfolio.id);
      } else {
        setSelectedPortfolioId(portfolioSummaries[0].id);
      }
    }
    
    // Load currency settings
    const loadCurrencySettings = async () => {
      const parameters = ParameterService.loadParameters();
      if (parameters.currency) {
        setCurrentCurrency(parameters.currency);
      }
      if (parameters.exchangeRate) {
        setCurrentExchangeRate(parameters.exchangeRate);
      }
      
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.ok) {
          const data = await response.json();
          const eurRate = data.rates?.EUR;
          if (eurRate) {
            setEurToUsdRate(eurRate);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch EUR rate, using fallback:', error);
        setEurToUsdRate(0.9689);
      }
    };
    
    loadCurrencySettings();
    
    // Add listeners
    const handlePortfoliosUpdated = () => {
      const updatedPortfolios = portfolioService.getPortfolioSummaries();
      setPortfolios(updatedPortfolios);
    };
    
    const handleLoansUpdated = () => {
      if (selectedPortfolioId) {
        loadLoansForPortfolio(selectedPortfolioId);
      }
    };

    const handleParametersUpdated = async () => {
      const parameters = ParameterService.loadParameters();
      if (parameters.currency) {
        setCurrentCurrency(parameters.currency);
      }
      if (parameters.exchangeRate) {
        setCurrentExchangeRate(parameters.exchangeRate);
      }
      
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.ok) {
          const data = await response.json();
          const eurRate = data.rates?.EUR;
          if (eurRate) {
            setEurToUsdRate(eurRate);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch EUR rate, using current value');
      }
    };
    
    window.addEventListener(PORTFOLIOS_UPDATED_EVENT, handlePortfoliosUpdated);
    window.addEventListener(LOANS_UPDATED_EVENT, handleLoansUpdated as EventListener);
    window.addEventListener('parameters-updated', handleParametersUpdated);
    
    return () => {
      window.removeEventListener(PORTFOLIOS_UPDATED_EVENT, handlePortfoliosUpdated);
      window.removeEventListener(LOANS_UPDATED_EVENT, handleLoansUpdated as EventListener);
      window.removeEventListener('parameters-updated', handleParametersUpdated);
    };
  }, []);
  
  useEffect(() => {
    if (selectedPortfolioId) {
      loadLoansForPortfolio(selectedPortfolioId);
    }
  }, [selectedPortfolioId]);
  
  const loadLoansForPortfolio = (portfolioId: string) => {
    const portfolioLoans = loanDataService.getLoans(portfolioId);
    
    const loansWithMetrics = portfolioLoans.map(loan => ({
      ...loan,
      metrics: calculateLoanMetrics(loan, defaultCalculationParameters)
    }));
    
    setLoans(loansWithMetrics);
    setPortfolioMetrics(calculatePortfolioMetrics(loansWithMetrics, defaultCalculationParameters));
  };
  
  const handlePortfolioChange = (portfolioId: string) => {
    setSelectedPortfolioId(portfolioId);
  };

  // Format currency with dynamic conversion
  const formatCurrency = (value: number) => {
    const convertedValue = convertCurrency(value, currentCurrency, currentExchangeRate, eurToUsdRate);
    return formatCurrencyUtil(convertedValue, currentCurrency, { maximumFractionDigits: 0 });
  };
  
  // Get currency unit for charts
  const getCurrencyUnit = () => {
    const symbol = CURRENCY_SYMBOLS[currentCurrency];
    return symbol ? `M${symbol}` : `M${currentCurrency}`;
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return (value * 100).toFixed(2) + '%';
  };
  
  // Risk analytics calculations
  const riskAnalytics = {
    // Expected Loss by sector
    elBySector: loans.reduce((acc, loan) => {
      const sector = loan.sector;
      const el = loan.metrics?.expectedLoss || 0;
      
      const existingSector = acc.find(item => item.name === sector);
      if (existingSector) {
        existingSector.value += el;
        existingSector.count += 1;
      } else {
        acc.push({ name: sector, value: el, count: 1 });
      }
      
      return acc;
    }, [] as { name: string; value: number; count: number }[]),
    
    // Risk concentration by client
    concentrationByClient: loans.reduce((acc, loan) => {
      const client = loan.clientName;
      const exposure = loan.originalAmount;
      const el = loan.metrics?.expectedLoss || 0;
      
      const existingClient = acc.find(item => item.name === client);
      if (existingClient) {
        existingClient.exposure += exposure;
        existingClient.expectedLoss += el;
        existingClient.loanCount += 1;
      } else {
        acc.push({ 
          name: client, 
          exposure, 
          expectedLoss: el,
          loanCount: 1,
          avgPD: loan.pd * 100,
          avgLGD: loan.lgd * 100
        });
      }
      
      return acc;
    }, [] as any[]).sort((a, b) => b.exposure - a.exposure).slice(0, 10),
    
    // Rating distribution
    ratingDistribution: loans.reduce((acc, loan) => {
      const rating = loan.internalRating;
      const exposure = loan.originalAmount;
      const el = loan.metrics?.expectedLoss || 0;
      
      const existingRating = acc.find(item => item.rating === rating);
      if (existingRating) {
        existingRating.exposure += exposure;
        existingRating.expectedLoss += el;
        existingRating.count += 1;
      } else {
        acc.push({ 
          rating, 
          exposure, 
          expectedLoss: el,
          count: 1,
          avgPD: loan.pd * 100
        });
      }
      
      return acc;
    }, [] as any[]),
    
    // PD vs LGD data
    pdLgdData: loans.map(loan => ({
      name: loan.name,
      pd: loan.pd * 100,
      lgd: loan.lgd * 100,
      exposure: loan.originalAmount / 1000000, // Convert to millions
      el: (loan.metrics?.expectedLoss || 0) / 1000000,
      sector: loan.sector
    })),
    
    // Top risky loans
    topRiskyLoans: [...loans]
      .sort((a, b) => (b.metrics?.expectedLoss || 0) - (a.metrics?.expectedLoss || 0))
      .slice(0, 10)
      .map(loan => ({
        name: loan.name,
        client: loan.clientName,
        sector: loan.sector,
        rating: loan.internalRating,
        exposure: loan.originalAmount,
        expectedLoss: loan.metrics?.expectedLoss || 0,
        pd: loan.pd * 100,
        lgd: loan.lgd * 100,
        costOfRisk: ((loan.metrics?.expectedLoss || 0) / loan.originalAmount) * 100
      }))
  };
  
  // Stress testing scenarios
  const stressScenarios = {
    mild: { pdMultiplier: 1.5, lgdMultiplier: 1.1, name: 'Mild Stress' },
    moderate: { pdMultiplier: 2.0, lgdMultiplier: 1.3, name: 'Moderate Stress' },
    severe: { pdMultiplier: 3.0, lgdMultiplier: 1.5, name: 'Severe Stress' }
  };
  
  const stressTestResults = loans.map(loan => {
    const scenario = stressScenarios[stressScenario as keyof typeof stressScenarios];
    const stressedPD = Math.min(loan.pd * scenario.pdMultiplier, 1.0);
    const stressedLGD = Math.min(loan.lgd * scenario.lgdMultiplier, 1.0);
    const stressedEL = stressedPD * stressedLGD * loan.ead;
    const currentEL = loan.metrics?.expectedLoss || 0;
    
    return {
      name: loan.name,
      currentEL,
      stressedEL,
      increase: stressedEL - currentEL,
      increasePercent: currentEL > 0 ? ((stressedEL - currentEL) / currentEL) * 100 : 0
    };
  });
  
  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Risk Analytics</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/loans')}>
            View Loans
          </Button>
          <Button variant="outline" onClick={() => navigate('/portfolios')}>
            Manage Portfolios
          </Button>
        </div>
      </div>

      {/* Portfolio Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Portfolio Selection
          </CardTitle>
          <CardDescription>
            Choose a portfolio to analyze its risk profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Active Portfolio</Label>
              <Select value={selectedPortfolioId} onValueChange={handlePortfolioChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a portfolio" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map(portfolio => (
                    <SelectItem key={portfolio.id} value={portfolio.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{portfolio.name}</span>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge variant="secondary" className="text-xs">
                            {portfolio.loanCount} loans
                          </Badge>
                          {portfolio.isDefault && (
                            <Badge variant="outline" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedPortfolio && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-sm text-muted-foreground">Portfolio</Label>
                  <p className="font-medium">{selectedPortfolio.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Total Loans</Label>
                  <p className="font-medium">{selectedPortfolio.loanCount}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Total Exposure</Label>
                  <p className="font-medium">{formatCurrency(selectedPortfolio.totalExposure)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Avg PD</Label>
                  <p className="font-medium">{formatPercent(portfolioMetrics.weightedAveragePD)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPortfolioId && loans.length > 0 ? (
        <>
          {/* Risk KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expected Loss</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(portfolioMetrics.totalExpectedLoss)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {((portfolioMetrics.totalExpectedLoss / portfolioMetrics.totalExposure) * 100).toFixed(2)}% of exposure
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weighted Avg PD</CardTitle>
                <Target className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercent(portfolioMetrics.weightedAveragePD)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Probability of Default
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weighted Avg LGD</CardTitle>
                <Shield className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercent(portfolioMetrics.weightedAverageLGD)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Loss Given Default
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Risk Density</CardTitle>
                <Activity className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((portfolioMetrics.totalRWA / portfolioMetrics.totalExposure) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  RWA / Total Exposure
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Risk Analysis Tabs */}
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Risk Overview</TabsTrigger>
              <TabsTrigger value="concentration">Concentration</TabsTrigger>
              <TabsTrigger value="stress-test">Stress Testing</TabsTrigger>
              <TabsTrigger value="top-risks">Top Risks</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* EL by Sector */}
                <Card>
                  <CardHeader>
                    <CardTitle>Expected Loss by Sector</CardTitle>
                    <CardDescription>Risk distribution across business sectors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={riskAnalytics.elBySector}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {riskAnalytics.elBySector.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* PD vs LGD Mapping */}
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Profile Mapping</CardTitle>
                    <CardDescription>PD vs LGD distribution (bubble size = exposure)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid />
                          <XAxis 
                            type="number" 
                            dataKey="pd" 
                            name="PD" 
                            unit="%" 
                            domain={[0, 'dataMax']}
                          />
                          <YAxis 
                            type="number" 
                            dataKey="lgd" 
                            name="LGD" 
                            unit="%" 
                            domain={[0, 'dataMax']}
                          />
                          <ZAxis 
                            type="number" 
                            dataKey="exposure" 
                            name="Exposure" 
                            range={[50, 400]} 
                            unit={getCurrencyUnit()}
                          />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              name === 'exposure' 
                                ? formatCurrency(value * 1000000)
                                : `${value.toFixed(2)}%`,
                              name === 'pd' ? 'PD' : name === 'lgd' ? 'LGD' : 'Exposure'
                            ]}
                            cursor={{ strokeDasharray: '3 3' }}
                          />
                          <Scatter name="Loans" data={riskAnalytics.pdLgdData} fill="#FF3B5B" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="concentration">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Client Concentration */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Clients by Exposure</CardTitle>
                    <CardDescription>Risk concentration analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {riskAnalytics.concentrationByClient.map((client, index) => (
                        <div key={client.name} className="flex items-center space-x-4">
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{client.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {formatCurrency(client.exposure)}
                              </span>
                            </div>
                            <Progress 
                              value={(client.exposure / portfolioMetrics.totalExposure) * 100} 
                              className="h-2"
                            />
                            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                              <span>{client.loanCount} loans</span>
                              <span>
                                {((client.exposure / portfolioMetrics.totalExposure) * 100).toFixed(1)}% of portfolio
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Rating Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Exposure by Rating</CardTitle>
                    <CardDescription>Credit quality distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={riskAnalytics.ratingDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="rating" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              name === 'exposure' ? formatCurrency(value) : value,
                              name === 'exposure' ? 'Exposure' : 'Count'
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="exposure" fill="#2D5BFF" name="Exposure" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="stress-test">
              <div className="grid grid-cols-1 gap-6">
                {/* Stress Test Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Stress Testing Scenarios
                    </CardTitle>
                    <CardDescription>
                      Analyze portfolio performance under stressed conditions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Stress Scenario</Label>
                        <Select value={stressScenario} onValueChange={setStressScenario}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mild">Mild Stress (PD ×1.5, LGD ×1.1)</SelectItem>
                            <SelectItem value="moderate">Moderate Stress (PD ×2.0, LGD ×1.3)</SelectItem>
                            <SelectItem value="severe">Severe Stress (PD ×3.0, LGD ×1.5)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold">
                            {formatCurrency(portfolioMetrics.totalExpectedLoss)}
                          </div>
                          <p className="text-sm text-muted-foreground">Current EL</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(stressTestResults.reduce((sum, r) => sum + r.stressedEL, 0))}
                          </div>
                          <p className="text-sm text-muted-foreground">Stressed EL</p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {formatCurrency(stressTestResults.reduce((sum, r) => sum + r.increase, 0))}
                          </div>
                          <p className="text-sm text-muted-foreground">Increase</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stress Test Results Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Stress Test Impact by Loan</CardTitle>
                    <CardDescription>Expected loss changes under stress scenario</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Loan Name</TableHead>
                          <TableHead className="text-right">Current EL</TableHead>
                          <TableHead className="text-right">Stressed EL</TableHead>
                          <TableHead className="text-right">Increase</TableHead>
                          <TableHead className="text-right">Impact %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stressTestResults
                          .sort((a, b) => b.increase - a.increase)
                          .slice(0, 10)
                          .map((result) => (
                          <TableRow key={result.name}>
                            <TableCell className="font-medium">{result.name}</TableCell>
                            <TableCell className="text-right">{formatCurrency(result.currentEL)}</TableCell>
                            <TableCell className="text-right text-red-600">
                              {formatCurrency(result.stressedEL)}
                            </TableCell>
                            <TableCell className="text-right text-orange-600">
                              {formatCurrency(result.increase)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={result.increasePercent > 100 ? "destructive" : "secondary"}>
                                +{result.increasePercent.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="top-risks">
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Riskiest Loans</CardTitle>
                  <CardDescription>Loans with highest expected loss and risk metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loan Name</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Sector</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead className="text-right">Exposure</TableHead>
                        <TableHead className="text-right">Expected Loss</TableHead>
                        <TableHead className="text-right">PD</TableHead>
                        <TableHead className="text-right">LGD</TableHead>
                        <TableHead className="text-right">Cost of Risk</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {riskAnalytics.topRiskyLoans.map((loan) => (
                        <TableRow key={loan.name}>
                          <TableCell className="font-medium">{loan.name}</TableCell>
                          <TableCell>{loan.client}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{loan.sector}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              loan.rating.startsWith('A') ? 'default' : 
                              loan.rating.startsWith('B') ? 'secondary' : 'destructive'
                            }>
                              {loan.rating}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(loan.exposure)}</TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(loan.expectedLoss)}
                          </TableCell>
                          <TableCell className="text-right">{loan.pd.toFixed(2)}%</TableCell>
                          <TableCell className="text-right">{loan.lgd.toFixed(0)}%</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={loan.costOfRisk > 2 ? "destructive" : "secondary"}>
                              {loan.costOfRisk.toFixed(2)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Portfolio Selected</h3>
            <p className="text-muted-foreground mb-4">
              Please select a portfolio to view its risk analytics.
            </p>
            <Button onClick={() => navigate('/portfolios')}>
              Manage Portfolios
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsRisk;

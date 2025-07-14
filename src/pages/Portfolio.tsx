import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  BarChart, 
  ResponsiveContainer, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { defaultCalculationParameters } from '@/data/sampleData';
import { calculatePortfolioMetrics, calculateLoanMetrics } from '@/utils/financialCalculations';
import { Loan, PortfolioMetrics, Portfolio as PortfolioType, PortfolioSummary, RatingType, Currency } from '@/types/finance';
import { getAvailableRatingTypes } from '@/utils/financialCalculations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import ParameterService from '@/services/ParameterService';
import { formatCurrency as formatCurrencyUtil, convertCurrency } from '@/utils/currencyUtils';
import { 
  TrendingDown, 
  AlertTriangle, 
  Briefcase, 
  Building, 
  Download,
  FileSpreadsheet,
  Filter,
  Plus,
  Upload
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import ExcelTemplateService from '@/services/ExcelTemplateService';
import LoanDataService, { LOANS_UPDATED_EVENT } from '@/services/LoanDataService';
import PortfolioService, { PORTFOLIOS_UPDATED_EVENT } from '@/services/PortfolioService';


// Colors for charts
const COLORS = ['#00C48C', '#2D5BFF', '#FFB800', '#FF3B5B', '#1A2C42', '#9B87F5', '#7E69AB'];

const Portfolio = () => {
  const navigate = useNavigate();
  const loanDataService = LoanDataService.getInstance();
  const portfolioService = PortfolioService.getInstance();
  
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [selectedRatingType, setSelectedRatingType] = useState<RatingType>('sp');
  const [availableRatingTypes, setAvailableRatingTypes] = useState<RatingType[]>([]);
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
  const [eurToUsdRate, setEurToUsdRate] = useState<number>(1.0968); // EUR to USD rate
  
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
      
      // Always fetch the EUR rate for conversion calculations
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
        setEurToUsdRate(0.9689); // Fallback EUR rate
      }
    };
    
    loadCurrencySettings();
  }, []);
  

  
  useEffect(() => {
    // Load data from localStorage
    loanDataService.loadFromLocalStorage();
    
    // Load portfolios
    const portfolioSummaries = portfolioService.getPortfolioSummaries();
    setPortfolios(portfolioSummaries);
    
    // Auto-select the default portfolio if none selected
    if (!selectedPortfolioId && portfolioSummaries.length > 0) {
      const defaultPortfolio = portfolioSummaries.find(p => p.isDefault);
      if (defaultPortfolio) {
        setSelectedPortfolioId(defaultPortfolio.id);
      } else {
        setSelectedPortfolioId(portfolioSummaries[0].id);
      }
    }
    
    // Add listener for portfolio and loan updates
    const handlePortfoliosUpdated = () => {
      const updatedPortfolios = portfolioService.getPortfolioSummaries();
      setPortfolios(updatedPortfolios);
    };
    
    const handleLoansUpdated = () => {
      if (selectedPortfolioId) {
        loadLoansForPortfolio(selectedPortfolioId);
      }
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
      
      // Refresh EUR rate when parameters are updated
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
    
    // Cleanup listeners on unmount
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
  
  // Recalculate metrics when rating type changes
  useEffect(() => {
    if (loans.length > 0) {
      const loansWithUpdatedMetrics = loans.map(loan => ({
        ...loan,
        metrics: calculateLoanMetrics(loan, defaultCalculationParameters, selectedRatingType)
      }));
      
      setLoans(loansWithUpdatedMetrics);
      setPortfolioMetrics(calculatePortfolioMetrics(loansWithUpdatedMetrics, defaultCalculationParameters, selectedRatingType));
    }
  }, [selectedRatingType]);

  // Refresh portfolio when currency changes
  useEffect(() => {
    if (selectedPortfolioId) {
      loadLoansForPortfolio(selectedPortfolioId);
    }
  }, [currentCurrency, currentExchangeRate]);
  
  const loadLoansForPortfolio = (portfolioId: string) => {
    const portfolioLoans = loanDataService.getLoans(portfolioId);
    
    // Get available rating types from all loans
    const allAvailableRatings = new Set<RatingType>();
    portfolioLoans.forEach(loan => {
      if (loan.ratings) {
        const loanRatingTypes = getAvailableRatingTypes(loan.ratings);
        loanRatingTypes.forEach(type => allAvailableRatings.add(type));
      }
    });
    
    const availableTypes = Array.from(allAvailableRatings);
    setAvailableRatingTypes(availableTypes);
    
    // Set default rating type if not already selected or not available
    if (availableTypes.length > 0 && !availableTypes.includes(selectedRatingType)) {
      setSelectedRatingType(availableTypes[0]);
    }
    
    // Recalculate metrics for these loans using selected rating type
    const loansWithMetrics = portfolioLoans.map(loan => ({
      ...loan,
      metrics: calculateLoanMetrics(loan, defaultCalculationParameters, selectedRatingType)
    }));
    
    setLoans(loansWithMetrics);
    setPortfolioMetrics(calculatePortfolioMetrics(loansWithMetrics, defaultCalculationParameters, selectedRatingType));
  };
  
  const handlePortfolioChange = (portfolioId: string) => {
    setSelectedPortfolioId(portfolioId);
  };
  

  
  // Data for EVA by loan chart
  const loanEvaData = loans.map(loan => ({
    name: loan.name,
    evaIntrinsic: loan.metrics?.evaIntrinsic || 0,
    roe: (loan.metrics?.roe || 0) * 100,
    outstandingAmount: loan.outstandingAmount
  })).sort((a, b) => b.evaIntrinsic - a.evaIntrinsic);
  
  // Data for ROE vs Risk chart (EL/Outstanding)
  const roeVsRiskData = loans.map(loan => ({
    name: loan.name,
    x: (loan.metrics?.expectedLoss || 0) / loan.outstandingAmount * 100, // EL/Outstanding in %
    y: (loan.metrics?.roe || 0) * 100, // ROE in %
    z: loan.outstandingAmount / 1000000, // Bubble size (Outstanding in millions)
    sector: loan.sector
  }));
  
  // Formatter to display amounts in selected currency
  const formatCurrency = (value: number) => {
    // Convert from EUR to selected currency if needed
    const convertedValue = convertCurrency(value, currentCurrency, currentExchangeRate, eurToUsdRate);
    return formatCurrencyUtil(convertedValue, currentCurrency, { maximumFractionDigits: 0 });
  };
  
  // Event handlers for buttons
  const handleImport = () => {
    console.log("Redirect to import page");
    navigate('/import');
  };
  
  const handleExport = () => {
    console.log("Export portfolio");
    toast({
      title: "Export in progress",
      description: "The portfolio is being exported to Excel format...",
      variant: "default"
    });
    
    try {
      // Create a portfolio object with current data
      const portfolio: PortfolioType = {
        id: 'financify-portfolio',
        name: 'Financify Portfolio',
        description: 'Complete portfolio including all loans',
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        loans: loans,
        metrics: portfolioMetrics
      };
      
      // Use export service
      const result = ExcelTemplateService.generateReport('Performance', portfolio, 'excel');
      if (!result.success) {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error exporting portfolio:", error);
      toast({
        title: "Error",
        description: "An error occurred while exporting the portfolio.",
        variant: "destructive"
      });
    }
  };
  
  const handleNewLoan = () => {
    console.log("Redirect to new loan creation");
    navigate('/loans/new');
    
    // Notification to indicate to the user that they are being redirected
    toast({
      title: "Creating a new loan",
      description: "You are being redirected to the new loan creation form.",
      variant: "default"
    });
  };

  // Rest of the code remains unchanged...
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Loan Portfolio</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleNewLoan}>
            <Plus className="h-4 w-4 mr-2" />
            New Loan
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
            Choose a portfolio to analyze its performance and metrics
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
            
            {availableRatingTypes.length > 0 && (
              <div className="grid gap-2">
                <Label>Rating System for Calculations</Label>
                <Select value={selectedRatingType} onValueChange={(value: RatingType) => setSelectedRatingType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating system" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRatingTypes.map(ratingType => (
                      <SelectItem key={ratingType} value={ratingType}>
                        {ratingType === 'internal' && 'Internal Rating'}
                        {ratingType === 'sp' && 'S&P Rating'}
                        {ratingType === 'moodys' && "Moody's Rating"}
                        {ratingType === 'fitch' && 'Fitch Rating'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only rating systems with actual values (non-N/A) are shown. 
                  This selection affects all risk calculations (PD, LGD, RWA, EVA, etc.).
                </p>
              </div>
            )}
            
            {portfolios.length === 0 && (
              <div className="text-center py-4">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No portfolios found. Please create a portfolio first.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Exposure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(portfolioMetrics.totalExposure)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <span>Drawn: {((portfolioMetrics.totalDrawn / portfolioMetrics.totalExposure) * 100).toFixed(1)}%</span>
              <span className="text-muted-foreground mx-1">|</span>
              <span>Undrawn: {((portfolioMetrics.totalUndrawn / portfolioMetrics.totalExposure) * 100).toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Expected Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(portfolioMetrics.totalExpectedLoss)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <span>Average PD: {(portfolioMetrics.weightedAveragePD * 100).toFixed(2)}%</span>
              <span className="text-muted-foreground mx-1">|</span>
              <span>Average LGD: {(portfolioMetrics.weightedAverageLGD * 100).toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total RWA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(portfolioMetrics.totalRWA)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <span>RWA Density: {((portfolioMetrics.totalRWA / portfolioMetrics.totalExposure) * 100).toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">
              Portfolio EVA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(portfolioMetrics.evaSumIntrinsic)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <span>ROE: {(portfolioMetrics.portfolioROE * 100).toFixed(2)}%</span>
              <span className="text-muted-foreground mx-1">|</span>
              <span>RAROC: {(portfolioMetrics.portfolioRAROC * 100).toFixed(2)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="loans-list">Loans List</TabsTrigger>
          <TabsTrigger value="risk-analysis">Risk Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Economic Value Added (EVA) Analysis</CardTitle>
                <CardDescription>All loans ranked by EVA performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={loanEvaData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          'EVA'
                        ]} 
                      />
                      <Legend />
                      <Bar dataKey="evaIntrinsic" fill="#00C48C" name="Intrinsic EVA" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/analytics/eva">
                    View Full EVA Analysis
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>ROE vs Risk Analysis</CardTitle>
                <CardDescription>Relationship between profitability (ROE) and risk (EL/Outstanding)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid />
                      <XAxis 
                        type="number" 
                        dataKey="x" 
                        name="Risk (EL/Outstanding)" 
                        unit="%" 
                        domain={[0, 'dataMax']}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="y" 
                        name="ROE" 
                        unit="%" 
                        domain={[0, 'dataMax']}
                      />
                      <ZAxis 
                        type="number" 
                        dataKey="z" 
                        range={[60, 400]} 
                        name="Outstanding" 
                        unit={`M${currentCurrency}`} 
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value: number, name: string) => [
                          `${value.toFixed(2)}${name.includes('%') ? '%' : name.includes(`M${currentCurrency}`) ? `M${currentCurrency}` : ''}`,
                          name
                        ]}
                      />
                      <Legend />
                      {roeVsRiskData.reduce((acc, loan) => {
                        const sector = loan.sector;
                        if (!acc.includes(sector)) {
                          acc.push(sector);
                        }
                        return acc;
                      }, [] as string[]).map((sector, index) => (
                        <Scatter 
                          key={sector}
                          name={sector} 
                          data={roeVsRiskData.filter(loan => loan.sector === sector)} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="loans-list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Loans</CardTitle>
              <CardDescription>
                Detailed list of all loans in the portfolio with their key metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loans.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No loans in the portfolio</p>
                  <Button onClick={handleNewLoan}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Loan
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                        <TableHead>Loan Name</TableHead>
                    <TableHead>Client</TableHead>
                        <TableHead>Sector</TableHead>
                        <TableHead className="text-right">Outstanding</TableHead>
                        <TableHead className="text-right">PD</TableHead>
                        <TableHead className="text-right">LGD</TableHead>
                        <TableHead className="text-right">Expected Loss</TableHead>
                    <TableHead className="text-right">ROE</TableHead>
                        <TableHead className="text-right">EVA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                      {loans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-medium">
                            <Link to={`/loans/${loan.id}`} className="hover:underline">
                          {loan.name}
                        </Link>
                      </TableCell>
                      <TableCell>{loan.clientName}</TableCell>
                      <TableCell>
                            <Badge variant="outline">{loan.sector}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(loan.outstandingAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                            {(loan.pd * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                            {(loan.lgd * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell className="text-right">
                            {formatCurrency(loan.metrics?.expectedLoss || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                            <span className={`font-medium ${
                              (loan.metrics?.roe || 0) > defaultCalculationParameters.targetROE 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                          {((loan.metrics?.roe || 0) * 100).toFixed(2)}%
                            </span>
                      </TableCell>
                      <TableCell className="text-right">
                            <span className={`font-medium ${
                              (loan.metrics?.evaIntrinsic || 0) > 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {formatCurrency(loan.metrics?.evaIntrinsic || 0)}
                            </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="risk-analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Concentration</CardTitle>
                <CardDescription>Risk distribution by exposure size and rating</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Top 5 Exposures</span>
                    <span className="text-sm text-muted-foreground">
                      {((loans.slice(0, 5).reduce((sum, loan) => sum + loan.outstandingAmount, 0) / portfolioMetrics.totalExposure) * 100).toFixed(1)}% of portfolio
                    </span>
                  </div>
                  <div className="space-y-2">
                    {loans
                      .sort((a, b) => b.outstandingAmount - a.outstandingAmount)
                      .slice(0, 5)
                      .map((loan, index) => (
                        <div key={loan.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <p className="font-medium">{loan.name}</p>
                            <p className="text-sm text-muted-foreground">{loan.clientName}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(loan.outstandingAmount)}</p>
                            <p className="text-sm text-muted-foreground">
                              {((loan.outstandingAmount / portfolioMetrics.totalExposure) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
          <Card>
            <CardHeader>
                <CardTitle>Risk Metrics Summary</CardTitle>
                <CardDescription>Key portfolio risk indicators</CardDescription>
            </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded">
                      <p className="text-2xl font-bold">{(portfolioMetrics.weightedAveragePD * 100).toFixed(2)}%</p>
                      <p className="text-sm text-muted-foreground">Weighted Avg PD</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded">
                      <p className="text-2xl font-bold">{(portfolioMetrics.weightedAverageLGD * 100).toFixed(0)}%</p>
                      <p className="text-sm text-muted-foreground">Weighted Avg LGD</p>
                    </div>
              </div>
              
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Expected Loss Rate</span>
                      <span className="font-medium">
                        {((portfolioMetrics.totalExpectedLoss / portfolioMetrics.totalExposure) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>RWA Density</span>
                      <span className="font-medium">
                        {((portfolioMetrics.totalRWA / portfolioMetrics.totalExposure) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Number of Loans</span>
                      <span className="font-medium">{loans.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Loan Size</span>
                      <span className="font-medium">
                        {loans.length > 0 ? formatCurrency(portfolioMetrics.totalExposure / loans.length) : formatCurrencyUtil(0, currentCurrency, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Portfolio;

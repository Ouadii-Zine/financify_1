import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
  ZAxis,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Briefcase, 
  Target,
  Calculator,
  BarChart3,
  PieChart,
  Download,
  Plus,
  Info
} from 'lucide-react';
import { defaultCalculationParameters } from '@/data/sampleData';
import { calculatePortfolioMetrics, calculateLoanMetrics } from '@/utils/financialCalculations';
import { Loan, PortfolioMetrics, PortfolioSummary } from '@/types/finance';
import LoanDataService, { LOANS_UPDATED_EVENT } from '@/services/LoanDataService';
import PortfolioService, { PORTFOLIOS_UPDATED_EVENT } from '@/services/PortfolioService';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const COLORS = ['#00C48C', '#2D5BFF', '#FFB800', '#FF3B5B', '#1A2C42', '#9B87F5', '#7E69AB'];

const AnalyticsEva = () => {
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
    
    window.addEventListener(PORTFOLIOS_UPDATED_EVENT, handlePortfoliosUpdated);
    window.addEventListener(LOANS_UPDATED_EVENT, handleLoansUpdated as EventListener);
    
    return () => {
      window.removeEventListener(PORTFOLIOS_UPDATED_EVENT, handlePortfoliosUpdated);
      window.removeEventListener(LOANS_UPDATED_EVENT, handleLoansUpdated as EventListener);
    };
  }, []);
  
  useEffect(() => {
    if (selectedPortfolioId) {
      loadLoansForPortfolio(selectedPortfolioId);
    }
  }, [selectedPortfolioId]);
  
  const loadLoansForPortfolio = (portfolioId: string) => {
    const portfolioLoans = loanDataService.getLoans(portfolioId);
    
    // Recalculate metrics for these loans
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

  // Format currency
  const formatCurrency = (value: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency, 
      maximumFractionDigits: 0 
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return (value * 100).toFixed(2) + '%';
  };

  // Calculate EVA breakdown metrics
  const evaBreakdown = {
    totalIncome: loans.reduce((sum, loan) => {
      const interest = (loan.margin + loan.referenceRate) * loan.originalAmount;
      const fees = loan.fees.upfront + loan.fees.commitment + loan.fees.agency + loan.fees.other;
      return sum + interest + fees;
    }, 0),
    totalCosts: loans.reduce((sum, loan) => {
      const fundingCost = defaultCalculationParameters.fundingCost * loan.originalAmount;
      const operationalCost = defaultCalculationParameters.operationalCostRatio * loan.originalAmount;
      const expectedLoss = loan.metrics?.expectedLoss || 0;
      return sum + fundingCost + operationalCost + expectedLoss;
    }, 0),
    totalCapital: loans.reduce((sum, loan) => loan.metrics?.capitalConsumption || 0, 0),
    costOfCapital: 0
  };
  
  evaBreakdown.costOfCapital = evaBreakdown.totalCapital * defaultCalculationParameters.targetROE;

  // Detailed loan analysis
  const loanAnalysis = loans.map(loan => ({
    id: loan.id,
    name: loan.name,
    clientName: loan.clientName,
    sector: loan.sector,
    originalAmount: loan.originalAmount,
    rating: loan.internalRating,
    pd: loan.pd,
    lgd: loan.lgd,
    rwa: loan.metrics?.rwa || 0,
    capitalRequired: loan.metrics?.capitalConsumption || 0,
    expectedLoss: loan.metrics?.expectedLoss || 0,
    roe: loan.metrics?.roe || 0,
    evaIntrinsic: loan.metrics?.evaIntrinsic || 0,
    raroc: loan.metrics?.raroc || 0,
    margin: loan.margin,
    referenceRate: loan.referenceRate,
    totalRate: loan.margin + loan.referenceRate,
    rwaIntensity: ((loan.metrics?.rwa || 0) / loan.originalAmount) * 100,
    capitalIntensity: ((loan.metrics?.capitalConsumption || 0) / loan.originalAmount) * 100,
    elIntensity: ((loan.metrics?.expectedLoss || 0) / loan.originalAmount) * 100
  })).sort((a, b) => b.evaIntrinsic - a.evaIntrinsic);

  // Performance buckets
  const performanceBuckets = {
    highPerformer: loanAnalysis.filter(loan => loan.evaIntrinsic > 100000),
    mediumPerformer: loanAnalysis.filter(loan => loan.evaIntrinsic >= 0 && loan.evaIntrinsic <= 100000),
    underPerformer: loanAnalysis.filter(loan => loan.evaIntrinsic < 0)
  };

  // Sector analysis
  const sectorAnalysis = loans.reduce((acc, loan) => {
    const sector = loan.sector;
    if (!acc[sector]) {
      acc[sector] = {
        name: sector,
        count: 0,
        totalExposure: 0,
        totalEva: 0,
        totalRWA: 0,
        avgPD: 0,
        avgLGD: 0,
        avgROE: 0
      };
    }
    
    acc[sector].count += 1;
    acc[sector].totalExposure += loan.originalAmount;
    acc[sector].totalEva += loan.metrics?.evaIntrinsic || 0;
    acc[sector].totalRWA += loan.metrics?.rwa || 0;
    acc[sector].avgPD += loan.pd;
    acc[sector].avgLGD += loan.lgd;
    acc[sector].avgROE += loan.metrics?.roe || 0;
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate averages for sectors
  Object.values(sectorAnalysis).forEach((sector: any) => {
    sector.avgPD = sector.avgPD / sector.count;
    sector.avgLGD = sector.avgLGD / sector.count;
    sector.avgROE = sector.avgROE / sector.count;
    sector.evaPerExposure = sector.totalEva / sector.totalExposure;
    sector.rwaIntensity = (sector.totalRWA / sector.totalExposure) * 100;
  });

  const sectorData = Object.values(sectorAnalysis);

  // Risk-Return analysis data
  const riskReturnData = loanAnalysis.map(loan => ({
    name: loan.name,
    x: loan.elIntensity, // Risk (EL/Exposure)
    y: (loan.roe * 100), // Return (ROE)
    z: loan.originalAmount / 1000000, // Size (bubble)
    eva: loan.evaIntrinsic,
    sector: loan.sector,
    rating: loan.rating
  }));

  // Portfolio composition by rating
  const ratingComposition = loans.reduce((acc, loan) => {
    const rating = loan.internalRating;
    if (!acc[rating]) {
      acc[rating] = {
        rating,
        count: 0,
        exposure: 0,
        eva: 0
      };
    }
    acc[rating].count += 1;
    acc[rating].exposure += loan.originalAmount;
    acc[rating].eva += loan.metrics?.evaIntrinsic || 0;
    return acc;
  }, {} as Record<string, any>);

  const ratingData = Object.values(ratingComposition);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
      <h1 className="text-2xl font-bold">EVA Analytics</h1>
          <Badge variant="outline" className="text-sm">
            Economic Value Added Analysis
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/portfolio')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Portfolio View
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Analysis
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
            Choose a portfolio to analyze its EVA performance
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
            
            {portfolios.length === 0 && (
              <div className="text-center py-4">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No portfolios found. Please create a portfolio first.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {loans.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Loans to Analyze</h3>
              <p className="text-muted-foreground mb-4">
                This portfolio doesn't contain any loans yet.
              </p>
              <Button onClick={() => navigate('/loans/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Loan
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* EVA Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Total EVA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${portfolioMetrics.evaSumIntrinsic >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(portfolioMetrics.evaSumIntrinsic)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Intrinsic value creation
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  EVA per Loan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(portfolioMetrics.evaSumIntrinsic / loans.length)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Average per facility
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Portfolio ROE
                </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
                  {formatPercent(portfolioMetrics.portfolioROE)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Return on equity
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  RAROC
                </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
                  {formatPercent(portfolioMetrics.portfolioRAROC)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Risk-adjusted return
            </div>
          </CardContent>
        </Card>
      </div>
      


          {/* Detailed Analysis Tabs */}
          <Tabs defaultValue="loan-details">
        <TabsList>
              <TabsTrigger value="loan-details">Loan Details</TabsTrigger>
              <TabsTrigger value="sector-analysis">Sector Analysis</TabsTrigger>
              <TabsTrigger value="risk-return">Risk-Return</TabsTrigger>
              <TabsTrigger value="rating-composition">Rating Composition</TabsTrigger>
              <TabsTrigger value="eva-breakdown">EVA Breakdown</TabsTrigger>
        </TabsList>
        
            {/* Loan Details Tab */}
            <TabsContent value="loan-details">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Loan Analysis</CardTitle>
                  <CardDescription>
                    Complete EVA breakdown for all loans in the portfolio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Loan Name</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Sector</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead className="text-right">Exposure</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">PD</TableHead>
                          <TableHead className="text-right">LGD</TableHead>
                          <TableHead className="text-right">RWA</TableHead>
                          <TableHead className="text-right">Capital</TableHead>
                          <TableHead className="text-right">ROE</TableHead>
                          <TableHead className="text-right">EVA</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loanAnalysis.map((loan) => (
                          <TableRow key={loan.id}>
                            <TableCell className="font-medium">{loan.name}</TableCell>
                            <TableCell>{loan.clientName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{loan.sector}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{loan.rating}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(loan.originalAmount)}</TableCell>
                            <TableCell className="text-right">{formatPercent(loan.totalRate)}</TableCell>
                            <TableCell className="text-right">{formatPercent(loan.pd)}</TableCell>
                            <TableCell className="text-right">{formatPercent(loan.lgd)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(loan.rwa)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(loan.capitalRequired)}</TableCell>
                            <TableCell className="text-right">
                              <span className={`font-medium ${loan.roe >= defaultCalculationParameters.targetROE ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercent(loan.roe)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`font-medium ${loan.evaIntrinsic >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(loan.evaIntrinsic)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sector Analysis Tab */}
            <TabsContent value="sector-analysis">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
                    <CardTitle>EVA by Sector</CardTitle>
                    <CardDescription>Sector contribution to portfolio EVA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sectorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                          <Bar dataKey="totalEva" fill="#00C48C" name="Total EVA" />
                  </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Sector Metrics</CardTitle>
                    <CardDescription>Risk and return metrics by sector</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sector</TableHead>
                            <TableHead className="text-right">Loans</TableHead>
                            <TableHead className="text-right">Exposure</TableHead>
                            <TableHead className="text-right">Total EVA</TableHead>
                            <TableHead className="text-right">Avg ROE</TableHead>
                            <TableHead className="text-right">Avg PD</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sectorData.map((sector: any) => (
                            <TableRow key={sector.name}>
                              <TableCell className="font-medium">{sector.name}</TableCell>
                              <TableCell className="text-right">{sector.count}</TableCell>
                              <TableCell className="text-right">{formatCurrency(sector.totalExposure)}</TableCell>
                              <TableCell className="text-right">
                                <span className={`font-medium ${sector.totalEva >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(sector.totalEva)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">{formatPercent(sector.avgROE)}</TableCell>
                              <TableCell className="text-right">{formatPercent(sector.avgPD)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Risk-Return Tab */}
            <TabsContent value="risk-return">
              <Card>
                <CardHeader>
                  <CardTitle>Risk-Return Analysis</CardTitle>
                  <CardDescription>
                    Portfolio positioning: Expected Loss vs ROE (bubble size = exposure)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid />
                        <XAxis 
                          type="number" 
                          dataKey="x" 
                          name="Risk (EL/Exposure)" 
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
                          name="Exposure" 
                          unit="M€" 
                        />
                        <Tooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          formatter={(value: number, name: string) => [
                            name === 'eva' ? formatCurrency(value) : `${value.toFixed(2)}%`,
                            name === 'eva' ? 'EVA' : name === 'x' ? 'Risk (EL/Exposure)' : 'ROE'
                          ]}
                          labelFormatter={(label) => `Loan: ${label}`}
                        />
                        <Legend />
                        {sectorData.map((sector: any, index) => (
                          <Scatter 
                            key={sector.name}
                            name={sector.name} 
                            data={riskReturnData.filter(loan => loan.sector === sector.name)} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
            {/* Rating Composition Tab */}
            <TabsContent value="rating-composition">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
                    <CardTitle>Portfolio by Rating</CardTitle>
                    <CardDescription>Exposure distribution across credit ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ratingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="rating" />
                    <YAxis />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                          <Bar dataKey="exposure" fill="#2D5BFF" name="Exposure" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        
          <Card>
            <CardHeader>
                    <CardTitle>EVA by Rating</CardTitle>
                    <CardDescription>Value creation across rating buckets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ratingData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="rating" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                          <Bar dataKey="eva" fill="#00C48C" name="EVA" />
                        </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
              </div>
            </TabsContent>

            {/* EVA Breakdown Tab */}
            <TabsContent value="eva-breakdown">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>EVA Components</CardTitle>
                    <CardDescription>Breakdown of value creation drivers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                        <span className="font-medium">Total Income</span>
                        <span className="font-bold text-green-600">{formatCurrency(evaBreakdown.totalIncome)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                        <span className="font-medium">Total Costs</span>
                        <span className="font-bold text-red-600">-{formatCurrency(evaBreakdown.totalCosts)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                        <span className="font-medium">Cost of Capital</span>
                        <span className="font-bold text-red-600">-{formatCurrency(evaBreakdown.costOfCapital)}</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                          <span className="font-bold">Net EVA</span>
                          <span className={`font-bold text-xl ${portfolioMetrics.evaSumIntrinsic >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(portfolioMetrics.evaSumIntrinsic)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Capital Efficiency</CardTitle>
                    <CardDescription>Capital allocation and efficiency metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Total Exposure</span>
                        <span className="font-medium">{formatCurrency(portfolioMetrics.totalExposure)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Total RWA</span>
                        <span className="font-medium">{formatCurrency(portfolioMetrics.totalRWA)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Total Capital Required</span>
                        <span className="font-medium">{formatCurrency(evaBreakdown.totalCapital)}</span>
                      </div>
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span>RWA Density</span>
                          <span className="font-medium">{((portfolioMetrics.totalRWA / portfolioMetrics.totalExposure) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Capital Ratio</span>
                          <span className="font-medium">{formatPercent(defaultCalculationParameters.capitalRatio)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>EVA per Capital</span>
                          <span className="font-medium">{formatPercent(portfolioMetrics.evaSumIntrinsic / evaBreakdown.totalCapital)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  );
};

export default AnalyticsEva;

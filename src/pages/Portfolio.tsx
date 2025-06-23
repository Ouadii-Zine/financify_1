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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { defaultCalculationParameters } from '@/data/sampleData';
import { calculatePortfolioMetrics, calculateLoanMetrics } from '@/utils/financialCalculations';
import { Loan, PortfolioMetrics, Portfolio as PortfolioType } from '@/types/finance';
import { 
  TrendingUp, 
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

// Colors for charts
const COLORS = ['#00C48C', '#2D5BFF', '#FFB800', '#FF3B5B', '#1A2C42', '#9B87F5', '#7E69AB'];

const Portfolio = () => {
  const navigate = useNavigate();
  const loanDataService = LoanDataService.getInstance();
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
    // Load data from localStorage
    loanDataService.loadFromLocalStorage();
    
    // Get loans
    const userLoans = loanDataService.getLoans();
    
    // Update state with user loans
    setLoans(userLoans);
    
    // Calculate portfolio metrics
    setPortfolioMetrics(calculatePortfolioMetrics(userLoans, defaultCalculationParameters));
    
    // Add listener for loan updates
    const handleLoansUpdated = (event: CustomEvent) => {
      setLoans(event.detail);
      setPortfolioMetrics(calculatePortfolioMetrics(event.detail, defaultCalculationParameters));
    };
    
    window.addEventListener(LOANS_UPDATED_EVENT, handleLoansUpdated as EventListener);
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener(LOANS_UPDATED_EVENT, handleLoansUpdated as EventListener);
    };
  }, []);
  
  // EVA distribution by sector
  const evaBySector = loans.reduce((acc, loan) => {
    const existingItem = acc.find(item => item.name === loan.sector);
    if (existingItem) {
      existingItem.value += loan.metrics?.evaIntrinsic || 0;
      existingItem.count += 1;
    } else {
      acc.push({
        name: loan.sector,
        value: loan.metrics?.evaIntrinsic || 0,
        count: 1
      });
    }
    return acc;
  }, [] as { name: string; value: number; count: number }[]);
  
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
  
  // Formatter to display amounts in euros
  const formatCurrency = (value: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency, 
      maximumFractionDigits: 0 
    }).format(value);
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
        loans: loans,
        metrics: portfolioMetrics
      };
      
      // Use export service
      ExcelTemplateService.exportData(portfolio, 'Performance', 'excel');
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
        <h1 className="text-2xl font-bold">Loan Portfolio</h1>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="default" size="sm" onClick={handleNewLoan}>
            <Plus className="h-4 w-4 mr-2" />
            New Loan
          </Button>
        </div>
      </div>
      
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Economic Value Added (EVA) Analysis</CardTitle>
                <CardDescription>Top 10 loans by EVA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={loanEvaData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === 'evaIntrinsic' ? 'EVA' : 'ROE (%)'
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
                <CardTitle>Sectoral EVA Distribution</CardTitle>
                <CardDescription>EVA contribution by business sector</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={evaBySector}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => name.length > 10 ? `${name.substring(0, 10)}...: ${(percent * 100).toFixed(0)}%` : `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {evaBySector.map((entry, index) => (
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
            
            <Card className="lg:col-span-2">
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
                        unit="M€" 
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value: number, name: string) => [
                          `${value.toFixed(2)}${name.includes('%') ? '%' : name.includes('M€') ? 'M€' : ''}`,
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
                        {loans.length > 0 ? formatCurrency(portfolioMetrics.totalExposure / loans.length) : '€0'}
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

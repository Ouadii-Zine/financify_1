import React, { useState, useEffect, useCallback } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Portfolio, PortfolioSummary, Loan, ClientType, Currency } from '@/types/finance';
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
  Upload,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import ParameterService from '@/services/ParameterService';
import { calculatePortfolioMetrics } from '@/utils/financialCalculations';
import { formatCurrency as formatCurrencyUtil, convertCurrency, convertLoanAmountToDisplayCurrency } from '@/utils/currencyUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import ExcelTemplateService from '@/services/ExcelTemplateService';
import PortfolioService, { PORTFOLIOS_UPDATED_EVENT } from '@/services/PortfolioService';
import ClientTemplateService from '@/services/ClientTemplateService';

// Colors for charts
const COLORS = ['#00C48C', '#2D5BFF', '#FFB800', '#FF3B5B', '#1A2C42', '#9B87F5', '#7E69AB'];

const Portfolios = () => {
  const navigate = useNavigate();
  const portfolioService = PortfolioService.getInstance();
  const clientTemplateService = ClientTemplateService.getInstance();
  
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDescription, setNewPortfolioDescription] = useState('');
  const [newPortfolioClientType, setNewPortfolioClientType] = useState<ClientType>('banqueCommerciale');
  
  // Currency state management
  const [currentCurrency, setCurrentCurrency] = useState<Currency>('USD');
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number>(1.0);
  const [eurToUsdRate, setEurToUsdRate] = useState<number>(1.0968); // EUR to USD rate
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 1 });
  
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
  
  // Get available client types from the service
  const availableClientTypes = clientTemplateService.getClientTypes();

  useEffect(() => {
    loadPortfolios();
    
    // Set default client type to the first available one
    if (availableClientTypes.length > 0) {
      setNewPortfolioClientType(availableClientTypes[0].key as ClientType);
    }
    
    // Listen for portfolio updates
    const handlePortfoliosUpdated = () => {
      loadPortfolios();
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
    };
    
    window.addEventListener(PORTFOLIOS_UPDATED_EVENT, handlePortfoliosUpdated);
    window.addEventListener('parameters-updated', handleParametersUpdated);
    
    return () => {
      window.removeEventListener(PORTFOLIOS_UPDATED_EVENT, handlePortfoliosUpdated);
      window.removeEventListener('parameters-updated', handleParametersUpdated);
    };
  }, []);
  
  const loadPortfolios = useCallback(() => {
    const portfolioSummaries = portfolioService.getPortfolioSummaries();
    
    console.log('[PORTFOLIO LIST] Original portfolio summaries:', portfolioSummaries);
    
    // Convert portfolio summaries to display currency
    const convertedPortfolioSummaries = portfolioSummaries.map(summary => {
      const fullPortfolio = portfolioService.getPortfolioById(summary.id);
      if (!fullPortfolio) return summary;
      
      // Calculate metrics with currency conversion
      const loansWithConvertedMetrics = fullPortfolio.loans.map(loan => ({
        ...loan,
        originalAmount: convertLoanAmountToDisplayCurrency(
          loan.originalAmount, 
          loan.currency, 
          currentCurrency, 
          exchangeRates, 
          eurToUsdRate
        ),
        drawnAmount: convertLoanAmountToDisplayCurrency(
          loan.drawnAmount, 
          loan.currency, 
          currentCurrency, 
          exchangeRates, 
          eurToUsdRate
        ),
        outstandingAmount: convertLoanAmountToDisplayCurrency(
          loan.outstandingAmount, 
          loan.currency, 
          currentCurrency, 
          exchangeRates, 
          eurToUsdRate
        ),
        metrics: {
          ...loan.metrics,
          evaIntrinsic: convertLoanAmountToDisplayCurrency(
            loan.metrics?.evaIntrinsic || 0, 
            loan.currency, 
            currentCurrency, 
            exchangeRates, 
            eurToUsdRate
          ),
          expectedLoss: convertLoanAmountToDisplayCurrency(
            loan.metrics?.expectedLoss || 0, 
            loan.currency, 
            currentCurrency, 
            exchangeRates, 
            eurToUsdRate
          ),
          rwa: convertLoanAmountToDisplayCurrency(
            loan.metrics?.rwa || 0, 
            loan.currency, 
            currentCurrency, 
            exchangeRates, 
            eurToUsdRate
          )
        }
      }));
      
      const convertedMetrics = calculatePortfolioMetrics(loansWithConvertedMetrics, ParameterService.loadParameters());
      
      console.log('[PORTFOLIO LIST] Portfolio:', summary.name, 'Original EVA:', summary.metrics?.evaSumIntrinsic, 'Converted EVA:', convertedMetrics.evaSumIntrinsic);
      
      return {
        ...summary,
        totalExposure: convertedMetrics.totalExposure,
        metrics: convertedMetrics
      };
    });
    
    console.log('[PORTFOLIO LIST] Converted portfolio summaries:', convertedPortfolioSummaries);
    
    setPortfolios(convertedPortfolioSummaries);
    
    // Auto-select the first portfolio if none selected
    if (!selectedPortfolio && convertedPortfolioSummaries.length > 0) {
      const fullPortfolio = portfolioService.getPortfolioById(convertedPortfolioSummaries[0].id);
      if (fullPortfolio) {
        setSelectedPortfolio(fullPortfolio);
      }
    }
  }, [selectedPortfolio, currentCurrency, exchangeRates, eurToUsdRate]);
  
  const handlePortfolioSelect = useCallback((portfolioId: string) => {
    const portfolio = portfolioService.getPortfolioById(portfolioId);
    if (portfolio) {
      // Convert portfolio metrics to display currency
      const loansWithConvertedMetrics = portfolio.loans.map(loan => ({
        ...loan,
        originalAmount: convertLoanAmountToDisplayCurrency(
          loan.originalAmount, 
          loan.currency, 
          currentCurrency, 
          exchangeRates, 
          eurToUsdRate
        ),
        drawnAmount: convertLoanAmountToDisplayCurrency(
          loan.drawnAmount, 
          loan.currency, 
          currentCurrency, 
          exchangeRates, 
          eurToUsdRate
        ),
        outstandingAmount: convertLoanAmountToDisplayCurrency(
          loan.outstandingAmount, 
          loan.currency, 
          currentCurrency, 
          exchangeRates, 
          eurToUsdRate
        ),
        metrics: {
          ...loan.metrics,
          evaIntrinsic: convertLoanAmountToDisplayCurrency(
            loan.metrics?.evaIntrinsic || 0, 
            loan.currency, 
            currentCurrency, 
            exchangeRates, 
            eurToUsdRate
          ),
          expectedLoss: convertLoanAmountToDisplayCurrency(
            loan.metrics?.expectedLoss || 0, 
            loan.currency, 
            currentCurrency, 
            exchangeRates, 
            eurToUsdRate
          ),
          rwa: convertLoanAmountToDisplayCurrency(
            loan.metrics?.rwa || 0, 
            loan.currency, 
            currentCurrency, 
            exchangeRates, 
            eurToUsdRate
          )
        }
      }));
      
      const convertedMetrics = calculatePortfolioMetrics(loansWithConvertedMetrics, ParameterService.loadParameters());
      
      const convertedPortfolio = {
        ...portfolio,
        loans: loansWithConvertedMetrics,
        metrics: convertedMetrics
      };
      
      setSelectedPortfolio(convertedPortfolio);
    }
  }, [currentCurrency, exchangeRates, eurToUsdRate]);
  
  // Refresh selected portfolio when currency changes
  useEffect(() => {
    // Re-select the current portfolio to get updated currency conversion
    if (selectedPortfolio) {
      handlePortfolioSelect(selectedPortfolio.id);
    }
  }, [currentCurrency, currentExchangeRate, exchangeRates, handlePortfolioSelect]);
  
  const handleCreatePortfolio = () => {
    if (!newPortfolioName.trim()) {
      toast({
        title: "Error",
        description: "Portfolio name is required.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const newPortfolio = portfolioService.createPortfolio(
        newPortfolioName.trim(),
        newPortfolioDescription.trim() || undefined,
        newPortfolioClientType
      );
      
      setSelectedPortfolio(newPortfolio);
      setIsCreateDialogOpen(false);
      setNewPortfolioName('');
      setNewPortfolioDescription('');
      setNewPortfolioClientType('banqueCommerciale');
      
      toast({
        title: "Success",
        description: "Portfolio created successfully.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create portfolio.",
        variant: "destructive"
      });
    }
  };
  
  const handleDeletePortfolio = (portfolioId: string) => {
    const portfolio = portfolios.find(p => p.id === portfolioId);
    if (!portfolio) return;
    
    if (portfolio.isDefault) {
      toast({
        title: "Error",
        description: "Cannot delete the default portfolio.",
        variant: "destructive"
      });
      return;
    }
    
    if (portfolioService.deletePortfolio(portfolioId)) {
      if (selectedPortfolio?.id === portfolioId) {
        const remaining = portfolios.filter(p => p.id !== portfolioId);
        if (remaining.length > 0) {
          handlePortfolioSelect(remaining[0].id);
        } else {
          setSelectedPortfolio(null);
        }
      }
      
      const loanCount = portfolio.loanCount;
      const successMessage = loanCount > 0 
        ? `Portfolio deleted successfully. ${loanCount} loan${loanCount > 1 ? 's' : ''} ${loanCount > 1 ? 'were' : 'was'} also removed.`
        : "Portfolio deleted successfully.";
      
      toast({
        title: "Success",
        description: successMessage,
        variant: "default"
      });
    }
  };
  
  // Format currency with dynamic conversion (assumes EUR)
  const formatCurrency = useCallback((value: number) => {
    // Convert from EUR to selected currency if needed
    const convertedValue = convertLoanAmountToDisplayCurrency(value, 'EUR', currentCurrency, exchangeRates, eurToUsdRate);
    return formatCurrencyUtil(convertedValue, currentCurrency, { maximumFractionDigits: 0 });
  }, [currentCurrency, exchangeRates, eurToUsdRate]);
  
  // Format loan amount with proper currency conversion
  const formatLoanAmount = useCallback((amount: number, loanCurrency: Currency) => {
    const convertedValue = convertLoanAmountToDisplayCurrency(amount, loanCurrency, currentCurrency, exchangeRates, eurToUsdRate);
    return formatCurrencyUtil(convertedValue, currentCurrency, { maximumFractionDigits: 0 });
  }, [currentCurrency, exchangeRates, eurToUsdRate]);
  
  // Get client type label
  const getClientTypeLabel = (clientType?: ClientType) => {
    const labels = {
      banqueCommerciale: 'Commercial Bank',
      banqueInvestissement: 'Investment Bank',
      assurance: 'Insurance',
      fonds: 'Fund',
      entreprise: 'Corporate'
    };
    return clientType ? labels[clientType] : 'Not specified';
  };
  
  // Event handlers
  const handleImport = () => {
    navigate('/import');
  };
  
  const handleNewLoan = () => {
    navigate('/loans/new');
  };
  
  const handleExport = () => {
    if (!selectedPortfolio) return;
    
    toast({
      title: "Export in progress",
      description: "The portfolio is being exported to Excel format...",
      variant: "default"
    });
    
    try {
      const result = ExcelTemplateService.generateReport('Performance', selectedPortfolio, 'csv');
      if (result.success && result.content && result.filename) {
        // Create and download the file
        const blob = new Blob([result.content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Portfolio exported successfully.",
          variant: "default"
        });
      } else {
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
  
  // Chart data for selected portfolio
  const getChartData = useCallback(() => {
    if (!selectedPortfolio) return { evaBySector: [], loanEvaData: [], roeVsRiskData: [] };
    
    const { loans } = selectedPortfolio;
    
    // EVA distribution by sector with currency conversion
    const evaBySector = loans.reduce((acc, loan) => {
      const existingItem = acc.find(item => item.name === loan.sector);
      const convertedEva = convertLoanAmountToDisplayCurrency(
        loan.metrics?.evaIntrinsic || 0, 
        loan.currency, 
        currentCurrency, 
        exchangeRates, 
        eurToUsdRate
      );
      if (existingItem) {
        existingItem.value += convertedEva;
        existingItem.count += 1;
      } else {
        acc.push({
          name: loan.sector,
          value: convertedEva,
          count: 1
        });
      }
      return acc;
    }, [] as { name: string; value: number; count: number }[]);
    
    // Data for EVA by loan chart with currency conversion
    const loanEvaData = loans.map(loan => ({
      name: loan.name,
      evaIntrinsic: convertLoanAmountToDisplayCurrency(
        loan.metrics?.evaIntrinsic || 0, 
        loan.currency, 
        currentCurrency, 
        exchangeRates, 
        eurToUsdRate
      ),
      roe: (loan.metrics?.roe || 0) * 100,
      outstandingAmount: convertLoanAmountToDisplayCurrency(
        loan.outstandingAmount, 
        loan.currency, 
        currentCurrency, 
        exchangeRates, 
        eurToUsdRate
      )
    })).sort((a, b) => b.evaIntrinsic - a.evaIntrinsic);
    
    // Data for ROE vs Risk chart with currency conversion
    const roeVsRiskData = loans.map(loan => {
      const convertedOutstandingAmount = convertLoanAmountToDisplayCurrency(
        loan.outstandingAmount, 
        loan.currency, 
        currentCurrency, 
        exchangeRates, 
        eurToUsdRate
      );
      const convertedExpectedLoss = convertLoanAmountToDisplayCurrency(
        loan.metrics?.expectedLoss || 0, 
        loan.currency, 
        currentCurrency, 
        exchangeRates, 
        eurToUsdRate
      );
      
      return {
        name: loan.name,
        x: convertedExpectedLoss / convertedOutstandingAmount * 100,
        y: (loan.metrics?.roe || 0) * 100,
        z: convertedOutstandingAmount / 1000000,
        sector: loan.sector
      };
    });
    
    return { evaBySector, loanEvaData, roeVsRiskData };
  }, [selectedPortfolio, currentCurrency, exchangeRates, eurToUsdRate]);
  
  // Calculate overview metrics from the selected portfolio's loans (already converted)
  const overviewMetrics = useCallback(() => {
    if (!selectedPortfolio || selectedPortfolio.loans.length === 0) {
      return {
        totalExposure: 0,
        totalDrawn: 0,
        totalUndrawn: 0,
        evaSumIntrinsic: 0,
        totalExpectedLoss: 0,
        portfolioROE: 0,
        weightedAveragePD: 0
      };
    }
    
    const loans = selectedPortfolio.loans; // These are already converted to display currency
    
    // Debug: Log the loan amounts to see if they're actually converted
    console.log('[OVERVIEW] Loans in selectedPortfolio:', loans.map(loan => ({
      name: loan.name,
      originalAmount: loan.originalAmount,
      currency: loan.currency
    })));
    
    const totalExposure = loans.reduce((sum, loan) => sum + loan.originalAmount, 0);
    const totalDrawn = loans.reduce((sum, loan) => sum + loan.drawnAmount, 0);
    const totalUndrawn = loans.reduce((sum, loan) => sum + loan.undrawnAmount, 0);
    const evaSumIntrinsic = loans.reduce((sum, loan) => sum + (loan.metrics?.evaIntrinsic || 0), 0);
    const totalExpectedLoss = loans.reduce((sum, loan) => sum + (loan.metrics?.expectedLoss || 0), 0);
    
    // Calculate weighted average PD
    const weightedAveragePD = totalExposure > 0 
      ? loans.reduce((sum, loan) => sum + (loan.pd * loan.originalAmount), 0) / totalExposure 
      : 0;
    
    // Calculate portfolio ROE (simplified - you might want to use the actual calculation)
    const totalCapital = loans.reduce((sum, loan) => sum + (loan.metrics?.capitalConsumption || 0), 0);
    const portfolioROE = totalCapital > 0 ? (evaSumIntrinsic / totalCapital) + 0.104 : 0.104; // Assuming 10.4% base
    
    const result = {
      totalExposure,
      totalDrawn,
      totalUndrawn,
      evaSumIntrinsic,
      totalExpectedLoss,
      portfolioROE,
      weightedAveragePD
    };
    
    // Debug: Log the calculated metrics
    console.log('[OVERVIEW] Calculated metrics:', result);
    
    return result;
  }, [selectedPortfolio]);
  
  const { evaBySector, loanEvaData, roeVsRiskData } = getChartData();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Portfolios Management</h1>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!selectedPortfolio}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Portfolio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Portfolio</DialogTitle>
                <DialogDescription>
                  Create a new portfolio to organize your loans by client type or strategy.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Portfolio Name</Label>
                  <Input
                    id="name"
                    value={newPortfolioName}
                    onChange={(e) => setNewPortfolioName(e.target.value)}
                    placeholder="Enter portfolio name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={newPortfolioDescription}
                    onChange={(e) => setNewPortfolioDescription(e.target.value)}
                    placeholder="Enter portfolio description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="clientType">Client Type</Label>
                  <Select value={newPortfolioClientType} onValueChange={(value: ClientType) => setNewPortfolioClientType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {clientTemplateService.getClientTypes().map(type => (
                        <SelectItem key={type.key} value={type.key}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePortfolio}>
                  Create Portfolio
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button size="sm" onClick={handleNewLoan}>
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
            Select Portfolio
          </CardTitle>
          <CardDescription>
            Choose a portfolio to view its details and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Active Portfolio</Label>
              <Select 
                value={selectedPortfolio?.id || ''} 
                onValueChange={handlePortfolioSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a portfolio" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map(portfolio => (
                    <SelectItem key={portfolio.id} value={portfolio.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{portfolio.name}</span>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge variant="secondary">
                            {portfolio.loanCount} loans
                          </Badge>
                          {portfolio.isDefault && (
                            <Badge variant="outline">Default</Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Portfolio List */}
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Client Type</TableHead>
                    <TableHead>Loans</TableHead>
                    <TableHead>Total Exposure</TableHead>
                    <TableHead>EVA</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolios.map(portfolio => (
                    <TableRow key={portfolio.id} className={selectedPortfolio?.id === portfolio.id ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{portfolio.name}</div>
                          {portfolio.description && (
                            <div className="text-sm text-muted-foreground">{portfolio.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getClientTypeLabel(portfolio.clientType)}
                        </Badge>
                      </TableCell>
                      <TableCell>{portfolio.loanCount}</TableCell>
                      <TableCell>
                        {(() => {
                          console.log('[PORTFOLIO TABLE] Portfolio:', portfolio.name, 'totalExposure:', portfolio.totalExposure, 'currency:', currentCurrency);
                          return formatCurrencyUtil(portfolio.totalExposure, currentCurrency, { maximumFractionDigits: 0 });
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          console.log('[PORTFOLIO TABLE] Portfolio:', portfolio.name, 'EVA:', portfolio.metrics.evaSumIntrinsic, 'currency:', currentCurrency);
                          return (
                            <span className={portfolio.metrics.evaSumIntrinsic >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrencyUtil(portfolio.metrics.evaSumIntrinsic, currentCurrency, { maximumFractionDigits: 0 })}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {new Date(portfolio.createdDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handlePortfolioSelect(portfolio.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {!portfolio.isDefault && (
                              <DropdownMenuItem 
                                onClick={() => handleDeletePortfolio(portfolio.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Portfolio Details */}
      {selectedPortfolio && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="loans">Loans</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Exposure</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrencyUtil(overviewMetrics().totalExposure, currentCurrency, { maximumFractionDigits: 0 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Drawn: {formatCurrencyUtil(overviewMetrics().totalDrawn, currentCurrency, { maximumFractionDigits: 0 })}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Portfolio EVA</CardTitle>
                  {overviewMetrics().evaSumIntrinsic >= 0 ? 
                    <TrendingUp className="h-4 w-4 text-green-600" /> : 
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  }
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${overviewMetrics().evaSumIntrinsic >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrencyUtil(overviewMetrics().evaSumIntrinsic, currentCurrency, { maximumFractionDigits: 0 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Intrinsic value
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Portfolio ROE</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(overviewMetrics().portfolioROE * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Return on Equity
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expected Loss</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrencyUtil(overviewMetrics().totalExpectedLoss, currentCurrency, { maximumFractionDigits: 0 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg PD: {(overviewMetrics().weightedAveragePD * 100).toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="loans">
            <Card>
              <CardHeader>
                <CardTitle>Loans in {selectedPortfolio.name}</CardTitle>
                <CardDescription>
                  {selectedPortfolio.loans.length} loans in this portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPortfolio.loans.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No loans yet</h3>
                    <p className="text-muted-foreground mb-4">
                      This portfolio doesn't contain any loans yet.
                    </p>
                    <Button onClick={handleNewLoan}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Loan
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loan Name</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>EVA</TableHead>
                        <TableHead>ROE</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPortfolio.loans.map(loan => (
                        <TableRow key={loan.id}>
                          <TableCell>
                            <Link to={`/loans/${loan.id}`} className="font-medium hover:underline">
                              {loan.name}
                            </Link>
                          </TableCell>
                          <TableCell>{loan.clientName}</TableCell>
                          <TableCell>{formatLoanAmount(loan.originalAmount, loan.currency)}</TableCell>
                          <TableCell>
                            <Badge variant={loan.status === 'active' ? 'default' : 'secondary'}>
                              {loan.status}
                            </Badge>
                          </TableCell>
                          <TableCell className={loan.metrics.evaIntrinsic >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {(() => {
                              console.log('[LOANS TABLE] Loan:', loan.name, 'EVA:', loan.metrics.evaIntrinsic, 'currency:', loan.currency);
                              return formatLoanAmount(loan.metrics.evaIntrinsic, loan.currency);
                            })()}
                          </TableCell>
                          <TableCell>
                            {(loan.metrics.roe * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <div className="grid gap-4">
              {selectedPortfolio.loans.length > 0 ? (
                <>
                  {/* EVA by Sector Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>EVA Distribution by Sector</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={evaBySector}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {evaBySector.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  {/* EVA by Loan Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>EVA by Loan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={loanEvaData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Bar dataKey="evaIntrinsic" fill="#00C48C" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No data to display</h3>
                    <p className="text-muted-foreground">
                      Add loans to this portfolio to see analytics.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Portfolios; 
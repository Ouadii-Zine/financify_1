import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  LineChart, 
  BarChart, 
  ResponsiveContainer, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from 'recharts';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  Download,
  CreditCard,
  Calendar,
  User,
  Building,
  MapPin,
  AlertTriangle,
  DollarSign,
  BarChart3,
  TrendingUp,
  Info,
} from 'lucide-react';
import { sampleLoans, defaultCalculationParameters } from '../data/sampleData';
import { Loan, CashFlow, Currency } from '../types/finance';
import { calculateLoanMetrics, getTotalInterestRate, getCurrentFundingIndexRate } from '../utils/financialCalculations';
import LoanDataService from '../services/LoanDataService';
import ClientTemplateService from '../services/ClientTemplateService';
import { toast } from '@/hooks/use-toast';
import YieldCurve from '../components/loan/YieldCurve';
import ParameterService from '@/services/ParameterService';
import { formatCurrency as formatCurrencyUtil, convertCurrency, convertBetweenCurrencies } from '@/utils/currencyUtils';
import CurrencyService from '@/services/CurrencyService';
import LoanCashflow from '@/components/loan/LoanCashflow';
import FundingIndexService from '@/services/FundingIndexService';

const LoanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Currency state management
  const [currentCurrency, setCurrentCurrency] = useState<Currency>('USD');
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number>(1.0);
  const [eurToUsdRate, setEurToUsdRate] = useState<number>(1.0968); // EUR to USD rate
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  
  // Check if we are in edit mode (via query parameter)
  const searchParams = new URLSearchParams(location.search);
  const isEditMode = searchParams.get('edit') === 'true';
  
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
    
    loadCurrencySettings();
    window.addEventListener('parameters-updated', handleParametersUpdated);
    
    return () => {
      window.removeEventListener('parameters-updated', handleParametersUpdated);
    };
  }, []);

  useEffect(() => {
    // Fetch live rates for currency conversion
    const fetchRates = async () => {
      const service = CurrencyService.getInstance();
      const rates = await service.fetchLiveRates();
      const ratesMap: Record<string, number> = {};
      rates.forEach(r => { ratesMap[r.currency] = r.rate; });
      setExchangeRates(ratesMap);
    };
    fetchRates();
  }, []);
  
  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const loanDataService = LoanDataService.getInstance();
    
    try {
      // Search for the loan in the service
      const foundLoan = loanDataService.getLoanById(id);
      
      if (foundLoan) {
        // Always recalculate metrics for up-to-date values using current parameters
        const currentParameters = ParameterService.loadParameters();
        const metrics = calculateLoanMetrics(foundLoan, currentParameters);
        setLoan({ ...foundLoan, metrics });
      } else {
        // If in edit mode and loan doesn't exist, redirect to list
        if (isEditMode) {
          toast({
            title: "Error",
            description: "The loan you want to edit does not exist.",
            variant: "destructive",
          });
          navigate('/loans');
        }
      }
    } catch (error) {
      console.error("Error loading loan:", error);
      toast({
        title: "Error",
        description: "Unable to load loan details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, isEditMode, navigate]);
  
  // Redirect to edit form if in edit mode
  useEffect(() => {
    if (isEditMode && loan) {
      // Store loan data in localStorage for edit form
      localStorage.setItem('loan-to-edit', JSON.stringify(loan));
              // Redirect to full edit page or display edit form
      navigate(`/loans/new?edit=true&id=${loan.id}`);
    }
  }, [isEditMode, loan, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Retrieving loan details</p>
        </div>
      </div>
    );
  }
  
  if (!loan) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loan not found</h2>
          <p className="text-muted-foreground mb-4">The loan you are looking for does not exist or has been deleted.</p>
          <Button onClick={() => navigate('/loans')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to list
          </Button>
        </div>
      </div>
    );
  }
  
  const parameters = ParameterService.loadParameters();
  const setupCurrency = parameters.currency || 'EUR';

  // Function to format and convert amounts to setup currency for display
  const formatAmountInSetupCurrency = (amount: number, loanCurrency: Currency) => {
    // If loan currency and setup currency are the same, no conversion needed
    if (loanCurrency === setupCurrency) {
      return formatCurrencyUtil(amount, setupCurrency, { maximumFractionDigits: 0 });
    }
    // Only convert if currencies are different
    const converted = convertBetweenCurrencies(amount, loanCurrency, setupCurrency, exchangeRates, eurToUsdRate);
    return formatCurrencyUtil(converted, setupCurrency, { maximumFractionDigits: 0 });
  };
  
  // Function to format percentages
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Function to format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };
  
  // Function to get badge color based on loan status
  const getLoanStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-financial-green text-white';
      case 'closed':
        return 'bg-financial-gray text-white';
      case 'default':
        return 'bg-financial-red text-white';
      case 'restructured':
        return 'bg-financial-yellow text-white';
      default:
        return 'bg-financial-blue text-white';
    }
  };
  
  // Function to get text color based on whether value is positive/negative
  const getValueColor = (value: number, threshold: number = 0) => {
    return value > threshold ? 'text-financial-green' : 'text-financial-red';
  };

  // Function to get template fields
  const getTemplateFields = () => {
    if (!loan?.clientType) {
      return {};
    }

    const templateService = ClientTemplateService.getInstance();
    const clientConfig = templateService.getClientConfiguration(loan.clientType);
    
    if (!clientConfig) {
      return {};
    }

    // Get all template field keys (required + optional, excluding calculated)
    const templateFieldKeys = [...clientConfig.requiredFields, ...clientConfig.optionalFields];
    const templateFields: Record<string, any> = {};

    // Map loan data to template field names
    const loanDataMapping: Record<string, any> = {
      applicationCode: loan.id,
      facilityId: loan.id,
      dealId: loan.id,
      dealName: loan.name,
      longNameBorrower: loan.clientName,
      currency: loan.currency,
      facilityDate: loan.startDate,
      maturity: loan.endDate,
      internalRating: loan.internalRating,
      loanMarginBps: loan.margin * 10000, // Convert to basis points
      facilityFeeBps: loan.fees.commitment * 10000,
      sector: loan.sector,
      zoneGeographique: loan.country,
      asofDate: new Date().toISOString().split('T')[0],
      rafBorrower: loan.clientName,
      ...loan.additionalDetails // Include any additional fields from import
    };

    // Get only template fields
    for (const [key, value] of Object.entries(loanDataMapping)) {
      if (value !== undefined && value !== null && value !== '' && templateFieldKeys.includes(key)) {
        templateFields[key] = value;
      }
    }

    return templateFields;
  };

  // Get template fields
  const templateFields = getTemplateFields();
  
  // Prepare data for EVA evolution chart
  const evaChartData = [
    { name: 'Base', eva: loan.metrics.evaIntrinsic },
    { name: '+1% PD', eva: loan.metrics.evaIntrinsic * 0.9 }, // Simplified simulation
    { name: '+1% Rate', eva: loan.metrics.evaIntrinsic * 0.85 }, // Simplified simulation
    { name: '+1% Spread', eva: loan.metrics.evaIntrinsic * 1.15 }, // Simplified simulation
    { name: '+5% LGD', eva: loan.metrics.evaIntrinsic * 0.88 }, // Simplified simulation
  ];
  
  // Injecter des cash flows fictifs si le prêt n'en a pas (pour démo front-end)
  let displayLoan = loan;
  if (loan && (!loan.cashFlows || loan.cashFlows.length === 0)) {
    displayLoan = {
      ...loan,
      cashFlows: [
        {
          id: 'demo-cf-1',
          date: '2023-01-15',
          type: 'drawdown',
          amount: 1000000,
          isManual: false,
          description: 'Initial drawdown'
        },
        {
          id: 'demo-cf-2',
          date: '2023-07-15',
          type: 'interest',
          amount: 25000,
          isManual: false,
          description: 'Interest payment'
        },
        {
          id: 'demo-cf-3',
          date: '2024-01-15',
          type: 'repayment',
          amount: 200000,
          isManual: true,
          description: 'Partial repayment'
        },
        {
          id: 'demo-cf-4',
          date: '2024-07-15',
          type: 'fee',
          amount: 5000,
          isManual: false,
          description: 'Annual fee'
        }
      ]
    };
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/loans')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{displayLoan.name}</h1>
          <Badge className={`capitalize ${getLoanStatusColor(displayLoan.status)}`}>
            {displayLoan.status}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            localStorage.setItem('loan-to-edit', JSON.stringify(displayLoan));
            navigate(`/loans/new?edit=true&id=${displayLoan.id}`);
          }}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      {/* Replace the summary cards container with a full-width responsive grid */}
      <div className="w-full px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
          {/* Card 1: Original Amount */}
          <Card className="financial-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-financial-blue" />
                Original Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmountInSetupCurrency(displayLoan.originalAmount, displayLoan.currency)}
                <span className="text-sm text-muted-foreground ml-2">
                  ({formatCurrencyUtil(displayLoan.originalAmount, displayLoan.currency, { maximumFractionDigits: 0 })})
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Drawn: {formatAmountInSetupCurrency(displayLoan.drawnAmount, displayLoan.currency)}
                <span className="text-sm text-muted-foreground ml-2">
                  ({formatCurrencyUtil(displayLoan.drawnAmount, displayLoan.currency, { maximumFractionDigits: 0 })})
                </span>
              </p>
            </CardContent>
          </Card>
          
          {/* Card 2: Period */}
          <Card className="financial-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-financial-yellow" />
                Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">
                {formatDate(displayLoan.startDate)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                until {formatDate(displayLoan.endDate)}
              </p>
            </CardContent>
          </Card>
          
          {/* Card 3: Risk */}
          <Card className="financial-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-financial-red" />
                Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">PD</div>
                  <div className="text-lg font-bold">{formatPercent(displayLoan.pd)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">LGD</div>
                  <div className="text-lg font-bold">{formatPercent(displayLoan.lgd)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                  <div className="text-lg font-bold">{displayLoan.internalRating}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Card 4: Performance */}
          <Card className="financial-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-financial-green" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">EVA</div>
                  <div className={`text-lg font-bold ${getValueColor(displayLoan.metrics.evaIntrinsic)}`}>
                    {formatAmountInSetupCurrency(displayLoan.metrics.evaIntrinsic, displayLoan.currency)}
                    <span className="text-sm text-muted-foreground ml-2">
                      ({formatCurrencyUtil(displayLoan.metrics.evaIntrinsic, displayLoan.currency, { maximumFractionDigits: 0 })})
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">ROE</div>
                  <div className={`text-lg font-bold ${getValueColor(displayLoan.metrics.roe, defaultCalculationParameters.targetROE)}`}>
                    {formatPercent(displayLoan.metrics.roe)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full flex">
          <TabsTrigger className="flex-1 text-center" value="overview">Overview</TabsTrigger>
          <TabsTrigger className="flex-1 text-center" value="details">Details</TabsTrigger>
          <TabsTrigger className="flex-1 text-center" value="cashflows-auto">Cash Flows</TabsTrigger>
          <TabsTrigger className="flex-1 text-center" value="yieldcurve">Yield Curve</TabsTrigger>
          <TabsTrigger className="flex-1 text-center" value="metrics">Metrics</TabsTrigger>
          <TabsTrigger className="flex-1 text-center" value="simulations">Simulations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="financial-card">
              <CardHeader>
                <CardTitle>General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <div className="flex items-center mt-1">
                      <User className="h-4 w-4 mr-2 text-financial-blue" />
                      <span className="font-medium">{displayLoan.clientName}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Sector</p>
                    <div className="flex items-center mt-1">
                      <Building className="h-4 w-4 mr-2 text-financial-blue" />
                      <span className="font-medium">{displayLoan.sector}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Country</p>
                    <div className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-2 text-financial-blue" />
                      <span className="font-medium">{displayLoan.country}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <div className="flex items-center mt-1">
                      <CreditCard className="h-4 w-4 mr-2 text-financial-blue" />
                      <span className="font-medium capitalize">{displayLoan.type}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Currency</p>
                    <div className="flex items-center mt-1">
                      <DollarSign className="h-4 w-4 mr-2 text-financial-blue" />
                      <span className="font-medium">{displayLoan.currency}</span>
                    </div>
                  </div>
                  
                  {displayLoan.fundingIndex && (() => {
                    const fundingIndexService = FundingIndexService.getInstance();
                    const indexData = fundingIndexService.getFundingIndexData(displayLoan.fundingIndex);
                    return (
                      <div>
                        <p className="text-sm text-muted-foreground">Funding Index</p>
                        <div className="flex items-center mt-1">
                          <TrendingUp className="h-4 w-4 mr-2 text-financial-blue" />
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{indexData?.name || displayLoan.fundingIndex}</span>
                            <Badge variant="secondary" className="text-xs">
                              {indexData?.currentValue.toFixed(2)}%
                            </Badge>
                          </div>
                        </div>
                        {indexData && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {indexData.description}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 mr-2 text-financial-blue" />
                      <span className="font-medium">{displayLoan.internalRating}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Exposure</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm">Original Amount</p>
                      <p className="text-lg font-semibold">{formatAmountInSetupCurrency(displayLoan.originalAmount, displayLoan.currency)}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ({formatCurrencyUtil(displayLoan.originalAmount, displayLoan.currency, { maximumFractionDigits: 0 })})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">Outstanding</p>
                      <p className="text-lg font-semibold">{formatAmountInSetupCurrency(displayLoan.outstandingAmount, displayLoan.currency)}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ({formatCurrencyUtil(displayLoan.outstandingAmount, displayLoan.currency, { maximumFractionDigits: 0 })})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">Drawn</p>
                      <p className="text-lg font-semibold">{formatAmountInSetupCurrency(displayLoan.drawnAmount, displayLoan.currency)}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ({formatCurrencyUtil(displayLoan.drawnAmount, displayLoan.currency, { maximumFractionDigits: 0 })})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">Undrawn</p>
                      <p className="text-lg font-semibold">{formatAmountInSetupCurrency(displayLoan.undrawnAmount, displayLoan.currency)}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ({formatCurrencyUtil(displayLoan.undrawnAmount, displayLoan.currency, { maximumFractionDigits: 0 })})
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="financial-card">
              <CardHeader>
                <CardTitle>EVA Scenario Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={evaChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatAmountInSetupCurrency(value, displayLoan.currency)} />
                      <Legend />
                      <Bar dataKey="eva" name="EVA" fill="#2D5BFF" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Intrinsic EVA</p>
                  <p className={`text-2xl font-bold ${getValueColor(displayLoan.metrics.evaIntrinsic)}`}>
                    {formatAmountInSetupCurrency(displayLoan.metrics.evaIntrinsic, displayLoan.currency)}
                    <span className="text-sm text-muted-foreground ml-2">
                      ({formatCurrencyUtil(displayLoan.metrics.evaIntrinsic, displayLoan.currency, { maximumFractionDigits: 0 })})
                    </span>
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Sale EVA</p>
                  <p className={`text-2xl font-bold ${getValueColor(displayLoan.metrics.evaSale)}`}>
                    {formatAmountInSetupCurrency(displayLoan.metrics.evaSale, displayLoan.currency)}
                    <span className="text-sm text-muted-foreground ml-2">
                      ({formatCurrencyUtil(displayLoan.metrics.evaSale, displayLoan.currency, { maximumFractionDigits: 0 })})
                    </span>
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Expected Loss</p>
                  <p className="text-2xl font-bold text-financial-red">
                    {formatAmountInSetupCurrency(displayLoan.metrics.expectedLoss, displayLoan.currency)}
                    <span className="text-sm text-muted-foreground ml-2">
                      ({formatCurrencyUtil(displayLoan.metrics.expectedLoss, displayLoan.currency, { maximumFractionDigits: 0 })})
                    </span>
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">RWA</p>
                  <p className="text-2xl font-bold">
                    {formatAmountInSetupCurrency(displayLoan.metrics.rwa, displayLoan.currency)}
                    <span className="text-sm text-muted-foreground ml-2">
                      ({formatCurrencyUtil(displayLoan.metrics.rwa, displayLoan.currency, { maximumFractionDigits: 0 })})
                    </span>
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">ROE</p>
                  <p className={`text-2xl font-bold ${getValueColor(displayLoan.metrics.roe, defaultCalculationParameters.targetROE)}`}>
                    {formatPercent(displayLoan.metrics.roe)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">RAROC</p>
                  <p className={`text-2xl font-bold ${getValueColor(displayLoan.metrics.raroc, defaultCalculationParameters.targetROE)}`}>
                    {formatPercent(displayLoan.metrics.raroc)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Capital Consumption</p>
                  <p className="text-2xl font-bold">
                    {formatAmountInSetupCurrency(displayLoan.metrics.capitalConsumption, displayLoan.currency)}
                    <span className="text-sm text-muted-foreground ml-2">
                      ({formatCurrencyUtil(displayLoan.metrics.capitalConsumption, displayLoan.currency, { maximumFractionDigits: 0 })})
                    </span>
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Net Margin</p>
                  <p className={`text-2xl font-bold ${getValueColor(displayLoan.metrics.netMargin)}`}>
                    {formatPercent(displayLoan.metrics.netMargin)}
                  </p>
                </div>
                {displayLoan.type === 'revolver' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Interest</p>
                    <p className="text-2xl font-bold">
                      {formatAmountInSetupCurrency(displayLoan.metrics.monthlyInterest || 0, displayLoan.currency)}
                      <span className="text-sm text-muted-foreground ml-2">
                        ({formatCurrencyUtil(displayLoan.metrics.monthlyInterest || 0, displayLoan.currency, { maximumFractionDigits: 0 })})
                      </span>
                    </p>
                  </div>
                )}
                {displayLoan.type === 'revolver' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Annual Commission</p>
                    <p className="text-2xl font-bold">
                      {formatAmountInSetupCurrency(displayLoan.metrics.annualCommission || 0, displayLoan.currency)}
                      <span className="text-sm text-muted-foreground ml-2">
                        ({formatCurrencyUtil(displayLoan.metrics.annualCommission || 0, displayLoan.currency, { maximumFractionDigits: 0 })})
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-6">
          <Card className="financial-card">
            <CardHeader>
              <CardTitle>
                Loan Details
                {displayLoan.clientType && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({displayLoan.clientType} Template Fields)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(templateFields).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(templateFields).map(([key, value]) => {
                                         // Get template field info for better labeling
                     const templateService = ClientTemplateService.getInstance();
                     const clientConfig = templateService.getClientConfiguration(displayLoan.clientType!);
                     const fieldInfo = templateService.getColumnDefinition(key);
                     const displayLabel = fieldInfo?.label || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
                    
                    // Format value based on field type
                    let displayValue = value;
                    
                    if (fieldInfo?.type === 'number' && typeof value === 'number') {
                      if (key.includes('amount') || key.includes('limit') || key.includes('outstanding') || key.includes('fee')) {
                        displayValue = formatAmountInSetupCurrency(value, displayLoan.currency);
                      } else if (key.includes('rate') || key.includes('margin') || key.includes('pd') || key.includes('lgd')) {
                        displayValue = formatPercent(value);
                      } else {
                        displayValue = value.toLocaleString();
                      }
                    } else if (fieldInfo?.type === 'date' && value) {
                      displayValue = formatDate(value);
                    } else if (value === null || value === undefined || value === '') {
                      displayValue = 'N/A';
                    }
                    
                    return (
                      <div key={key} className="space-y-2">
                        <span className="text-sm text-muted-foreground">{displayLabel}</span>
                        <div className="font-medium break-words">
                          {key === 'status' && value ? (
                            <Badge className={`capitalize ${getLoanStatusColor(value)}`}>
                              {value}
                            </Badge>
                          ) : (
                            displayValue
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No template fields available for this loan.
                    {!displayLoan.clientType && " Client type not specified."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          

        </TabsContent>
        
        <TabsContent value="cashflows-auto" className="space-y-6">
          <LoanCashflow />
        </TabsContent>
        
        <TabsContent value="yieldcurve" className="space-y-6">
          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Loan Yield Curve Analysis</CardTitle>
              <CardDescription>
                Comprehensive yield curve showing effective yield evolution over the loan's lifetime
              </CardDescription>
            </CardHeader>
            <CardContent>
              <YieldCurve loan={displayLoan} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="financial-card">
              <CardHeader>
                <CardTitle>Profitability Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Intrinsic EVA</p>
                      <p className={`text-2xl font-bold ${getValueColor(displayLoan.metrics.evaIntrinsic)}`}>
                        {formatAmountInSetupCurrency(displayLoan.metrics.evaIntrinsic, displayLoan.currency)}
                        <span className="text-sm text-muted-foreground ml-2">
                          ({formatCurrencyUtil(displayLoan.metrics.evaIntrinsic, displayLoan.currency, { maximumFractionDigits: 0 })})
                        </span>
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Sale EVA</p>
                      <p className={`text-2xl font-bold ${getValueColor(displayLoan.metrics.evaSale)}`}>
                        {formatAmountInSetupCurrency(displayLoan.metrics.evaSale, displayLoan.currency)}
                        <span className="text-sm text-muted-foreground ml-2">
                          ({formatCurrencyUtil(displayLoan.metrics.evaSale, displayLoan.currency, { maximumFractionDigits: 0 })})
                        </span>
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">ROE</p>
                      <p className={`text-2xl font-bold ${getValueColor(displayLoan.metrics.roe, defaultCalculationParameters.targetROE)}`}>
                        {formatPercent(displayLoan.metrics.roe)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        vs target: {formatPercent(defaultCalculationParameters.targetROE)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">RAROC</p>
                      <p className={`text-2xl font-bold ${getValueColor(displayLoan.metrics.raroc, defaultCalculationParameters.targetROE)}`}>
                        {formatPercent(displayLoan.metrics.raroc)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Net Margin</p>
                      <p className={`text-2xl font-bold ${getValueColor(displayLoan.metrics.netMargin)}`}>
                        {formatPercent(displayLoan.metrics.netMargin)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Effective Yield</p>
                      <p className="text-2xl font-bold">
                        {formatPercent(displayLoan.metrics.effectiveYield)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="financial-card">
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Expected Loss (EL)</p>
                      <p className="text-2xl font-bold text-financial-red">
                        {formatAmountInSetupCurrency(displayLoan.metrics.expectedLoss, displayLoan.currency)}
                        <span className="text-sm text-muted-foreground ml-2">
                          ({formatCurrencyUtil(displayLoan.metrics.expectedLoss, displayLoan.currency, { maximumFractionDigits: 0 })})
                        </span>
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Risk-Weighted Assets (RWA)</p>
                      <p className="text-2xl font-bold">
                        {formatAmountInSetupCurrency(displayLoan.metrics.rwa, displayLoan.currency)}
                        <span className="text-sm text-muted-foreground ml-2">
                          ({formatCurrencyUtil(displayLoan.metrics.rwa, displayLoan.currency, { maximumFractionDigits: 0 })})
                        </span>
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Capital Consumption</p>
                      <p className="text-2xl font-bold">
                        {formatAmountInSetupCurrency(displayLoan.metrics.capitalConsumption, displayLoan.currency)}
                        <span className="text-sm text-muted-foreground ml-2">
                          ({formatCurrencyUtil(displayLoan.metrics.capitalConsumption, displayLoan.currency, { maximumFractionDigits: 0 })})
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPercent(displayLoan.metrics.capitalConsumption / displayLoan.originalAmount)} of exposure
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Cost of Risk</p>
                      <p className="text-2xl font-bold text-financial-red">
                        {formatPercent(displayLoan.metrics.costOfRisk)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">PD</p>
                      <p className="text-2xl font-bold">
                        {formatPercent(displayLoan.pd)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Rating: {displayLoan.internalRating}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">LGD</p>
                      <p className="text-2xl font-bold">
                        {formatPercent(displayLoan.lgd)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Financial Parameters</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target ROE Rate</span>
                      <span className="font-medium">{formatPercent(defaultCalculationParameters.targetROE)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax Rate</span>
                      <span className="font-medium">{formatPercent(defaultCalculationParameters.corporateTaxRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capital Ratio</span>
                      <span className="font-medium">{formatPercent(defaultCalculationParameters.capitalRatio)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Costs</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Funding Cost</span>
                      <span className="font-medium">
                        {formatPercent(defaultCalculationParameters.fundingCost)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Operational Costs</span>
                      <span className="font-medium">
                        {formatPercent(defaultCalculationParameters.operationalCostRatio)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost of Risk</span>
                      <span className="font-medium">{formatPercent(displayLoan.metrics.costOfRisk)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Yield</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reference Rate</span>
                      <span className="font-medium">{formatPercent(displayLoan.referenceRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Funding Index Rate</span>
                      <span className="font-medium">{formatPercent(getCurrentFundingIndexRate(displayLoan))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margin</span>
                      <span className="font-medium">{formatPercent(displayLoan.margin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Operational Costs</span>
                      <span className="font-medium">{formatPercent(ParameterService.loadParameters().operationalCostRatio)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capital Costs (EVA)</span>
                      <span className="font-medium">{formatPercent((ParameterService.loadParameters().targetROE * ParameterService.loadParameters().capitalRatio))}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total Interest Rate</span>
                      <span>{formatPercent(getTotalInterestRate(displayLoan, ParameterService.loadParameters()))}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Total = {formatPercent(displayLoan.referenceRate)} + {formatPercent(getCurrentFundingIndexRate(displayLoan))} + {formatPercent(displayLoan.margin)} + {formatPercent(ParameterService.loadParameters().operationalCostRatio)} + {formatPercent(ParameterService.loadParameters().targetROE * ParameterService.loadParameters().capitalRatio)} = {formatPercent(getTotalInterestRate(displayLoan, ParameterService.loadParameters()))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="simulations" className="space-y-6">
          <Card className="financial-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Scenario Simulations</CardTitle>
              <Button size="sm">New Scenario</Button>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evaChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatAmountInSetupCurrency(value, displayLoan.currency)} />
                    <Legend />
                    <Bar dataKey="eva" name="EVA" fill="#2D5BFF" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Simulation Results</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scenario</TableHead>
                      <TableHead className="text-right">EVA</TableHead>
                      <TableHead className="text-right">Δ EVA</TableHead>
                      <TableHead className="text-right">ROE</TableHead>
                      <TableHead className="text-right">RWA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Base</TableCell>
                      <TableCell className="text-right">{formatAmountInSetupCurrency(displayLoan.metrics.evaIntrinsic, displayLoan.currency)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">{formatPercent(displayLoan.metrics.roe)}</TableCell>
                      <TableCell className="text-right">{formatAmountInSetupCurrency(displayLoan.metrics.rwa, displayLoan.currency)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">PD +1%</TableCell>
                      <TableCell className="text-right">{formatAmountInSetupCurrency(displayLoan.metrics.evaIntrinsic * 0.9, displayLoan.currency)}</TableCell>
                      <TableCell className="text-right text-financial-red">
                        {formatAmountInSetupCurrency(displayLoan.metrics.evaIntrinsic * 0.9 - displayLoan.metrics.evaIntrinsic, displayLoan.currency)}
                      </TableCell>
                      <TableCell className="text-right">{formatPercent(displayLoan.metrics.roe * 0.9)}</TableCell>
                      <TableCell className="text-right">{formatAmountInSetupCurrency(displayLoan.metrics.rwa * 1.1, displayLoan.currency)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Rate +1%</TableCell>
                      <TableCell className="text-right">{formatAmountInSetupCurrency(displayLoan.metrics.evaIntrinsic * 0.85, displayLoan.currency)}</TableCell>
                      <TableCell className="text-right text-financial-red">
                        {formatAmountInSetupCurrency(displayLoan.metrics.evaIntrinsic * 0.85 - displayLoan.metrics.evaIntrinsic, displayLoan.currency)}
                      </TableCell>
                      <TableCell className="text-right">{formatPercent(displayLoan.metrics.roe * 0.85)}</TableCell>
                      <TableCell className="text-right">{formatAmountInSetupCurrency(displayLoan.metrics.rwa, displayLoan.currency)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Spread +1%</TableCell>
                      <TableCell className="text-right">{formatAmountInSetupCurrency(displayLoan.metrics.evaIntrinsic * 1.15, displayLoan.currency)}</TableCell>
                      <TableCell className="text-right text-financial-green">
                        {formatAmountInSetupCurrency(displayLoan.metrics.evaIntrinsic * 1.15 - displayLoan.metrics.evaIntrinsic, displayLoan.currency)}
                      </TableCell>
                      <TableCell className="text-right">{formatPercent(displayLoan.metrics.roe * 1.15)}</TableCell>
                      <TableCell className="text-right">{formatAmountInSetupCurrency(displayLoan.metrics.rwa, displayLoan.currency)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">LGD +5%</TableCell>
                      <TableCell className="text-right">{formatAmountInSetupCurrency(displayLoan.metrics.evaIntrinsic * 0.88, displayLoan.currency)}</TableCell>
                      <TableCell className="text-right text-financial-red">
                        {formatAmountInSetupCurrency(displayLoan.metrics.evaIntrinsic * 0.88 - displayLoan.metrics.evaIntrinsic, displayLoan.currency)}
                      </TableCell>
                      <TableCell className="text-right">{formatPercent(displayLoan.metrics.roe * 0.88)}</TableCell>
                      <TableCell className="text-right">{formatAmountInSetupCurrency(displayLoan.metrics.rwa * 1.05, displayLoan.currency)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoanDetail;


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import { sampleLoans, defaultCalculationParameters } from '../data/sampleData';
import { Loan, CashFlow } from '../types/finance';
import { calculateLoanMetrics } from '../utils/financialCalculations';
import LoanDataService from '../services/LoanDataService';
import DynamicColumnsService from '../services/DynamicColumnsService';
import { toast } from '@/hooks/use-toast';

const LoanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Check if we are in edit mode (via query parameter)
  const searchParams = new URLSearchParams(location.search);
  const isEditMode = searchParams.get('edit') === 'true';
  
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
        // Calculate loan metrics if necessary
        const metrics = foundLoan.metrics || calculateLoanMetrics(foundLoan, defaultCalculationParameters);
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
  
  // Function to format amounts in euros
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(amount);
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
  
  // Prepare data for cash flows chart
  const cashFlowChartData = [...loan.cashFlows]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(cf => ({
      date: new Date(cf.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      amount: cf.type === 'drawdown' ? cf.amount : (cf.type === 'repayment' ? -cf.amount : 0),
      interest: cf.type === 'interest' ? cf.amount : 0,
      fee: cf.type === 'fee' ? cf.amount : 0,
      isManual: cf.isManual,
    }));
  
  // Prepare data for EVA evolution chart
  const evaChartData = [
    { name: 'Base', eva: loan.metrics.evaIntrinsic },
    { name: '+1% PD', eva: loan.metrics.evaIntrinsic * 0.9 }, // Simplified simulation
    { name: '+1% Rate', eva: loan.metrics.evaIntrinsic * 0.85 }, // Simplified simulation
    { name: '+1% Spread', eva: loan.metrics.evaIntrinsic * 1.15 }, // Simplified simulation
    { name: '+5% LGD', eva: loan.metrics.evaIntrinsic * 0.88 }, // Simplified simulation
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/loans')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{loan.name}</h1>
          <Badge className={`capitalize ${getLoanStatusColor(loan.status)}`}>
            {loan.status}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/loans/${loan.id}/edit`)}>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="financial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-financial-blue" />
              Original Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(loan.originalAmount)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Drawn: {formatCurrency(loan.drawnAmount)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="financial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-financial-yellow" />
              Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">
              {formatDate(loan.startDate)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              until {formatDate(loan.endDate)}
            </p>
          </CardContent>
        </Card>
        
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
                <div className="text-lg font-bold">{formatPercent(loan.pd)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">LGD</div>
                <div className="text-lg font-bold">{formatPercent(loan.lgd)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Rating</div>
                <div className="text-lg font-bold">{loan.internalRating}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
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
                <div className={`text-lg font-bold ${getValueColor(loan.metrics.evaIntrinsic)}`}>
                  {formatCurrency(loan.metrics.evaIntrinsic)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">ROE</div>
                <div className={`text-lg font-bold ${getValueColor(loan.metrics.roe, defaultCalculationParameters.targetROE)}`}>
                  {formatPercent(loan.metrics.roe)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-5">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="cashflows">Cash Flows</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="simulations">Simulations</TabsTrigger>
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
                      <span className="font-medium">{loan.clientName}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Sector</p>
                    <div className="flex items-center mt-1">
                      <Building className="h-4 w-4 mr-2 text-financial-blue" />
                      <span className="font-medium">{loan.sector}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Country</p>
                    <div className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-2 text-financial-blue" />
                      <span className="font-medium">{loan.country}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <div className="flex items-center mt-1">
                      <CreditCard className="h-4 w-4 mr-2 text-financial-blue" />
                      <span className="font-medium capitalize">{loan.type}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Currency</p>
                    <div className="flex items-center mt-1">
                      <DollarSign className="h-4 w-4 mr-2 text-financial-blue" />
                      <span className="font-medium">{loan.currency}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 mr-2 text-financial-blue" />
                      <span className="font-medium">{loan.internalRating}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Exposure</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm">Original Amount</p>
                      <p className="text-lg font-semibold">{formatCurrency(loan.originalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm">Outstanding</p>
                      <p className="text-lg font-semibold">{formatCurrency(loan.outstandingAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm">Drawn</p>
                      <p className="text-lg font-semibold">{formatCurrency(loan.drawnAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm">Undrawn</p>
                      <p className="text-lg font-semibold">{formatCurrency(loan.undrawnAmount)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="financial-card">
              <CardHeader>
                <CardTitle>Cash Flows Evolution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [
                          formatCurrency(value),
                          value > 0 ? 'Drawdown' : value < 0 ? 'Repayment' : 'Interest/Fees'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="amount" name="Drawdown/Repayment" fill={loan.metrics.evaIntrinsic > 0 ? "#00C48C" : "#FF3B5B"} />
                      <Bar dataKey="interest" name="Interest" fill="#FFB800" />
                      <Bar dataKey="fee" name="Fees" fill="#2D5BFF" />
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
                  <p className={`text-2xl font-bold ${getValueColor(loan.metrics.evaIntrinsic)}`}>
                    {formatCurrency(loan.metrics.evaIntrinsic)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Sale EVA</p>
                  <p className={`text-2xl font-bold ${getValueColor(loan.metrics.evaSale)}`}>
                    {formatCurrency(loan.metrics.evaSale)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Expected Loss</p>
                  <p className="text-2xl font-bold text-financial-red">
                    {formatCurrency(loan.metrics.expectedLoss)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">RWA</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(loan.metrics.rwa)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">ROE</p>
                  <p className={`text-2xl font-bold ${getValueColor(loan.metrics.roe, defaultCalculationParameters.targetROE)}`}>
                    {formatPercent(loan.metrics.roe)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">RAROC</p>
                  <p className={`text-2xl font-bold ${getValueColor(loan.metrics.raroc, defaultCalculationParameters.targetROE)}`}>
                    {formatPercent(loan.metrics.raroc)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Capital Consumption</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(loan.metrics.capitalConsumption)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Net Margin</p>
                  <p className={`text-2xl font-bold ${getValueColor(loan.metrics.netMargin)}`}>
                    {formatPercent(loan.metrics.netMargin)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-6">
          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Loan Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">General Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID</span>
                      <span className="font-medium">{loan.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{loan.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client</span>
                      <span className="font-medium">{loan.clientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium capitalize">{loan.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge className={`capitalize ${getLoanStatusColor(loan.status)}`}>
                        {loan.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date</span>
                      <span className="font-medium">{formatDate(loan.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date</span>
                      <span className="font-medium">{formatDate(loan.endDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Currency</span>
                      <span className="font-medium">{loan.currency}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Financial Parameters</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margin</span>
                      <span className="font-medium">{formatPercent(loan.margin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reference Rate</span>
                      <span className="font-medium">{formatPercent(loan.referenceRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Upfront Fees</span>
                      <span className="font-medium">{formatCurrency(loan.fees.upfront)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Commitment Fee</span>
                      <span className="font-medium">{formatPercent(loan.fees.commitment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Agency Fees</span>
                      <span className="font-medium">{formatCurrency(loan.fees.agency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Other Fees</span>
                      <span className="font-medium">{formatCurrency(loan.fees.other)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Exposure & Risk</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Original Amount</span>
                      <span className="font-medium">{formatCurrency(loan.originalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Outstanding</span>
                      <span className="font-medium">{formatCurrency(loan.outstandingAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Drawn Amount</span>
                      <span className="font-medium">{formatCurrency(loan.drawnAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Undrawn Amount</span>
                      <span className="font-medium">{formatCurrency(loan.undrawnAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">EAD</span>
                      <span className="font-medium">{formatCurrency(loan.ead)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Probability of Default (PD)</span>
                      <span className="font-medium">{formatPercent(loan.pd)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Loss Given Default (LGD)</span>
                      <span className="font-medium">{formatPercent(loan.lgd)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Internal Rating</span>
                      <span className="font-medium">{loan.internalRating}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sector</span>
                      <span className="font-medium">{loan.sector}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Country</span>
                      <span className="font-medium">{loan.country}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Additional Details Section */}
          {loan.additionalDetails && Object.keys(loan.additionalDetails).length > 0 && (
            <Card className="financial-card">
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(loan.additionalDetails).map(([key, value]) => {
                    // Get column info from DynamicColumnsService
                    const dynamicColumnsService = DynamicColumnsService.getInstance();
                    const columnInfo = dynamicColumnsService.getDynamicColumns().find(col => col.key === key);
                    const displayLabel = columnInfo?.label || key.charAt(0).toUpperCase() + key.slice(1);
                    
                    // Format value based on type
                    let displayValue = value;
                    if (columnInfo?.type === 'number' && typeof value === 'number') {
                      displayValue = value.toLocaleString();
                    } else if (columnInfo?.type === 'date' && value) {
                      displayValue = new Date(value).toLocaleDateString('en-US');
                    } else if (value === null || value === undefined || value === '') {
                      displayValue = 'N/A';
                    }
                    
                    return (
                      <div key={key} className="space-y-1">
                        <span className="text-sm text-muted-foreground">{displayLabel}</span>
                        <div className="font-medium">{displayValue}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="cashflows" className="space-y-6">
          <Card className="financial-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cash Flows</CardTitle>
              <Button size="sm">Add manual flow</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loan.cashFlows
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((cf: CashFlow) => (
                      <TableRow key={cf.id}>
                        <TableCell>{formatDate(cf.date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {cf.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(cf.amount)}
                        </TableCell>
                        <TableCell>
                          {cf.isManual ? (
                            <Badge className="bg-financial-yellow text-financial-navy">Manual</Badge>
                          ) : (
                            <Badge variant="outline">Automatic</Badge>
                          )}
                        </TableCell>
                        <TableCell>{cf.description || '-'}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Flows Evolution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [
                        formatCurrency(value),
                        value > 0 ? 'Drawdown' : value < 0 ? 'Repayment' : 'Interest/Fees'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="amount" name="Drawdown/Repayment" fill={loan.metrics.evaIntrinsic > 0 ? "#00C48C" : "#FF3B5B"} />
                    <Bar dataKey="interest" name="Interest" fill="#FFB800" />
                    <Bar dataKey="fee" name="Fees" fill="#2D5BFF" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
                      <p className={`text-2xl font-bold ${getValueColor(loan.metrics.evaIntrinsic)}`}>
                        {formatCurrency(loan.metrics.evaIntrinsic)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Sale EVA</p>
                      <p className={`text-2xl font-bold ${getValueColor(loan.metrics.evaSale)}`}>
                        {formatCurrency(loan.metrics.evaSale)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">ROE</p>
                      <p className={`text-2xl font-bold ${getValueColor(loan.metrics.roe, defaultCalculationParameters.targetROE)}`}>
                        {formatPercent(loan.metrics.roe)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        vs target: {formatPercent(defaultCalculationParameters.targetROE)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">RAROC</p>
                      <p className={`text-2xl font-bold ${getValueColor(loan.metrics.raroc, defaultCalculationParameters.targetROE)}`}>
                        {formatPercent(loan.metrics.raroc)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Net Margin</p>
                      <p className={`text-2xl font-bold ${getValueColor(loan.metrics.netMargin)}`}>
                        {formatPercent(loan.metrics.netMargin)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Effective Yield</p>
                      <p className="text-2xl font-bold">
                        {formatPercent(loan.metrics.effectiveYield)}
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
                        {formatCurrency(loan.metrics.expectedLoss)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Risk-Weighted Assets (RWA)</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(loan.metrics.rwa)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Capital Consumption</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(loan.metrics.capitalConsumption)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPercent(loan.metrics.capitalConsumption / loan.originalAmount)} of exposure
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Cost of Risk</p>
                      <p className="text-2xl font-bold text-financial-red">
                        {formatPercent(loan.metrics.costOfRisk)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">PD</p>
                      <p className="text-2xl font-bold">
                        {formatPercent(loan.pd)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Rating: {loan.internalRating}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">LGD</p>
                      <p className="text-2xl font-bold">
                        {formatPercent(loan.lgd)}
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
                      <span className="font-medium">{formatPercent(defaultCalculationParameters.fundingCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Operational Costs</span>
                      <span className="font-medium">{formatPercent(defaultCalculationParameters.operationalCostRatio)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost of Risk</span>
                      <span className="font-medium">{formatPercent(loan.metrics.costOfRisk)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Yield</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margin</span>
                      <span className="font-medium">{formatPercent(loan.margin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reference Rate</span>
                      <span className="font-medium">{formatPercent(loan.referenceRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">All-in Rate</span>
                      <span className="font-medium">{formatPercent(loan.margin + loan.referenceRate)}</span>
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
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
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
                      <TableCell className="text-right">{formatCurrency(loan.metrics.evaIntrinsic)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">{formatPercent(loan.metrics.roe)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(loan.metrics.rwa)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">PD +1%</TableCell>
                      <TableCell className="text-right">{formatCurrency(loan.metrics.evaIntrinsic * 0.9)}</TableCell>
                      <TableCell className="text-right text-financial-red">
                        {formatCurrency(loan.metrics.evaIntrinsic * 0.9 - loan.metrics.evaIntrinsic)}
                      </TableCell>
                      <TableCell className="text-right">{formatPercent(loan.metrics.roe * 0.9)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(loan.metrics.rwa * 1.1)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Rate +1%</TableCell>
                      <TableCell className="text-right">{formatCurrency(loan.metrics.evaIntrinsic * 0.85)}</TableCell>
                      <TableCell className="text-right text-financial-red">
                        {formatCurrency(loan.metrics.evaIntrinsic * 0.85 - loan.metrics.evaIntrinsic)}
                      </TableCell>
                      <TableCell className="text-right">{formatPercent(loan.metrics.roe * 0.85)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(loan.metrics.rwa)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Spread +1%</TableCell>
                      <TableCell className="text-right">{formatCurrency(loan.metrics.evaIntrinsic * 1.15)}</TableCell>
                      <TableCell className="text-right text-financial-green">
                        {formatCurrency(loan.metrics.evaIntrinsic * 1.15 - loan.metrics.evaIntrinsic)}
                      </TableCell>
                      <TableCell className="text-right">{formatPercent(loan.metrics.roe * 1.15)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(loan.metrics.rwa)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">LGD +5%</TableCell>
                      <TableCell className="text-right">{formatCurrency(loan.metrics.evaIntrinsic * 0.88)}</TableCell>
                      <TableCell className="text-right text-financial-red">
                        {formatCurrency(loan.metrics.evaIntrinsic * 0.88 - loan.metrics.evaIntrinsic)}
                      </TableCell>
                      <TableCell className="text-right">{formatPercent(loan.metrics.roe * 0.88)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(loan.metrics.rwa * 1.05)}</TableCell>
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

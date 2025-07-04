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
import { Portfolio, PortfolioSummary, Loan, ClientType } from '@/types/finance';
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
    
    window.addEventListener(PORTFOLIOS_UPDATED_EVENT, handlePortfoliosUpdated);
    
    return () => {
      window.removeEventListener(PORTFOLIOS_UPDATED_EVENT, handlePortfoliosUpdated);
    };
  }, []);
  
  const loadPortfolios = () => {
    const portfolioSummaries = portfolioService.getPortfolioSummaries();
    setPortfolios(portfolioSummaries);
    
    // Auto-select the first portfolio if none selected
    if (!selectedPortfolio && portfolioSummaries.length > 0) {
      const fullPortfolio = portfolioService.getPortfolioById(portfolioSummaries[0].id);
      if (fullPortfolio) {
        setSelectedPortfolio(fullPortfolio);
      }
    }
  };
  
  const handlePortfolioSelect = (portfolioId: string) => {
    const portfolio = portfolioService.getPortfolioById(portfolioId);
    if (portfolio) {
      setSelectedPortfolio(portfolio);
    }
  };
  
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
    
    if (portfolio.loanCount > 0) {
      toast({
        title: "Error",
        description: "Cannot delete portfolio with existing loans. Please move or delete loans first.",
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
      
      toast({
        title: "Success",
        description: "Portfolio deleted successfully.",
        variant: "default"
      });
    }
  };
  
  // Format currency
  const formatCurrency = (value: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency, 
      maximumFractionDigits: 0 
    }).format(value);
  };
  
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
      ExcelTemplateService.exportData(selectedPortfolio, 'Performance', 'excel');
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
  const getChartData = () => {
    if (!selectedPortfolio) return { evaBySector: [], loanEvaData: [], roeVsRiskData: [] };
    
    const { loans } = selectedPortfolio;
    
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
    
    // Data for ROE vs Risk chart
    const roeVsRiskData = loans.map(loan => ({
      name: loan.name,
      x: (loan.metrics?.expectedLoss || 0) / loan.outstandingAmount * 100,
      y: (loan.metrics?.roe || 0) * 100,
      z: loan.outstandingAmount / 1000000,
      sector: loan.sector
    }));
    
    return { evaBySector, loanEvaData, roeVsRiskData };
  };
  
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
                      <TableCell>{formatCurrency(portfolio.totalExposure)}</TableCell>
                      <TableCell>
                        <span className={portfolio.metrics.evaSumIntrinsic >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(portfolio.metrics.evaSumIntrinsic)}
                        </span>
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
                    {formatCurrency(selectedPortfolio.metrics.totalExposure)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Drawn: {formatCurrency(selectedPortfolio.metrics.totalDrawn)}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Portfolio EVA</CardTitle>
                  {selectedPortfolio.metrics.evaSumIntrinsic >= 0 ? 
                    <TrendingUp className="h-4 w-4 text-green-600" /> : 
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  }
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${selectedPortfolio.metrics.evaSumIntrinsic >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(selectedPortfolio.metrics.evaSumIntrinsic)}
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
                    {(selectedPortfolio.metrics.portfolioROE * 100).toFixed(1)}%
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
                    {formatCurrency(selectedPortfolio.metrics.totalExpectedLoss)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg PD: {(selectedPortfolio.metrics.weightedAveragePD * 100).toFixed(2)}%
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
                          <TableCell>{formatCurrency(loan.originalAmount)}</TableCell>
                          <TableCell>
                            <Badge variant={loan.status === 'active' ? 'default' : 'secondary'}>
                              {loan.status}
                            </Badge>
                          </TableCell>
                          <TableCell className={loan.metrics.evaIntrinsic >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(loan.metrics.evaIntrinsic)}
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
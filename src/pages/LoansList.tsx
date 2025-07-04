import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Upload, 
  Download,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Briefcase,
  AlertTriangle
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { defaultCalculationParameters } from '../data/sampleData';
import { Loan, PortfolioSummary, ClientType } from '../types/finance';
import { calculateLoanMetrics } from '../utils/financialCalculations';
import LoanDataService from '../services/LoanDataService';
import PortfolioService, { PORTFOLIOS_UPDATED_EVENT } from '../services/PortfolioService';
import ExcelTemplateService from '../services/ExcelTemplateService';
import { toast } from '@/hooks/use-toast';
import { LOANS_UPDATED_EVENT } from '../services/LoanDataService';

const LoansList = () => {
  const navigate = useNavigate();
  const loanDataService = LoanDataService.getInstance();
  const portfolioService = PortfolioService.getInstance();
  
  // Portfolio and loan state
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [loans, setLoans] = useState<Loan[]>([]);
  
  // Filtering and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAllItems, setShowAllItems] = useState(false);
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<string | null>(null);
  const [addLoanDialogOpen, setAddLoanDialogOpen] = useState(false);
  const [newLoanPortfolioId, setNewLoanPortfolioId] = useState<string>('');

  useEffect(() => {
    loadPortfolios();

    // Listen for portfolio and loan updates
    const handlePortfoliosUpdated = () => {
      loadPortfolios();
    };
    
    const handleLoansUpdated = () => {
      if (selectedPortfolioId) {
        loadLoansForPortfolio(selectedPortfolioId);
      }
    };
    
    window.addEventListener(PORTFOLIOS_UPDATED_EVENT, handlePortfoliosUpdated);
    window.addEventListener(LOANS_UPDATED_EVENT, handleLoansUpdated);
    
    return () => {
      window.removeEventListener(PORTFOLIOS_UPDATED_EVENT, handlePortfoliosUpdated);
      window.removeEventListener(LOANS_UPDATED_EVENT, handleLoansUpdated);
    };
  }, []);
  
  useEffect(() => {
    if (selectedPortfolioId) {
      loadLoansForPortfolio(selectedPortfolioId);
    }
  }, [selectedPortfolioId]);
  
  const loadPortfolios = () => {
    const portfolioSummaries = portfolioService.getPortfolioSummaries();
    setPortfolios(portfolioSummaries);
    
    // Auto-select the first portfolio if none selected
    if (!selectedPortfolioId && portfolioSummaries.length > 0) {
      const defaultPortfolio = portfolioSummaries.find(p => p.isDefault);
      if (defaultPortfolio) {
        setSelectedPortfolioId(defaultPortfolio.id);
      } else {
        setSelectedPortfolioId(portfolioSummaries[0].id);
      }
    }
  };
  
  const loadLoansForPortfolio = (portfolioId: string) => {
    const portfolioLoans = loanDataService.getLoans(portfolioId);
    
    // Recalculate metrics for these loans
    const loansWithMetrics = portfolioLoans.map(loan => ({
      ...loan,
      metrics: calculateLoanMetrics(loan, defaultCalculationParameters)
    }));
    
    setLoans(loansWithMetrics);
    setCurrentPage(1); // Reset pagination when changing portfolio
  };

  const handlePortfolioChange = (portfolioId: string) => {
    setSelectedPortfolioId(portfolioId);
  };
  
  // Filter loans according to search and filters
  const filteredLoans = loans.filter(loan => {
    const matchesSearch = 
      loan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.sector.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Sort loans
  const sortedLoans = [...filteredLoans].sort((a, b) => {
    let valueA: any;
    let valueB: any;
    
    switch (sortField) {
      case 'name':
        valueA = a.name;
        valueB = b.name;
        break;
      case 'clientName':
        valueA = a.clientName;
        valueB = b.clientName;
        break;
      case 'amount':
        valueA = a.originalAmount;
        valueB = b.originalAmount;
        break;
      case 'pd':
        valueA = a.pd;
        valueB = b.pd;
        break;
      case 'eva':
        valueA = a.metrics.evaIntrinsic;
        valueB = b.metrics.evaIntrinsic;
        break;
      case 'roe':
        valueA = a.metrics.roe;
        valueB = b.metrics.roe;
        break;
      default:
        valueA = a.name;
        valueB = b.name;
    }
    
    if (typeof valueA === 'string') {
      return sortDirection === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    } else {
      return sortDirection === 'asc' 
        ? valueA - valueB 
        : valueB - valueA;
    }
  });
  
  // Paginate loans
  const totalPages = Math.ceil(sortedLoans.length / itemsPerPage);
  const paginatedLoans = showAllItems 
    ? sortedLoans 
    : sortedLoans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  // Utility functions
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const getSortIndicator = (field: string) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const formatPercent = (value: number) => {
    return (value * 100).toFixed(2) + '%';
  };
  
  const getLoanStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'default':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'restructured':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };
  
  const handleExport = () => {
    if (!selectedPortfolioId) {
      toast({
        title: "Error",
        description: "Please select a portfolio to export.",
        variant: "destructive"
      });
      return;
    }

    const portfolio = portfolioService.getPortfolioById(selectedPortfolioId);
    if (!portfolio) {
      toast({
        title: "Error",
        description: "Portfolio not found.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Export in progress",
      description: `Exporting ${portfolio.name} portfolio...`,
        variant: "default"
      });
    
    try {
      ExcelTemplateService.exportData(portfolio, 'Loans', 'excel');
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Export failed: ${error.message}`,
        variant: "destructive"
      });
    }
  };
  
  const handleDelete = (loanId: string) => {
    setLoanToDelete(loanId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (loanToDelete) {
      try {
        const success = loanDataService.deleteLoan(loanToDelete);
        if (success) {
          toast({
            title: "Success",
            description: "Loan deleted successfully.",
            variant: "default"
          });
          // Reload loans for current portfolio
          if (selectedPortfolioId) {
            loadLoansForPortfolio(selectedPortfolioId);
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to delete loan.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: `An error occurred: ${error.message}`,
          variant: "destructive",
        });
      }
    }
    
    setDeleteDialogOpen(false);
    setLoanToDelete(null);
  };

  const handleAddLoanWithPortfolio = () => {
    if (!newLoanPortfolioId) {
      toast({
        title: "Error",
        description: "Please select a portfolio for the new loan.",
        variant: "destructive"
      });
      return;
    }
    
    // Navigate to new loan page with portfolio pre-selected
    navigate(`/loans/new?portfolio=${newLoanPortfolioId}`);
    setAddLoanDialogOpen(false);
    setNewLoanPortfolioId('');
  };

  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Loans Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/import')}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={!selectedPortfolioId}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={addLoanDialogOpen} onOpenChange={setAddLoanDialogOpen}>
            <DialogTrigger asChild>
              <Button>
            <Plus className="h-4 w-4 mr-2" />
                New Loan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Loan</DialogTitle>
                <DialogDescription>
                  Select a portfolio for the new loan.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="loan-portfolio">Target Portfolio</Label>
                  <Select value={newLoanPortfolioId} onValueChange={setNewLoanPortfolioId}>
                    <SelectTrigger id="loan-portfolio">
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddLoanDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddLoanWithPortfolio}>
                  Continue
          </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
            Choose a portfolio to view and manage its loans
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
                  <Label className="text-sm text-muted-foreground">Client Type</Label>
                  <p className="font-medium">{getClientTypeLabel(selectedPortfolio.clientType)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Total Loans</Label>
                  <p className="font-medium">{selectedPortfolio.loanCount}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Total Exposure</Label>
                  <p className="font-medium">{formatCurrency(selectedPortfolio.totalExposure)}</p>
                </div>
              </div>
            )}
            
            {!selectedPortfolioId && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please select a portfolio to view its loans.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Loans List */}
      {selectedPortfolioId && (
        <>
          {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-auto flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
                placeholder="Search loans..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[150px]">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="restructured">Restructured</SelectItem>
            </SelectContent>
          </Select>
          
              <Select value={sortField} onValueChange={setSortField}>
            <SelectTrigger className="w-full md:w-[150px]">
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="clientName">Client</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="pd">PD</SelectItem>
              <SelectItem value="eva">EVA</SelectItem>
              <SelectItem value="roe">ROE</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>
      
          {/* Loans Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px] cursor-pointer" onClick={() => handleSort('name')}>
                Name {getSortIndicator('name')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('clientName')}>
                Client {getSortIndicator('clientName')}
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('amount')}>
                Amount {getSortIndicator('amount')}
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('pd')}>
                PD {getSortIndicator('pd')}
              </TableHead>
              <TableHead className="text-right">LGD</TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('eva')}>
                EVA {getSortIndicator('eva')}
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('roe')}>
                ROE {getSortIndicator('roe')}
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLoans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <div className="flex flex-col items-center gap-3 py-4">
                        <Briefcase className="h-12 w-12 text-muted-foreground" />
                        <p className="text-lg font-semibold">No loans in this portfolio</p>
                        <p className="text-muted-foreground mb-2">
                          {searchTerm || statusFilter !== 'all' 
                            ? 'No loans match your search criteria.' 
                            : 'This portfolio is empty. Add some loans to get started.'}
                        </p>
                        <Button onClick={() => setAddLoanDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                          Add First Loan
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedLoans.map(loan => (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium">{loan.name}</TableCell>
                  <TableCell>{loan.clientName}</TableCell>
                  <TableCell>
                        <Badge variant="outline">
                    {loan.type === 'term' ? 'Term' : 
                     loan.type === 'revolver' ? 'Revolver' : 
                           loan.type === 'bullet' ? 'Bullet' : 'Amortizing'}
                        </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`capitalize ${getLoanStatusColor(loan.status)}`}>
                          {loan.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(loan.originalAmount)}</TableCell>
                  <TableCell className="text-right">{formatPercent(loan.pd)}</TableCell>
                  <TableCell className="text-right">{formatPercent(loan.lgd)}</TableCell>
                      <TableCell className={`text-right ${(loan.metrics?.evaIntrinsic || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(loan.metrics?.evaIntrinsic || 0)}
                  </TableCell>
                      <TableCell className={`text-right ${(loan.metrics?.roe || 0) > defaultCalculationParameters.targetROE ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(loan.metrics?.roe || 0)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/loans/${loan.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                              View Details
                        </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/loans/new?edit=true&id=${loan.id}`)}>
                          <Edit className="h-4 w-4 mr-2" />
                              Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDelete(loan.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
          {/* Pagination */}
          {paginatedLoans.length > 0 && (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select
            value={String(itemsPerPage)}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
                    <SelectItem value="5">5 per page</SelectItem>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllItems(!showAllItems)}
          >
                  {showAllItems ? "Paginate" : "Show All"}
          </Button>
        </div>
        
              {!showAllItems && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
                  <span className="mx-2 text-sm">
                    Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        
              <div className="text-sm text-muted-foreground">
                Showing {paginatedLoans.length} of {sortedLoans.length} loans
        </div>
      </div>
          )}
        </>
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this loan?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible. All data associated with this loan will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LoansList;

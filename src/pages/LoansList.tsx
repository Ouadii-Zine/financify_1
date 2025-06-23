import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ChevronsRight
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
import { sampleLoans, defaultCalculationParameters } from '../data/sampleData';
import { Loan } from '../types/finance';
import { calculateLoanMetrics } from '../utils/financialCalculations';
import LoanDataService from '../services/LoanDataService';
import ExcelTemplateService from '../services/ExcelTemplateService';
import { toast } from '@/hooks/use-toast';
import { LOANS_UPDATED_EVENT } from '../services/LoanDataService';

const LoansList = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const loanDataService = LoanDataService.getInstance();
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAllItems, setShowAllItems] = useState(false);
  
  // State for deletion confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadLoans();

    // Add event listener for loan updates
    const handleLoansUpdated = () => {
      loadLoans();
    };
    
    window.addEventListener(LOANS_UPDATED_EVENT, handleLoansUpdated);
    
    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener(LOANS_UPDATED_EVENT, handleLoansUpdated);
    };
  }, []);
  
  const loadLoans = () => {
    loanDataService.loadFromLocalStorage();
    // Get only user loans, without predefined examples
    const userLoans = loanDataService.getLoans();
    
    // Recalculate metrics for these loans
    const loansWithMetrics = userLoans.map(loan => ({
      ...loan,
      metrics: calculateLoanMetrics(loan, defaultCalculationParameters)
    }));
    
    setLoans(loansWithMetrics);
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
    
    // Determine values to compare based on sort field
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
    
    // Compare values based on sort direction
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
  
  // Function to change sort
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Style for sorted column header
  const getSortIndicator = (field: string) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };
  
  // Function to format amounts in euros
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Fonction pour formater les pourcentages
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Fonction pour obtenir la couleur du badge selon le statut du prêt
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
  
  // Fonction pour exporter les données
  const handleExport = () => {
    try {
      const portfolioData = {
        id: 'portfolio-1',
        name: 'Portefeuille Exporté',
        description: 'Exportation du portefeuille de prêts',
        loans: sortedLoans,
        metrics: {
          totalExposure: sortedLoans.reduce((sum, loan) => sum + loan.originalAmount, 0),
          totalDrawn: sortedLoans.reduce((sum, loan) => sum + loan.drawnAmount, 0),
          totalUndrawn: sortedLoans.reduce((sum, loan) => sum + loan.undrawnAmount, 0),
          weightedAveragePD: 0,
          weightedAverageLGD: 0,
          totalExpectedLoss: sortedLoans.reduce((sum, loan) => sum + (loan.metrics?.expectedLoss || 0), 0),
          totalRWA: sortedLoans.reduce((sum, loan) => sum + (loan.metrics?.rwa || 0), 0),
          portfolioROE: 0,
          portfolioRAROC: 0,
          evaSumIntrinsic: sortedLoans.reduce((sum, loan) => sum + (loan.metrics?.evaIntrinsic || 0), 0),
          evaSumSale: sortedLoans.reduce((sum, loan) => sum + (loan.metrics?.evaSale || 0), 0),
          diversificationBenefit: 0
        }
      };
      
      ExcelTemplateService.exportData(portfolioData, 'Liste_Complet_Prets', 'excel');
      
      toast({
        title: "Export réussi",
        description: "Les données ont été exportées avec succès au format Excel.",
        variant: "default"
      });
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export des données.",
        variant: "destructive"
      });
    }
  };
  
  // Fonction pour gérer la suppression d'un prêt
  const handleDelete = (loanId: string) => {
    // Ouvrir la boîte de dialogue de confirmation
    setLoanToDelete(loanId);
    setDeleteDialogOpen(true);
  };
  
  // Fonction pour confirmer la suppression
  const confirmDelete = () => {
    if (loanToDelete) {
      try {
        const success = loanDataService.deleteLoan(loanToDelete);
        
        if (success) {
          toast({
            title: "Prêt supprimé",
            description: "Le prêt a été supprimé avec succès.",
            variant: "default",
          });
          
          // Recharger la liste des prêts
          loadLoans();
        } else {
          toast({
            title: "Erreur",
            description: "Impossible de supprimer ce prêt.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: `Une erreur est survenue: ${error.message}`,
          variant: "destructive",
        });
      }
    }
    
    // Fermer la boîte de dialogue et réinitialiser l'état
    setDeleteDialogOpen(false);
    setLoanToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Loan Portfolio</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/import')}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate('/loans/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Prêt
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-auto flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a loan..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
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
          
          <Select
            value={sortField}
            onValueChange={setSortField}
          >
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
                    <p className="text-lg font-semibold">No loans in your portfolio</p>
                    <p className="text-muted-foreground mb-2">Create a new loan to start analyzing your portfolio.</p>
                    <Button onClick={() => navigate('/loans/new')}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Loan
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
                    {loan.type === 'term' ? 'Term' : 
                     loan.type === 'revolver' ? 'Revolver' : 
                     loan.type === 'bullet' ? 'Bullet' : 'Amortissable'}
                  </TableCell>
                  <TableCell>
                    <Badge className={`capitalize ${getLoanStatusColor(loan.status)}`}>
                      {loan.status === 'active' ? 'Active' : 
                       loan.status === 'closed' ? 'Closed' : 
                       loan.status === 'default' ? 'Default' : 'Restructured'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(loan.originalAmount)}</TableCell>
                  <TableCell className="text-right">{formatPercent(loan.pd)}</TableCell>
                  <TableCell className="text-right">{formatPercent(loan.lgd)}</TableCell>
                  <TableCell className={`text-right ${(loan.metrics?.evaIntrinsic || 0) > 0 ? 'text-financial-green' : 'text-financial-red'}`}>
                    {formatCurrency(loan.metrics?.evaIntrinsic || 0)}
                  </TableCell>
                  <TableCell className={`text-right ${(loan.metrics?.roe || 0) > defaultCalculationParameters.targetROE ? 'text-financial-green' : 'text-financial-red'}`}>
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
                        <DropdownMenuItem onClick={() => {
                          try {
                            // Vérifier que le prêt existe avant de naviguer
                            const loanExists = loanDataService.getLoanById(loan.id);
                            if (loanExists) {
                              navigate(`/loans/${loan.id}`);
                            } else {
                              toast({
                                title: "Error",
                                description: "This loan does not exist or has been deleted.",
                                variant: "destructive",
                              });
                            }
                          } catch (error) {
                            console.error("Erreur de navigation:", error);
                            toast({
                              title: "Erreur",
                              description: "Impossible d'afficher les détails du prêt.",
                              variant: "destructive",
                            });
                          }
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          try {
                            // Vérifier que le prêt existe avant de naviguer
                            const loanExists = loanDataService.getLoanById(loan.id);
                            if (loanExists) {
                              // Pour l'instant, nous utilisons la page détail avec un paramètre d'édition
                              // Comme il n'y a pas de route d'édition spécifique dans App.tsx
                              navigate(`/loans/${loan.id}?edit=true`);
                            } else {
                              toast({
                                title: "Erreur",
                                description: "Ce prêt n'existe pas ou a été supprimé.",
                                variant: "destructive",
                              });
                            }
                          } catch (error) {
                            console.error("Erreur de navigation:", error);
                            toast({
                              title: "Erreur",
                              description: "Impossible de modifier ce prêt.",
                              variant: "destructive",
                            });
                          }
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDelete(loan.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
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
      
      {/* Pagination et contrôles d'affichage */}
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
              <SelectItem value="5">5 par page</SelectItem>
              <SelectItem value="10">10 par page</SelectItem>
              <SelectItem value="20">20 par page</SelectItem>
              <SelectItem value="50">50 par page</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllItems(!showAllItems)}
          >
            {showAllItems ? "Paginer" : "Voir tout"}
          </Button>
        </div>
        
        {!showAllItems && (
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
            
            <span className="mx-2">
              Page {currentPage} sur {totalPages}
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
        
        <div>
          Affichage de {paginatedLoans.length} prêts sur {sortedLoans.length}
        </div>
      </div>
      
      {/* Boîte de dialogue de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce prêt?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données associées à ce prêt seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LoansList;

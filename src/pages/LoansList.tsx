
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
  BarChart3
} from 'lucide-react';
import { sampleLoans, defaultCalculationParameters } from '../data/sampleData';
import { Loan } from '../types/finance';
import { calculateLoanMetrics } from '../utils/financialCalculations';

const LoansList = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  useEffect(() => {
    // Calculer les métriques pour chaque prêt
    const loansWithMetrics = sampleLoans.map(loan => {
      const metrics = calculateLoanMetrics(loan, defaultCalculationParameters);
      return { ...loan, metrics };
    });
    setLoans(loansWithMetrics);
  }, []);
  
  // Filtrer les prêts selon la recherche et les filtres
  const filteredLoans = loans.filter(loan => {
    const matchesSearch = 
      loan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.sector.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Trier les prêts
  const sortedLoans = [...filteredLoans].sort((a, b) => {
    let valueA: any;
    let valueB: any;
    
    // Déterminer les valeurs à comparer selon le champ de tri
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
    
    // Comparer les valeurs selon la direction de tri
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
  
  // Fonction pour changer le tri
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Style pour l'en-tête de colonne triée
  const getSortIndicator = (field: string) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };
  
  // Fonction pour formater les montants en euros
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
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
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Portefeuille de Prêts</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/import')}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
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
            placeholder="Rechercher un prêt..."
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
                <SelectValue placeholder="Statut" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="closed">Clôturé</SelectItem>
              <SelectItem value="default">Défaut</SelectItem>
              <SelectItem value="restructured">Restructuré</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={sortField}
            onValueChange={setSortField}
          >
            <SelectTrigger className="w-full md:w-[150px]">
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Trier par" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nom</SelectItem>
              <SelectItem value="clientName">Client</SelectItem>
              <SelectItem value="amount">Montant</SelectItem>
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
              <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                Nom {getSortIndicator('name')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('clientName')}>
                Client {getSortIndicator('clientName')}
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('amount')}>
                Montant {getSortIndicator('amount')}
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('pd')}>
                PD {getSortIndicator('pd')}
              </TableHead>
              <TableHead className="text-right">LGD</TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('eva')}>
                EVA {getSortIndicator('eva')}
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('roe')}>
                ROE {getSortIndicator('roe')}
              </TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLoans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  Aucun prêt trouvé pour ces critères de recherche
                </TableCell>
              </TableRow>
            ) : (
              sortedLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium">{loan.name}</TableCell>
                  <TableCell>{loan.clientName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {loan.type}
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
                  <TableCell className={`text-right font-semibold ${loan.metrics.evaIntrinsic > 0 ? 'text-financial-green' : 'text-financial-red'}`}>
                    {formatCurrency(loan.metrics.evaIntrinsic)}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${loan.metrics.roe > defaultCalculationParameters.targetROE ? 'text-financial-green' : 'text-financial-red'}`}>
                    {formatPercent(loan.metrics.roe)}
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate(`/loans/${loan.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/loans/${loan.id}/edit`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
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
      
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div>Affichage de {sortedLoans.length} prêts sur {loans.length}</div>
        <div>
          Total d'exposition: {formatCurrency(sortedLoans.reduce((sum, loan) => sum + loan.originalAmount, 0))}
        </div>
      </div>
    </div>
  );
};

export default LoansList;

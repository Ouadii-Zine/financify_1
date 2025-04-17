
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const LoanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<Loan | null>(null);
  
  useEffect(() => {
    // Trouver le prêt correspondant à l'ID
    const foundLoan = sampleLoans.find(l => l.id === id);
    
    if (foundLoan) {
      // Calculer les métriques du prêt
      const metrics = calculateLoanMetrics(foundLoan, defaultCalculationParameters);
      setLoan({ ...foundLoan, metrics });
    }
  }, [id]);
  
  if (!loan) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Prêt non trouvé</h2>
          <p className="text-muted-foreground mb-4">Le prêt que vous cherchez n'existe pas ou a été supprimé.</p>
          <Button onClick={() => navigate('/loans')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }
  
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
  
  // Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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
  
  // Fonction pour obtenir la couleur de texte selon que la valeur est positive/négative
  const getValueColor = (value: number, threshold: number = 0) => {
    return value > threshold ? 'text-financial-green' : 'text-financial-red';
  };
  
  // Préparer les données pour le graphique des cash flows
  const cashFlowChartData = [...loan.cashFlows]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(cf => ({
      date: new Date(cf.date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      amount: cf.type === 'drawdown' ? cf.amount : (cf.type === 'repayment' ? -cf.amount : 0),
      interest: cf.type === 'interest' ? cf.amount : 0,
      fee: cf.type === 'fee' ? cf.amount : 0,
      isManual: cf.isManual,
    }));
  
  // Préparer les données pour le graphique d'évolution de l'EVA
  const evaChartData = [
    { name: 'Base', eva: loan.metrics.evaIntrinsic },
    { name: '+1% PD', eva: loan.metrics.evaIntrinsic * 0.9 }, // Simulation simplifiée
    { name: '+1% Taux', eva: loan.metrics.evaIntrinsic * 0.85 }, // Simulation simplifiée
    { name: '+1% Spread', eva: loan.metrics.evaIntrinsic * 1.15 }, // Simulation simplifiée
    { name: '+5% LGD', eva: loan.metrics.evaIntrinsic * 0.88 }, // Simulation simplifiée
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
            Modifier
          </Button>
          <Button variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Dupliquer
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="financial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-financial-blue" />
              Montant Original
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(loan.originalAmount)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Tiré: {formatCurrency(loan.drawnAmount)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="financial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-financial-yellow" />
              Période
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">
              {formatDate(loan.startDate)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              jusqu'au {formatDate(loan.endDate)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="financial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-financial-red" />
              Risque
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
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="cashflows">Cash Flows</TabsTrigger>
          <TabsTrigger value="metrics">Métriques</TabsTrigger>
          <TabsTrigger value="simulations">Simulations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="financial-card">
              <CardHeader>
                <CardTitle>Informations Générales</CardTitle>
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
                    <p className="text-sm text-muted-foreground">Secteur</p>
                    <div className="flex items-center mt-1">
                      <Building className="h-4 w-4 mr-2 text-financial-blue" />
                      <span className="font-medium">{loan.sector}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Pays</p>
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
                    <p className="text-sm text-muted-foreground">Devise</p>
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
                  <p className="text-sm text-muted-foreground mb-2">Exposition</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm">Montant Original</p>
                      <p className="text-lg font-semibold">{formatCurrency(loan.originalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm">Encours</p>
                      <p className="text-lg font-semibold">{formatCurrency(loan.outstandingAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm">Tiré</p>
                      <p className="text-lg font-semibold">{formatCurrency(loan.drawnAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm">Non Tiré</p>
                      <p className="text-lg font-semibold">{formatCurrency(loan.undrawnAmount)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="financial-card">
              <CardHeader>
                <CardTitle>Évolution des Cash Flows</CardTitle>
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
                          value > 0 ? 'Tirage' : value < 0 ? 'Remboursement' : 'Intérêt/Frais'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="amount" name="Tirage/Remboursement" fill={loan.metrics.evaIntrinsic > 0 ? "#00C48C" : "#FF3B5B"} />
                      <Bar dataKey="interest" name="Intérêt" fill="#FFB800" />
                      <Bar dataKey="fee" name="Frais" fill="#2D5BFF" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Métriques Clés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">EVA Intrinsèque</p>
                  <p className={`text-2xl font-bold ${getValueColor(loan.metrics.evaIntrinsic)}`}>
                    {formatCurrency(loan.metrics.evaIntrinsic)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">EVA de Cession</p>
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
                  <p className="text-sm text-muted-foreground">Consommation Capital</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(loan.metrics.capitalConsumption)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Marge Nette</p>
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
              <CardTitle>Détails du Prêt</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Informations Générales</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Identifiant</span>
                      <span className="font-medium">{loan.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nom</span>
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
                      <span className="text-muted-foreground">Statut</span>
                      <Badge className={`capitalize ${getLoanStatusColor(loan.status)}`}>
                        {loan.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date de début</span>
                      <span className="font-medium">{formatDate(loan.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date de fin</span>
                      <span className="font-medium">{formatDate(loan.endDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Devise</span>
                      <span className="font-medium">{loan.currency}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Paramètres Financiers</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margin</span>
                      <span className="font-medium">{formatPercent(loan.margin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taux de référence</span>
                      <span className="font-medium">{formatPercent(loan.referenceRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frais upfront</span>
                      <span className="font-medium">{formatCurrency(loan.fees.upfront)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Commission d'engagement</span>
                      <span className="font-medium">{formatPercent(loan.fees.commitment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frais d'agence</span>
                      <span className="font-medium">{formatCurrency(loan.fees.agency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Autres frais</span>
                      <span className="font-medium">{formatCurrency(loan.fees.other)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Exposition & Risque</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Montant original</span>
                      <span className="font-medium">{formatCurrency(loan.originalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Encours</span>
                      <span className="font-medium">{formatCurrency(loan.outstandingAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Montant tiré</span>
                      <span className="font-medium">{formatCurrency(loan.drawnAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Montant non tiré</span>
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
                      <span className="text-muted-foreground">Rating interne</span>
                      <span className="font-medium">{loan.internalRating}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Secteur</span>
                      <span className="font-medium">{loan.sector}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pays</span>
                      <span className="font-medium">{loan.country}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cashflows" className="space-y-6">
          <Card className="financial-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Flux de Trésorerie</CardTitle>
              <Button size="sm">Ajouter un flux manuel</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
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
                            <Badge className="bg-financial-yellow text-financial-navy">Manuel</Badge>
                          ) : (
                            <Badge variant="outline">Automatique</Badge>
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
              <CardTitle>Évolution des Flux</CardTitle>
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
                        value > 0 ? 'Tirage' : value < 0 ? 'Remboursement' : 'Intérêt/Frais'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="amount" name="Tirage/Remboursement" fill={loan.metrics.evaIntrinsic > 0 ? "#00C48C" : "#FF3B5B"} />
                    <Bar dataKey="interest" name="Intérêt" fill="#FFB800" />
                    <Bar dataKey="fee" name="Frais" fill="#2D5BFF" />
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
                <CardTitle>Métriques de Rentabilité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">EVA Intrinsèque</p>
                      <p className={`text-2xl font-bold ${getValueColor(loan.metrics.evaIntrinsic)}`}>
                        {formatCurrency(loan.metrics.evaIntrinsic)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">EVA de Cession</p>
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
                        vs cible: {formatPercent(defaultCalculationParameters.targetROE)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">RAROC</p>
                      <p className={`text-2xl font-bold ${getValueColor(loan.metrics.raroc, defaultCalculationParameters.targetROE)}`}>
                        {formatPercent(loan.metrics.raroc)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Marge Nette</p>
                      <p className={`text-2xl font-bold ${getValueColor(loan.metrics.netMargin)}`}>
                        {formatPercent(loan.metrics.netMargin)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Rendement Effectif</p>
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
                <CardTitle>Métriques de Risque</CardTitle>
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
                      <p className="text-sm text-muted-foreground">Consommation Capital</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(loan.metrics.capitalConsumption)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPercent(loan.metrics.capitalConsumption / loan.originalAmount)} de l'exposition
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Coût du Risque</p>
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
              <CardTitle>Informations Complémentaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Paramètres Financiers</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taux Cible ROE</span>
                      <span className="font-medium">{formatPercent(defaultCalculationParameters.targetROE)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taux d'IS</span>
                      <span className="font-medium">{formatPercent(defaultCalculationParameters.corporateTaxRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ratio de Capital</span>
                      <span className="font-medium">{formatPercent(defaultCalculationParameters.capitalRatio)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Coûts</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coût de Funding</span>
                      <span className="font-medium">{formatPercent(defaultCalculationParameters.fundingCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coûts Opérationnels</span>
                      <span className="font-medium">{formatPercent(defaultCalculationParameters.operationalCostRatio)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coût du Risque</span>
                      <span className="font-medium">{formatPercent(loan.metrics.costOfRisk)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Rendement</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Marge</span>
                      <span className="font-medium">{formatPercent(loan.margin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taux de Référence</span>
                      <span className="font-medium">{formatPercent(loan.referenceRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taux All-in</span>
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
              <CardTitle>Simulations de Scénarios</CardTitle>
              <Button size="sm">Nouveau Scénario</Button>
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
                <h3 className="text-lg font-semibold mb-3">Résultats des Simulations</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scénario</TableHead>
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
                      <TableCell className="font-medium">Taux +1%</TableCell>
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

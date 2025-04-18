
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
import { samplePortfolio, defaultCalculationParameters } from '@/data/sampleData';
import { calculatePortfolioMetrics, calculateLoanMetrics } from '@/utils/financialCalculations';
import { Loan } from '@/types/finance';
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

// Couleurs pour les graphiques
const COLORS = ['#00C48C', '#2D5BFF', '#FFB800', '#FF3B5B', '#1A2C42', '#9B87F5', '#7E69AB'];

const Portfolio = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>(samplePortfolio.loans);
  const [portfolioMetrics, setPortfolioMetrics] = useState(calculatePortfolioMetrics(loans, defaultCalculationParameters));
  
  useEffect(() => {
    // Calculer les métriques pour chaque prêt
    const updatedLoans = loans.map(loan => {
      const metrics = calculateLoanMetrics(loan, defaultCalculationParameters);
      return { ...loan, metrics };
    });
    
    setLoans(updatedLoans);
    setPortfolioMetrics(calculatePortfolioMetrics(updatedLoans, defaultCalculationParameters));
  }, []);
  
  // Distribution des EVA par secteur
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
  
  // Données pour le graphique EVA par prêt
  const loanEvaData = loans.map(loan => ({
    name: loan.name,
    evaIntrinsic: loan.metrics?.evaIntrinsic || 0,
    roe: (loan.metrics?.roe || 0) * 100,
    outstandingAmount: loan.outstandingAmount
  })).sort((a, b) => b.evaIntrinsic - a.evaIntrinsic);
  
  // Données pour le graphique ROE vs Risque (EL/Encours)
  const roeVsRiskData = loans.map(loan => ({
    name: loan.name,
    x: (loan.metrics?.expectedLoss || 0) / loan.outstandingAmount * 100, // EL/Encours en %
    y: (loan.metrics?.roe || 0) * 100, // ROE en %
    z: loan.outstandingAmount / 1000000, // Taille de la bulle (Encours en millions)
    sector: loan.sector
  }));
  
  // Formatter pour afficher les montants en euros
  const formatCurrency = (value: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: currency, 
      maximumFractionDigits: 0 
    }).format(value);
  };
  
  // Gestionnaires d'événements pour les boutons
  const handleImport = () => {
    console.log("Redirection vers la page d'import");
    navigate('/import');
  };
  
  const handleExport = () => {
    console.log("Export du portefeuille");
    toast({
      title: "Export en cours",
      description: "Le portefeuille est en cours d'exportation au format Excel...",
      variant: "default"
    });
    
    try {
      // Utiliser le service d'export
      ExcelTemplateService.exportData(samplePortfolio, 'Performance', 'excel');
    } catch (error) {
      console.error("Erreur lors de l'export du portefeuille:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'export du portefeuille.",
        variant: "destructive"
      });
    }
  };
  
  const handleNewLoan = () => {
    console.log("Redirection vers la création d'un nouveau prêt");
    navigate('/loans/new');
    
    // Notification pour indiquer à l'utilisateur qu'il est redirigé
    toast({
      title: "Création d'un nouveau prêt",
      description: "Vous êtes redirigé vers le formulaire de création d'un nouveau prêt.",
      variant: "default"
    });
  };

  // Reste du code inchangé...
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Portefeuille de Prêts</h1>
        
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
            Nouveau Prêt
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Exposition Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(portfolioMetrics.totalExposure)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <span>Tirée: {((portfolioMetrics.totalDrawn / portfolioMetrics.totalExposure) * 100).toFixed(1)}%</span>
              <span className="text-muted-foreground mx-1">|</span>
              <span>Non-tirée: {((portfolioMetrics.totalUndrawn / portfolioMetrics.totalExposure) * 100).toFixed(1)}%</span>
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
              <span>PD moyenne: {(portfolioMetrics.weightedAveragePD * 100).toFixed(2)}%</span>
              <span className="text-muted-foreground mx-1">|</span>
              <span>LGD moyenne: {(portfolioMetrics.weightedAverageLGD * 100).toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">RWA Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(portfolioMetrics.totalRWA)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <span>Densité RWA: {((portfolioMetrics.totalRWA / portfolioMetrics.totalExposure) * 100).toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">
              EVA Portefeuille
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
          <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
          <TabsTrigger value="loans-list">Liste des Prêts</TabsTrigger>
          <TabsTrigger value="risk-analysis">Analyse de Risque</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Analyse de la Valeur Économique Ajoutée (EVA)</CardTitle>
                <CardDescription>Top 10 des prêts par EVA</CardDescription>
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
                      <Bar dataKey="evaIntrinsic" fill="#00C48C" name="EVA Intrinsèque" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/analytics/eva">
                    Voir Analyse EVA Complète
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Répartition Sectorielle de l'EVA</CardTitle>
                <CardDescription>Contribution à l'EVA par secteur d'activité</CardDescription>
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
                <CardTitle>Analyse ROE vs Risque</CardTitle>
                <CardDescription>Relation entre rentabilité (ROE) et risque (EL/Encours)</CardDescription>
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
                        name="Risque (EL/Encours)" 
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
                        name="Encours" 
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
              <CardFooter className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/analytics/risk">
                    Voir Analyse de Risque Complète
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="loans-list">
          <Card>
            <CardHeader>
              <CardTitle>Liste des Prêts</CardTitle>
              <CardDescription>Vue détaillée de tous les prêts du portefeuille</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Secteur</TableHead>
                    <TableHead className="text-right">Montant Original</TableHead>
                    <TableHead className="text-right">Encours</TableHead>
                    <TableHead className="text-right">EVA Intrinsèque</TableHead>
                    <TableHead className="text-right">ROE</TableHead>
                    <TableHead className="text-right">Risque (EL)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map(loan => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-medium">
                        <Link to={`/loans/${loan.id}`} className="text-primary hover:underline">
                          {loan.name}
                        </Link>
                      </TableCell>
                      <TableCell>{loan.clientName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{loan.type}</Badge>
                      </TableCell>
                      <TableCell>{loan.sector}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(loan.originalAmount, loan.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(loan.outstandingAmount, loan.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          {loan.metrics?.evaIntrinsic || 0 >= 0 ? (
                            <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                          )}
                          {formatCurrency(loan.metrics?.evaIntrinsic || 0, loan.currency)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`font-medium ${(loan.metrics?.roe || 0) >= 0.12 ? 'text-green-600' : (loan.metrics?.roe || 0) >= 0.08 ? 'text-amber-600' : 'text-red-600'}`}>
                          {((loan.metrics?.roe || 0) * 100).toFixed(2)}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          {(loan.metrics?.expectedLoss || 0) / loan.outstandingAmount > 0.02 && (
                            <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                          )}
                          {formatCurrency(loan.metrics?.expectedLoss || 0, loan.currency)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Affichage de {loans.length} prêts
              </div>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exporter la Liste
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="risk-analysis">
          <Card>
            <CardHeader>
              <CardTitle>Analyse de Risque du Portefeuille</CardTitle>
              <CardDescription>Exposition et métriques de risque par secteur et notation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <h3 className="font-medium text-lg">Exposition par Secteur</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={loans.reduce((acc, loan) => {
                      const existingItem = acc.find(item => item.name === loan.sector);
                      if (existingItem) {
                        existingItem.exposure += loan.outstandingAmount;
                        existingItem.el += loan.metrics?.expectedLoss || 0;
                      } else {
                        acc.push({
                          name: loan.sector,
                          exposure: loan.outstandingAmount,
                          el: loan.metrics?.expectedLoss || 0
                        });
                      }
                      return acc;
                    }, [] as { name: string; exposure: number; el: number }[]).sort((a, b) => b.exposure - a.exposure)}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'exposure' ? 'Exposition' : 'Expected Loss'
                      ]} 
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="exposure" fill="#2D5BFF" name="Exposition" />
                    <Bar yAxisId="right" dataKey="el" fill="#FF3B5B" name="Expected Loss" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <h3 className="font-medium text-lg mt-8">Métriques de Risque par Notation</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Notation</TableHead>
                    <TableHead className="text-right">Nombre de Prêts</TableHead>
                    <TableHead className="text-right">Exposition</TableHead>
                    <TableHead className="text-right">PD Moyenne</TableHead>
                    <TableHead className="text-right">LGD Moyenne</TableHead>
                    <TableHead className="text-right">Expected Loss</TableHead>
                    <TableHead className="text-right">Densité RWA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.reduce((acc, loan) => {
                    const existingItem = acc.find(item => item.rating === loan.internalRating);
                    if (existingItem) {
                      existingItem.count += 1;
                      existingItem.exposure += loan.outstandingAmount;
                      existingItem.pdWeighted += loan.pd * loan.outstandingAmount;
                      existingItem.lgdWeighted += loan.lgd * loan.outstandingAmount;
                      existingItem.el += loan.metrics?.expectedLoss || 0;
                      existingItem.rwa += loan.metrics?.rwa || 0;
                    } else {
                      acc.push({
                        rating: loan.internalRating,
                        count: 1,
                        exposure: loan.outstandingAmount,
                        pdWeighted: loan.pd * loan.outstandingAmount,
                        lgdWeighted: loan.lgd * loan.outstandingAmount,
                        el: loan.metrics?.expectedLoss || 0,
                        rwa: loan.metrics?.rwa || 0
                      });
                    }
                    return acc;
                  }, [] as { 
                    rating: string; 
                    count: number; 
                    exposure: number; 
                    pdWeighted: number; 
                    lgdWeighted: number; 
                    el: number; 
                    rwa: number 
                  }[]).map(item => (
                    <TableRow key={item.rating}>
                      <TableCell className="font-medium">{item.rating}</TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.exposure)}</TableCell>
                      <TableCell className="text-right">{((item.pdWeighted / item.exposure) * 100).toFixed(2)}%</TableCell>
                      <TableCell className="text-right">{((item.lgdWeighted / item.exposure) * 100).toFixed(0)}%</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.el)}</TableCell>
                      <TableCell className="text-right">{((item.rwa / item.exposure) * 100).toFixed(0)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link to="/analytics/risk">
                  Analyse de Risque Avancée
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Portfolio;


import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PieChart, 
  LineChart, 
  BarChart, 
  ComposedChart, 
  ResponsiveContainer, 
  Pie, 
  Cell, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Bar, 
  Area 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  CreditCard, 
  BadgePercent, 
  BarChart3, 
  UserCheck 
} from 'lucide-react';
import { samplePortfolio, defaultCalculationParameters } from '../data/sampleData';
import { calculatePortfolioMetrics, calculateLoanMetrics } from '../utils/financialCalculations';
import { Loan } from '../types/finance';

const COLORS = ['#00C48C', '#2D5BFF', '#FFB800', '#FF3B5B', '#1A2C42'];

const Dashboard = () => {
  const [portfolio, setPortfolio] = useState(samplePortfolio);
  const [portfolioMetrics, setPortfolioMetrics] = useState(portfolio.metrics);
  
  useEffect(() => {
    // Calculer les métriques pour chaque prêt
    const updatedLoans = portfolio.loans.map(loan => {
      const metrics = calculateLoanMetrics(loan, defaultCalculationParameters);
      return { ...loan, metrics };
    });
    
    // Mettre à jour les métriques du portefeuille
    const updatedMetrics = calculatePortfolioMetrics(updatedLoans, defaultCalculationParameters);
    
    setPortfolio({
      ...portfolio,
      loans: updatedLoans,
      metrics: updatedMetrics
    });
    
    setPortfolioMetrics(updatedMetrics);
  }, []);
  
  // Données pour le graphique de répartition des expositions par secteur
  const sectorData = portfolio.loans.reduce((acc, loan) => {
    const existingSector = acc.find(item => item.name === loan.sector);
    if (existingSector) {
      existingSector.value += loan.originalAmount;
    } else {
      acc.push({ name: loan.sector, value: loan.originalAmount });
    }
    return acc;
  }, [] as { name: string; value: number }[]);
  
  // Données pour l'évolution des EVA par rapport au P&L
  const evaVsPnlData = [
    { name: 'Q1 2023', eva: 1200000, pnl: 1450000 },
    { name: 'Q2 2023', eva: 1350000, pnl: 1550000 },
    { name: 'Q3 2023', eva: 1100000, pnl: 1400000 },
    { name: 'Q4 2023', eva: 1500000, pnl: 1700000 },
    { name: 'Q1 2024', eva: 1650000, pnl: 1800000 },
  ];
  
  // Données pour l'évolution des encours, RWA, EL par trimestre
  const exposureData = [
    { name: 'Q1 2023', exposure: 65000000, rwa: 35000000, el: 750000 },
    { name: 'Q2 2023', exposure: 68000000, rwa: 36500000, el: 800000 },
    { name: 'Q3 2023', exposure: 70000000, rwa: 38000000, el: 820000 },
    { name: 'Q4 2023', exposure: 72000000, rwa: 39500000, el: 850000 },
    { name: 'Q1 2024', exposure: 75000000, rwa: 41000000, el: 880000 },
  ];
  
  // Données pour le graphique des Top 5 prêts par EVA
  const topLoansByEva = portfolio.loans
    .slice()
    .sort((a, b) => (b.metrics?.evaIntrinsic || 0) - (a.metrics?.evaIntrinsic || 0))
    .slice(0, 5)
    .map(loan => ({
      name: loan.name,
      eva: loan.metrics?.evaIntrinsic || 0,
      roe: (loan.metrics?.roe || 0) * 100
    }));
  
  // Formatter pour afficher les montants en euros
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR', 
      maximumFractionDigits: 0 
    }).format(value);
  };
  
  return (
    <div className="dashboard-grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* KPIs Row */}
      <Card className="financial-card col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <DollarSign className="h-5 w-5 mr-1 text-financial-blue" />
            Exposition Totale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {formatCurrency(portfolioMetrics.totalExposure)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Tiré: {formatCurrency(portfolioMetrics.totalDrawn)}
          </p>
        </CardContent>
      </Card>
      
      <Card className="financial-card col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <BarChart3 className="h-5 w-5 mr-1 text-financial-green" />
            ROE Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold flex items-center">
            {(portfolioMetrics.portfolioROE * 100).toFixed(2)}%
            {portfolioMetrics.portfolioROE > defaultCalculationParameters.targetROE ? (
              <TrendingUp className="ml-2 h-5 w-5 text-financial-green" />
            ) : (
              <TrendingDown className="ml-2 h-5 w-5 text-financial-red" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Cible: {(defaultCalculationParameters.targetROE * 100).toFixed(2)}%
          </p>
        </CardContent>
      </Card>
      
      <Card className="financial-card col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <AlertTriangle className="h-5 w-5 mr-1 text-financial-yellow" />
            Expected Loss
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {formatCurrency(portfolioMetrics.totalExpectedLoss)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {((portfolioMetrics.totalExpectedLoss / portfolioMetrics.totalExposure) * 100).toFixed(2)}% du portefeuille
          </p>
        </CardContent>
      </Card>
      
      {/* Tabs for charts */}
      <div className="col-span-1 lg:col-span-3">
        <Tabs defaultValue="exposure" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="exposure">Exposition</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="risk">Risque</TabsTrigger>
            <TabsTrigger value="eva">EVA</TabsTrigger>
          </TabsList>
          
          {/* Exposition Tab */}
          <TabsContent value="exposure" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="financial-card">
                <CardHeader>
                  <CardTitle>Répartition par Secteur</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sectorData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {sectorData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="financial-card">
                <CardHeader>
                  <CardTitle>Évolution des Expositions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={exposureData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip formatter={(value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)} />
                        <Legend />
                        <Area type="monotone" dataKey="exposure" yAxisId="left" stroke="#2D5BFF" fill="#2D5BFF" fillOpacity={0.1} />
                        <Bar dataKey="rwa" yAxisId="left" barSize={20} fill="#00C48C" />
                        <Line type="monotone" dataKey="el" yAxisId="right" stroke="#FF3B5B" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card className="financial-card">
              <CardHeader>
                <CardTitle>EVA vs P&L</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={evaVsPnlData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)} />
                      <Legend />
                      <Bar dataKey="eva" fill="#2D5BFF" name="EVA" />
                      <Bar dataKey="pnl" fill="#00C48C" name="P&L" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Risk Tab */}
          <TabsContent value="risk" className="space-y-6">
            <Card className="financial-card">
              <CardHeader>
                <CardTitle>Distribution des PD/LGD</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={samplePortfolio.loans.map(loan => ({
                        name: loan.name,
                        pd: loan.pd * 100,
                        lgd: loan.lgd * 100,
                        exposure: loan.originalAmount
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" label={{ value: 'PD/LGD (%)', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'Exposure (€)', angle: 90, position: 'insideRight' }} />
                      <Tooltip formatter={(value: number, name: string) => [
                        name === 'exposure' 
                          ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
                          : `${value.toFixed(2)}%`,
                        name === 'pd' ? 'PD' : name === 'lgd' ? 'LGD' : 'Exposure'
                      ]} />
                      <Legend />
                      <Bar dataKey="pd" yAxisId="left" fill="#FF3B5B" name="PD (%)" />
                      <Bar dataKey="lgd" yAxisId="left" fill="#FFB800" name="LGD (%)" />
                      <Line type="monotone" dataKey="exposure" yAxisId="right" stroke="#2D5BFF" name="Exposure (€)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* EVA Tab */}
          <TabsContent value="eva" className="space-y-6">
            <Card className="financial-card">
              <CardHeader>
                <CardTitle>Top 5 Prêts par EVA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topLoansByEva}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" label={{ value: 'EVA (€)', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'ROE (%)', angle: 90, position: 'insideRight' }} />
                      <Tooltip formatter={(value: number, name: string) => [
                        name === 'eva' 
                          ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
                          : `${value.toFixed(2)}%`,
                        name === 'eva' ? 'EVA' : 'ROE'
                      ]} />
                      <Legend />
                      <Bar dataKey="eva" yAxisId="left" fill="#00C48C" name="EVA" />
                      <Line type="monotone" dataKey="roe" yAxisId="right" stroke="#2D5BFF" name="ROE (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;

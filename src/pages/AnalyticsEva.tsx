
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  ResponsiveContainer, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { samplePortfolio, defaultCalculationParameters } from '@/data/sampleData';
import { calculatePortfolioMetrics } from '@/utils/financialCalculations';

const COLORS = ['#00C48C', '#2D5BFF', '#FFB800', '#FF3B5B', '#1A2C42'];

const AnalyticsEva = () => {
  const [portfolioMetrics] = useState(calculatePortfolioMetrics(
    samplePortfolio.loans, 
    defaultCalculationParameters
  ));
  
  // Top 5 des prêts par EVA
  const topLoansByEva = [...samplePortfolio.loans]
    .sort((a, b) => b.metrics.evaIntrinsic - a.metrics.evaIntrinsic)
    .slice(0, 5)
    .map(loan => ({
      name: loan.name,
      evaIntrinsic: loan.metrics.evaIntrinsic,
      roe: loan.metrics.roe * 100
    }));
  
  // Données pour EVA vs PnL par trimestre (données simulées)
  const evaVsPnlData = [
    { name: 'Q1 2023', eva: 1200000, pnl: 1450000 },
    { name: 'Q2 2023', eva: 1350000, pnl: 1550000 },
    { name: 'Q3 2023', eva: 1100000, pnl: 1400000 },
    { name: 'Q4 2023', eva: 1500000, pnl: 1700000 },
    { name: 'Q1 2024', eva: 1650000, pnl: 1800000 },
  ];
  
  // Répartition de l'EVA par secteur
  const evaBySector = samplePortfolio.loans.reduce((acc, loan) => {
    const existingSector = acc.find(item => item.name === loan.sector);
    if (existingSector) {
      existingSector.value += loan.metrics.evaIntrinsic;
    } else {
      acc.push({ name: loan.sector, value: loan.metrics.evaIntrinsic });
    }
    return acc;
  }, [] as { name: string; value: number }[]);
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">EVA Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">EVA Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR', 
                maximumFractionDigits: 0 
              }).format(portfolioMetrics.evaSumIntrinsic)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">EVA Moyenne par Prêt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR', 
                maximumFractionDigits: 0 
              }).format(portfolioMetrics.evaSumIntrinsic / samplePortfolio.loans.length)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Écart EVA/ROE Cible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {((portfolioMetrics.portfolioROE / defaultCalculationParameters.targetROE) * 100 - 100).toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="top-loans">
        <TabsList>
          <TabsTrigger value="top-loans">Top 5 Prêts</TabsTrigger>
          <TabsTrigger value="eva-evolution">Évolution EVA</TabsTrigger>
          <TabsTrigger value="sector-distribution">Distribution Sectorielle</TabsTrigger>
        </TabsList>
        
        <TabsContent value="top-loans">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Prêts par EVA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topLoansByEva}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value: number, name: string) => [
                      name === 'evaIntrinsic' 
                        ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
                        : `${value.toFixed(2)}%`,
                      name === 'evaIntrinsic' ? 'EVA' : 'ROE'
                    ]} />
                    <Legend />
                    <Bar dataKey="evaIntrinsic" yAxisId="left" fill="#00C48C" name="EVA" />
                    <Line type="monotone" dataKey="roe" yAxisId="right" stroke="#2D5BFF" name="ROE (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="eva-evolution">
          <Card>
            <CardHeader>
              <CardTitle>Évolution EVA vs P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evaVsPnlData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => 
                      new Intl.NumberFormat('fr-FR', { 
                        style: 'currency', 
                        currency: 'EUR', 
                        maximumFractionDigits: 0 
                      }).format(value)
                    } />
                    <Legend />
                    <Bar dataKey="eva" fill="#2D5BFF" name="EVA" />
                    <Bar dataKey="pnl" fill="#00C48C" name="P&L" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sector-distribution">
          <Card>
            <CardHeader>
              <CardTitle>Répartition de l'EVA par Secteur</CardTitle>
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
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {evaBySector.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => 
                        new Intl.NumberFormat('fr-FR', { 
                          style: 'currency', 
                          currency: 'EUR', 
                          maximumFractionDigits: 0 
                        }).format(value)
                      }
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsEva;

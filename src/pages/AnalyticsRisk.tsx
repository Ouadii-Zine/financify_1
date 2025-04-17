
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PieChart, 
  ResponsiveContainer, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ZAxis,
  BarChart,
  Bar
} from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { samplePortfolio, defaultCalculationParameters } from '@/data/sampleData';
import { calculatePortfolioMetrics } from '@/utils/financialCalculations';

const COLORS = ['#00C48C', '#2D5BFF', '#FFB800', '#FF3B5B', '#1A2C42'];

const AnalyticsRisk = () => {
  const portfolioMetrics = calculatePortfolioMetrics(
    samplePortfolio.loans, 
    defaultCalculationParameters
  );
  
  // Données pour la répartition des Expected Loss par secteur
  const elBySector = samplePortfolio.loans.reduce((acc, loan) => {
    const sector = loan.sector;
    const el = loan.pd * loan.lgd * loan.ead;
    
    const existingSector = acc.find(item => item.name === sector);
    if (existingSector) {
      existingSector.value += el;
    } else {
      acc.push({ name: sector, value: el });
    }
    
    return acc;
  }, [] as { name: string; value: number }[]);
  
  // Données pour le graphique PD vs LGD
  const pdLgdData = samplePortfolio.loans.map(loan => ({
    name: loan.name,
    pd: loan.pd * 100,
    lgd: loan.lgd * 100,
    exposure: loan.originalAmount,
    el: loan.pd * loan.lgd * loan.ead
  }));
  
  // Top 5 des prêts par Expected Loss
  const topLoansByEL = [...samplePortfolio.loans]
    .sort((a, b) => (b.pd * b.lgd * b.ead) - (a.pd * a.lgd * a.ead))
    .slice(0, 5)
    .map(loan => ({
      name: loan.name,
      expectedLoss: loan.pd * loan.lgd * loan.ead,
      costOfRisk: (loan.pd * loan.lgd * loan.ead) / loan.drawnAmount * 100
    }));
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analyse de Risque</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <AlertTriangle className="h-5 w-5 mr-1 text-financial-yellow" />
              Expected Loss Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR', 
                maximumFractionDigits: 0 
              }).format(portfolioMetrics.totalExpectedLoss)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {((portfolioMetrics.totalExpectedLoss / portfolioMetrics.totalExposure) * 100).toFixed(2)}% du portefeuille
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">PD Moyenne Pondérée</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(portfolioMetrics.weightedAveragePD * 100).toFixed(2)}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">LGD Moyenne Pondérée</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(portfolioMetrics.weightedAverageLGD * 100).toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="el-distribution">
        <TabsList>
          <TabsTrigger value="el-distribution">Distribution des EL</TabsTrigger>
          <TabsTrigger value="pd-lgd-map">Cartographie PD/LGD</TabsTrigger>
          <TabsTrigger value="top-risky-loans">Prêts Plus Risqués</TabsTrigger>
        </TabsList>
        
        <TabsContent value="el-distribution">
          <Card>
            <CardHeader>
              <CardTitle>Répartition des Expected Loss par Secteur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={elBySector}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {elBySector.map((entry, index) => (
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
        
        <TabsContent value="pd-lgd-map">
          <Card>
            <CardHeader>
              <CardTitle>Cartographie PD/LGD</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis 
                      type="number" 
                      dataKey="pd" 
                      name="PD" 
                      unit="%" 
                      domain={[0, 'dataMax']} 
                      label={{ value: 'PD (%)', position: 'insideBottomRight', offset: -10 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="lgd" 
                      name="LGD" 
                      unit="%" 
                      domain={[0, 'dataMax']} 
                      label={{ value: 'LGD (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <ZAxis 
                      type="number" 
                      dataKey="exposure" 
                      name="Exposition" 
                      range={[50, 1000]} 
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'exposure' 
                          ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
                          : `${value.toFixed(2)}%`,
                        name === 'pd' ? 'PD' : name === 'lgd' ? 'LGD' : 'Exposition'
                      ]}
                      cursor={{ strokeDasharray: '3 3' }}
                    />
                    <Legend />
                    <Scatter name="Prêts" data={pdLgdData} fill="#FF3B5B" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="top-risky-loans">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Prêts par Expected Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topLoansByEL}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'expectedLoss' 
                          ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
                          : `${value.toFixed(2)}%`,
                        name === 'expectedLoss' ? 'Expected Loss' : 'Coût du Risque'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="expectedLoss" yAxisId="left" fill="#FF3B5B" name="Expected Loss" />
                    <Bar dataKey="costOfRisk" yAxisId="right" fill="#FFB800" name="Coût du Risque (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsRisk;

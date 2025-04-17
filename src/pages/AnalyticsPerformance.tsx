
import React from 'react';
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
  ComposedChart,
  Line,
  Area
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { samplePortfolio, defaultCalculationParameters } from '@/data/sampleData';
import { calculatePortfolioMetrics } from '@/utils/financialCalculations';

const AnalyticsPerformance = () => {
  const portfolioMetrics = calculatePortfolioMetrics(
    samplePortfolio.loans, 
    defaultCalculationParameters
  );
  
  // Top 5 des prêts par ROE
  const topLoansByROE = [...samplePortfolio.loans]
    .sort((a, b) => b.metrics.roe - a.metrics.roe)
    .slice(0, 5)
    .map(loan => ({
      name: loan.name,
      roe: loan.metrics.roe * 100,
      raroc: loan.metrics.raroc * 100
    }));
  
  // Données pour l'évolution des performances (données simulées)
  const performanceEvolutionData = [
    { name: 'Q1 2023', roe: 9.2, raroc: 10.5, targetRoe: 10 },
    { name: 'Q2 2023', roe: 9.5, raroc: 10.8, targetRoe: 10 },
    { name: 'Q3 2023', roe: 9.8, raroc: 11.2, targetRoe: 10 },
    { name: 'Q4 2023', roe: 10.2, raroc: 11.5, targetRoe: 10 },
    { name: 'Q1 2024', roe: 10.5, raroc: 11.8, targetRoe: 10 },
  ];
  
  // Données pour le graphique des marges (données simulées)
  const marginAnalysisData = samplePortfolio.loans.map(loan => ({
    name: loan.name.substring(0, 15) + (loan.name.length > 15 ? '...' : ''),
    margin: loan.margin * 100,
    netMargin: loan.metrics.netMargin * 100,
    costOfRisk: loan.metrics.costOfRisk * 100
  }));
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analyse de Performance</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <TrendingUp className="h-5 w-5 mr-1 text-financial-green" />
              ROE Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(portfolioMetrics.portfolioROE * 100).toFixed(2)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Cible: {(defaultCalculationParameters.targetROE * 100).toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">RAROC Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(portfolioMetrics.portfolioRAROC * 100).toFixed(2)}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Capital Consommé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR', 
                maximumFractionDigits: 0 
              }).format(portfolioMetrics.totalRWA * defaultCalculationParameters.capitalRatio)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {(portfolioMetrics.totalRWA * defaultCalculationParameters.capitalRatio / portfolioMetrics.totalExposure * 100).toFixed(2)}% de l'exposition
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="top-performers">
        <TabsList>
          <TabsTrigger value="top-performers">Top Performers</TabsTrigger>
          <TabsTrigger value="performance-evolution">Évolution Performance</TabsTrigger>
          <TabsTrigger value="margin-analysis">Analyse des Marges</TabsTrigger>
        </TabsList>
        
        <TabsContent value="top-performers">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Prêts par ROE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topLoansByROE}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis unit="%" />
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                    <Legend />
                    <Bar dataKey="roe" fill="#00C48C" name="ROE" />
                    <Bar dataKey="raroc" fill="#2D5BFF" name="RAROC" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance-evolution">
          <Card>
            <CardHeader>
              <CardTitle>Évolution de la Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={performanceEvolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis unit="%" />
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="roe" 
                      stroke="#00C48C" 
                      name="ROE" 
                      strokeWidth={2} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="raroc" 
                      stroke="#2D5BFF" 
                      name="RAROC" 
                      strokeWidth={2} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="targetRoe" 
                      stroke="#FF3B5B" 
                      name="ROE Cible" 
                      strokeDasharray="5 5" 
                      strokeWidth={2} 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="margin-analysis">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des Marges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={marginAnalysisData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" unit="%" />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                    <Legend />
                    <Bar dataKey="margin" fill="#2D5BFF" name="Marge Brute" />
                    <Bar dataKey="netMargin" fill="#00C48C" name="Marge Nette" />
                    <Area 
                      type="monotone" 
                      dataKey="costOfRisk" 
                      fill="#FF3B5B" 
                      stroke="#FF3B5B" 
                      name="Coût du Risque" 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPerformance;

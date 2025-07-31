
import React, { useState, useEffect } from 'react';
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
import { calculatePortfolioMetrics, calculateLoanMetrics } from '@/utils/financialCalculations';
import ParameterService from '@/services/ParameterService';
import { formatCurrency as formatCurrencyUtil, convertCurrency, convertLoanAmountToDisplayCurrency, CURRENCY_SYMBOLS } from '@/utils/currencyUtils';
import { Currency } from '@/types/finance';

const AnalyticsPerformance = () => {
  // Ajout de la gestion de la devise
  const [currentCurrency, setCurrentCurrency] = useState<Currency>('USD');
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number>(1.0);
  const [eurToUsdRate, setEurToUsdRate] = useState<number>(1.0968);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 1 });

  useEffect(() => {
    // Charger la configuration de la devise
    const loadCurrencySettings = async () => {
      const parameters = ParameterService.loadParameters();
      if (parameters.currency) {
        setCurrentCurrency(parameters.currency);
      }
      if (parameters.exchangeRate) {
        setCurrentExchangeRate(parameters.exchangeRate);
      }
      // Récupérer tous les taux de change
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.ok) {
          const data = await response.json();
          setExchangeRates(data.rates || { USD: 1 });
          const eurRate = data.rates?.EUR;
          if (eurRate) {
            setEurToUsdRate(eurRate);
          }
        }
      } catch (error) {
        setEurToUsdRate(0.9689);
        setExchangeRates({ USD: 1, EUR: 0.9689 });
      }
    };
    loadCurrencySettings();
    // Écouter les changements de paramètres
    const handleParametersUpdated = async () => {
      const parameters = ParameterService.loadParameters();
      if (parameters.currency) {
        setCurrentCurrency(parameters.currency);
      }
      if (parameters.exchangeRate) {
        setCurrentExchangeRate(parameters.exchangeRate);
      }
      // Mettre à jour tous les taux de change
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.ok) {
          const data = await response.json();
          setExchangeRates(data.rates || { USD: 1 });
          const eurRate = data.rates?.EUR;
          if (eurRate) {
            setEurToUsdRate(eurRate);
          }
        }
      } catch (error) {}
    };
    window.addEventListener('parameters-updated', handleParametersUpdated);
    return () => {
      window.removeEventListener('parameters-updated', handleParametersUpdated);
    };
  }, []);

  // Fonction utilitaire pour formater la devise
  const formatCurrency = (value) => {
    const convertedValue = convertLoanAmountToDisplayCurrency(value, 'EUR', currentCurrency, exchangeRates, eurToUsdRate);
    return formatCurrencyUtil(convertedValue, currentCurrency, { maximumFractionDigits: 0 });
  };

  // Recalculer les métriques pour chaque prêt du samplePortfolio
  const loansWithMetrics = samplePortfolio.loans.map(loan => ({
    ...loan,
    metrics: calculateLoanMetrics(loan, defaultCalculationParameters)
  }));

  const portfolioMetrics = calculatePortfolioMetrics(
    loansWithMetrics,
    defaultCalculationParameters
  );
  
  // Top 5 loans by ROE
  const topLoansByROE = [...loansWithMetrics]
    .sort((a, b) => b.metrics.roe - a.metrics.roe)
    .slice(0, 5)
    .map(loan => ({
      name: loan.name,
      roe: loan.metrics.roe * 100,
      raroc: loan.metrics.raroc * 100
    }));
  
  // Data for performance evolution (simulated data)
  const performanceEvolutionData = [
    { name: 'Q1 2023', roe: 9.2, raroc: 10.5, targetRoe: 10 },
    { name: 'Q2 2023', roe: 9.5, raroc: 10.8, targetRoe: 10 },
    { name: 'Q3 2023', roe: 9.8, raroc: 11.2, targetRoe: 10 },
    { name: 'Q4 2023', roe: 10.2, raroc: 11.5, targetRoe: 10 },
    { name: 'Q1 2024', roe: 10.5, raroc: 11.8, targetRoe: 10 },
  ];
  
  // Data for margin chart (simulated data)
  const marginAnalysisData = loansWithMetrics.map(loan => ({
    name: loan.name.substring(0, 15) + (loan.name.length > 15 ? '...' : ''),
    margin: loan.margin * 100,
    netMargin: loan.metrics.netMargin * 100,
    costOfRisk: loan.metrics.costOfRisk * 100
  }));
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Performance Analysis</h1>
      
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
              Target: {(defaultCalculationParameters.targetROE * 100).toFixed(2)}%
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
            <CardTitle className="text-lg">Capital Consumed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(portfolioMetrics.totalRWA * defaultCalculationParameters.capitalRatio)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {(portfolioMetrics.totalRWA * defaultCalculationParameters.capitalRatio / portfolioMetrics.totalExposure * 100).toFixed(2)}% of exposure
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="top-performers">
        <TabsList>
          <TabsTrigger value="top-performers">Top Performers</TabsTrigger>
          <TabsTrigger value="performance-evolution">Performance Evolution</TabsTrigger>
          <TabsTrigger value="margin-analysis">Margin Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="top-performers">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Loans by ROE</CardTitle>
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
              <CardTitle>Performance Evolution</CardTitle>
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
                      name="Target ROE" 
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
              <CardTitle>Margin Analysis</CardTitle>
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
                    <Bar dataKey="margin" fill="#2D5BFF" name="Gross Margin" />
                    <Bar dataKey="netMargin" fill="#00C48C" name="Net Margin" />
                    <Area 
                      type="monotone" 
                      dataKey="costOfRisk" 
                      fill="#FF3B5B" 
                      stroke="#FF3B5B" 
                      name="Cost of Risk" 
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

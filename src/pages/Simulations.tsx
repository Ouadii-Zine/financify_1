
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
  Line,
  ComposedChart,
  Area
} from 'recharts';
import { 
  Slider 
} from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
import { samplePortfolio, defaultCalculationParameters } from '@/data/sampleData';
import { calculatePortfolioMetrics, simulateScenario } from '@/utils/financialCalculations';

const Simulations = () => {
  const baseMetrics = calculatePortfolioMetrics(
    samplePortfolio.loans, 
    defaultCalculationParameters
  );
  
  const [pdMultiplier, setPdMultiplier] = useState(1);
  const [lgdMultiplier, setLgdMultiplier] = useState(1);
  const [rateShift, setRateShift] = useState(0);
  const [spreadShift, setSpreadShift] = useState(0);
  const [scenarioName, setScenarioName] = useState("Mon Scénario");
  
  // Simuler le scénario avec les paramètres actuels
  const simulatedMetrics = simulateScenario(
    samplePortfolio.loans, 
    defaultCalculationParameters,
    pdMultiplier,
    lgdMultiplier,
    rateShift / 100, // Convertir les points de base en pourcentage
    spreadShift / 100 // Convertir les points de base en pourcentage
  );
  
  // Calculer les variations pour affichage
  const variations = {
    el: simulatedMetrics.totalExpectedLoss - baseMetrics.totalExpectedLoss,
    elPercent: (simulatedMetrics.totalExpectedLoss / baseMetrics.totalExpectedLoss - 1) * 100,
    rwa: simulatedMetrics.totalRWA - baseMetrics.totalRWA,
    rwaPercent: (simulatedMetrics.totalRWA / baseMetrics.totalRWA - 1) * 100,
    roe: simulatedMetrics.portfolioROE - baseMetrics.portfolioROE,
    roePercent: (simulatedMetrics.portfolioROE / baseMetrics.portfolioROE - 1) * 100,
    eva: simulatedMetrics.evaSumIntrinsic - baseMetrics.evaSumIntrinsic,
    evaPercent: (simulatedMetrics.evaSumIntrinsic / baseMetrics.evaSumIntrinsic - 1) * 100
  };
  
  // Données pour les graphiques de comparaison (avant/après scénario)
  const compareData = [
    { name: 'Expected Loss', base: baseMetrics.totalExpectedLoss, scenario: simulatedMetrics.totalExpectedLoss },
    { name: 'RWA', base: baseMetrics.totalRWA / 1000000, scenario: simulatedMetrics.totalRWA / 1000000 },
    { name: 'EVA', base: baseMetrics.evaSumIntrinsic, scenario: simulatedMetrics.evaSumIntrinsic }
  ];
  
  // Données pour l'analyse de sensibilité
  const sensitivityData = [
    { 
      name: 'PD +10%', 
      el: simulateScenario(samplePortfolio.loans, defaultCalculationParameters, 1.1, 1, 0, 0).totalExpectedLoss,
      rwa: simulateScenario(samplePortfolio.loans, defaultCalculationParameters, 1.1, 1, 0, 0).totalRWA,
      roe: simulateScenario(samplePortfolio.loans, defaultCalculationParameters, 1.1, 1, 0, 0).portfolioROE * 100
    },
    { 
      name: 'LGD +10%', 
      el: simulateScenario(samplePortfolio.loans, defaultCalculationParameters, 1, 1.1, 0, 0).totalExpectedLoss,
      rwa: simulateScenario(samplePortfolio.loans, defaultCalculationParameters, 1, 1.1, 0, 0).totalRWA,
      roe: simulateScenario(samplePortfolio.loans, defaultCalculationParameters, 1, 1.1, 0, 0).portfolioROE * 100
    },
    { 
      name: 'Rates +50bp', 
      el: simulateScenario(samplePortfolio.loans, defaultCalculationParameters, 1, 1, 0.005, 0).totalExpectedLoss,
      rwa: simulateScenario(samplePortfolio.loans, defaultCalculationParameters, 1, 1, 0.005, 0).totalRWA,
      roe: simulateScenario(samplePortfolio.loans, defaultCalculationParameters, 1, 1, 0.005, 0).portfolioROE * 100
    },
    { 
      name: 'Spread +50bp', 
      el: simulateScenario(samplePortfolio.loans, defaultCalculationParameters, 1, 1, 0, 0.005).totalExpectedLoss,
      rwa: simulateScenario(samplePortfolio.loans, defaultCalculationParameters, 1, 1, 0, 0.005).totalRWA,
      roe: simulateScenario(samplePortfolio.loans, defaultCalculationParameters, 1, 1, 0, 0.005).portfolioROE * 100
    },
    { 
      name: 'Combiné', 
      el: simulateScenario(samplePortfolio.loans, defaultCalculationParameters, 1.1, 1.1, 0.005, 0.005).totalExpectedLoss,
      rwa: simulateScenario(samplePortfolio.loans, defaultCalculationParameters, 1.1, 1.1, 0.005, 0.005).totalRWA,
      roe: simulateScenario(samplePortfolio.loans, defaultCalculationParameters, 1.1, 1.1, 0.005, 0.005).portfolioROE * 100
    }
  ];
  
  const handleResetSimulation = () => {
    setPdMultiplier(1);
    setLgdMultiplier(1);
    setRateShift(0);
    setSpreadShift(0);
    setScenarioName("Mon Scénario");
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Simulations</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de Simulation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="scenario-name">Nom du Scénario</Label>
                <Input 
                  id="scenario-name" 
                  value={scenarioName} 
                  onChange={(e) => setScenarioName(e.target.value)} 
                  placeholder="Nom du scénario"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pd-multiplier">Multiplicateur PD: {pdMultiplier.toFixed(2)}x</Label>
                  <span className="text-sm text-muted-foreground">
                    {((pdMultiplier - 1) * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider 
                  id="pd-multiplier"
                  min={0.5} 
                  max={2} 
                  step={0.01} 
                  value={[pdMultiplier]} 
                  onValueChange={(values) => setPdMultiplier(values[0])} 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lgd-multiplier">Multiplicateur LGD: {lgdMultiplier.toFixed(2)}x</Label>
                  <span className="text-sm text-muted-foreground">
                    {((lgdMultiplier - 1) * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider 
                  id="lgd-multiplier"
                  min={0.5} 
                  max={2} 
                  step={0.01} 
                  value={[lgdMultiplier]} 
                  onValueChange={(values) => setLgdMultiplier(values[0])} 
                />
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rate-shift">Variation Taux: {rateShift} bp</Label>
                  <span className="text-sm text-muted-foreground">
                    {(rateShift / 100).toFixed(2)}%
                  </span>
                </div>
                <Slider 
                  id="rate-shift"
                  min={-200} 
                  max={200} 
                  step={1} 
                  value={[rateShift]} 
                  onValueChange={(values) => setRateShift(values[0])} 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="spread-shift">Variation Marges: {spreadShift} bp</Label>
                  <span className="text-sm text-muted-foreground">
                    {(spreadShift / 100).toFixed(2)}%
                  </span>
                </div>
                <Slider 
                  id="spread-shift"
                  min={-200} 
                  max={200} 
                  step={1} 
                  value={[spreadShift]} 
                  onValueChange={(values) => setSpreadShift(values[0])} 
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={handleResetSimulation}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Réinitialiser</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <AlertTriangle className="h-5 w-5 mr-1 text-financial-yellow" />
              Impact sur EL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR', 
                maximumFractionDigits: 0 
              }).format(variations.el)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {variations.elPercent > 0 ? '+' : ''}{variations.elPercent.toFixed(2)}% vs base
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <BarChart3 className="h-5 w-5 mr-1 text-financial-blue" />
              Impact sur RWA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR', 
                maximumFractionDigits: 0 
              }).format(variations.rwa)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {variations.rwaPercent > 0 ? '+' : ''}{variations.rwaPercent.toFixed(2)}% vs base
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <TrendingUp className="h-5 w-5 mr-1 text-financial-green" />
              Impact sur ROE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(variations.roe * 100).toFixed(2)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {variations.roePercent > 0 ? '+' : ''}{variations.roePercent.toFixed(2)}% vs base
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="comparison">
        <TabsList>
          <TabsTrigger value="comparison">Comparaison Scénario</TabsTrigger>
          <TabsTrigger value="sensitivity">Analyse de Sensibilité</TabsTrigger>
        </TabsList>
        
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Comparaison Base vs Scénario {scenarioName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compareData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => {
                        if (props.dataKey === 'base') {
                          return [
                            new Intl.NumberFormat('fr-FR', { 
                              style: 'currency', 
                              currency: 'EUR', 
                              maximumFractionDigits: 0 
                            }).format(value * (props.name === 'RWA' ? 1000000 : 1)),
                            'Base'
                          ];
                        } else {
                          return [
                            new Intl.NumberFormat('fr-FR', { 
                              style: 'currency', 
                              currency: 'EUR', 
                              maximumFractionDigits: 0 
                            }).format(value * (props.name === 'RWA' ? 1000000 : 1)),
                            'Scénario'
                          ];
                        }
                      }}
                    />
                    <Legend />
                    <Bar dataKey="base" fill="#2D5BFF" name="Base" />
                    <Bar dataKey="scenario" fill="#FF3B5B" name="Scénario" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-center text-xs text-muted-foreground mt-2">
                  * RWA affichés en millions d'euros
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sensitivity">
          <Card>
            <CardHeader>
              <CardTitle>Analyse de Sensibilité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={sensitivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'roe') {
                          return [`${value.toFixed(2)}%`, 'ROE'];
                        } else if (name === 'el') {
                          return [
                            new Intl.NumberFormat('fr-FR', { 
                              style: 'currency', 
                              currency: 'EUR', 
                              maximumFractionDigits: 0 
                            }).format(value),
                            'Expected Loss'
                          ];
                        } else {
                          return [
                            new Intl.NumberFormat('fr-FR', { 
                              style: 'currency', 
                              currency: 'EUR', 
                              maximumFractionDigits: 0 
                            }).format(value),
                            'RWA'
                          ];
                        }
                      }}
                    />
                    <Legend />
                    <Bar dataKey="el" yAxisId="left" fill="#FF3B5B" name="Expected Loss" />
                    <Bar dataKey="rwa" yAxisId="left" fill="#2D5BFF" name="RWA" barSize={20} />
                    <Line type="monotone" dataKey="roe" yAxisId="right" stroke="#00C48C" name="ROE (%)" />
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

export default Simulations;

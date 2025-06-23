
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, BarChart3, TrendingUp } from 'lucide-react';
import { samplePortfolio, defaultCalculationParameters } from '@/data/sampleData';
import { calculatePortfolioMetrics, simulateScenario } from '@/utils/financialCalculations';
import MetricCard from '@/components/simulations/MetricCard';
import SimulationControls from '@/components/simulations/SimulationControls';
import ComparisonChart from '@/components/simulations/ComparisonChart';
import SensitivityChart from '@/components/simulations/SensitivityChart';

const Simulations = () => {
  const baseMetrics = calculatePortfolioMetrics(
    samplePortfolio.loans, 
    defaultCalculationParameters
  );
  
  const [pdMultiplier, setPdMultiplier] = useState(1);
  const [lgdMultiplier, setLgdMultiplier] = useState(1);
  const [rateShift, setRateShift] = useState(0);
  const [spreadShift, setSpreadShift] = useState(0);
  const [scenarioName, setScenarioName] = useState("My Scenario");
  
  // Simuler le scénario avec les paramètres actuels
  const simulatedMetrics = simulateScenario(
    samplePortfolio.loans, 
    defaultCalculationParameters,
    pdMultiplier,
    lgdMultiplier,
    rateShift / 100,
    spreadShift / 100
  );
  
  const variations = {
    el: simulatedMetrics.totalExpectedLoss - baseMetrics.totalExpectedLoss,
    elPercent: (simulatedMetrics.totalExpectedLoss / baseMetrics.totalExpectedLoss - 1) * 100,
    rwa: simulatedMetrics.totalRWA - baseMetrics.totalRWA,
    rwaPercent: (simulatedMetrics.totalRWA / baseMetrics.totalRWA - 1) * 100,
    roe: simulatedMetrics.portfolioROE - baseMetrics.portfolioROE,
    roePercent: (simulatedMetrics.portfolioROE / baseMetrics.portfolioROE - 1) * 100,
  };

  const compareData = [
    { name: 'Expected Loss', base: baseMetrics.totalExpectedLoss, scenario: simulatedMetrics.totalExpectedLoss },
    { name: 'RWA', base: baseMetrics.totalRWA / 1000000, scenario: simulatedMetrics.totalRWA / 1000000 },
    { name: 'EVA', base: baseMetrics.evaSumIntrinsic, scenario: simulatedMetrics.evaSumIntrinsic }
  ];

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
      name: 'Combined', 
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
    setScenarioName("My Scenario");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Simulations</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Simulation Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <SimulationControls
            scenarioName={scenarioName}
            pdMultiplier={pdMultiplier}
            lgdMultiplier={lgdMultiplier}
            rateShift={rateShift}
            spreadShift={spreadShift}
            onScenarioNameChange={setScenarioName}
            onPdMultiplierChange={setPdMultiplier}
            onLgdMultiplierChange={setLgdMultiplier}
            onRateShiftChange={setRateShift}
            onSpreadShiftChange={setSpreadShift}
            onReset={handleResetSimulation}
          />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Impact on EL"
          icon={<AlertTriangle />}
          iconColor="text-financial-yellow"
          value={new Intl.NumberFormat('fr-FR', { 
            style: 'currency', 
            currency: 'EUR', 
            maximumFractionDigits: 0 
          }).format(variations.el)}
          percentageChange={variations.elPercent}
        />
        
        <MetricCard
          title="Impact on RWA"
          icon={<BarChart3 />}
          iconColor="text-financial

-blue"
          value={new Intl.NumberFormat('fr-FR', { 
            style: 'currency', 
            currency: 'EUR', 
            maximumFractionDigits: 0 
          }).format(variations.rwa)}
          percentageChange={variations.rwaPercent}
        />
        
        <MetricCard
          title="Impact on ROE"
          icon={<TrendingUp />}
          iconColor="text-financial-green"
          value={`${(variations.roe * 100).toFixed(2)}%`}
          percentageChange={variations.roePercent}
        />
      </div>
      
      <Tabs defaultValue="comparison">
        <TabsList>
          <TabsTrigger value="comparison">Scenario Comparison</TabsTrigger>
          <TabsTrigger value="sensitivity">Sensitivity Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Base vs Scenario {scenarioName} Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ComparisonChart data={compareData} scenarioName={scenarioName} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sensitivity">
          <Card>
            <CardHeader>
              <CardTitle>Sensitivity Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <SensitivityChart data={sensitivityData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Simulations;

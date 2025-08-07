import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CollateralPortfolio, 
  CollateralCategory,
  Currency 
} from '@/types/finance';
import CollateralService from '@/services/CollateralService';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Shield, 
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface CollateralAnalyticsProps {
  portfolio: CollateralPortfolio;
  currency: Currency;
}

const CollateralAnalytics: React.FC<CollateralAnalyticsProps> = ({ portfolio, currency }) => {
  const collateralService = CollateralService.getInstance();
  const compliance = collateralService.validateRegulatoryCompliance(portfolio);

  // Calculate category distribution
  const categoryDistribution = portfolio.items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.currentValue;
    return acc;
  }, {} as Record<CollateralCategory, number>);

  // Calculate risk level distribution
  const riskLevelDistribution = portfolio.items.reduce((acc, item) => {
    acc[item.riskLevel] = (acc[item.riskLevel] || 0) + item.currentValue;
    return acc;
  }, {} as Record<string, number>);

  // Get top 5 items by value
  const topItems = [...portfolio.items]
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 5);

  const getCategoryColor = (category: CollateralCategory) => {
    const colors: Record<CollateralCategory, string> = {
      realEstate: 'bg-blue-100 text-blue-800',
      equipment: 'bg-green-100 text-green-800',
      vehicle: 'bg-purple-100 text-purple-800',
      cash: 'bg-green-100 text-green-800',
      securities: 'bg-yellow-100 text-yellow-800',
      inventory: 'bg-orange-100 text-orange-800',
      receivables: 'bg-red-100 text-red-800',
      intellectualProperty: 'bg-indigo-100 text-indigo-800',
      commodities: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category];
  };

  const getRiskLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      veryHigh: 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getHQLAColor = (category: string) => {
    const colors: Record<string, string> = {
      level1: 'bg-green-100 text-green-800',
      level2a: 'bg-blue-100 text-blue-800',
      level2b: 'bg-yellow-100 text-yellow-800',
      ineligible: 'bg-red-100 text-red-800'
    };
    return colors[category];
  };

  return (
    <div className="space-y-6">
      {/* Risk Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Value at Risk (95%)</p>
                <p className="text-2xl font-bold">{currency} {portfolio.portfolioRiskMetrics.totalValueAtRisk.toLocaleString()}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <Progress 
              value={(portfolio.portfolioRiskMetrics.totalValueAtRisk / portfolio.totalValue) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expected Shortfall</p>
                <p className="text-2xl font-bold">{currency} {portfolio.portfolioRiskMetrics.expectedShortfall.toLocaleString()}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <Progress 
              value={(portfolio.portfolioRiskMetrics.expectedShortfall / portfolio.totalValue) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weighted Avg Volatility</p>
                <p className="text-2xl font-bold">{(portfolio.portfolioRiskMetrics.weightedAverageVolatility * 100).toFixed(1)}%</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
            <Progress 
              value={portfolio.portfolioRiskMetrics.weightedAverageVolatility * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Portfolio Beta</p>
                <p className="text-2xl font-bold">{portfolio.portfolioRiskMetrics.portfolioBeta.toFixed(2)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
            <Progress 
              value={Math.min(portfolio.portfolioRiskMetrics.portfolioBeta * 50, 100)} 
              className="mt-2" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Additional Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Diversification Score</p>
                <p className="text-2xl font-bold">{(portfolio.diversificationScore * 100).toFixed(1)}%</p>
              </div>
              <PieChart className="h-8 w-8 text-green-500" />
            </div>
            <Progress 
              value={portfolio.diversificationScore * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concentration Risk</p>
                <p className="text-2xl font-bold">{(portfolio.concentrationRisk * 100).toFixed(1)}%</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
            <Progress 
              value={portfolio.concentrationRisk * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Regulatory Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Regulatory Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <div className="flex items-center gap-3">
              {compliance.baselCompliant ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">Basel Compliant</p>
                <Badge variant={compliance.baselCompliant ? "default" : "destructive"}>
                  {compliance.baselCompliant ? "Yes" : "No"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {compliance.lcrEligible ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">LCR Eligible</p>
                <Badge variant={compliance.lcrEligible ? "default" : "destructive"}>
                  {compliance.lcrEligible ? "Yes" : "No"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium">HQLA Category</p>
                <Badge className={getHQLAColor(compliance.hqlaCategory)}>
                  {compliance.hqlaCategory.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium">Haircut %</p>
                <p className="text-lg font-semibold">
                  {(portfolio.regulatoryCompliance.haircutPercentage * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium">LCR Ratio</p>
                <p className="text-lg font-semibold">
                  {(compliance.regulatoryRatios.lcrRatio * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium">NSF Ratio</p>
                <p className="text-lg font-semibold">
                  {(compliance.regulatoryRatios.nsfRatio * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium">HQLA Ratio</p>
                <p className="text-lg font-semibold">
                  {(compliance.regulatoryRatios.hqlaRatio * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {compliance.issues.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Compliance Issues:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {compliance.issues.map((issue, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(categoryDistribution)
                .sort(([,a], [,b]) => b - a)
                .map(([category, value]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(category as CollateralCategory)}>
                        {category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {((value / portfolio.totalValue) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <span className="font-medium">
                      {currency} {value.toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Risk Level Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(riskLevelDistribution)
                .sort(([,a], [,b]) => b - a)
                .map(([level, value]) => (
                  <div key={level} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getRiskLevelColor(level)}>
                        {level}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {((value / portfolio.totalValue) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <span className="font-medium">
                      {currency} {value.toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Collateral Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Collateral Items by Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topItems.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getCategoryColor(item.category)}>
                    {item.category}
                  </Badge>
                  <Badge className={getRiskLevelColor(item.riskLevel)}>
                    {item.riskLevel}
                  </Badge>
                  <div className="text-right">
                    <div className="font-semibold">{currency} {item.currentValue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {(item.volatility * 100).toFixed(1)}% volatility
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stress Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Stress Test Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {portfolio.portfolioRiskMetrics.stressTestResults.map((result) => (
              <div key={result.scenario} className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">{result.scenario}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Portfolio Value:</span>
                    <span className="font-medium">{currency} {result.portfolioValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Loss Amount:</span>
                    <span className="font-medium text-red-600">
                      -{currency} {result.lossAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Impact %:</span>
                    <span className="font-medium text-red-600">
                      {result.impactPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CollateralAnalytics; 
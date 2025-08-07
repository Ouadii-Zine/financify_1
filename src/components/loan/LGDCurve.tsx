import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  ResponsiveContainer, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Info,
  Calculator
} from 'lucide-react';
import { Loan } from '@/types/finance';
import { 
  generateLGDCurveData, 
  calculateEffectiveLGD,
  calculateGuaranteedLGD,
  getRecommendedModel,
  CollateralType,
  LGDModel
} from '@/utils/lgdModels';
import CollateralService from '@/services/CollateralService';

interface LGDCurveProps {
  loan: Loan;
}

const LGDCurve: React.FC<LGDCurveProps> = ({ loan }) => {
  const [lgdData, setLgdData] = useState<Array<{ date: string; lgd: number; timeInYears: number }>>([]);
  const [currentLGD, setCurrentLGD] = useState<number>(0);

  useEffect(() => {
    // Calculate current LGD for all types
    const effectiveLGD = calculateEffectiveLGD(loan);
    setCurrentLGD(effectiveLGD);

    const startDate = new Date(loan.startDate);
    const endDate = new Date(loan.endDate);
    const loanDurationYears = (endDate.getTime() - startDate.getTime()) / (365 * 24 * 60 * 60 * 1000);

    // Generate curve data based on LGD type
    if (loan.lgdType === 'variable' && loan.lgdVariable) {
      // For variable LGD, use the mathematical model
      const data = generateLGDCurveData(loan.lgdVariable, startDate, endDate, 1);
      setLgdData(data);
    } else if (loan.lgdType === 'guaranteed' && loan.lgdGuaranteed) {
      // For guaranteed LGD, show the calculated final LGD with more data points
      const calculatedLGD = calculateGuaranteedLGD(loan.lgdGuaranteed);
      const data = [];
      const months = Math.ceil(loanDurationYears * 12);
      
      for (let i = 0; i <= months; i += Math.max(1, Math.floor(months / 12))) {
        const currentDate = new Date(startDate);
        currentDate.setMonth(currentDate.getMonth() + i);
        const timeInYears = i / 12;
        
        data.push({
          date: currentDate.toISOString().split('T')[0],
          lgd: calculatedLGD,
          timeInYears: timeInYears
        });
      }
      setLgdData(data);
    } else if (loan.lgdType === 'collateralized' && loan.collateralPortfolio) {
      // For collateralized LGD, calculate effective LGD with collateral and show more data points
      const collateralService = CollateralService.getInstance();
      const calculatedLGD = collateralService.calculateEffectiveLGD(
        loan.lgd || 0.45,
        loan.collateralPortfolio,
        loan.originalAmount,
        0.25
      );
      const data = [];
      const months = Math.ceil(loanDurationYears * 12);
      
      for (let i = 0; i <= months; i += Math.max(1, Math.floor(months / 12))) {
        const currentDate = new Date(startDate);
        currentDate.setMonth(currentDate.getMonth() + i);
        const timeInYears = i / 12;
        
        data.push({
          date: currentDate.toISOString().split('T')[0],
          lgd: calculatedLGD,
          timeInYears: timeInYears
        });
      }
      setLgdData(data);
    } else {
      // For constant LGD or default, use the calculated effective LGD with more data points
      const data = [];
      const months = Math.ceil(loanDurationYears * 12);
      
      for (let i = 0; i <= months; i += Math.max(1, Math.floor(months / 12))) {
        const currentDate = new Date(startDate);
        currentDate.setMonth(currentDate.getMonth() + i);
        const timeInYears = i / 12;
        
        data.push({
          date: currentDate.toISOString().split('T')[0],
          lgd: effectiveLGD,
          timeInYears: timeInYears
        });
      }
      setLgdData(data);
    }
  }, [loan]);

  // Get LGD type description
  const getLGDTypeDescription = () => {
    switch (loan.lgdType) {
      case 'constant':
        return 'Constant LGD - Fixed loss rate throughout loan term';
      case 'variable':
        return 'Variable LGD - Loss rate changes over time based on collateral value';
      case 'guaranteed':
        return 'Guaranteed LGD - Loss rate reduced by guarantee coverage';
      case 'collateralized':
        return 'Collateralized LGD - Loss rate based on collateral portfolio value';
      default:
        return 'Standard LGD - Fixed loss rate';
    }
  };

  // Get LGD type badge color
  const getLGDTypeBadgeColor = () => {
    switch (loan.lgdType) {
      case 'constant':
        return 'bg-blue-100 text-blue-800';
      case 'variable':
        return 'bg-green-100 text-green-800';
      case 'guaranteed':
        return 'bg-purple-100 text-purple-800';
      case 'collateralized':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const startDate = new Date(loan.startDate);
  const endDate = new Date(loan.endDate);
  const loanDurationYears = (endDate.getTime() - startDate.getTime()) / (365 * 24 * 60 * 60 * 1000);

  // Only get variable LGD details if it exists
  const variableDetails = loan.lgdType === 'variable' && loan.lgdVariable ? {
    type: loan.lgdVariable.type,
    model: loan.lgdVariable.model,
    initialValue: loan.lgdVariable.initialValue,
    parameters: loan.lgdVariable.parameters
  } : null;

  // Get model description
  const getModelDescription = (model: LGDModel, type: CollateralType): string => {
    switch (model) {
      case 'linear':
        return type === 'realEstate' 
          ? 'Linear appreciation model' 
          : 'Linear depreciation model';
      case 'exponential':
        return type === 'realEstate' 
          ? 'Exponential appreciation model' 
          : 'Exponential depreciation model';
      case 'logarithmic':
        return 'Logarithmic model (rapid initial change, then stabilization)';
      case 'polynomial':
        return 'Polynomial model (custom curve)';
      default:
        return 'Custom model';
    }
  };

  // Get trend indicator
  const getTrendIndicator = () => {
    if (lgdData.length < 2) return <Minus className="h-4 w-4 text-gray-500" />;
    
    const firstLGD = lgdData[0].lgd;
    const lastLGD = lgdData[lgdData.length - 1].lgd;
    
    if (lastLGD > firstLGD) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (lastLGD < firstLGD) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get trend description
  const getTrendDescription = () => {
    if (lgdData.length < 2) return 'No trend data';
    
    const firstLGD = lgdData[0].lgd;
    const lastLGD = lgdData[lgdData.length - 1].lgd;
    const change = ((lastLGD - firstLGD) / firstLGD) * 100;
    
    if (change > 0) {
      return `LGD increases by ${change.toFixed(1)}% over loan term`;
    } else if (change < 0) {
      return `LGD decreases by ${Math.abs(change).toFixed(1)}% over loan term`;
    } else {
      return 'LGD remains stable over loan term';
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
          <p className="text-sm text-muted-foreground">
            Time: {data.timeInYears.toFixed(1)} years
          </p>
          <p className="font-semibold">
            LGD: {(data.lgd * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          LGD Curve Analysis
        </CardTitle>
        <CardDescription>
          Loss Given Default evolution over time based on collateral value changes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Calculated LGD</p>
            <p className="text-2xl font-bold">{(currentLGD * 100).toFixed(1)}%</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">LGD Type</p>
            <Badge className={getLGDTypeBadgeColor()}>
              {loan.lgdType?.charAt(0).toUpperCase() + loan.lgdType?.slice(1) || 'Standard'}
            </Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {loan.lgdType === 'variable' ? 'Final LGD' : 'Effective LGD'}
            </p>
            <p className="text-2xl font-bold">
              {lgdData.length > 0 ? (lgdData[lgdData.length - 1].lgd * 100).toFixed(1) : '0.0'}%
            </p>
          </div>
        </div>

        {/* Model Information */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">LGD Configuration</h3>
            {loan.lgdType === 'variable' && getTrendIndicator()}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>LGD Type:</strong> <Badge className={getLGDTypeBadgeColor()}>{loan.lgdType?.charAt(0).toUpperCase() + loan.lgdType?.slice(1) || 'Standard'}</Badge></p>
              <p><strong>Loan Duration:</strong> {loanDurationYears.toFixed(1)} years</p>
              <p><strong>Description:</strong> {getLGDTypeDescription()}</p>
            </div>
            <div>
              {loan.lgdType === 'variable' && variableDetails && (
                <>
                  <p><strong>Collateral Type:</strong> <Badge variant="outline">{variableDetails.type}</Badge></p>
                  <p><strong>Model:</strong> <Badge variant="outline">{variableDetails.model}</Badge></p>
                  <p><strong>Initial LGD:</strong> {(variableDetails.initialValue * 100).toFixed(1)}%</p>
                  <p><strong>Trend:</strong> {getTrendDescription()}</p>
                  {variableDetails.parameters.depreciationRate && (
                    <p><strong>Depreciation Rate:</strong> {(variableDetails.parameters.depreciationRate * 100).toFixed(1)}%/year</p>
                  )}
                  {variableDetails.parameters.appreciationRate && (
                    <p><strong>Appreciation Rate:</strong> {(variableDetails.parameters.appreciationRate * 100).toFixed(1)}%/year</p>
                  )}
                </>
              )}
              {loan.lgdType === 'guaranteed' && loan.lgdGuaranteed && (
                <>
                  <p><strong>Base LGD:</strong> {(loan.lgdGuaranteed.baseLGD * 100).toFixed(1)}%</p>
                  <p><strong>Guarantee Type:</strong> <Badge variant="outline">{loan.lgdGuaranteed.guaranteeType}</Badge></p>
                  <p><strong>Coverage:</strong> {(loan.lgdGuaranteed.coverage * 100).toFixed(1)}%</p>
                  <p><strong>Guarantor LGD:</strong> {(loan.lgdGuaranteed.guarantorLGD * 100).toFixed(1)}%</p>
                  <p><strong>Calculation:</strong> {(loan.lgdGuaranteed.baseLGD * 100).toFixed(1)}% × (1 - {(loan.lgdGuaranteed.coverage * 100).toFixed(1)}%) + {(loan.lgdGuaranteed.guarantorLGD * 100).toFixed(1)}% × {(loan.lgdGuaranteed.coverage * 100).toFixed(1)}% = {(() => {
                    const baseLGD = loan.lgdGuaranteed.baseLGD;
                    const coverage = loan.lgdGuaranteed.coverage;
                    const guarantorLGD = loan.lgdGuaranteed.guarantorLGD;
                    const result = baseLGD * (1 - coverage) + guarantorLGD * coverage;
                    return (result * 100).toFixed(1);
                  })()}%</p>
                </>
              )}
              {loan.lgdType === 'collateralized' && loan.collateralPortfolio && (
                <>
                  <p><strong>Collateral Items:</strong> {loan.collateralPortfolio.items.length}</p>
                  <p><strong>Total Value:</strong> {loan.collateralPortfolio.currency} {loan.collateralPortfolio.totalValue.toLocaleString()}</p>
                  <p><strong>Diversification:</strong> {(loan.collateralPortfolio.diversificationScore * 100).toFixed(1)}%</p>
                  <p><strong>Concentration Risk:</strong> {(loan.collateralPortfolio.concentrationRisk * 100).toFixed(1)}%</p>
                  <p><strong>Base LGD:</strong> {((loan.lgd || 0.45) * 100).toFixed(1)}%</p>
                  <p><strong>Haircut:</strong> 25%</p>
                  <p><strong>Effective LGD:</strong> {(currentLGD * 100).toFixed(1)}%</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* LGD Curve Chart */}
        <div className="space-y-4">
          <h3 className="font-medium">
            {loan.lgdType === 'variable' ? 'LGD Evolution Over Time' : 'LGD Profile'}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={lgdData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              />
              <YAxis 
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                domain={[0, 1]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="lgd" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Key Insights */}
        <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Key Insights
          </h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>Real Estate:</strong> Typically appreciates over time, reducing LGD</li>
            <li>• <strong>Equipment/Vehicles:</strong> Depreciate rapidly, increasing LGD</li>
            <li>• <strong>Cash:</strong> Loses value due to inflation, slight LGD increase</li>
            <li>• <strong>Risk Management:</strong> Monitor collateral values and adjust LGD models as needed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default LGDCurve; 
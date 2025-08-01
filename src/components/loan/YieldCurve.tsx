import React from 'react';
import { 
  LineChart, 
  ResponsiveContainer, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from 'recharts';
import { Loan } from '@/types/finance';
import { getTotalInterestRate } from '@/utils/financialCalculations';
import ParameterService from '@/services/ParameterService';

interface YieldCurveProps {
  loan: Loan;
}

// Generate yield curve data points
const generateYieldCurveData = (loan: Loan, currentParams: any) => {
  const startDate = new Date(loan.startDate);
  const endDate = new Date(loan.endDate);
  const loanDurationMonths = Math.ceil((endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
  
  const points = [];
  const currentDate = new Date(startDate);
  
  // Base yield components
  const baseYield = getTotalInterestRate(loan, currentParams);
  const upfrontFeesAnnualized = (loan.fees.upfront + loan.fees.agency + loan.fees.other) / 
                               (loanDurationMonths / 12) / loan.drawnAmount;
  const commitmentFeeYield = loan.fees.commitment * (loan.undrawnAmount / loan.drawnAmount);
  
  // Generate monthly data points
  for (let month = 0; month <= loanDurationMonths; month++) {
    const timeToMaturity = (loanDurationMonths - month) / 12; // years
    
    // Calculate yield based on remaining time
    let effectiveYield = baseYield;
    
    // Add upfront fees impact (decreases over time as they amortize)
    if (timeToMaturity > 0) {
      effectiveYield += upfrontFeesAnnualized / timeToMaturity;
    }
    
    // Add commitment fee yield (assuming undrawn amount decreases linearly)
    const remainingUndrawnRatio = Math.max(0, 1 - (month / loanDurationMonths));
    effectiveYield += commitmentFeeYield * remainingUndrawnRatio;
    
    // Add risk-adjusted components based on time
    const riskAdjustment = loan.pd * loan.lgd; // Expected loss as yield reduction
    effectiveYield -= riskAdjustment;
    
    // Format date for display
    const displayDate = new Date(currentDate);
    displayDate.setMonth(displayDate.getMonth() + month);
    
    points.push({
      date: displayDate.toLocaleDateString('en-US', { 
        month: 'short', 
        year: month % 12 === 0 ? 'numeric' : undefined 
      }).replace(',', ''),
      month: month,
      timeToMaturity: timeToMaturity,
      effectiveYield: effectiveYield * 100, // Convert to percentage
      baseYield: baseYield * 100,
      feeComponent: (upfrontFeesAnnualized / Math.max(timeToMaturity, 0.1)) * 100,
      commitmentComponent: (commitmentFeeYield * remainingUndrawnRatio) * 100,
      riskAdjustment: riskAdjustment * 100
    });
  }
  
  return points;
};

const YieldCurve: React.FC<YieldCurveProps> = ({ loan }) => {
  const currentParams = ParameterService.loadParameters();
  const yieldData = generateYieldCurveData(loan, currentParams);
  
  // Format values for display
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;
  
  return (
    <div className="space-y-4">
      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
        <div>
          <p className="text-sm text-muted-foreground">Current Effective Yield</p>
          <p className="text-lg font-bold text-financial-blue">
            {formatPercent(loan.metrics.effectiveYield * 100)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Interest Rate</p>
          <p className="text-lg font-bold">
            {formatPercent(getTotalInterestRate(loan, currentParams) * 100)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Risk Adjustment</p>
          <p className="text-lg font-bold text-financial-red">
            -{formatPercent(loan.pd * loan.lgd * 100)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Time to Maturity</p>
          <p className="text-lg font-bold">
            {Math.round((new Date(loan.endDate).getTime() - new Date().getTime()) / (30 * 24 * 60 * 60 * 1000))} months
          </p>
        </div>
      </div>
      
      {/* Yield curve chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={yieldData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              interval="preserveStartEnd"
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              label={{ value: 'Yield (%)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 11 }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatPercent(value),
                name === 'effectiveYield' ? 'Effective Yield' :
                name === 'baseYield' ? 'Total Interest Rate' :
                name === 'feeComponent' ? 'Fee Component' :
                name === 'commitmentComponent' ? 'Commitment Fee' :
                'Risk Adjustment'
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="effectiveYield" 
              stroke="#2D5BFF" 
              strokeWidth={3}
              name="Effective Yield"
              dot={{ fill: '#2D5BFF', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="baseYield" 
              stroke="#00C48C" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Total Interest Rate"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="feeComponent" 
              stroke="#FFB800" 
              strokeWidth={1}
              strokeDasharray="3 3"
              name="Fee Component"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Yield breakdown explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="space-y-3">
          <h4 className="font-medium text-financial-navy">Yield Components</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-financial-blue rounded mr-2"></div>
                <span>Effective Yield</span>
              </div>
              <span className="font-mono">{formatPercent(loan.metrics.effectiveYield * 100)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-financial-green rounded mr-2"></div>
                <span>Total Interest Rate</span>
              </div>
              <span className="font-mono">{formatPercent(getTotalInterestRate(loan, currentParams) * 100)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-financial-yellow rounded mr-2"></div>
                <span>Upfront Fees (Amortized)</span>
              </div>
              <span className="font-mono">
                {formatPercent(((loan.fees.upfront + loan.fees.agency + loan.fees.other) / 
                               ((new Date(loan.endDate).getTime() - new Date(loan.startDate).getTime()) / (365 * 24 * 60 * 60 * 1000)) / 
                               loan.drawnAmount) * 100)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-financial-red rounded mr-2"></div>
                <span>Risk Adjustment (PD × LGD)</span>
              </div>
              <span className="font-mono">-{formatPercent(loan.pd * loan.lgd * 100)}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-financial-navy">Key Insights</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• The yield curve shows how the effective yield changes over the loan's lifetime</p>
            <p>• Upfront fees have higher impact on shorter-term yields (amortization effect)</p>
            <p>• Risk adjustment reflects expected credit losses based on PD and LGD</p>
            <p>• Commitment fees apply only to undrawn portions of the facility</p>
            <p>• The curve helps identify optimal lending terms and pricing strategies</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YieldCurve; 
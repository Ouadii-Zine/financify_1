# Loan Yield Curve Component

## Overview

The `YieldCurve` component provides a comprehensive visualization of how a loan's effective yield changes over its lifetime. This feature is accessible from the loan details page as a dedicated "Yield Curve" tab.

## Features

### 1. Dynamic Yield Calculation
- **Effective Yield**: Shows the total return considering all components
- **Base Yield**: Interest rate + margin (the basic lending rate)
- **Fee Component**: Impact of upfront fees amortized over time
- **Risk Adjustment**: Expected losses based on PD × LGD

### 2. Visual Components
- **Line Chart**: Interactive chart showing yield evolution over time
- **Summary Metrics**: Key yield indicators at a glance
- **Component Breakdown**: Detailed explanation of yield components
- **Key Insights**: Educational information about yield curve interpretation

### 3. Calculation Logic

#### Time-Based Analysis
The component generates monthly data points from loan start to maturity, calculating:

```typescript
effectiveYield = baseYield + feeComponent + commitmentComponent - riskAdjustment
```

Where:
- `baseYield = margin + referenceRate`
- `feeComponent = upfrontFeesAnnualized / timeToMaturity`
- `commitmentComponent = commitmentFeeYield × remainingUndrawnRatio`
- `riskAdjustment = pd × lgd`

#### Key Insights
1. **Upfront Fee Impact**: Decreases over time as fees amortize
2. **Commitment Fees**: Apply to undrawn portions, decrease as facility is utilized
3. **Risk Adjustment**: Constant expected loss impact throughout loan life
4. **Time Decay**: Shows how yield components change as maturity approaches

## Usage

The component is automatically integrated into the loan details page:

1. Navigate to any loan details page
2. Click on the "Yield Curve" tab
3. View the interactive chart and metrics
4. Hover over chart points for detailed values
5. Review the component breakdown for understanding

## Benefits

- **Pricing Optimization**: Understand yield dynamics for better pricing
- **Risk Assessment**: Visualize how risk adjustments impact returns
- **Portfolio Management**: Compare yield profiles across different loans
- **Educational**: Clear breakdown of how yields are calculated
- **Strategic Planning**: Identify optimal loan structures and terms 
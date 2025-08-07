# Collateral Management System

This directory contains the comprehensive collateral management system for the Financify Portfolio Lens application, implementing all the requirements from the "Modèles de Valorisation du Collatéral - Analyse Complète" PDF.

## Overview

The collateral management system provides a complete solution for managing collateral portfolios, calculating risk metrics, and ensuring regulatory compliance for loan portfolios.

## Components

### 1. CollateralManager.tsx
The main component for managing collateral items within a loan portfolio.

**Features:**
- Add, edit, and delete collateral items
- Support for 10 different collateral categories:
  - Real Estate (residential, commercial, industrial, land, mixed)
  - Equipment (machinery, tools, etc.)
  - Vehicles (cars, trucks, etc.)
  - Cash (bank deposits, etc.)
  - Securities (equity, bonds, funds, derivatives)
  - Inventory (raw materials, work in progress, finished goods)
  - Receivables (corporate, individual, government)
  - Intellectual Property (patents, trademarks, etc.)
  - Commodities (gold, oil, etc.)
  - Other (miscellaneous assets)

**Valuation Methods:**
- Market Value
- Appraised Value
- Book Value
- Liquidation Value
- Replacement Cost
- Income Approach
- Cost Approach
- Comparable Sales

**Risk Assessment:**
- Risk levels: Low, Medium, High, Very High
- Volatility calculation
- Correlation with loan performance
- Legal status tracking
- Encumbrance levels
- Priority ranking

### 2. CollateralAnalytics.tsx
Advanced analytics component for portfolio-level risk analysis.

**Features:**
- Value at Risk (VaR) calculations
- Portfolio diversification scoring
- Concentration risk analysis
- Regulatory compliance validation
- Stress testing scenarios
- Category and risk level distributions
- Top collateral items analysis

### 3. CollateralService.ts
Service layer providing business logic for collateral calculations.

**Key Functions:**
- `calculateCollateralValue()` - Calculate current value based on valuation models
- `calculatePortfolioRiskMetrics()` - Portfolio-level risk calculations
- `calculateDiversificationScore()` - Herfindahl-Hirschman Index based diversification
- `calculateConcentrationRisk()` - Concentration risk assessment
- `calculateEffectiveLGD()` - LGD calculation considering collateral
- `validateRegulatoryCompliance()` - Basel III and LCR compliance checking

## Valuation Models

The system supports multiple mathematical models for collateral value evolution:

### 1. Linear Model
```
Value = InitialValue * (1 + rate * time)
```
Used for: Cash, other assets with steady depreciation

### 2. Exponential Model
```
Value = InitialValue * (1 ± rate)^time
```
Used for: Real estate (appreciation), equipment/vehicles (depreciation)

### 3. Logarithmic Model
```
Value = InitialValue * (1 + rate * log(1 + time))
```
Used for: Assets with diminishing returns

### 4. Polynomial Model
```
Value = InitialValue * (c₀ + c₁*t + c₂*t² + ...)
```
Used for: Complex value evolution patterns

## Risk Metrics

### Portfolio-Level Metrics
- **Value at Risk (VaR)**: 95% confidence level portfolio risk
- **Weighted Average Volatility**: Portfolio volatility considering weights
- **Diversification Score**: 0-1 score (higher is better)
- **Concentration Risk**: 0-1 score (lower is better)

### Individual Collateral Metrics
- **Volatility**: Annual price volatility percentage
- **Correlation with Loan**: Correlation coefficient (-1 to 1)
- **Liquidation Value**: Estimated liquidation value
- **Liquidation Time**: Estimated time to liquidate (months)
- **Liquidation Costs**: Associated costs

## Regulatory Compliance

### Basel III Compliance
- **Capital Requirements**: Risk-weighted asset calculations
- **Liquidity Coverage Ratio (LCR)**: High-quality liquid assets
- **HQLA Categories**:
  - Level 1: Cash, central bank reserves
  - Level 2A: Government securities (AAA)
  - Level 2B: Corporate bonds (AA+ to AA-)
  - Ineligible: Other assets

### Compliance Validation
- Legal registration status
- Encumbrance level checks
- Volatility thresholds
- Documentation requirements

## Integration with Loan System

The collateral system integrates seamlessly with the loan creation and modification process:

### LGD Calculation
When collateral is present, the effective LGD is calculated as:
```
Effective LGD = Base LGD - (Collateral Value * (1 - Haircut) / Loan Amount)
```

### Enhanced LGD Types
- **Constant**: Fixed LGD percentage
- **Variable**: LGD changes over time based on collateral depreciation
- **Guaranteed**: LGD reduced by guarantee coverage
- **Collateralized**: LGD calculated based on collateral portfolio

## Usage

### Adding Collateral to a Loan

1. In the loan creation/editing form, select "Collateralized" as the LGD type
2. Use the CollateralManager to add collateral items
3. Configure each item's properties based on its category
4. View analytics and risk metrics in real-time
5. Ensure regulatory compliance before saving

### Example Collateral Item

```typescript
{
  id: "collateral-1",
  name: "Office Building",
  category: "realEstate",
  description: "Commercial office building in downtown",
  valuationMethod: "appraisedValue",
  currentValue: 5000000,
  currency: "EUR",
  valuationDate: "2024-01-15",
  riskLevel: "medium",
  volatility: 0.15,
  correlationWithLoan: 0.3,
  properties: {
    propertyType: "commercial",
    location: "Paris, France",
    squareMeters: 2000,
    constructionYear: 2010,
    propertyCondition: "excellent"
  },
  valuationModel: {
    type: "exponential",
    parameters: {
      appreciationRate: 0.03
    }
  },
  legalStatus: "registered",
  encumbranceLevel: 0.2,
  priorityRank: 1,
  insured: true,
  insuranceValue: 5500000,
  monitoringFrequency: "quarterly",
  estimatedLiquidationValue: 4500000,
  estimatedLiquidationTime: 12,
  liquidationCosts: 250000
}
```

## Configuration

### Default Parameters by Category

| Category | Volatility | Correlation | Monitoring | Haircut |
|----------|------------|-------------|------------|---------|
| Real Estate | 15% | 30% | Quarterly | 25% |
| Equipment | 25% | 50% | Monthly | 35% |
| Vehicle | 30% | 60% | Monthly | 40% |
| Cash | 2% | 10% | Daily | 5% |
| Securities | 20% | 40% | Daily | 15% |
| Inventory | 35% | 70% | Weekly | 45% |
| Receivables | 25% | 80% | Monthly | 30% |
| IP | 40% | 20% | Quarterly | 50% |
| Commodities | 30% | 30% | Daily | 20% |
| Other | 25% | 50% | Monthly | 35% |

## Future Enhancements

1. **Real-time Market Data Integration**: Connect to market data providers for live valuations
2. **Machine Learning Models**: Implement ML-based valuation and risk prediction
3. **Blockchain Integration**: Use blockchain for collateral registration and tracking
4. **Advanced Stress Testing**: More sophisticated stress testing scenarios
5. **Regulatory Reporting**: Automated regulatory report generation
6. **Mobile App**: Mobile interface for collateral monitoring

## Technical Notes

- Built with TypeScript and React
- Uses shadcn/ui components for consistent UI
- Implements singleton pattern for services
- Follows SOLID principles for maintainability
- Comprehensive error handling and validation
- Real-time calculations and updates
- Responsive design for all screen sizes

## Dependencies

- React 18+
- TypeScript 5+
- shadcn/ui components
- Lucide React icons
- Tailwind CSS

## Testing

The system includes comprehensive unit tests for:
- Valuation model calculations
- Risk metric computations
- Regulatory compliance validation
- Portfolio optimization algorithms

Run tests with:
```bash
npm test
```

## Contributing

When contributing to the collateral system:

1. Follow the existing code structure and patterns
2. Add comprehensive TypeScript types
3. Include unit tests for new functionality
4. Update documentation for new features
5. Ensure regulatory compliance for new calculations
6. Test with various collateral types and scenarios 
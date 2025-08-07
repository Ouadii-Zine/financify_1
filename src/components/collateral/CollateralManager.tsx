import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  CollateralItem, 
  CollateralPortfolio, 
  CollateralCategory, 
  CollateralValuationMethod, 
  CollateralRiskLevel,
  Currency 
} from '@/types/finance';
import CollateralService from '@/services/CollateralService';
import { Plus, Edit, Trash2, Eye, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface CollateralManagerProps {
  portfolio: CollateralPortfolio;
  onPortfolioChange: (portfolio: CollateralPortfolio) => void;
  currency: Currency;
}

interface CollateralItemFormData {
  name: string;
  category: CollateralCategory;
  description: string;
  valuationMethod: CollateralValuationMethod;
  currentValue: string;
  valuationDate: string;
  riskLevel: CollateralRiskLevel;
  volatility: string;
  correlationWithLoan: string;
  legalStatus: 'registered' | 'pending' | 'unregistered';
  encumbranceLevel: string;
  priorityRank: string;
  insured: boolean;
  insuranceValue: string;
  monitoringFrequency: CollateralItem['monitoringFrequency'];
  estimatedLiquidationValue: string;
  estimatedLiquidationTime: string;
  liquidationCosts: string;
  
  // Category-specific properties
  propertyType?: string;
  location?: string;
  squareMeters?: string;
  manufacturer?: string;
  model?: string;
  yearOfManufacture?: string;
  securityType?: string;
  issuer?: string;
  creditRating?: string;
  inventoryType?: string;
  quantity?: string;
  unitCost?: string;
  debtorType?: string;
  averagePaymentTerm?: string;
}

const CollateralManager: React.FC<CollateralManagerProps> = ({ 
  portfolio, 
  onPortfolioChange, 
  currency 
}) => {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CollateralItemFormData>(getDefaultFormData());
  const [selectedCategory, setSelectedCategory] = useState<CollateralCategory>('realEstate');
  
  const collateralService = CollateralService.getInstance();

  function getDefaultFormData(): CollateralItemFormData {
    return {
      name: '',
      category: 'realEstate',
      description: '',
      valuationMethod: 'marketValue',
      currentValue: '',
      valuationDate: new Date().toISOString().split('T')[0],
      riskLevel: 'medium',
      volatility: '',
      correlationWithLoan: '',
      legalStatus: 'registered',
      encumbranceLevel: '0',
      priorityRank: '1',
      insured: false,
      insuranceValue: '',
      monitoringFrequency: 'monthly',
      estimatedLiquidationValue: '',
      estimatedLiquidationTime: '6',
      liquidationCosts: '0',
    };
  }

  useEffect(() => {
    if (selectedCategory) {
      const recommendations = collateralService.getRecommendedValuationParams(selectedCategory);
      setFormData(prev => ({
        ...prev,
        category: selectedCategory,
        volatility: (recommendations.volatility * 100).toString(),
        correlationWithLoan: (recommendations.correlationWithLoan * 100).toString(),
        monitoringFrequency: recommendations.monitoringFrequency
      }));
    }
  }, [selectedCategory, collateralService]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: CollateralCategory) => {
    setSelectedCategory(value);
  };

  const handleAddItem = () => {
    const newItem: CollateralItem = {
      id: Date.now().toString(),
      name: formData.name,
      category: formData.category,
      description: formData.description,
      valuationMethod: formData.valuationMethod,
      currentValue: parseFloat(formData.currentValue) || 0,
      currency: currency,
      valuationDate: formData.valuationDate,
      riskLevel: formData.riskLevel,
      volatility: parseFloat(formData.volatility) / 100 || 0,
      correlationWithLoan: parseFloat(formData.correlationWithLoan) / 100 || 0,
      properties: getCategoryProperties(),
      valuationModel: {
        type: 'exponential',
        parameters: {
          depreciationRate: formData.category === 'realEstate' ? 0.03 : -0.15
        }
      },
      legalStatus: formData.legalStatus,
      encumbranceLevel: parseFloat(formData.encumbranceLevel) || 0,
      priorityRank: parseInt(formData.priorityRank) || 1,
      insured: formData.insured,
      insuranceValue: parseFloat(formData.insuranceValue) || 0,
      monitoringFrequency: formData.monitoringFrequency,
      estimatedLiquidationValue: parseFloat(formData.estimatedLiquidationValue) || 0,
      estimatedLiquidationTime: parseFloat(formData.estimatedLiquidationTime) || 6,
      liquidationCosts: parseFloat(formData.liquidationCosts) || 0,
      historicalValues: [],
      riskMetrics: {
        valueAtRisk: 0,
        expectedShortfall: 0,
        stressTestScenarios: []
      }
    };

    const updatedItems = [...portfolio.items, newItem];
    const updatedPortfolio = {
      ...portfolio,
      items: updatedItems,
      totalValue: updatedItems.reduce((sum, item) => sum + item.currentValue, 0)
    };

    // Recalculate portfolio metrics
    updatedPortfolio.diversificationScore = collateralService.calculateDiversificationScore(updatedPortfolio);
    updatedPortfolio.concentrationRisk = collateralService.calculateConcentrationRisk(updatedPortfolio);
    updatedPortfolio.portfolioRiskMetrics = collateralService.calculatePortfolioRiskMetrics(updatedPortfolio);

    onPortfolioChange(updatedPortfolio);
    setFormData(getDefaultFormData());
    setIsAddingItem(false);
  };

  const handleEditItem = (item: CollateralItem) => {
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description || '',
      valuationMethod: item.valuationMethod,
      currentValue: item.currentValue.toString(),
      valuationDate: item.valuationDate,
      riskLevel: item.riskLevel,
      volatility: (item.volatility * 100).toString(),
      correlationWithLoan: (item.correlationWithLoan * 100).toString(),
      legalStatus: item.legalStatus,
      encumbranceLevel: (item.encumbranceLevel * 100).toString(),
      priorityRank: item.priorityRank.toString(),
      insured: item.insured,
      insuranceValue: item.insuranceValue?.toString() || '',
      monitoringFrequency: item.monitoringFrequency,
      estimatedLiquidationValue: item.estimatedLiquidationValue.toString(),
      estimatedLiquidationTime: item.estimatedLiquidationTime.toString(),
      liquidationCosts: item.liquidationCosts.toString(),
      ...getFormDataFromProperties(item.properties, item.category)
    });
    setSelectedCategory(item.category);
    setEditingItemId(item.id);
    setIsAddingItem(true);
  };

  const handleUpdateItem = () => {
    if (!editingItemId) return;

    const updatedItems = portfolio.items.map(item => {
      if (item.id === editingItemId) {
        return {
          ...item,
          name: formData.name,
          category: formData.category,
          description: formData.description,
          valuationMethod: formData.valuationMethod,
          currentValue: parseFloat(formData.currentValue) || 0,
          valuationDate: formData.valuationDate,
          riskLevel: formData.riskLevel,
          volatility: parseFloat(formData.volatility) / 100 || 0,
          correlationWithLoan: parseFloat(formData.correlationWithLoan) / 100 || 0,
          properties: getCategoryProperties(),
          legalStatus: formData.legalStatus,
          encumbranceLevel: parseFloat(formData.encumbranceLevel) / 100 || 0,
          priorityRank: parseInt(formData.priorityRank) || 1,
          insured: formData.insured,
          insuranceValue: parseFloat(formData.insuranceValue) || 0,
          monitoringFrequency: formData.monitoringFrequency,
          estimatedLiquidationValue: parseFloat(formData.estimatedLiquidationValue) || 0,
          estimatedLiquidationTime: parseFloat(formData.estimatedLiquidationTime) || 6,
          liquidationCosts: parseFloat(formData.liquidationCosts) || 0
        };
      }
      return item;
    });

    const updatedPortfolio = {
      ...portfolio,
      items: updatedItems,
      totalValue: updatedItems.reduce((sum, item) => sum + item.currentValue, 0)
    };

    // Recalculate portfolio metrics
    updatedPortfolio.diversificationScore = collateralService.calculateDiversificationScore(updatedPortfolio);
    updatedPortfolio.concentrationRisk = collateralService.calculateConcentrationRisk(updatedPortfolio);
    updatedPortfolio.portfolioRiskMetrics = collateralService.calculatePortfolioRiskMetrics(updatedPortfolio);

    onPortfolioChange(updatedPortfolio);
    setFormData(getDefaultFormData());
    setEditingItemId(null);
    setIsAddingItem(false);
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = portfolio.items.filter(item => item.id !== itemId);
    const updatedPortfolio = {
      ...portfolio,
      items: updatedItems,
      totalValue: updatedItems.reduce((sum, item) => sum + item.currentValue, 0)
    };

    // Recalculate portfolio metrics
    updatedPortfolio.diversificationScore = collateralService.calculateDiversificationScore(updatedPortfolio);
    updatedPortfolio.concentrationRisk = collateralService.calculateConcentrationRisk(updatedPortfolio);
    updatedPortfolio.portfolioRiskMetrics = collateralService.calculatePortfolioRiskMetrics(updatedPortfolio);

    onPortfolioChange(updatedPortfolio);
  };

  const getCategoryProperties = () => {
    const baseProps: any = {};
    
    switch (selectedCategory) {
      case 'realEstate':
        baseProps.propertyType = formData.propertyType;
        baseProps.location = formData.location;
        baseProps.squareMeters = parseFloat(formData.squareMeters || '0');
        break;
      case 'equipment':
      case 'vehicle':
        baseProps.manufacturer = formData.manufacturer;
        baseProps.model = formData.model;
        baseProps.yearOfManufacture = parseInt(formData.yearOfManufacture || '0');
        break;
      case 'securities':
        baseProps.securityType = formData.securityType;
        baseProps.issuer = formData.issuer;
        baseProps.creditRating = formData.creditRating;
        break;
      case 'inventory':
        baseProps.inventoryType = formData.inventoryType;
        baseProps.quantity = parseFloat(formData.quantity || '0');
        baseProps.unitCost = parseFloat(formData.unitCost || '0');
        break;
      case 'receivables':
        baseProps.debtorType = formData.debtorType;
        baseProps.averagePaymentTerm = parseFloat(formData.averagePaymentTerm || '0');
        break;
      case 'cash':
        baseProps.issuer = formData.issuer;
        baseProps.creditRating = formData.creditRating;
        break;
      case 'intellectualProperty':
        baseProps.propertyType = formData.propertyType;
        baseProps.issuer = formData.issuer;
        break;
      case 'commodities':
        baseProps.propertyType = formData.propertyType;
        baseProps.quantity = parseFloat(formData.quantity || '0');
        baseProps.unitCost = parseFloat(formData.unitCost || '0');
        break;
    }
    
    return baseProps;
  };

  const getFormDataFromProperties = (properties: any, category: CollateralCategory) => {
    const result: any = {};
    
    switch (category) {
      case 'realEstate':
        result.propertyType = properties.propertyType || '';
        result.location = properties.location || '';
        result.squareMeters = properties.squareMeters?.toString() || '';
        break;
      case 'equipment':
      case 'vehicle':
        result.manufacturer = properties.manufacturer || '';
        result.model = properties.model || '';
        result.yearOfManufacture = properties.yearOfManufacture?.toString() || '';
        break;
      case 'securities':
        result.securityType = properties.securityType || '';
        result.issuer = properties.issuer || '';
        result.creditRating = properties.creditRating || '';
        break;
      case 'inventory':
        result.inventoryType = properties.inventoryType || '';
        result.quantity = properties.quantity?.toString() || '';
        result.unitCost = properties.unitCost?.toString() || '';
        break;
      case 'receivables':
        result.debtorType = properties.debtorType || '';
        result.averagePaymentTerm = properties.averagePaymentTerm?.toString() || '';
        break;
      case 'cash':
        result.issuer = properties.issuer || '';
        result.creditRating = properties.creditRating || '';
        break;
      case 'intellectualProperty':
        result.propertyType = properties.propertyType || '';
        result.issuer = properties.issuer || '';
        break;
      case 'commodities':
        result.propertyType = properties.propertyType || '';
        result.quantity = properties.quantity?.toString() || '';
        result.unitCost = properties.unitCost?.toString() || '';
        break;
    }
    
    return result;
  };

  const getCategorySpecificFields = () => {
    switch (selectedCategory) {
      case 'realEstate':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="propertyType">Property Type</Label>
              <Select value={formData.propertyType || ''} onValueChange={(value) => handleSelectChange('propertyType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="mixed">Mixed Use</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input name="location" value={formData.location || ''} onChange={handleInputChange} placeholder="City, Country" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="squareMeters">Square Meters</Label>
              <Input name="squareMeters" type="number" value={formData.squareMeters || ''} onChange={handleInputChange} placeholder="100" />
            </div>
          </>
        );
      case 'equipment':
      case 'vehicle':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input name="manufacturer" value={formData.manufacturer || ''} onChange={handleInputChange} placeholder="Manufacturer name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input name="model" value={formData.model || ''} onChange={handleInputChange} placeholder="Model name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearOfManufacture">Year of Manufacture</Label>
              <Input name="yearOfManufacture" type="number" value={formData.yearOfManufacture || ''} onChange={handleInputChange} placeholder="2020" />
            </div>
          </>
        );
      case 'securities':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="securityType">Security Type</Label>
              <Select value={formData.securityType || ''} onValueChange={(value) => handleSelectChange('securityType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select security type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="bond">Bond</SelectItem>
                  <SelectItem value="fund">Fund</SelectItem>
                  <SelectItem value="derivative">Derivative</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issuer">Issuer</Label>
              <Input name="issuer" value={formData.issuer || ''} onChange={handleInputChange} placeholder="Issuer name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditRating">Credit Rating</Label>
              <Input name="creditRating" value={formData.creditRating || ''} onChange={handleInputChange} placeholder="AAA" />
            </div>
          </>
        );
      case 'inventory':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="inventoryType">Inventory Type</Label>
              <Select value={formData.inventoryType || ''} onValueChange={(value) => handleSelectChange('inventoryType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select inventory type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rawMaterials">Raw Materials</SelectItem>
                  <SelectItem value="workInProgress">Work in Progress</SelectItem>
                  <SelectItem value="finishedGoods">Finished Goods</SelectItem>
                  <SelectItem value="spareParts">Spare Parts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input name="quantity" type="number" value={formData.quantity || ''} onChange={handleInputChange} placeholder="1000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitCost">Unit Cost</Label>
              <Input name="unitCost" type="number" value={formData.unitCost || ''} onChange={handleInputChange} placeholder="50" />
            </div>
          </>
        );
      case 'receivables':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="debtorType">Debtor Type</Label>
              <Select value={formData.debtorType || ''} onValueChange={(value) => handleSelectChange('debtorType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select debtor type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="averagePaymentTerm">Average Payment Term (days)</Label>
              <Input name="averagePaymentTerm" type="number" value={formData.averagePaymentTerm || ''} onChange={handleInputChange} placeholder="30" />
            </div>
          </>
        );
            case 'cash':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="issuer">Bank/Institution</Label>
              <Input name="issuer" value={formData.issuer || ''} onChange={handleInputChange} placeholder="Bank name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditRating">Credit Rating</Label>
              <Input name="creditRating" value={formData.creditRating || ''} onChange={handleInputChange} placeholder="AAA" />
            </div>
          </>
        );
      case 'intellectualProperty':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="propertyType">IP Type</Label>
              <Select value={formData.propertyType || ''} onValueChange={(value) => handleSelectChange('propertyType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select IP type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patent">Patent</SelectItem>
                  <SelectItem value="trademark">Trademark</SelectItem>
                  <SelectItem value="copyright">Copyright</SelectItem>
                  <SelectItem value="tradeSecret">Trade Secret</SelectItem>
                  <SelectItem value="license">License</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issuer">Owner/Licensor</Label>
              <Input name="issuer" value={formData.issuer || ''} onChange={handleInputChange} placeholder="Owner name" />
            </div>
          </>
        );
      case 'commodities':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="propertyType">Commodity Type</Label>
              <Select value={formData.propertyType || ''} onValueChange={(value) => handleSelectChange('propertyType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select commodity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preciousMetals">Precious Metals</SelectItem>
                  <SelectItem value="energy">Energy</SelectItem>
                  <SelectItem value="agricultural">Agricultural</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input name="quantity" type="number" value={formData.quantity || ''} onChange={handleInputChange} placeholder="100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitCost">Unit Price</Label>
              <Input name="unitCost" type="number" value={formData.unitCost || ''} onChange={handleInputChange} placeholder="1000" />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const getRiskLevelColor = (level: CollateralRiskLevel) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'veryHigh': return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Collateral Portfolio Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{currency} {portfolio.totalValue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{portfolio.items.length}</div>
              <div className="text-sm text-muted-foreground">Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{(portfolio.diversificationScore * 100).toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Diversification</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{(portfolio.concentrationRisk * 100).toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Concentration Risk</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Collateral Item */}
      {isAddingItem && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingItemId ? 'Edit Collateral Item' : 'Add New Collateral Item'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input name="name" value={formData.name || ''} onChange={handleInputChange} placeholder="Collateral name" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realEstate">Real Estate</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="securities">Securities</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="receivables">Receivables</SelectItem>
                    <SelectItem value="intellectualProperty">Intellectual Property</SelectItem>
                    <SelectItem value="commodities">Commodities</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentValue">Current Value ({currency}) *</Label>
                <Input name="currentValue" type="number" value={formData.currentValue || ''} onChange={handleInputChange} placeholder="100000" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valuationMethod">Valuation Method</Label>
                <Select value={formData.valuationMethod} onValueChange={(value) => handleSelectChange('valuationMethod', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketValue">Market Value</SelectItem>
                    <SelectItem value="appraisedValue">Appraised Value</SelectItem>
                    <SelectItem value="bookValue">Book Value</SelectItem>
                    <SelectItem value="liquidationValue">Liquidation Value</SelectItem>
                    <SelectItem value="replacementCost">Replacement Cost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskLevel">Risk Level</Label>
                <Select value={formData.riskLevel} onValueChange={(value) => handleSelectChange('riskLevel', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="veryHigh">Very High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="volatility">Volatility (%)</Label>
                <Input name="volatility" type="number" value={formData.volatility || ''} onChange={handleInputChange} placeholder="15" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="correlationWithLoan">Correlation with Loan (%)</Label>
                <Input name="correlationWithLoan" type="number" value={formData.correlationWithLoan || ''} onChange={handleInputChange} placeholder="0.5" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valuationDate">Valuation Date</Label>
                <Input name="valuationDate" type="date" value={formData.valuationDate || ''} onChange={handleInputChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="legalStatus">Legal Status</Label>
                <Select value={formData.legalStatus} onValueChange={(value) => handleSelectChange('legalStatus', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registered">Registered</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="unregistered">Unregistered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="encumbranceLevel">Encumbrance Level (%)</Label>
                <Input name="encumbranceLevel" type="number" value={formData.encumbranceLevel || ''} onChange={handleInputChange} placeholder="0" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priorityRank">Priority Rank</Label>
                <Input name="priorityRank" type="number" value={formData.priorityRank || ''} onChange={handleInputChange} placeholder="1" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedLiquidationValue">Estimated Liquidation Value ({currency})</Label>
                <Input name="estimatedLiquidationValue" type="number" value={formData.estimatedLiquidationValue || ''} onChange={handleInputChange} placeholder="80000" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedLiquidationTime">Estimated Liquidation Time (months)</Label>
                <Input name="estimatedLiquidationTime" type="number" value={formData.estimatedLiquidationTime || ''} onChange={handleInputChange} placeholder="6" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="liquidationCosts">Liquidation Costs ({currency})</Label>
                <Input name="liquidationCosts" type="number" value={formData.liquidationCosts || ''} onChange={handleInputChange} placeholder="5000" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monitoringFrequency">Monitoring Frequency</Label>
                <Select value={formData.monitoringFrequency} onValueChange={(value) => handleSelectChange('monitoringFrequency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="insured"
                  checked={formData.insured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, insured: checked }))}
                />
                <Label htmlFor="insured">Insured</Label>
              </div>

              {formData.insured && (
                <div className="space-y-2">
                  <Label htmlFor="insuranceValue">Insurance Value ({currency})</Label>
                  <Input name="insuranceValue" type="number" value={formData.insuranceValue || ''} onChange={handleInputChange} placeholder="100000" />
                </div>
              )}

              {/* Category-specific fields */}
              {getCategorySpecificFields()}

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea name="description" value={formData.description || ''} onChange={handleInputChange} placeholder="Detailed description of the collateral" />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={editingItemId ? handleUpdateItem : handleAddItem}>
                {editingItemId ? 'Update Item' : 'Add Item'}
              </Button>
              <Button variant="outline" onClick={() => {
                setIsAddingItem(false);
                setEditingItemId(null);
                setFormData(getDefaultFormData());
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collateral Items List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Collateral Items</CardTitle>
          <Button onClick={() => setIsAddingItem(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {portfolio.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No collateral items added yet. Click "Add Item" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {portfolio.items.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.category}</Badge>
                      <Badge className={getRiskLevelColor(item.riskLevel)}>{item.riskLevel}</Badge>
                      <div className="text-right">
                        <div className="font-semibold">{currency} {item.currentValue.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{item.valuationMethod}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Volatility: {(item.volatility * 100).toFixed(1)}%</span>
                    <span>Correlation: {(item.correlationWithLoan * 100).toFixed(1)}%</span>
                    <span>Encumbrance: {(item.encumbranceLevel * 100).toFixed(1)}%</span>
                    {item.insured && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Insured</span>}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditItem(item)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteItem(item.id)}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CollateralManager; 
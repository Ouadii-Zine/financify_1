import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loan, LoanType, LoanStatus, Currency, ClientType, PortfolioSummary, SPRating, S_P_RATING_MAPPINGS, LoanRatings, InternalRating, MoodysRating, FitchRating, RatingType } from '@/types/finance';
import { convertToSPRating, getPDFromParameters } from '@/utils/financialCalculations';
import LoanDataService from '@/services/LoanDataService';

import PortfolioService, { PORTFOLIOS_UPDATED_EVENT } from '@/services/PortfolioService';
import ClientTemplateService from '@/services/ClientTemplateService';
import ParameterService from '@/services/ParameterService';
import { Switch } from '@/components/ui/switch';
import CurrencyService from '@/services/CurrencyService';

interface LoanFormData {
  id?: string;
  name: string;
  clientName: string;
  clientType?: ClientType;
  portfolioId: string;
  type: LoanType;
  status: LoanStatus;
  startDate: string;
  endDate: string;
  currency: Currency;
  originalAmount: string;
  outstandingAmount?: string;
  drawnAmount?: string;
  undrawnAmount?: string;
  pd: string;
  lgd: string;
  ead?: string;
  sector: string;
  country: string;
  
  // Multi-rating system
  internalRating: string;
  spRating: string;
  moodysRating: string;
  fitchRating: string;
  
  margin: string;
  referenceRate: string;
  upfrontFee?: string;
  commitmentFee?: string;
  agencyFee?: string;
  otherFee?: string;
  // --- NOUVEAUX CHAMPS STRUCTURE CASHFLOW ---
  interestPaymentFrequency?: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  principalRepaymentFrequency?: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  amortizationType?: 'inFine' | 'constant' | 'annuity';
  interestCalculationMethod?: string;
  gracePeriodMonths?: string;
  allowPrepayment?: boolean;
  allowPenalty?: boolean;
  revocableImmediately?: boolean;
  // ------------------------------------------------
}

const LoanNew = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loanDataService = LoanDataService.getInstance();
  const portfolioService = PortfolioService.getInstance();
  const clientTemplateService = ClientTemplateService.getInstance();
  
  // Check if we're in edit mode
  const searchParams = new URLSearchParams(location.search);
  const isEditMode = searchParams.get('edit') === 'true';
  const loanId = searchParams.get('id');
  const preSelectedPortfolioId = searchParams.get('portfolio');
  const [pageTitle, setPageTitle] = useState('New Loan');
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [isCreatePortfolioOpen, setIsCreatePortfolioOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  
  // Set default currency from ParameterService
  const parameters = ParameterService.loadParameters();
  const [currentCurrency, setCurrentCurrency] = useState<Currency>(parameters.currency || 'EUR');
  
  // Rating system state
  const [selectedRatingType, setSelectedRatingType] = useState<RatingType>('sp');
  
  // Load currency settings from parameters
  useEffect(() => {
    const parameters = ParameterService.loadParameters();
    if (parameters.currency) {
      setCurrentCurrency(parameters.currency);
    }
    
    // Add event listener for parameter updates (including currency changes)
    const handleParametersUpdated = () => {
      const updatedParameters = ParameterService.loadParameters();
      if (updatedParameters.currency) {
        setCurrentCurrency(updatedParameters.currency);
      }
    };
    
    window.addEventListener('parameters-updated', handleParametersUpdated);
    
    return () => {
      window.removeEventListener('parameters-updated', handleParametersUpdated);
    };
  }, []);
  
  const defaultFormData: LoanFormData = {
    name: 'Test Loan',
    clientName: 'Test Client',
    clientType: 'banqueCommerciale',
    portfolioId: '',
    type: 'term',
    status: 'active',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().split('T')[0],
    currency: currentCurrency,
    originalAmount: '1000000',
    outstandingAmount: '',
    drawnAmount: '',
    undrawnAmount: '0',
    pd: '0.75', // Default PD for BB+ rating
    lgd: '45',
    ead: '',
    sector: 'Technology',
    country: 'France',
    internalRating: 'BB+',
    spRating: 'N/A',
    moodysRating: 'N/A',
    fitchRating: 'N/A',
    margin: '2',
    referenceRate: '3',
    upfrontFee: '0',
    commitmentFee: '0',
    agencyFee: '0',
    otherFee: '0',
    // --- NOUVEAUX CHAMPS STRUCTURE CASHFLOW ---
    interestPaymentFrequency: 'annual',
    principalRepaymentFrequency: 'annual',
    amortizationType: 'inFine',
    interestCalculationMethod: 'Mois de 30 jours/Année de 360 jours',
    gracePeriodMonths: '0',
    allowPrepayment: false,
    allowPenalty: false,
    revocableImmediately: false
    // ------------------------------------------------
  };
  
  const [formData, setFormData] = useState<LoanFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update form currency when currentCurrency changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      currency: currentCurrency
    }));
  }, [currentCurrency]);
  
  // Load portfolios on component mount
  useEffect(() => {
    const portfolioSummaries = portfolioService.getPortfolioSummaries();
    setPortfolios(portfolioSummaries);
    
    setFormData(prev => ({
      ...prev,
      portfolioId: preSelectedPortfolioId || (portfolioSummaries.length > 0 ? portfolioSummaries.find(p => p.isDefault)?.id || portfolioSummaries[0].id : '')
    }));
  }, [preSelectedPortfolioId]);
  
  // Effect to load loan data for editing
  useEffect(() => {
    if (isEditMode && loanId) {
      setPageTitle('Edit Loan');
      
      try {
        let loanToEdit: Loan | null = null;
        
        const storedLoan = localStorage.getItem('loan-to-edit');
        if (storedLoan) {
          loanToEdit = JSON.parse(storedLoan);
          localStorage.removeItem('loan-to-edit');
        }
        
        if (!loanToEdit) {
          loanToEdit = loanDataService.getLoanById(loanId);
        }
        
        if (loanToEdit) {
          setFormData({
            id: loanToEdit.id,
            name: loanToEdit.name,
            clientName: loanToEdit.clientName,
            clientType: loanToEdit.clientType || 'banqueCommerciale',
            portfolioId: loanToEdit.portfolioId,
            type: loanToEdit.type,
            status: loanToEdit.status,
            startDate: loanToEdit.startDate,
            endDate: loanToEdit.endDate,
            currency: loanToEdit.currency,
            originalAmount: loanToEdit.originalAmount.toString(),
            outstandingAmount: loanToEdit.outstandingAmount.toString(),
            drawnAmount: loanToEdit.drawnAmount.toString(),
            undrawnAmount: loanToEdit.undrawnAmount.toString(),
            pd: (loanToEdit.pd * 100).toString(),
            lgd: (loanToEdit.lgd * 100).toString(),
            ead: loanToEdit.ead.toString(),
            sector: loanToEdit.sector,
            country: loanToEdit.country,
            internalRating: loanToEdit.ratings?.internal || loanToEdit.internalRating || 'BB+',
            spRating: loanToEdit.ratings?.sp || 'N/A',
            moodysRating: loanToEdit.ratings?.moodys || 'N/A',
            fitchRating: loanToEdit.ratings?.fitch || 'N/A',
            margin: (loanToEdit.margin * 100).toString(),
            referenceRate: (loanToEdit.referenceRate * 100).toString(),
            upfrontFee: loanToEdit.fees.upfront.toString(),
            commitmentFee: loanToEdit.fees.commitment.toString(),
            agencyFee: loanToEdit.fees.agency.toString(),
            otherFee: loanToEdit.fees.other.toString(),
            // --- NOUVEAUX CHAMPS STRUCTURE CASHFLOW ---
            interestPaymentFrequency: loanToEdit.interestPaymentFrequency,
            principalRepaymentFrequency: loanToEdit.principalRepaymentFrequency,
            amortizationType: loanToEdit.amortizationType,
            interestCalculationMethod: loanToEdit.interestCalculationMethod,
            gracePeriodMonths: loanToEdit.gracePeriodMonths.toString(),
            allowPrepayment: loanToEdit.allowPrepayment,
            allowPenalty: loanToEdit.allowPenalty,
            revocableImmediately: loanToEdit.revocableImmediately
            // ------------------------------------------------
          });
        } else {
          toast({
            title: "Error",
            description: "The loan to edit cannot be found.",
            variant: "destructive"
          });
          navigate('/loans');
        }
      } catch (error) {
        console.error("Error loading loan data:", error);
        toast({
          title: "Error",
          description: "Unable to load loan data for editing.",
          variant: "destructive"
        });
        navigate('/loans');
      }
    }
  }, [isEditMode, loanId, navigate, loanDataService]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Function to calculate PD based on selected rating type and value
  const calculatePDFromRating = () => {
    const ratings: LoanRatings = {
      internal: formData.internalRating !== 'N/A' ? formData.internalRating as InternalRating : undefined,
      sp: formData.spRating !== 'N/A' ? formData.spRating as SPRating : undefined,
      moodys: formData.moodysRating !== 'N/A' ? formData.moodysRating as MoodysRating : undefined,
      fitch: formData.fitchRating !== 'N/A' ? formData.fitchRating as FitchRating : undefined
    };

    try {
      // Load current parameters from the service
      const currentParameters = ParameterService.loadParameters();
      
      // Get PD from the parameter configuration
      const pd = getPDFromParameters(ratings, currentParameters, selectedRatingType);
      
      setFormData(prev => ({
        ...prev,
        pd: (pd * 100).toString() // Convert to percentage
      }));
    } catch (error) {
      console.warn("Could not calculate PD from rating:", error);
    }
  };

  // Effect to recalculate PD when rating type or rating values change
  useEffect(() => {
    calculatePDFromRating();
  }, [selectedRatingType, formData.internalRating, formData.spRating, formData.moodysRating, formData.fitchRating]);

  const handleRatingChange = (ratingType: string, value: string) => {
    setFormData(prev => ({ ...prev, [ratingType]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Debug: log formData
    console.log('Submitting loan formData:', formData);

    try {
      const loanId = formData.id || `loan-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      // Prepare ratings object
      const ratings: LoanRatings = {
        internal: formData.internalRating !== 'N/A' ? formData.internalRating as InternalRating : undefined,
        sp: formData.spRating !== 'N/A' ? formData.spRating as SPRating : undefined,
        moodys: formData.moodysRating !== 'N/A' ? formData.moodysRating as MoodysRating : undefined,
        fitch: formData.fitchRating !== 'N/A' ? formData.fitchRating as FitchRating : undefined
      };

      // Always parse as numbers, never empty string
      let drawnAmount = parseFloat(formData.drawnAmount?.toString() || '0');
      let undrawnAmount = 0;
      if (formData.type === 'revolver') {
        undrawnAmount = parseFloat(formData.originalAmount) - drawnAmount;
        if (isNaN(drawnAmount)) drawnAmount = 0;
        if (isNaN(undrawnAmount)) undrawnAmount = 0;
      } else {
        undrawnAmount = parseFloat(formData.undrawnAmount?.toString() || '0');
      }

      let uniqueName = formData.name;
      if (!isEditMode) {
        // Ensure unique loan name in the selected portfolio
        const existingLoans = loanDataService.getLoans(formData.portfolioId);
        const baseName = formData.name;
        const regex = new RegExp(`^${baseName}(?:_(\\d+))?$`);
        let maxSuffix = 0;
        existingLoans.forEach(l => {
          const match = l.name.match(regex);
          if (match) {
            const suffix = match[1] ? parseInt(match[1], 10) : 0;
            if (suffix >= maxSuffix) maxSuffix = suffix + 1;
          }
        });
        if (maxSuffix > 0) {
          uniqueName = `${baseName}_${maxSuffix}`;
        }
      }

      const preparedLoan: Loan = {
        id: loanId,
        name: uniqueName,
        clientName: formData.clientName,
        clientType: formData.clientType,
        portfolioId: formData.portfolioId,
        type: formData.type as LoanType,
        status: formData.status as LoanStatus,
        startDate: formData.startDate,
        endDate: formData.endDate,
        currency: formData.currency as Currency, // Store the selected currency
        originalAmount: parseFloat(formData.originalAmount.toString()), // Use as entered
        outstandingAmount: parseFloat(formData.originalAmount.toString()),
        drawnAmount: drawnAmount, // Use as entered
        undrawnAmount: undrawnAmount, // Use as entered or auto-calculated
        pd: parseFloat(formData.pd.toString()) / 100,
        lgd: parseFloat(formData.lgd.toString()) / 100,
        ead: parseFloat(formData.originalAmount.toString()),
        fees: {
          upfront: parseFloat(formData.upfrontFee?.toString() || '0'),
          commitment: parseFloat(formData.commitmentFee?.toString() || '0'),
          agency: parseFloat(formData.agencyFee?.toString() || '0'),
          other: parseFloat(formData.otherFee?.toString() || '0')
        },
        margin: parseFloat(formData.margin.toString()) / 100,
        referenceRate: parseFloat(formData.referenceRate.toString()) / 100,
        internalRating: formData.internalRating as SPRating, // Backward compatibility
        ratings: ratings, // New multi-rating system
        sector: formData.sector,
        country: formData.country,
        cashFlows: [],
        metrics: {
          evaIntrinsic: 0,
          evaSale: 0,
          expectedLoss: 0,
          rwa: 0,
          roe: 0,
          raroc: 0,
          costOfRisk: 0,
          capitalConsumption: 0,
          netMargin: 0,
          effectiveYield: 0
        },
        // --- NOUVEAUX CHAMPS STRUCTURE CASHFLOW ---
        interestPaymentFrequency: formData.interestPaymentFrequency,
        principalRepaymentFrequency: formData.principalRepaymentFrequency,
        amortizationType: formData.amortizationType,
        interestCalculationMethod: formData.interestCalculationMethod,
        gracePeriodMonths: formData.gracePeriodMonths ? parseInt(formData.gracePeriodMonths) : 0,
        allowPrepayment: !!formData.allowPrepayment,
        allowPenalty: !!formData.allowPenalty,
        revocableImmediately: formData.revocableImmediately || false
        // ------------------------------------------------
      };
      
      if (isEditMode && formData.id) {
        const deleteSuccess = loanDataService.deleteLoan(formData.id);
        
        if (deleteSuccess) {
          loanDataService.addLoan(preparedLoan, formData.portfolioId, ParameterService.loadParameters());
          
          toast({
            title: "Loan updated",
            description: `The loan "${preparedLoan.name}" has been successfully updated.`,
            variant: "default"
          });
          // Redirect to loan details page after update
          setTimeout(() => {
            navigate(`/loans/${preparedLoan.id}`);
          }, 500);
        } else {
          throw new Error("Failed to update loan - could not remove old version.");
        }
      } else {
        if (!isEditMode) {
          // Ensure unique loan name in the selected portfolio
          const existingLoans = loanDataService.getLoans(formData.portfolioId);
          const baseName = formData.name;
          // Find all loans with the same base name or base name with _N suffix
          const regex = new RegExp(`^${baseName}(?:_(\\d+))?$`);
          let maxSuffix = 0;
          existingLoans.forEach(l => {
            const match = l.name.match(regex);
            if (match) {
              const suffix = match[1] ? parseInt(match[1], 10) : 0;
              if (suffix >= maxSuffix) maxSuffix = suffix + 1;
            }
          });
          let uniqueName = baseName;
          if (maxSuffix > 0) {
            uniqueName = `${baseName}_${maxSuffix}`;
          }
          formData.name = uniqueName;
        }
        loanDataService.addLoan(preparedLoan, formData.portfolioId, ParameterService.loadParameters());
        
        toast({
          title: "Loan created",
          description: `The loan "${preparedLoan.name}" has been successfully created.`,
          variant: "default"
        });
        setTimeout(() => {
          navigate('/loans');
        }, 500);
      }
      
    } catch (error) {
      console.error("Error during loan operation:", error);
      toast({
        title: "Error",
        description: `An error occurred: ${error}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available rating options
  const getInternalRatingOptions = () => [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
    'AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-',
    'BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'CCC+', 'CCC', 'CCC-', 'CC', 'C', 'D'
  ];

  const getSPRatingOptions = () => [
    'AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-',
    'BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'CCC+', 'CCC', 'CCC-', 'CC', 'C', 'D'
  ];

  const getMoodysRatingOptions = () => [
    'Aaa', 'Aa1', 'Aa2', 'Aa3', 'A1', 'A2', 'A3', 'Baa1', 'Baa2', 'Baa3',
    'Ba1', 'Ba2', 'Ba3', 'B1', 'B2', 'B3', 'Caa1', 'Caa2', 'Caa3', 'Ca', 'C', 'D'
  ];

  const getFitchRatingOptions = () => [
    'AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-',
    'BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'CCC+', 'CCC', 'CCC-', 'CC', 'C', 'RD', 'D'
  ];

  const [currencyOptions, setCurrencyOptions] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    // Mimic the setup page: show all supported currencies
    const fetchCurrencies = async () => {
      const service = CurrencyService.getInstance();
      const rates = await service.fetchLiveRates();
      setCurrencyOptions(rates.map(r => ({ code: r.currency, name: r.currency })));
    };
    fetchCurrencies();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{pageTitle}</h1>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>
              Basic information about the loan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Loan Name *</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  placeholder="Company A Loan" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input 
                  id="clientName" 
                  name="clientName" 
                  value={formData.clientName} 
                  onChange={handleInputChange} 
                  placeholder="Company A" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="portfolioId">Portfolio *</Label>
                <Select 
                  value={formData.portfolioId} 
                  onValueChange={(value) => handleSelectChange('portfolioId', value)}
                >
                  <SelectTrigger id="portfolioId">
                    <SelectValue placeholder="Select a portfolio" />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolios.map(portfolio => (
                      <SelectItem key={portfolio.id} value={portfolio.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{portfolio.name}</span>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge variant="secondary" className="text-xs">
                              {portfolio.loanCount} loans
                            </Badge>
                            {portfolio.isDefault && (
                              <Badge variant="outline" className="text-xs">Default</Badge>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientType">Client Type</Label>
                <Select 
                  value={formData.clientType} 
                  onValueChange={(value) => handleSelectChange('clientType', value)}
                >
                  <SelectTrigger id="clientType">
                    <SelectValue placeholder="Select client type" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientTemplateService.getClientTypes().map(type => (
                      <SelectItem key={type.key} value={type.key}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Loan Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="term">Term</SelectItem>
                    <SelectItem value="revolver">Revolving</SelectItem>
                    <SelectItem value="bullet">Bullet</SelectItem>
                    <SelectItem value="amortizing">Amortizing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="restructured">Restructured</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input 
                  id="startDate" 
                  name="startDate" 
                  type="date" 
                  value={formData.startDate} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input 
                  id="endDate" 
                  name="endDate" 
                  type="date" 
                  value={formData.endDate} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={value => handleSelectChange('currency', value)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map(currency => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="originalAmount">Original Amount *</Label>
                <Input 
                  id="originalAmount" 
                  name="originalAmount" 
                  type="number" 
                  value={formData.originalAmount} 
                  onChange={handleInputChange} 
                  placeholder="1000000" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="drawnAmount">Drawn Amount</Label>
                <Input
                  id="drawnAmount"
                  name="drawnAmount"
                  type="number"
                  value={formData.drawnAmount}
                  onChange={handleInputChange}
                  placeholder="1000000"
                />
              </div>
              {/* Only show Undrawn Amount for non-revolver loans */}
              {(formData.type === 'term' || formData.type === 'bullet' || formData.type === 'amortizing') && (
                <div className="space-y-2">
                  <Label htmlFor="undrawnAmount">Undrawn Amount</Label>
                  <Input
                    id="undrawnAmount"
                    name="undrawnAmount"
                    type="number"
                    value={formData.undrawnAmount}
                    onChange={handleInputChange}
                    placeholder="1200000"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The portion of the authorized line not yet drawn.
                  </p>
                </div>
              )}
              {formData.type === 'revolver' && (
                <div className="space-y-2">
                  <Label htmlFor="revocableImmediately">Revocable Immediately</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="revocableImmediately"
                      name="revocableImmediately"
                      type="checkbox"
                      checked={!!formData.revocableImmediately}
                      onChange={e => setFormData(prev => ({ ...prev, revocableImmediately: e.target.checked }))}
                    />
                    <span className="text-xs text-muted-foreground">If checked, CCF will be 10% regardless of duration.</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Risk and Profitability</CardTitle>
            <CardDescription>
              Information about loan risk and profitability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rating System Selection */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <h3 className="text-lg font-medium mb-4">Credit Rating System</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Rating Type for PD Calculation</Label>
                  <Select 
                    value={selectedRatingType} 
                    onValueChange={(value: RatingType) => setSelectedRatingType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal Rating</SelectItem>
                      <SelectItem value="sp">S&P Rating</SelectItem>
                      <SelectItem value="moodys">Moody's Rating</SelectItem>
                      <SelectItem value="fitch">Fitch Rating</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select which rating system to use for automatic PD calculation
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="internalRating">Internal Rating</Label>
                  <Select 
                    value={formData.internalRating} 
                    onValueChange={(value) => handleRatingChange('internalRating', value)}
                  >
                    <SelectTrigger id="internalRating">
                      <SelectValue placeholder="Select internal rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">N/A</SelectItem>
                      {getInternalRatingOptions().map(rating => (
                        <SelectItem key={rating} value={rating}>{rating}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="spRating">S&P Rating</Label>
                  <Select 
                    value={formData.spRating} 
                    onValueChange={(value) => handleRatingChange('spRating', value)}
                  >
                    <SelectTrigger id="spRating">
                      <SelectValue placeholder="Select S&P rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">N/A</SelectItem>
                      {getSPRatingOptions().map(rating => (
                        <SelectItem key={rating} value={rating}>{rating}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="moodysRating">Moody's Rating</Label>
                  <Select 
                    value={formData.moodysRating} 
                    onValueChange={(value) => handleRatingChange('moodysRating', value)}
                  >
                    <SelectTrigger id="moodysRating">
                      <SelectValue placeholder="Select Moody's rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">N/A</SelectItem>
                      {getMoodysRatingOptions().map(rating => (
                        <SelectItem key={rating} value={rating}>{rating}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fitchRating">Fitch Rating</Label>
                  <Select 
                    value={formData.fitchRating} 
                    onValueChange={(value) => handleRatingChange('fitchRating', value)}
                  >
                    <SelectTrigger id="fitchRating">
                      <SelectValue placeholder="Select Fitch rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">N/A</SelectItem>
                      {getFitchRatingOptions().map(rating => (
                        <SelectItem key={rating} value={rating}>{rating}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                At least one rating must be provided (not N/A). The selected rating type above will be used for automatic PD calculation.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pd">Probability of Default (%)</Label>
                <Input 
                  id="pd" 
                  name="pd" 
                  type="number" 
                  step="0.01" 
                  value={formData.pd} 
                  onChange={handleInputChange} 
                  placeholder="1.0" 
                />
                <p className="text-xs text-muted-foreground">
                  Auto-calculated from selected rating type
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lgd">Loss Given Default (%)</Label>
                <Input 
                  id="lgd" 
                  name="lgd" 
                  type="number" 
                  step="0.1" 
                  value={formData.lgd} 
                  onChange={handleInputChange} 
                  placeholder="45.0" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="margin">Margin (%)</Label>
                <Input 
                  id="margin" 
                  name="margin" 
                  type="number" 
                  step="0.01" 
                  value={formData.margin} 
                  onChange={handleInputChange} 
                  placeholder="2.0" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="referenceRate">Reference Rate (%)</Label>
                <Input 
                  id="referenceRate" 
                  name="referenceRate" 
                  type="number" 
                  step="0.01" 
                  value={formData.referenceRate} 
                  onChange={handleInputChange} 
                  placeholder="3.0" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Classification</CardTitle>
            <CardDescription>
              Loan classification information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
                <Select 
                  value={formData.sector} 
                  onValueChange={(value) => handleSelectChange('sector', value)}
                >
                  <SelectTrigger id="sector">
                    <SelectValue placeholder="Select a sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Financial Services">Financial Services</SelectItem>
                    <SelectItem value="Energy">Energy</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Real Estate">Real Estate</SelectItem>
                    <SelectItem value="Transportation">Transportation</SelectItem>
                    <SelectItem value="Telecommunications">Telecommunications</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select 
                  value={formData.country} 
                  onValueChange={(value) => handleSelectChange('country', value)}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="Spain">Spain</SelectItem>
                    <SelectItem value="Italy">Italy</SelectItem>
                    <SelectItem value="Netherlands">Netherlands</SelectItem>
                    <SelectItem value="Switzerland">Switzerland</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Fees</CardTitle>
            <CardDescription>
              Various fee structures associated with the loan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="upfrontFee">Upfront Fee</Label>
                <Input 
                  id="upfrontFee" 
                  name="upfrontFee" 
                  type="number" 
                  step="0.01" 
                  value={formData.upfrontFee} 
                  onChange={handleInputChange} 
                  placeholder="0" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="commitmentFee">Commitment Fee (%)</Label>
                <Input 
                  id="commitmentFee" 
                  name="commitmentFee" 
                  type="number" 
                  step="0.01" 
                  value={formData.commitmentFee} 
                  onChange={handleInputChange} 
                  placeholder="0" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="agencyFee">Agency Fee</Label>
                <Input 
                  id="agencyFee" 
                  name="agencyFee" 
                  type="number" 
                  step="0.01" 
                  value={formData.agencyFee} 
                  onChange={handleInputChange} 
                  placeholder="0" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otherFee">Other Fee</Label>
                <Input 
                  id="otherFee" 
                  name="otherFee" 
                  type="number" 
                  step="0.01" 
                  value={formData.otherFee} 
                  onChange={handleInputChange} 
                  placeholder="0" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Cash Flow Structure</CardTitle>
            <CardDescription>
              Amortization and payment parameters for the loan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interestPaymentFrequency">Interest Payment Frequency</Label>
                <Select
                  value={formData.interestPaymentFrequency}
                  onValueChange={value => handleSelectChange('interestPaymentFrequency', value)}
                >
                  <SelectTrigger id="interestPaymentFrequency">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semiannual">Semiannual</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="principalRepaymentFrequency">Principal Repayment Frequency</Label>
                <Select
                  value={formData.principalRepaymentFrequency}
                  onValueChange={value => handleSelectChange('principalRepaymentFrequency', value)}
                >
                  <SelectTrigger id="principalRepaymentFrequency">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semiannual">Semiannual</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amortizationType">Amortization Type</Label>
                <Select
                  value={formData.amortizationType}
                  onValueChange={value => handleSelectChange('amortizationType', value)}
                >
                  <SelectTrigger id="amortizationType">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inFine">Bullet</SelectItem>
                    <SelectItem value="constant">Constant</SelectItem>
                    <SelectItem value="annuity">Annuity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interestCalculationMethod">Interest Calculation Method</Label>
                <Select
                  value={formData.interestCalculationMethod}
                  onValueChange={value => handleSelectChange('interestCalculationMethod', value)}
                >
                  <SelectTrigger id="interestCalculationMethod">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mois de 30 jours/Année de 360 jours">30/360</SelectItem>
                    <SelectItem value="Nombre de jours réel / Nombre de jours réel">Actual/Actual</SelectItem>
                    <SelectItem value="BOND">Bond</SelectItem>
                    <SelectItem value="Nombre de jours réel/Année de 360 jours">Actual/360</SelectItem>
                    <SelectItem value="Mois de 30 jours/Année de 365 jours">30/365</SelectItem>
                    <SelectItem value="Nombre de jours réel/Année de 365 jours">Actual/365</SelectItem>
                    <SelectItem value="BANK">BANK</SelectItem>
                    <SelectItem value="G365">G365</SelectItem>
                    <SelectItem value="G5/6">G5/6</SelectItem>
                    <SelectItem value="M30">M30</SelectItem>
                    <SelectItem value="M30E">M30E</SelectItem>
                    <SelectItem value="n/a">n/a</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gracePeriodMonths">Grace Period (months)</Label>
                <Input
                  id="gracePeriodMonths"
                  name="gracePeriodMonths"
                  type="number"
                  min="0"
                  value={formData.gracePeriodMonths}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <Switch
                  id="allowPrepayment"
                  checked={!!formData.allowPrepayment}
                  onCheckedChange={checked => setFormData(prev => ({ ...prev, allowPrepayment: checked }))}
                />
                <Label htmlFor="allowPrepayment">Allow prepayments</Label>
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <Switch
                  id="allowPenalty"
                  checked={!!formData.allowPenalty}
                  onCheckedChange={checked => setFormData(prev => ({ ...prev, allowPenalty: checked }))}
                />
                <Label htmlFor="allowPenalty">Allow penalties</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 mt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Loan' : 'Create Loan'}
          </Button>
          <Button type="button" variant="outline" onClick={() => {
  if (isEditMode && loanId) {
    navigate(`/loans/${loanId}`);
  } else {
    navigate('/loans');
  }
}}>
              Cancel
            </Button>
        </div>
      </form>
    </div>
  );
};

export default LoanNew;

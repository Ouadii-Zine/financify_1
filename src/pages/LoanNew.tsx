import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loan, LoanType, LoanStatus, Currency, ClientType, PortfolioSummary, SPRating, S_P_RATING_MAPPINGS, LoanRatings, InternalRating, MoodysRating, FitchRating, RatingType, FundingIndex } from '@/types/finance';
import { convertToSPRating, getPDFromParameters } from '@/utils/financialCalculations';
import LoanDataService from '@/services/LoanDataService';
import { getRecommendedModel, getRecommendedGuaranteeParams, CollateralType, LGDModel, GuaranteeType } from '@/utils/lgdModels';
import CollateralManager from '@/components/collateral/CollateralManager';
import CollateralAnalytics from '@/components/collateral/CollateralAnalytics';
import { CollateralPortfolio } from '@/types/finance';
import CollateralService from '@/services/CollateralService';

import PortfolioService, { PORTFOLIOS_UPDATED_EVENT } from '@/services/PortfolioService';
import ClientTemplateService from '@/services/ClientTemplateService';
import ParameterService from '@/services/ParameterService';
import { Switch } from '@/components/ui/switch';
import CurrencyService from '@/services/CurrencyService';
import FundingIndexService from '@/services/FundingIndexService';
import { Shield } from 'lucide-react';

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
  
  // Enhanced LGD Configuration
  lgdType: 'constant' | 'variable' | 'guaranteed' | 'collateralized';
  lgdConstant?: string;
  lgdVariable?: {
    type: 'realEstate' | 'equipment' | 'vehicle' | 'cash' | 'other';
    initialValue: string;
    model: 'linear' | 'exponential' | 'logarithmic' | 'polynomial';
    parameters: {
      depreciationRate?: string;
      appreciationRate?: string;
      halfLife?: string;
      polynomialCoefficients?: string;
    };
  };
  lgdGuaranteed?: {
    baseLGD: string;
    guaranteeType: 'government' | 'corporate' | 'personal' | 'collateral' | 'other';
    coverage: string;
    guarantorLGD: string;
  };
  
  // Multi-rating system
  internalRating: string;
  spRating: string;
  moodysRating: string;
  fitchRating: string;
  
  margin: string;
  referenceRate: string;
  rateType: 'fixed' | 'variable';
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
      // Force re-render to update internal rating options
      setParametersVersion(prev => prev + 1);
    };
    
    window.addEventListener('parameters-updated', handleParametersUpdated);
    
    return () => {
      window.removeEventListener('parameters-updated', handleParametersUpdated);
    };
  }, []);
  
  // Get default LGD for a sector
  const getDefaultLGDForSector = (sector: string): number => {
    const parameters = ParameterService.loadParameters();
    const sectorLGD = parameters.lgdAssumptions.find(s => s.sector === sector);
    return sectorLGD ? sectorLGD.lgd * 100 : 45; // Default to 45% if sector not found
  };

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
    drawnAmount: '1000000', // Default to original amount for term loans
    undrawnAmount: '0',
    pd: '0.75', // Default PD for BB+ rating
    lgd: '45',
    ead: '',
    sector: 'Technology',
    country: 'France',
    lgdType: 'constant',
    lgdConstant: getDefaultLGDForSector('Technology').toString(),
    lgdVariable: {
      type: 'equipment',
      initialValue: '45',
      model: 'exponential',
      parameters: {
        depreciationRate: '15'
      }
    },
    lgdGuaranteed: {
      baseLGD: '45',
      guaranteeType: 'government',
      coverage: '80',
      guarantorLGD: '0'
    },
    internalRating: 'BB+', // Will be updated to first available rating
    spRating: 'N/A',
    moodysRating: 'N/A',
    fitchRating: 'N/A',
    margin: '2',
    referenceRate: '3',
    rateType: 'variable',
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
  const [parametersVersion, setParametersVersion] = useState(0); // Force re-render when parameters change
  const [collateralPortfolio, setCollateralPortfolio] = useState<CollateralPortfolio>({
    id: '',
    loanId: '',
    totalValue: 0,
    currency: 'EUR',
    diversificationScore: 0,
    concentrationRisk: 0,
    items: [],
    portfolioRiskMetrics: {
      totalValueAtRisk: 0,
      weightedAverageVolatility: 0,
      correlationMatrix: [],
      stressTestResults: [],
      expectedShortfall: 0,
      portfolioBeta: 0
    },
    regulatoryCompliance: {
      baselCompliant: true,
      lcrEligible: false,
      hqlaCategory: 'ineligible',
      haircutPercentage: 0.25,
      regulatoryRatios: {
        lcrRatio: 0,
        nsfRatio: 0,
        hqlaRatio: 0
      }
    }
  });
  
  // Update form currency when currentCurrency changes
  useEffect(() => {
    setFormData(prev => {
      const updatedData = {
        ...prev,
        currency: currentCurrency
      };
      
      // No funding index handling needed in form
      
      return updatedData;
    });
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

  // Update default internal rating when parameters change
  useEffect(() => {
    const parameters = ParameterService.loadParameters();
    const availableInternalRatings = parameters.ratingPDMappings.internal.map(rating => rating.rating);
    
    if (availableInternalRatings.length > 0) {
      setFormData(prev => {
        // Check if current internal rating is still valid
        const currentRating = prev.internalRating;
        const isCurrentRatingValid = availableInternalRatings.includes(currentRating);
        
        return {
          ...prev,
          // If current rating is invalid or this is a new loan, use first available rating
          internalRating: isCurrentRatingValid ? currentRating : availableInternalRatings[0]
        };
      });
    } else {
      // If no internal ratings available, set to N/A
      setFormData(prev => ({
        ...prev,
        internalRating: 'N/A'
      }));
    }
  }, [parametersVersion, isEditMode]);
  
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
            outstandingAmount: loanToEdit.outstandingAmount?.toString() || '',
            drawnAmount: loanToEdit.drawnAmount?.toString() || '',
            undrawnAmount: loanToEdit.undrawnAmount?.toString() || '',
            pd: (loanToEdit.pd * 100).toString(),
            lgd: (loanToEdit.lgd * 100).toString(),
            ead: loanToEdit.ead?.toString() || '',
            sector: loanToEdit.sector,
            country: loanToEdit.country,
            lgdType: loanToEdit.lgdType || 'constant',
            lgdConstant: loanToEdit.lgdConstant ? (loanToEdit.lgdConstant * 100).toString() : undefined,
            lgdVariable: loanToEdit.lgdVariable ? {
              type: loanToEdit.lgdVariable.type,
              initialValue: (loanToEdit.lgdVariable.initialValue * 100).toString(),
              model: loanToEdit.lgdVariable.model,
              parameters: {
                depreciationRate: loanToEdit.lgdVariable.parameters?.depreciationRate ? (loanToEdit.lgdVariable.parameters.depreciationRate * 100).toString() : undefined,
                appreciationRate: loanToEdit.lgdVariable.parameters?.appreciationRate ? (loanToEdit.lgdVariable.parameters.appreciationRate * 100).toString() : undefined,
                halfLife: loanToEdit.lgdVariable.parameters?.halfLife ? loanToEdit.lgdVariable.parameters.halfLife.toString() : undefined,
                polynomialCoefficients: loanToEdit.lgdVariable.parameters?.polynomialCoefficients ? loanToEdit.lgdVariable.parameters.polynomialCoefficients.join(',') : undefined
              }
            } : undefined,
            lgdGuaranteed: loanToEdit.lgdGuaranteed ? {
              baseLGD: (loanToEdit.lgdGuaranteed.baseLGD * 100).toString(),
              guaranteeType: loanToEdit.lgdGuaranteed.guaranteeType,
              coverage: (loanToEdit.lgdGuaranteed.coverage * 100).toString(),
              guarantorLGD: (loanToEdit.lgdGuaranteed.guarantorLGD * 100).toString()
            } : undefined,
            internalRating: loanToEdit.ratings?.internal || loanToEdit.internalRating || 'BB+',
            spRating: loanToEdit.ratings?.sp || 'N/A',
            moodysRating: loanToEdit.ratings?.moodys || 'N/A',
            fitchRating: loanToEdit.ratings?.fitch || 'N/A',
            margin: (loanToEdit.margin * 100).toString(),
            referenceRate: (loanToEdit.referenceRate * 100).toString(),
            rateType: loanToEdit.rateType || 'variable',
            upfrontFee: loanToEdit.fees.upfront?.toString() || '0',
            commitmentFee: loanToEdit.fees.commitment?.toString() || '0',
            agencyFee: loanToEdit.fees.agency?.toString() || '0',
            otherFee: loanToEdit.fees.other?.toString() || '0',
            // --- NOUVEAUX CHAMPS STRUCTURE CASHFLOW ---
            interestPaymentFrequency: loanToEdit.interestPaymentFrequency,
            principalRepaymentFrequency: loanToEdit.principalRepaymentFrequency,
            amortizationType: loanToEdit.amortizationType,
            interestCalculationMethod: loanToEdit.interestCalculationMethod,
            gracePeriodMonths: loanToEdit.gracePeriodMonths?.toString() || '0',
            allowPrepayment: loanToEdit.allowPrepayment ?? false,
            allowPenalty: loanToEdit.allowPenalty ?? false,
            revocableImmediately: loanToEdit.revocableImmediately ?? false
            // ------------------------------------------------
          });

          // Load collateral portfolio if it exists
          if (loanToEdit.collateralPortfolio) {
            setCollateralPortfolio(loanToEdit.collateralPortfolio);
          }
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
    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };
      
      // Sync lgdConstant with main lgd field
      if (name === 'lgdConstant') {
        updatedData.lgd = value;
      }
      
      return updatedData;
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };
      
      // Currency change handled separately
      if (name === 'currency') {
        // No funding index handling needed in form
      }
      
      // Update LGD when sector changes
      if (name === 'sector') {
        const defaultLGD = getDefaultLGDForSector(value);
        updatedData.lgd = defaultLGD.toString();
        if (updatedData.lgdType === 'constant') {
          updatedData.lgdConstant = defaultLGD.toString();
        }
      }
      
      return updatedData;
    });
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

  const handleLGDTypeChange = (lgdType: 'constant' | 'variable' | 'guaranteed' | 'collateralized') => {
    setFormData(prev => {
      const updatedData = { ...prev, lgdType };
      
      if (lgdType === 'constant') {
        // Set constant LGD to current sector default
        const defaultLGD = getDefaultLGDForSector(prev.sector);
        updatedData.lgdConstant = defaultLGD.toString();
        updatedData.lgd = defaultLGD.toString();
      } else if (lgdType === 'variable') {
        // Set variable LGD with recommended defaults
        const recommended = getRecommendedModel('equipment');
        updatedData.lgdVariable = {
          type: 'equipment',
          initialValue: '45',
          model: recommended.model,
          parameters: {
            depreciationRate: '15'
          }
        };
        updatedData.lgd = '45';
      } else if (lgdType === 'guaranteed') {
        // Set guaranteed LGD with recommended defaults
        const recommended = getRecommendedGuaranteeParams('government');
        updatedData.lgdGuaranteed = {
          baseLGD: '45',
          guaranteeType: 'government',
          coverage: (recommended.coverage * 100).toString(),
          guarantorLGD: (recommended.guarantorLGD * 100).toString()
        };
        // Calculate initial LGD using guarantee formula
        const baseLGD = 0.45;
        const finalLGD = baseLGD * (1 - recommended.coverage) + recommended.guarantorLGD * recommended.coverage;
        updatedData.lgd = (finalLGD * 100).toString();
      } else if (lgdType === 'collateralized') {
        // Set collateralized LGD - will be calculated based on collateral portfolio
        updatedData.lgd = '30'; // Lower base LGD due to collateral
      }
      
      return updatedData;
    });
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
        // For term loans, if drawnAmount is 0 or empty, use originalAmount
        if (drawnAmount === 0 || isNaN(drawnAmount)) {
          drawnAmount = parseFloat(formData.originalAmount);
        }
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
        lgd: (() => {
          // Calculate the appropriate LGD based on type
          if (formData.lgdType === 'guaranteed' && formData.lgdGuaranteed) {
            const baseLGD = parseFloat(formData.lgdGuaranteed.baseLGD.toString()) / 100;
            const coverage = parseFloat(formData.lgdGuaranteed.coverage.toString()) / 100;
            const guarantorLGD = parseFloat(formData.lgdGuaranteed.guarantorLGD.toString()) / 100;
            return baseLGD * (1 - coverage) + guarantorLGD * coverage;
          } else if (formData.lgdType === 'collateralized' && collateralPortfolio.items.length > 0) {
            // Use the collateral service to calculate effective LGD
            const collateralService = CollateralService.getInstance();
            return collateralService.calculateEffectiveLGD(
              parseFloat(formData.lgd.toString()) / 100,
              collateralPortfolio,
              parseFloat(formData.originalAmount.toString()),
              0.25
            );
          } else if (formData.lgdType === 'constant' && formData.lgdConstant) {
            return parseFloat(formData.lgdConstant.toString()) / 100;
          } else if (formData.lgdType === 'variable' && formData.lgdVariable) {
            return parseFloat(formData.lgdVariable.initialValue.toString()) / 100;
          } else {
            return parseFloat(formData.lgd.toString()) / 100;
          }
        })(),
        ead: parseFloat(formData.originalAmount.toString()),
        // Enhanced LGD Configuration
        lgdType: formData.lgdType,
        lgdConstant: formData.lgdConstant ? parseFloat(formData.lgdConstant.toString()) / 100 : undefined,
        lgdVariable: formData.lgdVariable ? {
          type: formData.lgdVariable.type,
          initialValue: parseFloat(formData.lgdVariable.initialValue?.toString() || '45') / 100,
          model: formData.lgdVariable.model,
          parameters: {
            depreciationRate: formData.lgdVariable.parameters?.depreciationRate ? parseFloat(formData.lgdVariable.parameters.depreciationRate.toString()) / 100 : undefined,
            appreciationRate: formData.lgdVariable.parameters?.appreciationRate ? parseFloat(formData.lgdVariable.parameters.appreciationRate.toString()) / 100 : undefined,
            halfLife: formData.lgdVariable.parameters?.halfLife ? parseFloat(formData.lgdVariable.parameters.halfLife.toString()) : undefined,
            polynomialCoefficients: formData.lgdVariable.parameters?.polynomialCoefficients ? formData.lgdVariable.parameters.polynomialCoefficients.split(',').map(c => parseFloat(c.trim())) : undefined
          }
        } : undefined,
        lgdGuaranteed: formData.lgdGuaranteed ? {
          baseLGD: parseFloat(formData.lgdGuaranteed.baseLGD.toString()) / 100,
          guaranteeType: formData.lgdGuaranteed.guaranteeType,
          coverage: parseFloat(formData.lgdGuaranteed.coverage.toString()) / 100,
          guarantorLGD: parseFloat(formData.lgdGuaranteed.guarantorLGD.toString()) / 100
        } : undefined,
        fees: {
          upfront: parseFloat(formData.upfrontFee?.toString() || '0'),
          commitment: parseFloat(formData.commitmentFee?.toString() || '0'),
          agency: parseFloat(formData.agencyFee?.toString() || '0'),
          other: parseFloat(formData.otherFee?.toString() || '0')
        },
        margin: parseFloat(formData.margin.toString()) / 100,
        rateType: formData.rateType,
        referenceRate: parseFloat(formData.referenceRate.toString()) / 100,
        fundingIndex: ParameterService.loadParameters().defaultFundingIndex || 'SOFR',
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
        revocableImmediately: formData.revocableImmediately || false,
        // ------------------------------------------------
        
        // Enhanced Collateral Portfolio
        collateralPortfolio: formData.lgdType === 'collateralized' ? {
          ...collateralPortfolio,
          id: `collateral-${loanId}`,
          loanId: loanId,
          currency: formData.currency
        } : undefined,
        
        // Enhanced LGD Configuration with Collateral
        enhancedLGDConfig: formData.lgdType === 'collateralized' ? {
          type: 'collateralized',
          collateralized: {
            baseLGD: parseFloat(formData.lgd.toString()) / 100,
            collateralPortfolio: {
              ...collateralPortfolio,
              id: `collateral-${loanId}`,
              loanId: loanId,
              currency: formData.currency
            },
            haircutPercentage: 0.25,
            correlationAdjustment: 0.1
          }
        } : formData.lgdType === 'guaranteed' ? {
          type: 'guaranteed',
          guaranteed: {
            baseLGD: parseFloat(formData.lgdGuaranteed?.baseLGD.toString() || '45') / 100,
            guaranteeType: formData.lgdGuaranteed?.guaranteeType || 'government',
            coverage: parseFloat(formData.lgdGuaranteed?.coverage.toString() || '80') / 100,
            guarantorLGD: parseFloat(formData.lgdGuaranteed?.guarantorLGD.toString() || '0') / 100
          }
        } : formData.lgdType === 'variable' ? {
          type: 'variable',
          variable: {
            baseLGD: parseFloat(formData.lgdVariable?.initialValue.toString() || '45') / 100,
            collateralAdjustment: 0,
            timeDecay: 0.05
          }
        } : formData.lgdType === 'constant' ? {
          type: 'constant',
          constant: parseFloat(formData.lgdConstant?.toString() || formData.lgd.toString()) / 100
        } : undefined
      };
      
      if (isEditMode && formData.id) {
        // Use the proper updateLoan method
        const updateSuccess = loanDataService.updateLoan(formData.id, preparedLoan, ParameterService.loadParameters());
        
        if (updateSuccess) {
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
          throw new Error("Failed to update loan.");
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
  const internalRatingOptions = React.useMemo(() => {
    const parameters = ParameterService.loadParameters();
    return parameters.ratingPDMappings.internal.map(rating => rating.rating);
  }, [parametersVersion]); // Re-evaluate when parameters change

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
                <Label htmlFor="rateType">Rate Type</Label>
                <Select
                  value={formData.rateType}
                  onValueChange={value => handleSelectChange('rateType', value)}
                >
                  <SelectTrigger id="rateType">
                    <SelectValue placeholder="Select rate type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Rate</SelectItem>
                    <SelectItem value="variable">Variable Rate</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Fixed rate loans have a constant interest rate. Variable rate loans adjust based on market conditions.
                </p>
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
                      {internalRatingOptions.map(rating => (
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
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            
            {/* Unified LGD & Collateral Management */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                LGD & Collateral Management
              </h3>
              
              {/* LGD Type Selection */}
              <div className="mb-6">
                <Label className="text-base font-medium">LGD Type</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button
                    type="button"
                    variant={formData.lgdType === 'constant' ? 'default' : 'outline'}
                    onClick={() => handleLGDTypeChange('constant')}
                  >
                    Constant
                  </Button>
                  <Button
                    type="button"
                    variant={formData.lgdType === 'variable' ? 'default' : 'outline'}
                    onClick={() => handleLGDTypeChange('variable')}
                  >
                    Variable
                  </Button>
                  <Button
                    type="button"
                    variant={formData.lgdType === 'guaranteed' ? 'default' : 'outline'}
                    onClick={() => handleLGDTypeChange('guaranteed')}
                  >
                    Guaranteed
                  </Button>
                  <Button
                    type="button"
                    variant={formData.lgdType === 'collateralized' ? 'default' : 'outline'}
                    onClick={() => handleLGDTypeChange('collateralized')}
                  >
                    Collateralized
                  </Button>
                </div>
              </div>

              {/* LGD Configuration Based on Type */}
              <div className="space-y-6">
                {/* Current LGD Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lgd">Current LGD (%)</Label>
                    <Input 
                      id="lgd" 
                      name="lgd" 
                      type="number" 
                      step="0.1" 
                      value={formData.lgd} 
                      onChange={handleInputChange} 
                      placeholder="45.0" 
                      disabled={formData.lgdType === 'variable'}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.lgdType === 'constant' ? 'Direct LGD value' : 'Calculated from model'}
                    </p>
                  </div>
                </div>

                {/* Constant LGD Configuration */}
                {formData.lgdType === 'constant' && (
                  <div className="space-y-2">
                    <Label htmlFor="lgdConstant">Constant LGD Value (%)</Label>
                    <Input 
                      id="lgdConstant" 
                      name="lgdConstant" 
                      type="number" 
                      step="0.1" 
                      value={formData.lgdConstant} 
                      onChange={handleInputChange} 
                      placeholder="45.0" 
                    />
                    <p className="text-xs text-muted-foreground">
                      Default: {getDefaultLGDForSector(formData.sector)}% (based on {formData.sector} sector)
                    </p>
                  </div>
                )}

                {/* Variable LGD Configuration */}
                {formData.lgdType === 'variable' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <h4 className="font-medium">Variable LGD Configuration</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure variable LGD based on collateral value changes over time.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Collateral Type</Label>
                        <Select 
                          value={formData.lgdVariable?.type || 'equipment'} 
                          onValueChange={(value: CollateralType) => {
                            const recommended = getRecommendedModel(value);
                            setFormData(prev => ({
                              ...prev,
                              lgdVariable: {
                                ...prev.lgdVariable!,
                                type: value,
                                model: recommended.model,
                                parameters: {
                                  depreciationRate: recommended.parameters.depreciationRate?.toString() || '',
                                  appreciationRate: recommended.parameters.appreciationRate?.toString() || '',
                                  halfLife: recommended.parameters.halfLife?.toString() || '',
                                  polynomialCoefficients: recommended.parameters.polynomialCoefficients?.join(',') || ''
                                }
                              }
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select collateral type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="realEstate">Real Estate</SelectItem>
                            <SelectItem value="equipment">Equipment</SelectItem>
                            <SelectItem value="vehicle">Vehicle</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Mathematical Model</Label>
                        <Select 
                          value={formData.lgdVariable?.model || 'exponential'} 
                          onValueChange={(value: LGDModel) => {
                            setFormData(prev => ({
                              ...prev,
                              lgdVariable: {
                                ...prev.lgdVariable!,
                                model: value
                              }
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linear">Linear</SelectItem>
                            <SelectItem value="exponential">Exponential</SelectItem>
                            <SelectItem value="logarithmic">Logarithmic</SelectItem>
                            <SelectItem value="polynomial">Polynomial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="initialValue">Initial LGD Value (%)</Label>
                        <Input 
                          id="initialValue" 
                          name="lgdVariable.initialValue" 
                          type="number" 
                          step="0.1" 
                          value={formData.lgdVariable?.initialValue || '45'} 
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            lgdVariable: {
                              ...prev.lgdVariable || {
                                type: 'equipment',
                                model: 'exponential',
                                parameters: {}
                              },
                              initialValue: e.target.value
                            }
                          }))} 
                          placeholder="45.0" 
                        />
                      </div>
                      
                      {formData.lgdVariable?.type === 'realEstate' && (
                        <div className="space-y-2">
                          <Label htmlFor="appreciationRate">Annual Appreciation Rate (%)</Label>
                          <Input 
                            id="appreciationRate" 
                            name="lgdVariable.parameters.appreciationRate" 
                            type="number" 
                            step="0.1" 
                            value={formData.lgdVariable?.parameters?.appreciationRate || '3'} 
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              lgdVariable: {
                                ...prev.lgdVariable || {
                                  type: 'realEstate',
                                  initialValue: '45',
                                  model: 'exponential',
                                  parameters: {}
                                },
                                parameters: {
                                  ...prev.lgdVariable?.parameters || {},
                                  appreciationRate: e.target.value
                                }
                              }
                            }))} 
                            placeholder="3.0" 
                          />
                        </div>
                      )}
                      
                      {(formData.lgdVariable?.type === 'equipment' || formData.lgdVariable?.type === 'vehicle') && (
                        <div className="space-y-2">
                          <Label htmlFor="depreciationRate">Annual Depreciation Rate (%)</Label>
                          <Input 
                            id="depreciationRate" 
                            name="lgdVariable.parameters.depreciationRate" 
                            type="number" 
                            step="0.1" 
                            value={formData.lgdVariable?.parameters?.depreciationRate || '15'} 
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              lgdVariable: {
                                ...prev.lgdVariable || {
                                  type: 'equipment',
                                  initialValue: '45',
                                  model: 'exponential',
                                  parameters: {}
                                },
                                parameters: {
                                  ...prev.lgdVariable?.parameters || {},
                                  depreciationRate: e.target.value
                                }
                              }
                            }))} 
                            placeholder="15.0" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Guaranteed LGD Configuration */}
                {formData.lgdType === 'guaranteed' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                    <h4 className="font-medium">Guaranteed LGD Configuration</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure guaranteed LGD using the formula: LGD_final = LGD_unsecured × (1 - Coverage) + LGD_guarantor × Coverage
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="baseLGD">Base LGD (Unsecured) (%)</Label>
                        <Input 
                          id="baseLGD" 
                          name="lgdGuaranteed.baseLGD" 
                          type="number" 
                          step="0.1" 
                          value={formData.lgdGuaranteed?.baseLGD || '45'} 
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            lgdGuaranteed: {
                              ...prev.lgdGuaranteed || {
                                baseLGD: '45',
                                guaranteeType: 'government',
                                coverage: '80',
                                guarantorLGD: '0'
                              },
                              baseLGD: e.target.value
                            }
                          }))} 
                          placeholder="45.0" 
                        />
                        <p className="text-xs text-muted-foreground">
                          LGD without any guarantee protection
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Guarantee Type</Label>
                        <Select 
                          value={formData.lgdGuaranteed?.guaranteeType || 'government'} 
                          onValueChange={(value: GuaranteeType) => {
                            const recommended = getRecommendedGuaranteeParams(value);
                            setFormData(prev => ({
                              ...prev,
                              lgdGuaranteed: {
                                ...prev.lgdGuaranteed || {
                                  baseLGD: '45',
                                  guaranteeType: 'government',
                                  coverage: '80',
                                  guarantorLGD: '0'
                                },
                                guaranteeType: value,
                                coverage: (recommended.coverage * 100).toString(),
                                guarantorLGD: (recommended.guarantorLGD * 100).toString()
                              }
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select guarantee type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="government">Government Guarantee</SelectItem>
                            <SelectItem value="corporate">Corporate Guarantee</SelectItem>
                            <SelectItem value="personal">Personal Guarantee</SelectItem>
                            <SelectItem value="collateral">Collateral Guarantee</SelectItem>
                            <SelectItem value="other">Other Guarantee</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="coverage">Coverage (%)</Label>
                        <Input 
                          id="coverage" 
                          name="lgdGuaranteed.coverage" 
                          type="number" 
                          step="0.1" 
                          value={formData.lgdGuaranteed?.coverage || '80'} 
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            lgdGuaranteed: {
                              ...prev.lgdGuaranteed || {
                                baseLGD: '45',
                                guaranteeType: 'government',
                                coverage: '80',
                                guarantorLGD: '0'
                              },
                              coverage: e.target.value
                            }
                          }))} 
                          placeholder="80.0" 
                        />
                        <p className="text-xs text-muted-foreground">
                          Percentage of exposure covered by guarantee
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="guarantorLGD">Guarantor LGD (%)</Label>
                        <Input 
                          id="guarantorLGD" 
                          name="lgdGuaranteed.guarantorLGD" 
                          type="number" 
                          step="0.1" 
                          value={formData.lgdGuaranteed?.guarantorLGD || '0'} 
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            lgdGuaranteed: {
                              ...prev.lgdGuaranteed || {
                                baseLGD: '45',
                                guaranteeType: 'government',
                                coverage: '80',
                                guarantorLGD: '0'
                              },
                              guarantorLGD: e.target.value
                            }
                          }))} 
                          placeholder="0.0" 
                        />
                        <p className="text-xs text-muted-foreground">
                          LGD of the guarantor (0% for government, higher for others)
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <p className="text-sm">
                        <strong>Guarantee Formula:</strong> LGD_final = {formData.lgdGuaranteed?.baseLGD || '45'}% × (1 - {formData.lgdGuaranteed?.coverage || '80'}%) + {formData.lgdGuaranteed?.guarantorLGD || '0'}% × {formData.lgdGuaranteed?.coverage || '80'}% = {
                          formData.lgdGuaranteed ? 
                            (() => {
                              const baseLGD = parseFloat(formData.lgdGuaranteed.baseLGD) / 100;
                              const coverage = parseFloat(formData.lgdGuaranteed.coverage) / 100;
                              const guarantorLGD = parseFloat(formData.lgdGuaranteed.guarantorLGD) / 100;
                              const result = baseLGD * (1 - coverage) + guarantorLGD * coverage;
                              return (result * 100).toFixed(1) + '%';
                            })()
                          : '0.0%'
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* Collateralized LGD Configuration */}
                {formData.lgdType === 'collateralized' && (
                  <div className="space-y-6">
                    <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/20">
                      <h4 className="font-medium mb-2">Collateralized LGD Configuration</h4>
                      <p className="text-sm text-muted-foreground">
                        LGD is calculated based on the collateral portfolio below. The effective LGD will be automatically computed considering collateral value, haircuts, and correlation adjustments.
                      </p>
                    </div>

                    {/* Collateral Manager */}
                    <CollateralManager
                      portfolio={collateralPortfolio}
                      onPortfolioChange={setCollateralPortfolio}
                      currency={formData.currency}
                    />

                    {/* Collateral Analytics */}
                    {collateralPortfolio.items.length > 0 && (
                      <CollateralAnalytics
                        portfolio={collateralPortfolio}
                        currency={formData.currency}
                      />
                    )}
                  </div>
                )}
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
                    <SelectItem value="Banking">Banking</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Energy">Energy</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Real Estate">Real Estate</SelectItem>
                    <SelectItem value="Telecom">Telecommunications</SelectItem>
                    <SelectItem value="Automotive">Automotive</SelectItem>
                    <SelectItem value="Agriculture">Agriculture</SelectItem>
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

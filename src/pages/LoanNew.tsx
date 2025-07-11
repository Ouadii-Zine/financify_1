import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loan, LoanType, LoanStatus, Currency, ClientType, PortfolioSummary, SPRating, S_P_RATING_MAPPINGS } from '@/types/finance';
import LoanDataService from '@/services/LoanDataService';

import PortfolioService, { PORTFOLIOS_UPDATED_EVENT } from '@/services/PortfolioService';
import ClientTemplateService from '@/services/ClientTemplateService';
import { defaultCalculationParameters } from '@/data/sampleData';

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
  internalRating: SPRating;
  margin: string;
  referenceRate: string;
  upfrontFee?: string;
  commitmentFee?: string;
  agencyFee?: string;
  otherFee?: string;

}

const LoanNew = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loanDataService = LoanDataService.getInstance();
  const portfolioService = PortfolioService.getInstance();
  const clientTemplateService = ClientTemplateService.getInstance();
  
  // Vérifier si nous sommes en mode édition (via le paramètre query)
  const searchParams = new URLSearchParams(location.search);
  const isEditMode = searchParams.get('edit') === 'true';
  const loanId = searchParams.get('id');
  const preSelectedPortfolioId = searchParams.get('portfolio');
  const [pageTitle, setPageTitle] = useState('New Loan');
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [isCreatePortfolioOpen, setIsCreatePortfolioOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  
  const defaultFormData: LoanFormData = {
    name: '',
    clientName: '',
    clientType: 'banqueCommerciale',
    portfolioId: '',
    type: 'term',
    status: 'active',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().split('T')[0],
    currency: 'EUR',
    originalAmount: '',
    outstandingAmount: '',
    drawnAmount: '',
    undrawnAmount: '0',
    pd: '0.75', // Default PD for BB+ rating
    lgd: '45',
    ead: '',
    sector: 'Technology',
    country: 'France',
    internalRating: 'BB+',
    margin: '2',
    referenceRate: '3',
    upfrontFee: '0',
    commitmentFee: '0',
    agencyFee: '0',
    otherFee: '0'
  };
  
  const [formData, setFormData] = useState<LoanFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load portfolios on component mount
  useEffect(() => {
    // Load portfolios
    const portfolioSummaries = portfolioService.getPortfolioSummaries();
    setPortfolios(portfolioSummaries);
    
    setFormData(prev => ({
      ...prev,
      // Set pre-selected portfolio if provided in URL
      portfolioId: preSelectedPortfolioId || (portfolioSummaries.length > 0 ? portfolioSummaries.find(p => p.isDefault)?.id || portfolioSummaries[0].id : '')
    }));
  }, [preSelectedPortfolioId]);
  
  // Effect to load loan data for editing
  useEffect(() => {
    if (isEditMode && loanId) {
      setPageTitle('Edit Loan');
      
      try {
        // Try to retrieve data from localStorage or directly from service
        let loanToEdit: Loan | null = null;
        
        // First, try localStorage (set in LoanDetail)
        const storedLoan = localStorage.getItem('loan-to-edit');
        if (storedLoan) {
          loanToEdit = JSON.parse(storedLoan);
          // Remove from localStorage once used
          localStorage.removeItem('loan-to-edit');
        }
        
        // If not in localStorage, search in service
        if (!loanToEdit) {
          loanToEdit = loanDataService.getLoanById(loanId);
        }
        
        if (loanToEdit) {
          // Convert values for form (percentages, etc.)
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
            pd: (loanToEdit.pd * 100).toString(), // Convertir de décimal à pourcentage
            lgd: (loanToEdit.lgd * 100).toString(), // Convertir de décimal à pourcentage
            ead: loanToEdit.ead.toString(),
            sector: loanToEdit.sector,
            country: loanToEdit.country,
            internalRating: loanToEdit.internalRating,
            margin: (loanToEdit.margin * 100).toString(), // Convertir de décimal à pourcentage
            referenceRate: (loanToEdit.referenceRate * 100).toString(), // Convertir de décimal à pourcentage
            upfrontFee: loanToEdit.fees.upfront.toString(),
            commitmentFee: loanToEdit.fees.commitment.toString(),
            agencyFee: loanToEdit.fees.agency.toString(),
            otherFee: loanToEdit.fees.other.toString()
          });
        } else {
          toast({
            title: "Error",
            description: "The loan to edit cannot be found.",
            variant: "destructive"
          });
          // Redirect to loans list
          navigate('/loans');
        }
      } catch (error) {
        console.error("Error loading loan data:", error);
        toast({
          title: "Error",
          description: "Unable to load loan data for editing.",
          variant: "destructive"
        });
        // Redirect to loans list
        navigate('/loans');
      }
    }
  }, [isEditMode, loanId, navigate, loanDataService]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'internalRating') {
      // Get the PD from S&P rating mapping
      const ratingMapping = S_P_RATING_MAPPINGS.find(r => r.rating === value);
      if (ratingMapping) {
        setFormData(prev => ({ 
          ...prev, 
          [name]: value as SPRating,
          pd: (ratingMapping.pd * 100).toString() // Convert to percentage
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value as SPRating }));
      }
    } else {
    setFormData(prev => ({ ...prev, [name]: value }));
    }
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Generate unique ID if not provided (for new loans)
      const loanId = formData.id || `loan-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Prepare loan with form data
      const preparedLoan: Loan = {
        id: loanId,
        name: formData.name,
        clientName: formData.clientName,
        clientType: formData.clientType,
        portfolioId: formData.portfolioId,
        type: formData.type as LoanType,
        status: formData.status as LoanStatus,
        startDate: formData.startDate,
        endDate: formData.endDate,
        currency: formData.currency as Currency,
        originalAmount: parseFloat(formData.originalAmount.toString()),
        outstandingAmount: parseFloat(formData.originalAmount.toString()), // Always equal to original amount for new/edited loans
        drawnAmount: parseFloat(formData.originalAmount.toString()), // Default to fully drawn
        undrawnAmount: 0, // Default to no undrawn amount
        pd: parseFloat(formData.pd.toString()) / 100, // Convertir en décimal
        lgd: parseFloat(formData.lgd.toString()) / 100, // Convertir en décimal
        ead: parseFloat(formData.originalAmount.toString()), // EAD equals the original amount
        fees: {
          upfront: parseFloat(formData.upfrontFee?.toString() || '0'),
          commitment: parseFloat(formData.commitmentFee?.toString() || '0'),
          agency: parseFloat(formData.agencyFee?.toString() || '0'),
          other: parseFloat(formData.otherFee?.toString() || '0')
        },
        margin: parseFloat(formData.margin.toString()) / 100, // Convertir en décimal
        referenceRate: parseFloat(formData.referenceRate.toString()) / 100, // Convertir en décimal
        internalRating: formData.internalRating,
        sector: formData.sector,
        country: formData.country,
        cashFlows: [], // Conserver les cash flows existants en cas d'édition
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
        }
      };
      
      if (isEditMode && formData.id) {
        // Edit mode: delete old loan and create new one (to ensure proper recalculation)
        const deleteSuccess = loanDataService.deleteLoan(formData.id);
        
        if (deleteSuccess) {
          // Create the new loan with the same ID but fresh calculations
          loanDataService.addLoan(preparedLoan, formData.portfolioId, defaultCalculationParameters);
          
          toast({
            title: "Loan updated",
            description: `The loan "${preparedLoan.name}" has been successfully updated with fresh calculations.`,
            variant: "default"
          });
        } else {
          throw new Error("Failed to update loan - could not remove old version.");
        }
      } else {
        // Creation mode: add new loan
        loanDataService.addLoan(preparedLoan, formData.portfolioId, defaultCalculationParameters);
        
        toast({
          title: "Loan created",
          description: `The loan "${preparedLoan.name}" has been successfully created.`,
          variant: "default"
        });
      }
      
      // Redirect to loans list with a short delay to ensure event is processed
      setTimeout(() => {
        navigate('/loans');
      }, 500);
      
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
                  onValueChange={(value) => handleSelectChange('currency', value)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CHF">CHF</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
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
                <Label htmlFor="internalRating">Internal Rating (S&P)</Label>
                <Select 
                  value={formData.internalRating} 
                  onValueChange={(value) => handleSelectChange('internalRating', value)}
                >
                  <SelectTrigger id="internalRating">
                    <SelectValue placeholder="Select S&P rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AAA">AAA</SelectItem>
                    <SelectItem value="AA+">AA+</SelectItem>
                    <SelectItem value="AA">AA</SelectItem>
                    <SelectItem value="AA-">AA-</SelectItem>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="BBB+">BBB+</SelectItem>
                    <SelectItem value="BBB">BBB</SelectItem>
                    <SelectItem value="BBB-">BBB-</SelectItem>
                    <SelectItem value="BB+">BB+</SelectItem>
                    <SelectItem value="BB">BB</SelectItem>
                    <SelectItem value="BB-">BB-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="CCC+">CCC+</SelectItem>
                    <SelectItem value="CCC">CCC</SelectItem>
                    <SelectItem value="CCC-">CCC-</SelectItem>
                    <SelectItem value="CC">CC</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                  </SelectContent>
                </Select>
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
                <Input 
                  id="sector" 
                  name="sector" 
                  value={formData.sector} 
                  onChange={handleInputChange} 
                  placeholder="Technology" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country" 
                  name="country" 
                  value={formData.country} 
                  onChange={handleInputChange} 
                  placeholder="France" 
                />
              </div>
            </div>
          </CardContent>
        </Card>



        <Card className="mt-6">
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => navigate('/loans')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : isEditMode ? 'Update Loan' : 'Create Loan'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default LoanNew;

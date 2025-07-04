import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertTriangle, CheckCircle2, Download, Info, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { downloadExcelTemplate, generateTemplateDocumentation } from '@/services/ExcelTemplateService';
import ClientTemplateService from '../services/ClientTemplateService';
import LoanDataService from '../services/LoanDataService';
import DynamicColumnsService, { DynamicColumn } from '../services/DynamicColumnsService';
import PortfolioService, { PORTFOLIOS_UPDATED_EVENT } from '../services/PortfolioService';
import { defaultCalculationParameters } from '../data/sampleData';
import { Loan, Portfolio, PortfolioSummary, ClientType } from '../types/finance';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

const Import = () => {
  const navigate = useNavigate();
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<Partial<Loan>[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [detectedColumns, setDetectedColumns] = useState<DynamicColumn[]>([]);
  const [rawImportData, setRawImportData] = useState<Record<string, any>[]>([]);
  const [selectedClientType, setSelectedClientType] = useState<ClientType>('banqueCommerciale');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [isCreatePortfolioOpen, setIsCreatePortfolioOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [templateDocs, setTemplateDocs] = useState<Record<string, string>>({
    prets: generateTemplateDocumentation('prets'),
    cashflows: generateTemplateDocumentation('cashflows'),
    parametres: generateTemplateDocumentation('parametres')
  });
  
  const loanDataService = LoanDataService.getInstance();
  const dynamicColumnsService = DynamicColumnsService.getInstance();
  const clientTemplateService = ClientTemplateService.getInstance();
  const portfolioService = PortfolioService.getInstance();

  // Get available client types from the service
  const availableClientTypes = clientTemplateService.getClientTypes();

  useEffect(() => {
    loanDataService.loadFromLocalStorage();
    loadPortfolios();
    
    // Set default client type to the first available one
    if (availableClientTypes.length > 0) {
      setSelectedClientType(availableClientTypes[0].key as ClientType);
    }
    
    // Listen for portfolio updates
    const handlePortfoliosUpdated = () => {
      loadPortfolios();
    };
    
    window.addEventListener(PORTFOLIOS_UPDATED_EVENT, handlePortfoliosUpdated);
    
    return () => {
      window.removeEventListener(PORTFOLIOS_UPDATED_EVENT, handlePortfoliosUpdated);
    };
  }, []);

  const loadPortfolios = () => {
    const portfolioSummaries = portfolioService.getPortfolioSummaries();
    setPortfolios(portfolioSummaries);
    
    // Auto-select the default portfolio if none selected
    if (!selectedPortfolioId && portfolioSummaries.length > 0) {
      const defaultPortfolio = portfolioSummaries.find(p => p.isDefault);
      if (defaultPortfolio) {
        setSelectedPortfolioId(defaultPortfolio.id);
      } else {
        setSelectedPortfolioId(portfolioSummaries[0].id);
      }
    }
  };
  
  const handleCreatePortfolio = () => {
    if (!newPortfolioName.trim()) {
      toast({
        title: "Error",
        description: "Portfolio name is required.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const newPortfolio = portfolioService.createPortfolio(
        newPortfolioName.trim(),
        undefined,
        selectedClientType
      );
      
      setSelectedPortfolioId(newPortfolio.id);
      setIsCreatePortfolioOpen(false);
      setNewPortfolioName('');
      
      toast({
        title: "Success",
        description: "Portfolio created successfully.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create portfolio.",
        variant: "destructive"
      });
    }
  };

  const validateImportData = (rawData: Record<string, any>[], clientType: ClientType): string[] => {
    const errors: string[] = [];
    const config = clientTemplateService.getClientConfiguration(clientType);
    
    if (!config) {
      errors.push(`Client type "${clientType}" is not supported for import.`);
      return errors;
    }

    if (rawData.length === 0) {
      errors.push("No data found in the file.");
      return errors;
    }

    // Get the headers from the first row
    const fileHeaders = Object.keys(rawData[0]);
    
    // Check if required fields are present
    config.requiredFields.forEach(requiredField => {
      const columnDef = clientTemplateService.getColumnDefinition(requiredField);
      if (columnDef) {
        // Check if the column label or field name exists in the file
        const isPresent = fileHeaders.some(header => 
          header.toLowerCase() === columnDef.label.toLowerCase() ||
          header.toLowerCase() === requiredField.toLowerCase()
        );
        if (!isPresent) {
          errors.push(`Required field "${columnDef.label}" is missing from the import file.`);
        }
      }
    });

    return errors;
  };

  // Helper function to map business line to loan type
  const mapBusinessLineToLoanType = (businessLine: string): string => {
    if (!businessLine) return 'term';
    
    const bl = businessLine.toLowerCase();
    if (bl.includes('revolving') || bl.includes('revolver')) return 'revolver';
    if (bl.includes('bullet')) return 'bullet';
    if (bl.includes('amortizing')) return 'amortizing';
    return 'term';
  };

  // Create dynamic loan object from raw data using template mapping
  const createLoanFromTemplateData = (
    rawRow: Record<string, any>, 
    fieldMapping: Record<string, string>, 
    additionalDetails: Record<string, any>,
    index: number
  ): Partial<Loan> => {
    // Initialize loan with default values to prevent missing critical fields
    const loan: any = {
      id: rawRow[fieldMapping.facilityId] || rawRow.id || rawRow.ID || `imported-${index}`,
      name: '', // Will be set below
      clientName: '', // Will be set below
      clientType: selectedClientType,
      portfolioId: selectedPortfolioId,
      type: 'term', // Default type
      status: 'active', // Default status
      additionalDetails: Object.keys(additionalDetails).length > 0 ? additionalDetails : undefined,
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
                }
              };

    console.log(`🔍 Processing loan ${index + 1}:`, {
      rawRow: Object.keys(rawRow),
      fieldMapping: fieldMapping
    });

    // Map template fields to loan object
    Object.entries(fieldMapping).forEach(([fieldKey, columnName]) => {
      const value = rawRow[columnName];
      const parsedValue = clientTemplateService.parseFieldValue(value, fieldKey);
      
      console.log(`  📝 Mapping ${fieldKey} (${columnName}): "${value}" → "${parsedValue}"`);
      
      // Map template fields to loan object properties
      switch (fieldKey) {
        case 'facilityId':
          loan.id = parsedValue || `imported-${index}`;
          break;
        case 'dealName':
          loan.name = parsedValue || '';
          break;
        case 'longNameBorrower':
          loan.clientName = parsedValue || '';
          break;
        case 'facilityDate':
          loan.startDate = parsedValue;
          break;
        case 'maturity':
          loan.endDate = parsedValue;
          break;
        case 'currency':
          loan.currency = parsedValue || 'EUR';
          break;
        case 'internalRating':
          loan.internalRating = parsedValue || 'BB';
          break;
        case 'businessLine':
          loan.type = mapBusinessLineToLoanType(parsedValue) || 'term';
          break;
        case 'sector':
          loan.sector = parsedValue || 'General';
          break;
        case 'zoneGeographique':
          loan.country = parsedValue || 'France';
          break;
        case 'loanMarginBps':
          // Convert basis points to decimal
          loan.margin = parsedValue ? parsedValue / 10000 : 0;
          break;
        case 'facilityFeeBps':
          loan.fees = loan.fees || {};
          loan.fees.upfront = parsedValue ? parsedValue / 10000 : 0;
          break;
        default:
          // Store unmapped template fields in additional details
          if (!loan.additionalDetails) loan.additionalDetails = {};
          loan.additionalDetails[fieldKey] = parsedValue;
      }
    });

    // Enhanced fallback logic for critical fields
    // Priority: template mapping → common variations → defaults
    
    // Name fallbacks
    if (!loan.name || loan.name.trim() === '') {
      loan.name = rawRow.name || rawRow.nom || rawRow.Nom || 
                 rawRow['Deal Name'] || rawRow['deal_name'] ||
                 rawRow['Loan Name'] || rawRow['loan_name'] ||
                 `Loan ${index + 1}`;
    }
    
    // Client name fallbacks  
    if (!loan.clientName || loan.clientName.trim() === '') {
      loan.clientName = rawRow.clientName || rawRow.client || rawRow.Client ||
                        rawRow['Client Name'] || rawRow['client_name'] ||
                        rawRow.borrower || rawRow.Borrower ||
                        rawRow['Borrower Name'] || rawRow['borrower_name'] ||
                        `Client ${index + 1}`;
    }

    // Other field fallbacks with better defaults
    loan.type = loan.type || rawRow.type || rawRow.Type || rawRow['Loan Type'] || 'term';
    loan.status = rawRow.status || rawRow.Statut || rawRow.Status || 'active';
    loan.startDate = loan.startDate || rawRow.startDate || rawRow.dateDebut || rawRow['Start Date'] || new Date().toISOString().split('T')[0];
    loan.endDate = loan.endDate || rawRow.endDate || rawRow.dateFin || rawRow['End Date'] || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
    loan.currency = loan.currency || rawRow.currency || rawRow.devise || rawRow.Currency || 'EUR';
    loan.sector = loan.sector || rawRow.sector || rawRow.secteur || rawRow.Sector || 'General';
    loan.country = loan.country || rawRow.country || rawRow.pays || rawRow.Country || 'France';
    loan.internalRating = loan.internalRating || rawRow.internalRating || rawRow.rating || rawRow.Rating || 'BB';

    // Handle amount fields with multiple fallbacks
    const amountFields = [
      'amount', 'montant', 'Montant', 'Amount', 'Original Amount', 'original_amount',
      'Loan Amount', 'loan_amount', 'Principal', 'principal'
    ];
    
    let originalAmount = 0;
    for (const field of amountFields) {
      if (rawRow[field] && !isNaN(parseFloat(String(rawRow[field])))) {
        originalAmount = parseFloat(String(rawRow[field]));
        break;
      }
    }
    
    loan.originalAmount = originalAmount || 1000000; // Default 1M if no amount found
    loan.outstandingAmount = parseFloat(String(rawRow.outstandingAmount || rawRow.Encours || originalAmount || 0));
    loan.drawnAmount = parseFloat(String(rawRow.drawnAmount || rawRow['Montant tiré'] || originalAmount || 0));
    loan.undrawnAmount = parseFloat(String(rawRow.undrawnAmount || rawRow['Montant non tiré'] || 0));
    loan.ead = parseFloat(String(rawRow.ead || rawRow.EAD || loan.drawnAmount || 0));

    // Handle risk parameters with percentage conversion
    loan.pd = parseFloat(String(rawRow.pd || rawRow.PD || '1')) / (parseFloat(String(rawRow.pd || rawRow.PD || '1')) > 1 ? 100 : 1);
    loan.lgd = parseFloat(String(rawRow.lgd || rawRow.LGD || '45')) / (parseFloat(String(rawRow.lgd || rawRow.LGD || '45')) > 1 ? 100 : 1);

    // Handle margin/rate fields
    if (!loan.margin) {
      loan.margin = parseFloat(String(rawRow.margin || rawRow.marge || '2')) / (parseFloat(String(rawRow.margin || rawRow.marge || '2')) > 1 ? 100 : 1);
    }
    loan.referenceRate = parseFloat(String(rawRow.referenceRate || rawRow.tauxReference || '3')) / (parseFloat(String(rawRow.referenceRate || rawRow.tauxReference || '3')) > 1 ? 100 : 1);

    // Handle fees
    loan.fees = loan.fees || {};
    loan.fees.upfront = loan.fees.upfront || parseFloat(String(rawRow.upfrontFee || '0'));
    loan.fees.commitment = parseFloat(String(rawRow.commitmentFee || '0'));
    loan.fees.agency = parseFloat(String(rawRow.agencyFee || '0'));
    loan.fees.other = parseFloat(String(rawRow.otherFee || '0'));

    console.log(`✅ Created loan:`, {
      id: loan.id,
      name: loan.name,
      clientName: loan.clientName,
      originalAmount: loan.originalAmount
    });

    return loan;
  };

  const parseCSV = (file: File): Promise<{ loans: Partial<Loan>[], rawData: Record<string, any>[] }> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            // Store raw data for dynamic column detection
            const rawData = results.data as Record<string, any>[];
            
            // Validate data against client type template
            const validationErrors = validateImportData(rawData, selectedClientType);
            if (validationErrors.length > 0) {
              setImportErrors(validationErrors);
              reject(new Error(validationErrors.join(', ')));
              return;
            }
            
            // Create dynamic field mapping based on template
            const fieldMapping = clientTemplateService.createFieldMapping(rawData, selectedClientType);
            console.log('Field mapping created:', fieldMapping);
            
            // Detect dynamic columns (columns not in template)
            const dynamicColumns = dynamicColumnsService.detectDynamicColumns(rawData);
            setDetectedColumns(dynamicColumns);
            
            const loans = rawData.map((row: any, index) => {
              // Extract additional details (dynamic columns)
              const additionalDetails: Record<string, any> = {};
              dynamicColumns.forEach(col => {
                additionalDetails[col.key] = row[col.key] || 'N/A';
              });
              
              // Create loan using template mapping
              return createLoanFromTemplateData(row, fieldMapping, additionalDetails, index);
            });

            resolve({ loans, rawData });
          } catch (error: any) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  };

  const parseExcel = async (file: File): Promise<{ loans: Partial<Loan>[], rawData: Record<string, any>[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
          
          // Validate data against client type template
          const validationErrors = validateImportData(rawData, selectedClientType);
          if (validationErrors.length > 0) {
            setImportErrors(validationErrors);
            reject(new Error(validationErrors.join(', ')));
            return;
          }
          
          // Create dynamic field mapping based on template
          const fieldMapping = clientTemplateService.createFieldMapping(rawData, selectedClientType);
          console.log('Field mapping created:', fieldMapping);
          
          // Detect dynamic columns (columns not in template)
          const dynamicColumns = dynamicColumnsService.detectDynamicColumns(rawData);
          setDetectedColumns(dynamicColumns);
          
          const loans = rawData.map((row: any, index) => {
            // Extract additional details (dynamic columns)
            const additionalDetails: Record<string, any> = {};
            dynamicColumns.forEach(col => {
              additionalDetails[col.key] = row[col.key] || 'N/A';
            });
            
            // Create loan using template mapping
            return createLoanFromTemplateData(row, fieldMapping, additionalDetails, index);
          });

          resolve({ loans, rawData });
        } catch (error: any) {
          reject(error);
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFileSelected(file);
      setImportSuccess(false);
      setImportErrors([]);
      setIsProcessing(true);
      
      // Show loading state
      console.log('🔄 Starting file processing:', file.name);
      
      try {
        let parseResult: { loans: Partial<Loan>[], rawData: Record<string, any>[] };
        
        if (file.name.endsWith('.csv')) {
          console.log('📄 Processing CSV file...');
          parseResult = await parseCSV(file);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          console.log('📊 Processing Excel file...');
          parseResult = await parseExcel(file);
        } else {
          setImportErrors(['Format de fichier non supporté. Veuillez utiliser CSV ou Excel.']);
          return;
        }
        
        const { loans: parsedLoans, rawData } = parseResult;
        setRawImportData(rawData);
        
        console.log('✅ File parsed successfully:', parsedLoans.length, 'loans found');
        console.log('📊 Raw data preview:', rawData[0]);
        console.log('🔍 Parsed loans preview:', parsedLoans[0]);
        
        if (parsedLoans.length === 0) {
          setImportErrors(['Aucune donnée trouvée dans le fichier.']);
          return;
        }
        
        // Improved validation with warnings instead of blocking errors
        const errors: string[] = [];
        const warnings: string[] = [];
        
        parsedLoans.forEach((loan, index) => {
          // Critical errors (block import)
          if (isNaN(loan.originalAmount || 0) || (loan.originalAmount || 0) <= 0) {
            errors.push(`Ligne ${index + 1}: Le montant du prêt est invalide (${loan.originalAmount}).`);
          }
          
          // Warnings (allow import but inform user)
          if (!loan.name || loan.name.trim() === '') {
            warnings.push(`Ligne ${index + 1}: Le nom du prêt est manquant. Utilisation de "Unnamed Loan".`);
          }
          if (!loan.clientName || loan.clientName.trim() === '') {
            warnings.push(`Ligne ${index + 1}: Le nom du client est manquant. Utilisation de "Unknown Client".`);
          }
        });
        
        // Show critical errors that block import
        if (errors.length > 0) {
          setImportErrors(errors);
          console.error('❌ Critical errors found:', errors);
          return;
        }
        
        // Show warnings but allow preview
        if (warnings.length > 0) {
          console.warn('⚠️ Warnings found:', warnings);
          setImportErrors(warnings.map(w => `⚠️ ${w}`)); // Prefix with warning icon
        }
        
        console.log('✅ Showing preview for', parsedLoans.length, 'loans');
        setPreviewData(parsedLoans);
        
        // Show success toast
        toast({
          title: "File processed successfully",
          description: `${parsedLoans.length} loans ready for import. ${warnings.length > 0 ? `${warnings.length} warnings found.` : ''}`,
          variant: "default"
        });
        
      } catch (error: any) {
        console.error('❌ Error processing file:', error);
        setImportErrors([`Erreur lors de l'analyse du fichier: ${error.message}`]);
        toast({
          title: "File processing error",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    } else {
      setFileSelected(null);
      setPreviewData([]);
      setImportErrors([]);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFileSelected(file);
      setImportSuccess(false);
      setImportErrors([]);
      
      try {
        let parseResult: { loans: Partial<Loan>[], rawData: Record<string, any>[] };
        
        if (file.name.endsWith('.csv')) {
          parseResult = await parseCSV(file);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          parseResult = await parseExcel(file);
        } else {
          setImportErrors(['Format de fichier non supporté. Veuillez utiliser CSV ou Excel.']);
          return;
        }
        
        const { loans: parsedLoans, rawData } = parseResult;
        setRawImportData(rawData);
        
        if (parsedLoans.length === 0) {
          setImportErrors(['Aucune donnée trouvée dans le fichier.']);
          return;
        }
        
        const errors: string[] = [];
        parsedLoans.forEach((loan, index) => {
          if (!loan.name) errors.push(`Ligne ${index + 1}: Le nom du prêt est manquant.`);
          if (!loan.clientName) errors.push(`Ligne ${index + 1}: Le nom du client est manquant.`);
          if (isNaN(loan.originalAmount || 0) || (loan.originalAmount || 0) <= 0) {
            errors.push(`Ligne ${index + 1}: Le montant du prêt est invalide.`);
          }
        });
        
        if (errors.length > 0) {
          setImportErrors(errors);
          return;
        }
        
        setPreviewData(parsedLoans);
      } catch (error: any) {
        setImportErrors([`Erreur lors de l'analyse du fichier: ${error.message}`]);
      }
    }
  };
  
  const handleUpload = () => {
    setIsUploading(true);
    
    try {
      if (!previewData || previewData.length === 0) {
        throw new Error("No data to import");
      }
      
      // Save detected dynamic columns to the service
      if (detectedColumns.length > 0) {
        dynamicColumnsService.addDynamicColumns(detectedColumns);
      }
      
      // Format loan data correctly
      const formattedLoans = previewData.map(loanData => {
        // Generate unique ID if not specified
        const loanId = loanData.id || `loan-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Ensure original amount is defined
        const originalAmount = typeof loanData.originalAmount === 'number' ? loanData.originalAmount : 0;
        if (originalAmount <= 0) {
          throw new Error(`Loan ${loanData.name} has an invalid original amount.`);
        }
        
        // Ensure default values for required fields
        return {
          id: loanId,
          name: loanData.name || "Unnamed Loan",
          clientName: loanData.clientName || "Unknown Client",
          type: loanData.type || "term",
          status: loanData.status || "active",
          startDate: loanData.startDate || new Date().toISOString().split('T')[0],
          endDate: loanData.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().split('T')[0],
          currency: loanData.currency || "EUR",
          originalAmount: originalAmount,
          outstandingAmount: typeof loanData.outstandingAmount === 'number' ? loanData.outstandingAmount : originalAmount,
          drawnAmount: typeof loanData.drawnAmount === 'number' ? loanData.drawnAmount : originalAmount,
          undrawnAmount: typeof loanData.undrawnAmount === 'number' ? loanData.undrawnAmount : 0,
          pd: typeof loanData.pd === 'number' ? loanData.pd : 0.01,
          lgd: typeof loanData.lgd === 'number' ? loanData.lgd : 0.45,
          ead: typeof loanData.ead === 'number' ? loanData.ead : (typeof loanData.drawnAmount === 'number' ? loanData.drawnAmount : originalAmount),
          fees: {
            upfront: typeof loanData.fees?.upfront === 'number' ? loanData.fees.upfront : 0,
            commitment: typeof loanData.fees?.commitment === 'number' ? loanData.fees.commitment : 0,
            agency: typeof loanData.fees?.agency === 'number' ? loanData.fees.agency : 0,
            other: typeof loanData.fees?.other === 'number' ? loanData.fees.other : 0
          },
          margin: typeof loanData.margin === 'number' ? loanData.margin : 0.02,
          referenceRate: typeof loanData.referenceRate === 'number' ? loanData.referenceRate : 0.03,
          internalRating: loanData.internalRating || "BB",
          sector: loanData.sector || "General",
          country: loanData.country || "France",
          additionalDetails: loanData.additionalDetails || (detectedColumns.length > 0 ? dynamicColumnsService.getDefaultValues() : undefined),
          cashFlows: loanData.cashFlows || [],
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
      });
      
      console.log('Formatted data before import:', formattedLoans);
      
      // Import formatted loans into service
      loanDataService.addLoans(formattedLoans as Loan[], selectedPortfolioId, defaultCalculationParameters);
      
      // User feedback
      setImportSuccess(true);
      toast({
        title: "Import successful",
        description: `${formattedLoans.length} loans have been imported successfully.`,
        variant: "default"
      });
      
      // Reset form
      setFileSelected(null);
      setPreviewData([]);
      
      // Force update of tables in other pages
      // This will be done automatically when user navigates to another page
      
      setTimeout(() => {
        navigate('/loans');
      }, 500);
      
    } catch (error: any) {
      console.error("Error importing data:", error);
      setImportErrors([`Import error: ${error.message}`]);
      toast({
        title: "Import error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      clientTemplateService.downloadTemplate(selectedClientType);
      const config = clientTemplateService.getClientConfiguration(selectedClientType);
      toast({
        title: "Download started",
        description: `${config?.displayName} template has been downloaded successfully.`,
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Download error",
        description: error.message || "An error occurred while downloading the template.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Data Import</h1>
      
      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload">File Import</TabsTrigger>
          <TabsTrigger value="template">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Import Loans</CardTitle>
              <CardDescription>
                Select portfolio and client type, then drag and drop a CSV or Excel file containing loan data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Portfolio and Client Type Selection */}
              <div className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
                <h3 className="text-lg font-medium">Import Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Portfolio Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="portfolio-select">Target Portfolio</Label>
                    <div className="flex gap-2">
                      <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                        <SelectTrigger id="portfolio-select">
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
                      
                      <Dialog open={isCreatePortfolioOpen} onOpenChange={setIsCreatePortfolioOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Portfolio</DialogTitle>
                            <DialogDescription>
                              Create a new portfolio for this import.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="portfolio-name">Portfolio Name</Label>
                              <Input
                                id="portfolio-name"
                                value={newPortfolioName}
                                onChange={(e) => setNewPortfolioName(e.target.value)}
                                placeholder="Enter portfolio name"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreatePortfolioOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleCreatePortfolio}>
                              Create Portfolio
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Loans will be imported into the selected portfolio
                    </p>
                  </div>
                  
                  {/* Client Type Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="client-type-select">Client Type</Label>
                    <Select value={selectedClientType} onValueChange={(value: ClientType) => setSelectedClientType(value)}>
                      <SelectTrigger id="client-type-select">
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
                    <p className="text-xs text-muted-foreground">
                      Template fields will be adjusted based on client type
                    </p>
                  </div>
                </div>
                
                {!selectedPortfolioId && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please select a portfolio before importing loans.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <div 
                className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept=".csv,.xlsx,.xls" 
                  onChange={handleFileChange} 
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                  {fileSelected ? (
                    <>
                      <p className="text-sm font-medium">
                        <FileText className="h-4 w-4 inline mr-1" />
                        {fileSelected.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(fileSelected.size / 1024).toFixed(2)} KB
                      </p>
                      {isProcessing && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <p className="text-sm text-blue-600">Processing file...</p>
                        </div>
                      )}
                      {!isProcessing && previewData.length === 0 && importErrors.length === 0 && (
                        <p className="text-sm text-orange-600 mt-2">Waiting for file processing...</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium">
                        Click to select a file or drag it here
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supported formats: CSV, Excel (.xlsx, .xls)
                      </p>
                    </>
                  )}
                </div>
              </div>
              
              {/* Processing Status */}
              {isProcessing && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <p className="text-blue-800 font-medium">Processing your file...</p>
                  </div>
                  <p className="text-blue-600 text-sm mt-1">
                    Validating data against {clientTemplateService.getClientConfiguration(selectedClientType)?.displayName} template
                  </p>
                </div>
              )}
              
              {/* Import Errors/Warnings */}
              {importErrors.length > 0 && !isProcessing && (
                <div className="mt-4">
                  {importErrors.some(error => error.startsWith('⚠️')) ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <p className="text-yellow-800 font-medium">Warnings Found</p>
                      </div>
                      <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                        {importErrors.map((error, idx) => (
                          <li key={idx}>{error.replace('⚠️ ', '')}</li>
                        ))}
                      </ul>
                      <p className="text-yellow-600 text-sm mt-2">
                        ℹ️ You can still proceed with the import. Missing data will use default values.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <p className="text-red-800 font-medium">Import Errors</p>
                      </div>
                      <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                        {importErrors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {/* Data Preview and Import Button */}
              {fileSelected && previewData.length > 0 && !isProcessing && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Data Preview ({previewData.length} loans)</h3>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-green-600 font-medium">Ready to Import</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">PD</TableHead>
                          <TableHead className="text-right">LGD</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.slice(0, 5).map((row, index) => (
                          <TableRow key={row.id || index}>
                            <TableCell>{row.id || `tempID-${index}`}</TableCell>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.clientName}</TableCell>
                            <TableCell>{row.type}</TableCell>
                            <TableCell className="text-right">
                              {new Intl.NumberFormat('fr-FR', { 
                                style: 'currency', 
                                currency: 'EUR', 
                                maximumFractionDigits: 0 
                              }).format(row.originalAmount || 0)}
                            </TableCell>
                            <TableCell className="text-right">{((row.pd || 0) * 100).toFixed(2)}%</TableCell>
                            <TableCell className="text-right">{((row.lgd || 0) * 100).toFixed(2)}%</TableCell>
                          </TableRow>
                        ))}
                        {previewData.length > 5 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                              ... and {previewData.length - 5} more loans
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Import Success Message */}
                  {importSuccess && (
                    <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 text-green-800 rounded-md">
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="text-sm">Import successful! {previewData.length} loans have been imported.</p>
                    </div>
                  )}
                  
                  {/* Import Action Buttons */}
                  <div className="flex justify-between items-center mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">Ready to import {previewData.length} loans</p>
                      <p>Target: <span className="font-medium">{portfolios.find(p => p.id === selectedPortfolioId)?.name}</span></p>
                      <p>Type: <span className="font-medium">{clientTemplateService.getClientConfiguration(selectedClientType)?.displayName}</span></p>
                      </div>
                    <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setFileSelected(null);
                        setPreviewData([]);
                          setImportErrors([]);
                      }}
                        disabled={isUploading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpload}
                        disabled={isUploading || !fileSelected || previewData.length === 0 || !selectedPortfolioId}
                        className="bg-green-600 hover:bg-green-700"
                    >
                      {isUploading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Importing...
                        </>
                      ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Import {previewData.length} Loans
                          </>
                      )}
                    </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Download Templates</CardTitle>
              <CardDescription>
                Choose your client type and download the corresponding template.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Client Type Selection */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Select Your Client Type</h3>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Different client types have different required fields and templates. 
                      Select your organization type to get the appropriate template.
                    </AlertDescription>
                  </Alert>
                  <div className="flex items-center gap-4">
                    <Select value={selectedClientType} onValueChange={(value: ClientType) => setSelectedClientType(value)}>
                      <SelectTrigger className="w-64">
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
                    <Button onClick={handleDownloadTemplate} className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download Template
                      </Button>
                    </div>
                  </div>

                {/* Template Documentation */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Template Fields</h3>
                  <div 
                    className="prose prose-sm max-w-none bg-muted/50 rounded-lg p-4"
                    dangerouslySetInnerHTML={{
                      __html: clientTemplateService.generateDocumentation(selectedClientType)
                    }}
                  />
                </div>

                {/* Legacy Templates */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Other Templates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <FileText className="h-8 w-8 text-green-500 shrink-0" />
                    <div>
                          <h4 className="font-medium">Cash Flows Template</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                            Template to import loan cash flows.
                          </p>
                          <Button size="sm" variant="outline" onClick={() => {
                              const result = downloadExcelTemplate('cashflows');
                              if (result.success) {
                                toast({ title: "Download started", description: result.message, variant: "default" });
                              } else {
                                toast({ title: "Download error", description: result.message, variant: "destructive" });
                              }
                            }}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="format-cashflows">
                      <AccordionTrigger className="text-sm">
                        <span className="flex items-center">
                          <Info className="h-4 w-4 mr-2" />
                          Required format
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-sm p-3 bg-muted rounded-md" dangerouslySetInnerHTML={{ __html: templateDocs.cashflows }} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>
                
                <Card className="p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <FileText className="h-8 w-8 text-purple-500 shrink-0" />
                    <div>
                          <h4 className="font-medium">Parameters Template</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Format for custom calculation parameters.
                      </p>
                          <Button size="sm" variant="outline" onClick={() => {
                              const result = downloadExcelTemplate('parametres');
                              if (result.success) {
                                toast({ title: "Download started", description: result.message, variant: "default" });
                              } else {
                                toast({ title: "Download error", description: result.message, variant: "destructive" });
                              }
                            }}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="format-parametres">
                      <AccordionTrigger className="text-sm">
                        <span className="flex items-center">
                          <Info className="h-4 w-4 mr-2" />
                          Required format
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-sm p-3 bg-muted rounded-md" dangerouslySetInnerHTML={{ __html: templateDocs.parametres }} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>
                    </div>
                  </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <CardDescription>
                View recent import operations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>17/04/2025 09:30</TableCell>
                    <TableCell>portefeuille_q1_2025.xlsx</TableCell>
                    <TableCell>Loans</TableCell>
                    <TableCell className="text-right">15</TableCell>
                    <TableCell className="text-green-600">Success</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>10/04/2025 14:15</TableCell>
                    <TableCell>cash_flows_prev.csv</TableCell>
                    <TableCell>Cash Flows</TableCell>
                    <TableCell className="text-right">42</TableCell>
                    <TableCell className="text-green-600">Success</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>05/04/2025 11:20</TableCell>
                    <TableCell>parametres_2025.xlsx</TableCell>
                    <TableCell>Parameters</TableCell>
                    <TableCell className="text-right">8</TableCell>
                    <TableCell className="text-red-600">Failed</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>01/04/2025 16:45</TableCell>
                    <TableCell>loans_march_2025.xlsx</TableCell>
                    <TableCell>Loans</TableCell>
                    <TableCell className="text-right">12</TableCell>
                    <TableCell className="text-green-600">Success</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Import;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertTriangle, CheckCircle2, Download, Info } from 'lucide-react';
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
import { downloadExcelTemplate, generateTemplateDocumentation } from '@/services/ExcelTemplateService';
import LoanDataService from '../services/LoanDataService';
import { defaultCalculationParameters } from '../data/sampleData';
import { Loan } from '../types/finance';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

const Import = () => {
  const navigate = useNavigate();
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<Partial<Loan>[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [templateDocs, setTemplateDocs] = useState<Record<string, string>>({
    prets: generateTemplateDocumentation('prets'),
    cashflows: generateTemplateDocumentation('cashflows'),
    parametres: generateTemplateDocumentation('parametres')
  });
  
  const loanDataService = LoanDataService.getInstance();

  useEffect(() => {
    loanDataService.loadFromLocalStorage();
  }, []);

  const parseCSV = (file: File): Promise<Partial<Loan>[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const loans = results.data.map((row: any, index) => {
              // Identifier les clés correctes avec différentes variations possibles
              const originalAmount = parseFloat(String(row.amount || row.montant || row.Montant || row['Montant original'] || '0'));
              
              return {
                id: row.id || row.ID || `imported-${index}`,
                name: row.name || row.nom || row.Nom || '',
                clientName: row.clientName || row.client || row.Client || '',
                type: row.type || row.Type || 'term',
                status: row.status || row.Statut || 'active',
                originalAmount: originalAmount,
                // Si PD est fourni en pourcentage (ex: 1%), le convertir en décimal (0.01)
                pd: parseFloat(String(row.pd || row.PD || '0')) / (parseFloat(String(row.pd || row.PD || '0')) > 1 ? 100 : 1),
                // Si LGD est fourni en pourcentage (ex: 45%), le convertir en décimal (0.45)
                lgd: parseFloat(String(row.lgd || row.LGD || '0')) / (parseFloat(String(row.lgd || row.LGD || '0')) > 1 ? 100 : 1),
                sector: row.sector || row.secteur || row.Secteur || 'Général',
                country: row.country || row.pays || row.Pays || 'France',
                startDate: row.startDate || row.dateDebut || row['Date de début'] || new Date().toISOString().split('T')[0],
                endDate: row.endDate || row.dateFin || row['Date de fin'] || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                currency: row.currency || row.devise || row.Devise || 'EUR',
                // Pour les valeurs numériques, convertir de pourcentage à décimal si nécessaire
                margin: parseFloat(String(row.margin || row.marge || row.Marge || '0')) / (parseFloat(String(row.margin || row.marge || row.Marge || '0')) > 1 ? 100 : 1),
                referenceRate: parseFloat(String(row.referenceRate || row.tauxReference || row['Taux de référence'] || '0')) / (parseFloat(String(row.referenceRate || row.tauxReference || row['Taux de référence'] || '0')) > 1 ? 100 : 1),
                outstandingAmount: parseFloat(String(row.outstandingAmount || row.Encours || originalAmount || '0')),
                drawnAmount: parseFloat(String(row.drawnAmount || row['Montant tiré'] || originalAmount || '0')),
                undrawnAmount: parseFloat(String(row.undrawnAmount || row['Montant non tiré'] || '0')),
                ead: parseFloat(String(row.ead || row.EAD || row.drawnAmount || row['Montant tiré'] || originalAmount || '0')),
                internalRating: row.internalRating || row.ratingInterne || row['Notation interne'] || 'BB',
                fees: {
                  upfront: parseFloat(String(row.upfrontFee || row['Frais upfront'] || '0')),
                  commitment: parseFloat(String(row.commitmentFee || row['Frais commitment'] || '0')),
                  agency: parseFloat(String(row.agencyFee || row['Frais agency'] || '0')),
                  other: parseFloat(String(row.otherFee || row['Autres frais'] || '0'))
                },
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
            });
            resolve(loans);
          } catch (error) {
            reject(new Error(`CSV parsing error: ${error}`));
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  };

  const parseExcel = async (file: File): Promise<Partial<Loan>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const loans = jsonData.map((row: any, index) => {
            // Identifier les clés correctes avec différentes variations possibles
            const originalAmount = parseFloat(String(row.amount || row.montant || row.Montant || row['Montant original'] || '0'));
            
            return {
              id: row.id || row.ID || `imported-${index}`,
              name: row.name || row.nom || row.Nom || '',
              clientName: row.clientName || row.client || row.Client || '',
              type: row.type || row.Type || 'term',
              status: row.status || row.Statut || 'active',
              originalAmount: originalAmount,
              // Si PD est fourni en pourcentage (ex: 1%), le convertir en décimal (0.01)
              pd: parseFloat(String(row.pd || row.PD || '0')) / (parseFloat(String(row.pd || row.PD || '0')) > 1 ? 100 : 1),
              // Si LGD est fourni en pourcentage (ex: 45%), le convertir en décimal (0.45)
              lgd: parseFloat(String(row.lgd || row.LGD || '0')) / (parseFloat(String(row.lgd || row.LGD || '0')) > 1 ? 100 : 1),
              sector: row.sector || row.secteur || row.Secteur || 'Général',
              country: row.country || row.pays || row.Pays || 'France',
              startDate: row.startDate || row.dateDebut || row['Date de début'] || new Date().toISOString().split('T')[0],
              endDate: row.endDate || row.dateFin || row['Date de fin'] || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
              currency: row.currency || row.devise || row.Devise || 'EUR',
              // Pour les valeurs numériques, convertir de pourcentage à décimal si nécessaire
              margin: parseFloat(String(row.margin || row.marge || row.Marge || '0')) / (parseFloat(String(row.margin || row.marge || row.Marge || '0')) > 1 ? 100 : 1),
              referenceRate: parseFloat(String(row.referenceRate || row.tauxReference || row['Taux de référence'] || '0')) / (parseFloat(String(row.referenceRate || row.tauxReference || row['Taux de référence'] || '0')) > 1 ? 100 : 1),
              outstandingAmount: parseFloat(String(row.outstandingAmount || row.Encours || originalAmount || '0')),
              drawnAmount: parseFloat(String(row.drawnAmount || row['Montant tiré'] || originalAmount || '0')),
              undrawnAmount: parseFloat(String(row.undrawnAmount || row['Montant non tiré'] || '0')),
              ead: parseFloat(String(row.ead || row.EAD || row.drawnAmount || row['Montant tiré'] || originalAmount || '0')),
              internalRating: row.internalRating || row.ratingInterne || row['Notation interne'] || 'BB',
              fees: {
                upfront: parseFloat(String(row.upfrontFee || row['Frais upfront'] || '0')),
                commitment: parseFloat(String(row.commitmentFee || row['Frais commitment'] || '0')),
                agency: parseFloat(String(row.agencyFee || row['Frais agency'] || '0')),
                other: parseFloat(String(row.otherFee || row['Autres frais'] || '0'))
              },
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
          });
          resolve(loans);
        } catch (error) {
          reject(new Error(`Excel parsing error: ${error}`));
        }
      };
      reader.onerror = () => reject(new Error("File reading error"));
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
      
      try {
        let parsedLoans: Partial<Loan>[] = [];
        
        if (file.name.endsWith('.csv')) {
          parsedLoans = await parseCSV(file);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          parsedLoans = await parseExcel(file);
        } else {
          setImportErrors(['Format de fichier non supporté. Veuillez utiliser CSV ou Excel.']);
          return;
        }
        
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
    } else {
      setFileSelected(null);
      setPreviewData([]);
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
        let parsedLoans: Partial<Loan>[] = [];
        
        if (file.name.endsWith('.csv')) {
          parsedLoans = await parseCSV(file);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          parsedLoans = await parseExcel(file);
        } else {
          setImportErrors(['Format de fichier non supporté. Veuillez utiliser CSV ou Excel.']);
          return;
        }
        
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
      loanDataService.addLoans(formattedLoans as Loan[], defaultCalculationParameters);
      
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

  const handleDownloadTemplate = (templateType: string) => {
    const result = downloadExcelTemplate(templateType);
    
    if (result.success) {
      toast({
        title: "Download started",
        description: result.message,
        variant: "default"
      });
    } else {
      toast({
        title: "Download error",
        description: result.message,
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
                Drag and drop a CSV or Excel file containing loan data.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
              
              {fileSelected && previewData.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Data Preview</h3>
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
                        {previewData.map((row, index) => (
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
                      </TableBody>
                    </Table>
                  </div>
                  
                  {importSuccess && (
                    <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 text-green-800 rounded-md">
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="text-sm">Import successful! {previewData.length} loans have been imported.</p>
                    </div>
                  )}
                  
                  {importErrors.length > 0 && (
                    <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 text-red-800 rounded-md">
                      <AlertTriangle className="h-5 w-5" />
                      <div>
                        <p className="text-sm font-medium">Import errors:</p>
                        <ul className="text-xs list-disc list-inside mt-1">
                          {importErrors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setFileSelected(null);
                        setPreviewData([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpload}
                      disabled={isUploading || !fileSelected || previewData.length === 0}
                    >
                      {isUploading ? (
                        <>
                          <span className="loading loading-spinner loading-xs mr-2"></span>
                          Importing...
                        </>
                      ) : (
                        'Import data'
                      )}
                    </Button>
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
                Use these templates to prepare your data before importing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <FileText className="h-8 w-8 text-blue-500 shrink-0" />
                    <div>
                      <h3 className="font-medium">Excel Template for Loans</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Template to import loans with all required fields.
                      </p>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadTemplate('prets')}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="format-prets">
                      <AccordionTrigger className="text-sm">
                        <span className="flex items-center">
                          <Info className="h-4 w-4 mr-2" />
                          Required format
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-sm p-3 bg-muted rounded-md" dangerouslySetInnerHTML={{ __html: templateDocs.prets }} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>
                
                <Card className="p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <FileText className="h-8 w-8 text-green-500 shrink-0" />
                    <div>
                      <h3 className="font-medium">CSV Template for Cash Flows</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Format to import forecasted cash flows.
                      </p>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadTemplate('cashflows')}>
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
                      <h3 className="font-medium">Parameters Template</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Format for custom calculation parameters.
                      </p>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadTemplate('parametres')}>
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
                
                <Card className="p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <FileText className="h-8 w-8 text-amber-500 shrink-0" />
                    <div>
                      <h3 className="font-medium">Documentation</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Complete guide for data import.
                      </p>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadTemplate('documentation')}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm p-3 bg-muted rounded-md">
                    <p>This document contains detailed instructions for:</p>
                    <ul className="list-disc list-inside mt-2 pl-2">
                      <li>Preparing your data for import</li>
                      <li>Understanding accepted file formats</li>
                      <li>Solving common import issues</li>
                      <li>Validating data before import</li>
                    </ul>
                  </div>
                </Card>
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

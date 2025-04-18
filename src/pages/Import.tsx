import React, { useState } from 'react';
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

const Import = () => {
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [templateDocs, setTemplateDocs] = useState<Record<string, string>>({
    prets: generateTemplateDocumentation('prets'),
    cashflows: generateTemplateDocumentation('cashflows'),
    parametres: generateTemplateDocumentation('parametres')
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileSelected(files[0]);
      setImportSuccess(false);
      setImportErrors([]);
      
      if (files[0].name.endsWith('.csv') || files[0].name.endsWith('.xlsx')) {
        const mockPreviewData = [
          { id: 'L001', name: 'Prêt A', clientName: 'Client XYZ', type: 'term', amount: 1000000, pd: 0.01, lgd: 0.45 },
          { id: 'L002', name: 'Prêt B', clientName: 'Client ABC', type: 'revolver', amount: 2000000, pd: 0.02, lgd: 0.35 },
          { id: 'L003', name: 'Prêt C', clientName: 'Client DEF', type: 'bullet', amount: 1500000, pd: 0.015, lgd: 0.4 }
        ];
        setPreviewData(mockPreviewData);
      }
    } else {
      setFileSelected(null);
      setPreviewData([]);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setFileSelected(files[0]);
      setImportSuccess(false);
      setImportErrors([]);
      
      if (files[0].name.endsWith('.csv') || files[0].name.endsWith('.xlsx')) {
        const mockPreviewData = [
          { id: 'L001', name: 'Prêt A', clientName: 'Client XYZ', type: 'term', amount: 1000000, pd: 0.01, lgd: 0.45 },
          { id: 'L002', name: 'Prêt B', clientName: 'Client ABC', type: 'revolver', amount: 2000000, pd: 0.02, lgd: 0.35 },
          { id: 'L003', name: 'Prêt C', clientName: 'Client DEF', type: 'bullet', amount: 1500000, pd: 0.015, lgd: 0.4 }
        ];
        setPreviewData(mockPreviewData);
      }
    }
  };
  
  const handleUpload = () => {
    if (!fileSelected) return;
    
    setIsUploading(true);
    
    setTimeout(() => {
      if (fileSelected.name.endsWith('.csv') || fileSelected.name.endsWith('.xlsx')) {
        setImportSuccess(true);
        setImportErrors([]);
        toast({
          title: "Import réussi",
          description: `${previewData.length} prêts ont été importés avec succès.`,
          variant: "default"
        });
      } else {
        setImportSuccess(false);
        setImportErrors(['Format de fichier non supporté. Veuillez utiliser CSV ou Excel.']);
        toast({
          title: "Erreur d'importation",
          description: "Format de fichier non supporté.",
          variant: "destructive"
        });
      }
      
      setIsUploading(false);
    }, 1500);
  };

  const handleDownloadTemplate = (templateType: string) => {
    const result = downloadExcelTemplate(templateType);
    
    if (result.success) {
      toast({
        title: "Téléchargement initié",
        description: result.message,
        variant: "default"
      });
    } else {
      toast({
        title: "Erreur de téléchargement",
        description: result.message,
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Import de Données</h1>
      
      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload">Import de Fichier</TabsTrigger>
          <TabsTrigger value="template">Gabarits</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Importer des Prêts</CardTitle>
              <CardDescription>
                Glissez-déposez un fichier CSV ou Excel contenant les données de prêts.
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
                        Cliquez pour sélectionner un fichier ou glissez-le ici
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Formats supportés: CSV, Excel (.xlsx, .xls)
                      </p>
                    </>
                  )}
                </div>
              </div>
              
              {fileSelected && previewData.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Aperçu des données</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead className="text-right">PD</TableHead>
                          <TableHead className="text-right">LGD</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.id}</TableCell>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.clientName}</TableCell>
                            <TableCell>{row.type}</TableCell>
                            <TableCell className="text-right">
                              {new Intl.NumberFormat('fr-FR', { 
                                style: 'currency', 
                                currency: 'EUR', 
                                maximumFractionDigits: 0 
                              }).format(row.amount)}
                            </TableCell>
                            <TableCell className="text-right">{(row.pd * 100).toFixed(2)}%</TableCell>
                            <TableCell className="text-right">{(row.lgd * 100).toFixed(2)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {importSuccess && (
                    <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 text-green-800 rounded-md">
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="text-sm">Import réussi! {previewData.length} prêts ont été importés.</p>
                    </div>
                  )}
                  
                  {importErrors.length > 0 && (
                    <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 text-red-800 rounded-md">
                      <AlertTriangle className="h-5 w-5" />
                      <div>
                        <p className="text-sm font-medium">Erreurs d'importation:</p>
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
                      Annuler
                    </Button>
                    <Button 
                      onClick={handleUpload}
                      disabled={isUploading || !fileSelected}
                    >
                      {isUploading ? (
                        <>
                          <span className="loading loading-spinner loading-xs mr-2"></span>
                          Importation...
                        </>
                      ) : (
                        'Importer les données'
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
              <CardTitle>Télécharger des Gabarits</CardTitle>
              <CardDescription>
                Utilisez ces gabarits pour préparer vos données avant l'importation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <FileText className="h-8 w-8 text-blue-500 shrink-0" />
                    <div>
                      <h3 className="font-medium">Gabarit Excel pour Prêts</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Modèle pour importer des prêts avec tous les champs requis.
                      </p>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadTemplate('prets')}>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="format-prets">
                      <AccordionTrigger className="text-sm">
                        <span className="flex items-center">
                          <Info className="h-4 w-4 mr-2" />
                          Format requis
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
                      <h3 className="font-medium">Gabarit CSV pour Cash Flows</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Format pour importer des cash flows prévisionnels.
                      </p>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadTemplate('cashflows')}>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="format-cashflows">
                      <AccordionTrigger className="text-sm">
                        <span className="flex items-center">
                          <Info className="h-4 w-4 mr-2" />
                          Format requis
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
                      <h3 className="font-medium">Gabarit pour Paramètres</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Format pour les paramètres de calcul personnalisés.
                      </p>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadTemplate('parametres')}>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="format-parametres">
                      <AccordionTrigger className="text-sm">
                        <span className="flex items-center">
                          <Info className="h-4 w-4 mr-2" />
                          Format requis
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
                        Guide complet pour l'importation des données.
                      </p>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadTemplate('documentation')}>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm p-3 bg-muted rounded-md">
                    <p>Ce document contient des instructions détaillées pour :</p>
                    <ul className="list-disc list-inside mt-2 pl-2">
                      <li>Préparer vos données pour l'importation</li>
                      <li>Comprendre les formats de fichiers acceptés</li>
                      <li>Résoudre les problèmes d'importation courants</li>
                      <li>Vérifier la validité des données avant import</li>
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
              <CardTitle>Historique des Imports</CardTitle>
              <CardDescription>
                Consultez les dernières opérations d'importation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Fichier</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Éléments</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>17/04/2025 09:30</TableCell>
                    <TableCell>portefeuille_q1_2025.xlsx</TableCell>
                    <TableCell>Prêts</TableCell>
                    <TableCell className="text-right">15</TableCell>
                    <TableCell className="text-green-600">Succès</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>10/04/2025 14:15</TableCell>
                    <TableCell>cash_flows_prev.csv</TableCell>
                    <TableCell>Cash Flows</TableCell>
                    <TableCell className="text-right">42</TableCell>
                    <TableCell className="text-green-600">Succès</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>05/04/2025 11:20</TableCell>
                    <TableCell>parametres_2025.xlsx</TableCell>
                    <TableCell>Paramètres</TableCell>
                    <TableCell className="text-right">8</TableCell>
                    <TableCell className="text-red-600">Échec</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>01/04/2025 16:45</TableCell>
                    <TableCell>loans_march_2025.xlsx</TableCell>
                    <TableCell>Prêts</TableCell>
                    <TableCell className="text-right">12</TableCell>
                    <TableCell className="text-green-600">Succès</TableCell>
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

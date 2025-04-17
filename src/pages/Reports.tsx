import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet, FilePdf, FileText, RefreshCw, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { samplePortfolio } from '@/data/sampleData';

const Reports = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerateReport = (reportType: string) => {
    setIsGenerating(true);
    
    // Simuler un délai de génération
    setTimeout(() => {
      setIsGenerating(false);
      
      toast({
        title: "Rapport généré",
        description: `Le rapport ${reportType} a été généré avec succès.`,
        variant: "default"
      });
    }, 2000);
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rapports</h1>
      
      <Tabs defaultValue="portfolio">
        <TabsList>
          <TabsTrigger value="portfolio">Portefeuille</TabsTrigger>
          <TabsTrigger value="risk">Risque</TabsTrigger>
          <TabsTrigger value="regulatory">Réglementaire</TabsTrigger>
          <TabsTrigger value="scheduled">Planifiés</TabsTrigger>
        </TabsList>
        
        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapports de Portefeuille</CardTitle>
              <CardDescription>
                Générer des rapports détaillés sur la composition et la performance du portefeuille.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start gap-3 mb-4">
                      <FileSpreadsheet className="h-8 w-8 text-blue-500" />
                      <div>
                        <h3 className="font-medium">Rapport de Performance</h3>
                        <p className="text-sm text-muted-foreground">
                          Analyse détaillée des performances du portefeuille par secteur, notation et maturité.
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="excel-performance" />
                        <Label htmlFor="excel-performance" className="text-sm">Excel</Label>
                        
                        <Checkbox id="pdf-performance" />
                        <Label htmlFor="pdf-performance" className="text-sm">PDF</Label>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleGenerateReport('Performance')}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Générer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start gap-3 mb-4">
                      <FileSpreadsheet className="h-8 w-8 text-green-500" />
                      <div>
                        <h3 className="font-medium">Rapport EVA</h3>
                        <p className="text-sm text-muted-foreground">
                          Analyse de la création de valeur économique ajoutée par prêt et par segment.
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="excel-eva" />
                        <Label htmlFor="excel-eva" className="text-sm">Excel</Label>
                        
                        <Checkbox id="pdf-eva" />
                        <Label htmlFor="pdf-eva" className="text-sm">PDF</Label>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleGenerateReport('EVA')}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Générer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start gap-3 mb-4">
                      <FilePdf className="h-8 w-8 text-red-500" />
                      <div>
                        <h3 className="font-medium">Dashboard Exécutif</h3>
                        <p className="text-sm text-muted-foreground">
                          Synthèse des indicateurs clés de performance pour le comité exécutif.
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="pdf-dashboard" checked disabled />
                        <Label htmlFor="pdf-dashboard" className="text-sm">PDF</Label>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleGenerateReport('Dashboard Exécutif')}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Générer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Rapports Historiques</CardTitle>
              <CardDescription>
                Accéder aux rapports générés précédemment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                  <div className="flex items-center">
                    <FilePdf className="h-5 w-5 mr-2 text-red-500" />
                    <span>Dashboard Exécutif - Q1 2025</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">15/04/2025</span>
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
                
                <li className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-5 w-5 mr-2 text-green-500" />
                    <span>Rapport EVA - Mars 2025</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">05/04/2025</span>
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
                
                <li className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-5 w-5 mr-2 text-blue-500" />
                    <span>Rapport de Performance - Février 2025</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">10/03/2025</span>
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle>Rapports de Risque</CardTitle>
              <CardDescription>
                Générez des rapports détaillés sur les risques du portefeuille.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start gap-3 mb-4">
                      <FileSpreadsheet className="h-8 w-8 text-red-500" />
                      <div>
                        <h3 className="font-medium">Rapport de Risque</h3>
                        <p className="text-sm text-muted-foreground">
                          Analyse détaillée des risques par secteur, notation et type de prêt.
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="excel-risk" />
                        <Label htmlFor="excel-risk" className="text-sm">Excel</Label>
                        
                        <Checkbox id="pdf-risk" />
                        <Label htmlFor="pdf-risk" className="text-sm">PDF</Label>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleGenerateReport('Risque')}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Générer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start gap-3 mb-4">
                      <FileSpreadsheet className="h-8 w-8 text-green-500" />
                      <div>
                        <h3 className="font-medium">Rapport de Liquideur</h3>
                        <p className="text-sm text-muted-foreground">
                          Analyse des ratios de liquidité du portefeuille.
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="excel-liquidity" />
                        <Label htmlFor="excel-liquidity" className="text-sm">Excel</Label>
                        
                        <Checkbox id="pdf-liquidity" />
                        <Label htmlFor="pdf-liquidity" className="text-sm">PDF</Label>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleGenerateReport('Liquideur')}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Générer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start gap-3 mb-4">
                      <FileSpreadsheet className="h-8 w-8 text-blue-500" />
                      <div>
                        <h3 className="font-medium">Rapport de Crédit</h3>
                        <p className="text-sm text-muted-foreground">
                          Analyse des risques liés au crédit du portefeuille.
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="excel-credit" />
                        <Label htmlFor="excel-credit" className="text-sm">Excel</Label>
                        
                        <Checkbox id="pdf-credit" />
                        <Label htmlFor="pdf-credit" className="text-sm">PDF</Label>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleGenerateReport('Crédit')}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Générer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="regulatory">
          <Card>
            <CardHeader>
              <CardTitle>Rapports Réglementaires</CardTitle>
              <CardDescription>
                Générez des rapports conformes aux exigences réglementaires.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rapport</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Dernière Génération</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">COREP</TableCell>
                    <TableCell>Common Reporting Framework pour les fonds propres</TableCell>
                    <TableCell>Excel, PDF</TableCell>
                    <TableCell>10/04/2025</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleGenerateReport('COREP')}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">FINREP</TableCell>
                    <TableCell>Financial Reporting Framework pour les états financiers</TableCell>
                    <TableCell>Excel, XBRL</TableCell>
                    <TableCell>05/04/2025</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleGenerateReport('FINREP')}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Grands Risques</TableCell>
                    <TableCell>Rapport sur les expositions importantes</TableCell>
                    <TableCell>Excel, PDF</TableCell>
                    <TableCell>01/04/2025</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleGenerateReport('Grands Risques')}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Liquidité (LCR/NSFR)</TableCell>
                    <TableCell>Ratios de liquidité réglementaires</TableCell>
                    <TableCell>Excel, PDF</TableCell>
                    <TableCell>15/03/2025</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleGenerateReport('Liquidité')}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Rapports Programmés</CardTitle>
              <CardDescription>
                Configurez des rapports à générer automatiquement selon un calendrier défini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rapport</TableHead>
                    <TableHead>Fréquence</TableHead>
                    <TableHead>Destinataires</TableHead>
                    <TableHead>Prochaine exécution</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Tableau de Bord Direction</TableCell>
                    <TableCell>Hebdomadaire (Lundi)</TableCell>
                    <TableCell>direction@financify.com</TableCell>
                    <TableCell>22/04/2025</TableCell>
                    <TableCell className="text-green-600">Actif</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Rapport Mensuel Risque</TableCell>
                    <TableCell>Mensuel (1er jour)</TableCell>
                    <TableCell>risque@financify.com</TableCell>
                    <TableCell>01/05/2025</TableCell>
                    <TableCell className="text-green-600">Actif</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Rapport Trimestriel ALCO</TableCell>
                    <TableCell>Trimestriel</TableCell>
                    <TableCell>comite@financify.com</TableCell>
                    <TableCell>01/07/2025</TableCell>
                    <TableCell className="text-green-600">Actif</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Programmer un rapport</span>
                </Button>
                
                <Button 
                  className="flex items-center gap-2"
                >
                  <PrinterIcon className="h-4 w-4" />
                  <span>Imprimer la planification</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;

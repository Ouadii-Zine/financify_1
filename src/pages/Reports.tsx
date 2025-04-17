
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { FileText, Download, BarChart3, Calendar, Eye, PrinterIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Reports = () => {
  const [activeTab, setActiveTab] = useState("standard");
  
  const handleGenerateReport = (reportType: string) => {
    toast({
      title: "Rapport généré",
      description: `Le rapport ${reportType} a été généré avec succès.`,
      variant: "success"
    });
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rapports</h1>
      
      <Tabs defaultValue="standard" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="standard">Rapports Standard</TabsTrigger>
          <TabsTrigger value="regulatory">Rapports Réglementaires</TabsTrigger>
          <TabsTrigger value="custom">Rapports Personnalisés</TabsTrigger>
          <TabsTrigger value="scheduled">Rapports Programmés</TabsTrigger>
        </TabsList>
        
        <TabsContent value="standard">
          <Card>
            <CardHeader>
              <CardTitle>Rapports Standard</CardTitle>
              <CardDescription>
                Générez des rapports prédéfinis pour analyser votre portefeuille.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <BarChart3 className="h-8 w-8 text-blue-500" />
                    <div className="flex-1">
                      <h3 className="font-medium">Rapport de Performance</h3>
                      <p className="text-sm text-muted-foreground">
                        Analyse complète de la performance EVA et ROE du portefeuille.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Button 
                      size="sm" 
                      className="flex-1 flex items-center gap-1"
                      onClick={() => handleGenerateReport('Performance')}
                    >
                      <FileText className="h-4 w-4" />
                      <span>Générer</span>
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
                
                <Card className="p-4 flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <FileText className="h-8 w-8 text-green-500" />
                    <div className="flex-1">
                      <h3 className="font-medium">Rapport de Risque</h3>
                      <p className="text-sm text-muted-foreground">
                        Détail des risques par secteur, notation et type de prêt.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Button 
                      size="sm" 
                      className="flex-1 flex items-center gap-1"
                      onClick={() => handleGenerateReport('Risque')}
                    >
                      <FileText className="h-4 w-4" />
                      <span>Générer</span>
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
                
                <Card className="p-4 flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <Calendar className="h-8 w-8 text-red-500" />
                    <div className="flex-1">
                      <h3 className="font-medium">Projection de Cash Flows</h3>
                      <p className="text-sm text-muted-foreground">
                        Prévisions des entrées et sorties de trésorerie par période.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Button 
                      size="sm" 
                      className="flex-1 flex items-center gap-1"
                      onClick={() => handleGenerateReport('Cash Flows')}
                    >
                      <FileText className="h-4 w-4" />
                      <span>Générer</span>
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
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
        
        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Rapports Personnalisés</CardTitle>
              <CardDescription>
                Créez et générez des rapports sur mesure selon vos besoins.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-8 text-center mb-4">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">Créez votre rapport personnalisé</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                    Sélectionnez les métriques, filtres et présentation pour générer un rapport adapté à vos besoins spécifiques.
                  </p>
                  <Button>Créer un nouveau rapport</Button>
                </div>
              </div>
              
              <h3 className="text-lg font-medium mb-3">Mes Rapports Personnalisés</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead>Dernière exécution</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">EVA Sectorielle</TableCell>
                    <TableCell>Analyse EVA détaillée par secteur économique</TableCell>
                    <TableCell>12/03/2025</TableCell>
                    <TableCell>11/04/2025</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Top Clients</TableCell>
                    <TableCell>Performance des 20 plus grands clients</TableCell>
                    <TableCell>05/02/2025</TableCell>
                    <TableCell>10/04/2025</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
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


import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Filter, 
  Eye 
} from 'lucide-react';
import { ExcelTemplateService } from '@/services/ExcelTemplateService';
import { samplePortfolio } from '@/data/sampleData';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('performance');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reportFormats, setReportFormats] = useState([
    { name: 'performance', excel: true, pdf: true },
    { name: 'risk', excel: true, pdf: false },
    { name: 'regulatory', excel: false, pdf: true },
  ]);
  
  const handleGenerateReport = (reportType: string, format: string) => {
    if (!reportType || !format) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un type de rapport et un format.",
        variant: "destructive"
      });
      return;
    }
    
    const selectedReport = reportFormats.find(r => r.name === reportType);
    if (selectedReport) {
      const formatExists = (format === 'excel' && selectedReport.excel) || 
                          (format === 'pdf' && selectedReport.pdf);
      
      if (formatExists) {
        if (format === 'excel') {
          ExcelTemplateService.exportData(samplePortfolio, reportType, 'excel');
        } else if (format === 'pdf') {
          ExcelTemplateService.exportData(samplePortfolio, reportType, 'pdf');
        } else {
          ExcelTemplateService.simulateDownload(reportType, format);
        }
        
        toast({
          title: "Rapport généré",
          description: `Le rapport ${reportType} au format ${format.toUpperCase()} a été téléchargé.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Format non supporté",
          description: `Le format ${format.toUpperCase()} n'est pas disponible pour ce rapport.`,
          variant: "destructive"
        });
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Génération de Rapports</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Options de Rapport</CardTitle>
          <CardDescription>
            Sélectionnez le type de rapport et le format souhaité.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Type de Rapport</h3>
              <div className="flex flex-col space-y-2">
                <Button 
                  variant={selectedReport === 'performance' ? 'default' : 'outline'}
                  onClick={() => setSelectedReport('performance')}
                >
                  Performance
                </Button>
                <Button 
                  variant={selectedReport === 'risk' ? 'default' : 'outline'}
                  onClick={() => setSelectedReport('risk')}
                >
                  Risque
                </Button>
                <Button 
                  variant={selectedReport === 'regulatory' ? 'default' : 'outline'}
                  onClick={() => setSelectedReport('regulatory')}
                >
                  Réglementaire
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Format de Rapport</h3>
              <div className="flex flex-col space-y-2">
                <Button 
                  variant="outline"
                  onClick={() => handleGenerateReport(selectedReport, 'excel')}
                  disabled={!reportFormats.find(r => r.name === selectedReport)?.excel}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                  {!reportFormats.find(r => r.name === selectedReport)?.excel && (
                    <Badge className="ml-2">Bientôt</Badge>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleGenerateReport(selectedReport, 'pdf')}
                  disabled={!reportFormats.find(r => r.name === selectedReport)?.pdf}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                  {!reportFormats.find(r => r.name === selectedReport)?.pdf && (
                    <Badge className="ml-2">Bientôt</Badge>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleGenerateReport(selectedReport, 'csv')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  CSV
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>
            Ajustez les paramètres pour affiner votre rapport.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Date</h3>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <input 
                  type="date" 
                  className="border rounded-md px-3 py-2 w-full"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Autres Filtres</h3>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <select className="border rounded-md px-3 py-2 w-full">
                  <option>Secteur</option>
                  <option>Pays</option>
                  <option>Rating</option>
                </select>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Visualisation</h3>
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <select className="border rounded-md px-3 py-2 w-full">
                  <option>Tableau</option>
                  <option>Graphique</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Aperçu du Rapport</CardTitle>
          <CardDescription>
            Visualisez un extrait des données qui seront incluses dans le rapport.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prêt</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>PD</TableHead>
                <TableHead>LGD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Prêt A</TableCell>
                <TableCell>Client X</TableCell>
                <TableCell>1,000,000 €</TableCell>
                <TableCell>1.2%</TableCell>
                <TableCell>45%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Prêt B</TableCell>
                <TableCell>Client Y</TableCell>
                <TableCell>500,000 €</TableCell>
                <TableCell>0.8%</TableCell>
                <TableCell>30%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;

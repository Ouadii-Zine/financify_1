import React, { useState, useEffect } from 'react';
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
  Eye,
  Clock
} from 'lucide-react';
import ExcelTemplateService from '@/services/ExcelTemplateService';
import { samplePortfolio } from '@/data/sampleData';
import LoanDataService from '../services/LoanDataService';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('Performance');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reportFormats, setReportFormats] = useState([
    { name: 'Performance', excel: true, pdf: true, csv: true },
    { name: 'Risque', excel: true, pdf: true, csv: true },
    { name: 'Réglementaire', excel: true, pdf: true, csv: true },
    { name: 'Planifiés', excel: true, pdf: true, csv: true },
  ]);
  const loanDataService = LoanDataService.getInstance();
  const [portfolio, setPortfolio] = useState(samplePortfolio);

  useEffect(() => {
    loanDataService.loadFromLocalStorage();
    const userLoans = loanDataService.getLoans();
    const updatedPortfolio = {
      ...samplePortfolio,
      loans: [...samplePortfolio.loans, ...userLoans]
    };
    setPortfolio(updatedPortfolio);
  }, []);
  
  const handleGenerateReport = (reportType: string, format: string) => {
    if (!reportType || !format) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un type de rapport et un format.",
        variant: "destructive"
      });
      return;
    }
    
    const selectedReportConfig = reportFormats.find(r => r.name === reportType);
    if (selectedReportConfig) {
      const formatExists = 
        (format === 'excel' && selectedReportConfig.excel) || 
        (format === 'pdf' && selectedReportConfig.pdf) ||
        (format === 'csv' && selectedReportConfig.csv);
      
      if (formatExists) {
        if (format === 'excel' || format === 'csv') {
          ExcelTemplateService.exportData(
            portfolio, 
            reportType, 
            format as 'excel' | 'csv'
          );
        } else {
          // PDF format - simulate download for now
          console.log(`Generating ${reportType} report in ${format} format`);
        }
        
        toast({
          title: "Report generated",
          description: `The ${reportType} report in ${format.toUpperCase()} format has been downloaded.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Format not supported",
          description: `The ${format.toUpperCase()} format is not available for this report.`,
          variant: "destructive"
        });
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Report Generation</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Report Options</CardTitle>
          <CardDescription>
            Select the report type and desired format.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Report Type</h3>
              <div className="flex flex-col space-y-2">
                <Button 
                  variant={selectedReport === 'Performance' ? 'default' : 'outline'}
                  onClick={() => setSelectedReport('Performance')}
                >
                  Performance
                </Button>
                <Button 
                  variant={selectedReport === 'Risk' ? 'default' : 'outline'}
                  onClick={() => setSelectedReport('Risk')}
                >
                  Risk
                </Button>
                <Button 
                  variant={selectedReport === 'Regulatory' ? 'default' : 'outline'}
                  onClick={() => setSelectedReport('Regulatory')}
                >
                  Regulatory
                </Button>
                <Button 
                  variant={selectedReport === 'Scheduled' ? 'default' : 'outline'}
                  onClick={() => setSelectedReport('Scheduled')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Scheduled
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
                  disabled={!reportFormats.find(r => r.name === selectedReport)?.csv}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  CSV
                  {!reportFormats.find(r => r.name === selectedReport)?.csv && (
                    <Badge className="ml-2">Bientôt</Badge>
                  )}
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
              {portfolio.loans.slice(0, 5).map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>{loan.name}</TableCell>
                  <TableCell>{loan.clientName}</TableCell>
                  <TableCell>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: loan.currency }).format(loan.originalAmount)}</TableCell>
                  <TableCell>{(loan.pd * 100).toFixed(2)}%</TableCell>
                  <TableCell>{(loan.lgd * 100).toFixed(0)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;

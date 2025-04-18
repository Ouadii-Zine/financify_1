
// ExcelTemplateService.ts
import { toast } from "@/hooks/use-toast";
import { Loan, Portfolio, CalculationParameters } from "../types/finance";

// Templates CSV/Excel pour l'import
const LOAN_TEMPLATE_CONTENT = `ID,Nom,Client,Type,Statut,Date de début,Date de fin,Devise,Montant original,Encours,Montant tiré,Montant non tiré,PD,LGD,EAD,Frais upfront,Frais commitment,Frais agency,Autres frais,Marge,Taux de référence,Notation interne,Secteur,Pays
L001,Prêt Entreprise A,Entreprise A,term,active,2023-01-01,2026-01-01,EUR,1000000,900000,800000,100000,0.01,0.45,800000,5000,0.005,2000,1000,0.02,0.03,BB+,Technologie,France`;

const CASHFLOW_TEMPLATE_CONTENT = `ID,Date,Type,Montant,Manuel,Description
CF001,2023-02-15,drawdown,200000,false,Tirage initial
CF002,2023-05-15,repayment,50000,false,Premier remboursement
CF003,2023-08-15,interest,6000,false,Paiement d'intérêts Q3`;

const PARAMETERS_TEMPLATE_CONTENT = `Paramètre,Valeur
targetROE,0.12
corporateTaxRate,0.25
capitalRatio,0.08
fundingCost,0.015
operationalCostRatio,0.005`;

// Structure pour les rapports
interface ReportFormat {
  type: 'excel' | 'pdf' | 'csv';
  mimeType: string;
  extension: string;
}

interface ReportType {
  name: string;
  description: string;
  formats: ReportFormat[];
  getContent: (data: any) => string;
}

// Formats de rapport disponibles
const REPORT_FORMATS: ReportFormat[] = [
  { type: 'excel', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: '.xlsx' },
  { type: 'pdf', mimeType: 'application/pdf', extension: '.pdf' },
  { type: 'csv', mimeType: 'text/csv', extension: '.csv' }
];

// Types de rapports disponibles
const REPORT_TYPES: ReportType[] = [
  {
    name: 'Performance',
    description: 'Analyse détaillée des performances du portefeuille',
    formats: REPORT_FORMATS,
    getContent: (portfolio: Portfolio) => {
      // Contenu du rapport de performance
      let content = 'Rapport de Performance\n\n';
      content += `Portefeuille: ${portfolio.name}\n`;
      content += `Exposition Totale: ${portfolio.metrics.totalExposure}\n`;
      content += `ROE Portfolio: ${(portfolio.metrics.portfolioROE * 100).toFixed(2)}%\n`;
      content += `RAROC Portfolio: ${(portfolio.metrics.portfolioRAROC * 100).toFixed(2)}%\n\n`;
      
      content += 'Détail des prêts:\n';
      portfolio.loans.forEach(loan => {
        content += `${loan.name}, ROE: ${((loan.metrics?.roe || 0) * 100).toFixed(2)}%, EVA: ${loan.metrics?.evaIntrinsic || 0}\n`;
      });
      
      return content;
    }
  },
  {
    name: 'Risque',
    description: 'Analyse détaillée des risques du portefeuille',
    formats: REPORT_FORMATS,
    getContent: (portfolio: Portfolio) => {
      // Contenu du rapport de risque
      let content = 'Rapport de Risque\n\n';
      content += `Portefeuille: ${portfolio.name}\n`;
      content += `Expected Loss Total: ${portfolio.metrics.totalExpectedLoss}\n`;
      content += `PD Moyenne: ${(portfolio.metrics.weightedAveragePD * 100).toFixed(2)}%\n`;
      content += `LGD Moyenne: ${(portfolio.metrics.weightedAverageLGD * 100).toFixed(0)}%\n\n`;
      
      content += 'Détail des prêts:\n';
      portfolio.loans.forEach(loan => {
        content += `${loan.name}, PD: ${(loan.pd * 100).toFixed(2)}%, LGD: ${(loan.lgd * 100).toFixed(0)}%, EL: ${loan.metrics?.expectedLoss || 0}\n`;
      });
      
      return content;
    }
  },
  {
    name: 'Réglementaire',
    description: 'Rapports conformes aux exigences réglementaires',
    formats: REPORT_FORMATS,
    getContent: (portfolio: Portfolio) => {
      // Contenu du rapport réglementaire
      let content = 'Rapport Réglementaire\n\n';
      content += `Portefeuille: ${portfolio.name}\n`;
      content += `RWA Total: ${portfolio.metrics.totalRWA}\n`;
      content += `Densité RWA: ${((portfolio.metrics.totalRWA / portfolio.metrics.totalExposure) * 100).toFixed(0)}%\n\n`;
      
      content += 'Détail des prêts:\n';
      portfolio.loans.forEach(loan => {
        content += `${loan.name}, RWA: ${loan.metrics?.rwa || 0}, Capital Requis: ${loan.metrics?.capitalConsumption || 0}\n`;
      });
      
      return content;
    }
  },
  {
    name: 'Planifiés',
    description: 'Rapports de planification et prévisions',
    formats: REPORT_FORMATS,
    getContent: (portfolio: Portfolio) => {
      // Contenu du rapport planifié
      let content = 'Rapport de Planification\n\n';
      content += `Portefeuille: ${portfolio.name}\n`;
      content += `Exposition Totale: ${portfolio.metrics.totalExposure}\n`;
      content += `Prévision ROE: ${(portfolio.metrics.portfolioROE * 1.05 * 100).toFixed(2)}%\n`;
      
      content += '\nPrévisions des Cashflows:\n';
      portfolio.loans.forEach(loan => {
        content += `${loan.name}, Encours Actuel: ${loan.outstandingAmount}, Encours Prévu: ${loan.outstandingAmount * 0.9}\n`;
      });
      
      return content;
    }
  }
];

// Fonction pour télécharger des gabarits - exportée nommément pour Import.tsx
export const downloadExcelTemplate = (templateType: string): { success: boolean; message: string } => {
  try {
    let content = '';
    let filename = '';
    let mimeType = '';
    
    switch (templateType) {
      case 'prets':
        content = LOAN_TEMPLATE_CONTENT;
        filename = 'gabarit_prets.csv';
        mimeType = 'text/csv';
        break;
      case 'cashflows':
        content = CASHFLOW_TEMPLATE_CONTENT;
        filename = 'gabarit_cashflows.csv';
        mimeType = 'text/csv';
        break;
      case 'parametres':
        content = PARAMETERS_TEMPLATE_CONTENT;
        filename = 'gabarit_parametres.csv';
        mimeType = 'text/csv';
        break;
      case 'documentation':
        content = 'Documentation complète pour l\'import de données...';
        filename = 'guide_import.txt';
        mimeType = 'text/plain';
        break;
      default:
        return {
          success: false,
          message: "Type de gabarit non reconnu"
        };
    }
    
    // Créer et télécharger le fichier
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      message: `Le gabarit ${filename} a été téléchargé avec succès.`
    };
  } catch (error) {
    console.error("Erreur lors du téléchargement du gabarit:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors du téléchargement du gabarit."
    };
  }
};

// Fonction pour générer de la documentation - exportée nommément pour Import.tsx
export const generateTemplateDocumentation = (templateType: string): string => {
  switch (templateType) {
    case 'prets':
      return `<p>Fichier CSV avec les colonnes suivantes:</p>
      <ul class="list-disc list-inside mt-2 pl-2">
        <li><strong>ID:</strong> Identifiant unique du prêt (ex: L001)</li>
        <li><strong>Nom:</strong> Nom du prêt (ex: Prêt Entreprise A)</li>
        <li><strong>Client:</strong> Nom du client (ex: Entreprise A)</li>
        <li><strong>Type:</strong> Type de prêt (term, revolver, bullet, amortizing)</li>
        <li><strong>Statut:</strong> Statut du prêt (active, closed, default, restructured)</li>
        <li><strong>Date de début/fin:</strong> Format YYYY-MM-DD</li>
        <li><strong>Devise:</strong> Code devise (EUR, USD, GBP, CHF, JPY)</li>
        <li><strong>Montants:</strong> Montants numériques en devise</li>
        <li><strong>PD/LGD:</strong> Valeurs décimales (ex: 0.01 pour 1%)</li>
      </ul>`;
      
    case 'cashflows':
      return `<p>Fichier CSV avec les colonnes suivantes:</p>
      <ul class="list-disc list-inside mt-2 pl-2">
        <li><strong>ID:</strong> Identifiant unique du cash flow (ex: CF001)</li>
        <li><strong>Date:</strong> Format YYYY-MM-DD (ex: 2023-02-15)</li>
        <li><strong>Type:</strong> Type de cash flow (drawdown, repayment, interest, fee)</li>
        <li><strong>Montant:</strong> Montant en devise</li>
        <li><strong>Manuel:</strong> true ou false (indique si le cash flow est manuel)</li>
        <li><strong>Description:</strong> Description du cash flow</li>
      </ul>`;
      
    case 'parametres':
      return `<p>Fichier CSV avec les colonnes suivantes:</p>
      <ul class="list-disc list-inside mt-2 pl-2">
        <li><strong>Paramètre:</strong> Nom du paramètre</li>
        <li><strong>Valeur:</strong> Valeur numérique du paramètre (ex: 0.12 pour 12%)</li>
      </ul>
      <p class="mt-2">Paramètres acceptés: targetROE, corporateTaxRate, capitalRatio, fundingCost, operationalCostRatio</p>`;
      
    default:
      return "<p>Format non spécifié</p>";
  }
};

// Service principal exporté par défaut
const ExcelTemplateService = {
  // Télécharger un gabarit
  downloadTemplate: (templateType: 'loans' | 'cashflows' | 'parameters') => {
    let content = '';
    let filename = '';
    let mimeType = '';
    
    switch (templateType) {
      case 'loans':
        content = LOAN_TEMPLATE_CONTENT;
        filename = 'gabarit_prets.csv';
        mimeType = 'text/csv';
        break;
      case 'cashflows':
        content = CASHFLOW_TEMPLATE_CONTENT;
        filename = 'gabarit_cashflows.csv';
        mimeType = 'text/csv';
        break;
      case 'parameters':
        content = PARAMETERS_TEMPLATE_CONTENT;
        filename = 'gabarit_parametres.csv';
        mimeType = 'text/csv';
        break;
      default:
        toast({
          title: "Erreur",
          description: "Type de gabarit non reconnu",
          variant: "destructive"
        });
        return;
    }
    
    // Créer et télécharger le fichier
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Gabarit téléchargé",
      description: `Le gabarit ${filename} a été téléchargé avec succès.`,
      variant: "default"
    });
  },
  
  // Exporter les données en format CSV/Excel/PDF
  exportData: (data: Portfolio | Loan[] | CalculationParameters, reportType: string, format: 'excel' | 'pdf' | 'csv') => {
    console.log(`Exporting data for report: ${reportType} in format: ${format}`, data);
    
    const report = REPORT_TYPES.find(r => r.name === reportType);
    if (!report) {
      toast({
        title: "Erreur",
        description: "Type de rapport non reconnu",
        variant: "destructive"
      });
      return;
    }
    
    const reportFormat = report.formats.find(f => f.type === format);
    if (!reportFormat) {
      toast({
        title: "Erreur",
        description: "Format de rapport non supporté",
        variant: "destructive"
      });
      return;
    }
    
    // Générer le contenu du rapport
    const content = report.getContent(data);
    
    // Dans une application réelle, on convertirait le contenu au format approprié
    // Ici, on simule juste un téléchargement avec le bon type MIME
    const blob = new Blob([content], { type: reportFormat.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_${reportType.toLowerCase()}${reportFormat.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Rapport généré",
      description: `Le rapport ${reportType} au format ${format.toUpperCase()} a été téléchargé.`,
      variant: "default"
    });
  },
  
  // Simuler un téléchargement d'exemple pour les formats non supportés en réalité
  simulateDownload: (reportType: string, format: string) => {
    toast({
      title: "Génération en cours",
      description: `Préparation du rapport ${reportType} au format ${format.toUpperCase()}...`,
      variant: "default"
    });
    
    setTimeout(() => {
      toast({
        title: "Rapport généré",
        description: `Le rapport ${reportType} au format ${format.toUpperCase()} a été téléchargé.`,
        variant: "default"
      });
      
      // Simuler un téléchargement pour la démonstration
      const a = document.createElement('a');
      a.href = '#';
      a.download = `rapport_${reportType.toLowerCase()}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, 1500);
  },
  
  // Obtenir un descriptif de format adapté pour chaque type de gabarit
  getTemplateDescription: (templateType: 'loans' | 'cashflows' | 'parameters'): string => {
    switch (templateType) {
      case 'loans':
        return `Fichier CSV avec les colonnes suivantes:
- ID: Identifiant unique du prêt (ex: L001)
- Nom: Nom du prêt (ex: Prêt Entreprise A)
- Client: Nom du client (ex: Entreprise A)
- Type: Type de prêt (term, revolver, bullet, amortizing)
- Statut: Statut du prêt (active, closed, default, restructured)
- Date de début: Format YYYY-MM-DD (ex: 2023-01-01)
- Date de fin: Format YYYY-MM-DD (ex: 2026-01-01)
- Devise: Code devise (EUR, USD, GBP, CHF, JPY)
- Montant original: Montant initial du prêt en devise
- Encours: Montant restant dû en devise
- Montant tiré: Montant effectivement tiré en devise
- Montant non tiré: Montant disponible mais non tiré en devise
- PD: Probabilité de défaut (ex: 0.01 pour 1%)
- LGD: Loss Given Default (ex: 0.45 pour 45%)
- EAD: Exposure at Default en devise
- Frais upfront: Frais initiaux en devise
- Frais commitment: Taux annuel des frais d'engagement (ex: 0.005 pour 0.5%)
- Frais agency: Frais d'agence en devise
- Autres frais: Autres frais en devise
- Marge: Marge en % (ex: 0.02 pour 2%)
- Taux de référence: Taux de base en % (ex: 0.03 pour 3%)
- Notation interne: Rating interne (ex: BB+)
- Secteur: Secteur d'activité (ex: Technologie)
- Pays: Pays du client (ex: France)`;
      
      case 'cashflows':
        return `Fichier CSV avec les colonnes suivantes:
- ID: Identifiant unique du cash flow (ex: CF001)
- Date: Format YYYY-MM-DD (ex: 2023-02-15)
- Type: Type de cash flow (drawdown, repayment, interest, fee)
- Montant: Montant en devise
- Manuel: true ou false (indique si le cash flow est manuel)
- Description: Description du cash flow (ex: Tirage initial)`;
      
      case 'parameters':
        return `Fichier CSV avec les colonnes suivantes:
- Paramètre: Nom du paramètre (targetROE, corporateTaxRate, capitalRatio, fundingCost, operationalCostRatio)
- Valeur: Valeur numérique du paramètre (ex: 0.12 pour 12%)`;
      
      default:
        return "Format non spécifié";
    }
  }
};

export default ExcelTemplateService;

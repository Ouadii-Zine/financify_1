// ExcelTemplateService.ts
import { toast } from "@/hooks/use-toast";
import { Loan, Portfolio, CalculationParameters } from "../types/finance";

// Templates CSV/Excel pour l'import
const LOAN_TEMPLATE_CONTENT = `ID,Nom,Client,Type,Statut,Date de début,Date de fin,Devise,Montant original,Encours,Montant tiré,Montant non tiré,PD,LGD,EAD,Marge,Taux de référence,Notation interne,Secteur,Pays,Frais upfront,Frais commitment,Frais agency,Autres frais
L001,Prêt Entreprise A,Entreprise A,term,active,2023-01-01,2026-01-01,EUR,1000000,900000,800000,100000,1,45,800000,2,3,BB+,Technologie,France,5000,0.5,2000,1000`;

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
      title: "Téléchargement réussi",
      description: `Le gabarit ${filename} a été téléchargé avec succès.`,
      variant: "default"
    });
  },
  
  // Générer la documentation d'un gabarit
  generateDocumentation: (templateType: string): string => {
    return generateTemplateDocumentation(templateType);
  },
  
  // Export complet des données
  exportData: (data: Portfolio, reportName: string, format: 'excel' | 'csv' = 'excel') => {
    try {
      if (!data || !data.loans) {
        throw new Error("Données de portfolio invalides pour l'export");
      }
      
      const content = ExcelTemplateService.generatePortfolioExport(data);
      const filename = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      const mimeType = format === 'excel' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv';
      
      if (format === 'excel') {
        ExcelTemplateService.exportExcel(content, filename);
      } else {
        ExcelTemplateService.exportCSV(content, filename);
      }
      
      return {
        success: true,
        message: `Les données ont été exportées avec succès au format ${format.toUpperCase()}.`
      };
    } catch (error) {
      console.error("Erreur lors de l'export des données:", error);
      return {
        success: false,
        message: `Une erreur est survenue lors de l'export des données: ${error}`
      };
    }
  },
  
  // Génère les données complètes du portfolio pour l'export
  generatePortfolioExport: (portfolio: Portfolio) => {
    // Créer un objet pour l'export
    const exportData = {
      portfolioInfo: {
        nom: portfolio.name,
        description: portfolio.description || 'Portfolio Financify',
        dateExport: new Date().toISOString(),
        nombrePrets: portfolio.loans.length,
        expositionTotale: portfolio.metrics.totalExposure,
        roePortfolio: portfolio.metrics.portfolioROE,
        rarocPortfolio: portfolio.metrics.portfolioRAROC,
        expectedLossTotal: portfolio.metrics.totalExpectedLoss,
        rwaTotal: portfolio.metrics.totalRWA
      },
      loans: portfolio.loans.map(loan => ({
        id: loan.id,
        nom: loan.name,
        client: loan.clientName,
        type: loan.type,
        statut: loan.status,
        dateDebut: loan.startDate,
        dateFin: loan.endDate,
        devise: loan.currency,
        montantOriginal: loan.originalAmount,
        montantRestant: loan.outstandingAmount,
        montantTire: loan.drawnAmount,
        montantNonTire: loan.undrawnAmount,
        pd: loan.pd,
        lgd: loan.lgd,
        ead: loan.ead,
        fraisUpfront: loan.fees.upfront,
        fraisCommitment: loan.fees.commitment,
        fraisAgency: loan.fees.agency,
        autresFrais: loan.fees.other,
        marge: loan.margin,
        tauxReference: loan.referenceRate,
        notationInterne: loan.internalRating,
        secteur: loan.sector,
        pays: loan.country,
        evaIntrinseque: loan.metrics.evaIntrinsic,
        evaCession: loan.metrics.evaSale,
        perteAttendue: loan.metrics.expectedLoss,
        rwa: loan.metrics.rwa,
        roe: loan.metrics.roe,
        raroc: loan.metrics.raroc,
        coutRisque: loan.metrics.costOfRisk,
        consommationCapital: loan.metrics.capitalConsumption,
        margeNette: loan.metrics.netMargin,
        rendementEffectif: loan.metrics.effectiveYield
      })),
      cashflows: portfolio.loans.flatMap(loan => 
        loan.cashFlows.map(cf => ({
          loanId: loan.id,
          loanName: loan.name,
          id: cf.id,
          date: cf.date,
          type: cf.type,
          montant: cf.amount,
          estManuel: cf.isManual,
          description: cf.description || ''
        }))
      )
    };
    
    return exportData;
  },
  
  // Export au format Excel
  exportExcel: (data: any, filename: string) => {
    try {
      // Utilisation de la bibliothèque XLSX
      const XLSX = require('xlsx');
      
      // Création du classeur
      const workbook = XLSX.utils.book_new();
      
      // Création des feuilles
      
      // 1. Feuille d'informations du portfolio
      const portfolioSheet = XLSX.utils.json_to_sheet([data.portfolioInfo]);
      XLSX.utils.book_append_sheet(workbook, portfolioSheet, "Informations Portfolio");
      
      // 2. Feuille des prêts
      const loansSheet = XLSX.utils.json_to_sheet(data.loans);
      XLSX.utils.book_append_sheet(workbook, loansSheet, "Prêts");
      
      // 3. Feuille des cashflows
      if (data.cashflows && data.cashflows.length > 0) {
        const cashflowsSheet = XLSX.utils.json_to_sheet(data.cashflows);
        XLSX.utils.book_append_sheet(workbook, cashflowsSheet, "Cashflows");
      }
      
      // Écriture du fichier
      XLSX.writeFile(workbook, filename);
      
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      throw error;
    }
  },
  
  // Export au format CSV
  exportCSV: (data: any, filename: string) => {
    try {
      // Utilisation de Papa Parse pour la conversion en CSV
      const Papa = require('papaparse');
      
      // Conversion des données en CSV
      const loansCSV = Papa.unparse(data.loans);
      
      // Création et téléchargement du fichier
      const blob = new Blob([loansCSV], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Erreur lors de l'export CSV:", error);
      throw error;
    }
  }
};

export default ExcelTemplateService;

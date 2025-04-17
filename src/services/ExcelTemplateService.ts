
/**
 * Service pour la gestion des gabarits Excel
 * 
 * Ce service fournit des méthodes pour générer et télécharger des gabarits Excel
 * qui peuvent être utilisés pour l'importation de données dans l'application.
 * 
 * Dans une application réelle, ce service pourrait utiliser des bibliothèques comme
 * exceljs, xlsx ou sheetjs pour générer dynamiquement les fichiers Excel.
 */

// Structure d'un gabarit Excel
interface ExcelTemplate {
  name: string;
  description: string;
  sheets: ExcelSheet[];
}

// Structure d'une feuille Excel
interface ExcelSheet {
  name: string;
  columns: ExcelColumn[];
  sampleData?: any[];
}

// Structure d'une colonne Excel
interface ExcelColumn {
  header: string;
  key: string;
  width: number;
  description: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum';
  options?: string[]; // Pour les colonnes de type 'enum'
  format?: string; // Format d'affichage
}

// Gabarits disponibles
const templates: Record<string, ExcelTemplate> = {
  prets: {
    name: "Gabarit d'Import de Prêts",
    description: "Modèle pour importer des données de prêts",
    sheets: [
      {
        name: "Prêts",
        columns: [
          { header: "ID", key: "id", width: 20, description: "Identifiant unique du prêt", required: true, type: "string" },
          { header: "Nom", key: "name", width: 30, description: "Nom du prêt", required: true, type: "string" },
          { header: "Client", key: "clientName", width: 30, description: "Nom du client", required: true, type: "string" },
          { header: "Type", key: "type", width: 15, description: "Type de prêt", required: true, type: "enum", options: ["term", "revolver", "bullet", "amortizing"] },
          { header: "Statut", key: "status", width: 15, description: "Statut du prêt", required: true, type: "enum", options: ["active", "closed", "default", "restructured"] },
          { header: "Date de Début", key: "startDate", width: 15, description: "Date de début du prêt (YYYY-MM-DD)", required: true, type: "date" },
          { header: "Date de Fin", key: "endDate", width: 15, description: "Date de fin du prêt (YYYY-MM-DD)", required: true, type: "date" },
          { header: "Devise", key: "currency", width: 10, description: "Devise du prêt", required: true, type: "enum", options: ["EUR", "USD", "GBP", "CHF", "JPY"] },
          { header: "Montant Original", key: "originalAmount", width: 20, description: "Montant original du prêt", required: true, type: "number" },
          { header: "Encours", key: "outstandingAmount", width: 20, description: "Encours actuel", required: true, type: "number" },
          { header: "Montant Tiré", key: "drawnAmount", width: 20, description: "Montant tiré", required: true, type: "number" },
          { header: "Montant Non Tiré", key: "undrawnAmount", width: 20, description: "Montant non tiré", required: true, type: "number" },
          { header: "PD", key: "pd", width: 15, description: "Probabilité de défaut (entre 0 et 1)", required: true, type: "number" },
          { header: "LGD", key: "lgd", width: 15, description: "Loss Given Default (entre 0 et 1)", required: true, type: "number" },
          { header: "EAD", key: "ead", width: 20, description: "Exposure at Default", required: true, type: "number" },
          { header: "Frais Upfront", key: "fees.upfront", width: 15, description: "Frais initiaux", required: false, type: "number" },
          { header: "Frais d'Engagement", key: "fees.commitment", width: 15, description: "Frais d'engagement annuels", required: false, type: "number" },
          { header: "Frais d'Agence", key: "fees.agency", width: 15, description: "Frais d'agence", required: false, type: "number" },
          { header: "Autres Frais", key: "fees.other", width: 15, description: "Autres frais", required: false, type: "number" },
          { header: "Marge", key: "margin", width: 15, description: "Marge sur taux de référence (en %)", required: true, type: "number" },
          { header: "Taux de Référence", key: "referenceRate", width: 15, description: "Taux de référence actuel (en %)", required: true, type: "number" },
          { header: "Notation Interne", key: "internalRating", width: 15, description: "Notation interne", required: false, type: "string" },
          { header: "Secteur", key: "sector", width: 20, description: "Secteur d'activité", required: false, type: "string" },
          { header: "Pays", key: "country", width: 20, description: "Pays de l'emprunteur", required: false, type: "string" }
        ]
      }
    ]
  },
  cashflows: {
    name: "Gabarit d'Import de Cash Flows",
    description: "Modèle pour importer des cash flows prévisionnels",
    sheets: [
      {
        name: "Cash Flows",
        columns: [
          { header: "ID", key: "id", width: 20, description: "Identifiant unique du cash flow", required: true, type: "string" },
          { header: "ID Prêt", key: "loanId", width: 20, description: "Identifiant du prêt associé", required: true, type: "string" },
          { header: "Date", key: "date", width: 15, description: "Date du cash flow (YYYY-MM-DD)", required: true, type: "date" },
          { header: "Type", key: "type", width: 15, description: "Type de cash flow", required: true, type: "enum", options: ["drawdown", "repayment", "interest", "fee"] },
          { header: "Montant", key: "amount", width: 20, description: "Montant du cash flow (négatif pour sortie, positif pour entrée)", required: true, type: "number" },
          { header: "Manuel", key: "isManual", width: 10, description: "Cash flow entré manuellement (true/false)", required: false, type: "boolean" },
          { header: "Description", key: "description", width: 30, description: "Description optionnelle", required: false, type: "string" }
        ]
      }
    ]
  },
  parametres: {
    name: "Gabarit de Paramètres",
    description: "Modèle pour configurer des paramètres de calcul personnalisés",
    sheets: [
      {
        name: "Paramètres Généraux",
        columns: [
          { header: "Paramètre", key: "parameter", width: 30, description: "Nom du paramètre", required: true, type: "string" },
          { header: "Valeur", key: "value", width: 20, description: "Valeur du paramètre", required: true, type: "number" },
          { header: "Description", key: "description", width: 40, description: "Description du paramètre", required: false, type: "string" }
        ]
      },
      {
        name: "Courbe PD",
        columns: [
          { header: "Notation", key: "rating", width: 20, description: "Notation interne", required: true, type: "string" },
          { header: "PD", key: "pd", width: 15, description: "Probabilité de défaut associée", required: true, type: "number" }
        ]
      },
      {
        name: "LGD Sectoriel",
        columns: [
          { header: "Secteur", key: "sector", width: 30, description: "Secteur d'activité", required: true, type: "string" },
          { header: "LGD", key: "lgd", width: 15, description: "Loss Given Default pour ce secteur", required: true, type: "number" }
        ]
      }
    ]
  }
};

/**
 * Télécharge un gabarit Excel
 * @param templateType Type de gabarit à télécharger
 * @returns Un objet indiquant si l'opération a réussi et un message
 */
export const downloadExcelTemplate = (templateType: string): { success: boolean, message: string } => {
  // Vérifier si le gabarit demandé existe
  if (!templates[templateType]) {
    return { 
      success: false, 
      message: `Gabarit "${templateType}" non trouvé.`
    };
  }
  
  // Dans une application réelle, on générerait le fichier Excel ici
  // Pour cette démonstration, on simule un téléchargement
  
  // Créer un lien temporaire et déclencher le téléchargement
  const fakeTemplateUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsDBBQABgAIAAAAIQD21qXvAgEAABQCAAATA`;
  const a = document.createElement('a');
  a.href = fakeTemplateUrl;
  a.download = `gabarit_${templateType}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  return { 
    success: true, 
    message: `Gabarit "${templates[templateType].name}" téléchargé avec succès.`
  };
};

/**
 * Génère la documentation pour les gabarits Excel
 * @param templateType Type de gabarit (optionnel)
 * @returns Documentation au format HTML
 */
export const generateTemplateDocumentation = (templateType?: string): string => {
  // Si un type spécifique est demandé, générer la doc pour ce type seulement
  if (templateType && templates[templateType]) {
    const template = templates[templateType];
    let html = `<h2>${template.name}</h2><p>${template.description}</p>`;
    
    template.sheets.forEach(sheet => {
      html += `<h3>Feuille: ${sheet.name}</h3>`;
      html += '<table><tr><th>Colonne</th><th>Description</th><th>Obligatoire</th><th>Type</th><th>Format/Options</th></tr>';
      
      sheet.columns.forEach(col => {
        html += `<tr>
          <td>${col.header}</td>
          <td>${col.description}</td>
          <td>${col.required ? 'Oui' : 'Non'}</td>
          <td>${col.type}</td>
          <td>${col.options ? col.options.join(', ') : (col.format || '')}</td>
        </tr>`;
      });
      
      html += '</table>';
    });
    
    return html;
  }
  
  // Sinon, générer une liste de tous les gabarits disponibles
  let html = '<h2>Gabarits Excel Disponibles</h2>';
  
  Object.entries(templates).forEach(([key, template]) => {
    html += `<div>
      <h3>${template.name}</h3>
      <p>${template.description}</p>
      <p>Contient ${template.sheets.length} feuille(s) et ${template.sheets.reduce((sum, sheet) => sum + sheet.columns.length, 0)} colonnes au total.</p>
    </div>`;
  });
  
  return html;
};

export default {
  downloadExcelTemplate,
  generateTemplateDocumentation,
  templates
};

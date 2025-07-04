// ClientTemplateService.ts
export interface ColumnDefinition {
  label: string;
  type: 'text' | 'select' | 'date' | 'currency' | 'number' | 'percentage' | 'boolean';
  options?: string[];
  required: boolean;
  calculated?: boolean;
}

export interface ClientConfiguration {
  name: string;
  displayName: string;
  requiredFields: string[];
  optionalFields: string[];
  calculatedFields: string[];
  includeTables: string[];
}

// Column definitions based on Excel structure
export const COLUMN_DEFINITIONS: Record<string, ColumnDefinition> = {
  // 🔴 MANDATORY COLUMNS (Essential input data)
  applicationCode: { 
    label: "Application Code", 
    type: "select", 
    options: ["LOAN IQ", "MANUAL", "OTHER"], 
    required: true 
  },
  facilityId: { 
    label: "Facility ID", 
    type: "text", 
    required: true 
  },
  dealId: { 
    label: "Deal ID", 
    type: "text", 
    required: true 
  },
  dealName: { 
    label: "Deal Name", 
    type: "text", 
    required: true 
  },
  asofDate: { 
    label: "As Of Date", 
    type: "date", 
    required: true 
  },
  facilityDate: { 
    label: "Facility Date", 
    type: "date", 
    required: true 
  },
  maturity: { 
    label: "Maturity", 
    type: "date", 
    required: true 
  },
  longNameBorrower: { 
    label: "Long Name Borrower", 
    type: "text", 
    required: true 
  },
  rafBorrower: { 
    label: "RAF Borrower", 
    type: "text", 
    required: true 
  },
  currency: { 
    label: "Currency", 
    type: "select", 
    options: ["EUR", "USD", "GBP", "CHF"], 
    required: true 
  },

  // 🔵 AUTOMATICALLY CALCULATED COLUMNS (Excel formulas converted)
  totalOutstanding: { 
    label: "Total Outstanding", 
    type: "currency", 
    required: false, 
    calculated: true 
  },
  drawnOutstanding: { 
    label: "Drawn Outstanding", 
    type: "currency", 
    required: false, 
    calculated: true 
  },
  undrawnOutstanding: { 
    label: "Undrawn Outstanding", 
    type: "currency", 
    required: false, 
    calculated: true 
  },
  totalRWA: { 
    label: "Total RWA", 
    type: "currency", 
    required: false, 
    calculated: true 
  },
  rwaDrawn: { 
    label: "RWA Drawn", 
    type: "currency", 
    required: false, 
    calculated: true 
  },
  rwaUndrawn: { 
    label: "RWA Undrawn", 
    type: "currency", 
    required: false, 
    calculated: true 
  },
  wal: { 
    label: "WAL (Weighted Average Life)", 
    type: "number", 
    required: false, 
    calculated: true 
  },
  pd1Year: { 
    label: "PD 1 Year", 
    type: "percentage", 
    required: false, 
    calculated: true 
  },
  breakEvenPrice: { 
    label: "Break Even Price", 
    type: "percentage", 
    required: false, 
    calculated: true 
  },
  evaPortage: { 
    label: "EVA Portage", 
    type: "currency", 
    required: false, 
    calculated: true 
  },
  discountedSumRWA: { 
    label: "Discounted Sum of RWA", 
    type: "currency", 
    required: false, 
    calculated: true 
  },
  discountedSumOutstanding: { 
    label: "Discounted Sum of Outstanding", 
    type: "currency", 
    required: false, 
    calculated: true 
  },

  // 🟡 OPTIONAL COLUMNS (Depending on institution type)
  ufo: { 
    label: "UFO", 
    type: "text", 
    required: false 
  },
  placeOfBooking: { 
    label: "Place of Booking", 
    type: "text", 
    required: false 
  },
  businessLine: { 
    label: "Business Line", 
    type: "select", 
    options: ["Corporate Financing", "Trade Finance", "Project Finance"], 
    required: false 
  },
  businessUnit: { 
    label: "Business Unit", 
    type: "text", 
    required: false 
  },
  pfmMetier: { 
    label: "PFM Métier", 
    type: "text", 
    required: false 
  },
  internalRating: { 
    label: "Internal Rating of Borrower", 
    type: "select", 
    options: ["AAA", "AA", "A", "BBB", "BB", "B", "CCC"], 
    required: false 
  },
  trrRating: { 
    label: "TRR Rating of Borrower", 
    type: "text", 
    required: false 
  },
  watchList: { 
    label: "Watch List", 
    type: "boolean", 
    required: false 
  },
  loanMarginBps: { 
    label: "Loan Margin (bps)", 
    type: "number", 
    required: false 
  },
  facilityFeeBps: { 
    label: "Facility Fee (bps)", 
    type: "number", 
    required: false 
  },
  utilizedFeeBps: { 
    label: "Utilized Fee (bps)", 
    type: "number", 
    required: false 
  },
  unutilizedFeeBps: { 
    label: "Unutilized Fee (bps)", 
    type: "number", 
    required: false 
  },
  zoneGeographique: { 
    label: "Zone Géographique", 
    type: "text", 
    required: false 
  },
  countryOfRisk: { 
    label: "Country of Risk", 
    type: "text", 
    required: false 
  },
  sector: { 
    label: "Sector", 
    type: "text", 
    required: false 
  }
};

// Client configurations
export const CLIENT_CONFIGURATIONS: Record<string, ClientConfiguration> = {
  banqueCommerciale: {
    name: "banqueCommerciale",
    displayName: "Commercial Bank",
    requiredFields: [
      "applicationCode", "facilityId", "dealId", "dealName", "asofDate", 
      "facilityDate", "maturity", "longNameBorrower", "rafBorrower", 
      "currency", "internalRating", "businessLine"
    ],
    optionalFields: [
      "ufo", "placeOfBooking", "businessUnit", "trrRating", "watchList", 
      "loanMarginBps", "facilityFeeBps", "sector", "zoneGeographique"
    ],
    calculatedFields: [
      "totalOutstanding", "drawnOutstanding", "undrawnOutstanding", 
      "totalRWA", "rwaDrawn", "rwaUndrawn", "wal", "pd1Year", 
      "breakEvenPrice", "evaPortage"
    ],
    includeTables: ["guarantees", "collaterals"]
  }
};

// Secondary tables definitions
export const SECONDARY_TABLES = {
  guarantees: {
    facilityId: { label: "Facility ID", type: "text", foreignKey: true },
    guaranteeName: { label: "Guarantee Name", type: "text" },
    securityId: { label: "Security ID", type: "text" },
    guaranteeNotional: { label: "Guarantee Notional", type: "currency" },
    eligibleNotional: { label: "Eligible Notional", type: "currency" },
    usedNotional: { label: "Used Notional", type: "currency" },
    rating: { label: "Rating", type: "text" },
    lgd: { label: "LGD", type: "percentage" },
    guaranteeLGD: { label: "Guarantee LGD", type: "percentage" },
    guaranteePD: { label: "Guarantee PD", type: "percentage" },
    percentCovered: { label: "% Covered", type: "percentage" }
  },
  collaterals: {
    facilityId: { label: "Facility ID", type: "text", foreignKey: true },
    securityId: { label: "Security ID", type: "text" },
    secNotional: { label: "Security Notional", type: "currency" },
    eligibleNotional: { label: "Eligible Notional", type: "currency" },
    usedNotional: { label: "Used Notional", type: "currency" },
    secType: { 
      label: "Security Type", 
      type: "select", 
      options: ["Real Estate", "Equipment", "Cash", "Other"] 
    },
    detailedType: { label: "Detailed Type", type: "text" }
  }
};

class ClientTemplateService {
  private static instance: ClientTemplateService;
  
  static getInstance(): ClientTemplateService {
    if (!ClientTemplateService.instance) {
      ClientTemplateService.instance = new ClientTemplateService();
    }
    return ClientTemplateService.instance;
  }

  // Get available client types
  getClientTypes(): { key: string; name: string }[] {
    return Object.entries(CLIENT_CONFIGURATIONS).map(([key, config]) => ({
      key,
      name: config.displayName
    }));
  }

  // Get configuration for a specific client type
  getClientConfiguration(clientType: string): ClientConfiguration | null {
    return CLIENT_CONFIGURATIONS[clientType] || null;
  }

  // Get column definition
  getColumnDefinition(columnKey: string): ColumnDefinition | null {
    return COLUMN_DEFINITIONS[columnKey] || null;
  }

  // Generate template content for a client type (excluding calculated fields)
  generateTemplateContent(clientType: string): { headers: string[]; sampleData: string[] } {
    const config = this.getClientConfiguration(clientType);
    if (!config) {
      throw new Error(`Unknown client type: ${clientType}`);
    }

    // Only include required and optional fields, exclude calculated fields
    const allFields = [
      ...config.requiredFields,
      ...config.optionalFields
    ];

    const headers = allFields.map(field => {
      const colDef = this.getColumnDefinition(field);
      return colDef ? colDef.label : field;
    });

    // Generate sample data
    const sampleData = allFields.map(field => {
      const colDef = this.getColumnDefinition(field);
      if (!colDef) return "";

      switch (colDef.type) {
        case 'select':
          return colDef.options ? colDef.options[0] : "";
        case 'date':
          return "2024-01-01";
        case 'currency':
          return "1000000";
        case 'number':
          return "100";
        case 'percentage':
          return "2.5";
        case 'boolean':
          return "false";
        default:
          return field === 'facilityId' ? 'FAC001' : 
                 field === 'dealId' ? 'DEAL001' : 
                 field === 'dealName' ? 'Sample Deal' :
                 field === 'longNameBorrower' ? 'Sample Borrower Ltd' :
                 field === 'rafBorrower' ? 'RAF001' :
                 'Sample Value';
      }
    });

    return { headers, sampleData };
  }

  // Create dynamic field mapping for import
  createFieldMapping(rawData: Record<string, any>[], clientType: string): Record<string, string> {
    const config = this.getClientConfiguration(clientType);
    if (!config) return {};

    const fileHeaders = Object.keys(rawData[0] || {});
    const mapping: Record<string, string> = {};

    // Create mapping for all fields (required + optional)
    const allFields = [...config.requiredFields, ...config.optionalFields];
    
    allFields.forEach(fieldKey => {
      const colDef = this.getColumnDefinition(fieldKey);
      if (colDef) {
        // Find matching header in file (case-insensitive)
        const matchingHeader = fileHeaders.find(header =>
          header.toLowerCase() === colDef.label.toLowerCase() ||
          header.toLowerCase() === fieldKey.toLowerCase() ||
          // Additional common variations
          this.getFieldVariations(fieldKey).some(variation =>
            header.toLowerCase() === variation.toLowerCase()
          )
        );
        
        if (matchingHeader) {
          mapping[fieldKey] = matchingHeader;
        }
      }
    });

    return mapping;
  }

  // Get common field variations for better matching
  private getFieldVariations(fieldKey: string): string[] {
    const variations: Record<string, string[]> = {
      facilityId: ['facility_id', 'facility id', 'id', 'loan_id', 'loan id'],
      dealId: ['deal_id', 'deal id', 'deal_number', 'deal number'],
      dealName: ['deal_name', 'deal name', 'name', 'loan_name', 'loan name'],
      longNameBorrower: ['borrower', 'borrower_name', 'borrower name', 'client', 'client_name', 'client name'],
      rafBorrower: ['raf', 'raf_borrower', 'raf borrower', 'raf_id', 'raf id'],
      asofDate: ['as_of_date', 'as of date', 'date', 'valuation_date', 'valuation date'],
      facilityDate: ['facility_date', 'facility date', 'start_date', 'start date', 'origination_date'],
      maturity: ['maturity_date', 'maturity date', 'end_date', 'end date', 'expiry_date'],
      currency: ['ccy', 'curr', 'devise'],
      internalRating: ['rating', 'internal_rating', 'internal rating', 'grade'],
      businessLine: ['business_line', 'business line', 'line_of_business', 'lob'],
      loanMarginBps: ['margin', 'loan_margin', 'loan margin', 'spread', 'margin_bps'],
      facilityFeeBps: ['facility_fee', 'facility fee', 'fee', 'commitment_fee'],
      sector: ['industry', 'sector_code', 'industry_sector'],
      zoneGeographique: ['zone', 'geographic_zone', 'geographic zone', 'region', 'country']
    };

    return variations[fieldKey] || [];
  }

  // Parse field value based on type
  parseFieldValue(value: any, fieldKey: string): any {
    const colDef = this.getColumnDefinition(fieldKey);
    if (!colDef) return value;

    if (value === null || value === undefined || value === '') {
      return this.getDefaultValue(fieldKey, colDef.type);
    }

    const stringValue = String(value).trim();
    
    switch (colDef.type) {
      case 'currency':
      case 'number':
        const numValue = parseFloat(stringValue.replace(/[^0-9.-]/g, ''));
        return isNaN(numValue) ? 0 : numValue;
        
      case 'percentage':
        const pctValue = parseFloat(stringValue.replace(/[^0-9.-]/g, ''));
        if (isNaN(pctValue)) return 0;
        // Convert to decimal if value seems to be in percentage format
        return pctValue > 1 ? pctValue / 100 : pctValue;
        
      case 'boolean':
        return stringValue.toLowerCase() === 'true' || stringValue === '1' || stringValue.toLowerCase() === 'yes';
        
      case 'date':
        // Handle various date formats
        const date = new Date(stringValue);
        return isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
        
      case 'select':
        // Validate against options if available
        if (colDef.options && !colDef.options.includes(stringValue)) {
          return colDef.options[0]; // Return first option as default
        }
        return stringValue;
        
      default:
        return stringValue;
    }
  }

  // Get default value for a field type
  private getDefaultValue(fieldKey: string, type: string): any {
    switch (type) {
      case 'currency':
      case 'number':
      case 'percentage':
        return 0;
      case 'boolean':
        return false;
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'select':
        const colDef = this.getColumnDefinition(fieldKey);
        return colDef?.options?.[0] || '';
      default:
        return '';
    }
  }

  // Generate Excel template file
  generateExcelTemplate(clientType: string): Blob {
    const { headers, sampleData } = this.generateTemplateContent(clientType);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      sampleData.join(',')
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  downloadTemplate(clientType: string): void {
    const config = this.getClientConfiguration(clientType);
    if (!config) {
      throw new Error(`Unknown client type: ${clientType}`);
    }

    const { headers, sampleData } = this.generateTemplateContent(clientType);
    
    // Create CSV content with headers and sample data
    const csvContent = [
      headers.join(','),
      sampleData.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan_template_${config.displayName.toLowerCase().replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Generate documentation for a client type
  generateDocumentation(clientType: string): string {
    const config = this.getClientConfiguration(clientType);
    if (!config) return "<p>Unknown client type</p>";

    let doc = `<div class="space-y-4">`;
    doc += `<h3 class="text-lg font-semibold">${config.displayName} Template</h3>`;
    
    // Required fields
    if (config.requiredFields.length > 0) {
      doc += `<div>`;
      doc += `<h4 class="font-medium text-red-600 mb-2">🔴 Required Fields</h4>`;
      doc += `<ul class="list-disc list-inside space-y-1 pl-4">`;
      config.requiredFields.forEach(field => {
        const colDef = this.getColumnDefinition(field);
        if (colDef) {
          doc += `<li><strong>${colDef.label}:</strong> ${colDef.type}`;
          if (colDef.options) {
            doc += ` (${colDef.options.join(', ')})`;
          }
          doc += `</li>`;
        }
      });
      doc += `</ul></div>`;
    }

    // Optional fields
    if (config.optionalFields.length > 0) {
      doc += `<div>`;
      doc += `<h4 class="font-medium text-yellow-600 mb-2">🟡 Optional Fields</h4>`;
      doc += `<ul class="list-disc list-inside space-y-1 pl-4">`;
      config.optionalFields.forEach(field => {
        const colDef = this.getColumnDefinition(field);
        if (colDef) {
          doc += `<li><strong>${colDef.label}:</strong> ${colDef.type}`;
          if (colDef.options) {
            doc += ` (${colDef.options.join(', ')})`;
          }
          doc += `</li>`;
        }
      });
      doc += `</ul></div>`;
    }

    // Note about calculated fields
    if (config.calculatedFields.length > 0) {
      doc += `<div>`;
      doc += `<h4 class="font-medium text-blue-600 mb-2">ℹ️ Note</h4>`;
      doc += `<p class="text-sm text-muted-foreground pl-4">Calculated fields (${config.calculatedFields.length} fields like Total Outstanding, RWA, EVA) are automatically computed and should not be included in import files.</p>`;
      doc += `</div>`;
    }

    doc += `</div>`;
    return doc;
  }
}

export default ClientTemplateService; 
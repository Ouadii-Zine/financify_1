export interface DynamicColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required?: boolean;
  defaultValue?: any;
}

class DynamicColumnsService {
  private static instance: DynamicColumnsService;
  private dynamicColumns: DynamicColumn[] = [];
  private storageKey = 'dynamic-columns';

  static getInstance(): DynamicColumnsService {
    if (!DynamicColumnsService.instance) {
      DynamicColumnsService.instance = new DynamicColumnsService();
    }
    return DynamicColumnsService.instance;
  }

  constructor() {
    this.loadFromLocalStorage();
  }

  // Load dynamic columns from localStorage
  loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.dynamicColumns = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading dynamic columns from localStorage:', error);
      this.dynamicColumns = [];
    }
  }

  // Save dynamic columns to localStorage
  saveToLocalStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.dynamicColumns));
    } catch (error) {
      console.error('Error saving dynamic columns to localStorage:', error);
    }
  }

  // Get all dynamic columns
  getDynamicColumns(): DynamicColumn[] {
    return [...this.dynamicColumns];
  }

  // Add a new dynamic column
  addDynamicColumn(column: DynamicColumn): void {
    // Check if column already exists
    const exists = this.dynamicColumns.some(col => col.key === column.key);
    if (!exists) {
      this.dynamicColumns.push(column);
      this.saveToLocalStorage();
    }
  }

  // Add multiple dynamic columns
  addDynamicColumns(columns: DynamicColumn[]): void {
    let added = false;
    columns.forEach(column => {
      const exists = this.dynamicColumns.some(col => col.key === column.key);
      if (!exists) {
        this.dynamicColumns.push(column);
        added = true;
      }
    });
    
    if (added) {
      this.saveToLocalStorage();
    }
  }

  // Remove a dynamic column
  removeDynamicColumn(key: string): void {
    this.dynamicColumns = this.dynamicColumns.filter(col => col.key !== key);
    this.saveToLocalStorage();
  }

  // Update a dynamic column
  updateDynamicColumn(key: string, updates: Partial<DynamicColumn>): void {
    const index = this.dynamicColumns.findIndex(col => col.key === key);
    if (index !== -1) {
      this.dynamicColumns[index] = { ...this.dynamicColumns[index], ...updates };
      this.saveToLocalStorage();
    }
  }

  // Detect dynamic columns from imported data
  detectDynamicColumns(importedData: Record<string, any>[]): DynamicColumn[] {
    if (!importedData || importedData.length === 0) return [];

    // Standard template columns
    const standardColumns = [
      'ID', 'Nom', 'Client', 'Type', 'Statut', 'Date de début', 'Date de fin',
      'Devise', 'Montant original', 'Encours', 'Montant tiré', 'Montant non tiré',
      'PD', 'LGD', 'EAD', 'Marge', 'Taux de référence', 'Notation interne',
      'Secteur', 'Pays', 'Frais upfront', 'Frais commitment', 'Frais agency', 'Autres frais',
      // English variants
      'id', 'name', 'clientName', 'type', 'status', 'startDate', 'endDate',
      'currency', 'originalAmount', 'outstandingAmount', 'drawnAmount', 'undrawnAmount',
      'pd', 'lgd', 'ead', 'margin', 'referenceRate', 'internalRating',
      'sector', 'country', 'upfrontFee', 'commitmentFee', 'agencyFee', 'otherFee'
    ];

    const detectedColumns: DynamicColumn[] = [];
    const firstRow = importedData[0];

    Object.keys(firstRow).forEach(key => {
      // Skip standard columns
      if (!standardColumns.includes(key)) {
        // Analyze the data type
        const sampleValue = firstRow[key];
        let type: DynamicColumn['type'] = 'text';
        
        if (typeof sampleValue === 'number') {
          type = 'number';
        } else if (typeof sampleValue === 'boolean') {
          type = 'boolean';
        } else if (typeof sampleValue === 'string') {
          // Check if it's a date
          if (Date.parse(sampleValue) && sampleValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            type = 'date';
          }
        }

        detectedColumns.push({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize first letter
          type,
          required: false
        });
      }
    });

    return detectedColumns;
  }

  // Get default values for all dynamic columns
  getDefaultValues(): Record<string, any> {
    const defaults: Record<string, any> = {};
    this.dynamicColumns.forEach(col => {
      defaults[col.key] = col.defaultValue ?? 'N/A';
    });
    return defaults;
  }

  // Validate required dynamic columns
  validateRequiredColumns(additionalDetails: Record<string, any>): string[] {
    const errors: string[] = [];
    
    this.dynamicColumns.forEach(col => {
      if (col.required && (!additionalDetails[col.key] || additionalDetails[col.key] === '')) {
        errors.push(`${col.label} is required`);
      }
    });

    return errors;
  }
}

export default DynamicColumnsService; 
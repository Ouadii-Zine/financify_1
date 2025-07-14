// ExcelTemplateService.ts
import { toast } from "@/hooks/use-toast";
import { Loan, Portfolio, CalculationParameters } from "../types/finance";

// CSV/Excel templates for import
const LOAN_TEMPLATE_CONTENT = `ID,Name,Client,Type,Status,Start Date,End Date,Currency,Original Amount,Outstanding,Drawn Amount,Undrawn Amount,PD,LGD,EAD,Margin,Reference Rate,Internal Rating,Sector,Country,Upfront Fees,Commitment Fees,Agency Fees,Other Fees
1,Tech Expansion Loan,TechCorp Inc.,term,active,2023-01-15,2028-01-15,EUR,10000000,9500000,8000000,1500000,0.0041,0.55,9000000,0.025,0.015,BBB,Technology,France,100000,0.005,20000,15000
2,Retail Expansion Facility,RetailGroup SA,revolver,active,2022-08-20,2026-08-20,EUR,15000000,12000000,9000000,3000000,0.0121,0.60,10800000,0.03,0.015,BB,Retail,Germany,75000,0.0045,25000,10000`;

const CASHFLOW_TEMPLATE_CONTENT = `ID,Date,Type,Amount,Manual,Description
CF001,2023-02-15,drawdown,200000,false,Initial drawdown
CF002,2023-05-15,repayment,50000,false,First repayment
CF003,2023-08-15,interest,6000,false,Q3 interest payment`;

const PARAMETERS_TEMPLATE_CONTENT = `Parameter,Value
targetROE,0.12
corporateTaxRate,0.25
capitalRatio,0.08
fundingCost,0.015
operationalCostRatio,0.005`;

// Report structure
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

// Available report formats
const REPORT_FORMATS: ReportFormat[] = [
  { type: 'excel', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: '.xlsx' },
  { type: 'pdf', mimeType: 'application/pdf', extension: '.pdf' },
  { type: 'csv', mimeType: 'text/csv', extension: '.csv' }
];

// Available report types
const REPORT_TYPES: ReportType[] = [
  {
    name: 'Performance',
    description: 'Detailed portfolio performance analysis',
    formats: REPORT_FORMATS,
    getContent: (portfolio: Portfolio) => {
      // Performance report content
      let content = 'Performance Report\n\n';
      content += `Portfolio: ${portfolio.name}\n`;
      content += `Total Exposure: ${portfolio.metrics.totalExposure}\n`;
      content += `Portfolio ROE: ${(portfolio.metrics.portfolioROE * 100).toFixed(2)}%\n`;
      content += `Portfolio RAROC: ${(portfolio.metrics.portfolioRAROC * 100).toFixed(2)}%\n\n`;
      
      content += 'Loan Details:\n';
      portfolio.loans.forEach(loan => {
        content += `${loan.name}, ROE: ${((loan.metrics?.roe || 0) * 100).toFixed(2)}%, EVA: ${loan.metrics?.evaIntrinsic || 0}\n`;
      });
      
      return content;
    }
  },
  {
    name: 'Risk',
    description: 'Detailed portfolio risk analysis',
    formats: REPORT_FORMATS,
    getContent: (portfolio: Portfolio) => {
      // Risk report content
      let content = 'Risk Report\n\n';
      content += `Portfolio: ${portfolio.name}\n`;
      content += `Total Expected Loss: ${portfolio.metrics.totalExpectedLoss}\n`;
      content += `Average PD: ${(portfolio.metrics.weightedAveragePD * 100).toFixed(2)}%\n`;
      content += `Average LGD: ${(portfolio.metrics.weightedAverageLGD * 100).toFixed(0)}%\n\n`;
      
      content += 'Loan Details:\n';
      portfolio.loans.forEach(loan => {
        content += `${loan.name}, PD: ${(loan.pd * 100).toFixed(2)}%, LGD: ${(loan.lgd * 100).toFixed(0)}%, EL: ${loan.metrics?.expectedLoss || 0}\n`;
      });
      
      return content;
    }
  },
  {
    name: 'Regulatory',
    description: 'Reports compliant with regulatory requirements',
    formats: REPORT_FORMATS,
    getContent: (portfolio: Portfolio) => {
      // Regulatory report content
      let content = 'Regulatory Report\n\n';
      content += `Portfolio: ${portfolio.name}\n`;
      content += `Total RWA: ${portfolio.metrics.totalRWA}\n`;
      content += `RWA Density: ${((portfolio.metrics.totalRWA / portfolio.metrics.totalExposure) * 100).toFixed(0)}%\n\n`;
      
      content += 'Loan Details:\n';
      portfolio.loans.forEach(loan => {
        content += `${loan.name}, RWA: ${loan.metrics?.rwa || 0}, Capital Required: ${loan.metrics?.capitalConsumption || 0}\n`;
      });
      
      return content;
    }
  },
  {
    name: 'Planning',
    description: 'Planning and forecast reports',
    formats: REPORT_FORMATS,
    getContent: (portfolio: Portfolio) => {
      // Planning report content
      let content = 'Planning Report\n\n';
      content += `Portfolio: ${portfolio.name}\n`;
      content += `Total Exposure: ${portfolio.metrics.totalExposure}\n`;
      content += `Forecast ROE: ${(portfolio.metrics.portfolioROE * 1.05 * 100).toFixed(2)}%\n`;
      
      content += '\nCashflow Forecasts:\n';
      portfolio.loans.forEach(loan => {
        content += `${loan.name}, Current Outstanding: ${loan.outstandingAmount}, Forecast Outstanding: ${loan.outstandingAmount * 0.9}\n`;
      });
      
      return content;
    }
  }
];

// Function to download templates - named export for Import.tsx
export const downloadExcelTemplate = (templateType: string): { success: boolean; message: string } => {
  try {
    let content = '';
    let filename = '';
    let mimeType = '';
    
    switch (templateType) {
      case 'loans':
        content = LOAN_TEMPLATE_CONTENT;
        filename = 'loan_template.csv';
        mimeType = 'text/csv';
        break;
      case 'cashflows':
        content = CASHFLOW_TEMPLATE_CONTENT;
        filename = 'cashflow_template.csv';
        mimeType = 'text/csv';
        break;
      case 'parameters':
        content = PARAMETERS_TEMPLATE_CONTENT;
        filename = 'parameters_template.csv';
        mimeType = 'text/csv';
        break;
      case 'documentation':
        content = 'Complete documentation for data import...';
        filename = 'import_guide.txt';
        mimeType = 'text/plain';
        break;
      default:
        return {
          success: false,
          message: "Template type not recognized"
        };
    }
    
    // Create and download file
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
      message: `Template ${filename} has been downloaded successfully.`
    };
  } catch (error) {
    console.error("Error downloading template:", error);
    return {
      success: false,
      message: "An error occurred while downloading the template."
    };
  }
};

// Function to generate documentation - named export for Import.tsx
export const generateTemplateDocumentation = (templateType: string): string => {
  switch (templateType) {
    case 'loans':
      return `<p>CSV file with the following columns:</p>
      <ul class="list-disc list-inside mt-2 pl-2">
        <li><strong>ID:</strong> Unique loan identifier (e.g., L001)</li>
        <li><strong>Name:</strong> Loan name (e.g., Tech Expansion Loan)</li>
        <li><strong>Client:</strong> Client name (e.g., TechCorp Inc.)</li>
        <li><strong>Type:</strong> Loan type (term, revolver, bullet, amortizing)</li>
        <li><strong>Status:</strong> Loan status (active, closed, default, restructured)</li>
        <li><strong>Start/End Date:</strong> YYYY-MM-DD format</li>
        <li><strong>Currency:</strong> Currency code (EUR, USD, GBP, CHF, JPY)</li>
        <li><strong>Amounts:</strong> Numerical amounts in currency</li>
        <li><strong>PD/LGD:</strong> Decimal values (e.g., 0.01 for 1%)</li>
        <li><strong>Margin/Reference Rate:</strong> Decimal values (e.g., 0.025 for 2.5%)</li>
        <li><strong>Internal Rating:</strong> S&P format (AAA, AA+, AA, etc.)</li>
        <li><strong>Sector:</strong> Industry sector</li>
        <li><strong>Country:</strong> Country name</li>
        <li><strong>Fees:</strong> Various fee types (upfront, commitment, agency, other)</li>
      </ul>
      <p class="mt-2"><strong>Important Notes:</strong></p>
      <ul class="list-disc list-inside mt-2 pl-2">
        <li>All rates should be in decimal format (0.05 = 5%)</li>
        <li>Use S&P rating scale for Internal Rating</li>
        <li>Dates must be in YYYY-MM-DD format</li>
        <li>Commitment fees are rates (decimal), other fees are absolute amounts</li>
      </ul>`;
      
    case 'cashflows':
      return `<p>CSV file with the following columns:</p>
      <ul class="list-disc list-inside mt-2 pl-2">
        <li><strong>ID:</strong> Unique cashflow identifier (e.g., CF001)</li>
        <li><strong>Date:</strong> YYYY-MM-DD format (e.g., 2023-02-15)</li>
        <li><strong>Type:</strong> Cashflow type (drawdown, repayment, interest, fee)</li>
        <li><strong>Amount:</strong> Amount in currency</li>
        <li><strong>Manual:</strong> Boolean (true/false) - manually entered cashflow</li>
        <li><strong>Description:</strong> Optional description</li>
      </ul>`;
      
    case 'parameters':
      return `<p>CSV file with calculation parameters:</p>
      <ul class="list-disc list-inside mt-2 pl-2">
        <li><strong>targetROE:</strong> Target return on equity (decimal)</li>
        <li><strong>corporateTaxRate:</strong> Corporate tax rate (decimal)</li>
        <li><strong>capitalRatio:</strong> Capital ratio (decimal)</li>
        <li><strong>fundingCost:</strong> Funding cost rate (decimal)</li>
        <li><strong>operationalCostRatio:</strong> Operational cost ratio (decimal)</li>
      </ul>
      <p class="mt-2">Accepted parameters: targetROE, corporateTaxRate, capitalRatio, fundingCost, operationalCostRatio</p>`;
      
    default:
      return `<p>Template documentation not available for this type.</p>`;
  }
};

// Function to generate reports - named export
export const generateReport = (reportType: string, portfolio: Portfolio, format: string): { success: boolean; content?: string; filename?: string; message: string } => {
    try {
    const report = REPORT_TYPES.find(r => r.name.toLowerCase() === reportType.toLowerCase());
    if (!report) {
      return {
        success: false,
        message: "Report type not found"
      };
    }
    
    const reportFormat = report.formats.find(f => f.type === format);
    if (!reportFormat) {
      return {
        success: false,
        message: "Report format not supported"
      };
    }
    
    const content = report.getContent(portfolio);
    const filename = `${portfolio.name}_${reportType}_${new Date().toISOString().split('T')[0]}${reportFormat.extension}`;
    
    return {
      success: true,
      content,
      filename,
      message: `Report ${filename} generated successfully`
    };
  } catch (error) {
    console.error("Error generating report:", error);
    return {
      success: false,
      message: "An error occurred while generating the report"
    };
  }
};

// Function to validate CSV format
export const validateCSVFormat = (csvContent: string, templateType: string): { success: boolean; errors: string[] } => {
  const errors: string[] = [];
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    errors.push("CSV file must contain at least a header and one data row");
    return { success: false, errors };
  }
  
  const headers = lines[0].split(',').map(h => h.trim());
  
  switch (templateType) {
    case 'loans':
      const requiredLoanHeaders = [
        'ID', 'Name', 'Client', 'Type', 'Status', 'Start Date', 'End Date',
        'Currency', 'Original Amount', 'Outstanding', 'Drawn Amount', 'Undrawn Amount',
        'PD', 'LGD', 'EAD', 'Margin', 'Reference Rate', 'Internal Rating',
        'Sector', 'Country', 'Upfront Fees', 'Commitment Fees', 'Agency Fees', 'Other Fees'
      ];
      
      requiredLoanHeaders.forEach(required => {
        if (!headers.includes(required)) {
          errors.push(`Missing required column: ${required}`);
        }
      });
      break;
      
    case 'cashflows':
      const requiredCashflowHeaders = ['ID', 'Date', 'Type', 'Amount', 'Manual', 'Description'];
      requiredCashflowHeaders.forEach(required => {
        if (!headers.includes(required)) {
          errors.push(`Missing required column: ${required}`);
        }
      });
      break;
      
    case 'parameters':
      const requiredParamHeaders = ['Parameter', 'Value'];
      requiredParamHeaders.forEach(required => {
        if (!headers.includes(required)) {
          errors.push(`Missing required column: ${required}`);
        }
      });
      break;
  }
  
  return {
    success: errors.length === 0,
    errors
  };
};

// Export service class
export default class ExcelTemplateService {
  static downloadTemplate = downloadExcelTemplate;
  static generateDocumentation = generateTemplateDocumentation;
  static generateReport = generateReport;
  static validateCSV = validateCSVFormat;
}

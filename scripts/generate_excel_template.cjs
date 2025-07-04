const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Column definitions for Commercial Bank template
const COLUMNS = [
  // 🔴 MANDATORY COLUMNS (Essential input data)
  { key: 'applicationCode', label: 'Application Code', type: 'select', options: ['LOAN IQ', 'MANUAL', 'OTHER'], required: true },
  { key: 'facilityId', label: 'Facility ID', type: 'text', required: true },
  { key: 'dealId', label: 'Deal ID', type: 'text', required: true },
  { key: 'dealName', label: 'Deal Name', type: 'text', required: true },
  { key: 'asofDate', label: 'As Of Date', type: 'date', required: true },
  { key: 'facilityDate', label: 'Facility Date', type: 'date', required: true },
  { key: 'maturity', label: 'Maturity', type: 'date', required: true },
  { key: 'longNameBorrower', label: 'Long Name Borrower', type: 'text', required: true },
  { key: 'rafBorrower', label: 'RAF Borrower', type: 'text', required: true },
  { key: 'currency', label: 'Currency', type: 'select', options: ['EUR', 'USD', 'GBP', 'CHF'], required: true },
  { key: 'internalRating', label: 'Internal Rating of Borrower', type: 'select', options: ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC'], required: true },
  { key: 'businessLine', label: 'Business Line', type: 'select', options: ['Corporate Financing', 'Trade Finance', 'Project Finance'], required: true },

  // 🟡 OPTIONAL COLUMNS (Depending on institution type)
  { key: 'ufo', label: 'UFO', type: 'text', required: false },
  { key: 'placeOfBooking', label: 'Place of Booking', type: 'text', required: false },
  { key: 'businessUnit', label: 'Business Unit', type: 'text', required: false },
  { key: 'trrRating', label: 'TRR Rating of Borrower', type: 'text', required: false },
  { key: 'watchList', label: 'Watch List', type: 'boolean', required: false },
  { key: 'loanMarginBps', label: 'Loan Margin (bps)', type: 'number', required: false },
  { key: 'facilityFeeBps', label: 'Facility Fee (bps)', type: 'number', required: false },
  { key: 'sector', label: 'Sector', type: 'text', required: false },
  { key: 'zoneGeographique', label: 'Zone Géographique', type: 'text', required: false },

  // 🔵 AUTOMATICALLY CALCULATED COLUMNS (Leave empty - will be calculated)
  { key: 'totalOutstanding', label: 'Total Outstanding', type: 'currency', calculated: true },
  { key: 'drawnOutstanding', label: 'Drawn Outstanding', type: 'currency', calculated: true },
  { key: 'undrawnOutstanding', label: 'Undrawn Outstanding', type: 'currency', calculated: true },
  { key: 'totalRWA', label: 'Total RWA', type: 'currency', calculated: true },
  { key: 'rwaDrawn', label: 'RWA Drawn', type: 'currency', calculated: true },
  { key: 'rwaUndrawn', label: 'RWA Undrawn', type: 'currency', calculated: true },
  { key: 'wal', label: 'WAL (Weighted Average Life)', type: 'number', calculated: true },
  { key: 'pd1Year', label: 'PD 1 Year', type: 'percentage', calculated: true },
  { key: 'breakEvenPrice', label: 'Break Even Price', type: 'percentage', calculated: true },
  { key: 'evaPortage', label: 'EVA Portage', type: 'currency', calculated: true }
];

// Generate sample data
function generateSampleData(columns) {
  const sampleData = {};
  
  columns.forEach(col => {
    if (col.calculated) {
      sampleData[col.label] = ''; // Leave calculated fields empty
    } else {
      switch (col.type) {
        case 'select':
          sampleData[col.label] = col.options ? col.options[0] : '';
          break;
        case 'date':
          sampleData[col.label] = '2024-01-01';
          break;
        case 'currency':
          sampleData[col.label] = 1000000;
          break;
        case 'number':
          sampleData[col.label] = col.key.includes('bps') ? 250 : 100;
          break;
        case 'percentage':
          sampleData[col.label] = 2.5;
          break;
        case 'boolean':
          sampleData[col.label] = false;
          break;
        default:
          // Provide realistic sample values for specific fields
          if (col.key === 'facilityId') sampleData[col.label] = 'FAC001';
          else if (col.key === 'dealId') sampleData[col.label] = 'DEAL001';
          else if (col.key === 'dealName') sampleData[col.label] = 'Sample Corporate Loan';
          else if (col.key === 'longNameBorrower') sampleData[col.label] = 'Sample Borrower Corporation Ltd';
          else if (col.key === 'rafBorrower') sampleData[col.label] = 'RAF001';
          else if (col.key === 'ufo') sampleData[col.label] = 'UFO001';
          else if (col.key === 'placeOfBooking') sampleData[col.label] = 'Paris';
          else if (col.key === 'businessUnit') sampleData[col.label] = 'Corporate Banking';
          else if (col.key === 'trrRating') sampleData[col.label] = 'BB+';
          else if (col.key === 'sector') sampleData[col.label] = 'Technology';
          else if (col.key === 'zoneGeographique') sampleData[col.label] = 'Europe';
          else sampleData[col.label] = 'Sample Value';
      }
    }
  });
  
  return sampleData;
}

// Create Excel workbook
function createExcelTemplate() {
  const workbook = XLSX.utils.book_new();
  
  // Create main loans sheet
  const headers = COLUMNS.map(col => col.label);
  const sampleData = generateSampleData(COLUMNS);
  
  // Create worksheet data
  const worksheetData = [
    headers, // Header row
    Object.values(sampleData) // Sample data row
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set column widths for better readability
  const columnWidths = headers.map(header => ({
    wch: Math.max(header.length + 2, 15)
  }));
  worksheet['!cols'] = columnWidths;
  
  XLSX.utils.book_append_sheet(workbook, worksheet, "Loans Template");
  
  // Create documentation sheet
  const docData = [
    ["Column Name", "Type", "Required", "Description", "Example"],
    ...COLUMNS.map(col => [
      col.label,
      col.type,
      col.required ? "Yes" : col.calculated ? "Auto-calculated" : "No",
      col.options ? `Options: ${col.options.join(', ')}` : `${col.type} field`,
      col.calculated ? "Leave empty" : generateSampleData([col])[col.label]
    ])
  ];
  
  const docWorksheet = XLSX.utils.aoa_to_sheet(docData);
  docWorksheet['!cols'] = [
    { wch: 25 }, // Column Name
    { wch: 15 }, // Type
    { wch: 15 }, // Required
    { wch: 35 }, // Description
    { wch: 20 }  // Example
  ];
  
  XLSX.utils.book_append_sheet(workbook, docWorksheet, "Documentation");
  
  return workbook;
}

// Main execution
function main() {
  console.log('🚀 Generating Commercial Bank Loan Template...');
  
  const workbook = createExcelTemplate();
  const outputPath = path.join(__dirname, '..', 'public', 'commercial_bank_loan_template.xlsx');
  
  // Ensure public directory exists
  const publicDir = path.dirname(outputPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Write the file
  XLSX.writeFile(workbook, outputPath);
  
  console.log('✅ Template generated successfully!');
  console.log(`📁 File saved to: ${outputPath}`);
  console.log('📊 Template includes:');
  console.log(`   - ${COLUMNS.filter(c => c.required).length} required fields (red headers)`);
  console.log(`   - ${COLUMNS.filter(c => !c.required && !c.calculated).length} optional fields (orange headers)`);
  console.log(`   - ${COLUMNS.filter(c => c.calculated).length} calculated fields (blue headers)`);
  console.log('   - Documentation sheet with field descriptions');
  console.log('');
  console.log('🎯 Ready to use for Commercial Bank loan imports!');
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { createExcelTemplate, COLUMNS }; 
// lib/import/excel-import.ts
// Placeholder for Excel import functionality
// In a real implementation, this would use a library like xlsx to parse Excel files

import * as XLSX from 'xlsx';

/**
 * Parse Excel file and return JSON data
 * @param file File object (from input[type="file"])
 * @returns Promise resolving to parsed data or null if error
 */
export async function parseExcelFile(file: File): Promise<any[][] | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return null;
    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) return null;
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    return jsonData;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    return null;
  }
}

/**
 * Auto-detect column mapping based on headers
 * @param headers Array of header strings from Excel file
 * @returns Object mapping standard field names to detected column indices
 */
export function autoDetectColumns(headers: string[]): Record<string, number | null> {
  const lowerHeaders = headers.map(h => h.toString().toLowerCase().trim());

  const mapping: Record<string, number | null> = {
    // Customer/Ledger fields
    customer_name: null,
    party_name: null,
    name: null,
    ledger_name: null,

    // Contact fields
    mobile: null,
    phone: null,
    telephone: null,

    // Identification
    gstin: null,
    gst: null,
    pan: null,

    // Financial
    opening_balance: null,
    opening: null,
    balance: null,
    credit_limit: null,
    credit: null,

    // Address
    address: null,
    addr: null,

    // Inventory specific
    item_name: null,
    description: null,
    design_no: null,
    design: null,
    color: null,
    category: null,
    hsn_code: null,
    hsn: null,
    purchase_rate: null,
    sale_rate: null,
    gst_percent: null,
    gst_rate: null,
    rack_location: null,
    reorder_level: null,
    stock_quantity: null,
    quantity: null,
  };

  // Try to map each standard field to a header
  Object.keys(mapping).forEach(field => {
    // Direct match
    const directIndex = lowerHeaders.indexOf(field);
    if (directIndex !== -1) {
      mapping[field] = directIndex;
      return;
    }

    // Try common variations
    switch (field) {
      case 'customer_name':
        if (lowerHeaders.includes('customer name')) mapping[field] = lowerHeaders.indexOf('customer name');
        else if (lowerHeaders.includes('customer_name')) mapping[field] = lowerHeaders.indexOf('customer_name');
        else if (lowerHeaders.includes('name')) mapping[field] = lowerHeaders.indexOf('name');
        break;

      case 'party_name':
        if (lowerHeaders.includes('party name')) mapping[field] = lowerHeaders.indexOf('party name');
        else if (lowerHeaders.includes('party_name')) mapping[field] = lowerHeaders.indexOf('party_name');
        break;

      case 'mobile':
        if (lowerHeaders.includes('mobile')) mapping[field] = lowerHeaders.indexOf('mobile');
        else if (lowerHeaders.includes('mobile no')) mapping[field] = lowerHeaders.indexOf('mobile no');
        else if (lowerHeaders.includes('mobile number')) mapping[field] = lowerHeaders.indexOf('mobile number');
        else if (lowerHeaders.includes('phone')) mapping[field] = lowerHeaders.indexOf('phone');
        break;

      case 'gstin':
        if (lowerHeaders.includes('gstin')) mapping[field] = lowerHeaders.indexOf('gstin');
        else if (lowerHeaders.includes('gst no')) mapping[field] = lowerHeaders.indexOf('gst no');
        else if (lowerHeaders.includes('gst number')) mapping[field] = lowerHeaders.indexOf('gst number');
        else if (lowerHeaders.includes('gst')) mapping[field] = lowerHeaders.indexOf('gst');
        break;

      case 'opening_balance':
        if (lowerHeaders.includes('opening balance')) mapping[field] = lowerHeaders.indexOf('opening balance');
        else if (lowerHeaders.includes('opening')) mapping[field] = lowerHeaders.indexOf('opening');
        else if (lowerHeaders.includes('opening bal')) mapping[field] = lowerHeaders.indexOf('opening bal');
        break;

      case 'credit_limit':
        if (lowerHeaders.includes('credit limit')) mapping[field] = lowerHeaders.indexOf('credit limit');
        else if (lowerHeaders.includes('credit')) mapping[field] = lowerHeaders.indexOf('credit');
        else if (lowerHeaders.includes('credit limit amt')) mapping[field] = lowerHeaders.indexOf('credit limit amt');
        break;

      case 'item_name':
        if (lowerHeaders.includes('item name')) mapping[field] = lowerHeaders.indexOf('item name');
        else if (lowerHeaders.includes('description')) mapping[field] = lowerHeaders.indexOf('description');
        else if (lowerHeaders.includes('item')) mapping[field] = lowerHeaders.indexOf('item');
        break;

      case 'design_no':
        if (lowerHeaders.includes('design no')) mapping[field] = lowerHeaders.indexOf('design no');
        else if (lowerHeaders.includes('design_no')) mapping[field] = lowerHeaders.indexOf('design_no');
        else if (lowerHeaders.includes('design number')) mapping[field] = lowerHeaders.indexOf('design number');
        else if (lowerHeaders.includes('design')) mapping[field] = lowerHeaders.indexOf('design');
        break;

      case 'hsn_code':
        if (lowerHeaders.includes('hsn code')) mapping[field] = lowerHeaders.indexOf('hsn code');
        else if (lowerHeaders.includes('hsn')) mapping[field] = lowerHeaders.indexOf('hsn');
        else if (lowerHeaders.includes('hsn_code')) mapping[field] = lowerHeaders.indexOf('hsn_code');
        break;

      case 'purchase_rate':
        if (lowerHeaders.includes('purchase rate')) mapping[field] = lowerHeaders.indexOf('purchase rate');
        else if (lowerHeaders.includes('purchase_price')) mapping[field] = lowerHeaders.indexOf('purchase_price');
        else if (lowerHeaders.includes('cost')) mapping[field] = lowerHeaders.indexOf('cost');
        break;

      case 'sale_rate':
        if (lowerHeaders.includes('sale rate')) mapping[field] = lowerHeaders.indexOf('sale rate');
        else if (lowerHeaders.includes('selling_price')) mapping[field] = lowerHeaders.indexOf('selling_price');
        else if (lowerHeaders.includes('sale_price')) mapping[field] = lowerHeaders.indexOf('sale_price');
        else if (lowerHeaders.includes('mrp')) mapping[field] = lowerHeaders.indexOf('mrp');
        break;

      case 'gst_percent':
        if (lowerHeaders.includes('gst %')) mapping[field] = lowerHeaders.indexOf('gst %');
        else if (lowerHeaders.includes('gst percent')) mapping[field] = lowerHeaders.indexOf('gst percent');
        else if (lowerHeaders.includes('gst rate')) mapping[field] = lowerHeaders.indexOf('gst rate');
        else if (lowerHeaders.includes('tax %')) mapping[field] = lowerHeaders.indexOf('tax %');
        break;

      case 'rack_location':
        if (lowerHeaders.includes('rack location')) mapping[field] = lowerHeaders.indexOf('rack location');
        else if (lowerHeaders.includes('rack')) mapping[field] = lowerHeaders.indexOf('rack');
        else if (lowerHeaders.includes('location')) mapping[field] = lowerHeaders.indexOf('location');
        else if (lowerHeaders.includes('bin')) mapping[field] = lowerHeaders.indexOf('bin');
        break;

      case 'reorder_level':
        if (lowerHeaders.includes('reorder level')) mapping[field] = lowerHeaders.indexOf('reorder level');
        else if (lowerHeaders.includes('reorder')) mapping[field] = lowerHeaders.indexOf('reorder');
        else if (lowerHeaders.includes('min stock')) mapping[field] = lowerHeaders.indexOf('min stock');
        break;

      case 'stock_quantity':
        if (lowerHeaders.includes('stock quantity')) mapping[field] = lowerHeaders.indexOf('stock quantity');
        else if (lowerHeaders.includes('quantity')) mapping[field] = lowerHeaders.indexOf('quantity');
        else if (lowerHeaders.includes('stock')) mapping[field] = lowerHeaders.indexOf('stock');
        else if (lowerHeaders.includes('opening stock')) mapping[field] = lowerHeaders.indexOf('opening stock');
        break;

      default:
        // No additional logic needed
    }
  });

  return mapping;
}

/**
 * Validate GSTIN format (basic check)
 * @param gstin GSTIN string to validate
 * @returns Boolean indicating if GSTIN appears valid
 */
export function validateGSTIN(gstin: string): boolean {
  // Basic GSTIN format: 2 digits state code + 5 chars PAN + 4 chars entity + 1 checksum + 'Z' + 1 checksum
  // This is a simplified check - real validation is more complex
  if (!gstin || gstin.length !== 15) return false;

  // Check if first 2 chars are digits, next 10 are alphanumeric, etc.
  const stateCode = gstin.substring(0, 2);
  const panPart = gstin.substring(2, 12);
  const entityCode = gstin.substring(12, 13);
  const checksum1 = gstin.substring(13, 14);
  const zChar = gstin.substring(14, 15);
  const checksum2 = gstin.substring(15, 16); // Actually GSTIN is 15 chars, so this will be empty

  // GSTIN is 15 characters: 2(state) + 10(PAN) + 2(entity) + 1(checksum) + 'Z' + 1(checksum) = 17? Actually standard is 15
  // Let's do a basic regex check
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
}

/**
 * Process parsed Excel data into ledger/inventory objects
 * @param data 2D array from Excel parsing
 * @param columnMapping Mapping from autoDetectColumns
 * @param type 'ledger' or 'inventory'
 * @returns Array of objects ready for database insertion
 */
export function processExcelData(
  data: any[][],
  columnMapping: Record<string, number | null>,
  type: 'ledger' | 'inventory'
): any[] {
  if (!data || data.length < 2) return []; // Need at least header and one data row

  const headers = data[0];
  const rows = data.slice(1);
  const results: any[] = [];

  rows.forEach(row => {
    const item: any = {};

    // Map each field based on column mapping
    Object.keys(columnMapping).forEach(field => {
      const colIndex = columnMapping[field];
      if (colIndex !== null && colIndex !== undefined && colIndex < row.length) {
        const value = row[colIndex];
        // Convert empty strings to null for optional fields
        if (value === '' || value === null) {
          item[field] = null;
        } else {
          item[field] = value;
        }
      }
    });

    // Add type-specific defaults
    if (type === 'ledger') {
      // Set defaults for ledgers
      if (!item.group) {
        // Try to infer group from name or other fields
        const name = (item.name || item.party_name || item.customer_name || '').toLowerCase();
        if (name.includes('cash')) item.group = 'cash';
        else if (name.includes('bank')) item.group = 'bank';
        else if (name.includes('debtor') || name.includes('customer')) item.group = 'sundry_debtors';
        else if (name.includes('creditor') || name.includes('supplier')) item.group = 'sundry_creditors';
        else item.group = 'sundry_debtors'; // Default
      }

      if (item.balanceType === null) {
        // Set based on group
        if (item.group === 'sundry_creditors' || item.group === 'bank' || item.group === 'capital') {
          item.balanceType = 'cr';
        } else {
          item.balanceType = 'dr';
        }
      }

      // Set numeric defaults
      if (item.openingBalance === null) item.openingBalance = 0;
      if (item.creditLimit === null) item.creditLimit = 0;
    } else if (type === 'inventory') {
      // Set defaults for inventory
      if (item.purchaseRate === null) item.purchaseRate = 0;
      if (item.saleRate === null) item.saleRate = 0;
      if (item.gstPercent === null) item.gstPercent = 5;
      if (item.reorderLevel === null) item.reorderLevel = 10;
      if (item.stockQuantity === null) item.stockQuantity = 0;
      if (item.unit === null) item.unit = 'pcs';
    }

    results.push(item);
  });

  return results;
}

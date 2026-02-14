import xlsx from 'xlsx';
import { OrderRow } from '../types';

export interface ParseResult {
    validOrders: OrderRow[];
    errors: ParseError[];
}

export interface ParseError {
    row: number;
    externalId: string;
    message: string;
}

export const parseExcelFile = (filePath: string): ParseResult => {
    try {
        console.log("Reading file:", filePath);

        // Read excel file
        const workbook = xlsx.readFile(filePath);

        // Take first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to json
        const rawData: any[] = xlsx.utils.sheet_to_json(worksheet);

        console.log(`Parsed ${rawData.length} rows`);

        //Validation data
        const validOrders: OrderRow[] = [];
        const errors: ParseError[] = [];

        rawData.forEach((row, index) => {
            const rowNumber = index + 2;

            const externalId = String(row['External ID'] || row['external_id'] || '').trim();
            const sku = String(row['SKU'] || row['sku'] || '').trim();
            const productName = String(row['Product Name'] || row['product_name'] || '').trim();
            const quantityRaw = row['Quantity'] || row['quantity'] || '1';
            const quantity = parseInt(String(quantityRaw));

            // Checking required fields
            let hasError = false;
            const rowErrors: string[] = [];

            // SKU empty
            if (!sku) {
                rowErrors.push('The product SKU is missing');
                hasError = true;
            }

            // product name is empty
            if (!productName) {
                rowErrors.push('The product name is missing');
                hasError = true;
            }

            // Quantity is not valid
            if (isNaN(quantity) || quantity <= 0) {
                rowErrors.push(`Quantity is not valid (${quantityRaw})`);
                hasError = true;
            }

            // If there are errors, add them to the list of errors.
            if (hasError) {
                errors.push({
                    row: rowNumber,
                    externalId: externalId || 'Unnoun order',
                    message: rowErrors.join(', ')
                });

                console.log(`String ${rowNumber} (${externalId}): ${rowErrors.join(', ')}`);
                return; // Skip this line
            }

            validOrders.push({
                // Info about order
                externalId: externalId,
                orderName: String(row['Order Name'] || row['order_name'] || ''),
                shippingAddress: String(row['Shipping Address'] || row['shipping_address'] || ''),
                shippingPhone: String(row['Shipping Phone'] || row['shipping_phone'] || ''),
                shippingCity: row['Shipping City'] || row['shipping_city'] || null,
                customerName: row['Customer Name'] || row['customer_name'] || null,
                orderDate: parseDate(row['Date'] || row['date']),

                // Info about goods
                sku: sku,
                barcode: row['Barcode'] || row['barcode'] || null,
                productName: productName,
                quantity: quantity,

                // Alailable
                inventory: row['Inventory'] || row['inventory'] || null,
                location: row['Location'] || row['location'] || null,
            });

        });

        console.log(`Valid orders: ${validOrders.length}`);
        console.log(`Errors: ${errors.length}`);

        return {
            validOrders,
            errors
        };

    } catch (error) {
        console.error('Parse error:', error);
        throw new Error('Unable to read Excel file');
    }
};

// Helper function for parsing dates
const parseDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();

    // If already Date
    if (dateValue instanceof Date) {
        return dateValue;
    }

    // If string
    if (typeof dateValue === 'string') {
        return new Date(dateValue);
    }

    // If Excel serial number
    if (typeof dateValue === 'number') {
        // Excel dates start from 1900-01-01
        const excelEpoch = new Date(1900, 0, 1);
        const days = dateValue - 2; // Excel bug: treats 1900 as leap year
        return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    }

    return new Date();
};
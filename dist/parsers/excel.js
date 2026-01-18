import { readFile } from 'fs/promises';
import * as XLSX from 'xlsx';
/**
 * List all sheet names in an Excel file
 */
export async function listExcelSheets(filePath) {
    try {
        const buffer = await readFile(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        return workbook.SheetNames;
    }
    catch (error) {
        throw new Error(`Failed to list Excel sheets: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Read a specific sheet from an Excel file
 */
export async function readExcelSheet(filePath, sheetName) {
    try {
        const buffer = await readFile(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        if (!workbook.SheetNames.includes(sheetName)) {
            throw new Error(`Sheet "${sheetName}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
        }
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        return data;
    }
    catch (error) {
        throw new Error(`Failed to read Excel sheet: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Read a specific sheet and return as formatted string
 */
export async function readExcelSheetAsString(filePath, sheetName) {
    const data = await readExcelSheet(filePath, sheetName);
    return JSON.stringify(data, null, 2);
}
/**
 * Read all sheets from an Excel file
 */
export async function readExcelFile(filePath) {
    try {
        const buffer = await readFile(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const result = {};
        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            result[sheetName] = XLSX.utils.sheet_to_json(worksheet);
        }
        return result;
    }
    catch (error) {
        throw new Error(`Failed to read Excel file: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Read all sheets and return as formatted string
 */
export async function readExcelFileAsString(filePath) {
    const data = await readExcelFile(filePath);
    return JSON.stringify(data, null, 2);
}
//# sourceMappingURL=excel.js.map
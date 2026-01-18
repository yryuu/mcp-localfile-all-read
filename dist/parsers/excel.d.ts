/**
 * List all sheet names in an Excel file
 */
export declare function listExcelSheets(filePath: string): Promise<string[]>;
/**
 * Read a specific sheet from an Excel file
 */
export declare function readExcelSheet(filePath: string, sheetName: string): Promise<any[]>;
/**
 * Read a specific sheet and return as formatted string
 */
export declare function readExcelSheetAsString(filePath: string, sheetName: string): Promise<string>;
/**
 * Read all sheets from an Excel file
 */
export declare function readExcelFile(filePath: string): Promise<Record<string, any[]>>;
/**
 * Read all sheets and return as formatted string
 */
export declare function readExcelFileAsString(filePath: string): Promise<string>;
//# sourceMappingURL=excel.d.ts.map
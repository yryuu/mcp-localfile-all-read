/**
 * Extract text content from a PDF file
 */
export declare function parsePDF(filePath: string): Promise<string>;
/**
 * Get PDF metadata and page count
 */
export declare function getPDFInfo(filePath: string): Promise<{
    pages: number;
    info: any;
}>;
//# sourceMappingURL=pdf.d.ts.map
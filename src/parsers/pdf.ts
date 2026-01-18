import { readFile } from 'fs/promises';
import pdfParse from 'pdf-parse';

/**
 * Extract text content from a PDF file
 */
export async function parsePDF(filePath: string): Promise<string> {
    try {
        const dataBuffer = await readFile(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Get PDF metadata and page count
 */
export async function getPDFInfo(filePath: string): Promise<{
    pages: number;
    info: any;
}> {
    try {
        const dataBuffer = await readFile(filePath);
        const data = await pdfParse(dataBuffer);
        return {
            pages: data.numpages,
            info: data.info
        };
    } catch (error) {
        throw new Error(`Failed to get PDF info: ${error instanceof Error ? error.message : String(error)}`);
    }
}

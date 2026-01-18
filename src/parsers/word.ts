import { readFile } from 'fs/promises';
import mammoth from 'mammoth';

/**
 * Extract text from a Word document (.docx)
 */
export async function parseWord(filePath: string): Promise<string> {
    try {
        const buffer = await readFile(filePath);
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } catch (error) {
        throw new Error(`Failed to parse Word document: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Extract text with HTML formatting from a Word document
 */
export async function parseWordWithFormatting(filePath: string): Promise<string> {
    try {
        const buffer = await readFile(filePath);
        const result = await mammoth.convertToHtml({ buffer });
        return result.value;
    } catch (error) {
        throw new Error(`Failed to parse Word document with formatting: ${error instanceof Error ? error.message : String(error)}`);
    }
}

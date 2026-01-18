import { readFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { detectEncoding } from './encoding.js';

/**
 * Parse CSV file with automatic encoding detection
 */
export async function parseCSV(filePath: string): Promise<any[]> {
    try {
        const encoding = await detectEncoding(filePath);
        const buffer = await readFile(filePath);

        let content: string;
        if (encoding.toLowerCase().includes('shift_jis') || encoding.toLowerCase().includes('shift-jis')) {
            const decoder = new TextDecoder('shift-jis');
            content = decoder.decode(buffer);
        } else {
            content = buffer.toString('utf-8');
        }

        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true
        });

        return records;
    } catch (error) {
        throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Parse CSV and return as formatted string
 */
export async function parseCSVAsString(filePath: string): Promise<string> {
    const records = await parseCSV(filePath);
    return JSON.stringify(records, null, 2);
}

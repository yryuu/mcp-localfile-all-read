import { readdir, stat } from 'fs/promises';
import { join, relative, extname } from 'path';
import { readFileWithEncoding } from '../parsers/encoding.js';
import { parsePDF } from '../parsers/pdf.js';
import { parseCSVAsString } from '../parsers/csv.js';
import { parseWord } from '../parsers/word.js';
import { parsePowerPoint } from '../parsers/powerpoint.js';
import { readExcelFileAsString } from '../parsers/excel.js';
/**
 * List directory contents
 */
export async function listDirectory(dirPath, rootPath) {
    try {
        const entries = await readdir(dirPath);
        const fileInfos = [];
        for (const entry of entries) {
            const fullPath = join(dirPath, entry);
            const stats = await stat(fullPath);
            const relativePath = relative(rootPath, fullPath);
            fileInfos.push({
                name: entry,
                path: relativePath,
                type: stats.isDirectory() ? 'directory' : 'file',
                size: stats.isFile() ? stats.size : undefined,
                modified: stats.mtime
            });
        }
        return fileInfos;
    }
    catch (error) {
        throw new Error(`Failed to list directory: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Get file information
 */
export async function getFileInfo(filePath, rootPath) {
    try {
        const stats = await stat(filePath);
        const relativePath = relative(rootPath, filePath);
        const name = filePath.split('/').pop() || filePath;
        return {
            name,
            path: relativePath,
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.isFile() ? stats.size : undefined,
            modified: stats.mtime
        };
    }
    catch (error) {
        throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Read file content with automatic format detection
 */
export async function readFileContent(filePath) {
    try {
        const ext = extname(filePath).toLowerCase();
        switch (ext) {
            case '.pdf':
                return await parsePDF(filePath);
            case '.csv':
                return await parseCSVAsString(filePath);
            case '.docx':
                return await parseWord(filePath);
            case '.pptx':
                return await parsePowerPoint(filePath);
            case '.xlsx':
            case '.xls':
                return await readExcelFileAsString(filePath);
            case '.txt':
            case '.md':
            case '.json':
            case '.xml':
            case '.html':
            case '.css':
            case '.js':
            case '.ts':
            case '.py':
            case '.java':
            case '.c':
            case '.cpp':
            case '.h':
            case '.sh':
            case '.yaml':
            case '.yml':
                return await readFileWithEncoding(filePath);
            default:
                // Try to read as text with encoding detection
                try {
                    return await readFileWithEncoding(filePath);
                }
                catch {
                    throw new Error(`Unsupported file type: ${ext}`);
                }
        }
    }
    catch (error) {
        throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    }
}
//# sourceMappingURL=filesystem.js.map
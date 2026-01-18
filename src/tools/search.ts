import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import { readFileWithEncoding } from '../parsers/encoding.js';

export interface SearchResult {
    file: string;
    line: number;
    content: string;
    match: string;
}

/**
 * Search for files matching a pattern
 * Returns list of matching file paths
 */
export async function searchFiles(
    dirPath: string,
    pattern: string | RegExp,
    options: {
        rootPath: string;
        filePattern?: string;
        recursive?: boolean;
        caseSensitive?: boolean;
        maxResults?: number;
    }
): Promise<string[]> {
    const matchedFiles = new Set<string>();
    const maxResults = options.maxResults || 1000; // Default limit: 1000 files
    const regex = typeof pattern === 'string'
        ? new RegExp(pattern, options.caseSensitive ? 'g' : 'gi')
        : pattern;

    async function searchInDirectory(currentPath: string) {
        try {
            const entries = await readdir(currentPath);

            for (const entry of entries) {
                // Early exit if we've found enough files
                if (matchedFiles.size >= maxResults) {
                    return;
                }

                // Skip common directories that should be ignored
                if (entry === 'node_modules' || entry === '.git' || entry === 'dist' || entry === 'build') {
                    continue;
                }

                const fullPath = join(currentPath, entry);
                const stats = await stat(fullPath);

                if (stats.isDirectory()) {
                    if (options.recursive !== false) {
                        await searchInDirectory(fullPath);
                    }
                } else if (stats.isFile()) {
                    // Skip very large files (>10MB) to avoid performance issues
                    if (stats.size > 10 * 1024 * 1024) {
                        continue;
                    }

                    // Check if file matches file pattern
                    if (options.filePattern) {
                        const fileRegex = new RegExp(options.filePattern);
                        if (!fileRegex.test(entry)) {
                            continue;
                        }
                    }

                    // Skip common binary file extensions
                    const binaryExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.pdf',
                        '.zip', '.tar', '.gz', '.exe', '.dll', '.so', '.dylib',
                        '.mp3', '.mp4', '.avi', '.mov', '.wav'];
                    const ext = entry.toLowerCase();
                    if (binaryExtensions.some(binExt => ext.endsWith(binExt))) {
                        continue;
                    }

                    // Search in file content
                    try {
                        const content = await readFileWithEncoding(fullPath);

                        // Check if pattern exists in file - using RegExp.test() is faster
                        // because it stops at first match
                        if (regex.test(content)) {
                            const relativePath = relative(options.rootPath, fullPath);
                            matchedFiles.add(relativePath);
                        }
                    } catch {
                        // Skip files that can't be read as text
                    }
                }
            }
        } catch (error) {
            // Skip directories we can't access
        }
    }

    await searchInDirectory(dirPath);
    return Array.from(matchedFiles);
}

/**
 * Find files by name pattern
 */
export async function findFiles(
    dirPath: string,
    namePattern: string | RegExp,
    options: {
        rootPath: string;
        recursive?: boolean;
        caseSensitive?: boolean;
    }
): Promise<string[]> {
    const results: string[] = [];
    const regex = typeof namePattern === 'string'
        ? new RegExp(namePattern, options.caseSensitive ? '' : 'i')
        : namePattern;

    async function searchInDirectory(currentPath: string) {
        try {
            const entries = await readdir(currentPath);

            for (const entry of entries) {
                const fullPath = join(currentPath, entry);
                const stats = await stat(fullPath);

                if (stats.isDirectory()) {
                    if (options.recursive !== false) {
                        await searchInDirectory(fullPath);
                    }
                } else if (stats.isFile()) {
                    if (regex.test(entry)) {
                        const relativePath = relative(options.rootPath, fullPath);
                        results.push(relativePath);
                    }
                }
            }
        } catch {
            // Skip directories we can't access
        }
    }

    await searchInDirectory(dirPath);
    return results;
}

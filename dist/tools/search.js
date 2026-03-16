import { readdir, stat, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { readFileWithEncoding } from '../parsers/encoding.js';
import ignore from 'ignore';
async function getIgnorer(rootPath) {
    const ig = ignore();
    // Default ignores for performance
    ig.add(['.git', 'node_modules', 'dist', 'build']);
    try {
        const gitignoreContent = await readFile(join(rootPath, '.gitignore'), 'utf8');
        ig.add(gitignoreContent);
    }
    catch {
        // .gitignore not found or unreadable, proceed with defaults
    }
    return ig;
}
/**
 * Search for files matching a pattern
 * Returns list of matching file paths
 */
export async function searchFiles(dirPath, pattern, options) {
    const matchedFiles = new Set();
    const maxResults = options.maxResults || 1000; // Default limit: 1000 files
    const regex = typeof pattern === 'string'
        ? new RegExp(pattern, options.caseSensitive ? 'g' : 'gi')
        : pattern;
    const ig = await getIgnorer(options.rootPath);
    async function searchInDirectory(currentPath) {
        try {
            const entries = await readdir(currentPath);
            for (const entry of entries) {
                if (matchedFiles.size >= maxResults) {
                    return;
                }
                const fullPath = join(currentPath, entry);
                const relPath = relative(options.rootPath, fullPath);
                // Skip ignored paths
                if (ig.ignores(relPath)) {
                    continue;
                }
                const stats = await stat(fullPath);
                if (stats.isDirectory()) {
                    if (options.recursive !== false) {
                        await searchInDirectory(fullPath);
                    }
                }
                else if (stats.isFile()) {
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
                    }
                    catch {
                        // Skip files that can't be read as text
                    }
                }
            }
        }
        catch (error) {
            // Skip directories we can't access
        }
    }
    await searchInDirectory(dirPath);
    return Array.from(matchedFiles);
}
/**
 * Find files by name pattern
 */
export async function findFiles(dirPath, namePattern, options) {
    const results = [];
    const regex = typeof namePattern === 'string'
        ? new RegExp(namePattern, options.caseSensitive ? '' : 'i')
        : namePattern;
    const ig = await getIgnorer(options.rootPath);
    async function searchInDirectory(currentPath) {
        try {
            const entries = await readdir(currentPath);
            for (const entry of entries) {
                const fullPath = join(currentPath, entry);
                const relPath = relative(options.rootPath, fullPath);
                // Skip ignored paths
                if (ig.ignores(relPath)) {
                    continue;
                }
                const stats = await stat(fullPath);
                if (stats.isDirectory()) {
                    if (options.recursive !== false) {
                        await searchInDirectory(fullPath);
                    }
                }
                else if (stats.isFile()) {
                    if (regex.test(entry)) {
                        const relativePath = relative(options.rootPath, fullPath);
                        results.push(relativePath);
                    }
                }
            }
        }
        catch {
            // Skip directories we can't access
        }
    }
    await searchInDirectory(dirPath);
    return results;
}
//# sourceMappingURL=search.js.map
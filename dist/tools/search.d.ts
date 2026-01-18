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
export declare function searchFiles(dirPath: string, pattern: string | RegExp, options: {
    rootPath: string;
    filePattern?: string;
    recursive?: boolean;
    caseSensitive?: boolean;
    maxResults?: number;
}): Promise<string[]>;
/**
 * Find files by name pattern
 */
export declare function findFiles(dirPath: string, namePattern: string | RegExp, options: {
    rootPath: string;
    recursive?: boolean;
    caseSensitive?: boolean;
}): Promise<string[]>;
//# sourceMappingURL=search.d.ts.map
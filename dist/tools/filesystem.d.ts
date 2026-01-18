export interface FileInfo {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size?: number;
    modified?: Date;
}
/**
 * List directory contents
 */
export declare function listDirectory(dirPath: string, rootPath: string): Promise<FileInfo[]>;
/**
 * Get file information
 */
export declare function getFileInfo(filePath: string, rootPath: string): Promise<FileInfo>;
/**
 * Read file content with automatic format detection
 */
export declare function readFileContent(filePath: string): Promise<string>;
//# sourceMappingURL=filesystem.d.ts.map
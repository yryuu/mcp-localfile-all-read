#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { join, resolve, isAbsolute } from 'path';
import { listDirectory, getFileInfo, readFileContent } from './tools/filesystem.js';
import { searchFiles, findFiles } from './tools/search.js';
import { listExcelSheets, readExcelSheetAsString } from './parsers/excel.js';

// Get root path from environment variable or use current directory
const ROOT_PATH = process.env.MCP_ROOT_PATH || process.cwd();

// Validate and resolve root path
const rootPath = resolve(ROOT_PATH);

console.error(`MCP File Reader Server starting with root path: ${rootPath}`);

// Create server instance
const server = new Server(
    {
        name: 'mcp-localfile-reader',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Define available tools
const tools: Tool[] = [
    {
        name: 'list_directory',
        description: 'List contents of a directory. Returns file and directory information including names, types, sizes, and modification dates.',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Relative path from root directory. Use "." for root directory.',
                },
            },
            required: ['path'],
        },
    },
    {
        name: 'read_file',
        description: 'Read file content with automatic format detection. Supports text files, PDF, Excel, Word, PowerPoint, and CSV with automatic encoding detection (Shift-JIS/UTF-8).',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Relative path to the file from root directory.',
                },
            },
            required: ['path'],
        },
    },
    {
        name: 'get_file_info',
        description: 'Get metadata about a file or directory including size, type, and modification date.',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Relative path to the file or directory from root directory.',
                },
            },
            required: ['path'],
        },
    },
    {
        name: 'search_content',
        description: 'Search for text pattern in files (grep-like functionality). Returns list of unique file paths containing the pattern. Recursively searches all subdirectories by default. Automatically skips node_modules, .git, dist, build directories and binary files for performance.',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Relative path to search in. Use "." for root directory.',
                },
                pattern: {
                    type: 'string',
                    description: 'Text pattern or regex to search for.',
                },
                file_pattern: {
                    type: 'string',
                    description: 'Optional: Regex pattern to filter files by name. IMPORTANT: Use regex syntax, not glob. Examples: ".*\\.txt$" for .txt files, ".*\\.xlsx?$" for Excel files, ".*\\.(js|ts)$" for JS/TS files. To search ALL files, OMIT this parameter entirely (do not use "*" or ".*").',
                },
                case_sensitive: {
                    type: 'boolean',
                    description: 'Whether search should be case sensitive. Default: false.',
                },
                max_results: {
                    type: 'number',
                    description: 'Optional: Maximum number of results to return. Default: 1000. Use lower values for faster searches in large codebases.',
                },
            },
            required: ['path', 'pattern'],
        },
    },
    {
        name: 'find_files',
        description: 'Find files by name pattern. Returns list of matching file paths. Recursively searches all subdirectories by default.',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Relative path to search in. Use "." for root directory.',
                },
                name_pattern: {
                    type: 'string',
                    description: 'Regex pattern to match file names. IMPORTANT: Use regex syntax, not glob. Examples: ".*\\.pdf$" for PDF files, "^report.*" for files starting with "report", ".*\\.(jpg|png)$" for images. Do NOT use "*" alone.',
                },
                case_sensitive: {
                    type: 'boolean',
                    description: 'Whether search should be case sensitive. Default: false.',
                },
            },
            required: ['path', 'name_pattern'],
        },
    },
    {
        name: 'list_excel_sheets',
        description: 'List all sheet names in an Excel file (.xlsx or .xls).',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Relative path to the Excel file from root directory.',
                },
            },
            required: ['path'],
        },
    },
    {
        name: 'read_excel_sheet',
        description: 'Read a specific sheet from an Excel file. Returns data as JSON.',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Relative path to the Excel file from root directory.',
                },
                sheet_name: {
                    type: 'string',
                    description: 'Name of the sheet to read.',
                },
            },
            required: ['path', 'sheet_name'],
        },
    },
];

// Helper function to resolve paths safely
function resolvePath(relativePath: string): string {
    const resolved = isAbsolute(relativePath)
        ? relativePath
        : resolve(rootPath, relativePath);

    // Security check: ensure path is within root
    if (!resolved.startsWith(rootPath)) {
        throw new Error('Access denied: Path is outside root directory');
    }

    return resolved;
}

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (!args) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Error: Missing arguments',
                },
            ],
            isError: true,
        };
    }

    try {
        switch (name) {
            case 'list_directory': {
                const path = resolvePath(args.path as string);
                const items = await listDirectory(path, rootPath);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(items, null, 2),
                        },
                    ],
                };
            }

            case 'read_file': {
                const path = resolvePath(args.path as string);
                const content = await readFileContent(path);
                return {
                    content: [
                        {
                            type: 'text',
                            text: content,
                        },
                    ],
                };
            }

            case 'get_file_info': {
                const path = resolvePath(args.path as string);
                const info = await getFileInfo(path, rootPath);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(info, null, 2),
                        },
                    ],
                };
            }

            case 'search_content': {
                const path = resolvePath(args.path as string);
                const results = await searchFiles(path, args.pattern as string, {
                    rootPath,
                    filePattern: args.file_pattern as string | undefined,
                    caseSensitive: args.case_sensitive as boolean | undefined,
                    maxResults: args.max_results as number | undefined,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(results, null, 2),
                        },
                    ],
                };
            }

            case 'find_files': {
                const path = resolvePath(args.path as string);
                const files = await findFiles(path, args.name_pattern as string, {
                    rootPath,
                    caseSensitive: args.case_sensitive as boolean | undefined,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(files, null, 2),
                        },
                    ],
                };
            }

            case 'list_excel_sheets': {
                const path = resolvePath(args.path as string);
                const sheets = await listExcelSheets(path);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(sheets, null, 2),
                        },
                    ],
                };
            }

            case 'read_excel_sheet': {
                const path = resolvePath(args.path as string);
                const content = await readExcelSheetAsString(path, args.sheet_name as string);
                return {
                    content: [
                        {
                            type: 'text',
                            text: content,
                        },
                    ],
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${errorMessage}`,
                },
            ],
            isError: true,
        };
    }
});

// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP File Reader Server running on stdio');
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});

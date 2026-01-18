# MCP Local File Reader

A Model Context Protocol (MCP) server that provides comprehensive file system operations with support for multiple document formats. Works with Claude Desktop and other MCP-compatible AI tools.

## Features

- 📁 **File System Operations**: List directories, read files, get file metadata
- 🔍 **Search Capabilities**: Grep-like content search and file name pattern matching
- 📄 **Multi-Format Support**:
  - PDF text extraction
  - Excel (.xlsx, .xls) with sheet listing and per-sheet reading
  - Word documents (.docx)
  - PowerPoint presentations (.pptx)
  - CSV files
  - Text files with automatic encoding detection (Shift-JIS/UTF-8)
- 🌐 **Character Encoding**: Automatic detection and conversion of Shift-JIS and UTF-8
- 🔒 **Security**: Path validation to prevent access outside designated root directory

## Installation

### Using npx (Recommended)

No installation needed! Just configure Claude Desktop to use npx:

```json
{
  "mcpServers": {
    "localfile-reader": {
      "command": "npx",
      "args": [
        "-y",
        "github:yryuu/mcp-localfile-all-read"
      ],
      "env": {
        "MCP_ROOT_PATH": "/path/to/your/directory"
      }
    }
  }
}
```

### Local Installation

```bash
npx github:yryuu/mcp-localfile-all-read
```

## Configuration

### Claude Desktop

Edit your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the server configuration:

```json
{
  "mcpServers": {
    "localfile-reader": {
      "command": "npx",
      "args": ["-y", "github:yryuu/mcp-localfile-all-read"],
      "env": {
        "MCP_ROOT_PATH": "/Users/yourname/Documents"
      }
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "localfile-reader": {
      "command": "mcp-localfile-reader",
      "env": {
        "MCP_ROOT_PATH": "/Users/yourname/Documents"
      }
    }
  }
}
```

### Environment Variables

- `MCP_ROOT_PATH`: Root directory for file access (defaults to current working directory)

**Windows Example:**
```json
{
  "env": {
    "MCP_ROOT_PATH": "C:\\Users\\YourName\\Documents"
  }
}
```

**macOS/Linux Example:**
```json
{
  "env": {
    "MCP_ROOT_PATH": "/Users/yourname/Documents"
  }
}
```

> **Note**: On Windows, use double backslashes (`\\`) or forward slashes (`/`) in paths. See [WINDOWS.md](WINDOWS.md) for detailed Windows compatibility information.

## Available Tools

### `list_directory`

List contents of a directory.

**Parameters:**
- `path` (string): Relative path from root directory. Use "." for root.

**Example:**
```
List the contents of the current directory
```

### `read_file`

Read file content with automatic format detection.

**Parameters:**
- `path` (string): Relative path to the file.

**Supported formats:**
- Text files (.txt, .md, .json, .xml, etc.)
- PDF (.pdf)
- Excel (.xlsx, .xls)
- Word (.docx)
- PowerPoint (.pptx)
- CSV (.csv)

**Example:**
```
Read the contents of report.pdf
```

### `get_file_info`

Get metadata about a file or directory.

**Parameters:**
- `path` (string): Relative path to the file or directory.

**Example:**
```
Get information about data.xlsx
```

### `search_content`

Search for text patterns in files. Returns a list of file paths that contain the pattern.

**Parameters:**
- `path` (string): Relative path to search in.
- `pattern` (string): Text pattern or regex to search for.
- `max_results` (number): Optional. Maximum number of files to return (default: 1000).
- `file_pattern` (string, optional): Filter files by name pattern.
- `case_sensitive` (boolean, optional): Case sensitive search. Default: false.

**Example:**
```
Search for "TODO" in all JavaScript files
```

### `find_files`

Find files by name pattern.

**Parameters:**
- `path` (string): Relative path to search in.
- `name_pattern` (string): File name pattern or regex.
- `case_sensitive` (boolean, optional): Case sensitive search. Default: false.

**Example:**
```
Find all PDF files in the current directory
```

### `list_excel_sheets`

List all sheet names in an Excel file.

**Parameters:**
- `path` (string): Relative path to the Excel file.

**Example:**
```
List all sheets in budget.xlsx
```

### `read_excel_sheet`

Read a specific sheet from an Excel file.

**Parameters:**
- `path` (string): Relative path to the Excel file.
- `sheet_name` (string): Name of the sheet to read.

**Example:**
```
Read the "Sales" sheet from budget.xlsx
```

## Development

### Setup

```bash
git clone https://github.com/yryuu/mcp-localfile-all-read.git
cd mcp-localfile-all-read
npm install
```

### Build

```bash
npm run build
```

### Testing Locally

Use the MCP Inspector to test the server:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

Or set the root path:

```bash
MCP_ROOT_PATH=/path/to/test/directory npx @modelcontextprotocol/inspector node dist/index.js
```

## Usage Examples

### With Claude Desktop

After configuration, you can ask Claude:

- "List all files in the current directory"
- "Read the contents of report.pdf"
- "Search for 'error' in all log files"
- "Find all Excel files"
- "List the sheets in budget.xlsx and read the Sales sheet"
- "Read the Word document proposal.docx"

### Programmatic Usage

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// The server runs on stdio transport
// See src/index.ts for implementation details
```

## File Format Support Details

### PDF
- Extracts all text content from PDF files
- Handles multi-page documents
- Uses `pdf-parse` library

### Excel
- Supports .xlsx and .xls formats
- List all sheet names
- Read specific sheets or all sheets
- Returns data as JSON arrays

### Word
- Supports .docx format
- Extracts plain text content
- Uses `mammoth` library

### PowerPoint
- Supports .pptx format
- Extracts text from all slides
- Returns slide-by-slide content

### CSV
- Automatic delimiter detection
- Character encoding detection (Shift-JIS/UTF-8)
- Returns structured JSON data

### Text Files
- Automatic character encoding detection
- Supports Shift-JIS and UTF-8
- Handles various text-based formats

## Security

- Path validation prevents access outside the configured root directory
- All paths are resolved and validated before file operations
- Error handling for permission issues and invalid paths

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

yryuu

## Repository

https://github.com/yryuu/mcp-localfile-all-read

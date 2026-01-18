import jschardet from 'jschardet';
import { readFile } from 'fs/promises';
import iconv from 'iconv-lite';
/**
 * Detect character encoding of a file
 */
export async function detectEncoding(filePath) {
    const buffer = await readFile(filePath);
    const detected = jschardet.detect(buffer);
    return detected.encoding || 'UTF-8';
}
/**
 * Read file with automatic encoding detection
 * Compatible with Node 18+
 */
export async function readFileWithEncoding(filePath) {
    const buffer = await readFile(filePath);
    const detected = jschardet.detect(buffer);
    const encoding = detected.encoding || 'UTF-8';
    // Convert to string using detected encoding
    if (encoding.toLowerCase().includes('shift_jis') || encoding.toLowerCase().includes('shift-jis')) {
        // Use iconv-lite for Shift-JIS (Node 18 compatible)
        return iconv.decode(buffer, 'shift_jis');
    }
    else if (encoding.toLowerCase() === 'utf-8' || encoding.toLowerCase() === 'ascii') {
        // Use native Node.js for UTF-8 and ASCII
        return buffer.toString('utf-8');
    }
    else {
        // Try iconv-lite for other encodings
        try {
            return iconv.decode(buffer, encoding);
        }
        catch {
            // Fallback to UTF-8 if encoding is not supported
            return buffer.toString('utf-8');
        }
    }
}
//# sourceMappingURL=encoding.js.map
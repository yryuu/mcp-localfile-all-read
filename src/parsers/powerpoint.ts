import AdmZip from 'adm-zip';
import { readFile } from 'fs/promises';

interface ZipEntry {
    entryName: string;
    getData: () => Buffer;
}

/**
 * Extract text from a PowerPoint presentation (.pptx)
 */
export async function parsePowerPoint(filePath: string): Promise<string> {
    try {
        const buffer = await readFile(filePath);
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries() as ZipEntry[];

        const slides: string[] = [];

        // Find all slide XML files
        const slideFiles = zipEntries
            .filter((entry: ZipEntry) => entry.entryName.match(/ppt\/slides\/slide\d+\.xml/))
            .sort((a: ZipEntry, b: ZipEntry) => {
                const numA = parseInt(a.entryName.match(/\d+/)?.[0] || '0');
                const numB = parseInt(b.entryName.match(/\d+/)?.[0] || '0');
                return numA - numB;
            });

        for (const slideFile of slideFiles) {
            const content = slideFile.getData().toString('utf8');
            // Extract text from XML tags
            const textMatches = content.match(/<a:t>([^<]+)<\/a:t>/g);
            if (textMatches) {
                const slideText = textMatches
                    .map((match: string) => match.replace(/<\/?a:t>/g, ''))
                    .join(' ');
                slides.push(slideText);
            }
        }

        return slides.map((text, index) => `Slide ${index + 1}:\n${text}`).join('\n\n');
    } catch (error) {
        throw new Error(`Failed to parse PowerPoint: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Get slide count from PowerPoint file
 */
export async function getPowerPointSlideCount(filePath: string): Promise<number> {
    try {
        const buffer = await readFile(filePath);
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries() as ZipEntry[];

        const slideFiles = zipEntries.filter((entry: ZipEntry) =>
            entry.entryName.match(/ppt\/slides\/slide\d+\.xml/)
        );

        return slideFiles.length;
    } catch (error) {
        throw new Error(`Failed to get PowerPoint slide count: ${error instanceof Error ? error.message : String(error)}`);
    }
}

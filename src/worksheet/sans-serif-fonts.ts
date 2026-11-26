import { jsPDF } from 'jspdf';
import { PDF_FONT, SANS_SERIF_FAMILY } from '../constants';

interface SansSerifWeight {
    // What styles.css declares for the face. Medium answers to 400, because the code asks for
    // "normal" and Regular would print as faint as a polite apology.
    cssWeight: number;
    // The style name jsPDF files the face under.
    pdfStyle: 'normal' | 'bold';
    // The file in public/fonts/quicksand/; styles.css names the same two files
    fileName: string;
}

const SANS_SERIF_WEIGHTS: readonly SansSerifWeight[] = [
    { cssWeight: 400, pdfStyle: 'normal', fileName: 'Quicksand-Medium.ttf' },
    { cssWeight: 700, pdfStyle: 'bold', fileName: 'Quicksand-Bold.ttf' }
];

const FONT_FOLDER_URL = './fonts/quicksand/';

// Any size loads a face; this one is merely the least surprising
const LOADING_SIZE = 16;

// The first four bytes of a TrueType file. A dev server that cannot find a file may answer with
// the page's own HTML and a cheerful 200, so a font is checked for being a font.
const TRUETYPE_SIGNATURE = [0x00, 0x01, 0x00, 0x00];

// Each face's file as plain base64, fetched once at startup for jsPDF, keyed by file name
const pdfFontFiles = new Map<string, string>();

/**
 * Loads both weights of the sans-serif before the first render. Canvas text quietly falls back
 * to whatever the system offers if a face has not arrived, and the PDF would then disagree with
 * its own preview, so a face that cannot be found is an error here. A file that fails to
 * download rejects the load outright. A missing weight is subtler: font matching hands over the
 * nearest one instead, so each weight must come back as itself, not as a well-meaning relation.
 * The same two files are fetched for jsPDF, which cannot borrow the browser's copy.
 */
export async function loadSansSerifFonts(): Promise<void> {
    await Promise.all(SANS_SERIF_WEIGHTS.map(async (weight) => {
        const descriptor = `${weight.cssWeight} ${LOADING_SIZE}px ${SANS_SERIF_FAMILY}`;
        const [loadedFaces, fileContents] = await Promise.all([
            document.fonts.load(descriptor),
            fetchFontAsBase64(FONT_FOLDER_URL + weight.fileName)
        ]);
        const hasRequestedWeight = loadedFaces.some((face) => face.weight === String(weight.cssWeight));
        if (!hasRequestedWeight) {
            throw new Error(`No font is declared for ${descriptor}, so the worksheets cannot draw their words.`);
        }
        pdfFontFiles.set(weight.fileName, fileContents);
    }));
}

/**
 * Gives a new PDF its own copy of both weights, under the family name its text asks for.
 * jsPDF keeps fonts per document, so every document needs this once, before its first word.
 */
export function registerPdfFonts(documentInstance: jsPDF): void {
    SANS_SERIF_WEIGHTS.forEach((weight) => {
        const fileContents = pdfFontFiles.get(weight.fileName);
        if (fileContents === undefined) {
            throw new Error(`Call loadSansSerifFonts() before making a PDF; ${weight.fileName} is not loaded.`);
        }
        documentInstance.addFileToVFS(weight.fileName, fileContents);
        documentInstance.addFont(weight.fileName, PDF_FONT, weight.pdfStyle);
    });
}

async function fetchFontAsBase64(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Could not fetch ${url}: ${response.status} ${response.statusText}`);
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    const isTrueType = TRUETYPE_SIGNATURE.every((expectedByte, index) => bytes[index] === expectedByte);
    if (!isTrueType) {
        throw new Error(`${url} did not arrive as a TrueType font, so PDFs cannot use it.`);
    }
    // btoa wants a string of single bytes; built in slices, since one giant argument list overflows the stack
    const sliceLength = 0x2000;
    let binary = '';
    for (let start = 0; start < bytes.length; start += sliceLength) {
        binary += String.fromCharCode(...bytes.subarray(start, start + sliceLength));
    }
    return btoa(binary);
}

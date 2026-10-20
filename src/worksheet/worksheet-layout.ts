import { jsPDF } from 'jspdf';
import { SANS_SERIF_FONT, COLOR_PDF_CROSSHAIR, COLOR_PDF_PERFORATION, COLOR_WHITE } from '../constants';
import { ANSWER_KEY_CHEER, drawMascotBand, pickMascotAndCheer } from './mascots';

const PAGE_WIDTH = 612;
const MARGIN_X = 40;
const PRINTABLE_WIDTH = PAGE_WIDTH - (MARGIN_X * 2);
export const EXERCISE_HEIGHT = 155;
export const EXERCISE_WIDTH = PRINTABLE_WIDTH / 2;
export const HALF_PAGE_HEIGHT = 396;
const PAGE_HEIGHT = HALF_PAGE_HEIGHT * 2;
// Home printers cannot reach the last stretch of paper, so the bottom half's mascot stands this far above the edge
const PRINTER_SAFE_MARGIN = 14;
// The Name and Date line needs little room; the rest of the half-page goes to the grid and the mascot's band
export const GRID_TOP_OFFSET = 26;
export const GRID_BOTTOM_OFFSET = GRID_TOP_OFFSET + (EXERCISE_HEIGHT * 2);
// Leaves a hair of white between the mascot's feet and the cutting line
const MASCOT_GAP_ABOVE_CUTTING_LINE = 2;
// Every exercise stops drawing by 147pt down its 155pt quadrant (checked by drawing them all), so a mascot may
// reach this far up into the grid's bottom edge without touching anything. Re-check if an exercise changes.
export const MASCOT_MAX_REACH_INTO_GRID = 6;

/**
 * Where the mascot's feet stand within a half-page: just above the cutting line, or, for the bottom half of
 * the paper, higher still so the feet clear the printer's blind strip.
 */
export function getMascotBottomEdge(halfPageStartCoordinateY: number): number {
    const aboveCuttingLine = HALF_PAGE_HEIGHT - MASCOT_GAP_ABOVE_CUTTING_LINE;
    const abovePaperEdge = PAGE_HEIGHT - PRINTER_SAFE_MARGIN - halfPageStartCoordinateY;
    return Math.min(aboveCuttingLine, abovePaperEdge);
}

export interface QuadrantContext {
    context: CanvasRenderingContext2D;
    width: number;  // Local canvas space pixel width
    height: number; // Local canvas space pixel height
}

export interface QuadrantExercise {
    render(quadrantContext: QuadrantContext): void;
    // Draws the worksheet with the answers filled in. Absent when the exercise has nothing to answer.
    renderAnswers?(quadrantContext: QuadrantContext): void;
}

export interface HalfPageLayout {
    topLeft: QuadrantExercise;
    topRight: QuadrantExercise;
    bottomLeft: QuadrantExercise;
    bottomRight: QuadrantExercise;
}

const HALF_PAGE_LAYOUT_SLOTS = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const;

/**
 * The answer sheet shows the answers where an exercise has them and the plain exercise where it does not.
 */
export function drawQuadrant(exercise: QuadrantExercise, quadrantContext: QuadrantContext, showAnswers: boolean): void {
    if (showAnswers && exercise.renderAnswers) {
        exercise.renderAnswers(quadrantContext);
    } else {
        exercise.render(quadrantContext);
    }
}

/**
 * A key with no answers on it would only repeat the worksheet, so the batch earns one only when some quadrant can answer.
 */
export function batchHasAnswers(workbookBatch: HalfPageLayout[][]): boolean {
    return workbookBatch.some((sheet) => sheet.some((halfPage) => {
        return HALF_PAGE_LAYOUT_SLOTS.some((slot) => halfPage[slot].renderAnswers !== undefined);
    }));
}

// Helper to fetch the raw binary font and convert it to Base64
async function loadFontAsBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            if (!base64String) {
                return Error('The font did not get saved correctly');
            }
            // Strip out the data URL prefix (e.g., "data:font/ttf;base64,")
            resolve(base64String.split(",")[1] as string);
        };
        reader.readAsDataURL(blob);
    });
}

/**
 * Creates a high-DPI canvas for a quadrant, runs the component renderer,
 * and embeds the final output into the jsPDF document.
 */
async function renderQuadrantToPdf(
    documentInstance: jsPDF,
    exercise: QuadrantExercise,
    pdfCoordinateX: number,
    pdfCoordinateY: number,
    pdfWidth: number,
    pdfHeight: number,
    showAnswers: boolean
): Promise<void> {
    // Scale factor (3x) for crisp high-DPI printing text and lines
    const scaleMultiplier = 3;
    const canvas = document.createElement('canvas');
    canvas.width = pdfWidth * scaleMultiplier;
    canvas.height = pdfHeight * scaleMultiplier;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not look up 2D canvas context');

    // Sync internal system scale factor
    context.scale(scaleMultiplier, scaleMultiplier);

    // Clear baseline background
    context.fillStyle = COLOR_WHITE;
    context.fillRect(0, 0, pdfWidth, pdfHeight);

    // Run the element graphics loops
    drawQuadrant(exercise, { context: context, width: pdfWidth, height: pdfHeight }, showAnswers);

    // Convert the finished offscreen canvas unit to a raw data url image blob
    const imageData = canvas.toDataURL('image/png');
    documentInstance.addImage(imageData, 'PNG', pdfCoordinateX, pdfCoordinateY, pdfWidth, pdfHeight, undefined, 'FAST');
}

/**
 * Draws the mascot band on a see-through layer the size of the half-page, then lays it over the exercises.
 * The layer is transparent so it can never hide an exercise.
 */
function renderHalfPageLayerToPdf(
    documentInstance: jsPDF,
    startCoordinateY: number,
    halfPageNumber: number,
    showAnswers: boolean
): void {
    const scaleMultiplier = 3;
    const canvas = document.createElement('canvas');
    canvas.width = PAGE_WIDTH * scaleMultiplier;
    canvas.height = HALF_PAGE_HEIGHT * scaleMultiplier;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not look up 2D canvas context');
    context.scale(scaleMultiplier, scaleMultiplier);

    // The answer key keeps the worksheet's animal and swaps only the cheer
    const { mascot, cheer } = pickMascotAndCheer(halfPageNumber);
    drawMascotBand(
        context,
        mascot,
        showAnswers ? ANSWER_KEY_CHEER : cheer,
        MARGIN_X + PRINTABLE_WIDTH,
        getMascotBottomEdge(startCoordinateY)
    );

    documentInstance.addImage(canvas.toDataURL('image/png'), 'PNG', 0, startCoordinateY, PAGE_WIDTH, HALF_PAGE_HEIGHT, undefined, 'FAST');
}

/**
 * Formats and renders a single page within the target document instance.
 * The half-page numbers count from the first top half of the batch, and pick each half-page's mascot.
 */
async function renderSingleWorksheetPage(
    documentInstance: jsPDF,
    topHalf: HalfPageLayout,
    bottomHalf: HalfPageLayout | undefined,
    firstHalfPageNumber: number,
    showAnswers: boolean = false
): Promise<void> {
    const marginX = MARGIN_X;
    const printableWidth = PRINTABLE_WIDTH; // 532pt
    const quadrantWidth = EXERCISE_WIDTH;   // 266pt
    const quadrantHeight = EXERCISE_HEIGHT; // Height per quadrant box

    const renderHalfSheet = async (layout: HalfPageLayout, startCoordinateY: number, halfPageNumber: number) => {
        // Name / Date Header Lines rendered inside native PDF vector space
        documentInstance.setFont(SANS_SERIF_FONT, 'bold');
        documentInstance.setFontSize(12);
        const nameText = 'Name: ___________________________';
        const dateCoordinateX = marginX + 340;
        documentInstance.text(nameText, marginX, startCoordinateY + 20);
        documentInstance.text('Date: __________________', dateCoordinateX, startCoordinateY + 20);
        if (showAnswers) {
            // Small, and in the gap between Name and Date, where the grid starts too close below for a label
            const gapMiddleCoordinateX = (marginX + documentInstance.getTextWidth(nameText) + dateCoordinateX) / 2;
            documentInstance.setFontSize(9);
            documentInstance.text('ANSWER KEY', gapMiddleCoordinateX, startCoordinateY + 20, { align: 'center' });
        }

        const gridTopCoordinateY = startCoordinateY + GRID_TOP_OFFSET;

        // Render each component into its offscreen canvas and append it to the document
        await renderQuadrantToPdf(documentInstance, layout.topLeft, marginX, gridTopCoordinateY, quadrantWidth, quadrantHeight, showAnswers);
        await renderQuadrantToPdf(documentInstance, layout.topRight, marginX + quadrantWidth, gridTopCoordinateY, quadrantWidth, quadrantHeight, showAnswers);
        await renderQuadrantToPdf(documentInstance, layout.bottomLeft, marginX, gridTopCoordinateY + quadrantHeight, quadrantWidth, quadrantHeight, showAnswers);
        await renderQuadrantToPdf(documentInstance, layout.bottomRight, marginX + quadrantWidth, gridTopCoordinateY + quadrantHeight, quadrantWidth, quadrantHeight, showAnswers);

        renderHalfPageLayerToPdf(documentInstance, startCoordinateY, halfPageNumber, showAnswers);

        // Draw Section Divider Crosshairs natively over the images
        documentInstance.setDrawColor(COLOR_PDF_CROSSHAIR);
        documentInstance.setLineWidth(1);
        documentInstance.line(marginX, gridTopCoordinateY + quadrantHeight, marginX + printableWidth, gridTopCoordinateY + quadrantHeight);
        documentInstance.line(marginX + quadrantWidth, gridTopCoordinateY, marginX + quadrantWidth, gridTopCoordinateY + (quadrantHeight * 2));
    };

    await renderHalfSheet(topHalf, 0, firstHalfPageNumber);

    // Decorative Middle Perforation Line Splitter
    documentInstance.setDrawColor(COLOR_PDF_PERFORATION);
    documentInstance.setLineWidth(1.5);
    documentInstance.setLineDashPattern([], 0);
    documentInstance.line(20, 396, 592, 396);
    documentInstance.setLineDashPattern([], 0);

    // A lone half-page leaves the bottom white, with no header, but keeps the cutting line above
    if (bottomHalf) {
        await renderHalfSheet(bottomHalf, HALF_PAGE_HEIGHT, firstHalfPageNumber + 1);
    }
}

/**
 * Builds a single composite worksheet instance.
 */
export async function buildCompositeWorksheet(
    topHalf: HalfPageLayout,
    bottomHalf: HalfPageLayout
): Promise<jsPDF> {
    const documentInstance = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter' // 612pt wide x 792pt high
    });

    await renderSingleWorksheetPage(documentInstance, topHalf, bottomHalf, 0);

    return documentInstance;
}

/**
 * Consumes the randomized matrix batch, generates all multi-topic sheets,
 * and triggers a physical PDF file download directly to the user's machine.
 */
export async function buildAndDownloadWorksheetBatch(
    workbookBatch: HalfPageLayout[][]
): Promise<void> {
    const documentInstance = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
    });

    let sheetIndex = 0;
    while (sheetIndex < workbookBatch.length) {
        // Append a new page dynamically for every iteration after the initial layer
        if (sheetIndex > 0) {
            documentInstance.addPage();
        }

        const currentSheetHalfPages = workbookBatch[sheetIndex];

        // A sheet holds two half-pages, or one when the count is odd. Anything else is a bug, not a page.
        const topHalfLayout = currentSheetHalfPages ? currentSheetHalfPages[0] : undefined;
        const bottomHalfLayout = currentSheetHalfPages ? currentSheetHalfPages[1] : undefined;
        const halfPageTotal = currentSheetHalfPages ? currentSheetHalfPages.length : 0;
        if (!topHalfLayout || halfPageTotal > 2) {
            throw new Error(`Sheet ${sheetIndex + 1} holds ${halfPageTotal} half-pages; expected one or two.`);
        }
        await renderSingleWorksheetPage(documentInstance, topHalfLayout, bottomHalfLayout, sheetIndex * 2);

        sheetIndex = sheetIndex + 1;
    }

    // The key follows the worksheets, page for page, built from the very same exercises
    if (batchHasAnswers(workbookBatch)) {
        for (const [keyIndex, sheetHalfPages] of workbookBatch.entries()) {
            documentInstance.addPage();
            await renderSingleWorksheetPage(documentInstance, sheetHalfPages[0] as HalfPageLayout, sheetHalfPages[1], keyIndex * 2, true);
        }
    }

    // Trigger local client file download save execution
    documentInstance.save('educational-worksheet-batch.pdf');
}

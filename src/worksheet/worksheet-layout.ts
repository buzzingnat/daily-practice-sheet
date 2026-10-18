import { jsPDF } from 'jspdf';
import { SANS_SERIF_FONT, COLOR_PDF_CROSSHAIR, COLOR_PDF_PERFORATION, COLOR_WHITE } from '../constants';

const MARGIN_X = 40;
const PRINTABLE_WIDTH = 612 - (MARGIN_X * 2);
export const EXERCISE_HEIGHT = 155;
export const EXERCISE_WIDTH = PRINTABLE_WIDTH / 2;

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
 * Formats and renders a single page within the target document instance.
 */
async function renderSingleWorksheetPage(
    documentInstance: jsPDF,
    topHalf: HalfPageLayout,
    bottomHalf: HalfPageLayout | undefined,
    showAnswers: boolean = false
): Promise<void> {
    const marginX = MARGIN_X;
    const printableWidth = PRINTABLE_WIDTH; // 532pt
    const quadrantWidth = EXERCISE_WIDTH;   // 266pt
    const quadrantHeight = EXERCISE_HEIGHT; // Height per quadrant box

    const renderHalfSheet = async (layout: HalfPageLayout, startCoordinateY: number) => {
        // Name / Date Header Lines rendered inside native PDF vector space
        documentInstance.setFont(SANS_SERIF_FONT, 'bold');
        documentInstance.setFontSize(12);
        documentInstance.text('Name: ___________________________', marginX, startCoordinateY + 20);
        documentInstance.text('Date: __________________', marginX + 340, startCoordinateY + 20);
        if (showAnswers) {
            // Small and to the right, so the key cannot be mistaken for a worksheet
            documentInstance.setFontSize(9);
            documentInstance.text('ANSWER KEY', marginX + printableWidth, startCoordinateY + 34, { align: 'right' });
        }

        const gridTopCoordinateY = startCoordinateY + 40;

        // Render each component into its offscreen canvas and append it to the document
        await renderQuadrantToPdf(documentInstance, layout.topLeft, marginX, gridTopCoordinateY, quadrantWidth, quadrantHeight, showAnswers);
        await renderQuadrantToPdf(documentInstance, layout.topRight, marginX + quadrantWidth, gridTopCoordinateY, quadrantWidth, quadrantHeight, showAnswers);
        await renderQuadrantToPdf(documentInstance, layout.bottomLeft, marginX, gridTopCoordinateY + quadrantHeight, quadrantWidth, quadrantHeight, showAnswers);
        await renderQuadrantToPdf(documentInstance, layout.bottomRight, marginX + quadrantWidth, gridTopCoordinateY + quadrantHeight, quadrantWidth, quadrantHeight, showAnswers);

        // Draw Section Divider Crosshairs natively over the images
        documentInstance.setDrawColor(COLOR_PDF_CROSSHAIR);
        documentInstance.setLineWidth(1);
        documentInstance.line(marginX, gridTopCoordinateY + quadrantHeight, marginX + printableWidth, gridTopCoordinateY + quadrantHeight);
        documentInstance.line(marginX + quadrantWidth, gridTopCoordinateY, marginX + quadrantWidth, gridTopCoordinateY + (quadrantHeight * 2));
    };

    await renderHalfSheet(topHalf, 0);

    // Decorative Middle Perforation Line Splitter
    documentInstance.setDrawColor(COLOR_PDF_PERFORATION);
    documentInstance.setLineWidth(1.5);
    documentInstance.setLineDashPattern([], 0);
    documentInstance.line(20, 396, 592, 396);
    documentInstance.setLineDashPattern([], 0);

    // A lone half-page leaves the bottom white, with no header, but keeps the cutting line above
    if (bottomHalf) {
        await renderHalfSheet(bottomHalf, 396);
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

    await renderSingleWorksheetPage(documentInstance, topHalf, bottomHalf);

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
        await renderSingleWorksheetPage(documentInstance, topHalfLayout, bottomHalfLayout);

        sheetIndex = sheetIndex + 1;
    }

    // The key follows the worksheets, page for page, built from the very same exercises
    if (batchHasAnswers(workbookBatch)) {
        for (const sheetHalfPages of workbookBatch) {
            documentInstance.addPage();
            await renderSingleWorksheetPage(documentInstance, sheetHalfPages[0] as HalfPageLayout, sheetHalfPages[1], true);
        }
    }

    // Trigger local client file download save execution
    documentInstance.save('educational-worksheet-batch.pdf');
}

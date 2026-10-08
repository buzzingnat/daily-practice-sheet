import { jsPDF } from 'jspdf';

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
}

export interface HalfPageLayout {
    topLeft: QuadrantExercise;
    topRight: QuadrantExercise;
    bottomLeft: QuadrantExercise;
    bottomRight: QuadrantExercise;
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
    pdfHeight: number
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
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, pdfWidth, pdfHeight);

    // Run the element graphics loops
    exercise.render({ context: context, width: pdfWidth, height: pdfHeight });

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
    bottomHalf: HalfPageLayout
): Promise<void> {
    const marginX = MARGIN_X;
    const printableWidth = PRINTABLE_WIDTH; // 532pt
    const quadrantWidth = EXERCISE_WIDTH;   // 266pt
    const quadrantHeight = EXERCISE_HEIGHT; // Height per quadrant box

    const renderHalfSheet = async (layout: HalfPageLayout, startCoordinateY: number) => {
        // Name / Date Header Lines rendered inside native PDF vector space
        documentInstance.setFont('Helvetica', 'bold');
        documentInstance.setFontSize(12);
        documentInstance.text('Name: ___________________________', marginX, startCoordinateY + 20);
        documentInstance.text('Date: __________________', marginX + 340, startCoordinateY + 20);

        const gridTopCoordinateY = startCoordinateY + 40;

        // Render each component into its offscreen canvas and append it to the document
        await renderQuadrantToPdf(documentInstance, layout.topLeft, marginX, gridTopCoordinateY, quadrantWidth, quadrantHeight);
        await renderQuadrantToPdf(documentInstance, layout.topRight, marginX + quadrantWidth, gridTopCoordinateY, quadrantWidth, quadrantHeight);
        await renderQuadrantToPdf(documentInstance, layout.bottomLeft, marginX, gridTopCoordinateY + quadrantHeight, quadrantWidth, quadrantHeight);
        await renderQuadrantToPdf(documentInstance, layout.bottomRight, marginX + quadrantWidth, gridTopCoordinateY + quadrantHeight, quadrantWidth, quadrantHeight);

        // Draw Section Divider Crosshairs natively over the images
        documentInstance.setDrawColor(200, 200, 200);
        documentInstance.setLineWidth(1);
        documentInstance.line(marginX, gridTopCoordinateY + quadrantHeight, marginX + printableWidth, gridTopCoordinateY + quadrantHeight);
        documentInstance.line(marginX + quadrantWidth, gridTopCoordinateY, marginX + quadrantWidth, gridTopCoordinateY + (quadrantHeight * 2));
    };

    await renderHalfSheet(topHalf, 0);

    // Decorative Middle Perforation Line Splitter
    documentInstance.setDrawColor(150, 150, 150);
    documentInstance.setLineWidth(1.5);
    documentInstance.setLineDashPattern([], 0);
    documentInstance.line(20, 396, 592, 396);
    documentInstance.setLineDashPattern([], 0);

    await renderHalfSheet(bottomHalf, 396);
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

        // Ensure each sheet layout has exactly two independent half-pages to populate top and bottom tracks
        if (currentSheetHalfPages && currentSheetHalfPages.length === 2) {
            const topHalfLayout = currentSheetHalfPages[0];
            const bottomHalfLayout = currentSheetHalfPages[1];

            if (topHalfLayout && bottomHalfLayout) {
                await renderSingleWorksheetPage(documentInstance, topHalfLayout, bottomHalfLayout);
            }
        }

        sheetIndex = sheetIndex + 1;
    }

    // Trigger local client file download save execution
    documentInstance.save('educational-worksheet-batch.pdf');
}

import { jsPDF } from "jspdf";
import { HalfPageLayout, QuadrantContext, QuadrantExercise } from "./worksheet-layout";

/**
 * Renders an isolated exercise quadrant onto a high-DPI hidden canvas element layer
 */
function renderQuadrantToCanvas(
    exercise: QuadrantExercise,
    targetWidth: number,
    targetHeight: number,
    scaleMultiplier: number
): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth * scaleMultiplier;
    canvas.height = targetHeight * scaleMultiplier;

    const context = canvas.getContext("2d");
    if (context) {
        // Uniformly upscale context operations to protect physical printing crispness
        context.scale(scaleMultiplier, scaleMultiplier);

        const quadrantContext: QuadrantContext = {
            context: context,
            width: targetWidth,
            height: targetHeight
        };

        exercise.render(quadrantContext);
    }

    return canvas;
}

/**
 * Draws standard native vector decorations, metadata lines, and student headers onto a PDF page surface
 */
function overlayNativePageVectors(documentContext: jsPDF, targetWidth: number, targetHeight: number): void {
    documentContext.setDrawColor(0, 0, 0);
    documentContext.setLineWidth(1);

    const verticalMiddleX = targetWidth / 2;
    const horizontalCutoffY = targetHeight / 2;
    const paddingX = 40;

    // Render continuous horizontal perforation divider split mark at center axis
    documentContext.setLineDashPattern([4, 4], 0);
    documentContext.line(0, horizontalCutoffY, targetWidth, horizontalCutoffY);
    documentContext.setLineDashPattern([], 0);

    // Loop logic to stamp identical, crisp text tracking grids on both independent halves
    let halfPageCounter = 0;
    while (halfPageCounter < 2) {
        const offsetAxisY = halfPageCounter * horizontalCutoffY;

        // Draw outer boundaries framing layout for this individual half-page section
        documentContext.rect(paddingX, offsetAxisY + 45, targetWidth - (paddingX * 2), 310);

        // Crosshair internal column quadrant separator layout stroke
        documentContext.line(verticalMiddleX, offsetAxisY + 45, verticalMiddleX, offsetAxisY + 355);
        documentContext.line(paddingX, offsetAxisY + 200, targetWidth - paddingX, offsetAxisY + 200);

        // Student metadata information header texts
        documentContext.setFont("Helvetica", "bold");
        documentContext.setFontSize(10);
        documentContext.text("Name: ___________________________", paddingX, offsetAxisY + 30);
        documentContext.text("Date: ___________", targetWidth - paddingX - 90, offsetAxisY + 30);

        halfPageCounter = halfPageCounter + 1;
    }
}

/**
 * Main PDF Generation Engine Orchestration Entry Point
 * Consumes the randomized dataset array matrix output directly from generateWorkbookBatch
 */
export function compileWorkbookPdfBatch(workbookBatch: HalfPageLayout[][]): jsPDF {
    // US Letter Standard Dimensions (612pt x 792pt)
    const letterWidthPoints = 612;
    const letterHeightPoints = 792;

    const quadrantWidthPoints = 266;
    const quadrantHeightPoints = 155;
    const scaleMultiplierDpi = 3;
    const horizontalMarginX = 40;

    const documentContext = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter"
    });

    let sheetIndex = 0;
    while (sheetIndex < workbookBatch.length) {
        // Append sequential workspace pages dynamically past the initial file layer bounds
        if (sheetIndex > 0) {
            documentContext.addPage();
        }

        const currentSheetHalfPages = workbookBatch[sheetIndex] as HalfPageLayout[];
        let halfPageIndex = 0;

        while (halfPageIndex < currentSheetHalfPages.length) {
            const layout = currentSheetHalfPages[halfPageIndex] as HalfPageLayout;

            // Vertical placement point offset calculation logic corresponding to top or bottom half placement
            const verticalBaseY = (halfPageIndex === 0) ? 45 : 396 + 45;

            // Compilation layout mapping configuration for quadrant grid coordinates matching target layout specifications
            const positionsConfiguration = [
                { exercise: layout.topLeft, offsetX: horizontalMarginX, offsetY: verticalBaseY },
                { exercise: layout.topRight, offsetX: horizontalMarginX + quadrantWidthPoints, offsetY: verticalBaseY },
                { exercise: layout.bottomLeft, offsetX: horizontalMarginX, offsetY: verticalBaseY + quadrantHeightPoints },
                { exercise: layout.bottomRight, offsetX: horizontalMarginX + quadrantWidthPoints, offsetY: verticalBaseY + quadrantHeightPoints }
            ];

            let quadrantIndex = 0;
            while (quadrantIndex < positionsConfiguration.length) {
                const position = positionsConfiguration[quadrantIndex] as {exercise: QuadrantExercise;offsetX: number;offsetY: number;};
                const compiledCanvas = renderQuadrantToCanvas(
                    position.exercise,
                    quadrantWidthPoints,
                    quadrantHeightPoints,
                    scaleMultiplierDpi
                );

                // Convert high-DPI raw graphic nodes cleanly to high-contrast data asset strings
                const base64ImageString = compiledCanvas.toDataURL("image/png");

                // Seamlessly embed canvas raster directly underneath crisp text layer frames
                documentContext.addImage(
                    base64ImageString,
                    "PNG",
                    position.offsetX,
                    position.offsetY,
                    quadrantWidthPoints,
                    quadrantHeightPoints,
                    undefined,
                    "FAST"
                );

                quadrantIndex = quadrantIndex + 1;
            }

            halfPageIndex = halfPageIndex + 1;
        }

        // Overlay sharp vector guidelines precisely on top of embedded images
        overlayNativePageVectors(documentContext, letterWidthPoints, letterHeightPoints);

        sheetIndex = sheetIndex + 1;
    }

    return documentContext;
}

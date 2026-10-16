import { QuadrantContext, QuadrantExercise } from '../../worksheet/worksheet-layout';
import {
    COLOR_BLACK,
    COLOR_LIGHT_GREY,
    COLOR_MEDIUM_GREY,
    CURSIVE_BOLD_FONT,
    CURSIVE_DASHED_FONT,
    CURSIVE_REGULAR_FONT,
    SANS_SERIF_FONT
} from '../../constants';
import { areCursiveFontsLoaded, measureFontMetrics, measureLetterInk } from './cursive-fonts';
import { CursiveLayout, PracticeRow, planCursiveLayout } from './cursive-layout';

const GUIDE_LINE_WIDTH = 0.75;
const MIDLINE_DASH = [3, 2];

/**
 * The three writing lines of one row. The top and base lines are solid, the midline dashed,
 * all in the mid-grey that survives a printer and a tired eye.
 */
function drawGuideLines(context: CanvasRenderingContext2D, row: PracticeRow, layout: CursiveLayout): void {
    context.strokeStyle = COLOR_MEDIUM_GREY;
    context.lineWidth = GUIDE_LINE_WIDTH;
    context.lineCap = 'butt';

    [row.topLineY, row.baselineY].forEach((lineY) => {
        context.beginPath();
        context.moveTo(layout.guideLeftX, lineY);
        context.lineTo(layout.guideRightX, lineY);
        context.stroke();
    });

    context.setLineDash(MIDLINE_DASH);
    context.beginPath();
    context.moveTo(layout.guideLeftX, row.midLineY);
    context.lineTo(layout.guideRightX, row.midLineY);
    context.stroke();
    context.setLineDash([]);
}

/**
 * Draws the letters to trace on one row: solid ones in the regular face, dotted ones in the
 * dashed face, and nothing at all for a blank slot. Each letter stands alone; joining comes later.
 */
function drawPracticeLetters(
    context: CanvasRenderingContext2D,
    letter: string,
    row: PracticeRow,
    layout: CursiveLayout
): void {
    context.textBaseline = 'alphabetic';
    context.textAlign = 'left';
    row.slots.forEach((slot) => {
        if (slot.kind === 'solid') {
            context.fillStyle = COLOR_LIGHT_GREY;
            context.font = `${layout.practiceFontSize}px ${CURSIVE_REGULAR_FONT}`;
            context.fillText(letter, slot.originX, row.baselineY);
        } else if (slot.kind === 'dotted') {
            context.fillStyle = COLOR_MEDIUM_GREY;
            context.font = `${layout.practiceFontSize}px ${CURSIVE_DASHED_FONT}`;
            context.fillText(letter, slot.originX, row.baselineY);
        }
    });
}

/**
 * The cursive lowercase practice quadrant: a large bold model on the left, and on the right
 * two ruled lines. The first holds two solid and two dotted copies to trace; the second is
 * blank, because eventually the child must go without a net. The fonts must be preloaded.
 */
export function createCursiveExercise(letter: string): QuadrantExercise {
    if (!/^[a-z]$/.test(letter)) {
        throw new Error(`"${letter}" is not a single lowercase letter.`);
    }
    if (!areCursiveFontsLoaded()) {
        throw new Error('Call loadCursiveFonts() before creating a cursive exercise.');
    }

    return {
        render(quadrantContext: QuadrantContext): void {
            const context = quadrantContext.context;
            const layout = planCursiveLayout(
                quadrantContext.width,
                quadrantContext.height,
                measureFontMetrics(context),
                measureLetterInk(context, letter)
            );

            // Header title
            context.fillStyle = COLOR_BLACK;
            context.font = `bold 14px ${SANS_SERIF_FONT}`;
            context.textBaseline = 'top';
            context.textAlign = 'left';
            context.fillText('CURSIVE', 15, 12);

            // Left: the large model
            context.fillStyle = COLOR_BLACK;
            context.font = `${layout.modelFontSize}px ${CURSIVE_BOLD_FONT}`;
            context.textBaseline = 'alphabetic';
            context.fillText(letter, layout.modelOriginX, layout.modelBaselineY);

            // Right: the writing lines, then the letters to trace
            layout.rows.forEach((row) => {
                drawGuideLines(context, row, layout);
                drawPracticeLetters(context, letter, row, layout);
            });
        }
    };
}

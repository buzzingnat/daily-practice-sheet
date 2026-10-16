// Where everything goes in a cursive letter quadrant. Pure arithmetic: the exercise measures
// the font and hands the numbers in, so nothing here is tuned to one typeface and tests need no canvas.

// How tall a font sits above and below its baseline, as fractions of the font size
export interface FontMetrics {
    ascender: number;
    xHeight: number;
    descender: number;
}

// How far a letter's ink reaches left and right of its origin, as fractions of the font size
export interface LetterInk {
    left: number;
    right: number;
}

export type SlotKind = 'solid' | 'dotted' | 'blank';

export interface PracticeSlot {
    kind: SlotKind;
    // Where to put the glyph origin so the letter's ink sits centered in its slot
    originX: number;
}

export interface PracticeRow {
    topLineY: number;
    midLineY: number;
    baselineY: number;
    slots: readonly PracticeSlot[];
}

export interface CursiveLayout {
    modelFontSize: number;
    modelOriginX: number;
    modelBaselineY: number;
    practiceFontSize: number;
    guideLeftX: number;
    guideRightX: number;
    rows: readonly PracticeRow[];
}

// Left panel: the large model letter. Its room is generous, as stroke arrows will want it later.
export const MODEL_PANEL = { left: 12, top: 34, width: 80, height: 112 };
export const MODEL_FONT_SIZE_LIMIT = 106;
const MODEL_VERTICAL_ROOM = 0.05;

// Right area: the practice rows
export const PRACTICE_AREA_LEFT = 100;
export const PRACTICE_AREA_TOP = 30;
const PRACTICE_AREA_RIGHT_MARGIN = 8;
const PRACTICE_AREA_BOTTOM_MARGIN = 8;
const ROW_PADDING = 2;
export const SLOTS_PER_ROW = 4;
// The least air between neighbors, so one letter's tail does not shake hands with the next
export const SLOT_GAP = 4;

// Gradual release: two to trace solid, two to trace dotted, then a line to write alone
export const ROW_PATTERNS: readonly (readonly SlotKind[])[] = [
    ['solid', 'solid', 'dotted', 'dotted'],
    ['blank', 'blank', 'blank', 'blank']
];

function requirePositive(value: number, name: string): void {
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${name} must be a positive number, not ${value}.`);
    }
}

/**
 * Sizes and places the model, the practice rows and their guide lines for one letter.
 * The practice letters are as large as a row allows, but never so wide that four of them
 * overflow a line; wide letters such as m shrink to fit. Baselines sit in the same place for
 * every letter, while the top and middle lines follow the size actually drawn.
 */
export function planCursiveLayout(
    quadrantWidth: number,
    quadrantHeight: number,
    metrics: FontMetrics,
    ink: LetterInk
): CursiveLayout {
    requirePositive(metrics.ascender, 'ascender');
    requirePositive(metrics.xHeight, 'xHeight');
    requirePositive(metrics.descender, 'descender');
    requirePositive(ink.left + ink.right, 'ink width');

    const lineHeight = metrics.ascender + metrics.descender;
    const inkWidth = ink.left + ink.right;

    const modelFontSize = Math.min(
        MODEL_FONT_SIZE_LIMIT,
        MODEL_PANEL.width / inkWidth,
        MODEL_PANEL.height / (lineHeight + MODEL_VERTICAL_ROOM)
    );
    const modelOriginX = MODEL_PANEL.left + (MODEL_PANEL.width - inkWidth * modelFontSize) / 2 + ink.left * modelFontSize;
    const modelBaselineY = MODEL_PANEL.top + (MODEL_PANEL.height - lineHeight * modelFontSize) / 2 + metrics.ascender * modelFontSize;

    const areaWidth = quadrantWidth - PRACTICE_AREA_LEFT - PRACTICE_AREA_RIGHT_MARGIN;
    const areaHeight = quadrantHeight - PRACTICE_AREA_TOP - PRACTICE_AREA_BOTTOM_MARGIN;
    const rowHeight = areaHeight / ROW_PATTERNS.length;
    const slotWidth = areaWidth / SLOTS_PER_ROW;

    const rowFitSize = (rowHeight - ROW_PADDING) / lineHeight;
    const widthFitSize = (slotWidth - SLOT_GAP) / inkWidth;
    const practiceFontSize = Math.min(rowFitSize, widthFitSize);

    const rows = ROW_PATTERNS.map((pattern, rowIndex): PracticeRow => {
        const rowTop = PRACTICE_AREA_TOP + rowIndex * rowHeight;
        const baselineY = rowTop + ROW_PADDING / 2 + metrics.ascender * rowFitSize;
        const slots = pattern.map((kind, slotIndex): PracticeSlot => {
            const slotLeft = PRACTICE_AREA_LEFT + slotIndex * slotWidth;
            const originX = slotLeft + (slotWidth - inkWidth * practiceFontSize) / 2 + ink.left * practiceFontSize;
            return { kind, originX };
        });
        return {
            topLineY: baselineY - metrics.ascender * practiceFontSize,
            midLineY: baselineY - metrics.xHeight * practiceFontSize,
            baselineY,
            slots
        };
    });

    return {
        modelFontSize,
        modelOriginX,
        modelBaselineY,
        practiceFontSize,
        guideLeftX: PRACTICE_AREA_LEFT,
        guideRightX: PRACTICE_AREA_LEFT + areaWidth,
        rows
    };
}

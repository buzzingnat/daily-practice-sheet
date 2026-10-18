import { CursiveLayoutName } from '../../types';

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

// Where the picture goes: centered on a point, drawn at a font size
export interface EmojiPlacement {
    centerX: number;
    centerY: number;
    fontSize: number;
}

export interface CursiveLayout {
    modelFontSize: number;
    modelOriginX: number;
    modelBaselineY: number;
    emoji: EmojiPlacement;
    practiceFontSize: number;
    guideLeftX: number;
    guideRightX: number;
    rows: readonly PracticeRow[];
}

// Left panel: the model letter, with the picture below it. The panel is wide enough for the
// widest letter at the full model size, so every model is drawn at one size.
export const MODEL_PANEL = { left: 12, top: 24, width: 68, height: 85 };
export const MODEL_FONT_SIZE_LIMIT = 84;
const MODEL_VERTICAL_ROOM = 0.05;

// The picture sits under the model panel and above the quadrant's bottom margin
const EMOJI_GAP = 2;
const EMOJI_BOTTOM_MARGIN = 8;
// An emoji glyph fills most of its font size, and a little breathing room keeps it off the frame
const EMOJI_FILL = 0.85;

// The widest letter of the alphabet. Every practice letter is drawn at the size this one needs, so
// all of them match: consistency wins over the larger size a narrow letter could have had.
export const SIZING_LETTER = 'm';

// Right area: the practice rows, starting just past the model panel
const PRACTICE_AREA_GAP = 8;
export const PRACTICE_AREA_LEFT = MODEL_PANEL.left + MODEL_PANEL.width + PRACTICE_AREA_GAP;
export const PRACTICE_AREA_TOP = 30;
const PRACTICE_AREA_RIGHT_MARGIN = 8;
const PRACTICE_AREA_BOTTOM_MARGIN = 8;
const ROW_PADDING = 2;
// The least air between neighbors, so one letter's tail does not shake hands with the next
export const SLOT_GAP = 4;

// What each row holds, slot by slot. Gradual release: solid letters to trace, then dotted ones,
// and on the two-line layout a blank line to write alone. Every row has the same number of slots.
export const CURSIVE_LAYOUTS: Record<CursiveLayoutName, readonly (readonly SlotKind[])[]> = {
    'one-large-line': [
        ['solid', 'dotted', 'dotted']
    ],
    'two-lines': [
        ['solid', 'solid', 'dotted', 'dotted'],
        ['blank', 'blank', 'blank', 'blank']
    ]
};

function requirePositive(value: number, name: string): void {
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${name} must be a positive number, not ${value}.`);
    }
}

/**
 * Sizes and places the model, its picture, the practice rows and their guide lines for one letter.
 * The practice size comes from the widest letter (sizingInk, the ink of m): as large as a row
 * allows, but never so wide that a full line of the widest letter overflows. Every letter is
 * drawn at that one size, so the baselines and the top and middle lines are in the same place for
 * every letter, and each letter is centered in its slot by its own ink.
 */
export function planCursiveLayout(
    quadrantWidth: number,
    quadrantHeight: number,
    metrics: FontMetrics,
    ink: LetterInk,
    layout: CursiveLayoutName,
    sizingInk: LetterInk
): CursiveLayout {
    requirePositive(metrics.ascender, 'ascender');
    requirePositive(metrics.xHeight, 'xHeight');
    requirePositive(metrics.descender, 'descender');
    requirePositive(ink.left + ink.right, 'ink width');
    requirePositive(sizingInk.left + sizingInk.right, 'sizing ink width');

    const rowPatterns = CURSIVE_LAYOUTS[layout];
    const slotsPerRow = rowPatterns[0]?.length ?? 0;
    if (slotsPerRow === 0 || rowPatterns.some((pattern) => pattern.length !== slotsPerRow)) {
        throw new Error(`The ${layout} layout needs rows of one equal, nonzero length.`);
    }

    const lineHeight = metrics.ascender + metrics.descender;
    const inkWidth = ink.left + ink.right;

    const modelFontSize = Math.min(
        MODEL_FONT_SIZE_LIMIT,
        MODEL_PANEL.width / inkWidth,
        MODEL_PANEL.height / (lineHeight + MODEL_VERTICAL_ROOM)
    );
    const modelOriginX = MODEL_PANEL.left + (MODEL_PANEL.width - inkWidth * modelFontSize) / 2 + ink.left * modelFontSize;
    const modelBaselineY = MODEL_PANEL.top + (MODEL_PANEL.height - lineHeight * modelFontSize) / 2 + metrics.ascender * modelFontSize;

    const emojiTop = MODEL_PANEL.top + MODEL_PANEL.height + EMOJI_GAP;
    const emojiBoxHeight = quadrantHeight - EMOJI_BOTTOM_MARGIN - emojiTop;
    if (emojiBoxHeight <= 0) {
        throw new Error(`A quadrant ${quadrantHeight} tall leaves no room for the picture under the model.`);
    }
    const emoji: EmojiPlacement = {
        centerX: MODEL_PANEL.left + MODEL_PANEL.width / 2,
        centerY: emojiTop + emojiBoxHeight / 2,
        fontSize: Math.min(emojiBoxHeight, MODEL_PANEL.width) * EMOJI_FILL
    };

    const areaWidth = quadrantWidth - PRACTICE_AREA_LEFT - PRACTICE_AREA_RIGHT_MARGIN;
    const areaHeight = quadrantHeight - PRACTICE_AREA_TOP - PRACTICE_AREA_BOTTOM_MARGIN;
    const rowHeight = areaHeight / rowPatterns.length;
    const slotWidth = areaWidth / slotsPerRow;

    const rowFitSize = (rowHeight - ROW_PADDING) / lineHeight;
    // The widest letter sets the size; a letter wider than the sizing letter would still not overflow
    const widthFitSize = (slotWidth - SLOT_GAP) / Math.max(inkWidth, sizingInk.left + sizingInk.right);
    const practiceFontSize = Math.min(rowFitSize, widthFitSize);

    const rows = rowPatterns.map((pattern, rowIndex): PracticeRow => {
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
        emoji,
        practiceFontSize,
        guideLeftX: PRACTICE_AREA_LEFT,
        guideRightX: PRACTICE_AREA_LEFT + areaWidth,
        rows
    };
}

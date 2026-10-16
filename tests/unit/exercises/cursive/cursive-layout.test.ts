import { describe, expect, test } from 'vitest';
import {
    FontMetrics,
    LetterInk,
    MODEL_FONT_SIZE_LIMIT,
    MODEL_PANEL,
    PRACTICE_AREA_LEFT,
    ROW_PATTERNS,
    SLOTS_PER_ROW,
    SLOT_GAP,
    planCursiveLayout
} from '../../../../src/exercises/cursive/cursive-layout';

const QUADRANT_WIDTH = 266;
const QUADRANT_HEIGHT = 155;

// Measured from Learning Curve Regular: ascender of l, x-height, descender of g
const METRICS: FontMetrics = { ascender: 0.64, xHeight: 0.303, descender: 0.312 };

// Ink extents (left and right of the origin, per em) measured for a few letters
const INK_A: LetterInk = { left: 0.08, right: 0.44 };
const INK_I: LetterInk = { left: 0.08, right: 0.26 };
const INK_N: LetterInk = { left: 0.10, right: 0.52 };
const INK_M: LetterInk = { left: 0.11, right: 0.69 };

const EPSILON = 1e-9;

function layoutFor(ink: LetterInk) {
    return planCursiveLayout(QUADRANT_WIDTH, QUADRANT_HEIGHT, METRICS, ink);
}

describe('planCursiveLayout rows and slots', () => {
    const layout = layoutFor(INK_A);

    test('makes one row for each pattern', () => {
        expect(layout.rows).toHaveLength(ROW_PATTERNS.length);
    });

    test('puts exactly four slots on each line', () => {
        expect(SLOTS_PER_ROW).toBe(4);
        layout.rows.forEach((row) => expect(row.slots).toHaveLength(4));
    });

    test('traces two solid then two dotted on line one, then leaves line two blank', () => {
        expect(layout.rows[0]?.slots.map((slot) => slot.kind)).toEqual(['solid', 'solid', 'dotted', 'dotted']);
        expect(layout.rows[1]?.slots.map((slot) => slot.kind)).toEqual(['blank', 'blank', 'blank', 'blank']);
    });

    test('orders the guide lines top, middle, base within each row', () => {
        layout.rows.forEach((row) => {
            expect(row.topLineY).toBeLessThan(row.midLineY);
            expect(row.midLineY).toBeLessThan(row.baselineY);
        });
    });

    test('keeps every row and its descender inside the quadrant', () => {
        layout.rows.forEach((row) => {
            expect(row.topLineY).toBeGreaterThanOrEqual(0);
            expect(row.baselineY + METRICS.descender * layout.practiceFontSize).toBeLessThanOrEqual(QUADRANT_HEIGHT);
        });
    });

    test('does not let the first row descender reach the second row top line', () => {
        const first = layout.rows[0];
        const second = layout.rows[1];
        expect(first && second && first.baselineY + METRICS.descender * layout.practiceFontSize <= second.topLineY).toBe(true);
    });

    test('draws the guide lines from the practice area edge to its right margin', () => {
        expect(layout.guideLeftX).toBe(PRACTICE_AREA_LEFT);
        expect(layout.guideRightX).toBeGreaterThan(layout.guideLeftX);
        expect(layout.guideRightX).toBeLessThan(QUADRANT_WIDTH);
    });
});

describe('planCursiveLayout letter size', () => {
    test('draws a narrow letter as large as the row allows', () => {
        const rowHeight = (QUADRANT_HEIGHT - 30 - 8) / ROW_PATTERNS.length;
        const rowFit = (rowHeight - 2) / (METRICS.ascender + METRICS.descender);
        expect(layoutFor(INK_A).practiceFontSize).toBeCloseTo(rowFit, 9);
        expect(layoutFor(INK_I).practiceFontSize).toBeCloseTo(rowFit, 9);
    });

    test('shrinks a wide letter so four still fit on a line', () => {
        expect(layoutFor(INK_M).practiceFontSize).toBeLessThan(layoutFor(INK_A).practiceFontSize);
        expect(layoutFor(INK_N).practiceFontSize).toBeLessThan(layoutFor(INK_A).practiceFontSize);
    });

    test('keeps the practice size at or above 44pt even for the widest letter, m', () => {
        expect(layoutFor(INK_M).practiceFontSize).toBeGreaterThan(43);
    });

    test('never lets a letter, or the gap to its neighbor, overflow its slot', () => {
        let inkWidth = 0.2;
        while (inkWidth <= 0.9) {
            const ink: LetterInk = { left: 0.1, right: inkWidth - 0.1 };
            const layout = layoutFor(ink);
            const slots = layout.rows[0]?.slots ?? [];
            slots.forEach((slot, index) => {
                const inkLeft = slot.originX - ink.left * layout.practiceFontSize;
                const inkRight = slot.originX + ink.right * layout.practiceFontSize;
                const next = slots[index + 1];
                if (next) {
                    const nextInkLeft = next.originX - ink.left * layout.practiceFontSize;
                    expect(nextInkLeft - inkRight).toBeGreaterThanOrEqual(SLOT_GAP - EPSILON);
                }
                expect(inkLeft).toBeGreaterThanOrEqual(PRACTICE_AREA_LEFT - EPSILON);
                expect(inkRight).toBeLessThanOrEqual(layout.guideRightX + EPSILON);
            });
            inkWidth = inkWidth + 0.05;
        }
    });

    test('puts the baselines in the same place for every letter', () => {
        const baselinesA = layoutFor(INK_A).rows.map((row) => row.baselineY);
        expect(layoutFor(INK_M).rows.map((row) => row.baselineY)).toEqual(baselinesA);
        expect(layoutFor(INK_I).rows.map((row) => row.baselineY)).toEqual(baselinesA);
    });

    test('moves the top and middle lines with the size actually drawn', () => {
        const wide = layoutFor(INK_M).rows[0];
        const narrow = layoutFor(INK_A).rows[0];
        expect(wide && narrow && wide.topLineY > narrow.topLineY).toBe(true);
        expect(wide && narrow && wide.midLineY > narrow.midLineY).toBe(true);
    });

    test('spaces the four slots evenly', () => {
        const slots = layoutFor(INK_A).rows[0]?.slots ?? [];
        const gaps = slots.slice(1).map((slot, index) => slot.originX - (slots[index]?.originX ?? 0));
        gaps.forEach((gap) => expect(gap).toBeCloseTo(gaps[0] ?? 0, 9));
    });
});

describe('planCursiveLayout model panel', () => {
    test('draws a narrow letter at the model size limit', () => {
        expect(layoutFor(INK_A).modelFontSize).toBeCloseTo(MODEL_FONT_SIZE_LIMIT, 9);
    });

    test('shrinks the model when the letter is too wide for its panel', () => {
        expect(layoutFor(INK_M).modelFontSize).toBeLessThan(MODEL_FONT_SIZE_LIMIT);
    });

    test('keeps the model ink inside its panel', () => {
        [INK_A, INK_I, INK_N, INK_M].forEach((ink) => {
            const layout = layoutFor(ink);
            const inkLeft = layout.modelOriginX - ink.left * layout.modelFontSize;
            const inkRight = layout.modelOriginX + ink.right * layout.modelFontSize;
            expect(inkLeft).toBeGreaterThanOrEqual(MODEL_PANEL.left - EPSILON);
            expect(inkRight).toBeLessThanOrEqual(MODEL_PANEL.left + MODEL_PANEL.width + EPSILON);
        });
    });

    test('keeps the model between the panel top and bottom, descender included', () => {
        const layout = layoutFor(INK_A);
        expect(layout.modelBaselineY - METRICS.ascender * layout.modelFontSize).toBeGreaterThanOrEqual(MODEL_PANEL.top - EPSILON);
        expect(layout.modelBaselineY + METRICS.descender * layout.modelFontSize).toBeLessThanOrEqual(MODEL_PANEL.top + MODEL_PANEL.height + EPSILON);
    });
});

describe('planCursiveLayout bad input', () => {
    test.each([
        ['ascender', { ...METRICS, ascender: 0 }, INK_A],
        ['xHeight', { ...METRICS, xHeight: -1 }, INK_A],
        ['descender', { ...METRICS, descender: Number.NaN }, INK_A],
        ['ink width', METRICS, { left: 0, right: 0 }]
    ])('throws on a non-positive %s', (unused, metrics, ink) => {
        expect(() => planCursiveLayout(QUADRANT_WIDTH, QUADRANT_HEIGHT, metrics, ink)).toThrow();
    });
});

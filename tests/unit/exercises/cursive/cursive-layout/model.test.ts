import { describe, expect, test } from 'vitest';
import {
    MODEL_FONT_SIZE_LIMIT,
    MODEL_PANEL,
    planCursiveLayout
} from '../../../../../src/exercises/cursive/cursive-layout';
import { CURSIVE_LAYOUT_NAMES, CursiveLayoutName } from '../../../../../src/types';
import {
    EPSILON,
    INK_A,
    INK_M,
    METRICS,
    MEASURED_INK,
    MEASURED_LETTERS,
    QUADRANT_HEIGHT,
    QUADRANT_WIDTH,
    layoutFor
} from '../../../../support/cursive-fixtures';

describe('the model panel', () => {

    test.each(CURSIVE_LAYOUT_NAMES)('draws every letter at the limit on the %s layout, since the panel fits the widest', (name: CursiveLayoutName) => {
        MEASURED_LETTERS.forEach((letter) => {
            expect(layoutFor(MEASURED_INK[letter] ?? INK_A, name).modelFontSize).toBeCloseTo(MODEL_FONT_SIZE_LIMIT, 9);
        });
    });

    test('keeps the model ink of every letter inside its panel', () => {
        MEASURED_LETTERS.forEach((letter) => {
            const ink = MEASURED_INK[letter] ?? INK_A;
            const layout = layoutFor(ink, 'one-large-line');
            const inkLeft = layout.modelOriginX - ink.left * layout.modelFontSize;
            const inkRight = layout.modelOriginX + ink.right * layout.modelFontSize;
            expect(inkLeft).toBeGreaterThanOrEqual(MODEL_PANEL.left - EPSILON);
            expect(inkRight).toBeLessThanOrEqual(MODEL_PANEL.left + MODEL_PANEL.width + EPSILON);
        });
    });

    test('shrinks the model only when a letter is wider than the panel allows', () => {
        const wider = { left: 0.1, right: 1.1 };
        expect(layoutFor(wider, 'one-large-line').modelFontSize).toBeLessThan(MODEL_FONT_SIZE_LIMIT);
    });

    test('keeps the model between the panel top and bottom, descender included', () => {
        const layout = layoutFor(INK_A, 'one-large-line');
        expect(layout.modelBaselineY - METRICS.ascender * layout.modelFontSize).toBeGreaterThanOrEqual(MODEL_PANEL.top - EPSILON);
        expect(layout.modelBaselineY + METRICS.descender * layout.modelFontSize).toBeLessThanOrEqual(MODEL_PANEL.top + MODEL_PANEL.height + EPSILON);
    });

    test('gives the model the same size on every layout, since the panel does not change', () => {
        expect(layoutFor(INK_M, 'one-large-line').modelFontSize).toBe(layoutFor(INK_M, 'two-lines').modelFontSize);
    });
});

describe('the picture under the model', () => {
    const layout = layoutFor(INK_A, 'one-large-line');
    const half = layout.emoji.fontSize / 2;

    test('sits below the model panel', () => {
        expect(layout.emoji.centerY - half).toBeGreaterThanOrEqual(MODEL_PANEL.top + MODEL_PANEL.height);
    });

    test('stays inside the quadrant', () => {
        expect(layout.emoji.centerY + half).toBeLessThanOrEqual(QUADRANT_HEIGHT);
        expect(layout.emoji.centerX - half).toBeGreaterThanOrEqual(0);
    });

    test('is centered under the model panel', () => {
        expect(layout.emoji.centerX).toBeCloseTo(MODEL_PANEL.left + MODEL_PANEL.width / 2, 9);
    });


    test('is the same on every layout and for every letter', () => {
        MEASURED_LETTERS.forEach((letter) => {
            expect(layoutFor(MEASURED_INK[letter] ?? INK_A, 'two-lines').emoji).toEqual(layout.emoji);
        });
    });

    test('is refused in a quadrant too short to hold it', () => {
        expect(() => planCursiveLayout(QUADRANT_WIDTH, 100, METRICS, INK_A, 'two-lines', INK_M)).toThrow(/room for the picture/);
    });
});

describe('planCursiveLayout bad input', () => {
    test.each([
        ['ascender', { ...METRICS, ascender: 0 }, INK_A],
        ['xHeight', { ...METRICS, xHeight: -1 }, INK_A],
        ['descender', { ...METRICS, descender: Number.NaN }, INK_A],
        ['ink width', METRICS, { left: 0, right: 0 }]
    ])('throws on a non-positive %s', (unused, metrics, ink) => {
        expect(() => planCursiveLayout(QUADRANT_WIDTH, QUADRANT_HEIGHT, metrics, ink, 'one-large-line', INK_M)).toThrow();
    });
});

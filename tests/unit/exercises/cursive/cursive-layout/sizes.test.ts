import { describe, expect, test } from 'vitest';
import {
    CURSIVE_LAYOUTS,
    LetterInk,
    PRACTICE_AREA_LEFT,
    SIZING_LETTER,
    SLOT_GAP,
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
    inkWidth,
    layoutFor
} from '../../../../support/cursive-fixtures';

// The practice area is 30 down and 8 up from the quadrant edges, with 2pt of row padding, and 8 at the right
function slotWidth(name: CursiveLayoutName): number {
    return (QUADRANT_WIDTH - PRACTICE_AREA_LEFT - 8) / (CURSIVE_LAYOUTS[name][0]?.length ?? 1);
}

function rowFitSize(name: CursiveLayoutName): number {
    const rowHeight = (QUADRANT_HEIGHT - 30 - 8) / CURSIVE_LAYOUTS[name].length;
    return (rowHeight - 2) / (METRICS.ascender + METRICS.descender);
}

// What m, the widest letter, allows: the size every letter is drawn at
function expectedSize(name: CursiveLayoutName): number {
    return Math.min(rowFitSize(name), (slotWidth(name) - SLOT_GAP) / inkWidth(INK_M));
}

describe('the sizing letter', () => {
    test('is m', () => {
        expect(SIZING_LETTER).toBe('m');
    });

    test('is the widest letter of the alphabet, by measurement', () => {
        const widest = [...MEASURED_LETTERS].sort((first, second) =>
            inkWidth(MEASURED_INK[second] ?? INK_A) - inkWidth(MEASURED_INK[first] ?? INK_A))[0];
        expect(widest).toBe(SIZING_LETTER);
    });
});

describe.each(CURSIVE_LAYOUT_NAMES)('the %s layout letter size', (name: CursiveLayoutName) => {
    test('is set by the widest letter: as large as a row allows, no wider than m needs', () => {
        expect(layoutFor(INK_A, name).practiceFontSize).toBeCloseTo(expectedSize(name), 9);
    });

    test('draws every letter of the alphabet at one size', () => {
        const sizes = new Set(MEASURED_LETTERS.map((letter) => layoutFor(MEASURED_INK[letter] ?? INK_A, name).practiceFontSize));
        expect(sizes.size).toBe(1);
    });

    test('puts every line in the same place for every letter', () => {
        const reference = layoutFor(INK_A, name).rows.map((row) => [row.topLineY, row.midLineY, row.baselineY]);
        MEASURED_LETTERS.forEach((letter) => {
            const rows = layoutFor(MEASURED_INK[letter] ?? INK_A, name).rows.map((row) => [row.topLineY, row.midLineY, row.baselineY]);
            expect(rows).toEqual(reference);
        });
    });

    test('never lets any letter, or the gap to its neighbor, overflow its slot', () => {
        MEASURED_LETTERS.forEach((letter) => {
            const ink = MEASURED_INK[letter] ?? INK_A;
            const layout = layoutFor(ink, name);
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
        });
    });

    test('centers each letter in its slot by its own ink', () => {
        MEASURED_LETTERS.forEach((letter) => {
            const ink = MEASURED_INK[letter] ?? INK_A;
            const layout = layoutFor(ink, name);
            const width = slotWidth(name);
            layout.rows[0]?.slots.forEach((slot, index) => {
                const inkCenter = slot.originX + ((ink.right - ink.left) / 2) * layout.practiceFontSize;
                expect(inkCenter).toBeCloseTo(PRACTICE_AREA_LEFT + width * index + width / 2, 9);
            });
        });
    });

    test('spaces the slots evenly', () => {
        const slots = layoutFor(INK_A, name).rows[0]?.slots ?? [];
        const gaps = slots.slice(1).map((slot, index) => slot.originX - (slots[index]?.originX ?? 0));
        gaps.forEach((gap) => expect(gap).toBeCloseTo(gaps[0] ?? 0, 9));
    });

    test('still keeps a letter wider than m inside its slot, by shrinking below the usual size', () => {
        const wider: LetterInk = { left: 0.1, right: 0.95 };
        const layout = layoutFor(wider, name);
        expect(layout.practiceFontSize).toBeLessThan(expectedSize(name));
        const slot = layout.rows[0]?.slots[0];
        expect(slot && slot.originX + wider.right * layout.practiceFontSize <= PRACTICE_AREA_LEFT + slotWidth(name) + EPSILON).toBe(true);
    });
});

describe('the sizes at which the two layouts draw every letter', () => {
    test('two lines: close to 48pt, as m needs', () => {
        expect(layoutFor(INK_A, 'two-lines').practiceFontSize).toBeGreaterThan(46);
        expect(layoutFor(INK_A, 'two-lines').practiceFontSize).toBeLessThan(50);
    });

    test('one large line: close to 66pt, as m needs', () => {
        expect(layoutFor(INK_A, 'one-large-line').practiceFontSize).toBeGreaterThan(64);
        expect(layoutFor(INK_A, 'one-large-line').practiceFontSize).toBeLessThan(68);
    });

    test('one large line is at least 1.3 times the size of two lines', () => {
        const large = layoutFor(INK_A, 'one-large-line').practiceFontSize;
        const small = layoutFor(INK_A, 'two-lines').practiceFontSize;
        expect(large / small).toBeGreaterThanOrEqual(1.3);
    });
});

describe('planCursiveLayout sizing input', () => {
    test('throws on a sizing ink with no width', () => {
        expect(() => planCursiveLayout(QUADRANT_WIDTH, QUADRANT_HEIGHT, METRICS, INK_A, 'two-lines', { left: 0, right: 0 })).toThrow(/sizing/);
    });
});

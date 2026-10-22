import { describe, expect, test } from 'vitest';
import {
    CURSIVE_LAYOUTS,
    MODEL_PANEL,
    PRACTICE_AREA_LEFT
} from '../../../../../src/exercises/cursive/cursive-layout';
import { CURSIVE_LAYOUT_NAMES, CursiveLayoutName, DEFAULT_CURSIVE_LAYOUT } from '../../../../../src/types';
import { INK_A, METRICS, QUADRANT_HEIGHT, QUADRANT_WIDTH, layoutFor } from '../../../../support/cursive-fixtures';

describe('CURSIVE_LAYOUTS', () => {


    test('gives every row of a layout the same number of slots', () => {
        CURSIVE_LAYOUT_NAMES.forEach((name) => {
            const lengths = new Set(CURSIVE_LAYOUTS[name].map((pattern) => pattern.length));
            expect(lengths.size).toBe(1);
        });
    });
});

describe('one large line', () => {
    const layout = layoutFor(INK_A, 'one-large-line');

    test('has a single row of three slots: solid, dotted, dotted', () => {
        expect(layout.rows).toHaveLength(1);
        expect(layout.rows[0]?.slots.map((slot) => slot.kind)).toEqual(['solid', 'dotted', 'dotted']);
    });

    test('has no blank slot, since it is for tracing only', () => {
        expect(layout.rows.flatMap((row) => row.slots).filter((slot) => slot.kind === 'blank')).toEqual([]);
    });
});

describe('two lines', () => {
    const layout = layoutFor(INK_A, 'two-lines');

    test('traces two solid then two dotted on line one, then leaves line two blank', () => {
        expect(layout.rows).toHaveLength(2);
        expect(layout.rows[0]?.slots.map((slot) => slot.kind)).toEqual(['solid', 'solid', 'dotted', 'dotted']);
        expect(layout.rows[1]?.slots.map((slot) => slot.kind)).toEqual(['blank', 'blank', 'blank', 'blank']);
    });

    test('does not let the first row descender reach the second row top line', () => {
        const first = layout.rows[0];
        const second = layout.rows[1];
        expect(first && second && first.baselineY + METRICS.descender * layout.practiceFontSize <= second.topLineY).toBe(true);
    });
});

describe.each(CURSIVE_LAYOUT_NAMES)('the %s layout guides', (name: CursiveLayoutName) => {
    const layout = layoutFor(INK_A, name);

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

    test('stacks the rows from top to bottom', () => {
        const baselines = layout.rows.map((row) => row.baselineY);
        expect(baselines).toEqual([...baselines].sort((first, second) => first - second));
    });

    test('draws the guide lines from just past the model panel to the right margin', () => {
        expect(layout.guideLeftX).toBe(PRACTICE_AREA_LEFT);
        expect(PRACTICE_AREA_LEFT).toBeGreaterThan(MODEL_PANEL.left + MODEL_PANEL.width);
        expect(layout.guideRightX).toBeGreaterThan(layout.guideLeftX);
        expect(layout.guideRightX).toBeLessThan(QUADRANT_WIDTH);
    });
});

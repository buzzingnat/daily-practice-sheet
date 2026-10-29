import { describe, expect, test } from 'vitest';
import {
    clampHalfPageCount,
    DEFAULT_HALF_PAGES,
    describePrintSize,
    MAXIMUM_HALF_PAGES,
    MINIMUM_HALF_PAGES
} from '../../../src/settings/print-size';

const EVERY_ALLOWED_COUNT = Array.from(
    { length: MAXIMUM_HALF_PAGES - MINIMUM_HALF_PAGES + 1 },
    (unused, index) => MINIMUM_HALF_PAGES + index
);

describe('clampHalfPageCount', () => {
    test('clamps zero up to the minimum', () => {
        expect(clampHalfPageCount(0)).toBe(MINIMUM_HALF_PAGES);
    });

    test('clamps a negative up to the minimum', () => {
        expect(clampHalfPageCount(-4)).toBe(MINIMUM_HALF_PAGES);
    });

    test('clamps a huge count down to the maximum', () => {
        expect(clampHalfPageCount(99)).toBe(MAXIMUM_HALF_PAGES);
    });

    test('rounds a fraction', () => {
        expect(clampHalfPageCount(2.6)).toBe(3);
    });

    test('falls back to the default for not-a-number', () => {
        expect(clampHalfPageCount(Number.NaN)).toBe(DEFAULT_HALF_PAGES);
    });

    test('leaves every valid count alone', () => {
        const changed = EVERY_ALLOWED_COUNT.filter((halfPageCount) => clampHalfPageCount(halfPageCount) !== halfPageCount);
        expect(changed).toEqual([]);
    });
});

describe('describePrintSize', () => {
    test('counts the pages touched, and flags an odd half-page left over, for every allowed count', () => {
        const wrong = EVERY_ALLOWED_COUNT.filter((halfPageCount) => {
            const description = describePrintSize(halfPageCount);
            return description.pageCount !== Math.ceil(halfPageCount / 2) || description.hasHalfPageRemainder !== (halfPageCount % 2 === 1);
        });
        expect(wrong).toEqual([]);
    });
});

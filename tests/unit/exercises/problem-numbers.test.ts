import { describe, expect, test } from 'vitest';
import { pickFromWithRareZero, pickRandomWithRareZero } from '../../../src/exercises/problem-numbers';
import { createSeededRandom } from '../../support/seeded-random';

const DRAWS = 20000;

describe('pickRandomWithRareZero', () => {
    test('returns 0 when 0 is the only choice', () => {
        expect(pickRandomWithRareZero(0, createSeededRandom(1))).toBe(0);
        expect(pickRandomWithRareZero(-3, createSeededRandom(1))).toBe(0);
    });

    test('stays within range and still produces every value, 0 included', () => {
        const offenders: string[] = [];
        for (const maxInclusive of [1, 4, 9]) {
            const random = createSeededRandom(maxInclusive);
            const counts = new Array<number>(maxInclusive + 1).fill(0);
            for (let draw = 0; draw < DRAWS; draw++) {
                const value = pickRandomWithRareZero(maxInclusive, random);
                if (!Number.isInteger(value) || value < 0 || value > maxInclusive) {
                    offenders.push(`max ${maxInclusive} gave ${value}`);
                } else {
                    counts[value] = (counts[value] ?? 0) + 1;
                }
            }
            counts.forEach((count, value) => {
                if (count === 0) {
                    offenders.push(`max ${maxInclusive} never gave ${value}`);
                }
            });
        }
        expect(offenders).toEqual([]);
    });

    test('0 is rarer than every other value', () => {
        const offenders: string[] = [];
        for (const maxInclusive of [1, 4, 9]) {
            const random = createSeededRandom(100 + maxInclusive);
            const counts = new Array<number>(maxInclusive + 1).fill(0);
            for (let draw = 0; draw < DRAWS; draw++) {
                const value = pickRandomWithRareZero(maxInclusive, random);
                counts[value] = (counts[value] ?? 0) + 1;
            }
            const zeroCount = counts[0] ?? 0;
            for (let value = 1; value <= maxInclusive; value++) {
                if (zeroCount >= (counts[value] ?? 0)) {
                    offenders.push(`max ${maxInclusive}: 0 came ${zeroCount} times, ${value} came ${counts[value]}`);
                }
            }
        }
        expect(offenders).toEqual([]);
    });
});

describe('pickFromWithRareZero', () => {
    test('returns only listed numbers, and a lone number every time', () => {
        const random = createSeededRandom(5);
        expect(Array.from({ length: 50 }, () => pickFromWithRareZero([7], random))).toEqual(new Array<number>(50).fill(7));
        const offenders = Array.from({ length: DRAWS }, () => pickFromWithRareZero([2, 5, 9], random)).filter((value) => ![2, 5, 9].includes(value));
        expect(offenders).toEqual([]);
    });

    test('offers a listed zero, but less often than every other entry', () => {
        const random = createSeededRandom(11);
        const counts = new Map<number, number>();
        for (let draw = 0; draw < DRAWS; draw++) {
            const value = pickFromWithRareZero([0, 3, 8, 12], random);
            counts.set(value, (counts.get(value) ?? 0) + 1);
        }
        const zeroCount = counts.get(0) ?? 0;
        expect(zeroCount).toBeGreaterThan(0);
        const offenders = [3, 8, 12].filter((value) => (counts.get(value) ?? 0) <= zeroCount);
        expect(offenders).toEqual([]);
    });
});

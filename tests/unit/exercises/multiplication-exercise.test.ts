import { describe, expect, test } from 'vitest';
import { generateMultiplicationProblems, MultiplicationProblem } from '../../../src/exercises/multiplication-exercise';
import { MultiplicationSettings } from '../../../src/types';
import { countBy } from '../../support/count-by';
import { createSeededRandom } from '../../support/seeded-random';

const SEEDS = 200;
// The zero rule compares frequencies, so it wants a larger crowd than the range rules
const ZERO_SEEDS = 100;

function problemSetsOver(settings: MultiplicationSettings, seeds: number): MultiplicationProblem[][] {
    const problemSets: MultiplicationProblem[][] = [];
    for (let seed = 1; seed <= seeds; seed++) {
        problemSets.push(generateMultiplicationProblems(settings, createSeededRandom(seed)));
    }
    return problemSets;
}

function factorsOf(problemSets: MultiplicationProblem[][]): { tops: number[]; bottoms: number[] } {
    const problems = problemSets.flat();
    return { tops: problems.map((problem) => problem.topNumber), bottoms: problems.map((problem) => problem.bottomNumber) };
}

// The drawing, answers included, is checked in arithmetic-answers.test.ts
describe('multiplication problems', () => {
    const settingsToTry: [string, MultiplicationSettings][] = [
        ['a run of numbers', { mode: 'tables', factors: [1, 2, 3, 4, 5] }],
        ['numbers with a gap', { mode: 'tables', factors: [2, 7, 12] }],
        ['two numbers', { mode: 'tables', factors: [3, 4] }],
        ['a single number', { mode: 'tables', factors: [7] }],
        ['zero beside another number', { mode: 'tables', factors: [0, 1] }],
        ['two digit', { mode: 'two-digit' }]
    ];

    test('come three at a time, all different, for every kind of setting', () => {
        const offenders = settingsToTry.flatMap(([name, settings]) => problemSetsOver(settings, SEEDS)
            .filter((problems) => problems.length !== 3 || new Set(problems.map((problem) => `${problem.topNumber}x${problem.bottomNumber}`)).size !== 3)
            .map((problems) => `${name}: ${JSON.stringify(problems)}`));
        expect(offenders).toEqual([]);
    });

    test('take both factors of a times table from the chosen numbers', () => {
        const factors = [2, 7, 12];
        const { tops, bottoms } = factorsOf(problemSetsOver({ mode: 'tables', factors }, SEEDS));
        expect([...tops, ...bottoms].filter((value) => !factors.includes(value))).toEqual([]);
    });

    test('pair a lone number with 1 to 12', () => {
        const { tops, bottoms } = factorsOf(problemSetsOver({ mode: 'tables', factors: [7] }, SEEDS));
        expect(tops.filter((top) => top !== 7)).toEqual([]);
        expect(bottoms.filter((bottom) => bottom < 1 || bottom > 12)).toEqual([]);
    });

    test('set a two-digit number times a one-digit number in two-digit mode', () => {
        const { tops, bottoms } = factorsOf(problemSetsOver({ mode: 'two-digit' }, SEEDS));
        expect(tops.filter((top) => top < 10 || top > 99)).toEqual([]);
        expect(bottoms.filter((bottom) => bottom < 2 || bottom > 9)).toEqual([]);
    });

    // Zero carries a quarter of another number's weight; half sits well above that and well below an even draw
    test('make zero less than half as common as any other chosen number', () => {
        const { tops, bottoms } = factorsOf(problemSetsOver({ mode: 'tables', factors: [0, 1, 2, 3, 4, 5] }, ZERO_SEEDS));
        const counts = countBy([...tops, ...bottoms]);
        const zeroCount = counts.get(0) ?? 0;
        // Rare, not vanished: a quarter of the expected share would still clear this floor
        expect(zeroCount * 16).toBeGreaterThan(Math.min(...[1, 2, 3, 4, 5].map((value) => counts.get(value) ?? 0)));
        expect([1, 2, 3, 4, 5].filter((value) => (counts.get(value) ?? 0) <= zeroCount * 2)).toEqual([]);
    });
});

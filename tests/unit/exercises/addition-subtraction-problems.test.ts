import { describe, expect, test } from 'vitest';
import { AdditionProblem, generateAdditionProblems } from '../../../src/exercises/addition-exercise';
import { generateSubtractionProblems } from '../../../src/exercises/subtraction-exercise';
import { GradeLevel, RandomSource } from '../../../src/types';
import { countBy } from '../../support/count-by';
import { createSeededRandom } from '../../support/seeded-random';

const LEVELS: GradeLevel[] = ['1st', '2nd', '3rd'];
// The zero rule compares counts, so it wants a larger crowd than the range rules
const FIRST_GRADE_SEEDS = 200;
const SEEDS = 200;

// Addition and subtraction problems share a shape, so one type serves both
type Generate = (gradeLevel: GradeLevel, random: RandomSource) => AdditionProblem[];

function problemSetsOver(generate: Generate, level: GradeLevel, seeds: number): AdditionProblem[][] {
    const problemSets: AdditionProblem[][] = [];
    for (let seed = 1; seed <= seeds; seed++) {
        problemSets.push(generate(level, createSeededRandom(seed)));
    }
    return problemSets;
}

describe.each([
    {
        name: 'addition',
        generate: generateAdditionProblems,
        answer: (top: number, bottom: number) => top + bottom,
        // A top ending in 9 leaves room only for zero, so the generator draws again
        onlyZeroFits: (top: number) => top % 10 === 9,
        // No carrying: the ones place stays short of ten
        isFirstGrade: (top: number, bottom: number) => (top % 10) + bottom < 10
    },
    {
        name: 'subtraction',
        generate: generateSubtractionProblems,
        answer: (top: number, bottom: number) => top - bottom,
        // A top ending in 0 leaves room only for zero, so the generator draws again
        onlyZeroFits: (top: number) => top % 10 === 0,
        // No borrowing: the bottom fits inside the ones place of the top
        isFirstGrade: (top: number, bottom: number) => bottom <= top % 10
    }
])('$name problems', (kind) => {
    test('come three at a time, all different, and never ask for an answer of zero or less', () => {
        const offenders = LEVELS.flatMap((level) => problemSetsOver(kind.generate, level, SEEDS)
            .filter((problems) => {
                const keys = new Set(problems.map((problem) => `${problem.topNumber},${problem.bottomNumber}`));
                return problems.length !== 3 || keys.size !== 3 || problems.some((problem) => kind.answer(problem.topNumber, problem.bottomNumber) <= 0);
            })
            .map((problems) => `${level}: ${JSON.stringify(problems)}`));
        expect(offenders).toEqual([]);
    });

    const firstGrade = problemSetsOver(kind.generate, '1st', FIRST_GRADE_SEEDS).flat();

    test('need no carrying or borrowing in first grade, and never set a problem only zero can finish', () => {
        expect(firstGrade).toHaveLength(FIRST_GRADE_SEEDS * 3);
        expect(firstGrade.filter((problem) => !kind.isFirstGrade(problem.topNumber, problem.bottomNumber))).toEqual([]);
        expect(firstGrade.filter((problem) => kind.onlyZeroFits(problem.topNumber))).toEqual([]);
    });

    test('offer zero in first grade, at under half the share of a typical bottom number for the same top', () => {
        // Large bottoms fit under few tops, so zero is weighed against its own top's other bottoms, and
        // the tops are pooled so no single small count decides. Zero carries a quarter of another number's
        // weight; half sits well above that and well below an even draw.
        const byTop = new Map<number, number[]>();
        firstGrade.forEach((problem) => byTop.set(problem.topNumber, [...(byTop.get(problem.topNumber) ?? []), problem.bottomNumber]));
        let zeroTotal = 0;
        let typicalTotal = 0;
        byTop.forEach((bottoms) => {
            const counts = countBy(bottoms);
            const zeroCount = counts.get(0) ?? 0;
            const otherCounts = [...counts.entries()].filter(([bottom]) => bottom !== 0).map(([, count]) => count);
            zeroTotal += zeroCount;
            typicalTotal += otherCounts.reduce((sum, count) => sum + count, 0) / Math.max(otherCounts.length, 1);
        });
        // Rare, not vanished: a quarter of the expected share would still clear this floor
        expect(zeroTotal * 16).toBeGreaterThan(typicalTotal);
        expect(zeroTotal * 2).toBeLessThan(typicalTotal);
    });
});

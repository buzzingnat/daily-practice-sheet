import { afterEach, describe, expect, test, vi } from 'vitest';
import { createDivisionExercise } from '../../../src/exercises/division-exercise';
import { GradeLevel } from '../../../src/types';
import { createRecordingContext, RecordedText } from '../../support/recording-context';
import { createSeededRandom } from '../../support/seeded-random';

const LEVELS: GradeLevel[] = ['1st', '2nd', '3rd'];
const SEEDS = 200;
const PROBLEM_ROW_Y = 40 + 42 + 20;
const ANSWER_ROW_Y = 40 + 24;

// Largest dividend and divisor each level may set, and the smallest dividend
const LIMITS: Record<GradeLevel, { smallestDividend: number; largestDividend: number; largestDivisor: number }> = {
    '1st': { smallestDividend: 2, largestDividend: 25, largestDivisor: 5 },
    '2nd': { smallestDividend: 4, largestDividend: 108, largestDivisor: 9 },
    '3rd': { smallestDividend: 100, largestDividend: 999, largestDivisor: 9 }
};

afterEach(() => {
    vi.restoreAllMocks();
});

function numbersAt(texts: RecordedText[], y: number): number[] {
    return texts.filter((entry) => entry.y === y && /^\d+$/.test(entry.text)).map((entry) => Number(entry.text));
}

describe('division', () => {
    test('sets only even problems, within the limits of its level, with no repeats', () => {
        const offenders: string[] = [];
        for (const level of LEVELS) {
            const limits = LIMITS[level];
            for (let seed = 1; seed <= SEEDS; seed++) {
                vi.spyOn(Math, 'random').mockImplementation(createSeededRandom(seed));
                const drawn = createRecordingContext();
                createDivisionExercise(level).render(drawn.quadrantContext);
                // Each bracket draws its divisor, then its dividend, on one row
                const row = numbersAt(drawn.texts, PROBLEM_ROW_Y);
                const pairs: string[] = [];
                for (let index = 0; index < row.length; index += 2) {
                    const divisor = row[index] as number;
                    const dividend = row[index + 1] as number;
                    pairs.push(`${dividend}/${divisor}`);
                    const valid = divisor >= 2 && divisor <= limits.largestDivisor
                        && dividend % divisor === 0
                        && dividend >= limits.smallestDividend && dividend <= limits.largestDividend;
                    if (!valid) {
                        offenders.push(`${level} seed ${seed}: ${dividend}/${divisor}`);
                    }
                }
                if (pairs.length !== 3 || new Set(pairs).size !== 3) {
                    offenders.push(`${level} seed ${seed}: ${pairs.join()}`);
                }
            }
        }
        expect(offenders).toEqual([]);
    });

    test('writes each quotient in the box of the problem it belongs to, and none on the worksheet', () => {
        const offenders: string[] = [];
        for (const level of LEVELS) {
            for (let seed = 1; seed <= SEEDS; seed++) {
                vi.spyOn(Math, 'random').mockImplementation(createSeededRandom(seed));
                const exercise = createDivisionExercise(level);
                const plain = createRecordingContext();
                const answered = createRecordingContext();
                exercise.render(plain.quadrantContext);
                exercise.renderAnswers?.(answered.quadrantContext);

                const row = numbersAt(answered.texts, PROBLEM_ROW_Y);
                const expected = [0, 1, 2].map((index) => (row[index * 2 + 1] as number) / (row[index * 2] as number));
                const results = numbersAt(answered.texts, ANSWER_ROW_Y);
                const worksheetIsClean = numbersAt(plain.texts, ANSWER_ROW_Y).length === 0;
                const sameProblems = answered.texts.filter((entry) => entry.y !== ANSWER_ROW_Y).length === plain.texts.length;
                if (results.join() !== expected.join() || !worksheetIsClean || !sameProblems) {
                    offenders.push(`${level} seed ${seed}: ${results.join()} vs ${expected.join()}`);
                }
            }
        }
        expect(offenders).toEqual([]);
    });
});

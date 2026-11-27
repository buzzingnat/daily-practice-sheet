import { describe, expect, test, vi } from 'vitest';
import { createDivisionExercise, DivisionProblem, generateDivisionProblems } from '../../../src/exercises/division-exercise';
import { GradeLevel } from '../../../src/types';
import { createRecordingContext, RecordedText } from '../../support/recording-context';
import { createSeededRandom } from '../../support/seeded-random';

const SEEDS = 200;
const DRAWING_SEED = 7;

interface Limits {
    smallestDivisor: number;
    largestDivisor: number;
    smallestQuotient: number;
    largestQuotient: number;
    smallestDividend: number;
    largestDividend: number;
}

// What is wrong with a set of problems, in words; an empty list means nothing is
function findFaults(problems: DivisionProblem[], limits: Limits): string[] {
    const faults: string[] = [];
    if (problems.length !== 3 || new Set(problems.map((problem) => `${problem.dividend}/${problem.divisor}`)).size !== 3) {
        faults.push(`not three different problems: ${JSON.stringify(problems)}`);
    }
    problems.forEach(({ divisor, dividend }) => {
        const quotient = dividend / divisor;
        if (divisor < limits.smallestDivisor || divisor > limits.largestDivisor) {
            faults.push(`${dividend}/${divisor}: divisor out of range`);
        } else if (!Number.isInteger(quotient)) {
            faults.push(`${dividend}/${divisor}: leaves a remainder`);
        } else if (quotient < limits.smallestQuotient || quotient > limits.largestQuotient) {
            faults.push(`${dividend}/${divisor}: quotient ${quotient} out of range`);
        } else if (dividend < limits.smallestDividend || dividend > limits.largestDividend) {
            faults.push(`${dividend}/${divisor}: dividend out of range`);
        }
    });
    return faults;
}

const LEVELS: [GradeLevel, Limits][] = [
    ['1st', { smallestDivisor: 2, largestDivisor: 5, smallestQuotient: 1, largestQuotient: 5, smallestDividend: 2, largestDividend: 25 }],
    ['2nd', { smallestDivisor: 2, largestDivisor: 9, smallestQuotient: 2, largestQuotient: 12, smallestDividend: 4, largestDividend: 108 }],
    // Triple digit: a three-digit dividend and a two-digit answer that fits its box
    ['3rd', { smallestDivisor: 2, largestDivisor: 9, smallestQuotient: 10, largestQuotient: 99, smallestDividend: 100, largestDividend: 999 }]
];

function digitsOf(texts: RecordedText[]): number[] {
    return texts.filter((entry) => /^\d+$/.test(entry.text)).map((entry) => Number(entry.text));
}

describe.each(LEVELS)('division, %s level', (level, limits) => {
    test('sets three different problems that come out even, inside the level ranges', () => {
        const offenders: string[] = [];
        for (let seed = 1; seed <= SEEDS; seed++) {
            findFaults(generateDivisionProblems(level, createSeededRandom(seed)), limits)
                .forEach((fault) => offenders.push(`seed ${seed}: ${fault}`));
        }
        expect(offenders).toEqual([]);
    });

    test('the key writes each quotient over its own problem, and the worksheet is the key without them', () => {
        const problems = generateDivisionProblems(level, createSeededRandom(DRAWING_SEED));
        expect(problems).toHaveLength(3);
        vi.spyOn(Math, 'random').mockImplementation(createSeededRandom(DRAWING_SEED));
        const exercise = createDivisionExercise(level);
        const plain = createRecordingContext();
        const answered = createRecordingContext();
        exercise.render(plain.quadrantContext);
        exercise.renderAnswers?.(answered.quadrantContext);

        // Each problem reads divisor then dividend; the key puts its quotient first
        const asked = problems.flatMap((problem) => [problem.divisor, problem.dividend]);
        const answeredInOrder = problems.flatMap((problem) => [problem.dividend / problem.divisor, problem.divisor, problem.dividend]);
        expect(digitsOf(plain.texts)).toEqual(asked);
        expect(digitsOf(answered.texts)).toEqual(answeredInOrder);
    });
});

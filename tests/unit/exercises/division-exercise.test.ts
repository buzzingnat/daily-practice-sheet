import { afterEach, describe, expect, test, vi } from 'vitest';
import { createDivisionExercise } from '../../../src/exercises/division-exercise';
import { GradeLevel } from '../../../src/types';
import { createRecordingContext } from '../../support/recording-context';
import { createSeededRandom } from '../../support/seeded-random';

const SEEDS = 200;

afterEach(() => {
    vi.restoreAllMocks();
});

// Every whole number the exercise wrote, in the order it wrote them: divisor, then dividend, for each problem
function drawnNumbers(level: GradeLevel, seed: number): number[] {
    vi.spyOn(Math, 'random').mockImplementation(createSeededRandom(seed));
    const drawn = createRecordingContext();
    createDivisionExercise(level).render(drawn.quadrantContext);
    return drawn.texts.filter((entry) => /^\d+$/.test(entry.text)).map((entry) => Number(entry.text));
}

interface Problem {
    divisor: number;
    dividend: number;
}

function drawnProblems(level: GradeLevel, seed: number): Problem[] {
    const numbers = drawnNumbers(level, seed);
    const problems: Problem[] = [];
    for (let index = 0; index + 1 < numbers.length; index += 2) {
        problems.push({ divisor: numbers[index] as number, dividend: numbers[index + 1] as number });
    }
    return problems;
}

// What is wrong with a sheet of problems, in words; an empty list means nothing is
function findFaults(problems: Problem[], limits: { smallestDivisor: number; largestDivisor: number; smallestQuotient: number; largestQuotient: number }): string[] {
    const faults: string[] = [];
    if (problems.length !== 3) {
        faults.push(`${problems.length} problems`);
    }
    if (new Set(problems.map((problem) => `${problem.dividend}/${problem.divisor}`)).size !== problems.length) {
        faults.push('a repeated problem');
    }
    problems.forEach(({ divisor, dividend }) => {
        const quotient = dividend / divisor;
        if (divisor < limits.smallestDivisor || divisor > limits.largestDivisor) {
            faults.push(`${dividend}/${divisor}: divisor out of range`);
        } else if (!Number.isInteger(quotient)) {
            faults.push(`${dividend}/${divisor}: leaves a remainder`);
        } else if (quotient < limits.smallestQuotient || quotient > limits.largestQuotient) {
            faults.push(`${dividend}/${divisor}: quotient ${quotient} out of range`);
        }
    });
    return faults;
}

function collectFaults(level: GradeLevel, limits: Parameters<typeof findFaults>[1], extraRule?: (problem: Problem) => string | null): string[] {
    const offenders: string[] = [];
    for (let seed = 1; seed <= SEEDS; seed++) {
        const problems = drawnProblems(level, seed);
        const faults = findFaults(problems, limits);
        problems.forEach((problem) => {
            const extraFault = extraRule?.(problem);
            if (extraFault) {
                faults.push(extraFault);
            }
        });
        if (faults.length > 0) {
            offenders.push(`seed ${seed}: ${faults.join('; ')}`);
        }
    }
    return offenders;
}

describe('division', () => {
    test('draws something for every level', () => {
        const offenders: string[] = [];
        for (const level of ['1st', '2nd', '3rd'] as const) {
            const drawn = createRecordingContext();
            createDivisionExercise(level).render(drawn.quadrantContext);
            if (drawn.calls.length === 0 || drawn.texts.length === 0) {
                offenders.push(level);
            }
        }
        expect(offenders).toEqual([]);
    });

    test('1st level sets even problems with divisors and quotients from 2 to 5 and 1 to 5', () => {
        expect(collectFaults('1st', { smallestDivisor: 2, largestDivisor: 5, smallestQuotient: 1, largestQuotient: 5 })).toEqual([]);
    });

    test('2nd level sets even problems with divisors from 2 to 9 and quotients from 2 to 12', () => {
        expect(collectFaults('2nd', { smallestDivisor: 2, largestDivisor: 9, smallestQuotient: 2, largestQuotient: 12 })).toEqual([]);
    });

    test('3rd level sets even problems with three-digit dividends, divisors from 2 to 9 and two-digit quotients', () => {
        const offenders = collectFaults(
            '3rd',
            { smallestDivisor: 2, largestDivisor: 9, smallestQuotient: 10, largestQuotient: 99 },
            ({ divisor, dividend }) => (dividend >= 100 && dividend <= 999 ? null : `${dividend}/${divisor}: not three digits`)
        );
        expect(offenders).toEqual([]);
    });
});

import { afterEach, describe, expect, test, vi } from 'vitest';
import { createSkipCountingExercise, generateSkipCountingRows, SkipCountingRow } from '../../../src/exercises/skip-counting-exercise';
import { GradeLevel } from '../../../src/types';
import { createRecordingContext } from '../../support/recording-context';
import { createSeededRandom } from '../../support/seeded-random';

const SEEDS = 50;
const TERMS_PER_ROW = 6;
const LEVELS: GradeLevel[] = ['1st', '2nd', '3rd'];

interface LevelExpectation {
    steps: number[];
    mayCountDown: boolean;
    startsOnMultipleOfStep: boolean;
    largestTerm: number;
    blanksPerRow: number;
    needsNeighboringGivens: boolean;
}

const EXPECTED: Record<GradeLevel, LevelExpectation> = {
    '1st': { steps: [2, 5, 10], mayCountDown: false, startsOnMultipleOfStep: true, largestTerm: 100, blanksPerRow: 2, needsNeighboringGivens: true },
    '2nd': { steps: [3, 4, 6, 7, 8, 9], mayCountDown: false, startsOnMultipleOfStep: true, largestTerm: 100, blanksPerRow: 3, needsNeighboringGivens: true },
    '3rd': { steps: [2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 25, 50, 100], mayCountDown: true, startsOnMultipleOfStep: false, largestTerm: 999, blanksPerRow: 3, needsNeighboringGivens: false }
};

afterEach(() => {
    vi.restoreAllMocks();
});

function listGivenPositions(row: SkipCountingRow): number[] {
    return row.terms.map((unused, position) => position).filter((position) => !row.blankPositions.includes(position));
}

// What is wrong with one row, in words; an empty list means nothing is
function findRowFaults(row: SkipCountingRow, expected: LevelExpectation): string[] {
    const faults: string[] = [];
    const step = (row.terms[1] as number) - (row.terms[0] as number);
    const givenPositions = listGivenPositions(row);

    if (row.terms.length !== TERMS_PER_ROW) {
        faults.push(`${row.terms.length} terms`);
    }
    if (row.terms.some((term, position) => position > 0 && term - (row.terms[position - 1] as number) !== step)) {
        faults.push('uneven steps');
    }
    if (!expected.steps.includes(Math.abs(step))) {
        faults.push(`step ${step} not allowed`);
    }
    if (step < 0 && !expected.mayCountDown) {
        faults.push('counts down');
    }
    if (row.terms.some((term) => term < 0 || term > expected.largestTerm)) {
        faults.push(`out of range: ${row.terms.join()}`);
    }
    if (expected.startsOnMultipleOfStep && Math.min(...row.terms) % Math.abs(step) !== 0) {
        faults.push(`start is not a multiple of ${step}`);
    }
    if (row.blankPositions.length !== expected.blanksPerRow || new Set(row.blankPositions).size !== row.blankPositions.length
        || row.blankPositions.some((position) => position < 0 || position >= TERMS_PER_ROW)) {
        faults.push(`blanks at ${row.blankPositions.join()}`);
    }
    if (givenPositions.length < 2) {
        faults.push('fewer than two given terms');
    }
    if (expected.needsNeighboringGivens && !givenPositions.some((position) => givenPositions.includes(position + 1))) {
        faults.push('no two given terms side by side');
    }
    return faults;
}

function collectFaults(level: GradeLevel): string[] {
    const offenders: string[] = [];
    for (let seed = 1; seed <= SEEDS; seed++) {
        const rows = generateSkipCountingRows(level, createSeededRandom(seed));
        const faults = rows.flatMap((row) => findRowFaults(row, EXPECTED[level]));
        if (rows.length !== 3 || new Set(rows.map((row) => row.terms.join())).size !== 3) {
            faults.push('not three different rows');
        }
        if (faults.length > 0) {
            offenders.push(`seed ${seed}: ${faults.join('; ')}`);
        }
    }
    return offenders;
}

describe('skip counting rows', () => {
    test('1st level counts up by 2, 5 or 10 to 100, hiding two terms a row', () => {
        expect(collectFaults('1st')).toEqual([]);
    });

    test('2nd level counts up by 3 to 9 to 100, hiding three terms a row', () => {
        expect(collectFaults('2nd')).toEqual([]);
    });

    test('3rd level counts up or down by larger steps to 999, hiding three terms a row', () => {
        expect(collectFaults('3rd')).toEqual([]);
    });

    test('every hidden term can be worked out from the given ones alone', () => {
        const offenders: string[] = [];
        for (const level of LEVELS) {
            for (let seed = 1; seed <= SEEDS; seed++) {
                generateSkipCountingRows(level, createSeededRandom(seed)).forEach((row) => {
                    // Two given terms and their places fix the step, and so every other term
                    const givenPositions = listGivenPositions(row);
                    const first = givenPositions[0] as number;
                    const second = givenPositions[1] as number;
                    const step = ((row.terms[second] as number) - (row.terms[first] as number)) / (second - first);
                    row.blankPositions.forEach((blank) => {
                        const worked = (row.terms[first] as number) + step * (blank - first);
                        if (!Number.isInteger(step) || worked !== row.terms[blank]) {
                            offenders.push(`${level} seed ${seed}: ${row.terms.join()} blank ${blank}`);
                        }
                    });
                });
            }
        }
        expect(offenders).toEqual([]);
    });
});

describe('skip counting drawing', () => {
    test('draws the givens and a box per blank on the worksheet, and every term on the key', () => {
        const offenders: string[] = [];
        for (const level of LEVELS) {
            vi.spyOn(Math, 'random').mockImplementation(createSeededRandom(3));
            const exercise = createSkipCountingExercise(level);
            const plain = createRecordingContext();
            const answered = createRecordingContext();
            exercise.render(plain.quadrantContext);
            exercise.renderAnswers?.(answered.quadrantContext);
            vi.restoreAllMocks();

            const toNumbers = (texts: { text: string }[]): number[] => {
                return texts.filter((entry) => /^\d+$/.test(entry.text)).map((entry) => Number(entry.text));
            };
            const blanks = EXPECTED[level].blanksPerRow * 3;
            const boxes = plain.calls.filter((call) => call.name === 'strokeRect').length;
            const worksheetNumbers = toNumbers(plain.texts);
            const keyNumbers = toNumbers(answered.texts);
            // At least one box per blank: the dividing lines may become task boxes
            const worksheetIsInsideKey = worksheetNumbers.every((number) => {
                const position = keyNumbers.indexOf(number);
                return position !== -1 && keyNumbers.splice(position, 1).length === 1;
            });
            if (plain.calls.length === 0 || worksheetNumbers.length !== 18 - blanks || boxes < blanks
                || toNumbers(answered.texts).length !== 18 || !worksheetIsInsideKey) {
                offenders.push(level);
            }
        }
        expect(offenders).toEqual([]);
    });
});

import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMultiplicationExercise } from '../../../src/exercises/multiplication-exercise';
import { MultiplicationSettings } from '../../../src/types';
import { createRecordingContext, RecordedText } from '../../support/recording-context';
import { createSeededRandom } from '../../support/seeded-random';

const SEEDS = 300;
const TOP_ROW_Y = 40 + 22;
const BOTTOM_ROW_Y = 40 + 46;
const ANSWER_ROW_Y = 40 + 82;

afterEach(() => {
    vi.restoreAllMocks();
});

function numbersAt(texts: RecordedText[], y: number): number[] {
    // The times sign shares a row with the bottom number, so only digits count
    return texts.filter((entry) => entry.y === y && /^\d+$/.test(entry.text)).map((entry) => Number(entry.text));
}

interface DrawnSheet {
    tops: number[];
    bottoms: number[];
    results: number[];
    signs: string[];
}

function drawSheet(settings: MultiplicationSettings, seed: number): DrawnSheet {
    vi.spyOn(Math, 'random').mockImplementation(createSeededRandom(seed));
    const exercise = createMultiplicationExercise(settings);
    const answers = createRecordingContext();
    exercise.renderAnswers?.(answers.quadrantContext);
    return {
        tops: numbersAt(answers.texts, TOP_ROW_Y),
        bottoms: numbersAt(answers.texts, BOTTOM_ROW_Y),
        results: numbersAt(answers.texts, ANSWER_ROW_Y),
        signs: answers.texts.filter((entry) => entry.text === 'x').map((entry) => entry.text)
    };
}

function collect(settings: MultiplicationSettings, check: (sheet: DrawnSheet) => string | undefined): string[] {
    const offenders: string[] = [];
    for (let seed = 1; seed <= SEEDS; seed++) {
        const problem = check(drawSheet(settings, seed));
        if (problem) {
            offenders.push(`seed ${seed}: ${problem}`);
        }
    }
    return offenders;
}

describe('multiplication exercise', () => {
    const settingsToTry: [string, MultiplicationSettings][] = [
        ['a run of numbers', { mode: 'tables', factors: [1, 2, 3, 4, 5] }],
        ['numbers with a gap', { mode: 'tables', factors: [2, 7, 12] }],
        ['two numbers', { mode: 'tables', factors: [3, 4] }],
        ['a single number', { mode: 'tables', factors: [7] }],
        ['zero beside another number', { mode: 'tables', factors: [0, 1] }],
        ['two digit', { mode: 'two-digit' }]
    ];

    test('draws three different problems for every kind of setting, with the product as the answer', () => {
        const offenders = settingsToTry.flatMap(([name, settings]) => collect(settings, (sheet) => {
            const keys = sheet.tops.map((top, index) => `${top}x${sheet.bottoms[index]}`);
            const expected = sheet.tops.map((top, index) => top * (sheet.bottoms[index] as number));
            if (sheet.tops.length !== 3 || new Set(keys).size !== 3) {
                return `problems ${keys.join()}`;
            }
            if (sheet.results.join() !== expected.join()) {
                return `answers ${sheet.results.join()} vs ${expected.join()}`;
            }
            if (sheet.signs.length !== 3) {
                return `${sheet.signs.length} times signs`;
            }
            return undefined;
        }).map((problem) => `${name}, ${problem}`));
        expect(offenders).toEqual([]);
    });

    test('draws both factors of a times table from the chosen numbers', () => {
        const factors = [2, 7, 12];
        const offenders = collect({ mode: 'tables', factors }, (sheet) => {
            const strays = [...sheet.tops, ...sheet.bottoms].filter((value) => !factors.includes(value));
            return strays.length > 0 ? `strays ${strays.join()}` : undefined;
        });
        expect(offenders).toEqual([]);
    });

    test('pairs a lone number with 1 to 12', () => {
        const offenders = collect({ mode: 'tables', factors: [7] }, (sheet) => {
            const badTop = sheet.tops.some((top) => top !== 7);
            const badBottom = sheet.bottoms.some((bottom) => bottom < 1 || bottom > 12);
            return badTop || badBottom ? `tops ${sheet.tops.join()} bottoms ${sheet.bottoms.join()}` : undefined;
        });
        expect(offenders).toEqual([]);
    });

    test('draws a two-digit number times a one-digit number in two-digit mode', () => {
        const offenders = collect({ mode: 'two-digit' }, (sheet) => {
            const badTop = sheet.tops.some((top) => top < 10 || top > 99);
            const badBottom = sheet.bottoms.some((bottom) => bottom < 2 || bottom > 9);
            return badTop || badBottom ? `tops ${sheet.tops.join()} bottoms ${sheet.bottoms.join()}` : undefined;
        });
        expect(offenders).toEqual([]);
    });

    test('makes zero rarer than any other chosen number', () => {
        const counts = new Map<number, number>();
        for (let seed = 1; seed <= SEEDS * 4; seed++) {
            const sheet = drawSheet({ mode: 'tables', factors: [0, 1, 2, 3, 4, 5] }, seed);
            [...sheet.tops, ...sheet.bottoms].forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
        }
        const zeroCount = counts.get(0) ?? 0;
        const offenders = [1, 2, 3, 4, 5].filter((value) => (counts.get(value) ?? 0) <= zeroCount);
        expect(zeroCount).toBeGreaterThan(0);
        expect(offenders).toEqual([]);
    });

    test('draws the same problems on the worksheet, which stays free of answers', () => {
        vi.spyOn(Math, 'random').mockImplementation(createSeededRandom(7));
        const exercise = createMultiplicationExercise({ mode: 'tables', factors: [1, 2, 3, 4, 5] });
        const plain = createRecordingContext();
        const answered = createRecordingContext();
        exercise.render(plain.quadrantContext);
        exercise.renderAnswers?.(answered.quadrantContext);
        expect(plain.texts.filter((entry) => entry.y === ANSWER_ROW_Y)).toEqual([]);
        expect(answered.texts.filter((entry) => entry.y !== ANSWER_ROW_Y)).toEqual(plain.texts);
    });
});

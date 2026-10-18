import { afterEach, describe, expect, test, vi } from 'vitest';
import { createAdditionExercise } from '../../../src/exercises/addition-exercise';
import { createSubtractionExercise } from '../../../src/exercises/subtraction-exercise';
import { GradeLevel } from '../../../src/types';
import { QuadrantExercise } from '../../../src/worksheet/worksheet-layout';
import { createRecordingContext, RecordedText } from '../../support/recording-context';
import { createSeededRandom } from '../../support/seeded-random';

const LEVELS: GradeLevel[] = ['1st', '2nd', '3rd'];
const SEEDS = 50;
const ANSWER_ROW_Y = 40 + 82;

afterEach(() => {
    vi.restoreAllMocks();
});

function numbersAt(texts: RecordedText[], y: number): number[] {
    // The plus and minus signs share a row with the bottom number, so only digits count
    return texts.filter((entry) => entry.y === y && /^\d+$/.test(entry.text)).map((entry) => Number(entry.text));
}

interface Kind {
    name: string;
    create: (level: GradeLevel) => QuadrantExercise;
    combine: (top: number, bottom: number) => number;
}

const KINDS: Kind[] = [
    { name: 'addition', create: createAdditionExercise, combine: (top, bottom) => top + bottom },
    { name: 'subtraction', create: createSubtractionExercise, combine: (top, bottom) => top - bottom }
];

describe.each(KINDS)('$name answers', (kind) => {
    test('write each result under the problem it belongs to', () => {
        const offenders: string[] = [];
        for (const level of LEVELS) {
            for (let seed = 1; seed <= SEEDS; seed++) {
                vi.spyOn(Math, 'random').mockImplementation(createSeededRandom(seed));
                const exercise = kind.create(level);
                const answers = createRecordingContext();
                exercise.renderAnswers?.(answers.quadrantContext);
                const tops = numbersAt(answers.texts, 62);
                const bottoms = numbersAt(answers.texts, 86);
                const results = numbersAt(answers.texts, ANSWER_ROW_Y);
                const expected = tops.map((top, index) => kind.combine(top, bottoms[index] as number));
                if (results.length !== 3 || results.join() !== expected.join() || results.some((value) => value < 0)) {
                    offenders.push(`${level} seed ${seed}: ${results.join()} vs ${expected.join()}`);
                }
            }
        }
        expect(offenders).toEqual([]);
    });

    test('draw the same problems as the worksheet, which stays free of answers', () => {
        vi.spyOn(Math, 'random').mockImplementation(createSeededRandom(7));
        const exercise = kind.create('2nd');
        const plain = createRecordingContext();
        const answered = createRecordingContext();
        exercise.render(plain.quadrantContext);
        exercise.renderAnswers?.(answered.quadrantContext);
        expect(plain.texts.filter((entry) => entry.y === ANSWER_ROW_Y)).toEqual([]);
        expect(answered.texts.filter((entry) => entry.y !== ANSWER_ROW_Y)).toEqual(plain.texts);
    });
});

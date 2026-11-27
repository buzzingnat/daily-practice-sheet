import { describe, expect, test, vi } from 'vitest';
import { createAdditionExercise, generateAdditionProblems } from '../../../src/exercises/addition-exercise';
import { createSubtractionExercise, generateSubtractionProblems } from '../../../src/exercises/subtraction-exercise';
import { createMultiplicationExercise, generateMultiplicationProblems } from '../../../src/exercises/multiplication-exercise';
import { GradeLevel, MultiplicationSettings, RandomSource } from '../../../src/types';
import { QuadrantExercise } from '../../../src/worksheet/worksheet-layout';
import { createRecordingContext, RecordedText } from '../../support/recording-context';
import { createSeededRandom } from '../../support/seeded-random';

// The stacked exercises share their rows: top number, bottom number, answer
const TOP_ROW_Y = 40 + 22;
const BOTTOM_ROW_Y = 40 + 46;
const ANSWER_ROW_Y = 40 + 82;
const DRAWING_SEED = 7;

function numbersAt(texts: RecordedText[], y: number): number[] {
    // The sign shares a row with the bottom number, so only digits count
    return texts.filter((entry) => entry.y === y && /^\d+$/.test(entry.text)).map((entry) => Number(entry.text));
}

interface ExerciseCase {
    name: string;
    create: () => QuadrantExercise;
    generate: (random: RandomSource) => { topNumber: number; bottomNumber: number }[];
    combine: (top: number, bottom: number) => number;
    sign: string;
}

const LEVELS: GradeLevel[] = ['1st', '2nd', '3rd'];
const TABLES: MultiplicationSettings = { mode: 'tables', factors: [1, 2, 3, 4, 5] };
const TWO_DIGIT: MultiplicationSettings = { mode: 'two-digit' };

const CASES: ExerciseCase[] = [
    ...LEVELS.map((level) => ({
        name: `addition, ${level}`,
        create: () => createAdditionExercise(level),
        generate: (random: RandomSource) => generateAdditionProblems(level, random),
        combine: (top: number, bottom: number) => top + bottom,
        sign: '+'
    })),
    ...LEVELS.map((level) => ({
        name: `subtraction, ${level}`,
        create: () => createSubtractionExercise(level),
        generate: (random: RandomSource) => generateSubtractionProblems(level, random),
        combine: (top: number, bottom: number) => top - bottom,
        sign: '-'
    })),
    ...[TABLES, TWO_DIGIT].map((settings) => ({
        name: `multiplication, ${settings.mode}`,
        create: () => createMultiplicationExercise(settings),
        generate: (random: RandomSource) => generateMultiplicationProblems(settings, random),
        combine: (top: number, bottom: number) => top * bottom,
        sign: 'x'
    }))
];

// The rules about which numbers appear live with each generator's tests; these check the drawing
describe.each(CASES)('$name', (exerciseCase) => {
    test('the key writes each answer under its own signed problem, and the worksheet is the key without them', () => {
        const problems = exerciseCase.generate(createSeededRandom(DRAWING_SEED));
        expect(problems).toHaveLength(3);
        vi.spyOn(Math, 'random').mockImplementation(createSeededRandom(DRAWING_SEED));
        const exercise = exerciseCase.create();
        const plain = createRecordingContext();
        const answered = createRecordingContext();
        exercise.render(plain.quadrantContext);
        exercise.renderAnswers?.(answered.quadrantContext);

        expect(numbersAt(answered.texts, TOP_ROW_Y)).toEqual(problems.map((problem) => problem.topNumber));
        expect(numbersAt(answered.texts, BOTTOM_ROW_Y)).toEqual(problems.map((problem) => problem.bottomNumber));
        expect(answered.texts.filter((entry) => entry.text === exerciseCase.sign)).toHaveLength(problems.length);
        expect(numbersAt(answered.texts, ANSWER_ROW_Y))
            .toEqual(problems.map((problem) => exerciseCase.combine(problem.topNumber, problem.bottomNumber)));
        expect(plain.texts.filter((entry) => entry.y === ANSWER_ROW_Y)).toEqual([]);
        expect(answered.texts.filter((entry) => entry.y !== ANSWER_ROW_Y)).toEqual(plain.texts);
    });
});

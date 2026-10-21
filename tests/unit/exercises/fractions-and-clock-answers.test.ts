import { afterEach, describe, expect, test, vi } from 'vitest';
import { createClockExercise, formatClockTime } from '../../../src/exercises/clock-exercise';
import { createFractionsExercise } from '../../../src/exercises/fractions-exercise';
import { GradeLevel } from '../../../src/types';
import { createRecordingContext } from '../../support/recording-context';
import { createSeededRandom } from '../../support/seeded-random';

const LEVELS: GradeLevel[] = ['1st', '2nd', '3rd'];
const SEEDS = 50;

afterEach(() => {
    vi.restoreAllMocks();
});

describe('fractions answers', () => {
    test('write the shaded and total slices of each circle in its boxes', () => {
        const offenders: string[] = [];
        for (const level of LEVELS) {
            for (let seed = 1; seed <= SEEDS; seed++) {
                vi.spyOn(Math, 'random').mockImplementation(createSeededRandom(seed));
                const exercise = createFractionsExercise(level);
                const plain = createRecordingContext();
                const answered = createRecordingContext();
                exercise.render(plain.quadrantContext);
                exercise.renderAnswers?.(answered.quadrantContext);

                // Each shaded slice is one fill, in circle order, so the fills split by the two answers
                const shadedSlices = plain.calls.filter((call) => call.name === 'fill').length;
                const written = answered.texts.slice(1).map((entry) => Number(entry.text));
                const [leftNumerator, leftDenominator, rightNumerator, rightDenominator] = written;
                // First grade can draw a denominator of 1, so a whole circle (1/1) is allowed
                const problemsAreProper = written.length === 4
                    && (leftNumerator as number) <= (leftDenominator as number)
                    && (rightNumerator as number) <= (rightDenominator as number);
                if (!problemsAreProper || (leftNumerator as number) + (rightNumerator as number) !== shadedSlices) {
                    offenders.push(`${level} seed ${seed}: wrote ${written.join('/')} for ${shadedSlices} shaded slices`);
                }
                // Each circle is cut into its denominator's worth of lines (none for a whole), plus one fraction bar each
                const cutLines = plain.calls.filter((call) => call.name === 'lineTo').length;
                const expectedCutLines = (leftDenominator as number > 1 ? leftDenominator as number : 0)
                    + (rightDenominator as number > 1 ? rightDenominator as number : 0) + 2;
                if (cutLines !== expectedCutLines) {
                    offenders.push(`${level} seed ${seed}: ${cutLines} lines drawn, denominators ${leftDenominator}/${rightDenominator}`);
                }
                if (plain.texts.length !== 1) {
                    offenders.push(`${level} seed ${seed}: the worksheet wrote more than its title`);
                }
            }
        }
        expect(offenders).toEqual([]);
    });
});

describe('clock answers', () => {
    const time = { hours: 10, minutes: 10 };

    test('a telling task writes the time in its box and the worksheet leaves it blank', () => {
        const exercise = createClockExercise('telling', time);
        const plain = createRecordingContext();
        const answered = createRecordingContext();
        exercise.render(plain.quadrantContext);
        exercise.renderAnswers?.(answered.quadrantContext);
        expect(plain.texts.map((entry) => entry.text)).not.toContain(formatClockTime(time));
        expect(answered.texts.map((entry) => entry.text)).toContain(formatClockTime(time));
        expect(answered.calls.filter((call) => call.name === 'lineTo').length)
            .toBe(plain.calls.filter((call) => call.name === 'lineTo').length);
    });

    test('a setting task draws the hands on the key and not on the worksheet', () => {
        const exercise = createClockExercise('setting', time);
        const plain = createRecordingContext();
        const answered = createRecordingContext();
        exercise.render(plain.quadrantContext);
        exercise.renderAnswers?.(answered.quadrantContext);
        const handsOnWorksheet = plain.calls.filter((call) => call.name === 'lineTo').length;
        const handsOnKey = answered.calls.filter((call) => call.name === 'lineTo').length;
        expect(handsOnWorksheet).toBe(0);
        expect(handsOnKey).toBe(2);
        expect(answered.texts.map((entry) => entry.text)).toContain(formatClockTime(time));
    });
});

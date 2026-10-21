import { describe, expect, test } from 'vitest';
import { fingerprintHalfPage, getHalfPageIdentifier, hashText, wordsFromHash } from '../../../src/worksheet/half-page-identifier';
import { IDENTIFIER_WORDS } from '../../../src/worksheet/identifier-words';
import { HalfPageLayout, QuadrantExercise } from '../../../src/worksheet/worksheet-layout';
import { createAdditionExercise } from '../../../src/exercises/addition-exercise';
import { createSubtractionExercise } from '../../../src/exercises/subtraction-exercise';
import { createClockExercise } from '../../../src/exercises/clock-exercise';
import { createFractionsExercise } from '../../../src/exercises/fractions-exercise';
import { createRecordingContext } from '../../support/recording-context';

function createScratchContext(): CanvasRenderingContext2D {
    return createRecordingContext().quadrantContext.context;
}

function createTextExercise(text: string, answerText: string = text): QuadrantExercise {
    return {
        render: ({ context }) => { context.fillText(text, 10, 20); },
        renderAnswers: ({ context }) => { context.fillText(answerText, 10, 20); }
    };
}

function createLayout(topLeft: string, topRight: string = 'b', bottomLeft: string = 'c', bottomRight: string = 'd'): HalfPageLayout {
    return {
        topLeft: createTextExercise(topLeft),
        topRight: createTextExercise(topRight),
        bottomLeft: createTextExercise(bottomLeft),
        bottomRight: createTextExercise(bottomRight)
    };
}

describe('getHalfPageIdentifier', () => {
    test('gives the same words for the same drawing, and three dotted words from the list', () => {
        const first = getHalfPageIdentifier(createLayout('7 + 5'), createScratchContext());
        const second = getHalfPageIdentifier(createLayout('7 + 5'), createScratchContext());
        expect(first).toBe(second);
        const parts = first.split('.');
        expect(parts).toHaveLength(3);
        expect(parts.every((part) => IDENTIFIER_WORDS.includes(part))).toBe(true);
    });

    test('changes when one problem changes', () => {
        const before = getHalfPageIdentifier(createLayout('7 + 5'), createScratchContext());
        const after = getHalfPageIdentifier(createLayout('7 + 6'), createScratchContext());
        expect(after).not.toBe(before);
    });

    test('changes when two quadrants swap places', () => {
        const before = getHalfPageIdentifier(createLayout('a', 'b'), createScratchContext());
        const after = getHalfPageIdentifier(createLayout('b', 'a'), createScratchContext());
        expect(after).not.toBe(before);
    });

    test('ignores the answers, so the key carries the worksheet\'s words', () => {
        const withMatchingAnswers = createLayout('7 + 5');
        const withOtherAnswers: HalfPageLayout = { ...createLayout('7 + 5'), topLeft: createTextExercise('7 + 5', '12') };
        expect(getHalfPageIdentifier(withOtherAnswers, createScratchContext()))
            .toBe(getHalfPageIdentifier(withMatchingAnswers, createScratchContext()));
    });

    test('hands the real context\'s answers through, so exercises that measure text still work', () => {
        const measured: number[] = [];
        const context = {
            measureText: () => ({ width: 7 }),
            fillText: () => undefined
        } as unknown as CanvasRenderingContext2D;
        const measuringExercise: QuadrantExercise = {
            render: (quadrantContext) => { measured.push(quadrantContext.context.measureText('x').width); }
        };
        fingerprintHalfPage({ ...createLayout('a'), topLeft: measuringExercise }, context);
        expect(measured).toEqual([7]);
    });
});

describe('fingerprintHalfPage', () => {
    test('every real exercise draws the same thing each time it renders', () => {
        const exercises: Record<string, QuadrantExercise> = {
            addition1: createAdditionExercise('1st'),
            addition2: createAdditionExercise('2nd'),
            addition3: createAdditionExercise('3rd'),
            subtraction1: createSubtractionExercise('1st'),
            subtraction2: createSubtractionExercise('2nd'),
            clockTelling: createClockExercise('telling', { hours: 3, minutes: 15 }),
            clockSetting: createClockExercise('setting', { hours: 9, minutes: 40 }),
            fractions: createFractionsExercise('1st')
        };
        const offenders: string[] = [];
        for (const [name, exercise] of Object.entries(exercises)) {
            const layout: HalfPageLayout = { topLeft: exercise, topRight: exercise, bottomLeft: exercise, bottomRight: exercise };
            const first = fingerprintHalfPage(layout, createScratchContext());
            const second = fingerprintHalfPage(layout, createScratchContext());
            if (first !== second) {
                offenders.push(name);
            }
        }
        expect(offenders).toEqual([]);
    });
});

describe('hashText and wordsFromHash', () => {
    test('hashText is stable and sensitive to every character', () => {
        expect(hashText('abc')).toBe(hashText('abc'));
        expect(hashText('abc')).not.toBe(hashText('abd'));
        expect(hashText('')).toBeGreaterThanOrEqual(0);
    });

    test('wordsFromHash reads the low 30 bits as three ten-bit word numbers', () => {
        const hash = (1 << 20) | (2 << 10) | 3;
        expect(wordsFromHash(hash)).toBe(`${IDENTIFIER_WORDS[1]}.${IDENTIFIER_WORDS[2]}.${IDENTIFIER_WORDS[3]}`);
    });
});

describe('IDENTIFIER_WORDS', () => {
    test('holds 1,024 distinct lowercase words of three to six letters', () => {
        const offenders = IDENTIFIER_WORDS.filter((word, index) => {
            return !/^[a-z]{3,6}$/.test(word) || IDENTIFIER_WORDS.indexOf(word) !== index;
        });
        expect(IDENTIFIER_WORDS).toHaveLength(1024);
        expect(offenders).toEqual([]);
    });
});

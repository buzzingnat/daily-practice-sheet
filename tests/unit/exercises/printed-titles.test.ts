import { afterEach, describe, expect, test } from 'vitest';
import { createAdditionExercise } from '../../../src/exercises/addition-exercise';
import { createSubtractionExercise } from '../../../src/exercises/subtraction-exercise';
import { createMultiplicationExercise } from '../../../src/exercises/multiplication-exercise';
import { createFractionsExercise } from '../../../src/exercises/fractions-exercise';
import { createClockExercise } from '../../../src/exercises/clock-exercise';
import { english } from '../../../src/text/english';
import { setLanguage, setMessages } from '../../../src/text/messages';
import { pickMascotAndCheer } from '../../../src/worksheet/mascots';
import { QuadrantExercise } from '../../../src/worksheet/worksheet-layout';
import { createMarkerCatalog } from '../../support/marker-catalog';
import { createRecordingContext } from '../../support/recording-context';

afterEach(() => {
    setLanguage('en');
});

function drawnTexts(exercise: QuadrantExercise): string[] {
    const { quadrantContext, texts } = createRecordingContext();
    exercise.render(quadrantContext);
    return texts.map((entry) => entry.text);
}

const TITLED_EXERCISES: ReadonlyArray<[string, () => QuadrantExercise, string]> = [
    ['addition', () => createAdditionExercise('2nd'), 'title:addition|level:addition:2nd'],
    ['subtraction', () => createSubtractionExercise('1st'), 'title:subtraction|level:subtraction:1st'],
    ['multiplication', () => createMultiplicationExercise({ mode: 'two-digit' }), 'title:multiplication|level:multiplication:two-digit'],
    ['fractions', () => createFractionsExercise('3rd'), 'title:fractions|level:fractions:3rd'],
    ['telling time', () => createClockExercise('telling', { hours: 3, minutes: 15 }), 'title:tellingTime'],
    ['setting time', () => createClockExercise('setting', { hours: 3, minutes: 15 }), 'title:settingTime']
];

describe('printed titles', () => {
    test.each(TITLED_EXERCISES)('%s is headed with words from the catalog, not from its own code', (unused, build, expectedTitle) => {
        setMessages(createMarkerCatalog());
        const texts = drawnTexts(build());
        expect(texts).toContain(expectedTitle);
    });

    test('the English headings read as they always have', () => {
        const texts = drawnTexts(createAdditionExercise('1st'));
        expect(texts).toContain(`${english.exerciseTitles.addition} (Single Digit)`);
        expect(drawnTexts(createMultiplicationExercise({ mode: 'tables', factors: [1, 2, 3, 4, 5] })))
            .toContain('MULTIPLICATION (1 to 5)');
    });
});

describe('other printed words', () => {
    test('the mascot\'s cheer comes from the catalog', () => {
        setMessages(createMarkerCatalog());
        expect(pickMascotAndCheer(3).cheer).toBe('worksheet:cheer');
    });
});

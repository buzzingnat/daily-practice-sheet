import { afterEach, describe, expect, test } from 'vitest';
import { createAdditionExercise } from '../../../src/exercises/addition-exercise';
import { createSubtractionExercise } from '../../../src/exercises/subtraction-exercise';
import { createMultiplicationExercise } from '../../../src/exercises/multiplication-exercise';
import { createFractionsExercise } from '../../../src/exercises/fractions-exercise';
import { createClockExercise } from '../../../src/exercises/clock-exercise';
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
    test('every exercise is headed with words from the catalog, not from its own code', () => {
        setMessages(createMarkerCatalog());
        const offenders = TITLED_EXERCISES
            .filter(([unused, build, expectedTitle]) => !drawnTexts(build()).includes(expectedTitle))
            .map(([name]) => name);
        expect(offenders).toEqual([]);
    });
});

describe('other printed words', () => {
    test('the mascot\'s cheer comes from the catalog', () => {
        setMessages(createMarkerCatalog());
        expect(pickMascotAndCheer(3).cheer).toBe('worksheet:cheer');
    });
});

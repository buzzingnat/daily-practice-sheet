import { getSharedImage } from "./asset-manager";
import { executeTestSheetGeneration } from './run-test';
import { generateWorkbookBatch, createWorkbookExerciseFactories } from './randomization-and-difficulty-generator';
import { createClockQuadrant, ClockType } from './clock-exercise';
import { createAdditionExercise} from './addition-exercise';
import { createSubtractionQuadrant } from './subtraction-exercise';
import { createFractionsQuadrant } from './fractions-exercise';
import { createKanaExercise } from './kana-exercise';
import { QuadrantExercise, EXERCISE_WIDTH, EXERCISE_HEIGHT, buildAndDownloadWorksheetBatch } from './worksheet-layout';
import { createPlaceholderExercise, createBlankExercise } from './utils';
import { loadGeographyData, createGeographyQuadrant, Continent } from './geography-exercise';
import { GradeLevel } from './types';
import { KANA_IMAGE_URL } from './constants';

// for storing user selections for worksheet settings
// the number can be used to hold difficulty level of each exercise
// but perhaps having each stored as an obejct with fields on it for
// difficulty, frequency of repetition, range to practice (like for which subset
// of hiragana or katakana characters to be reviewing; or which region of countries
// to be learning when countries are added in the future) would make more sense
// but we are using numbers for now
// later move this to local storage
const localState: Record<string, number>= {
    topic_setTime: 0,
    topic_tellTime: 0,
    topic_fractions: 0,
    topic_addition: 0,
    topic_subtraction: 0,
    topic_hiragana: 0,
    topic_continents: 0,
};

// a placeholder, this needs to become "generate single sample page" later
function renderTestWorksheetButton() {
    const testButton = document.createElement('button');
    testButton.textContent = 'Make Test Sheet';
    testButton.id = 'test-sheet-generator-btn';
    testButton.addEventListener('click', () => {
        executeTestSheetGeneration();
    });
    const introSection = document.getElementById('intro-section');

    if (introSection) {
        introSection.appendChild(testButton);
    }
}

// a placeholder, this will become Create Worksheet Set later
function renderRandomizedWorksheetBatchButton() {
    const randomBatchButton = document.createElement('button');
    randomBatchButton.textContent = 'Make Randomized Batch';
    randomBatchButton.id = 'random-batch-generator-btn';
    randomBatchButton.addEventListener('click', () => {
        buildAndDownloadWorksheetBatch(
            generateWorkbookBatch(createWorkbookExerciseFactories())
        );
    });
    const introSection = document.getElementById('intro-section');

    if (introSection) {
        introSection.appendChild(randomBatchButton);
    }
}

function drawExample(exerciseType: QuadrantExercise) {
    const canvas = document.createElement('canvas');
    canvas.height = EXERCISE_HEIGHT;
    canvas.width = EXERCISE_WIDTH;
    const context = canvas.getContext('2d');
    if (!context) {
        return Error('no context to draw with');
    }
    context.fillStyle = '#fff';
    context.strokeStyle = '#999';
    context.lineWidth = 4;
    const x = 0, y = 0, width = EXERCISE_WIDTH, height = EXERCISE_HEIGHT;
    context.fillRect(x, y, width, height);
    context.strokeRect(x, y, width, height);
    exerciseType.render({context, width: EXERCISE_WIDTH, height: EXERCISE_HEIGHT});
    return canvas;
}

export type ExampleSpecification =
    | { type: 'clock'; clockType: ClockType, title: string; hours: number; minutes: number; digitalDisplayLabel?: string }
    | { type: 'fractions'; title: string; grade: GradeLevel }
    | { type: 'subtraction'; grade: GradeLevel; title?: string }
    | { type: 'addition'; grade: GradeLevel; title?: string }
    | { type: 'kana'; title: string; character: string; pronunciation: string }
    | { type: 'geography'; continent: Continent; title?: string }
    | { type: 'placeholder'; title: string }
    | { type: 'blank';};

const DEFAULT_EXAMPLES: ExampleSpecification[] = [
    { type: 'clock', clockType: 'telling', title: 'TELLING TIME', hours: 10, minutes: 10 },
    { type: 'clock', clockType: 'setting', title: 'SETTING TIME', hours: 3, minutes: 30 },
    { type: 'fractions', title: 'FRACTIONS', grade: '1st' },
    { type: 'geography', continent: 'Africa' },
    { type: 'geography', continent: 'Oceania' },
    { type: 'subtraction', grade: '2nd' },
    { type: 'addition', grade: '1st' },
    {
        type: 'kana',
        title: 'HIRAGANA PRACTICE',
        character: 'お',
        pronunciation: '"o" pronounce "oa", as in boat.'
    },
    {
        type: 'kana',
        title: 'HIRAGANA PRACTICE',
        character: 'る',
        pronunciation: '"ru" pronounce "roo", as in ruin.'
    }
];

/**
 * Turns one specification into a live quadrant. The closing else clause
 * assigns to never, so a new quadrant type that forgets its branch is
 * caught by the compiler rather than by a confused student.
 */
function createExerciseFromSpecification(specification: ExampleSpecification): QuadrantExercise {
    if (specification.type === 'clock') {
        return createClockQuadrant(
            specification.clockType,
            specification.title,
            { hours: specification.hours, minutes: specification.minutes },
            specification.digitalDisplayLabel
        );
    } else if (specification.type === 'fractions') {
        return createFractionsQuadrant(specification.grade, specification.title);
    } else if (specification.type === 'subtraction') {
        return createSubtractionQuadrant(specification.grade, specification.title);
    } else if (specification.type === 'addition') {
        return createAdditionExercise(specification.grade, specification.title);
    } else if (specification.type === 'kana') {
        return createKanaExercise(
            specification.title,
            specification.character,
            specification.pronunciation
        );
    } else if (specification.type === 'geography') {
        return createGeographyQuadrant(specification.continent, specification.title);
    } else if (specification.type === 'placeholder') {
        return createPlaceholderExercise(specification.title);
    }  else if (specification.type === 'blank') {
        return createBlankExercise();
    } else {
        const unhandledSpecification: never = specification;
        throw new Error(`No quadrant builder for ${JSON.stringify(unhandledSpecification)}`);
    }
}

/**
 * Draws one preview canvas per specification and appends each to the
 * example section. Building and drawing both sit inside the guard, because
 * a factory can throw as readily as a canvas can fail, and one bad quadrant
 * should not sink the rest.
 */
function renderExamples(specifications: ExampleSpecification[] = DEFAULT_EXAMPLES): void {
    const exampleSection = document.getElementById('example-exercises');
    if (!exampleSection) {
        return;
    }

    specifications.forEach((specification) => {
        try {
            const exampleCanvas = drawExample(createExerciseFromSpecification(specification));
            if (exampleCanvas instanceof Error) {
                console.error(`Could not draw ${specification.type} example:`, exampleCanvas);
                return;
            }
            exampleSection.appendChild(exampleCanvas);
        } catch (error: unknown) {
            console.error(`Could not build ${specification.type} example:`, error);
        }
    });
}

const MAXIMUM_TOPIC_COUNT = 6;

function countSelectedTopics(): number {
    return Object.values(localState).filter((value) => value > 0).length;
}

function refreshTopicAvailability(): void {
    const limitReached = countSelectedTopics() >= MAXIMUM_TOPIC_COUNT;
    const topicButtons = document.querySelectorAll<HTMLButtonElement>('.topic-choice');
    topicButtons.forEach((button) => {
        const isSelected = button.classList.contains('selected');
        button.disabled = limitReached && !isSelected;
    });
}

function clickTopicChoice(button: HTMLButtonElement, key: string): void {
    localState[key] = localState[key] === 0 ? 1 : 0;
    button.classList.toggle('selected');
    button.setAttribute('aria-pressed', String(localState[key] === 1));
    refreshTopicAvailability();
}

function renderMainInitial() {
    const mainElement = document.getElementsByTagName('main')[0];
    if (!mainElement) return Error('No main element found in DOM.');
    mainElement.replaceChildren();

    const introSection = document.createElement('section');
    introSection.id = 'intro-section';
    const instructionPara = document.createElement('p');
    instructionPara.textContent = 'Select up to six topics below. Generate a set of 20 half page printouts including each topic, scattered regularly across the worksheets.';
    const topicChoicesContainer = document.createElement('div');
    topicChoicesContainer.id = 'topic-choices';
    introSection.appendChild(instructionPara);
    introSection.appendChild(topicChoicesContainer);
    mainElement.appendChild(introSection);

    const choiceList = [
            'fractions', 'addition', 'subtraction',
            'setTime', 'tellTime', 'hiragana',
            'continents'
        ];

    for(const title of choiceList) {
        const key = 'topic_'+title;
        const newTopic = document.createElement('button');
        newTopic.classList.add('topic-choice');
        newTopic.innerText = title;
        newTopic.id = title;
        newTopic.addEventListener('click', () => clickTopicChoice(newTopic, key));
        topicChoicesContainer.appendChild(newTopic);
    }

    const exampleSection = document.createElement('section');
    exampleSection.id = 'example-section';
    const title = document.createElement('h2');
    title.textContent = 'Example Exercises';
    const exampleListContainer = document.createElement('div');
    exampleListContainer.id = 'example-exercises';
    exampleSection.appendChild(title);
    exampleSection.appendChild(exampleListContainer);
    mainElement.appendChild(exampleSection);
}

export function renderApp() {
    try {
        renderMainInitial();
        renderTestWorksheetButton();
        renderRandomizedWorksheetBatchButton();
        renderExamples();
    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
        }
    }
}

async function initializeApp() {
    try {
        // preload all image assets
        const [kanaGuide] = await Promise.all([
            getSharedImage(KANA_IMAGE_URL),
            loadGeographyData()
        ]);

        console.log("Assets ready! Assembling worksheet preview...", {kanaGuide});

        // Now that the image is 100% ready, safely create your component layouts
        renderApp();

    } catch (error) {
        console.error("Critical asset failed to load. Cannot render worksheet:", error);
    }
}

initializeApp();

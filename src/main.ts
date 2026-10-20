import { getSharedImage } from "./asset-manager";
import { executeTestSheetGeneration } from './make-example-sheet';
import { generateWorkbookBatch, createWorkbookExerciseFactories } from './generator/randomization-and-difficulty-generator';
import { createClockExercise } from './exercises/clock-exercise';
import { createAdditionExercise} from './exercises/addition-exercise';
import { createSubtractionExercise } from './exercises/subtraction-exercise';
import { createMultiplicationExercise } from './exercises/multiplication-exercise';
import { createFractionsExercise } from './exercises/fractions-exercise';
import { createKanaExercise } from './exercises/kana/kana-exercise';
import { createCursiveExercise } from './exercises/cursive/cursive-exercise';
import { loadCursiveFonts } from './exercises/cursive/cursive-fonts';
import { QuadrantExercise, EXERCISE_WIDTH, EXERCISE_HEIGHT, buildAndDownloadWorksheetBatch } from './worksheet/worksheet-layout';
import { preloadMascotImages } from './worksheet/mascots';
import { createPlaceholderExercise, createBlankExercise } from './utils';
import { loadGeographyData, createGeographyExercise } from './exercises/geography/geography-exercise';
import { loadRegionMapData } from './exercises/geography/region-map-data';
import { createRegionMapExercise } from './exercises/geography/region-map-exercise';
import { TOPIC_KEYS, TopicKey } from './types';
import { KANA_IMAGE_URL, COLOR_MEDIUM_GREY, COLOR_WHITE } from './constants';
import {
    findConfigurableTopic,
    resolveTopicSettings,
    summarizeSelection
} from './settings/topic-settings';
import { buildExampleSpecifications, ExampleSpecification } from './generator/example-specifications';
import { renderSettingsPanels } from './ui/topic-settings-panel';
import { renderPrintSizePanel } from './ui/print-size-panel';
import { loadSavedSettings, saveHalfPageCount, savePanelSelections, saveSelectedTopics } from './settings/saved-settings';

const MAXIMUM_TOPIC_COUNT = 6;

// Whatever the user chose last visit, checked against what still exists
const savedSettings = loadSavedSettings(MAXIMUM_TOPIC_COUNT);

// for storing user selections for worksheet settings
// the number can be used to hold difficulty level of each exercise
// but perhaps having each stored as an obejct with fields on it for
// difficulty, frequency of repetition, range to practice (like for which subset
// of hiragana or katakana characters to be reviewing; or which region of countries
// to be learning when countries are added in the future) would make more sense
// but we are using numbers for now
// saved to local storage as a list of selected topics
const localState: Record<TopicKey, number>= {
    setTime: 0,
    tellTime: 0,
    fractions: 0,
    addition: 0,
    subtraction: 0,
    multiplication: 0,
    hiragana: 0,
    cursiveLetters: 0,
    continents: 0,
    countries: 0,
};
savedSettings.selectedTopics.forEach((key) => {
    localState[key] = 1;
});

// What each settings panel currently holds. Kept when a topic is toggled off, so
// changing one's mind does not cost the choices.
const panelSelections = savedSettings.panelSelections;

// How much to print, in half-pages. Two make a page.
let halfPageCount = savedSettings.halfPageCount;

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

const RANDOM_BATCH_BUTTON_ID = 'random-batch-generator-btn';

// a placeholder, this will become Create Worksheet Set later
function renderRandomizedWorksheetBatchButton() {
    const randomBatchButton = document.createElement('button');
    randomBatchButton.textContent = 'Make Randomized Batch';
    randomBatchButton.id = RANDOM_BATCH_BUTTON_ID;
    // Nothing is selected at startup, and a page of nothing is a poor use of paper
    randomBatchButton.disabled = countSelectedTopics() === 0;
    randomBatchButton.addEventListener('click', () => {
        buildAndDownloadWorksheetBatch(
            generateWorkbookBatch(
                createWorkbookExerciseFactories(),
                getSelectedTopics(),
                resolveTopicSettings(panelSelections),
                halfPageCount
            )
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
    context.fillStyle = COLOR_WHITE;
    context.strokeStyle = COLOR_MEDIUM_GREY;
    context.lineWidth = 4;
    const x = 0, y = 0, width = EXERCISE_WIDTH, height = EXERCISE_HEIGHT;
    context.fillRect(x, y, width, height);
    context.strokeRect(x, y, width, height);
    exerciseType.render({context, width: EXERCISE_WIDTH, height: EXERCISE_HEIGHT});
    return canvas;
}

/**
 * Turns one specification into a live quadrant. The closing else clause
 * assigns to never, so a new quadrant type that forgets its branch is
 * caught by the compiler rather than by a confused student.
 */
function createExerciseFromSpecification(specification: ExampleSpecification): QuadrantExercise {
    if (specification.type === 'clock') {
        return createClockExercise(
            specification.clockType,
            specification.title,
            { hours: specification.hours, minutes: specification.minutes },
            specification.digitalDisplayLabel
        );
    } else if (specification.type === 'fractions') {
        return createFractionsExercise(specification.grade, specification.title);
    } else if (specification.type === 'subtraction') {
        return createSubtractionExercise(specification.grade, specification.title);
    } else if (specification.type === 'addition') {
        return createAdditionExercise(specification.grade, specification.title);
    } else if (specification.type === 'multiplication') {
        return createMultiplicationExercise(specification.settings, specification.title);
    } else if (specification.type === 'kana') {
        return createKanaExercise(
            specification.title,
            specification.character,
            specification.pronunciation
        );
    } else if (specification.type === 'cursive') {
        return createCursiveExercise(specification.letter, specification.layout);
    } else if (specification.type === 'geography') {
        return createGeographyExercise(specification.continent, specification.title);
    } else if (specification.type === 'regionCountry') {
        return createRegionMapExercise(
            specification.region,
            specification.targetIdentifier,
            specification.title
        );
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
 * Replaces the example section with one preview canvas per specification
 * for the chosen topics and settings. Building and drawing both sit inside the guard, because
 * a factory can throw as readily as a canvas can fail, and one bad quadrant
 * should not sink the rest.
 */
function renderExamples(): void {
    const exampleSection = document.getElementById('example-exercises');
    if (!exampleSection) {
        return;
    }

    let specifications: ExampleSpecification[];
    try {
        specifications = buildExampleSpecifications(getSelectedTopics(), resolveTopicSettings(panelSelections));
    } catch (error: unknown) {
        // A panel with nothing chosen cannot be resolved; keep the examples already shown
        console.error('Could not choose examples:', error);
        return;
    }
    exampleSection.replaceChildren();

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

function getSelectedTopics(): TopicKey[] {
    return TOPIC_KEYS.filter((key) => localState[key] > 0);
}

function countSelectedTopics(): number {
    return getSelectedTopics().length;
}

function refreshTopicAvailability(): void {
    const limitReached = countSelectedTopics() >= MAXIMUM_TOPIC_COUNT;
    const topicButtons = document.querySelectorAll<HTMLButtonElement>('.topic-choice');
    topicButtons.forEach((button) => {
        const isSelected = button.classList.contains('selected');
        button.disabled = limitReached && !isSelected;
    });

    const generateButton = document.getElementById(RANDOM_BATCH_BUTTON_ID);
    if (generateButton instanceof HTMLButtonElement) {
        generateButton.disabled = countSelectedTopics() === 0;
    }
}

const TOPIC_SETTINGS_ID = 'topic-settings';

// A few words beside each selected topic's name: its level, or how much of its list is chosen
function refreshTopicSummaries(): void {
    TOPIC_KEYS.forEach((key) => {
        const summary = document.getElementById(`${key}-summary`);
        if (!summary) {
            return;
        }
        const configurableTopic = findConfigurableTopic(key);
        const isSelected = localState[key] > 0;
        summary.textContent = configurableTopic && isSelected
            ? summarizeSelection(configurableTopic, panelSelections)
            : '';
    });
}

function changePanelSelection(): void {
    savePanelSelections(panelSelections);
    refreshTopicSummaries();
    renderExamples();
}

function refreshSettingsPanels(): void {
    const container = document.getElementById(TOPIC_SETTINGS_ID);
    if (container) {
        renderSettingsPanels(container, getSelectedTopics(), panelSelections, changePanelSelection);
    }
    refreshTopicSummaries();
}

function clickTopicChoice(button: HTMLButtonElement, key: TopicKey): void {
    localState[key] = localState[key] === 0 ? 1 : 0;
    button.classList.toggle('selected');
    button.setAttribute('aria-pressed', String(localState[key] === 1));
    saveSelectedTopics(getSelectedTopics());
    refreshTopicAvailability();
    refreshSettingsPanels();
    renderExamples();
}

function renderMainInitial() {
    const mainElement = document.getElementsByTagName('main')[0];
    if (!mainElement) return Error('No main element found in DOM.');
    mainElement.replaceChildren();

    const introSection = document.createElement('section');
    introSection.id = 'intro-section';
    const instructionPara = document.createElement('p');
    instructionPara.textContent = 'Select up to six topics below. Choose how many half-pages to print. Each half-page mixes the selected topics across its quadrants.';
    const topicChoicesContainer = document.createElement('div');
    topicChoicesContainer.id = 'topic-choices';
    introSection.appendChild(instructionPara);
    const topicSettingsContainer = document.createElement('div');
    topicSettingsContainer.id = TOPIC_SETTINGS_ID;
    introSection.appendChild(topicChoicesContainer);
    const printSizeContainer = document.createElement('div');
    printSizeContainer.id = 'print-size';
    introSection.appendChild(topicSettingsContainer);
    introSection.appendChild(printSizeContainer);
    renderPrintSizePanel(printSizeContainer, halfPageCount, (newCount) => {
        halfPageCount = newCount;
        saveHalfPageCount(halfPageCount);
    });
    mainElement.appendChild(introSection);

    for(const title of TOPIC_KEYS) {
        const newTopic = document.createElement('button');
        newTopic.classList.add('topic-choice');
        const topicName = document.createElement('span');
        topicName.classList.add('topic-name');
        topicName.textContent = title;
        const topicSummary = document.createElement('span');
        topicSummary.classList.add('topic-summary');
        topicSummary.id = `${title}-summary`;
        newTopic.appendChild(topicName);
        newTopic.appendChild(topicSummary);
        newTopic.id = title;
        if (localState[title] > 0) {
            newTopic.classList.add('selected');
            newTopic.setAttribute('aria-pressed', 'true');
        }
        newTopic.addEventListener('click', () => clickTopicChoice(newTopic, title));
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
        // Restored topics need their limit, panels and summaries before anyone clicks
        refreshTopicAvailability();
        refreshSettingsPanels();
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
            loadGeographyData(),
            loadRegionMapData(),
            loadCursiveFonts(),
            preloadMascotImages()
        ]);

        console.log("Assets ready! Assembling worksheet preview...", {kanaGuide});

        // Now that the image is 100% ready, safely create your component layouts
        renderApp();

    } catch (error) {
        console.error("Critical asset failed to load. Cannot render worksheet:", error);
    }
}

initializeApp();

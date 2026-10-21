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
import { TOPIC_KEYS, TopicKey, ViewMode } from './types';
import { KANA_IMAGE_URL, COLOR_MEDIUM_GREY, COLOR_WHITE } from './constants';
import {
    findConfigurableTopic,
    resolveTopicSettings,
    summarizeSelection
} from './settings/topic-settings';
import { buildTopicExample, ExampleSpecification } from './generator/example-specifications';
import { createTopicCard, TopicCard } from './ui/topic-card';
import { createSummaryBar, SummaryBar } from './ui/summary-bar';
import { describeSheet, describeTopicDetail } from './settings/sheet-summary';
import { loadSavedSettings, saveHalfPageCount, savePanelSelections, saveSelectedTopics, saveViewMode } from './settings/saved-settings';

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

// Full cards, or thumbnails with short text
let viewMode: ViewMode = savedSettings.viewMode;

const topicCards = new Map<TopicKey, TopicCard>();
let summaryBar: SummaryBar | undefined;

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
function makeRandomizedWorksheetBatch(): void {
    buildAndDownloadWorksheetBatch(
        generateWorkbookBatch(
            createWorkbookExerciseFactories(),
            getSelectedTopics(),
            resolveTopicSettings(panelSelections),
            halfPageCount
        )
    );
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
            { hours: specification.hours, minutes: specification.minutes },
            specification.digitalDisplayLabel
        );
    } else if (specification.type === 'fractions') {
        return createFractionsExercise(specification.grade);
    } else if (specification.type === 'subtraction') {
        return createSubtractionExercise(specification.grade);
    } else if (specification.type === 'addition') {
        return createAdditionExercise(specification.grade);
    } else if (specification.type === 'multiplication') {
        return createMultiplicationExercise(specification.settings);
    } else if (specification.type === 'kana') {
        return createKanaExercise(
            specification.character,
            specification.pronunciation
        );
    } else if (specification.type === 'cursive') {
        return createCursiveExercise(specification.letter, specification.layout);
    } else if (specification.type === 'geography') {
        return createGeographyExercise(specification.continent);
    } else if (specification.type === 'regionCountry') {
        return createRegionMapExercise(
            specification.region,
            specification.targetIdentifier
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
 * Draws one card's preview from the topic's current settings. A panel with nothing
 * chosen cannot be resolved, and a quadrant can fail to build; either way the
 * preview already shown stays, and one bad card does not sink the rest.
 */
function refreshPreview(topic: TopicKey): void {
    const card = topicCards.get(topic);
    if (!card) {
        return;
    }
    try {
        const specification = buildTopicExample(topic, resolveTopicSettings(panelSelections));
        if (!specification) {
            return;
        }
        const exampleCanvas = drawExample(createExerciseFromSpecification(specification));
        if (exampleCanvas instanceof Error) {
            console.error(`Could not draw ${topic} example:`, exampleCanvas);
            return;
        }
        card.setPreview(exampleCanvas);
    } catch (error: unknown) {
        console.error(`Could not build ${topic} example:`, error);
    }
}

function getSelectedTopics(): TopicKey[] {
    return TOPIC_KEYS.filter((key) => localState[key] > 0);
}

function countSelectedTopics(): number {
    return getSelectedTopics().length;
}

function refreshSummaryBar(): void {
    if (!summaryBar) {
        return;
    }
    const summary = describeSheet(getSelectedTopics(), panelSelections);
    summaryBar.update({
        selectedTopicCount: countSelectedTopics(),
        maximumTopicCount: MAXIMUM_TOPIC_COUNT,
        halfPageCount,
        viewMode,
        fullSummary: summary.full,
        shortSummary: summary.short
    });
}

// At the limit, cards that are not chosen cannot be added
function refreshTopicAvailability(): void {
    const limitReached = countSelectedTopics() >= MAXIMUM_TOPIC_COUNT;
    topicCards.forEach((card) => card.setLocked(limitReached));
}

// A few words under each card's title: its level, or how much of its list is chosen
function refreshCardSummary(topic: TopicKey): void {
    const card = topicCards.get(topic);
    if (!card) {
        return;
    }
    const configurableTopic = findConfigurableTopic(topic);
    card.setSummary(
        configurableTopic ? summarizeSelection(configurableTopic, panelSelections) : '',
        describeTopicDetail(topic, panelSelections, true)
    );
}

function changePanelSelection(topic: TopicKey): void {
    savePanelSelections(panelSelections);
    refreshCardSummary(topic);
    refreshPreview(topic);
    refreshSummaryBar();
}

function clickTopicChoice(topic: TopicKey): void {
    localState[topic] = localState[topic] === 0 ? 1 : 0;
    topicCards.get(topic)?.setSelected(localState[topic] === 1);
    saveSelectedTopics(getSelectedTopics());
    refreshTopicAvailability();
    refreshSummaryBar();
}

function changeViewMode(nextViewMode: ViewMode): void {
    viewMode = nextViewMode;
    saveViewMode(viewMode);
    document.getElementById('topic-grid')?.setAttribute('data-view', viewMode);
    topicCards.forEach((card) => card.setViewMode(viewMode));
    refreshSummaryBar();
}

function changeHalfPageCount(newCount: number): void {
    halfPageCount = newCount;
    saveHalfPageCount(halfPageCount);
    refreshSummaryBar();
}

function renderMainInitial() {
    const mainElement = document.getElementsByTagName('main')[0];
    if (!mainElement) return Error('No main element found in DOM.');
    mainElement.replaceChildren();
    topicCards.clear();

    const introSection = document.createElement('section');
    introSection.id = 'intro-section';
    const instructionPara = document.createElement('p');
    instructionPara.textContent = 'Select up to six topics below. Choose how many half-pages to print. Each half-page mixes the selected topics across its quadrants.';
    introSection.appendChild(instructionPara);
    mainElement.appendChild(introSection);

    const topicGrid = document.createElement('section');
    topicGrid.id = 'topic-grid';
    topicGrid.setAttribute('data-view', viewMode);
    for (const topic of TOPIC_KEYS) {
        const card = createTopicCard(topic, panelSelections, {
            onToggle: () => clickTopicChoice(topic),
            onSettingsChange: () => changePanelSelection(topic)
        });
        card.setSelected(localState[topic] > 0);
        card.setViewMode(viewMode);
        topicCards.set(topic, card);
        topicGrid.appendChild(card.element);
    }
    mainElement.appendChild(topicGrid);

    // Sits after main and before the page footer, so it stops against the footer's top edge
    document.getElementById('summary-bar-slot')?.remove();
    summaryBar = createSummaryBar(
        {
            selectedTopicCount: countSelectedTopics(),
            maximumTopicCount: MAXIMUM_TOPIC_COUNT,
            halfPageCount,
            viewMode,
            fullSummary: '',
            shortSummary: ''
        },
        {
            onViewModeChange: changeViewMode,
            onHalfPageCountChange: changeHalfPageCount,
            onMake: makeRandomizedWorksheetBatch
        }
    );
    summaryBar.element.id = 'summary-bar-slot';
    mainElement.after(summaryBar.element);
}

export function renderApp() {
    try {
        renderMainInitial();
        renderTestWorksheetButton();
        // Restored topics need their limit, summaries and bar before anyone clicks
        refreshTopicAvailability();
        TOPIC_KEYS.forEach((topic) => {
            refreshCardSummary(topic);
            refreshPreview(topic);
        });
        refreshSummaryBar();
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

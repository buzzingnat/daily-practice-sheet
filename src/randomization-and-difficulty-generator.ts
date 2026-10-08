import { HalfPageLayout, QuadrantExercise } from './worksheet-layout';
import { createKanaExercise } from './kana-exercise';
import { createAdditionExercise } from './addition-exercise';
import { createSubtractionExercise } from './subtraction-exercise';
import { ClockType, createClockExercise } from './clock-exercise';
import { createFractionsExercise } from './fractions-exercise';
import { CONTINENTS, Continent, createGeographyExercise } from './geography-exercise';
import { planHalfPages } from './half-page-planner';
import { ShuffledDeck, createShuffledDeck } from './shuffled-deck';
import { QuadrantTopics, RandomSource, TopicKey } from './types';

export interface KanaCard {
    character: string;
    pronunciationHint: string;
}

// Content that must take turns rather than trust to luck.
export interface ContentDecks {
    kana: ShuffledDeck<KanaCard>;
    continents: ShuffledDeck<Continent>;
}

// Factories for instantiating quadrant exercises. Topics with rotating
// content receive the card already dealt; the rest roll their own numbers.
export interface ExerciseFactories {
    createClockExercise(clockType: ClockType): QuadrantExercise;
    createSubtractionExercise(): QuadrantExercise;
    createAdditionExercise(): QuadrantExercise;
    createKanaExercise(card: KanaCard): QuadrantExercise;
    createFractionsExercise(): QuadrantExercise;
    createGeographyExercise(continent: Continent): QuadrantExercise;
}

// The page count lives in one place, so the coming page-count selector has one number to change.
const SHEETS_PER_BATCH = 1;
const HALF_PAGES_PER_SHEET = 2;

// Each card appears this often per cycle: five kana twice in ten draws,
// seven continents twice in fourteen.
const COPIES_PER_CYCLE = 2;

const KANA_CARDS: readonly KanaCard[] = [
    { character: 'お', pronunciationHint: '"o" pronounce "oa", as in boat.' },
    { character: 'あ', pronunciationHint: '"a" pronounce "ah", as in father.' },
    { character: 'い', pronunciationHint: '"i" pronounce "ee", as in meet.' },
    { character: 'う', pronunciationHint: '"u" pronounce "oo", as in boot.' },
    { character: 'え', pronunciationHint: '"e" pronounce "eh", as in bet.' }
];

/**
 * Builds fresh decks for one batch. Exported so a later task can keep one
 * set alive across clicks; for now every click starts with a new shuffle.
 */
export function createContentDecks(random: RandomSource): ContentDecks {
    return {
        kana: createShuffledDeck(KANA_CARDS, COPIES_PER_CYCLE, random),
        continents: createShuffledDeck(CONTINENTS, COPIES_PER_CYCLE, random)
    };
}

/**
 * Resolves a topic into a concrete exercise, dealing a card where the topic
 * needs one. The closing else assigns to never, so a topic added without a
 * branch is caught by the compiler instead of by a puzzled child.
 */
function instantiateExercise(
    topic: TopicKey,
    factories: ExerciseFactories,
    decks: ContentDecks
): QuadrantExercise {
    if (topic === 'tellTime') {
        return factories.createClockExercise('telling');
    } else if (topic === 'setTime') {
        return factories.createClockExercise('setting');
    } else if (topic === 'subtraction') {
        return factories.createSubtractionExercise();
    } else if (topic === 'addition') {
        return factories.createAdditionExercise();
    } else if (topic === 'hiragana') {
        return factories.createKanaExercise(decks.kana.drawNext());
    } else if (topic === 'fractions') {
        return factories.createFractionsExercise();
    } else if (topic === 'continents') {
        return factories.createGeographyExercise(decks.continents.drawNext());
    } else {
        const unhandledTopic: never = topic;
        throw new Error(`No exercise factory for ${String(unhandledTopic)}`);
    }
}

/**
 * Turns one planned half-page into exercises. Quadrants are built one per
 * line, in reading order, so cards are dealt in the order a reader meets them.
 */
function buildHalfPageLayout(
    topics: QuadrantTopics,
    factories: ExerciseFactories,
    decks: ContentDecks
): HalfPageLayout {
    const [topLeftTopic, topRightTopic, bottomLeftTopic, bottomRightTopic] = topics;
    const topLeft = instantiateExercise(topLeftTopic, factories, decks);
    const topRight = instantiateExercise(topRightTopic, factories, decks);
    const bottomLeft = instantiateExercise(bottomLeftTopic, factories, decks);
    const bottomRight = instantiateExercise(bottomRightTopic, factories, decks);
    return { topLeft, topRight, bottomLeft, bottomRight };
}

/**
 * Supplies the concrete exercise builders. Clock times, sums and fractions
 * still roll their own dice; only topic placement and rotating content
 * answer to the planner.
 */
export function createWorkbookExerciseFactories(): ExerciseFactories {
    return {
        createClockExercise: (clockType: ClockType): QuadrantExercise => {
            let title = 'SETTING TIME';
            if (clockType === 'telling') {
                title = 'TELLING TIME';
            }
            // Generate a random hour between 1 and 12 inclusive
            const randomHour = Math.floor(Math.random() * 12) + 1;
            // Generate a random minute interval snapping cleanly to 5-minute ticks
            const randomMinute = Math.floor(Math.random() * 12) * 5;
            return createClockExercise(clockType, title, { hours: randomHour, minutes: randomMinute });
        },
        createFractionsExercise: (): QuadrantExercise => {
            return createFractionsExercise('1st', 'FRACTIONS');
        },
        createSubtractionExercise: (): QuadrantExercise => {
            return createSubtractionExercise('1st');
        },
        createAdditionExercise: (): QuadrantExercise => {
            return createAdditionExercise('1st');
        },
        createKanaExercise: (card: KanaCard): QuadrantExercise => {
            return createKanaExercise('HIRAGANA PRACTICE', card.character, card.pronunciationHint);
        },
        createGeographyExercise: (continent: Continent): QuadrantExercise => {
            // Map data was preloaded at startup, so this stays synchronous
            return createGeographyExercise(continent);
        }
    };
}

/**
 * Compiles the workbook sheets (one page for now) from the selected topics.
 * The planner decides who sits where; the decks decide which kana and which
 * continent; the factories do the drawing.
 */
export function generateWorkbookBatch(
    factories: ExerciseFactories,
    selectedTopics: readonly TopicKey[],
    random: RandomSource = Math.random
): HalfPageLayout[][] {
    if (selectedTopics.length === 0) {
        throw new Error('Select at least one topic before generating a worksheet.');
    }

    const plans = planHalfPages(selectedTopics, SHEETS_PER_BATCH * HALF_PAGES_PER_SHEET, random);
    const decks = createContentDecks(random);

    const workbookBatch: HalfPageLayout[][] = [];
    let currentSheetHalfPages: HalfPageLayout[] = [];

    plans.forEach((topics) => {
        currentSheetHalfPages.push(buildHalfPageLayout(topics, factories, decks));
        if (currentSheetHalfPages.length === HALF_PAGES_PER_SHEET) {
            workbookBatch.push(currentSheetHalfPages);
            currentSheetHalfPages = [];
        }
    });

    return workbookBatch;
}

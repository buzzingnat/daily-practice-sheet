import { HalfPageLayout, QuadrantExercise } from './worksheet-layout';
import { createKanaExercise } from './kana-exercise';
import { createAdditionExercise } from './addition-exercise';
import { createSubtractionExercise } from './subtraction-exercise';
import { ClockType, createClockExercise } from './clock-exercise';
import { createFractionsExercise } from './fractions-exercise';
import { CONTINENTS, Continent, createGeographyExercise } from './geography-exercise';
import { planHalfPages } from './half-page-planner';
import { ShuffledDeck, createShuffledDeck } from './shuffled-deck';
import { createRegionMapExercise, listRegionTargets } from './region-map-exercise';
import { KanaCard, listKanaCards } from './kana-rows';
import { GradeLevel, PopulatedRegion, QuadrantTopics, RandomSource, TopicKey, TopicSettings } from './types';

// Content that must take turns rather than trust to luck.
export interface ContentDecks {
    kana: ShuffledDeck<KanaCard>;
    continents: ShuffledDeck<Continent>;
    regions: ShuffledDeck<PopulatedRegion>;
    // One deck of country identifiers per chosen region, so each region cycles through its own countries
    countriesByRegion: Map<PopulatedRegion, ShuffledDeck<string>>;
}

// Factories for instantiating quadrant exercises. Topics with rotating
// content receive the card already dealt; the rest roll their own numbers.
export interface ExerciseFactories {
    createClockExercise(clockType: ClockType): QuadrantExercise;
    createSubtractionExercise(level: GradeLevel): QuadrantExercise;
    createAdditionExercise(level: GradeLevel): QuadrantExercise;
    createKanaExercise(card: KanaCard): QuadrantExercise;
    createFractionsExercise(level: GradeLevel): QuadrantExercise;
    createGeographyExercise(continent: Continent): QuadrantExercise;
    createCountryExercise(region: PopulatedRegion, countryIdentifier: string): QuadrantExercise;
}

// The page count lives in one place, so the coming page-count selector has one number to change.
const SHEETS_PER_BATCH = 1;
const HALF_PAGES_PER_SHEET = 2;

// Each card appears this often per cycle: five kana twice in ten draws,
// seven continents twice in fourteen.
const COPIES_PER_CYCLE = 2;

/**
 * Builds fresh decks for one batch. Exported so a later task can keep one
 * set alive across clicks; for now every click starts with a new shuffle.
 */
export function createContentDecks(random: RandomSource, settings: TopicSettings): ContentDecks {
    const countriesByRegion = new Map<PopulatedRegion, ShuffledDeck<string>>();
    settings.countries.regions.forEach((region) => {
        const identifiers = listRegionTargets(region).map((country) => country.identifier);
        countriesByRegion.set(region, createShuffledDeck(identifiers, COPIES_PER_CYCLE, random));
    });

    return {
        kana: createShuffledDeck(listKanaCards(settings.hiragana.rows), COPIES_PER_CYCLE, random),
        continents: createShuffledDeck(CONTINENTS, COPIES_PER_CYCLE, random),
        regions: createShuffledDeck(settings.countries.regions, COPIES_PER_CYCLE, random),
        countriesByRegion
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
    decks: ContentDecks,
    settings: TopicSettings
): QuadrantExercise {
    if (topic === 'tellTime') {
        return factories.createClockExercise('telling');
    } else if (topic === 'setTime') {
        return factories.createClockExercise('setting');
    } else if (topic === 'subtraction') {
        return factories.createSubtractionExercise(settings.subtraction.level);
    } else if (topic === 'addition') {
        return factories.createAdditionExercise(settings.addition.level);
    } else if (topic === 'hiragana') {
        return factories.createKanaExercise(decks.kana.drawNext());
    } else if (topic === 'fractions') {
        return factories.createFractionsExercise(settings.fractions.level);
    } else if (topic === 'continents') {
        return factories.createGeographyExercise(decks.continents.drawNext());
    } else if (topic === 'countries') {
        // The region deck says where; that region's own deck says which country
        const region = decks.regions.drawNext();
        const countryDeck = decks.countriesByRegion.get(region);
        if (!countryDeck) {
            throw new Error(`No country deck was built for ${region}.`);
        }
        return factories.createCountryExercise(region, countryDeck.drawNext());
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
    decks: ContentDecks,
    settings: TopicSettings
): HalfPageLayout {
    const [topLeftTopic, topRightTopic, bottomLeftTopic, bottomRightTopic] = topics;
    const topLeft = instantiateExercise(topLeftTopic, factories, decks, settings);
    const topRight = instantiateExercise(topRightTopic, factories, decks, settings);
    const bottomLeft = instantiateExercise(bottomLeftTopic, factories, decks, settings);
    const bottomRight = instantiateExercise(bottomRightTopic, factories, decks, settings);
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
        createFractionsExercise: (level: GradeLevel): QuadrantExercise => {
            return createFractionsExercise(level, 'FRACTIONS');
        },
        createSubtractionExercise: (level: GradeLevel): QuadrantExercise => {
            return createSubtractionExercise(level);
        },
        createAdditionExercise: (level: GradeLevel): QuadrantExercise => {
            return createAdditionExercise(level);
        },
        createKanaExercise: (card: KanaCard): QuadrantExercise => {
            return createKanaExercise('HIRAGANA PRACTICE', card.character, card.pronunciationHint);
        },
        createGeographyExercise: (continent: Continent): QuadrantExercise => {
            // Map data was preloaded at startup, so this stays synchronous
            return createGeographyExercise(continent);
        },
        createCountryExercise: (region: PopulatedRegion, countryIdentifier: string): QuadrantExercise => {
            return createRegionMapExercise(region, countryIdentifier);
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
    settings: TopicSettings,
    random: RandomSource = Math.random
): HalfPageLayout[][] {
    if (selectedTopics.length === 0) {
        throw new Error('Select at least one topic before generating a worksheet.');
    }

    const plans = planHalfPages(selectedTopics, SHEETS_PER_BATCH * HALF_PAGES_PER_SHEET, random);
    const decks = createContentDecks(random, settings);

    const workbookBatch: HalfPageLayout[][] = [];
    let currentSheetHalfPages: HalfPageLayout[] = [];

    plans.forEach((topics) => {
        currentSheetHalfPages.push(buildHalfPageLayout(topics, factories, decks, settings));
        if (currentSheetHalfPages.length === HALF_PAGES_PER_SHEET) {
            workbookBatch.push(currentSheetHalfPages);
            currentSheetHalfPages = [];
        }
    });

    return workbookBatch;
}

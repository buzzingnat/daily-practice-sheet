import { ClockType } from '../exercises/clock-exercise';
import { Continent } from '../exercises/geography/geography-exercise';
import { listKanaCards } from '../exercises/kana/kana-rows';
import { listCursiveCards } from '../exercises/cursive/cursive-cards';
import {
    CursiveLayoutName,
    GradeLevel,
    PopulatedRegion,
    TopicKey,
    TopicSettings,
    TOPIC_KEYS
} from '../types';

export type ExampleSpecification =
    | { type: 'clock'; clockType: ClockType, title: string; hours: number; minutes: number; digitalDisplayLabel?: string }
    | { type: 'fractions'; title: string; grade: GradeLevel }
    | { type: 'subtraction'; grade: GradeLevel; title?: string }
    | { type: 'addition'; grade: GradeLevel; title?: string }
    | { type: 'kana'; title: string; character: string; pronunciation: string }
    | { type: 'cursive'; letter: string; layout: CursiveLayoutName }
    | { type: 'geography'; continent: Continent; title?: string }
    | { type: 'regionCountry'; region: PopulatedRegion; targetIdentifier: string; title?: string }
    | { type: 'placeholder'; title: string }
    | { type: 'blank';};

// One well-known country per region, so each region's example always highlights the same place
const EXAMPLE_COUNTRY_BY_REGION: Record<PopulatedRegion, string> = {
    'Europe': '643',
    'Asia': '643',
    'Africa': '404',
    'North America': '484',
    'South America': '076',
    'Oceania': '554',
    'Central America': '192'
};

const EXAMPLE_CONTINENT: Continent = 'Europe';

/**
 * The example previews for the chosen topics, drawn the way the printed sheet
 * will draw them: a level topic shows its chosen level, and a list topic shows
 * the first item of what was chosen. With no topic chosen yet, every topic is
 * shown at its current settings, so the page is never empty.
 */
export function buildExampleSpecifications(
    selectedTopics: readonly TopicKey[],
    settings: TopicSettings
): ExampleSpecification[] {
    const topics = selectedTopics.length > 0 ? selectedTopics : TOPIC_KEYS;
    // TOPIC_KEYS order, so the examples do not shuffle as the user clicks
    return TOPIC_KEYS
        .filter((topic) => topics.includes(topic))
        .flatMap((topic) => buildTopicExamples(topic, settings));
}

function buildTopicExamples(topic: TopicKey, settings: TopicSettings): ExampleSpecification[] {
    if (topic === 'tellTime') {
        return [{ type: 'clock', clockType: 'telling', title: 'TELLING TIME', hours: 10, minutes: 10 }];
    } else if (topic === 'setTime') {
        return [{ type: 'clock', clockType: 'setting', title: 'SETTING TIME', hours: 3, minutes: 30 }];
    } else if (topic === 'fractions') {
        return [{ type: 'fractions', title: 'FRACTIONS', grade: settings.fractions.level }];
    } else if (topic === 'addition') {
        return [{ type: 'addition', grade: settings.addition.level }];
    } else if (topic === 'subtraction') {
        return [{ type: 'subtraction', grade: settings.subtraction.level }];
    } else if (topic === 'hiragana') {
        const card = listKanaCards(settings.hiragana.rows)[0];
        return card
            ? [{ type: 'kana', title: 'HIRAGANA PRACTICE', character: card.character, pronunciation: card.pronunciationHint }]
            : [];
    } else if (topic === 'cursiveLetters') {
        const card = listCursiveCards(settings.cursiveLetters.groups)[0];
        return card ? [{ type: 'cursive', letter: card.letter, layout: settings.cursiveLetters.layout }] : [];
    } else if (topic === 'continents') {
        return [{ type: 'geography', continent: EXAMPLE_CONTINENT }];
    } else if (topic === 'countries') {
        return settings.countries.regions.map((region) => {
            return { type: 'regionCountry', region, targetIdentifier: EXAMPLE_COUNTRY_BY_REGION[region] };
        });
    } else {
        const unhandledTopic: never = topic;
        throw new Error(`No example for ${String(unhandledTopic)}`);
    }
}

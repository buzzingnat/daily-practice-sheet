import {
    CONFIGURABLE_TOPICS,
    ConfigurableTopic,
    GradeLevel,
    KANA_ROWS,
    KanaRow,
    POPULATED_REGIONS,
    PopulatedRegion,
    TopicKey,
    TopicSettings
} from './types';

export interface ChoiceOption {
    // Compared in code
    value: string;
    // Shown to the human; kept apart so a translation has somewhere to live
    label: string;
}

export interface PanelSpecification {
    topic: ConfigurableTopic;
    heading: string;
    kind: 'single' | 'multiple';
    options: readonly ChoiceOption[];
    defaultValues: readonly string[];
    // Multiple choice only: the plural for the button summary, and whether an "All" chip is offered
    summaryNoun: string;
    offersAll: boolean;
}

// What the UI stores while the human clicks. Strings in, types out, at one border.
export type PanelSelections = Record<ConfigurableTopic, string[]>;

const GRADE_LEVELS: readonly GradeLevel[] = ['1st', '2nd', '3rd'];

const ADDITION_OPTIONS: readonly ChoiceOption[] = [
    { value: '1st', label: 'Single digit' },
    { value: '2nd', label: 'Double digit' },
    { value: '3rd', label: 'Triple digit' }
];

const SUBTRACTION_OPTIONS: readonly ChoiceOption[] = [
    { value: '1st', label: 'Up to 20' },
    { value: '2nd', label: 'Double digit' },
    { value: '3rd', label: 'Triple digit' }
];

// The fraction levels differ by how finely the circle is cut
const FRACTIONS_OPTIONS: readonly ChoiceOption[] = [
    { value: '1st', label: 'Up to fourths' },
    { value: '2nd', label: 'Up to eighths' },
    { value: '3rd', label: 'Up to twelfths' }
];

const KANA_ROW_OPTIONS: readonly ChoiceOption[] = [
    { value: 'vowels', label: 'あ vowels' },
    { value: 'k', label: 'か k' },
    { value: 's', label: 'さ s' },
    { value: 't', label: 'た t' },
    { value: 'n', label: 'な n' },
    { value: 'h', label: 'は h' },
    { value: 'm', label: 'ま m' },
    { value: 'y', label: 'や y' },
    { value: 'r', label: 'ら r' },
    { value: 'wn', label: 'わ w + n' }
];

const REGION_OPTIONS: readonly ChoiceOption[] = POPULATED_REGIONS.map((region) => {
    return { value: region, label: region };
});

// In topic order, which is the order the panels appear
export const PANEL_SPECIFICATIONS: readonly PanelSpecification[] = [
    {
        topic: 'fractions', heading: 'Fractions', kind: 'single',
        options: FRACTIONS_OPTIONS, defaultValues: ['1st'], summaryNoun: '', offersAll: false
    },
    {
        topic: 'addition', heading: 'Addition', kind: 'single',
        options: ADDITION_OPTIONS, defaultValues: ['1st'], summaryNoun: '', offersAll: false
    },
    {
        topic: 'subtraction', heading: 'Subtraction', kind: 'single',
        options: SUBTRACTION_OPTIONS, defaultValues: ['1st'], summaryNoun: '', offersAll: false
    },
    {
        topic: 'hiragana', heading: 'Hiragana rows', kind: 'multiple',
        options: KANA_ROW_OPTIONS, defaultValues: ['vowels'], summaryNoun: 'rows', offersAll: true
    },
    {
        topic: 'countries', heading: 'Countries: regions', kind: 'multiple',
        options: REGION_OPTIONS, defaultValues: POPULATED_REGIONS, summaryNoun: 'regions', offersAll: true
    }
];

export function findConfigurableTopic(topic: TopicKey): ConfigurableTopic | undefined {
    return CONFIGURABLE_TOPICS.find((candidate) => candidate === topic);
}

export function findPanelSpecification(topic: ConfigurableTopic): PanelSpecification {
    const specification = PANEL_SPECIFICATIONS.find((candidate) => candidate.topic === topic);
    if (!specification) {
        throw new Error(`No settings panel is specified for ${topic}.`);
    }
    return specification;
}

export function createDefaultSelections(): PanelSelections {
    return {
        fractions: [...findPanelSpecification('fractions').defaultValues],
        addition: [...findPanelSpecification('addition').defaultValues],
        subtraction: [...findPanelSpecification('subtraction').defaultValues],
        hiragana: [...findPanelSpecification('hiragana').defaultValues],
        countries: [...findPanelSpecification('countries').defaultValues]
    };
}

/**
 * Keeps the allowed items the human chose, in the allowed list's order. An
 * empty result means the selection holds nothing real, which is an error.
 */
function pickChosen<Item extends string>(
    allowed: readonly Item[],
    chosen: readonly string[],
    topic: ConfigurableTopic
): Item[] {
    const picked = allowed.filter((item) => chosen.includes(item));
    if (picked.length === 0) {
        throw new Error(`The ${topic} settings hold no valid choice.`);
    }
    return picked;
}

function pickLevel(chosen: readonly string[], topic: ConfigurableTopic): GradeLevel {
    const level = pickChosen(GRADE_LEVELS, chosen, topic)[0];
    if (!level) {
        throw new Error(`The ${topic} settings hold no valid level.`);
    }
    return level;
}

/**
 * The one place strings become typed settings. Anything no list contains is
 * ignored, and a topic left with nothing valid throws.
 */
export function resolveTopicSettings(selections: PanelSelections): TopicSettings {
    const kanaRows: readonly KanaRow[] = KANA_ROWS;
    const regions: readonly PopulatedRegion[] = POPULATED_REGIONS;
    return {
        fractions: { level: pickLevel(selections.fractions, 'fractions') },
        addition: { level: pickLevel(selections.addition, 'addition') },
        subtraction: { level: pickLevel(selections.subtraction, 'subtraction') },
        hiragana: { rows: pickChosen(kanaRows, selections.hiragana, 'hiragana') },
        countries: { regions: pickChosen(regions, selections.countries, 'countries') }
    };
}

/**
 * A few words for the topic button: the level, or how much of the list is chosen.
 */
export function summarizeSelection(topic: ConfigurableTopic, selections: PanelSelections): string {
    const specification = findPanelSpecification(topic);
    const chosen = selections[topic];
    const chosenOptions = specification.options.filter((option) => chosen.includes(option.value));

    if (specification.kind === 'single') {
        const option = chosenOptions[0];
        return option ? option.label.toLowerCase() : '';
    } else if (chosenOptions.length === specification.options.length) {
        return 'all';
    } else if (chosenOptions.length === 1 && chosenOptions[0]) {
        return chosenOptions[0].label;
    } else {
        return `${chosenOptions.length} ${specification.summaryNoun}`;
    }
}

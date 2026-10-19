import {
    CONFIGURABLE_TOPICS,
    ConfigurableTopic,
    CURSIVE_GROUPS,
    CursiveGroup,
    CursiveLayoutName,
    CURSIVE_LAYOUT_NAMES,
    DEFAULT_CURSIVE_LAYOUT,
    GradeLevel,
    KANA_ROWS,
    KanaRow,
    PanelId,
    POPULATED_REGIONS,
    PopulatedRegion,
    TopicKey,
    TopicSettings
} from '../types';

export interface ChoiceOption {
    // Compared in code
    value: string;
    // Shown to the user; kept apart so a translation has somewhere to live
    label: string;
}

export interface PanelSpecification {
    // Names the panel in saved settings and in the DOM
    id: PanelId;
    // The topic whose button reveals this panel; a topic may own several panels
    topic: ConfigurableTopic;
    heading: string;
    kind: 'single' | 'multiple';
    options: readonly ChoiceOption[];
    defaultValues: readonly string[];
    // Multiple choice only: the plural for the button summary, and whether an "All" chip is offered
    summaryNoun: string;
    offersAll: boolean;
}

// What the UI stores while the user clicks. Strings in, types out, at one border.
export type PanelSelections = Record<PanelId, string[]>;

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

// The Montessori sets, labeled the way a teacher says them: "s m a t"
const CURSIVE_GROUP_OPTIONS: readonly ChoiceOption[] = CURSIVE_GROUPS.map((group) => {
    return { value: group, label: group.split('-').join(' ') };
});

const CURSIVE_LAYOUT_OPTIONS: readonly ChoiceOption[] = [
    { value: 'one-large-line', label: 'One large line' },
    { value: 'two-lines', label: 'Two lines' }
];

const REGION_OPTIONS: readonly ChoiceOption[] = POPULATED_REGIONS.map((region) => {
    return { value: region, label: region };
});

// In topic order, which is the order the panels appear
export const PANEL_SPECIFICATIONS: readonly PanelSpecification[] = [
    {
        id: 'fractions', topic: 'fractions', heading: 'Fractions', kind: 'single',
        options: FRACTIONS_OPTIONS, defaultValues: ['1st'], summaryNoun: '', offersAll: false
    },
    {
        id: 'addition', topic: 'addition', heading: 'Addition', kind: 'single',
        options: ADDITION_OPTIONS, defaultValues: ['1st'], summaryNoun: '', offersAll: false
    },
    {
        id: 'subtraction', topic: 'subtraction', heading: 'Subtraction', kind: 'single',
        options: SUBTRACTION_OPTIONS, defaultValues: ['1st'], summaryNoun: '', offersAll: false
    },
    {
        id: 'hiragana', topic: 'hiragana', heading: 'Hiragana rows', kind: 'multiple',
        options: KANA_ROW_OPTIONS, defaultValues: ['vowels'], summaryNoun: 'rows', offersAll: true
    },
    {
        id: 'cursiveLetters', topic: 'cursiveLetters', heading: 'Cursive letters: sets', kind: 'multiple',
        options: CURSIVE_GROUP_OPTIONS, defaultValues: ['s-m-a-t'], summaryNoun: 'sets', offersAll: true
    },
    {
        id: 'cursiveLayout', topic: 'cursiveLetters', heading: 'Cursive letters: practice lines', kind: 'single',
        options: CURSIVE_LAYOUT_OPTIONS, defaultValues: [DEFAULT_CURSIVE_LAYOUT], summaryNoun: '', offersAll: false
    },
    {
        id: 'countries', topic: 'countries', heading: 'Countries: regions', kind: 'multiple',
        options: REGION_OPTIONS, defaultValues: ['Africa'], summaryNoun: 'regions', offersAll: true
    }
];

export function findConfigurableTopic(topic: TopicKey): ConfigurableTopic | undefined {
    return CONFIGURABLE_TOPICS.find((candidate) => candidate === topic);
}

export function findPanelSpecification(id: PanelId): PanelSpecification {
    const specification = PANEL_SPECIFICATIONS.find((candidate) => candidate.id === id);
    if (!specification) {
        throw new Error(`No settings panel is specified for ${id}.`);
    }
    return specification;
}

// Every panel a topic owns, in the order they appear
export function findPanelSpecifications(topic: ConfigurableTopic): PanelSpecification[] {
    return PANEL_SPECIFICATIONS.filter((candidate) => candidate.topic === topic);
}

export function createDefaultSelections(): PanelSelections {
    return {
        fractions: [...findPanelSpecification('fractions').defaultValues],
        addition: [...findPanelSpecification('addition').defaultValues],
        subtraction: [...findPanelSpecification('subtraction').defaultValues],
        hiragana: [...findPanelSpecification('hiragana').defaultValues],
        cursiveLetters: [...findPanelSpecification('cursiveLetters').defaultValues],
        cursiveLayout: [...findPanelSpecification('cursiveLayout').defaultValues],
        countries: [...findPanelSpecification('countries').defaultValues]
    };
}

/**
 * Keeps the allowed items the user chose, in the allowed list's order. An
 * empty result means the selection holds nothing real, which is an error.
 */
function pickChosen<Item extends string>(
    allowed: readonly Item[],
    chosen: readonly string[],
    panel: PanelId
): Item[] {
    const picked = allowed.filter((item) => chosen.includes(item));
    if (picked.length === 0) {
        throw new Error(`The ${panel} settings hold no valid choice.`);
    }
    return picked;
}

function pickLayout(chosen: readonly string[], panel: PanelId): CursiveLayoutName {
    const layout = pickChosen(CURSIVE_LAYOUT_NAMES, chosen, panel)[0];
    if (!layout) {
        throw new Error(`The ${panel} settings hold no valid layout.`);
    }
    return layout;
}

function pickLevel(chosen: readonly string[], panel: PanelId): GradeLevel {
    const level = pickChosen(GRADE_LEVELS, chosen, panel)[0];
    if (!level) {
        throw new Error(`The ${panel} settings hold no valid level.`);
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
    const cursiveGroups: readonly CursiveGroup[] = CURSIVE_GROUPS;
    return {
        fractions: { level: pickLevel(selections.fractions, 'fractions') },
        addition: { level: pickLevel(selections.addition, 'addition') },
        subtraction: { level: pickLevel(selections.subtraction, 'subtraction') },
        hiragana: { rows: pickChosen(kanaRows, selections.hiragana, 'hiragana') },
        cursiveLetters: {
            groups: pickChosen(cursiveGroups, selections.cursiveLetters, 'cursiveLetters'),
            layout: pickLayout(selections.cursiveLayout, 'cursiveLayout')
        },
        countries: { regions: pickChosen(regions, selections.countries, 'countries') }
    };
}

// A few words for one panel: the level, or how much of its list is chosen
function summarizePanel(specification: PanelSpecification, selections: PanelSelections): string {
    const chosen = selections[specification.id];
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

/**
 * A few words for the topic button: each of the topic's panels summarized, joined by commas.
 */
export function summarizeSelection(topic: ConfigurableTopic, selections: PanelSelections): string {
    return findPanelSpecifications(topic)
        .map((specification) => summarizePanel(specification, selections))
        .filter((summary) => summary !== '')
        .join(', ');
}

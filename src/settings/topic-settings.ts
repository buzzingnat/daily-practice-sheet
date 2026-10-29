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
    MultiplicationSettings,
    PanelId,
    POPULATED_REGIONS,
    PopulatedRegion,
    TopicKey,
    TopicSettings
} from '../types';
import { OptionWords } from '../text/message-catalog';
import { getMessages } from '../text/messages';

export interface ChoiceOption {
    // Compared in code
    value: string;
    // Shown to the user; kept apart so a translation has somewhere to live
    label: string;
    // The compact view and the summary bar use this when the label is long; absent when it is short enough
    shortLabel?: string;
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
    // Multiple choice only: shortcut chips that replace the selection with a fixed set
    presets?: readonly ChoicePreset[];
    // Multiple choice only: a chip, shown last, that cannot be combined with any other. It is
    // not in options, so "All" and the other shortcuts leave it alone; listChoices counts it.
    exclusiveOption?: ChoiceOption;
    // Multiple choice only: a value that may not be the only one chosen
    needsCompanion?: CompanionRule;
}

// A chip that is only allowed beside at least one other chip, and what to tell the user when it is not
export interface CompanionRule {
    value: string;
    message: string;
}

export interface ChoicePreset {
    label: string;
    values: readonly string[];
}

// What the UI stores while the user clicks. Strings in, types out, at one border.
export type PanelSelections = Record<PanelId, string[]>;

const MULTIPLICATION_TWO_DIGIT = 'two-digit';
const MULTIPLICATION_FACTORS: readonly number[] = Array.from({ length: 13 }, (unused, factor) => factor);

const GRADE_LEVELS: readonly GradeLevel[] = ['1st', '2nd', '3rd'];

// A chip whose words are looked up when read, so a change of language reaches chips already built
function wordedOption(value: string, findWords: () => OptionWords): ChoiceOption {
    return {
        value,
        get label(): string {
            return findWords().label;
        },
        get shortLabel(): string {
            return findWords().shortLabel;
        }
    };
}

function gradeOptions(findLevels: () => Record<GradeLevel, OptionWords>): readonly ChoiceOption[] {
    return GRADE_LEVELS.map((level) => wordedOption(level, () => findLevels()[level]));
}

const ADDITION_OPTIONS = gradeOptions(() => getMessages().ui.settings.additionLevels);

const SUBTRACTION_OPTIONS = gradeOptions(() => getMessages().ui.settings.subtractionLevels);

const DIVISION_OPTIONS = gradeOptions(() => getMessages().ui.settings.divisionLevels);

const MULTIPLICATION_OPTIONS: readonly ChoiceOption[] = MULTIPLICATION_FACTORS.map((factor) => {
    return { value: String(factor), label: String(factor) };
});

const MULTIPLICATION_TWO_DIGIT_OPTION = wordedOption(MULTIPLICATION_TWO_DIGIT, () => getMessages().ui.settings.multiplication.twoDigit);

const MULTIPLICATION_PRESETS: readonly ChoicePreset[] = [
    {
        get label(): string {
            return getMessages().ui.settings.multiplication.upToFive;
        },
        values: MULTIPLICATION_FACTORS.filter((factor) => factor <= 5).map(String)
    },
    {
        get label(): string {
            return getMessages().ui.settings.multiplication.upToTwelve;
        },
        values: MULTIPLICATION_FACTORS.filter((factor) => factor >= 1).map(String)
    }
];

// The fraction levels differ by how finely the circle is cut
const FRACTIONS_OPTIONS = gradeOptions(() => getMessages().ui.settings.fractionLevels);

const KANA_ROW_OPTIONS: readonly ChoiceOption[] = KANA_ROWS.map((row) => {
    return wordedOption(row, () => getMessages().ui.settings.kanaRows[row]);
});

// The Montessori sets, labeled the way a teacher says them: "s m a t"
const CURSIVE_GROUP_OPTIONS: readonly ChoiceOption[] = CURSIVE_GROUPS.map((group) => {
    return { value: group, label: group.split('-').join(' ') };
});

const CURSIVE_LAYOUT_OPTIONS: readonly ChoiceOption[] = CURSIVE_LAYOUT_NAMES.map((layout) => {
    return wordedOption(layout, () => getMessages().ui.settings.cursiveLayouts[layout]);
});

const REGION_OPTIONS: readonly ChoiceOption[] = POPULATED_REGIONS.map((region) => {
    return wordedOption(region, () => getMessages().ui.settings.regions[region]);
});

// Everything about a panel but its words, which are read from the catalog each time they are asked for
type PanelData = Omit<PanelSpecification, 'heading' | 'summaryNoun'>;

function withPanelWords(data: PanelData): PanelSpecification {
    return {
        ...data,
        get heading(): string {
            return getMessages().ui.settings.panels[data.id].heading;
        },
        get summaryNoun(): string {
            return getMessages().ui.settings.panels[data.id].summaryNoun;
        }
    };
}

// In topic order, which is the order the panels appear
export const PANEL_SPECIFICATIONS: readonly PanelSpecification[] = [
    withPanelWords({
        id: 'fractions', topic: 'fractions', kind: 'single',
        options: FRACTIONS_OPTIONS, defaultValues: ['1st'], offersAll: false
    }),
    withPanelWords({
        id: 'addition', topic: 'addition', kind: 'single',
        options: ADDITION_OPTIONS, defaultValues: ['1st'], offersAll: false
    }),
    withPanelWords({
        id: 'subtraction', topic: 'subtraction', kind: 'single',
        options: SUBTRACTION_OPTIONS, defaultValues: ['1st'], offersAll: false
    }),
    withPanelWords({
        id: 'multiplication', topic: 'multiplication', kind: 'multiple',
        options: MULTIPLICATION_OPTIONS, defaultValues: ['1', '2', '3', '4', '5'], offersAll: false,
        presets: MULTIPLICATION_PRESETS, exclusiveOption: MULTIPLICATION_TWO_DIGIT_OPTION,
        needsCompanion: {
            value: '0',
            get message(): string {
                return getMessages().ui.settings.multiplication.zeroNeedsCompanion;
            }
        }
    }),
    withPanelWords({
        id: 'division', topic: 'division', kind: 'single',
        options: DIVISION_OPTIONS, defaultValues: ['1st'], offersAll: false
    }),
    withPanelWords({
        id: 'hiragana', topic: 'hiragana', kind: 'multiple',
        options: KANA_ROW_OPTIONS, defaultValues: ['vowels'], offersAll: true
    }),
    withPanelWords({
        id: 'cursiveLetters', topic: 'cursiveLetters', kind: 'multiple',
        options: CURSIVE_GROUP_OPTIONS, defaultValues: ['s-m-a-t'], offersAll: true
    }),
    withPanelWords({
        id: 'cursiveLayout', topic: 'cursiveLetters', kind: 'single',
        options: CURSIVE_LAYOUT_OPTIONS, defaultValues: [DEFAULT_CURSIVE_LAYOUT], offersAll: false
    }),
    withPanelWords({
        id: 'countries', topic: 'countries', kind: 'multiple',
        options: REGION_OPTIONS, defaultValues: ['Africa'], offersAll: true
    })
];

// Every chip a panel can hold a selection of: the options, then the exclusive one
export function listChoices(specification: PanelSpecification): ChoiceOption[] {
    return specification.exclusiveOption
        ? [...specification.options, specification.exclusiveOption]
        : [...specification.options];
}

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
        multiplication: [...findPanelSpecification('multiplication').defaultValues],
        division: [...findPanelSpecification('division').defaultValues],
        hiragana: [...findPanelSpecification('hiragana').defaultValues],
        cursiveLetters: [...findPanelSpecification('cursiveLetters').defaultValues],
        cursiveLayout: [...findPanelSpecification('cursiveLayout').defaultValues],
        countries: [...findPanelSpecification('countries').defaultValues]
    };
}

export interface ToggleResult {
    selection: string[];
    // Set when the click was turned away for a reason the user should be told
    refusal?: string;
}

/**
 * What a click on an option chip leaves selected. A chip joins or leaves the
 * selection; the exclusive value replaces everything and is replaced by anything.
 * The last chip standing refuses to leave, so the topic always has something to draw,
 * and a chip that needs a companion is refused when it would be left alone.
 */
export function toggleOption(
    specification: PanelSpecification,
    current: readonly string[],
    value: string
): ToggleResult {
    const exclusiveValue = specification.exclusiveOption?.value;
    if (value === exclusiveValue) {
        return { selection: [value] };
    }
    const withoutExclusive = current.filter((item) => item !== exclusiveValue);
    const isChosen = withoutExclusive.includes(value);
    if (isChosen && withoutExclusive.length === 1) {
        return { selection: [...current] };
    }
    const toggled = isChosen
        ? withoutExclusive.filter((item) => item !== value)
        : [...withoutExclusive, value];

    const rule = specification.needsCompanion;
    if (rule && toggled.length === 1 && toggled[0] === rule.value) {
        return { selection: [...current], refusal: rule.message };
    }
    return { selection: toggled };
}

// The chip that needs a companion looks disabled while a click on it would be refused
export function isChipBlocked(specification: PanelSpecification, current: readonly string[], value: string): boolean {
    return specification.needsCompanion?.value === value
        && toggleOption(specification, current, value).refusal !== undefined;
}

// A preset chip looks pressed while the selection is exactly its set
export function isPresetSelected(preset: ChoicePreset, current: readonly string[]): boolean {
    return current.length === preset.values.length && preset.values.every((value) => current.includes(value));
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

// Two digit wins over any numbers saved beside it; otherwise the chosen numbers, in order
function pickMultiplication(chosen: readonly string[]): MultiplicationSettings {
    if (chosen.includes(MULTIPLICATION_TWO_DIGIT)) {
        return { mode: 'two-digit' };
    }
    const factors = MULTIPLICATION_FACTORS.filter((factor) => chosen.includes(String(factor)));
    if (factors.length === 0) {
        throw new Error('The multiplication settings hold no valid choice.');
    }
    return { mode: 'tables', factors };
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
        multiplication: pickMultiplication(selections.multiplication),
        division: { level: pickLevel(selections.division, 'division') },
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
    const choices = listChoices(specification);
    const chosenOptions = choices.filter((option) => chosen.includes(option.value));
    const summaryWords = getMessages().ui.summary;

    if (specification.kind === 'single') {
        const option = chosenOptions[0];
        return option ? option.label.toLowerCase() : '';
    } else if (chosenOptions.length === choices.length) {
        return summaryWords.all;
    } else if (chosenOptions.length === 1 && chosenOptions[0]) {
        return chosenOptions[0].label;
    } else {
        return summaryWords.countOf(chosenOptions.length, specification.summaryNoun);
    }
}

/**
 * A few words for the topic button: each of the topic's panels summarized, joined by commas.
 */
export function summarizeSelection(topic: ConfigurableTopic, selections: PanelSelections): string {
    const summaries = findPanelSpecifications(topic)
        .map((specification) => summarizePanel(specification, selections))
        .filter((summary) => summary !== '');
    return getMessages().ui.summary.joinButtonPanels(summaries);
}

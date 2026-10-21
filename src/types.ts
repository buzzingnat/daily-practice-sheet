export type GradeLevel = '1st' | '2nd' | '3rd';

// One list, so the UI buttons and the generator cannot disagree about what exists.
export const TOPIC_KEYS = [
    'fractions', 'addition', 'subtraction', 'multiplication',
    'setTime', 'tellTime', 'hiragana',
    'cursiveLetters', 'continents', 'countries'
] as const;

export type TopicKey = typeof TOPIC_KEYS[number];

// How much of each topic card to show: the full card, or a thumbnail with short text.
export const VIEW_MODES = ['normal', 'compact'] as const;

export type ViewMode = typeof VIEW_MODES[number];

// A source of numbers in [0, 1). Checks pass a seeded one in place of Math.random,
// because a test that changes its mind every run proves very little.
export type RandomSource = () => number;

// Four topics in reading order: top left, top right, bottom left, bottom right.
export type QuadrantTopics = readonly [TopicKey, TopicKey, TopicKey, TopicKey];

// The continents where people live, with Central America and the Caribbean given a view of
// their own. Antarctica is left to the penguins.
export const POPULATED_REGIONS = [
    'Africa', 'Asia', 'Central America', 'Europe', 'North America', 'Oceania', 'South America'
] as const;

export type PopulatedRegion = typeof POPULATED_REGIONS[number];

// Degrees on the globe, longitude first, the way d3 insists on having them.
export type GeographicPoint = readonly [longitude: number, latitude: number];

// One chip per row of the hiragana chart. The last row is wa, wo and the lone n.
export const KANA_ROWS = [
    'vowels', 'k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'wn'
] as const;

export type KanaRow = typeof KANA_ROWS[number];

// The Montessori sets for cursive lowercase, in the order they are introduced (after Cathie
// Perolman's color-coded groups): each set but the last holds one vowel and three consonants.
// first group is included as easier to write based on shape
export const CURSIVE_GROUPS = [
    'i-l-c-n', 's-m-a-t', 'c-r-i-p', 'b-f-o-g', 'h-j-u-l', 'd-w-e-n', 'k-q-v-x-y-z'
] as const;

export type CursiveGroup = typeof CURSIVE_GROUPS[number];

// How the cursive quadrant spends its practice area: one large line, or two lines of smaller letters
export const CURSIVE_LAYOUT_NAMES = ['one-large-line', 'two-lines'] as const;

export type CursiveLayoutName = typeof CURSIVE_LAYOUT_NAMES[number];

export const DEFAULT_CURSIVE_LAYOUT: CursiveLayoutName = 'one-large-line';

// Topics that come with a settings panel
export const CONFIGURABLE_TOPICS = [
    'fractions', 'addition', 'subtraction', 'multiplication', 'hiragana', 'cursiveLetters', 'countries'
] as const;

export type ConfigurableTopic = typeof CONFIGURABLE_TOPICS[number];

// Settings panels. A topic usually has one, named for the topic, but may have several.
export const PANEL_IDS = [
    'fractions', 'addition', 'subtraction', 'multiplication', 'hiragana', 'cursiveLetters', 'cursiveLayout', 'countries'
] as const;

export type PanelId = typeof PANEL_IDS[number];

// Times tables use the numbers the user chose; the two-digit mode needs no numbers at all
export type MultiplicationSettings =
    | { mode: 'tables'; factors: readonly number[] }
    | { mode: 'two-digit' };

// What the generator reads: validated, typed, and never empty
export interface TopicSettings {
    fractions: { level: GradeLevel };
    addition: { level: GradeLevel };
    subtraction: { level: GradeLevel };
    multiplication: MultiplicationSettings;
    hiragana: { rows: readonly KanaRow[] };
    cursiveLetters: { groups: readonly CursiveGroup[]; layout: CursiveLayoutName };
    countries: { regions: readonly PopulatedRegion[] };
}

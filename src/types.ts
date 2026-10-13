export type GradeLevel = '1st' | '2nd' | '3rd';

// One list, so the UI buttons and the generator cannot disagree about what exists.
export const TOPIC_KEYS = [
    'fractions', 'addition', 'subtraction',
    'setTime', 'tellTime', 'hiragana',
    'continents', 'countries'
] as const;

export type TopicKey = typeof TOPIC_KEYS[number];

// A source of numbers in [0, 1). Checks pass a seeded one in place of Math.random,
// because a test that changes its mind every run proves very little.
export type RandomSource = () => number;

// Four topics in reading order: top left, top right, bottom left, bottom right.
export type QuadrantTopics = readonly [TopicKey, TopicKey, TopicKey, TopicKey];

// The six continents where people live. Antarctica is left to the penguins.
export const POPULATED_REGIONS = [
    'Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'
] as const;

export type PopulatedRegion = typeof POPULATED_REGIONS[number];

// Degrees on the globe, longitude first, the way d3 insists on having them.
export type GeographicPoint = readonly [longitude: number, latitude: number];

// One chip per row of the hiragana chart. The last row is wa, wo and the lone n.
export const KANA_ROWS = [
    'vowels', 'k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'wn'
] as const;

export type KanaRow = typeof KANA_ROWS[number];

// Topics that come with a settings panel
export const CONFIGURABLE_TOPICS = [
    'fractions', 'addition', 'subtraction', 'hiragana', 'countries'
] as const;

export type ConfigurableTopic = typeof CONFIGURABLE_TOPICS[number];

// What the generator reads: validated, typed, and never empty
export interface TopicSettings {
    fractions: { level: GradeLevel };
    addition: { level: GradeLevel };
    subtraction: { level: GradeLevel };
    hiragana: { rows: readonly KanaRow[] };
    countries: { regions: readonly PopulatedRegion[] };
}

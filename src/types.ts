export type GradeLevel = '1st' | '2nd' | '3rd';

// One list, so the UI buttons and the generator cannot disagree about what exists.
export const TOPIC_KEYS = [
    'fractions', 'addition', 'subtraction',
    'setTime', 'tellTime', 'hiragana',
    'continents'
] as const;

export type TopicKey = typeof TOPIC_KEYS[number];

// A source of numbers in [0, 1). Checks pass a seeded one in place of Math.random,
// because a test that changes its mind every run proves very little.
export type RandomSource = () => number;

// Four topics in reading order: top left, top right, bottom left, bottom right.
export type QuadrantTopics = readonly [TopicKey, TopicKey, TopicKey, TopicKey];

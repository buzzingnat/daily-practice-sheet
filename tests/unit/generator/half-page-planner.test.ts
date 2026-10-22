import { describe, expect, test } from 'vitest';
import { planHalfPages } from '../../../src/generator/half-page-planner';
import { TOPIC_KEYS, TopicKey } from '../../../src/types';
import { describePlannerRules, planEveryRun } from '../../support/half-page-planner-rules';
import { createSeededRandom } from '../../support/seeded-random';

const SEEDS_PER_SELECTION = 5;

// One selection of each size the rules treat differently (under four, exactly four, over four,
// all of them), plus a gapped one so topics need not sit side by side. The full suite runs them all.
const SAMPLE_SELECTIONS: TopicKey[][] = [
    TOPIC_KEYS.slice(0, 1),
    TOPIC_KEYS.slice(0, 2),
    TOPIC_KEYS.slice(0, 3),
    TOPIC_KEYS.slice(0, 4),
    TOPIC_KEYS.filter((topic, topicIndex) => topicIndex % 3 === 0),
    TOPIC_KEYS.slice(0, 5),
    TOPIC_KEYS.slice(0, 7),
    [...TOPIC_KEYS]
];

describePlannerRules('planHalfPages on a sample of selections', planEveryRun(SAMPLE_SELECTIONS, SEEDS_PER_SELECTION));

describe('planHalfPages', () => {
    test('throws on an empty selection', () => {
        expect(() => planHalfPages([], 2, createSeededRandom(1))).toThrow();
    });
});

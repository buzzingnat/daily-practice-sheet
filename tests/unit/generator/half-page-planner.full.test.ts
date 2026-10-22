import { describe, expect, test } from 'vitest';
import { TOPIC_KEYS, TopicKey } from '../../../src/types';
import {
    countSameQuadrantRepeats,
    describePlannerRules,
    HALF_PAGES_PER_RUN,
    planEveryRun
} from '../../support/half-page-planner-rules';

const SEEDS_PER_SELECTION = 30;

// Every non-empty subset of the topics, so no combination a human can click goes unplanned
function allNonEmptySelections(): TopicKey[][] {
    const selections: TopicKey[][] = [];
    const selectionCount = 2 ** TOPIC_KEYS.length;
    let mask = 1;
    while (mask < selectionCount) {
        selections.push(TOPIC_KEYS.filter((topic, topicIndex) => (mask & (1 << topicIndex)) !== 0));
        mask = mask + 1;
    }
    return selections;
}

const runs = planEveryRun(allNonEmptySelections(), SEEDS_PER_SELECTION);

describePlannerRules('planHalfPages on every selection', runs);

describe('planHalfPages on every selection, seat report', () => {
    test('reports how often a topic keeps its quadrant when five or more topics are selected', () => {
        // Not a rule, a report: the rate is printed so a change in seating shows up in review
        const largeRuns = runs.filter((run) => run.selection.length > 4);
        const repeats = largeRuns.reduce((total, run) => total + countSameQuadrantRepeats(run.plans), 0);
        const transitions = largeRuns.length * (HALF_PAGES_PER_RUN - 1) * 4;
        const repeatRate = transitions === 0 ? 0 : repeats / transitions;
        console.info(`With 5 or more topics, ${(repeatRate * 100).toFixed(2)}% of quadrants kept their previous topic.`);
        expect(repeatRate).toBeLessThan(1);
    });
});

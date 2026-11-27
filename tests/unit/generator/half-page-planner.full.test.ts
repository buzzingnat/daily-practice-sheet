import { describe, expect, test } from 'vitest';
import { TOPIC_KEYS, TopicKey } from '../../../src/types';
import { MAXIMUM_TOPIC_COUNT } from '../../../src/constants';
import {
    countSameQuadrantRepeats,
    describePlannerRules,
    HALF_PAGES_PER_RUN,
    planEveryRun
} from '../../support/half-page-planner-rules';

const SEEDS_PER_SELECTION = 30;

// Two ways round the topic list, so a topic meets its far neighbors as well as its near ones. A stride
// sharing a factor with the topic count would revisit a topic inside one window; the guard below says so.
const NEIGHBOR_STRIDES: readonly number[] = [1, 5];

/**
 * Every size a person can choose, from one topic to the page's maximum, with every topic at every size.
 * For each size, a window of that many topics starts at each topic in turn and wraps round the list,
 * once with neighbors side by side and once spaced apart. The planner's behavior follows the size of
 * the selection, not which topics are in it, so this covers its rules without every combination,
 * which would double with each new topic (8,191 selections for 13). Duplicates only arise at size one.
 */
function representativeSelections(): TopicKey[][] {
    const seen = new Set<string>();
    const selections: TopicKey[][] = [];
    NEIGHBOR_STRIDES.forEach((stride) => {
        for (let size = 1; size <= MAXIMUM_TOPIC_COUNT; size++) {
            TOPIC_KEYS.forEach((unusedTopic, startIndex) => {
                const indexes = Array.from({ length: size }, (unusedSlot, step) => (startIndex + step * stride) % TOPIC_KEYS.length);
                if (new Set(indexes).size !== size) {
                    throw new Error(`A stride of ${stride} revisits a topic among ${TOPIC_KEYS.length}; choose a stride with no common factor.`);
                }
                const selection = TOPIC_KEYS.filter((topic, topicIndex) => indexes.includes(topicIndex));
                const key = selection.join(',');
                if (!seen.has(key)) {
                    seen.add(key);
                    selections.push(selection);
                }
            });
        }
    });
    return selections;
}

const runs = planEveryRun(representativeSelections(), SEEDS_PER_SELECTION);

describePlannerRules('planHalfPages at every size from one topic to six, every topic at each size', runs);

describe('planHalfPages at every size from one topic to six, seat report', () => {
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

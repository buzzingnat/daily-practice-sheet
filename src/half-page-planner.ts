import { QuadrantTopics, RandomSource, TopicKey } from './types';
import { shuffleInPlace } from './shuffled-deck';

const QUADRANTS_PER_HALF_PAGE = 4;

interface TopicHistory {
    useCount: number;
    lastUsedHalfPage: number;
}

/**
 * Lists every order in which the given positions can be visited. Four
 * quadrants make twenty-four orders, few enough to try them all rather
 * than guess.
 */
function buildOrderings(remainingPositions: readonly number[]): number[][] {
    if (remainingPositions.length === 0) {
        return [[]];
    }
    const orderings: number[][] = [];
    remainingPositions.forEach((position, positionIndex) => {
        const otherPositions = remainingPositions.filter(
            (candidatePosition, candidateIndex) => candidateIndex !== positionIndex
        );
        buildOrderings(otherPositions).forEach((tail) => {
            orderings.push([position, ...tail]);
        });
    });
    return orderings;
}

const QUADRANT_ORDERINGS: readonly (readonly number[])[] = buildOrderings([0, 1, 2, 3]);

function toQuadrantTopics(topics: readonly TopicKey[]): QuadrantTopics {
    const [topLeft, topRight, bottomLeft, bottomRight] = topics;
    if (
        topics.length !== QUADRANTS_PER_HALF_PAGE
        || topLeft === undefined
        || topRight === undefined
        || bottomLeft === undefined
        || bottomRight === undefined
    ) {
        throw new Error(`A half-page needs exactly four topics, not ${topics.length}.`);
    }
    return [topLeft, topRight, bottomLeft, bottomRight];
}

function readHistory(history: Map<TopicKey, TopicHistory>, topic: TopicKey): TopicHistory {
    const topicHistory = history.get(topic);
    if (!topicHistory) {
        throw new Error(`No history kept for topic "${topic}".`);
    }
    return topicHistory;
}

/**
 * Chooses four topics for one half-page. Each pick goes to the topic with
 * the fewest appearances so far, then to the one that has waited longest,
 * then to chance. A topic is not picked twice in a half while any selected
 * topic remains unpicked, so repeats happen only when fewer than four topics
 * are selected, and even then they take turns.
 */
function pickTopicsForHalfPage(
    selectedTopics: readonly TopicKey[],
    history: Map<TopicKey, TopicHistory>,
    halfPageIndex: number,
    random: RandomSource
): TopicKey[] {
    const picks: TopicKey[] = [];

    while (picks.length < QUADRANTS_PER_HALF_PAGE) {
        const unpickedTopics = selectedTopics.filter((topic) => !picks.includes(topic));
        const candidates = unpickedTopics.length > 0 ? unpickedTopics : [...selectedTopics];

        // Shuffle first; the sort is stable, so whatever ties remain are settled by chance.
        shuffleInPlace(candidates, random);
        candidates.sort((firstTopic, secondTopic) => {
            const firstHistory = readHistory(history, firstTopic);
            const secondHistory = readHistory(history, secondTopic);
            if (firstHistory.useCount !== secondHistory.useCount) {
                return firstHistory.useCount - secondHistory.useCount;
            }
            return firstHistory.lastUsedHalfPage - secondHistory.lastUsedHalfPage;
        });

        const chosenTopic = candidates[0];
        if (chosenTopic === undefined) {
            throw new Error('No candidate topic was available to pick.');
        }
        const chosenHistory = readHistory(history, chosenTopic);
        chosenHistory.useCount = chosenHistory.useCount + 1;
        chosenHistory.lastUsedHalfPage = halfPageIndex;
        picks.push(chosenTopic);
    }

    return picks;
}

/**
 * Seats the four picks in quadrants. Every ordering is scored by how many
 * topics would sit where they sat on the previous half-page; the lowest
 * score wins, and chance chooses among equals. A topic that keeps the same
 * chair every day stops noticing the room.
 */
function arrangeInQuadrants(
    picks: readonly TopicKey[],
    previousHalfPage: QuadrantTopics | undefined,
    random: RandomSource
): QuadrantTopics {
    let bestArrangements: QuadrantTopics[] = [];
    let bestScore = Number.POSITIVE_INFINITY;

    QUADRANT_ORDERINGS.forEach((ordering) => {
        const arrangement = toQuadrantTopics(ordering.map((pickIndex) => {
            const topic = picks[pickIndex];
            if (topic === undefined) {
                throw new Error(`No pick at position ${pickIndex}.`);
            }
            return topic;
        }));

        let score = 0;
        if (previousHalfPage) {
            arrangement.forEach((topic, quadrantIndex) => {
                if (previousHalfPage[quadrantIndex] === topic) {
                    score = score + 1;
                }
            });
        }

        if (score < bestScore) {
            bestScore = score;
            bestArrangements = [arrangement];
        } else if (score === bestScore) {
            bestArrangements.push(arrangement);
        }
    });

    const chosenArrangement = bestArrangements[Math.floor(random() * bestArrangements.length)];
    if (!chosenArrangement) {
        throw new Error('No quadrant arrangement was found.');
    }
    return chosenArrangement;
}

/**
 * Plans which topic fills each quadrant of each half-page, in reading order.
 * With four or more topics selected, no half-page repeats a topic. With
 * fewer, repeats are spread as evenly as the arithmetic allows. Across the
 * run, no topic gets more than one appearance ahead of any other.
 */
export function planHalfPages(
    selectedTopics: readonly TopicKey[],
    halfPageCount: number,
    random: RandomSource
): QuadrantTopics[] {
    if (selectedTopics.length === 0) {
        throw new Error('Select at least one topic before planning a worksheet.');
    }
    if (new Set(selectedTopics).size !== selectedTopics.length) {
        throw new Error('Each selected topic must be listed once.');
    }
    if (!Number.isInteger(halfPageCount) || halfPageCount < 1) {
        throw new Error(`halfPageCount must be a whole number of at least 1, not ${halfPageCount}.`);
    }

    const history = new Map<TopicKey, TopicHistory>();
    selectedTopics.forEach((topic) => {
        history.set(topic, { useCount: 0, lastUsedHalfPage: -1 });
    });

    const plans: QuadrantTopics[] = [];
    let halfPageIndex = 0;
    while (halfPageIndex < halfPageCount) {
        const picks = pickTopicsForHalfPage(selectedTopics, history, halfPageIndex, random);
        const previousHalfPage = plans[halfPageIndex - 1];
        plans.push(arrangeInQuadrants(picks, previousHalfPage, random));
        halfPageIndex = halfPageIndex + 1;
    }

    return plans;
}

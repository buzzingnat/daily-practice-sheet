/**
 * Checks the half-page planner and the shuffled deck against the rules in
 * progress.md. Run with: npx tsx src/randomization-check.ts
 *
 * Not part of the bundle: the build starts from main.ts and never imports this.
 * It throws on the first broken rule, and prints a summary when all hold.
 *
 * The deck checks use stand-in items of the right count (five for the kana,
 * seven for the continents), because the real lists live in modules that
 * need a browser to load.
 */
import { planHalfPages } from './half-page-planner';
import { createShuffledDeck } from './shuffled-deck';
import { QuadrantTopics, RandomSource, TOPIC_KEYS, TopicKey } from './types';

const SEEDS_PER_SELECTION = 30;
const HALF_PAGES_PER_RUN = 28;
const DECK_SEEDS = 200;
const DECK_CYCLES_PER_SEED = 10;

/**
 * Mulberry32: a small seeded generator. The same seed gives the same
 * sequence, so a failure can be replayed instead of merely regretted.
 */
function createSeededRandom(seed: number): RandomSource {
    let state = seed >>> 0;
    return (): number => {
        state = (state + 0x6D2B79F5) >>> 0;
        let mixed = state;
        mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
        mixed = mixed ^ (mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61));
        return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
}

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`Check failed: ${message}`);
    }
}

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

function countBy<Item>(items: readonly Item[]): Map<Item, number> {
    const counts = new Map<Item, number>();
    items.forEach((item) => {
        counts.set(item, (counts.get(item) || 0) + 1);
    });
    return counts;
}

function checkPlan(selection: TopicKey[], plans: QuadrantTopics[], label: string): number {
    const selectionCount = selection.length;
    const runningCounts = new Map<TopicKey, number>();
    selection.forEach((topic) => runningCounts.set(topic, 0));
    let sameQuadrantRepeats = 0;

    plans.forEach((halfPage, halfPageIndex) => {
        const where = `${label}, half-page ${halfPageIndex} [${halfPage.join(', ')}]`;

        // Rule 1: only selected topics appear.
        halfPage.forEach((topic) => {
            assert(selection.includes(topic), `${where}: "${topic}" was not selected.`);
        });

        // Rule 2: as many distinct topics as four slots and the selection allow.
        const countsInHalf = countBy(halfPage);
        const expectedDistinct = Math.min(4, selectionCount);
        assert(countsInHalf.size === expectedDistinct,
            `${where}: ${countsInHalf.size} distinct topics, expected ${expectedDistinct}.`);

        // Rule 3: with fewer than four topics, repeats within a half are spread evenly.
        const halfCounts = Array.from(countsInHalf.values());
        assert(Math.max(...halfCounts) - Math.min(...halfCounts) <= 1,
            `${where}: uneven repeats within the half (${halfCounts.join(', ')}).`);

        // Rule 4: across the run, no topic gets more than one appearance ahead.
        halfPage.forEach((topic) => {
            runningCounts.set(topic, (runningCounts.get(topic) || 0) + 1);
        });
        const runCounts = Array.from(runningCounts.values());
        assert(Math.max(...runCounts) - Math.min(...runCounts) <= 1,
            `${where}: running counts drifted apart (${runCounts.join(', ')}).`);

        // Rule 5: count topics that keep their quadrant from the previous half.
        const previousHalfPage = plans[halfPageIndex - 1];
        if (previousHalfPage) {
            halfPage.forEach((topic, quadrantIndex) => {
                if (previousHalfPage[quadrantIndex] === topic) {
                    sameQuadrantRepeats = sameQuadrantRepeats + 1;
                }
            });
        }
    });

    // With exactly four topics, a full reshuffle of seats is always possible.
    if (selectionCount === 4) {
        assert(sameQuadrantRepeats === 0,
            `${label}: ${sameQuadrantRepeats} topics kept their quadrant with four topics selected.`);
    }
    return sameQuadrantRepeats;
}

function checkPlanner(): void {
    const selections = allNonEmptySelections();
    let halfPagesChecked = 0;
    let quadrantRepeatsAboveFour = 0;
    let transitionsAboveFour = 0;

    selections.forEach((selection) => {
        let seed = 1;
        while (seed <= SEEDS_PER_SELECTION) {
            const label = `selection [${selection.join(', ')}], seed ${seed}`;
            const plans = planHalfPages(selection, HALF_PAGES_PER_RUN, createSeededRandom(seed));
            assert(plans.length === HALF_PAGES_PER_RUN, `${label}: wrong number of half-pages.`);

            const repeats = checkPlan(selection, plans, label);
            if (selection.length > 4) {
                quadrantRepeatsAboveFour = quadrantRepeatsAboveFour + repeats;
                transitionsAboveFour = transitionsAboveFour + (HALF_PAGES_PER_RUN - 1) * 4;
            }

            // The same seed must give the same plan, or checks cannot be replayed.
            const replay = planHalfPages(selection, HALF_PAGES_PER_RUN, createSeededRandom(seed));
            assert(JSON.stringify(replay) === JSON.stringify(plans), `${label}: replay differed.`);

            halfPagesChecked = halfPagesChecked + plans.length;
            seed = seed + 1;
        }
    });

    let emptySelectionThrew = false;
    try {
        planHalfPages([], 2, createSeededRandom(1));
    } catch {
        emptySelectionThrew = true;
    }
    assert(emptySelectionThrew, 'an empty selection should throw.');

    const repeatRate = transitionsAboveFour === 0 ? 0 : quadrantRepeatsAboveFour / transitionsAboveFour;
    console.log(`Planner: ${selections.length} selections, ${halfPagesChecked} half-pages, all rules held.`);
    console.log(`Planner: with 5 to 7 topics, ${(repeatRate * 100).toFixed(2)}% of quadrants kept their previous topic.`);
}

function checkDeck(itemCount: number, copiesPerCycle: number): void {
    const items = Array.from({ length: itemCount }, (unused, itemIndex) => `item-${itemIndex}`);
    const cycleLength = itemCount * copiesPerCycle;

    let seed = 1;
    while (seed <= DECK_SEEDS) {
        const deck = createShuffledDeck(items, copiesPerCycle, createSeededRandom(seed));
        const draws: string[] = [];
        while (draws.length < cycleLength * DECK_CYCLES_PER_SEED) {
            draws.push(deck.drawNext());
        }
        const label = `deck of ${itemCount} x ${copiesPerCycle}, seed ${seed}`;

        // Every aligned block holds each item exactly copiesPerCycle times.
        let blockStart = 0;
        while (blockStart < draws.length) {
            const blockCounts = countBy(draws.slice(blockStart, blockStart + cycleLength));
            assert(blockCounts.size === itemCount, `${label}: block at ${blockStart} is missing items.`);
            blockCounts.forEach((count, item) => {
                assert(count === copiesPerCycle,
                    `${label}: "${item}" appeared ${count} times in block at ${blockStart}.`);
            });
            blockStart = blockStart + cycleLength;
        }

        // No card follows itself, seams included.
        if (itemCount >= 2) {
            draws.forEach((draw, drawIndex) => {
                assert(drawIndex === 0 || draw !== draws[drawIndex - 1],
                    `${label}: "${draw}" was dealt twice in a row at draw ${drawIndex}.`);
            });
        }
        seed = seed + 1;
    }
    console.log(`Deck: ${itemCount} items x ${copiesPerCycle} copies, ${DECK_SEEDS} seeds, all rules held.`);
}

checkPlanner();
checkDeck(5, 2);  // hiragana: five kana, each twice per ten draws
checkDeck(7, 2);  // continents: seven continents, each twice per fourteen draws
checkDeck(2, 1);  // the tightest seam: two items, one copy each
checkDeck(1, 3);  // a lone item has no choice but to repeat itself
console.log('All randomization checks passed.');

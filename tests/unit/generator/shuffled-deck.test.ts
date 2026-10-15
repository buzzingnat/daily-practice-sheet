import { describe, expect, test } from 'vitest';
import { createShuffledDeck } from '../../../src/generator/shuffled-deck';
import { countBy } from '../../support/count-by';
import { createSeededRandom } from '../../support/seeded-random';

const DECK_SEEDS = 200;
const CYCLES_PER_SEED = 10;

// Stand-in items of the right count, because the real lists live in modules that need a browser to load
const DECK_SIZES = [
    { itemCount: 5, copiesPerCycle: 2, note: 'hiragana vowels, each twice per ten draws' },
    { itemCount: 7, copiesPerCycle: 2, note: 'continents, each twice per fourteen draws' },
    { itemCount: 2, copiesPerCycle: 1, note: 'the tightest seam: two items, one copy each' },
    { itemCount: 1, copiesPerCycle: 3, note: 'a lone item has no choice but to repeat itself' },
    { itemCount: 1, copiesPerCycle: 2, note: 'one region, or one kana' },
    { itemCount: 3, copiesPerCycle: 2, note: 'the y row, or the w and n row' },
    { itemCount: 10, copiesPerCycle: 2, note: 'two kana rows' },
    { itemCount: 23, copiesPerCycle: 2, note: 'half the hiragana chart' },
    { itemCount: 46, copiesPerCycle: 2, note: 'every basic hiragana character' },
    { itemCount: 6, copiesPerCycle: 2, note: 'six regions' }
];

interface DealtRun {
    seed: number;
    draws: string[];
}

function dealEverySeed(itemCount: number, copiesPerCycle: number): DealtRun[] {
    const items = Array.from({ length: itemCount }, (unused, itemIndex) => `item-${itemIndex}`);
    const drawCount = itemCount * copiesPerCycle * CYCLES_PER_SEED;
    const runs: DealtRun[] = [];
    let seed = 1;
    while (seed <= DECK_SEEDS) {
        const deck = createShuffledDeck(items, copiesPerCycle, createSeededRandom(seed));
        const draws: string[] = [];
        while (draws.length < drawCount) {
            draws.push(deck.drawNext());
        }
        runs.push({ seed, draws });
        seed = seed + 1;
    }
    return runs;
}

describe.each(DECK_SIZES)('createShuffledDeck with $itemCount items x $copiesPerCycle copies ($note)', ({ itemCount, copiesPerCycle }) => {
    const runs = dealEverySeed(itemCount, copiesPerCycle);
    const cycleLength = itemCount * copiesPerCycle;

    test('holds every item exactly copiesPerCycle times in each aligned cycle', () => {
        const violations: string[] = [];
        runs.forEach(({ seed, draws }) => {
            let blockStart = 0;
            while (blockStart < draws.length) {
                const blockCounts = countBy(draws.slice(blockStart, blockStart + cycleLength));
                if (blockCounts.size !== itemCount) {
                    violations.push(`seed ${seed}: block at ${blockStart} holds ${blockCounts.size} of ${itemCount} items`);
                }
                blockCounts.forEach((count, item) => {
                    if (count !== copiesPerCycle) {
                        violations.push(`seed ${seed}: "${item}" appeared ${count} times in block at ${blockStart}`);
                    }
                });
                blockStart = blockStart + cycleLength;
            }
        });
        expect(violations).toEqual([]);
    });

    test.skipIf(itemCount < 2)('never deals a card twice in a row, cycle seams included', () => {
        const violations: string[] = [];
        runs.forEach(({ seed, draws }) => {
            draws.forEach((draw, drawIndex) => {
                if (drawIndex > 0 && draw === draws[drawIndex - 1]) {
                    violations.push(`seed ${seed}: "${draw}" dealt twice in a row at draw ${drawIndex}`);
                }
            });
        });
        expect(violations).toEqual([]);
    });
});

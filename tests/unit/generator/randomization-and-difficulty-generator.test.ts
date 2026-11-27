import { expect, test } from 'vitest';
import { createChineseCharacterDeck } from '../../../src/generator/randomization-and-difficulty-generator';
import { listChinesePracticeCards } from '../../../src/exercises/chinese/chinese-words';
import { createSeededRandom } from '../../support/seeded-random';

const DRAWS = 400;

function countNewest(group: 'colors', scope: 'up-to' | 'only'): number {
    const newest = listChinesePracticeCards(group, scope).newest;
    const deck = createChineseCharacterDeck(group, scope, createSeededRandom(7));
    let newestCount = 0;
    for (let draw = 0; draw < DRAWS; draw++) {
        if (newest.includes(deck.drawNext())) {
            newestCount = newestCount + 1;
        }
    }
    return newestCount;
}

// One group alone must never print a character from another; with review, about half the draws are
// new (the human's choice), with bounds loose enough that no seed makes the test flicker
test('deals only the newest group when alone, and about half newest when review is mixed in', () => {
    expect(countNewest('colors', 'only')).toBe(DRAWS);
    const mixedNewest = countNewest('colors', 'up-to');
    expect(mixedNewest).toBeGreaterThan(DRAWS * 0.35);
    expect(mixedNewest).toBeLessThan(DRAWS * 0.65);
});

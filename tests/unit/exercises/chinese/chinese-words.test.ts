import { expect, test } from 'vitest';
import { CHINESE_WORDS, listChinesePracticeCards } from '../../../../src/exercises/chinese/chinese-words';
import { CHINESE_GROUPS } from '../../../../src/types';

// Each group's characters in order, worked out from the raw word list rather than the module's own filing
function charactersBeforeGroup(groupIndex: number): string[] {
    const characters: string[] = [];
    CHINESE_GROUPS.slice(0, groupIndex).forEach((group) => {
        CHINESE_WORDS[group].forEach((word) => {
            Array.from(word.characters).forEach((character) => {
                if (!characters.includes(character)) {
                    characters.push(character);
                }
            });
        });
    });
    return characters;
}

// The rule a sheet's mix rests on: "up to" a group reviews every character met before it, once each,
// and "only" reviews none
test('reviews every earlier character once when the scope reaches back, and none when it does not', () => {
    const wrong = CHINESE_GROUPS.filter((group, groupIndex) => {
        const review = listChinesePracticeCards(group, 'up-to').review.map((card) => card.character);
        return review.join('') !== charactersBeforeGroup(groupIndex).join('')
            || listChinesePracticeCards(group, 'only').review.length > 0;
    });
    expect(wrong).toEqual([]);
});

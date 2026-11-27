import { expect, test } from 'vitest';
import { CHINESE_WORDS, listChinesePracticeCards } from '../../../../src/exercises/chinese/chinese-words';
import { CHINESE_GROUPS, ChineseGroup } from '../../../../src/types';

// The distinct characters of some groups, in order, worked out from the raw word list rather than the module's own filing
function charactersOf(groups: readonly ChineseGroup[]): string[] {
    const characters: string[] = [];
    groups.forEach((group) => {
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

// The rule a sheet's mix rests on: a group practices every character its words use, even ones met
// earlier (good, in hello); "up to" reviews every other earlier character once, and "only" reviews none
test('keeps each group whole and reviews every other earlier character once when the scope reaches back', () => {
    const wrong = CHINESE_GROUPS.filter((group, groupIndex) => {
        const newest = charactersOf([group]);
        const expectedReview = charactersOf(CHINESE_GROUPS.slice(0, groupIndex))
            .filter((character) => !newest.includes(character));
        const upTo = listChinesePracticeCards(group, 'up-to');
        const only = listChinesePracticeCards(group, 'only');
        return upTo.newest.map((card) => card.character).join('') !== newest.join('')
            || upTo.review.map((card) => card.character).join('') !== expectedReview.join('')
            || only.newest.length !== newest.length
            || only.review.length > 0;
    });
    expect(wrong).toEqual([]);
});

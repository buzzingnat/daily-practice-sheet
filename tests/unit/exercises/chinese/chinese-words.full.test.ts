import { expect, test } from 'vitest';
import subsetCharacters from '../../../../public/fonts/lxgw-wenkai-gb/subset-characters.txt?raw';
import { listChineseCharacterCards } from '../../../../src/exercises/chinese/chinese-words';
import { CHINESE_GROUPS } from '../../../../src/types';

// A character the cut-down font lacks would print in some system font instead, with no error to say so
test('every character in the word list is in the cut-down tracing font', () => {
    const missing = CHINESE_GROUPS.flatMap((group) => listChineseCharacterCards(group))
        .map((card) => card.character)
        .filter((character) => !subsetCharacters.includes(character));
    expect(missing).toEqual([]);
});

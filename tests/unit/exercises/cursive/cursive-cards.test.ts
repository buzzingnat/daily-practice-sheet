import { describe, expect, test } from 'vitest';
import { CURSIVE_GROUP_LETTERS, listCursiveCards } from '../../../../src/exercises/cursive/cursive-cards';
import { CURSIVE_GROUPS, CursiveGroup } from '../../../../src/types';

const VOWELS = ['a', 'e', 'i', 'o', 'u'];

function allLetters(): string[] {
    return CURSIVE_GROUPS.flatMap((group: CursiveGroup) => [...CURSIVE_GROUP_LETTERS[group]]);
}

describe('CURSIVE_GROUP_LETTERS', () => {
    test('holds exactly the groups in CURSIVE_GROUPS', () => {
        expect(Object.keys(CURSIVE_GROUP_LETTERS).sort()).toEqual([...CURSIVE_GROUPS].sort());
    });

    test('lists the six sets in the Montessori order', () => {
        expect(CURSIVE_GROUPS.map((group: CursiveGroup) => CURSIVE_GROUP_LETTERS[group].join(''))).toEqual([
            'smat', 'crip', 'bfog', 'hjul', 'dwen', 'kqvxyz'
        ]);
    });

    test('covers the alphabet once: 26 letters, none missing, none repeated', () => {
        const letters = allLetters();
        expect(letters).toHaveLength(26);
        expect([...letters].sort().join('')).toBe('abcdefghijklmnopqrstuvwxyz');
    });

    test.each(CURSIVE_GROUPS)('names its letters in the %s group by its own name', (group: CursiveGroup) => {
        expect(group.split('-').join('')).toBe(CURSIVE_GROUP_LETTERS[group].join(''));
    });

    test('puts exactly one vowel in each of the first five sets, and none in the last', () => {
        const vowelCounts = CURSIVE_GROUPS.map((group: CursiveGroup) => CURSIVE_GROUP_LETTERS[group].filter((letter) => VOWELS.includes(letter)).length);
        expect(vowelCounts).toEqual([1, 1, 1, 1, 1, 0]);
    });

    test('uses only single lowercase letters', () => {
        expect(allLetters().filter((letter) => !/^[a-z]$/.test(letter))).toEqual([]);
    });
});

describe('listCursiveCards', () => {
    test('returns nothing when no group is chosen', () => {
        expect(listCursiveCards([])).toEqual([]);
    });

    test.each(CURSIVE_GROUPS)('returns the %s group on its own', (group: CursiveGroup) => {
        expect(listCursiveCards([group]).map((card) => card.letter)).toEqual(CURSIVE_GROUP_LETTERS[group]);
    });

    test('returns every letter when every group is chosen', () => {
        expect(listCursiveCards(CURSIVE_GROUPS).map((card) => card.letter)).toEqual(allLetters());
    });

    test('keeps the order of introduction whatever order the groups were chosen in', () => {
        const letters = listCursiveCards(['d-w-e-n', 's-m-a-t']).map((card) => card.letter).join('');
        expect(letters).toBe('smatdwen');
    });

    test('lists a group once even when it is chosen twice', () => {
        expect(listCursiveCards(['c-r-i-p', 'c-r-i-p'])).toHaveLength(4);
    });
});

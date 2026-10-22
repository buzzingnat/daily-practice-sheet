import { describe, expect, test } from 'vitest';
import { CURSIVE_GROUP_LETTERS, listCursiveCards } from '../../../../src/exercises/cursive/cursive-cards';
import { CURSIVE_GROUPS, CursiveGroup } from '../../../../src/types';

function allLetters(): string[] {
    return CURSIVE_GROUPS.flatMap((group: CursiveGroup) => [...CURSIVE_GROUP_LETTERS[group]]);
}

describe('CURSIVE_GROUP_LETTERS', () => {
    test('holds exactly the groups in CURSIVE_GROUPS', () => {
        expect(Object.keys(CURSIVE_GROUP_LETTERS).sort()).toEqual([...CURSIVE_GROUPS].sort());
    });

    test('covers the alphabet: all 26 letters, none missing', () => {
        expect([...new Set(allLetters())].sort().join('')).toBe('abcdefghijklmnopqrstuvwxyz');
    });

    test('names the letters of every group by its own name', () => {
        const offenders = CURSIVE_GROUPS.filter((group: CursiveGroup) => group.split('-').join('') !== CURSIVE_GROUP_LETTERS[group].join(''));
        expect(offenders).toEqual([]);
    });

    test('uses only single lowercase letters', () => {
        expect(allLetters().filter((letter) => !/^[a-z]$/.test(letter))).toEqual([]);
    });
});

describe('listCursiveCards', () => {
    test('returns nothing when no group is chosen', () => {
        expect(listCursiveCards([])).toEqual([]);
    });

    test('returns each group on its own', () => {
        const offenders = CURSIVE_GROUPS.filter((group: CursiveGroup) => {
            return JSON.stringify(listCursiveCards([group]).map((card) => card.letter)) !== JSON.stringify(CURSIVE_GROUP_LETTERS[group]);
        });
        expect(offenders).toEqual([]);
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

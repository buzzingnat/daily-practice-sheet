import { describe, expect, test } from 'vitest';
import { KANA_ROW_CARDS, listKanaCards } from '../../../../src/exercises/kana/kana-rows';
import { KANA_ROWS, KanaRow } from '../../../../src/types';

// The basic chart, row by row, written out by hand so a swapped or lost card is noticed
const EXPECTED_CHART_ORDER = 'あいうえお' + 'かきくけこ' + 'さしすせそ' + 'たちつてと' + 'なにぬねの'
    + 'はひふへほ' + 'まみむめも' + 'やゆよ' + 'らりるれろ' + 'わをん';

const EXPECTED_CARDS_PER_ROW: Record<KanaRow, number> = {
    'vowels': 5, 'k': 5, 's': 5, 't': 5, 'n': 5, 'h': 5, 'm': 5, 'y': 3, 'r': 5, 'wn': 3
};

// The hiragana block of Unicode, small letters included
const HIRAGANA_PATTERN = /^[ぁ-ゖ]$/u;

// Every hint opens with the romanization in quotes, then "pronounce" and the advice
const HINT_PATTERN = /^"[a-z]+" pronounce \S.+\.$/;

function allCards() {
    return KANA_ROWS.flatMap((row) => KANA_ROW_CARDS[row]);
}

describe('KANA_ROW_CARDS', () => {
    test('holds exactly the rows the settings panel offers', () => {
        expect(Object.keys(KANA_ROW_CARDS).sort()).toEqual([...KANA_ROWS].sort());
    });

    test('has the expected number of cards in every row', () => {
        const wrong = KANA_ROWS.filter((row) => KANA_ROW_CARDS[row].length !== EXPECTED_CARDS_PER_ROW[row]);
        expect(wrong).toEqual([]);
    });

    test('holds all 46 basic characters', () => {
        expect(allCards()).toHaveLength(46);
    });

    test('lists the characters in chart order', () => {
        expect(allCards().map((card) => card.character).join('')).toBe(EXPECTED_CHART_ORDER);
    });

    test('never repeats a character', () => {
        const characters = allCards().map((card) => card.character);
        expect(new Set(characters).size).toBe(characters.length);
    });

    test('gives every card a single hiragana character', () => {
        const strays = allCards()
            .filter((card) => !HIRAGANA_PATTERN.test(card.character))
            .map((card) => card.character);
        expect(strays).toEqual([]);
    });

    test('gives every card a pronunciation hint', () => {
        const missing = allCards()
            .filter((card) => card.pronunciationHint.trim().length === 0)
            .map((card) => card.character);
        expect(missing).toEqual([]);
    });

    test('opens every hint with its romanization in quotes', () => {
        const malformed = allCards()
            .filter((card) => !HINT_PATTERN.test(card.pronunciationHint))
            .map((card) => `${card.character}: ${card.pronunciationHint}`);
        expect(malformed).toEqual([]);
    });

    test('never repeats a hint, which would mean a card was copied and not edited', () => {
        const hints = allCards().map((card) => card.pronunciationHint);
        expect(new Set(hints).size).toBe(hints.length);
    });
});

describe('listKanaCards', () => {
    test('returns nothing when no rows are chosen', () => {
        expect(listKanaCards([])).toEqual([]);
    });

    test('returns each row on its own', () => {
        const wrong = KANA_ROWS.filter((row) => JSON.stringify(listKanaCards([row])) !== JSON.stringify(KANA_ROW_CARDS[row]));
        expect(wrong).toEqual([]);
    });

    test('returns every card when every row is chosen', () => {
        expect(listKanaCards(KANA_ROWS)).toEqual(allCards());
    });

    test('keeps chart order whatever order the rows were chosen in', () => {
        const cards = listKanaCards(['r', 'vowels', 's']);
        expect(cards.map((card) => card.character).join('')).toBe('あいうえおさしすせそらりるれろ');
    });

    test('lists a row once even when it is chosen twice', () => {
        expect(listKanaCards(['k', 'k'])).toEqual(KANA_ROW_CARDS.k);
    });

    test('hands back a fresh list, so editing it leaves the chart alone', () => {
        const cards = listKanaCards(['vowels']);
        cards.pop();
        expect(KANA_ROW_CARDS.vowels).toHaveLength(EXPECTED_CARDS_PER_ROW.vowels);
    });
});

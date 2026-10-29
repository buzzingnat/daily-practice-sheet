import { describe, expect, test } from 'vitest';
import { CURSIVE_EMOJI, findCursiveEmoji } from '../../../../src/exercises/cursive/cursive-emoji';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

// One emoji is one grapheme, even when it takes several code points to write
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
function graphemeCount(text: string): number {
    return [...segmenter.segment(text)].length;
}

describe('CURSIVE_EMOJI', () => {
    test('has an entry for every letter of the alphabet and nothing else', () => {
        expect(Object.keys(CURSIVE_EMOJI).sort()).toEqual(ALPHABET);
    });

    test('names a word that begins with its letter', () => {
        const offenders = ALPHABET.filter((letter) => !findCursiveEmoji(letter).word.toLowerCase().startsWith(letter));
        expect(offenders).toEqual([]);
    });

    test('gives every letter exactly one picture', () => {
        const offenders = ALPHABET.filter((letter) => graphemeCount(findCursiveEmoji(letter).emoji) !== 1);
        expect(offenders).toEqual([]);
    });

    test('never uses the same picture twice', () => {
        const pictures = ALPHABET.map((letter) => findCursiveEmoji(letter).emoji);
        expect(new Set(pictures).size).toBe(pictures.length);
    });

    test('gives every picture a word to name it', () => {
        expect(ALPHABET.filter((letter) => findCursiveEmoji(letter).word.trim().length === 0)).toEqual([]);
    });
});

describe('findCursiveEmoji', () => {
    test('finds the apple for a', () => {
        expect(findCursiveEmoji('a').word).toBe('apple');
    });

    test('throws for text that is not a lowercase letter', () => {
        const offenders = ['', 'A', '1', 'ab'].filter((text) => {
            try {
                findCursiveEmoji(text);
                return true;
            } catch (error) {
                return !(error instanceof Error) || !/No picture/.test(error.message);
            }
        });
        expect(offenders).toEqual([]);
    });
});
